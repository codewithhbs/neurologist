const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

const INDIA_TZ = "Asia/Kolkata";
const pool = require("../config/db");
const {
  generateAppointmentCode,
  toMinutes,
  toHHMM,
} = require("../utils/helpers");
const { sendMail, appointmentConfirmationHtml } = require("../utils/mailer");
const {
  sendBookingSuccessWhatsapp,
  sendNewBookingAdminWhatsapp,
  sendBookingCancelledWhatsapp,
  sendBookingReminderWhatsapp,
} = require("../utils/sendWhatsappMessage");
const family = require("../utils/family");

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

// Helper: reasonMap -> readable array
function buildDebug(reasonMap) {
  return Array.from(reasonMap.entries()).map(([slot, reason]) => ({
    slot,
    available: reason === null,
    reason: reason || "available",
  }));
}

async function computeAvailableSlots({
  doctor_id,
  clinic_id,
  service_id = null,
  date,
  excludeAppointmentId = null,
  allowPast = false,
  appointmentsTable = "appointments", // "appointments" | "old_appointments"
  debug = false,
}) {
  try {
    if (!doctor_id || !clinic_id || !date) {
      return {
        slots: [],
        duration: 15,
        reason: "Doctor, clinic and date are required",
      };
    }

    // --------------------------------------------------
    // 1. Doctor + Clinic availability
    // --------------------------------------------------

    const [dcRows] = await pool.query(
      `
      SELECT weekly_availability
      FROM doctor_clinics
      WHERE doctor_id = ?
        AND clinic_id = ?
        AND is_active = 1
      LIMIT 1
      `,
      [doctor_id, clinic_id],
    );

    if (dcRows.length === 0) {
      return {
        slots: [],
        duration: 15,
        reason: "Doctor not available at this clinic",
      };
    }

    let weekly = dcRows[0].weekly_availability;

    if (typeof weekly === "string") {
      try {
        weekly = JSON.parse(weekly);
      } catch (err) {
        return {
          slots: [],
          duration: 15,
          reason: "Invalid doctor availability configuration",
        };
      }
    }

    // --------------------------------------------------
    // 2. Day availability
    // --------------------------------------------------

    const dayKey = DAY_KEYS[dayjs(date).day()];
    const windows = weekly?.[dayKey] || [];

    if (!Array.isArray(windows) || windows.length === 0) {
      return {
        slots: [],
        duration: 15,
        reason: "Doctor not available on this day",
      };
    }

    // --------------------------------------------------
    // 3. Clinic holiday
    // --------------------------------------------------

    const [holidayRows] = await pool.query(
      `
      SELECT id
      FROM clinic_holidays
      WHERE clinic_id = ?
        AND holiday_date = ?
      LIMIT 1
      `,
      [clinic_id, date],
    );

    if (holidayRows.length > 0) {
      return {
        slots: [],
        duration: 15,
        reason: "Clinic closed (holiday)",
      };
    }

    // --------------------------------------------------
    // 4. Doctor leave
    // --------------------------------------------------

    const [leaveRows] = await pool.query(
      `
      SELECT id
      FROM doctor_leaves
      WHERE doctor_id = ?
        AND leave_date = ?
        AND (clinic_id IS NULL OR clinic_id = ?)
      LIMIT 1
      `,
      [doctor_id, date, clinic_id],
    );

    if (leaveRows.length > 0) {
      return {
        slots: [],
        duration: 15,
        reason: "Doctor on leave",
      };
    }

    // --------------------------------------------------
    // 5. Determine duration
    // --------------------------------------------------

    let duration = 15;

    // --------------------------------------------------
    // 6. Generate raw slots
    // --------------------------------------------------

    const rawSlots = [];

    for (const window of windows) {
      if (!Array.isArray(window) || window.length < 2) {
        continue;
      }

      const [start, end] = window;

      let currentMinutes = toMinutes(start);
      const endMinutes = toMinutes(end);

      if (
        !Number.isFinite(currentMinutes) ||
        !Number.isFinite(endMinutes) ||
        currentMinutes >= endMinutes
      ) {
        continue;
      }

      while (currentMinutes + duration <= endMinutes) {
        rawSlots.push(toHHMM(currentMinutes));
        currentMinutes += duration;
      }
    }

    const reasonMap = new Map(rawSlots.map((s) => [s, null]));
    let filteredSlots = [...rawSlots];

    // --------------------------------------------------
    // 7. Remove past slots
    // --------------------------------------------------

    if (!allowPast) {
      const indiaNow = dayjs().tz(INDIA_TZ);
      const selectedDate = dayjs(date).tz(INDIA_TZ);

      if (selectedDate.isBefore(indiaNow, "day")) {
        rawSlots.forEach((s) => reasonMap.set(s, "past_date"));
        return {
          slots: [],
          duration,
          reason: "Past date",
          ...(debug && { debugSlots: buildDebug(reasonMap) }),
        };
      }

      if (selectedDate.isSame(indiaNow, "day")) {
        const nowMinutes = indiaNow.hour() * 60 + indiaNow.minute();
        const minimumAllowedTime = nowMinutes + 15;

        filteredSlots = filteredSlots.filter((slot) => {
          const ok = toMinutes(slot) > minimumAllowedTime;
          if (!ok) reasonMap.set(slot, "too_soon(<15min_from_now)");
          return ok;
        });
      }
    }

    // --------------------------------------------------
    // 8. Admin blocked slots
    // --------------------------------------------------

    const [blockRows] = await pool.query(
      `
      SELECT start_time, end_time
      FROM doctor_slot_blocks
      WHERE doctor_id = ?
        AND block_date = ?
        AND (clinic_id IS NULL OR clinic_id = ?)
      `,
      [doctor_id, date, clinic_id],
    );

    if (blockRows.length > 0) {
      const blockRanges = blockRows
        .map((b) => [
          toMinutes(String(b.start_time).slice(0, 5)),
          toMinutes(String(b.end_time).slice(0, 5)),
        ])
        .filter(
          ([start, end]) =>
            Number.isFinite(start) && Number.isFinite(end) && start < end,
        );

      filteredSlots = filteredSlots.filter((slot) => {
        const slotStart = toMinutes(slot);
        const slotEnd = slotStart + duration;

        const blocked = blockRanges.some(
          ([blockStart, blockEnd]) =>
            slotStart < blockEnd && slotEnd > blockStart,
        );

        if (blocked) reasonMap.set(slot, "admin_blocked");
        return !blocked;
      });
    }

    // --------------------------------------------------
    // 9. Get booked appointments — table switched by appointmentsTable
    // --------------------------------------------------

    const safeTable =
      appointmentsTable === "old_appointments"
        ? "old_appointments"
        : "appointments";

    let bookedQuery = `
      SELECT
        id,
        start_time,
        end_time
      FROM \`${safeTable}\`
      WHERE doctor_id = ?
        AND clinic_id = ?
        AND appointment_date = ?
        AND status NOT IN ('cancelled', 'no_show')
    `;

    const bookedParams = [doctor_id, clinic_id, date];

    if (excludeAppointmentId) {
      bookedQuery += ` AND id != ?`;
      bookedParams.push(excludeAppointmentId);
    }

    const [bookedRows] = await pool.query(bookedQuery, bookedParams);

    // --------------------------------------------------
    // 10. Remove overlapping booked slots
    // --------------------------------------------------

    const availableSlots = filteredSlots.filter((slot) => {
      const slotStart = toMinutes(slot);
      const slotEnd = slotStart + duration;

      const clashing = bookedRows.find((appointment) => {
        const bookedStart = toMinutes(
          String(appointment.start_time).slice(0, 5),
        );
        const bookedEnd = toMinutes(String(appointment.end_time).slice(0, 5));

        if (!Number.isFinite(bookedStart) || !Number.isFinite(bookedEnd)) {
          return false;
        }

        return slotStart < bookedEnd && slotEnd > bookedStart;
      });

      if (clashing) {
        reasonMap.set(slot, `booked(appointment_id=${clashing.id})`);
        return false;
      }
      return true;
    });

    // --------------------------------------------------
    // 11. Return
    // --------------------------------------------------

    return {
      slots: availableSlots,
      duration,
      reason: availableSlots.length === 0 ? "No available slots" : null,
      ...(debug && { debugSlots: buildDebug(reasonMap) }),
    };
  } catch (error) {
    console.error("computeAvailableSlots error:", error);

    return {
      slots: [],
      duration: 15,
      reason: "Failed to calculate available slots",
    };
  }
}

// GET /api/appointments/available-slots?doctor_id=&clinic_id=&service_id=&date=
exports.getAvailableSlots = async (req, res) => {
  try {
    const { doctor_id, clinic_id, service_id, date } = req.query;

    if (!doctor_id || !clinic_id || !date) {
      return res.status(400).json({
        success: false,
        message: "doctor_id, clinic_id, date required",
      });
    }

    const result = await computeAvailableSlots({
      doctor_id,
      clinic_id,
      service_id: service_id || null,
      date,
      excludeAppointmentId: null,
      allowPast: false,
      debug: true,
    });

    return res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Failed to compute slots",
    });
  }
};

