const pool = require("../config/db");
const family = require("../utils/family");

// ids of the logged-in holder + all family members (patient auth)
const FAMILY_SCOPE = "(SELECT fp.id FROM patients fp WHERE fp.id = ? OR fp.parent_patient_id = ?)";

// PUT /api/patients/profile (patient auth)
exports.updateProfile = async (req, res) => {
  try {
    const {
      name,
      email,
      gender,
      dob,
      address,
      father_husband_name,
      nationality,
      marital_status,
      permanent_address,
      permanent_pincode,
      local_address,
      local_pincode,
      referred_by,
      referrer_name,
      referrer_address,
    } = req.body;

    await pool.query(
      `
      UPDATE patients SET
        name = COALESCE(?, name),
        father_husband_name = COALESCE(?, father_husband_name),
        email = COALESCE(?, email),
        gender = COALESCE(?, gender),
        dob = COALESCE(?, dob),
        address = COALESCE(?, address),
        nationality = COALESCE(?, nationality),
        marital_status = COALESCE(?, marital_status),
        permanent_address = COALESCE(?, permanent_address),
        permanent_pincode = COALESCE(?, permanent_pincode),
        local_address = COALESCE(?, local_address),
        local_pincode = COALESCE(?, local_pincode),
        referred_by = COALESCE(?, referred_by),
        referrer_name = COALESCE(?, referrer_name),
       referrer_address = COALESCE(?, referrer_address)
      WHERE id = ?
      `,
      [
        name ?? null,
        father_husband_name ?? null,
        email ?? null,
        gender ?? null,
        dob ?? null,
        address ?? null,
        nationality ?? null,
        marital_status ?? null,
        permanent_address ?? null,
        permanent_pincode ?? null,
        local_address ?? null,
        local_pincode ?? null,
        referred_by ?? null,
        referrer_name ?? null,
        referrer_address ?? null,
        req.patient.id,
      ],
    );

    const [rows] = await pool.query(
      "SELECT * FROM patients WHERE id = ?",
      [req.patient.id],
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    return res.json({
      success: true,
      message: "Profile updated successfully",
      patient: rows[0],
    });
  } catch (error) {
    console.error("Update patient profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

// GET /api/patients/medical-history (patient auth)
exports.getMyMedicalHistory = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT mh.*, d.name AS doctor_name, pt.name AS patient_name, pt.relation AS patient_relation
     FROM medical_history mh
     LEFT JOIN doctors d ON d.id = mh.doctor_id
     LEFT JOIN patients pt ON pt.id = mh.patient_id
     WHERE mh.patient_id IN ${FAMILY_SCOPE} ORDER BY mh.visit_date DESC`,
    [req.patient.id, req.patient.id],
  );
  res.json({ success: true, history: rows });
};

// GET /api/patients/prescriptions (patient auth)
exports.getMyPrescriptions = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT p.*, d.name AS doctor_name, pt.name AS patient_name, pt.relation AS patient_relation
     FROM prescriptions p
     LEFT JOIN doctors d ON d.id = p.doctor_id
     LEFT JOIN patients pt ON pt.id = p.patient_id
     WHERE p.patient_id IN ${FAMILY_SCOPE} ORDER BY p.prescribed_date DESC`,
    [req.patient.id, req.patient.id],
  );
  res.json({ success: true, prescriptions: rows });
};

// GET /api/patients/follow-ups (patient auth)
exports.getMyFollowUps = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT f.*, d.name AS doctor_name, pt.name AS patient_name, pt.relation AS patient_relation
     FROM follow_ups f
     LEFT JOIN doctors d ON d.id = f.doctor_id
     LEFT JOIN patients pt ON pt.id = f.patient_id
     WHERE f.patient_id IN ${FAMILY_SCOPE} ORDER BY f.follow_up_date DESC`,
    [req.patient.id, req.patient.id],
  );
  res.json({ success: true, followUps: rows });
};

// ---------- ADMIN ----------
// GET /api/admin/patients?page=&limit=&search=&patient_type=new|old|all

exports.adminGetAllPatients = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);

    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);

    const offset = (page - 1) * limit;

    const search = req.query.search ? `%${req.query.search.trim()}%` : null;

    const patientType = req.query.patient_type || "all";

    const buildWhere = () =>
      search
        ? `WHERE id LIKE ? 
       OR mobile LIKE ? 
       OR email LIKE ? 
       OR patient_id LIKE ?
       OR address LIKE ?`
        : "";

    // IMPORTANT: 5 values now because there are 5 ? above
    const buildParams = () =>
      search ? [search, search, search, search, search] : [];

    // ------------------------------------------------
    // NEW / OLD PATIENTS
    // ------------------------------------------------
    if (patientType === "new" || patientType === "old") {
      const table = patientType === "old" ? "new_patinet" : "patients";

      const where = buildWhere();
      const params = buildParams();

      // Count
      const [countRows] = await pool.query(
        `SELECT COUNT(*) AS total 
         FROM \`${table}\` 
         ${where}`,
        params,
      );

      const total = Number(countRows[0].total || 0);

      // Data
      const [rows] = await pool.query(
        `SELECT * 
         FROM \`${table}\`
         ${where}
         ORDER BY id DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset],
      );

      const totalPages = Math.ceil(total / limit);

      return res.json({
        success: true,
        patients: rows.map((r) => ({
          ...r,
          patient_type: patientType,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      });
    }

    // ------------------------------------------------
    // ALL PATIENTS
    // ------------------------------------------------
    const where = buildWhere();
    const params = buildParams();

    const [newRows] = await pool.query(
      `SELECT * FROM patients ${where}`,
      params,
    );

    const [oldRows] = await pool.query(
      `SELECT * FROM new_patinet ${where}`,
      params,
    );

    const merged = [
      ...newRows.map((r) => ({
        ...r,
        patient_type: "new",
      })),

      ...oldRows.map((r) => ({
        ...r,
        patient_type: "old",
      })),
    ].sort((a, b) => b.id - a.id);

    const total = merged.length;
    const totalPages = Math.ceil(total / limit);

    const pageRows = merged.slice(offset, offset + limit);

    return res.json({
      success: true,
      patients: pageRows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("adminGetAllPatients error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch patients",
      error: error.message,
    });
  }
};

exports.adminGetPatientById = async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM patients WHERE id = ?", [
    req.params.id,
  ]);
  if (rows.length === 0)
    return res
      .status(404)
      .json({ success: false, message: "Patient not found" });
  const [appointments] = await pool.query(
    `SELECT a.*, d.name AS doctor_name, s.name AS service_name FROM appointments a
     JOIN doctors d ON d.id=a.doctor_id LEFT JOIN services s ON s.id=a.service_id
     WHERE a.patient_id = ? ORDER BY a.appointment_date DESC`,
    [req.params.id],
  );
  const [history] = await pool.query(
    "SELECT * FROM medical_history WHERE patient_id = ? ORDER BY visit_date DESC",
    [req.params.id],
  );
  const [prescriptions] = await pool.query(
    "SELECT * FROM prescriptions WHERE patient_id = ? ORDER BY prescribed_date DESC",
    [req.params.id],
  );
  const holderId = rows[0].parent_patient_id || rows[0].id;
  const [familyRows] = await pool.query(
    "SELECT id, patient_id, parent_patient_id, relation, name, mobile, gender, dob FROM patients WHERE id = ? OR parent_patient_id = ? ORDER BY (parent_patient_id IS NOT NULL), id",
    [holderId, holderId],
  );
  res.json({
    success: true,
    patient: rows[0],
    appointments,
    history,
    prescriptions,
    family: familyRows,
  });
};

// ---------- COFOUNDER ----------
// POST /api/cofounder/patients
// {
//   name,
//   mobile,
//   email?,
//   gender?,
//   dob?,
//   address?,
//   patient_id?   // optional manual patient id e.g. "001"
// }

// ADD to existing cofounder controller file (same file as cofounderCreateAppointment etc.)
// ROUTES to add:
// router.get("/cofounder/patients", cofounderSearchPatients);
// router.get("/cofounder/patients/:id", cofounderGetPatient);
// router.post("/cofounder/patients", cofounderCreatePatient);

// GET /api/cofounder/patients?search=&patient_type=new|old
exports.cofounderSearchPatients = async (req, res) => {
  try {
    const { search, patient_type } = req.query;
    const isOld = patient_type === "old";
    const table = isOld ? "new_patinet" : "patients";

    let where = "1=1";
    const params = [];

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      const isDigits = /^\d+$/.test(search.trim());

      where += ` AND (name LIKE ? OR mobile LIKE ? OR patient_id LIKE ?${isDigits ? " OR id = ?" : ""})`;
      params.push(term, term, term);
      if (isDigits) params.push(search.trim());
    }

    const [rows] = await pool.query(
      `SELECT * FROM \`${table}\` WHERE ${where} ORDER BY id DESC LIMIT 50`,
      params,
    );

    res.json({
      success: true,
      patients: rows.map((r) => ({
        ...r,
        patient_type: isOld ? "old" : "new",
      })),
    });
  } catch (err) {
    console.error("cofounderSearchPatients error:", err);
    res.status(500).json({ success: false, message: "Search failed" });
  }
};

