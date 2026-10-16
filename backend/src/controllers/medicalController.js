const pool = require('../config/db');

// patient_type/appointment_type controls which table pair is used.
// Default (no param) = ORIGINAL behavior, unchanged: medical_history / prescriptions.
// "old" = old_medical_history / old_prescriptions (paired with old_appointments / new_patinet).
const historyTable = (type) => (type === 'old' ? 'old_medical_history' : 'medical_history');
const prescriptionTable = (type) => (type === 'old' ? 'old_prescriptions' : 'prescriptions');

// ---------- MEDICAL HISTORY ----------
exports.createHistory = async (req, res) => {
  const {
    patient_id,
    appointment_id,
    doctor_id,
    title,
    diagnosis,
    treatment_notes,
    attachment_urls,
    visit_date,
    patient_type,
  } = req.body;

  const table = historyTable(patient_type);

  const [result] = await pool.query(
    `INSERT INTO \`${table}\` (patient_id, appointment_id, doctor_id, title, diagnosis, treatment_notes, attachment_urls, visit_date)
     VALUES (?,?,?,?,?,?,?,?)`,
    [
      patient_id,
      appointment_id || null,
      doctor_id || null,
      title,
      diagnosis,
      treatment_notes,
      JSON.stringify(attachment_urls || []),
      visit_date,
    ],
  );
  res.status(201).json({ success: true, id: result.insertId });
};

exports.updateHistory = async (req, res) => {
  const { patient_type, ...fields } = req.body;
  const table = historyTable(patient_type);

  if (fields.attachment_urls) fields.attachment_urls = JSON.stringify(fields.attachment_urls);
  const keys = Object.keys(fields);
  if (keys.length === 0) return res.status(400).json({ success: false, message: 'No fields' });

  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  await pool.query(
    `UPDATE \`${table}\` SET ${setClause} WHERE id = ?`,
    [...keys.map((k) => fields[k]), req.params.id],
  );
  res.json({ success: true, message: 'History updated' });
};

exports.deleteHistory = async (req, res) => {
  const table = historyTable(req.query.patient_type || req.body.patient_type);
  await pool.query(`DELETE FROM \`${table}\` WHERE id = ?`, [req.params.id]);
  res.json({ success: true, message: 'History deleted' });
};

// ---------- PRESCRIPTIONS ----------
exports.createPrescription = async (req, res) => {
  const {
    patient_id,
    appointment_id,
    doctor_id,
    medicines_json,
    notes,
    pdf_url,
    attachment_urls,
    prescribed_date,
    patient_type,
  } = req.body;

  const table = prescriptionTable(patient_type);

  const [result] = await pool.query(
    `INSERT INTO \`${table}\` (patient_id, appointment_id, doctor_id, medicines_json, notes, pdf_url, attachment_urls, prescribed_date)
     VALUES (?,?,?,?,?,?,?,?)`,
    [
      patient_id,
      appointment_id || null,
      doctor_id || null,
      JSON.stringify(medicines_json || []),
      notes,
      pdf_url || null,
      JSON.stringify(attachment_urls || []),
      prescribed_date,
    ],
  );
  res.status(201).json({ success: true, id: result.insertId });
};

exports.updatePrescription = async (req, res) => {
  const { patient_type, ...fields } = req.body;
  const table = prescriptionTable(patient_type);

  if (fields.medicines_json) fields.medicines_json = JSON.stringify(fields.medicines_json);
  if (fields.attachment_urls) fields.attachment_urls = JSON.stringify(fields.attachment_urls);
  const keys = Object.keys(fields);
  if (keys.length === 0) return res.status(400).json({ success: false, message: 'No fields' });

  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  await pool.query(
    `UPDATE \`${table}\` SET ${setClause} WHERE id = ?`,
    [...keys.map((k) => fields[k]), req.params.id],
  );
  res.json({ success: true, message: 'Prescription updated' });
};

exports.deletePrescription = async (req, res) => {
  const table = prescriptionTable(req.query.patient_type || req.body.patient_type);
  await pool.query(`DELETE FROM \`${table}\` WHERE id = ?`, [req.params.id]);
  res.json({ success: true, message: 'Prescription deleted' });
};

// ---------- FOLLOW-UPS ---------- (unchanged — patients/appointments only, no type param)
exports.adminGetAllFollowUps = async (req, res) => {
  const { status, date } = req.query;
  let where = '1=1';
  const params = [];
  if (status) { where += ' AND f.status = ?'; params.push(status); }
  if (date) { where += ' AND f.follow_up_date = ?'; params.push(date); }
  const [rows] = await pool.query(
    `SELECT f.*, p.name AS patient_name, p.mobile AS patient_mobile, d.name AS doctor_name
     FROM follow_ups f JOIN patients p ON p.id = f.patient_id LEFT JOIN doctors d ON d.id = f.doctor_id
     WHERE ${where} ORDER BY f.follow_up_date`, params
  );
  res.json({ success: true, followUps: rows });
};

exports.createFollowUp = async (req, res) => {
  const { patient_id, appointment_id, doctor_id, follow_up_date, notes } = req.body;
  const [result] = await pool.query(
    `INSERT INTO follow_ups (patient_id, appointment_id, doctor_id, follow_up_date, notes) VALUES (?,?,?,?,?)`,
    [patient_id, appointment_id || null, doctor_id || null, follow_up_date, notes]
  );
  res.status(201).json({ success: true, id: result.insertId });
};

exports.updateFollowUp = async (req, res) => {
  const fields = req.body;
  const keys = Object.keys(fields);
  if (keys.length === 0) return res.status(400).json({ success: false, message: 'No fields' });
  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  await pool.query(`UPDATE follow_ups SET ${setClause} WHERE id = ?`, [...keys.map((k) => fields[k]), req.params.id]);
  res.json({ success: true, message: 'Follow-up updated' });
};

exports.deleteFollowUp = async (req, res) => {
  await pool.query('DELETE FROM follow_ups WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Follow-up deleted' });
};