// GET /api/admin/appointments/available-slots?doctor_id=&clinic_id=&service_id=&date=&exclude_appointment_id=
exports.adminGetAvailableSlots = async (req, res) => {
  try {
    const { doctor_id, clinic_id, service_id, date, exclude_appointment_id } =
      req.query;
    if (!doctor_id || !clinic_id || !date) {
      return res.status(400).json({
        success: false,
        message: "doctor_id, clinic_id, date required",
      });
    }
    const result = await computeAvailableSlots({
      doctor_id,
      clinic_id,
      date,
      excludeAppointmentId: exclude_appointment_id || null,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Failed to compute slots" });
  }
};

exports.bookAppointment = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const {
      clinic_id,
      doctor_id,
      service_id,
      appointment_date,
      start_time,
      coupon_code,
      reason,
      payment_method,
      booked_via = "website",
      member_patient_id, // family member this appointment is for (empty = self)
      new_member, // optional { name, relation, gender, dob } -> created on the fly
    } = req.body;
    const payAtClinic = payment_method === "pay_at_clinic";
    const serviceId = service_id || null;
    if (!clinic_id || !doctor_id || !appointment_date || !start_time) {
      connection.release();
      return res
        .status(400)
        .json({ success: false, message: "Missing required booking fields" });
    }
    let patient_id;
    try {
      patient_id = await family.resolveBookingPatientId({
        holderId: req.patient.id,
        member_patient_id,
        new_member,
      });
    } catch (famErr) {
      connection.release();
      return res
        .status(famErr.status || 400)
        .json({ success: false, message: famErr.message });
    }

    const { slots, duration } = await computeAvailableSlots({
      doctor_id,
      clinic_id,
      date: appointment_date,
    });
    console.log("Available slots:", slots, "Requested slot:", start_time);
    if (!slots.includes(start_time)) {
      connection.release();
      return res.status(409).json({
        success: false,
        message:
          "Selected slot is no longer available. Please choose another slot.",
      });
    }
    const end_time = toHHMM(toMinutes(start_time) + duration);

    const [feeRows] = await connection.query(
      "SELECT consultation_fee FROM doctors WHERE id = ?",
      [doctor_id],
    );
    const fee = feeRows.length
      ? parseFloat(feeRows[0].consultation_fee) || 0
      : 0;

    let discount = 0;
    let coupon = null;
    if (coupon_code) {
      const [couponRows] = await connection.query(
        `SELECT * FROM coupons WHERE code = ? AND is_active = 1
         AND (valid_from IS NULL OR valid_from <= CURDATE())
         AND (valid_till IS NULL OR valid_till >= CURDATE())`,
        [coupon_code],
      );
      if (couponRows.length === 0) {
        connection.release();
        return res
          .status(400)
          .json({ success: false, message: "Invalid or expired coupon" });
      }
      coupon = couponRows[0];

      if (
        coupon.usage_limit !== null &&
        coupon.used_count >= coupon.usage_limit
      ) {
        connection.release();
        return res
          .status(400)
          .json({ success: false, message: "Coupon usage limit reached" });
      }
      const [usageRows] = await connection.query(
        "SELECT COUNT(*) AS cnt FROM coupon_usages WHERE coupon_id = ? AND patient_id = ?",
        [coupon.id, patient_id],
      );
      if (usageRows[0].cnt >= coupon.per_patient_limit) {
        connection.release();
        return res
          .status(400)
          .json({ success: false, message: "Coupon already used by you" });
      }
      if (fee < parseFloat(coupon.min_amount)) {
        connection.release();
        return res.status(400).json({
          success: false,
          message: `Minimum amount for this coupon is ₹${coupon.min_amount}`,
        });
      }
      const applicableIds = coupon.applicable_service_ids
        ? typeof coupon.applicable_service_ids === "string"
          ? JSON.parse(coupon.applicable_service_ids)
          : coupon.applicable_service_ids
        : null;
      if (
        applicableIds &&
        applicableIds.length &&
        (!serviceId || !applicableIds.includes(parseInt(serviceId, 10)))
      ) {
        connection.release();
        return res.status(400).json({
          success: false,
          message: "Coupon not applicable to this service",
        });
      }

      discount =
        coupon.discount_type === "flat"
          ? parseFloat(coupon.discount_value)
          : (fee * parseFloat(coupon.discount_value)) / 100;
      if (coupon.max_discount)
        discount = Math.min(discount, parseFloat(coupon.max_discount));
      discount = Math.min(discount, fee);
    }

    const finalAmount = Math.max(0, fee - discount);
    const isFree = finalAmount === 0;
    const appointment_code = generateAppointmentCode();

    await connection.beginTransaction();

    let insertResult;
    try {
      [insertResult] = await connection.query(
        `INSERT INTO appointments
         (appointment_code, patient_id, clinic_id, doctor_id, service_id, appointment_date, start_time, end_time,
          fee_amount, discount_amount, coupon_id, final_amount, is_free, payment_status, status, reason, booked_via,payment_method)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          appointment_code,
          patient_id,
          clinic_id,
          doctor_id,
          serviceId,
          appointment_date,
          start_time,
          end_time,
          fee,
          discount,
          coupon ? coupon.id : null,
          finalAmount,
          isFree ? 1 : 0,
          isFree ? "not_required" : "pending",
          isFree ? "confirmed" : "pending",
          reason || null,
          booked_via,
          payment_method,
        ],
      );
    } catch (dupErr) {
      await connection.rollback();
      connection.release();
      if (dupErr.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          success: false,
          message:
            "This slot was just booked by someone else. Please pick another slot.",
        });
      }
      throw dupErr;
    }

    const appointmentId = insertResult.insertId;

    if (coupon) {
      await connection.query(
        "INSERT INTO coupon_usages (coupon_id, patient_id, appointment_id) VALUES (?,?,?)",
        [coupon.id, patient_id, appointmentId],
      );
      await connection.query(
        "UPDATE coupons SET used_count = used_count + 1 WHERE id = ?",
        [coupon.id],
      );
    }

    await connection.commit();
    connection.release();

    const [fullRows] = await pool.query(
      `SELECT 
    a.*,
    p.name AS patient_name,
    p.email AS patient_email,
    p.mobile AS patient_mobile,
    d.name AS doctor_name,
    s.name AS service_name,
    c.name AS clinic_name
   FROM appointments a
   JOIN patients p ON p.id = a.patient_id
   JOIN doctors d ON d.id = a.doctor_id
   LEFT JOIN services s ON s.id = a.service_id
   JOIN clinics c ON c.id = a.clinic_id
   WHERE a.id = ?`,
      [appointmentId],
    );
    const appt = fullRows[0];
    try {
      await sendBookingSuccessWhatsapp({
        mobile: appt.patient_mobile,
        customerName: appt.patient_name,
        bookingId: appt.appointment_code,
        doctorName: appt.doctor_name,
        date: dayjs(appt.appointment_date).format("DD MMM YYYY"),
        time: dayjs(`2000-01-01 ${appt.start_time}`).format("hh:mm A"),
      });

      await sendNewBookingAdminWhatsapp({
        customerName: appt.patient_name,
        customerMobile: appt.patient_mobile,
        bookingId: appt.appointment_code,
        doctorName: appt.doctor_name,
        date: dayjs(appt.appointment_date).format("DD MMM YYYY"),
        time: dayjs(`2000-01-01 ${appt.start_time}`).format("hh:mm A"),
      });
    } catch (waErr) {
      console.error("WhatsApp notify failed:", waErr.message);
    }
    if (isFree && appt.patient_email) {
      sendMail({
        to: appt.patient_email,
        subject: `Appointment Confirmed - ${appt.appointment_code}`,
        html: appointmentConfirmationHtml(appt),
      });
    }

    res.status(201).json({
      success: true,
      appointment: appt,
      requiresPayment: !isFree && !payAtClinic,
      payAtClinic: !isFree && payAtClinic,
    });
  } catch (err) {
    try {
      await connection.rollback();
    } catch (e) {}
    connection.release();
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Failed to book appointment" });
  }
};

// GET /api/appointments/my (patient auth)
exports.getMyAppointments = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT a.*, d.name AS doctor_name, d.photo_url AS doctor_photo, s.name AS service_name, c.name AS clinic_name, c.address AS clinic_address,
            p.name AS patient_name, p.relation AS patient_relation, p.parent_patient_id AS patient_parent_id
     FROM appointments a
     JOIN patients p ON p.id = a.patient_id
     JOIN doctors d ON d.id = a.doctor_id
     LEFT JOIN services s ON s.id = a.service_id
     JOIN clinics c ON c.id = a.clinic_id
     WHERE (p.id = ? OR p.parent_patient_id = ?)
     ORDER BY a.appointment_date DESC, a.start_time DESC`,
    [req.patient.id, req.patient.id],
  );
  res.json({ success: true, appointments: rows });
};

// POST /api/appointments/:id/cancel (patient auth)
exports.cancelMyAppointment = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT a.*, p.name AS patient_name, p.mobile AS patient_mobile, d.name AS doctor_name
     FROM appointments a
     JOIN patients p ON p.id = a.patient_id
     JOIN doctors d ON d.id = a.doctor_id
     WHERE a.id = ? AND (p.id = ? OR p.parent_patient_id = ?)`,
    [req.params.id, req.patient.id, req.patient.id],
  );
  if (rows.length === 0)
    return res
      .status(404)
      .json({ success: false, message: "Appointment not found" });
  if (["completed", "cancelled"].includes(rows[0].status)) {
    return res.status(400).json({
      success: false,
      message: `Cannot cancel a ${rows[0].status} appointment`,
    });
  }
  await pool.query(
    'UPDATE appointments SET status = "cancelled", cancelled_reason = ? WHERE id = ?',
    [req.body.reason || "Cancelled by patient", req.params.id],
  );

  const appt = rows[0];
  try {
    await sendBookingCancelledWhatsapp({
      mobile: appt.patient_mobile,
      customerName: appt.patient_name,
      bookingId: appt.appointment_code,
      doctorName: appt.doctor_name,
      date: dayjs(appt.appointment_date).format("DD MMM YYYY"),
      time: dayjs(`2000-01-01 ${appt.start_time}`).format("hh:mm A"),
    });
  } catch (waErr) {
    console.error("WhatsApp notify failed:", waErr.message);
  }

  res.json({ success: true, message: "Appointment cancelled" });
};

// ---------- ADMIN / RECEPTIONIST ----------

// GET /api/admin/appointments?date=&status=&doctor_id=&clinic_id=&from=&to=&search=&payment_status=&booked_via=&page=&limit=&patient_type=new|old|all
exports.adminGetAppointments = async (req, res) => {
  try {
    const {
      date,
      status,
      doctor_id,
      clinic_id,
      from,
      to,
      search,
      payment_status,
      booked_via,
      page = 1,
      limit = 20,
    } = req.query;

    const patientType = String(req.query.patient_type || "all").trim().toLowerCase(); // "new" | "old" | "all"

    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const perPage = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const offset = (currentPage - 1) * perPage;

    const buildWhereParams = () => {
      let where = "1=1";
      const params = [];

      if (date) {
        where += " AND a.appointment_date = ?";
        params.push(date);
      }
      if (from) {
        where += " AND a.appointment_date >= ?";
        params.push(from);
      }
      if (to) {
        where += " AND a.appointment_date <= ?";
        params.push(to);
      }
      if (status) {
        where += " AND a.status = ?";
        params.push(status);
      }
      if (payment_status) {
        where += " AND a.payment_status = ?";
        params.push(payment_status);
      }
      if (doctor_id) {
        where += " AND a.doctor_id = ?";
        params.push(doctor_id);
      }
      if (clinic_id) {
        where += " AND a.clinic_id = ?";
        params.push(clinic_id);
      }
      if (booked_via) {
        where += " AND a.booked_via = ?";
        params.push(booked_via);
      }

      if (search && search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        const patientIdDigits = search.trim().match(/\d+/);
        const patientIdNum = patientIdDigits ? parseInt(patientIdDigits[0], 10) : null;

        where += `
          AND (
            p.name LIKE ?
            OR p.mobile LIKE ?
            OR a.appointment_code LIKE ?
            OR d.name LIKE ?
            OR c.name LIKE ?
            OR s.name LIKE ?
            OR p.patient_id LIKE ?
            OR CONCAT('PT-', p.id) LIKE ?
            OR p.id = ?
          )
        `;

        params.push(
          searchTerm,
          searchTerm,
          searchTerm,
          searchTerm,
          searchTerm,
          searchTerm,
          searchTerm,
          searchTerm,
          patientIdNum,
        );
      }

      if (req.admin?.role === "receptionist" && req.admin?.clinic_id) {
        where += " AND a.clinic_id = ?";
        params.push(req.admin.clinic_id);
      }

      return { where, params };
    };

    // single-table fetch — apptTable/patientTable pair, tags rows with patient_type
    const fetchAppointments = async (apptTable, patientTable, type, applyPagination) => {
      const { where, params } = buildWhereParams();

      const baseQuery = `
        FROM \`${apptTable}\` a
        JOIN \`${patientTable}\` p ON p.id = a.patient_id
        JOIN doctors d ON d.id = a.doctor_id
        LEFT JOIN services s ON s.id = a.service_id
        JOIN clinics c ON c.id = a.clinic_id
        WHERE ${where}
      `;

      const [countRows] = await pool.query(`SELECT COUNT(*) AS total ${baseQuery}`, params);
      const total = Number(countRows[0]?.total || 0);

      const dataQuery = `
        SELECT a.*, p.name AS patient_name, p.mobile AS patient_mobile,
               p.relation AS patient_relation, p.parent_patient_id AS patient_parent_id,
               d.name AS doctor_name, s.name AS service_name, c.name AS clinic_name
        ${baseQuery}
        ORDER BY a.appointment_date DESC, a.start_time DESC, a.id DESC
        ${applyPagination ? "LIMIT ? OFFSET ?" : ""}
      `;
      const dataParams = applyPagination ? [...params, perPage, offset] : params;
      const [rows] = await pool.query(dataQuery, dataParams);

      return { rows: rows.map((r) => ({ ...r, patient_type: type })), total };
    };

    if (patientType === "new" || patientType === "old") {
      const apptTable = patientType === "old" ? "old_appointments" : "appointments";
      const patientTable = patientType === "old" ? "new_patinet" : "patients";

      const { rows, total } = await fetchAppointments(apptTable, patientTable, patientType, true);
      const totalPages = Math.ceil(total / perPage);

      return res.json({
        success: true,
        appointments: rows,
        pagination: {
          page: currentPage,
          limit: perPage,
          total,
          totalPages,
          hasNextPage: currentPage < totalPages,
          hasPreviousPage: currentPage > 1,
        },
      });
    }

    // "all" — merge both tables (unpaginated fetch each), sort, slice.
    // Fine for clinic-scale data; move to a UNION ALL query if either table gets large.
    const [newResult, oldResult] = await Promise.all([
      fetchAppointments("appointments", "patients", "new", false),
      fetchAppointments("old_appointments", "new_patinet", "old", false),
    ]);

    const merged = [...newResult.rows, ...oldResult.rows].sort((a, b) => {
      if (a.appointment_date !== b.appointment_date) {
        return a.appointment_date < b.appointment_date ? 1 : -1;
      }
      if (a.start_time !== b.start_time) {
        return a.start_time < b.start_time ? 1 : -1;
      }
      return b.id - a.id;
    });

    const total = newResult.total + oldResult.total;
    const totalPages = Math.ceil(total / perPage);
    const pageRows = merged.slice(offset, offset + perPage);

    return res.json({
      success: true,
      appointments: pageRows,
      pagination: {
        page: currentPage,
        limit: perPage,
        total,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
    });
  } catch (error) {
    console.error("adminGetAppointments error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch appointments",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
// GET /api/admin/appointments/grouped?date=&status=&doctor_id=&clinic_id=&from=&to=&search=&payment_status=&booked_via=&page=&limit=&patient_type=new|old|all
exports.adminGetAppointmentsGrouped = async (req, res) => {
  try {
    const {
      date,
      status,
      doctor_id,
      clinic_id,
      from,
      to,
      search,
      payment_status,
      booked_via,
      page = 1,
      limit = 20,
    } = req.query;

    const patientType = String(req.query.patient_type || "all").trim().toLowerCase(); // "new" | "old" | "all"

    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const perPage = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const offset = (currentPage - 1) * perPage;

    const buildWhereParams = () => {
      let where = "1=1";
      const params = [];

      if (date) {
        where += " AND a.appointment_date = ?";
        params.push(date);
      }
      if (from) {
        where += " AND a.appointment_date >= ?";
        params.push(from);
      }
      if (to) {
        where += " AND a.appointment_date <= ?";
        params.push(to);
      }
      if (status) {
        where += " AND a.status = ?";
        params.push(status);
      }
      if (payment_status) {
        where += " AND a.payment_status = ?";
        params.push(payment_status);
      }
      if (doctor_id) {
        where += " AND a.doctor_id = ?";
        params.push(doctor_id);
      }
      if (clinic_id) {
        where += " AND a.clinic_id = ?";
        params.push(clinic_id);
      }
      if (booked_via) {
        where += " AND a.booked_via = ?";
        params.push(booked_via);
      }
      if (search && search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        const patientIdDigits = search.trim().match(/\d+/);
        const patientIdNum = patientIdDigits ? parseInt(patientIdDigits[0], 10) : null;
        where += `
          AND (
            p.name LIKE ?
            OR p.mobile LIKE ?
            OR a.appointment_code LIKE ?
            OR d.name LIKE ?
            OR c.name LIKE ?
            OR s.name LIKE ?
            OR p.patient_id LIKE ?
            OR CONCAT('PT-', p.id) LIKE ?
            OR p.id = ?
          )
        `;
        params.push(
          searchTerm,
          searchTerm,
          searchTerm,
          searchTerm,
          searchTerm,
          searchTerm,
          searchTerm,
          searchTerm,
          patientIdNum,
        );
      }
      if (req.admin?.role === "receptionist" && req.admin?.clinic_id) {
        where += " AND a.clinic_id = ?";
        params.push(req.admin.clinic_id);
      }

      return { where, params };
    };

    // single-table grouped fetch — apptTable/patientTable pair, tags rows with patient_type
    const fetchGrouped = async (apptTable, patientTable, type, applyPagination) => {
      const { where, params } = buildWhereParams();

      const baseJoins = `
        FROM \`${apptTable}\` a
        JOIN \`${patientTable}\` p ON p.id = a.patient_id
        JOIN doctors d ON d.id = a.doctor_id
        LEFT JOIN services s ON s.id = a.service_id
        JOIN clinics c ON c.id = a.clinic_id
        WHERE ${where}
      `;

      const [countRows] = await pool.query(
        `SELECT COUNT(DISTINCT a.patient_id) AS total ${baseJoins}`,
        params,
      );
      const total = Number(countRows[0]?.total || 0);

      const dataQuery = `
        SELECT
          p.id AS unique_id,
          p.name AS patient_name,
          p.patient_id AS patient_id,
          p.mobile AS patient_mobile,
          MAX(p.relation) AS patient_relation,
          MAX(p.parent_patient_id) AS patient_parent_id,
          COUNT(a.id) AS appointment_count,
          MAX(a.appointment_date) AS last_appointment_date,
          SUM(CASE WHEN a.status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
          SUM(CASE WHEN a.status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed_count,
          SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
          SUM(CASE WHEN a.final_amount IS NOT NULL THEN a.final_amount ELSE 0 END) AS total_amount
        ${baseJoins}
        GROUP BY p.id, p.name, p.mobile
        ORDER BY last_appointment_date DESC
        ${applyPagination ? "LIMIT ? OFFSET ?" : ""}
      `;
      const dataParams = applyPagination ? [...params, perPage, offset] : params;
      const [rows] = await pool.query(dataQuery, dataParams);

      return { rows: rows.map((r) => ({ ...r, patient_type: type })), total };
    };

    if (patientType === "new" || patientType === "old") {
      const apptTable = patientType === "old" ? "old_appointments" : "appointments";
      const patientTable = patientType === "old" ? "new_patinet" : "patients";

      const { rows, total } = await fetchGrouped(apptTable, patientTable, patientType, true);
      const totalPages = Math.ceil(total / perPage);

      return res.json({
        success: true,
        patients: rows,
        pagination: {
          page: currentPage,
          limit: perPage,
          total,
          totalPages,
          hasNextPage: currentPage < totalPages,
          hasPreviousPage: currentPage > 1,
        },
      });
    }

    // "all" — grouped result from each table separately (patient identity is
    // table-scoped, no cross-table merge of the same patient), tag, sort, slice.
    const [newResult, oldResult] = await Promise.all([
      fetchGrouped("appointments", "patients", "new", false),
      fetchGrouped("old_appointments", "new_patinet", "old", false),
    ]);

    const merged = [...newResult.rows, ...oldResult.rows].sort((a, b) => {
      if (a.last_appointment_date === b.last_appointment_date) return 0;
      return a.last_appointment_date < b.last_appointment_date ? 1 : -1;
    });

    const total = newResult.total + oldResult.total;
    const totalPages = Math.ceil(total / perPage);
    const pageRows = merged.slice(offset, offset + perPage);

    return res.json({
      success: true,
      patients: pageRows,
      pagination: {
        page: currentPage,
        limit: perPage,
        total,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
    });
  } catch (error) {
    console.error("adminGetAppointmentsGrouped error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch grouped appointments",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// GET /api/admin/appointments/:id?patient_type=new|old (optional — no param falls back new -> old)
exports.adminGetAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const hasType = req.query.patient_type === "old" || req.query.patient_type === "new";
    const requestedOld = req.query.patient_type === "old";

    const fetchFrom = async (apptTable, patientTable) => {
      const [rows] = await pool.query(
        `SELECT a.*, p.name AS patient_name, p.mobile AS patient_mobile, p.email AS patient_email, p.gender AS patient_gender, p.dob AS patient_dob,
           p.relation AS patient_relation, p.parent_patient_id AS patient_parent_id,
           d.name AS doctor_name, d.photo_url AS doctor_photo, s.name AS service_name, c.name AS clinic_name, c.address AS clinic_address,
           r.name AS booked_by_receptionist_name
         FROM \`${apptTable}\` a
         JOIN \`${patientTable}\` p ON p.id = a.patient_id
         JOIN doctors d ON d.id = a.doctor_id
         LEFT JOIN services s ON s.id = a.service_id
         JOIN clinics c ON c.id = a.clinic_id
         LEFT JOIN receptionists r ON r.id = a.created_by_receptionist_id
         WHERE a.id = ?`,
        [id],
      );
      return rows[0] || null;
    };

    let appt = null;
    let isOld = false;

    if (hasType) {
      // explicit param — look only in the requested table
      isOld = requestedOld;
      appt = await fetchFrom(isOld ? "old_appointments" : "appointments", isOld ? "new_patinet" : "patients");
    } else {
      // no param — same default as before (appointments/patients first),
      // fallback to old_appointments/new_patinet so old ids still resolve
      appt = await fetchFrom("appointments", "patients");
      if (!appt) {
        appt = await fetchFrom("old_appointments", "new_patinet");
        isOld = !!appt;
      }
    }

    if (!appt) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    appt = { ...appt, patient_type: isOld ? "old" : "new" };

    if (
      req.admin?.role === "receptionist" &&
      req.admin.clinic_id &&
      appt.clinic_id !== req.admin.clinic_id
    ) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const [payments] = await pool.query(
      "SELECT * FROM payments WHERE appointment_id = ? ORDER BY id DESC",
      [id],
    );
    const [prescriptions] = await pool.query(
      "SELECT * FROM prescriptions WHERE appointment_id = ? ORDER BY id DESC",
      [id],
    );
    const [history] = await pool.query(
      "SELECT * FROM medical_history WHERE appointment_id = ? ORDER BY id DESC",
      [id],
    );

    res.json({
      success: true,
      appointment: withVisit(appt),
      payments,
      prescriptions,
      history,
    });
  } catch (error) {
    console.error("adminGetAppointmentById error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch appointment",
    });
  }
};

exports.sendManualReminder = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT a.*, p.name AS patient_name, p.mobile AS patient_mobile, d.name AS doctor_name
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       JOIN doctors d ON d.id = a.doctor_id
       WHERE a.id = ?`,
      [id],
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    const appt = rows[0];

    if (["completed", "cancelled"].includes(appt.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot send reminder for a ${appt.status} appointment`,
      });
    }

    await sendBookingReminderWhatsapp({
      mobile: appt.patient_mobile,
      customerName: appt.patient_name,
      bookingId: appt.appointment_code,
      doctorName: appt.doctor_name,
      date: dayjs(appt.appointment_date).format("DD MMM YYYY"),
      time: dayjs(`2000-01-01 ${appt.start_time}`).format("hh:mm A"),
    });

    res.json({ success: true, message: "Reminder sent" });
  } catch (err) {
    console.error("sendManualReminder error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to send reminder" });
  }
};