// GET /api/cofounder/patients/:id?patient_type=new|old
exports.cofounderGetPatient = async (req, res) => {
  try {
    const { id } = req.params;
    const isOld = req.query.patient_type === "old";
    const patientTable = isOld ? "new_patinet" : "patients";
    const apptTable = isOld ? "old_appointments" : "appointments";
    const historyTable = isOld ? "old_medical_history" : "medical_history";
    const prescriptionTable = isOld ? "old_prescriptions" : "prescriptions";

    const [patientRows] = await pool.query(
      `SELECT * FROM \`${patientTable}\` WHERE id = ? LIMIT 1`,
      [id],
    );
    if (patientRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Patient not found" });
    }

    const patient = { ...patientRows[0], patient_type: isOld ? "old" : "new" };

    const [appointments] = await pool.query(
      `SELECT a.*, d.name AS doctor_name, c.name AS clinic_name
       FROM \`${apptTable}\` a
       JOIN doctors d ON d.id = a.doctor_id
       JOIN clinics c ON c.id = a.clinic_id
       WHERE a.patient_id = ?
       ORDER BY a.appointment_date DESC, a.start_time DESC`,
      [id],
    );

    // history/prescriptions are appointment-based, not raw patient_id —
    // scope to THIS patient's own appointment_ids in the correct table pair.
    const appointmentIds = appointments.map((a) => a.id);

    const [history] = appointmentIds.length
      ? await pool.query(
          `SELECT * FROM \`${historyTable}\` WHERE appointment_id IN (?) ORDER BY id DESC`,
          [appointmentIds],
        )
      : [[]];
    const [prescriptions] = appointmentIds.length
      ? await pool.query(
          `SELECT * FROM \`${prescriptionTable}\` WHERE appointment_id IN (?) ORDER BY id DESC`,
          [appointmentIds],
        )
      : [[]];

    res.json({ success: true, patient, appointments, history, prescriptions });
  } catch (err) {
    console.error("cofounderGetPatient error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch patient" });
  }
};

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
// POST /api/cofounder/patients { patient_type: "new" | "old", patient_id?, name, mobile, email, gender, dob, address }
exports.cofounderCreatePatient = async (req, res) => {
  try {
    const {
      patient_type,
      patient_id: manual_patient_id,

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
      referrer_address,
    } = req.body;

    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Valid 10-digit mobile number required",
      });
    }

    const isOld = patient_type === "old";
    const table = isOld ? "new_patinet" : "patients";

    // Check duplicate mobile
    const [existing] = await pool.query(
      `SELECT id FROM \`${table}\` WHERE mobile = ? AND parent_patient_id IS NULL LIMIT 1`,
      [mobile],
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Patient with this mobile already exists",
      });
    }

    /*
     * OLD PATIENT
     */
    if (isOld) {
      const generatedId = await generateNewPatinetId(pool);

      const [result] = await pool.query(
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
          name?.trim() || null,
          father_husband_name?.trim() || null,
          mobile,
          email?.trim() || null,
          gender || null,
          dob || null,
          nationality?.trim() || null,
          marital_status || null,
          address?.trim() || null,
          permanent_address?.trim() || null,
          permanent_pincode?.trim() || null,
          local_address?.trim() || null,
          local_pincode?.trim() || null,
          referred_by || null,
          referrer_name?.trim() || null,
          referrer_address?.trim() || null,
        ],
      );

      return res.status(201).json({
        success: true,
        id: result.insertId,
        patient_id: generatedId,
        patient_type: "old",
      });
    }

    /*
     * NEW PATIENT
     */

    const manualId =
      manual_patient_id &&
      String(manual_patient_id).trim() !== ""
        ? String(manual_patient_id).trim()
        : null;

    if (manualId) {
      const [dup] = await pool.query(
        "SELECT id FROM patients WHERE patient_id = ? LIMIT 1",
        [manualId],
      );

      if (dup.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Patient ID "${manualId}" already exists`,
        });
      }
    }

    const [result] = await pool.query(
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
        manualId,
        name?.trim() || null,
        father_husband_name?.trim() || null,
        mobile,
        email?.trim() || null,
        gender || null,
        dob || null,
        nationality?.trim() || null,
        marital_status || null,
        address?.trim() || null,
        permanent_address?.trim() || null,
        permanent_pincode?.trim() || null,
        local_address?.trim() || null,
        local_pincode?.trim() || null,
        referred_by || null,
        referrer_name?.trim() || null,
        referrer_address?.trim() || null,
      ],
    );

    let finalPatientId = manualId;

    if (!finalPatientId) {
      finalPatientId = String(result.insertId);

      await pool.query(
        "UPDATE patients SET patient_id = ? WHERE id = ?",
        [finalPatientId, result.insertId],
      );
    }

    // Optional: return complete created patient
    const [rows] = await pool.query(
      "SELECT * FROM patients WHERE id = ?",
      [result.insertId],
    );

    return res.status(201).json({
      success: true,
      id: result.insertId,
      patient_id: finalPatientId,
      patient_type: "new",
      patient: rows[0],
    });
  } catch (err) {
    console.error("cofounderCreatePatient error:", err);

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Patient ID or mobile already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to add patient",
    });
  }
};

exports.adminUpdatePatient = async (req, res) => {
  const fields = req.body;
  const keys = Object.keys(fields);
  if (keys.length === 0)
    return res
      .status(400)
      .json({ success: false, message: "No fields to update" });
  const setClause = keys.map((k) => `${k} = ?`).join(", ");
  await pool.query(`UPDATE patients SET ${setClause} WHERE id = ?`, [
    ...keys.map((k) => fields[k]),
    req.params.id,
  ]);
  res.json({ success: true, message: "Patient updated" });
};

// ============================================================
// FAMILY MEMBERS
// ============================================================
const sendErr = (res, err, fallback) => {
  if (err.status) return res.status(err.status).json({ success: false, message: err.message });
  console.error(fallback, err);
  return res.status(500).json({ success: false, message: fallback });
};

// ---------- PATIENT (logged in holder) ----------
// GET /api/patients/family
exports.getMyFamily = async (req, res) => {
  try {
    const holderId = (await family.getHolderId(req.patient.id)) || req.patient.id;
    const [selfRows] = await pool.query("SELECT * FROM patients WHERE id = ?", [holderId]);
    const members = await family.listMembers(holderId);
    res.json({ success: true, self: selfRows[0] || null, members, relations: family.RELATIONS });
  } catch (err) {
    sendErr(res, err, "Failed to load family members");
  }
};

// POST /api/patients/family { name, relation, gender, dob, email }
exports.addMyFamilyMember = async (req, res) => {
  try {
    const member = await family.createMember(req.patient.id, req.body);
    res.status(201).json({ success: true, member, message: "Family member added" });
  } catch (err) {
    sendErr(res, err, "Failed to add family member");
  }
};

// PUT /api/patients/family/:memberId
exports.updateMyFamilyMember = async (req, res) => {
  try {
    const member = await family.updateMember(req.patient.id, req.params.memberId, req.body);
    res.json({ success: true, member, message: "Family member updated" });
  } catch (err) {
    sendErr(res, err, "Failed to update family member");
  }
};

// DELETE /api/patients/family/:memberId
exports.deleteMyFamilyMember = async (req, res) => {
  try {
    await family.deleteMember(req.patient.id, req.params.memberId);
    res.json({ success: true, message: "Family member removed" });
  } catch (err) {
    sendErr(res, err, "Failed to remove family member");
  }
};

// ---------- ADMIN / RECEPTION / COFOUNDER ----------
// cofounder sends ?patient_type=old to work on new_patinet
const tableFor = (req) =>
  (req.query.patient_type || req.body?.patient_type) === "old" ? "new_patinet" : "patients";

// GET /api/admin/patients/family-lookup?mobile=9876543210[&patient_type=old]
// -> { holder, members } ; holder = null when this number is not registered yet
exports.adminFamilyLookup = async (req, res) => {
  try {
    const mobile = String(req.query.mobile || "").trim();
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return res.status(400).json({ success: false, message: "Valid 10-digit mobile required" });
    }
    const table = tableFor(req);
    const holder = await family.findHolderByMobile(mobile, table);
    const members = holder ? await family.listMembers(holder.id, table) : [];
    res.json({ success: true, holder, members, relations: family.RELATIONS });
  } catch (err) {
    sendErr(res, err, "Failed to lookup family");
  }
};

// GET /api/admin/patients/:id/family  (id can be holder OR member)
exports.adminGetFamily = async (req, res) => {
  try {
    const table = tableFor(req);
    const holderId = await family.getHolderId(req.params.id, table);
    if (!holderId) return res.status(404).json({ success: false, message: "Patient not found" });
    const [holderRows] = await pool.query(`SELECT * FROM \`${table}\` WHERE id = ?`, [holderId]);
    const members = await family.listMembers(holderId, table);
    res.json({ success: true, holder: holderRows[0], members, relations: family.RELATIONS });
  } catch (err) {
    sendErr(res, err, "Failed to load family");
  }
};

