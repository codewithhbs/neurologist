const dayjs = require("dayjs");
const pool = require("../config/db");
const { sendBookingReminderWhatsapp } = require("../utils/sendWhatsappMessage");

const REMINDER_WINDOWS = [
  { type: "2hr", minutesBefore: 120, tolerance: 5 },
  { type: "30min", minutesBefore: 30, tolerance: 5 },
];

async function runAppointmentReminders() {
  const now = dayjs();
console.log(`Running appointment reminders at ${now.format("YYYY-MM-DD HH:mm:ss")}`);
  for (const window of REMINDER_WINDOWS) {
    const targetStart = now.add(window.minutesBefore, "minute");
    const rangeStart = targetStart.subtract(window.tolerance, "minute");
    const rangeEnd = targetStart.add(window.tolerance, "minute");

    const [rows] = await pool.query(
      `
      SELECT a.*, p.name AS patient_name, p.mobile AS patient_mobile, d.name AS doctor_name
      FROM appointments a
      JOIN patients p ON p.id = a.patient_id
      JOIN doctors d ON d.id = a.doctor_id
      WHERE a.status IN ('pending','confirmed')
        AND TIMESTAMP(a.appointment_date, a.start_time) BETWEEN ? AND ?
        AND NOT EXISTS (
          SELECT 1 FROM appointment_reminders r
          WHERE r.appointment_id = a.id AND r.reminder_type = ?
        )
      `,
      [
        rangeStart.format("YYYY-MM-DD HH:mm:ss"),
        rangeEnd.format("YYYY-MM-DD HH:mm:ss"),
        window.type,
      ],
    );
    console.log(`Found ${rows.length} appointments for ${window.type} reminder window.`);
    for (const appt of rows) {
      try {
        await sendBookingReminderWhatsapp({
          mobile: appt.patient_mobile,
          customerName: appt.patient_name,
          bookingId: appt.appointment_code,
          doctorName: appt.doctor_name,
          date: dayjs(appt.appointment_date).format("DD MMM YYYY"),
          time: dayjs(`2000-01-01 ${appt.start_time}`).format("hh:mm A"),
        });

        await pool.query(
          "INSERT INTO appointment_reminders (appointment_id, reminder_type) VALUES (?, ?)",
          [appt.id, window.type],
        );
      } catch (err) {
        console.error(`Reminder (${window.type}) failed for appt ${appt.id}:`, err.message);
      }
    }
  }
}

module.exports = { runAppointmentReminders };