exports.adminUpdateStatus = async (req, res) => {
  const { status, cancelled_reason } = req.body;
  const allowed = ["pending", "confirmed", "completed", "cancelled", "no_show"];
  if (!allowed.includes(status))
    return res.status(400).json({ success: false, message: "Invalid status" });
  await pool.query(
    "UPDATE appointments SET status = ?, cancelled_reason = ? WHERE id = ?",
    [status, cancelled_reason || null, req.params.id],
  );
  res.json({ success: true, message: "Status updated" });
};

const APPOINTMENT_EDITABLE_FIELDS = [
  "clinic_id",
  "doctor_id",
  "service_id",
  "appointment_date",
  "start_time",
  "reason",
  "notes",
];
const SCHEDULE_FIELDS = [
  "clinic_id",
  "doctor_id",
  "service_id",
  "appointment_date",
  "start_time",
];

exports.adminUpdateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const [existingRows] = await pool.query(
      "SELECT * FROM appointments WHERE id = ?",
      [id],
    );
    if (existingRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }
    const existing = existingRows[0];

    if (
      req.admin?.role === "receptionist" &&
      req.admin?.clinic_id &&
      existing.clinic_id !== req.admin.clinic_id
    ) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (["completed", "cancelled"].includes(existing.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot edit a ${existing.status} appointment`,
      });
    }

    const body = req.body || {};
    const updates = {};
    for (const key of APPOINTMENT_EDITABLE_FIELDS) {
      if (body[key] !== undefined)
        updates[key] = body[key] === "" ? null : body[key];
    }
    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No valid fields to update" });
    }

    const merged = { ...existing, ...updates };
    const scheduleChanged = SCHEDULE_FIELDS.some(
      (k) => updates[k] !== undefined,
    );

    if (scheduleChanged) {
      const {
        slots,
        duration,
        reason: slotReason,
      } = await computeAvailableSlots({
        doctor_id: merged.doctor_id,
        clinic_id: merged.clinic_id,
        date: merged.appointment_date,
        excludeAppointmentId: id,
      });
      if (!slots.includes(String(merged.start_time).slice(0, 5))) {
        return res.status(409).json({
          success: false,
          message: slotReason || "Selected slot is not available",
        });
      }
      updates.end_time = toHHMM(
        toMinutes(String(merged.start_time).slice(0, 5)) + duration,
      );
    }

    const keys = Object.keys(updates);
    const setClause = keys.map((k) => `\`${k}\` = ?`).join(", ");
    const values = keys.map((k) => updates[k]);
    await pool.query(`UPDATE appointments SET ${setClause} WHERE id = ?`, [
      ...values,
      id,
    ]);

    const [rows] = await pool.query(
      `SELECT a.*, p.name AS patient_name, p.mobile AS patient_mobile,
         d.name AS doctor_name, s.name AS service_name, c.name AS clinic_name
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       JOIN doctors d ON d.id = a.doctor_id
       LEFT JOIN services s ON s.id = a.service_id
       JOIN clinics c ON c.id = a.clinic_id
       WHERE a.id = ?`,
      [id],
    );

    res.json({
      success: true,
      message: "Appointment updated",
      appointment: rows[0],
    });
  } catch (err) {
    console.error("adminUpdateAppointment error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to update appointment" });
  }
};