// POST /api/admin/patients/:id/family { name, relation, gender, dob, email }
exports.adminAddFamilyMember = async (req, res) => {
  try {
    const table = tableFor(req);
    const holderId = await family.getHolderId(req.params.id, table);
    if (!holderId) return res.status(404).json({ success: false, message: "Patient not found" });
    const member = await family.createMember(holderId, req.body, table);
    res.status(201).json({ success: true, member, message: "Family member added" });
  } catch (err) {
    sendErr(res, err, "Failed to add family member");
  }
};

// PUT /api/admin/patients/:id/family/:memberId
exports.adminUpdateFamilyMember = async (req, res) => {
  try {
    const table = tableFor(req);
    const holderId = await family.getHolderId(req.params.id, table);
    if (!holderId) return res.status(404).json({ success: false, message: "Patient not found" });
    const member = await family.updateMember(holderId, req.params.memberId, req.body, table);
    res.json({ success: true, member, message: "Family member updated" });
  } catch (err) {
    sendErr(res, err, "Failed to update family member");
  }
};

// DELETE /api/admin/patients/:id/family/:memberId
exports.adminDeleteFamilyMember = async (req, res) => {
  try {
    const table = tableFor(req);
    const holderId = await family.getHolderId(req.params.id, table);
    if (!holderId) return res.status(404).json({ success: false, message: "Patient not found" });
    await family.deleteMember(holderId, req.params.memberId, table);
    res.json({ success: true, message: "Family member removed" });
  } catch (err) {
    sendErr(res, err, "Failed to remove family member");
  }
};