exports.adminCreateAppointment = async (req, res) => {
  try {
    const {
      patient_name,
      patient_mobile,
      patient_email,
      patient_gender,

      patient_father_husband_name,
      patient_dob,
      patient_nationality,
      patient_marital_status,

      patient_address,
      patient_permanent_address,
      patient_permanent_pincode,
      patient_local_address,
      patient_local_pincode,

      patient_referred_by,
      patient_referrer_name,
      patient_referrer_address,

      clinic_id: bodyClinicId,
      doctor_id,
      service_id,
      appointment_date,
      start_time,
      is_free,
      reason,
      payment_method,
      member_patient_id, // family member of this mobile (empty = account holder)
      new_member, // optional { name, relation, gender, dob } -> new family member
    } = req.body;

    const clinic_id =
      bodyClinicId ||
      (req.admin?.role === "receptionist"
        ? req.admin.clinic_id
        : null);

    if (
      !clinic_id ||
      !doctor_id ||
      !appointment_date ||
      !start_time ||
      !patient_mobile
    ) {
      return res.status(400).json({
        success: false,
        message:
          "clinic_id, doctor_id, date, time and patient mobile are required",
      });
    }

    if (!/^[6-9]\d{9}$/.test(patient_mobile)) {
      return res.status(400).json({
        success: false,
        message: "Valid 10-digit patient mobile number required",
      });
    }

    let [patientRows] = await pool.query(
      "SELECT * FROM patients WHERE mobile = ? AND parent_patient_id IS NULL ORDER BY id ASC LIMIT 1",
      [patient_mobile],
    );

    let patientId;

    /*
    |--------------------------------------------------------------------------
    | CREATE NEW PATIENT
    |--------------------------------------------------------------------------
    */
    if (patientRows.length === 0) {
      const [pResult] = await pool.query(
        `
        INSERT INTO patients (
          name,
          father_husband_name,
          mobile,
          email,
          gender,
          dob,
          nationality,
          marital_status,
          address,
          permanent_address,
          permanent_pincode,
          local_address,
          local_pincode,
          referred_by,
          referrer_name,
          referrer_address
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          patient_name?.trim() || null,
          patient_father_husband_name?.trim() || null,
          patient_mobile,
          patient_email?.trim() || null,
          patient_gender || null,
          patient_dob || null,
          patient_nationality?.trim() || null,
          patient_marital_status || null,

          patient_address?.trim() || null,

          patient_permanent_address?.trim() || null,
          patient_permanent_pincode?.trim() || null,

          patient_local_address?.trim() || null,
          patient_local_pincode?.trim() || null,

          patient_referred_by || null,
          patient_referrer_name?.trim() || null,
          patient_referrer_address?.trim() || null,
        ],
      );

      patientId = pResult.insertId;

      // Generate patient_id from DB ID if empty
      await pool.query(
        `
        UPDATE patients
        SET patient_id = ?
        WHERE id = ?
          AND (patient_id IS NULL OR patient_id = '')
        `,
        [String(patientId), patientId],
      );

      // Reload patient
      const [newPatientRows] = await pool.query(
        "SELECT * FROM patients WHERE id = ?",
        [patientId],
      );

      patientRows = newPatientRows;
    } else {
      /*
      |--------------------------------------------------------------------------
      | EXISTING PATIENT
      | Only fill fields which are currently empty
      |--------------------------------------------------------------------------
      */

      const patient = patientRows[0];

      patientId = patient.id;

      const updates = {};

      if (
        patient_name?.trim() &&
        !patient.name
      ) {
        updates.name = patient_name.trim();
      }

      if (
        patient_father_husband_name?.trim() &&
        !patient.father_husband_name
      ) {
        updates.father_husband_name =
          patient_father_husband_name.trim();
      }

      if (
        patient_email?.trim() &&
        !patient.email
      ) {
        updates.email = patient_email.trim();
      }

      if (
        patient_gender &&
        !patient.gender
      ) {
        updates.gender = patient_gender;
      }

      if (
        patient_dob &&
        !patient.dob
      ) {
        updates.dob = patient_dob;
      }

      if (
        patient_nationality?.trim() &&
        !patient.nationality
      ) {
        updates.nationality =
          patient_nationality.trim();
      }

      if (
        patient_marital_status &&
        !patient.marital_status
      ) {
        updates.marital_status =
          patient_marital_status;
      }

      if (
        patient_address?.trim() &&
        !patient.address
      ) {
        updates.address =
          patient_address.trim();
      }

      if (
        patient_permanent_address?.trim() &&
        !patient.permanent_address
      ) {
        updates.permanent_address =
          patient_permanent_address.trim();
      }

      if (
        patient_permanent_pincode?.trim() &&
        !patient.permanent_pincode
      ) {
        updates.permanent_pincode =
          patient_permanent_pincode.trim();
      }

      if (
        patient_local_address?.trim() &&
        !patient.local_address
      ) {
        updates.local_address =
          patient_local_address.trim();
      }

      if (
        patient_local_pincode?.trim() &&
        !patient.local_pincode
      ) {
        updates.local_pincode =
          patient_local_pincode.trim();
      }

      if (
        patient_referred_by &&
        !patient.referred_by
      ) {
        updates.referred_by =
          patient_referred_by;
      }

      if (
        patient_referrer_name?.trim() &&
        !patient.referrer_name
      ) {
        updates.referrer_name =
          patient_referrer_name.trim();
      }

      if (
        patient_referrer_address?.trim() &&
        !patient.referrer_address
      ) {
        updates.referrer_address =
          patient_referrer_address.trim();
      }

      const keys = Object.keys(updates);

      if (keys.length) {
        await pool.query(
          `
          UPDATE patients
          SET ${keys
            .map((key) => `\`${key}\` = ?`)
            .join(", ")}
          WHERE id = ?
          `,
          [
            ...keys.map((key) => updates[key]),
            patientId,
          ],
        );
      }

      // Ensure old patient also has patient_id
      if (!patient.patient_id) {
        await pool.query(
          "UPDATE patients SET patient_id = ? WHERE id = ?",
          [String(patientId), patientId],
        );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | WHO IS THE APPOINTMENT FOR (holder or family member)
    |--------------------------------------------------------------------------
    */
    const holderId = patientId;
    try {
      patientId = await family.resolveBookingPatientId({
        holderId,
        member_patient_id,
        new_member,
      });
    } catch (famErr) {
      return res
        .status(famErr.status || 400)
        .json({ success: false, message: famErr.message });
    }

    /*
    |--------------------------------------------------------------------------
    | APPOINTMENT
    |--------------------------------------------------------------------------
    */

    const serviceId = service_id || null;

    const { slots, duration } =
      await computeAvailableSlots({
        doctor_id,
        clinic_id,
        date: appointment_date,
      });

    if (!slots.includes(start_time)) {
      return res.status(409).json({
        success: false,
        message: "Slot not available",
      });
    }

    const end_time = toHHMM(
      toMinutes(start_time) + duration,
    );

    const [feeRows] = await pool.query(
      "SELECT consultation_fee FROM doctors WHERE id = ?",
      [doctor_id],
    );

    const fee = feeRows.length
      ? parseFloat(
          feeRows[0].consultation_fee,
        ) || 0
      : 0;

    const finalAmount = is_free ? 0 : fee;

    const appointment_code =
      generateAppointmentCode();

    const isReception =
      req.admin?.role === "receptionist";

    const collectingNow =
      !is_free &&
      payment_method &&
      payment_method !== "pending";

    const paymentStatus = is_free
      ? "not_required"
      : collectingNow
        ? "paid"
        : "pending";

    const apptStatus =
      is_free || collectingNow
        ? "confirmed"
        : "pending";

    const [result] = await pool.query(
      `
      INSERT INTO appointments (
        appointment_code,
        patient_id,
        clinic_id,
        doctor_id,
        service_id,
        appointment_date,
        start_time,
        end_time,
        fee_amount,
        discount_amount,
        final_amount,
        is_free,
        payment_status,
        status,
        reason,
        booked_via,
        created_by_receptionist_id
      )
      VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?,
        0,
        ?, ?, ?, ?, ?, ?, ?
      )
      `,
      [
        appointment_code,
        patientId,
        clinic_id,
        doctor_id,
        serviceId,
        appointment_date,
        start_time,
        end_time,
        fee,
        finalAmount,
        is_free ? 1 : 0,
        paymentStatus,
        apptStatus,
        reason || null,
        isReception ? "reception" : "admin",
        isReception ? req.admin.id : null,
      ],
    );

    const appointmentId = result.insertId;

    /*
    |--------------------------------------------------------------------------
    | PAYMENT
    |--------------------------------------------------------------------------
    */

    if (collectingNow) {
      await pool.query(
        `
        INSERT INTO payments (
          appointment_id,
          patient_id,
          amount,
          method,
          status,
          collected_by_receptionist_id
        )
        VALUES (?, ?, ?, ?, 'paid', ?)
        `,
        [
          appointmentId,
          patientId,
          finalAmount,
          payment_method,
          isReception ? req.admin.id : null,
        ],
      );
    }

    /*
    |--------------------------------------------------------------------------
    | WHATSAPP
    |--------------------------------------------------------------------------
    */

    const [doctorRows] = await pool.query(
      "SELECT name FROM doctors WHERE id = ?",
      [doctor_id],
    );

    const doctorName =
      doctorRows[0]?.name || "";

    // Fetch latest patient after possible update
    const [finalPatientRows] = await pool.query(
      `
      SELECT *
      FROM patients
      WHERE id = ?
      LIMIT 1
      `,
      [patientId],
    );

    const finalPatient =
      finalPatientRows[0];

    const finalPatientName =
      finalPatient?.name ||
      patient_name ||
      "";

    try {
      await sendBookingSuccessWhatsapp({
        mobile: patient_mobile,
        customerName: finalPatientName,
        bookingId: appointment_code,
        doctorName,
        date: dayjs(
          appointment_date,
        ).format("DD MMM YYYY"),
        time: dayjs(
          `2000-01-01 ${start_time}`,
        ).format("hh:mm A"),
      });

      await sendNewBookingAdminWhatsapp({
        customerName: finalPatientName,
        customerMobile: patient_mobile,
        bookingId: appointment_code,
        doctorName,
        date: dayjs(
          appointment_date,
        ).format("DD MMM YYYY"),
        time: dayjs(
          `2000-01-01 ${start_time}`,
        ).format("hh:mm A"),
      });
    } catch (waErr) {
      console.error(
        "WhatsApp notify failed:",
        waErr.message,
      );
    }

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return res.status(201).json({
      success: true,
      id: appointmentId,
      patient_id: patientId,
      manual_patient_id:
        finalPatient?.patient_id || String(patientId),
      patient: finalPatient,
      appointment_code,
      payment_status: paymentStatus,
    });
  } catch (err) {
    console.error(
      "adminCreateAppointment error:",
      err,
    );

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message:
          "Slot or patient data already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to create appointment",
    });
  }
};

// ---------- COFOUNDER (secret-key access, no login) ----------
// patient_type: "new" -> patients + appointments table (normal flow)
// patient_type: "old" -> new_patinet + old_appointments table (backdated data entry)

const COFOUNDER_MAX_DAYS_BACK = 365;

function assertDateWithinCofounderWindow(date) {
  const earliest = dayjs().tz(INDIA_TZ).subtract(COFOUNDER_MAX_DAYS_BACK, "day").startOf("day");
  if (dayjs(date).tz(INDIA_TZ).isBefore(earliest, "day")) {
    return `Date can't be more than ${COFOUNDER_MAX_DAYS_BACK} days in the past`;
  }
  return null;
}

async function generateNewPatinetId(conn) {
  let id, exists;
  do {
    const rand = Math.floor(1000 + Math.random() * 9000);
    id = `PAT${rand}`;
    const [rows] = await conn.query(
      "SELECT id FROM new_patinet WHERE patient_id = ? LIMIT 1",
      [id],
    );
    exists = rows.length > 0;
  } while (exists);
  return id;
}

// GET /api/cofounder/appointments/available-slots?doctor_id=&clinic_id=&service_id=&date=&exclude_appointment_id=&patient_type=
exports.cofounderGetAvailableSlots = async (req, res) => {
  try {
    const { doctor_id, clinic_id, service_id, date, exclude_appointment_id, patient_type } = req.query;
    if (!doctor_id || !clinic_id || !date) {
      return res.status(400).json({ success: false, message: "doctor_id, clinic_id, date required" });
    }
    const dateErr = assertDateWithinCofounderWindow(date);
    if (dateErr) return res.status(400).json({ success: false, message: dateErr });

    const result = await computeAvailableSlots({
      doctor_id,
      clinic_id,
      service_id: service_id || null,
      date,
      excludeAppointmentId: exclude_appointment_id || null,
      allowPast: true,
      appointmentsTable: patient_type === "old" ? "old_appointments" : "appointments",
    });
    res.json({ success: true, ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to compute slots" });
  }
};

// POST /api/cofounder/appointments
exports.cofounderCreateAppointment = async (req, res) => {
  try {
    const {
      patient_name,
      patient_mobile,
      manual_patient_id,
      patient_email,
      patient_gender,
      patient_type,

      patient_father_husband_name,
      patient_dob,
      patient_nationality,
      patient_marital_status,

      patient_address,
      patient_permanent_address,
      patient_permanent_pincode,
      patient_local_address,
      patient_local_pincode,

      patient_referred_by,
      patient_referrer_name,
      patient_referrer_address,

      clinic_id,
      doctor_id,
      service_id,
      appointment_date,
      start_time,
      is_free,
      reason,
      payment_method,
      member_patient_id, // family member of this mobile (empty = account holder)
      new_member, // optional { name, relation, gender, dob }
    } = req.body;

    if (
      !clinic_id ||
      !doctor_id ||
      !appointment_date ||
      !start_time ||
      !patient_mobile
    ) {
      return res.status(400).json({
        success: false,
        message:
          "clinic_id, doctor_id, date, time and patient mobile are required",
      });
    }

    if (!/^[6-9]\d{9}$/.test(patient_mobile)) {
      return res.status(400).json({
        success: false,
        message: "Valid 10-digit patient mobile number required",
      });
    }

    const dateErr = assertDateWithinCofounderWindow(appointment_date);

    if (dateErr) {
      return res.status(400).json({
        success: false,
        message: dateErr,
      });
    }

    const isOld = patient_type === "old";

    const patientTable = isOld
      ? "new_patinet"
      : "patients";

    const apptTable = isOld
      ? "old_appointments"
      : "appointments";

    let patientId;
    let finalPatientId;

    /*
    |--------------------------------------------------------------------------
    | PATIENT HANDLING
    |--------------------------------------------------------------------------
    */

    let [patientRows] = await pool.query(
      `SELECT * FROM \`${patientTable}\`
       WHERE mobile = ? AND parent_patient_id IS NULL
       ORDER BY id ASC
       LIMIT 1`,
      [patient_mobile],
    );

    /*
    |--------------------------------------------------------------------------
    | CREATE PATIENT IF NOT EXISTS
    |--------------------------------------------------------------------------
    */

    if (patientRows.length === 0) {
      if (isOld) {
        const generatedId =
          await generateNewPatinetId(pool);

        const [pResult] = await pool.query(
          `
          INSERT INTO new_patinet (
            patient_id,
            name,
            father_husband_name,
            mobile,
            email,
            gender,
            dob,
            nationality,
            marital_status,
            address,
            permanent_address,
            permanent_pincode,
            local_address,
            local_pincode,
            referred_by,
            referrer_name,
            referrer_address
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            generatedId,

            patient_name?.trim() || null,
            patient_father_husband_name?.trim() || null,

            patient_mobile,

            patient_email?.trim() || null,
            patient_gender || null,
            patient_dob || null,
            patient_nationality?.trim() || null,
            patient_marital_status || null,

            patient_address?.trim() || null,

            patient_permanent_address?.trim() || null,
            patient_permanent_pincode?.trim() || null,

            patient_local_address?.trim() || null,
            patient_local_pincode?.trim() || null,

            patient_referred_by || null,
            patient_referrer_name?.trim() || null,
            patient_referrer_address?.trim() || null,
          ],
        );

        patientId = pResult.insertId;
        finalPatientId = generatedId;
      } else {
        const manualPatientId =
          manual_patient_id !== undefined &&
          manual_patient_id !== null &&
          String(manual_patient_id).trim() !== ""
            ? String(manual_patient_id).trim()
            : null;

        if (manualPatientId) {
          const [existingPatientId] =
            await pool.query(
              `
              SELECT id
              FROM patients
              WHERE patient_id = ?
              LIMIT 1
              `,
              [manualPatientId],
            );

          if (existingPatientId.length > 0) {
            return res.status(409).json({
              success: false,
              message: `Patient ID "${manualPatientId}" already exists`,
            });
          }
        }

        const [pResult] = await pool.query(
          `
          INSERT INTO patients (
            patient_id,
            name,
            father_husband_name,
            mobile,
            email,
            gender,
            dob,
            nationality,
            marital_status,
            address,
            permanent_address,
            permanent_pincode,
            local_address,
            local_pincode,
            referred_by,
            referrer_name,
            referrer_address
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            manualPatientId,

            patient_name?.trim() || null,
            patient_father_husband_name?.trim() || null,

            patient_mobile,

            patient_email?.trim() || null,
            patient_gender || null,
            patient_dob || null,
            patient_nationality?.trim() || null,
            patient_marital_status || null,

            patient_address?.trim() || null,

            patient_permanent_address?.trim() || null,
            patient_permanent_pincode?.trim() || null,

            patient_local_address?.trim() || null,
            patient_local_pincode?.trim() || null,

            patient_referred_by || null,
            patient_referrer_name?.trim() || null,
            patient_referrer_address?.trim() || null,
          ],
        );

        patientId = pResult.insertId;

        if (manualPatientId) {
          finalPatientId = manualPatientId;
        } else {
          finalPatientId = String(patientId);

          await pool.query(
            `
            UPDATE patients
            SET patient_id = ?
            WHERE id = ?
            `,
            [finalPatientId, patientId],
          );
        }
      }
    } else {
      /*
      |--------------------------------------------------------------------------
      | EXISTING PATIENT
      | Fill ONLY empty DB fields
      |--------------------------------------------------------------------------
      */

      const patient = patientRows[0];

      patientId = patient.id;
      finalPatientId = patient.patient_id;

      const updates = {};

      if (
        patient_name?.trim() &&
        !patient.name
      ) {
        updates.name = patient_name.trim();
      }

      if (
        patient_father_husband_name?.trim() &&
        !patient.father_husband_name
      ) {
        updates.father_husband_name =
          patient_father_husband_name.trim();
      }

      if (
        patient_email?.trim() &&
        !patient.email
      ) {
        updates.email = patient_email.trim();
      }

      if (
        patient_gender &&
        !patient.gender
      ) {
        updates.gender = patient_gender;
      }

      if (
        patient_dob &&
        !patient.dob
      ) {
        updates.dob = patient_dob;
      }

      if (
        patient_nationality?.trim() &&
        !patient.nationality
      ) {
        updates.nationality =
          patient_nationality.trim();
      }

      if (
        patient_marital_status &&
        !patient.marital_status
      ) {
        updates.marital_status =
          patient_marital_status;
      }

      if (
        patient_address?.trim() &&
        !patient.address
      ) {
        updates.address =
          patient_address.trim();
      }

      if (
        patient_permanent_address?.trim() &&
        !patient.permanent_address
      ) {
        updates.permanent_address =
          patient_permanent_address.trim();
      }

      if (
        patient_permanent_pincode?.trim() &&
        !patient.permanent_pincode
      ) {
        updates.permanent_pincode =
          patient_permanent_pincode.trim();
      }

      if (
        patient_local_address?.trim() &&
        !patient.local_address
      ) {
        updates.local_address =
          patient_local_address.trim();
      }

      if (
        patient_local_pincode?.trim() &&
        !patient.local_pincode
      ) {
        updates.local_pincode =
          patient_local_pincode.trim();
      }

      if (
        patient_referred_by &&
        !patient.referred_by
      ) {
        updates.referred_by =
          patient_referred_by;
      }

      if (
        patient_referrer_name?.trim() &&
        !patient.referrer_name
      ) {
        updates.referrer_name =
          patient_referrer_name.trim();
      }

      if (
        patient_referrer_address?.trim() &&
        !patient.referrer_address
      ) {
        updates.referrer_address =
          patient_referrer_address.trim();
      }

      const keys = Object.keys(updates);

      if (keys.length) {
        await pool.query(
          `
          UPDATE \`${patientTable}\`
          SET ${keys
            .map((key) => `\`${key}\` = ?`)
            .join(", ")}
          WHERE id = ?
          `,
          [
            ...keys.map((key) => updates[key]),
            patientId,
          ],
        );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | WHO IS THE APPOINTMENT FOR (holder or family member)
    |--------------------------------------------------------------------------
    */
    {
      const holderId = patientId;
      try {
        patientId = await family.resolveBookingPatientId({
          holderId,
          member_patient_id,
          new_member,
          table: patientTable,
        });
      } catch (famErr) {
        return res
          .status(famErr.status || 400)
          .json({ success: false, message: famErr.message });
      }
      if (patientId !== holderId) {
        const [mRows] = await pool.query(
          `SELECT patient_id FROM \`${patientTable}\` WHERE id = ?`,
          [patientId],
        );
        finalPatientId = mRows[0]?.patient_id || String(patientId);
      }
    }

    /*
    |--------------------------------------------------------------------------
    | APPOINTMENT
    |--------------------------------------------------------------------------
    */

    const serviceId = service_id || null;

    const {
      slots,
      duration,
      reason: slotReason,
    } = await computeAvailableSlots({
      doctor_id,
      clinic_id,
      date: appointment_date,
      allowPast: true,
      appointmentsTable: apptTable,
    });

    if (!slots.includes(start_time)) {
      return res.status(409).json({
        success: false,
        message:
          slotReason || "Slot not available",
      });
    }

    const end_time = toHHMM(
      toMinutes(start_time) + duration,
    );

    const [feeRows] = await pool.query(
      `
      SELECT consultation_fee
      FROM doctors
      WHERE id = ?
      `,
      [doctor_id],
    );

    const fee = feeRows.length
      ? parseFloat(
          feeRows[0].consultation_fee,
        ) || 0
      : 0;

    const finalAmount = is_free
      ? 0
      : fee;

    const appointment_code =
      generateAppointmentCode();

    const collectingNow =
      !is_free &&
      payment_method &&
      payment_method !== "pending";

    const paymentStatus = is_free
      ? "not_required"
      : collectingNow
        ? "paid"
        : "pending";

    const apptStatus =
      is_free || collectingNow
        ? "confirmed"
        : "pending";

    const [result] = await pool.query(
      `
      INSERT INTO \`${apptTable}\`
      (
        appointment_code,
        patient_id,
        clinic_id,
        doctor_id,
        service_id,
        appointment_date,
        start_time,
        end_time,
        fee_amount,
        discount_amount,
        final_amount,
        is_free,
        payment_status,
        status,
        reason,
        booked_via
      )
      VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?,
        0,
        ?, ?, ?, ?, ?, ?
      )
      `,
      [
        appointment_code,
        patientId,
        clinic_id,
        doctor_id,
        serviceId,
        appointment_date,
        start_time,
        end_time,
        fee,
        finalAmount,
        is_free ? 1 : 0,
        paymentStatus,
        apptStatus,
        reason || null,
        "admin",
      ],
    );

    const appointmentId =
      result.insertId;

    /*
    |--------------------------------------------------------------------------
    | PAYMENT
    |--------------------------------------------------------------------------
    */

    if (collectingNow) {
      await pool.query(
        `
        INSERT INTO payments (
          appointment_id,
          patient_id,
          amount,
          method,
          status
        )
        VALUES (?, ?, ?, ?, 'paid')
        `,
        [
          appointmentId,
          patientId,
          finalAmount,
          payment_method,
        ],
      );
    }

    return res.status(201).json({
      success: true,

      id: appointmentId,

      patient_id: patientId,
      manual_patient_id:
        finalPatientId,

      patient_type:
        isOld ? "old" : "new",

      appointment_code,

      payment_status:
        paymentStatus,
    });
  } catch (err) {
    console.error(
      "Cofounder create appointment error:",
      err,
    );

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message:
          "Patient ID or slot already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to create appointment",
    });
  }
};

// PUT /api/cofounder/appointments/:id { patient_type: "new" | "old", ... }
// patient_type tells which table the row lives in (ids overlap across tables)
exports.cofounderUpdateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const isOld = req.body?.patient_type === "old";
    const apptTable = isOld ? "old_appointments" : "appointments";

    const [existingRows] = await pool.query(
      `SELECT * FROM \`${apptTable}\` WHERE id = ?`,
      [id],
    );
    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }
    const existing = existingRows[0];

    const body = req.body || {};
    const updates = {};
    for (const key of APPOINTMENT_EDITABLE_FIELDS) {
      if (body[key] !== undefined) updates[key] = body[key] === "" ? null : body[key];
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields to update" });
    }

    const merged = { ...existing, ...updates };
    const dateErr = assertDateWithinCofounderWindow(merged.appointment_date);
    if (dateErr) return res.status(400).json({ success: false, message: dateErr });

    const scheduleChanged = SCHEDULE_FIELDS.some((k) => updates[k] !== undefined);
    if (scheduleChanged) {
      const { slots, duration, reason: slotReason } = await computeAvailableSlots({
        doctor_id: merged.doctor_id,
        clinic_id: merged.clinic_id,
        date: merged.appointment_date,
        excludeAppointmentId: id,
        allowPast: true,
        appointmentsTable: apptTable,
      });
      if (!slots.includes(String(merged.start_time).slice(0, 5))) {
        return res.status(409).json({ success: false, message: slotReason || "Selected slot is not available" });
      }
      updates.end_time = toHHMM(toMinutes(String(merged.start_time).slice(0, 5)) + duration);
    }

    const keys = Object.keys(updates);
    const setClause = keys.map((k) => `\`${k}\` = ?`).join(", ");
    const values = keys.map((k) => updates[k]);
    await pool.query(`UPDATE \`${apptTable}\` SET ${setClause} WHERE id = ?`, [...values, id]);

    const patientTable = isOld ? "new_patinet" : "patients";
    const [rows] = await pool.query(
      `SELECT a.*, p.name AS patient_name, p.mobile AS patient_mobile,
         d.name AS doctor_name, s.name AS service_name, c.name AS clinic_name
       FROM \`${apptTable}\` a
       JOIN \`${patientTable}\` p ON p.id = a.patient_id
       JOIN doctors d ON d.id = a.doctor_id
       LEFT JOIN services s ON s.id = a.service_id
       JOIN clinics c ON c.id = a.clinic_id
       WHERE a.id = ?`,
      [id],
    );

    res.json({ success: true, message: "Appointment updated", appointment: rows[0] });
  } catch (err) {
    console.error("cofounderUpdateAppointment error:", err);
    res.status(500).json({ success: false, message: "Failed to update appointment" });
  }
};

// ============================================================
// RECEPTION IN / OUT VISIT TIMER
// All times stored as IST wall-clock strings (pool uses dateStrings:true)
// ============================================================
const DEFAULT_VISIT_TIMER = 40;
const nowIST = () => dayjs().tz(INDIA_TZ);
const fmtIST = (d) => d.format("YYYY-MM-DD HH:mm:ss");
const parseIST = (str) => (str ? dayjs.tz(String(str).replace("T", " ").slice(0, 19), INDIA_TZ) : null);

async function getDefaultVisitTimer() {
  try {
    const [rows] = await pool.query(
      "SELECT setting_value FROM site_settings WHERE setting_key = 'visit_timer_minutes' LIMIT 1",
    );
    const n = parseInt(rows[0]?.setting_value, 10);
    return n > 0 ? n : DEFAULT_VISIT_TIMER;
  } catch (e) {
    return DEFAULT_VISIT_TIMER;
  }
}

// adds a computed `visit` object: state + remaining/elapsed seconds (server clock)
function withVisit(appt) {
  if (!appt) return appt;
  const inAt = parseIST(appt.checked_in_at);
  const outAt = parseIST(appt.checked_out_at);
  const now = nowIST();
  const timer = parseInt(appt.timer_minutes, 10) || DEFAULT_VISIT_TIMER;
  let visit = { state: "not_arrived", server_now: fmtIST(now) };
  if (inAt) {
    const endsAt = inAt.add(timer, "minute");
    const ref = outAt || now;
    visit = {
      state: outAt ? "out" : "in",
      checked_in_at: appt.checked_in_at,
      checked_out_at: appt.checked_out_at || null,
      timer_minutes: timer,
      timer_ends_at: fmtIST(endsAt),
      elapsed_seconds: Math.max(0, ref.diff(inAt, "second")),
      remaining_seconds: outAt ? 0 : endsAt.diff(now, "second"), // negative = overtime
      overtime: (outAt || now).isAfter(endsAt),
      duration_minutes: appt.visit_duration_minutes ?? null,
      server_now: fmtIST(now),
    };
  }
  return { ...appt, visit };
}

async function loadApptForVisit(req, res) {
  const [rows] = await pool.query(
    `SELECT a.*, p.name AS patient_name, p.mobile AS patient_mobile, p.relation AS patient_relation,
            d.name AS doctor_name
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       JOIN doctors d ON d.id = a.doctor_id
      WHERE a.id = ?`,
    [req.params.id],
  );
  if (!rows.length) {
    res.status(404).json({ success: false, message: "Appointment not found" });
    return null;
  }
  const appt = rows[0];
  if (
    req.admin?.role === "receptionist" &&
    req.admin.clinic_id &&
    appt.clinic_id !== req.admin.clinic_id
  ) {
    res.status(403).json({ success: false, message: "Forbidden" });
    return null;
  }
  return appt;
}

const reloadVisit = async (id) => {
  const [rows] = await pool.query(
    `SELECT a.*, p.name AS patient_name, p.mobile AS patient_mobile, p.relation AS patient_relation,
            d.name AS doctor_name
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       JOIN doctors d ON d.id = a.doctor_id
      WHERE a.id = ?`,
    [id],
  );
  return withVisit(rows[0]);
};

// GET /api/admin/visit-timer/settings -> { default_minutes }
exports.getVisitTimerSettings = async (req, res) => {
  res.json({ success: true, default_minutes: await getDefaultVisitTimer() });
};

// POST /api/admin/appointments/:id/check-in { timer_minutes? }
exports.checkInAppointment = async (req, res) => {
  try {
    const appt = await loadApptForVisit(req, res);
    if (!appt) return;
    if (appt.status === "cancelled") {
      return res.status(400).json({ success: false, message: "Cancelled appointment cannot be checked in" });
    }
    if (appt.checked_in_at && !appt.checked_out_at) {
      return res.status(409).json({ success: false, message: "Patient is already IN", appointment: withVisit(appt) });
    }
    if (appt.checked_out_at) {
      return res.status(409).json({ success: false, message: "Visit already completed (OUT done)", appointment: withVisit(appt) });
    }
    let timer = parseInt(req.body?.timer_minutes, 10);
    if (!(timer > 0 && timer <= 600)) timer = await getDefaultVisitTimer();

    await pool.query(
      `UPDATE appointments
          SET checked_in_at = ?, timer_minutes = ?, checked_in_by = ?,
              checked_out_at = NULL, visit_duration_minutes = NULL, checked_out_by = NULL,
              status = IF(status IN ('pending','no_show'), 'confirmed', status)
        WHERE id = ?`,
      [fmtIST(nowIST()), timer, req.admin?.id || null, appt.id],
    );
    res.json({ success: true, message: `Patient IN — ${timer} min timer started`, appointment: await reloadVisit(appt.id) });
  } catch (err) {
    console.error("checkInAppointment error:", err);
    res.status(500).json({ success: false, message: "Failed to check in" });
  }
};

// POST /api/admin/appointments/:id/check-out
exports.checkOutAppointment = async (req, res) => {
  try {
    const appt = await loadApptForVisit(req, res);
    if (!appt) return;
    if (!appt.checked_in_at) {
      return res.status(400).json({ success: false, message: "Patient was not checked IN" });
    }
    if (appt.checked_out_at) {
      return res.status(409).json({ success: false, message: "Patient already OUT", appointment: withVisit(appt) });
    }
    const out = nowIST();
    const duration = Math.max(0, Math.round(out.diff(parseIST(appt.checked_in_at), "second") / 60));
    await pool.query(
      `UPDATE appointments
          SET checked_out_at = ?, visit_duration_minutes = ?, checked_out_by = ?,
              status = IF(status = 'cancelled', status, 'completed')
        WHERE id = ?`,
      [fmtIST(out), duration, req.admin?.id || null, appt.id],
    );
    res.json({ success: true, message: `Patient OUT — visit took ${duration} min`, appointment: await reloadVisit(appt.id) });
  } catch (err) {
    console.error("checkOutAppointment error:", err);
    res.status(500).json({ success: false, message: "Failed to check out" });
  }
};

// PUT /api/admin/appointments/:id/timer { timer_minutes } OR { add_minutes }
// dynamic timer: change / extend while patient is IN
exports.updateVisitTimer = async (req, res) => {
  try {
    const appt = await loadApptForVisit(req, res);
    if (!appt) return;
    if (!appt.checked_in_at || appt.checked_out_at) {
      return res.status(400).json({ success: false, message: "Timer can be changed only while patient is IN" });
    }
    const current = parseInt(appt.timer_minutes, 10) || DEFAULT_VISIT_TIMER;
    let next = current;
    if (req.body?.add_minutes !== undefined) next = current + parseInt(req.body.add_minutes, 10);
    else if (req.body?.timer_minutes !== undefined) next = parseInt(req.body.timer_minutes, 10);
    if (!(next > 0 && next <= 600)) {
      return res.status(400).json({ success: false, message: "Timer must be between 1 and 600 minutes" });
    }
    await pool.query("UPDATE appointments SET timer_minutes = ? WHERE id = ?", [next, appt.id]);
    res.json({ success: true, message: `Timer set to ${next} min`, appointment: await reloadVisit(appt.id) });
  } catch (err) {
    console.error("updateVisitTimer error:", err);
    res.status(500).json({ success: false, message: "Failed to update timer" });
  }
};

// POST /api/admin/appointments/:id/undo-check-in  (wrong patient pressed IN)
exports.undoCheckIn = async (req, res) => {
  try {
    const appt = await loadApptForVisit(req, res);
    if (!appt) return;
    if (appt.checked_out_at) {
      return res.status(400).json({ success: false, message: "Visit already OUT, cannot undo" });
    }
    await pool.query(
      `UPDATE appointments
          SET checked_in_at = NULL, timer_minutes = NULL, checked_in_by = NULL
        WHERE id = ?`,
      [appt.id],
    );
    res.json({ success: true, message: "Check-in undone", appointment: await reloadVisit(appt.id) });
  } catch (err) {
    console.error("undoCheckIn error:", err);
    res.status(500).json({ success: false, message: "Failed to undo check-in" });
  }
};

// GET /api/admin/appointments/in-clinic/live  -> patients currently IN (timer running)
exports.getInClinicLive = async (req, res) => {
  try {
    let where = "a.checked_in_at IS NOT NULL AND a.checked_out_at IS NULL";
    const params = [];
    if (req.admin?.role === "receptionist" && req.admin.clinic_id) {
      where += " AND a.clinic_id = ?";
      params.push(req.admin.clinic_id);
    } else if (req.query.clinic_id) {
      where += " AND a.clinic_id = ?";
      params.push(req.query.clinic_id);
    }
    const [rows] = await pool.query(
      `SELECT a.*, p.name AS patient_name, p.mobile AS patient_mobile, p.relation AS patient_relation,
              d.name AS doctor_name, c.name AS clinic_name
         FROM appointments a
         JOIN patients p ON p.id = a.patient_id
         JOIN doctors d ON d.id = a.doctor_id
         JOIN clinics c ON c.id = a.clinic_id
        WHERE ${where}
        ORDER BY a.checked_in_at ASC`,
      params,
    );
    res.json({ success: true, appointments: rows.map(withVisit) });
  } catch (err) {
    console.error("getInClinicLive error:", err);
    res.status(500).json({ success: false, message: "Failed to load live visits" });
  }
};

exports.withVisit = withVisit;
exports.computeAvailableSlots = computeAvailableSlots;