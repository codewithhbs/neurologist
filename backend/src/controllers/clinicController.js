const pool = require('../config/db');
const { makeSlug } = require('../utils/helpers');

// GET /api/clinics
exports.getAllClinics = async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM clinics WHERE is_active = 1 ORDER BY id');
  res.json({ success: true, clinics: rows });
};

// GET /api/clinics/:slug
exports.getClinicBySlug = async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM clinics WHERE slug = ? AND is_active = 1', [req.params.slug]);
  if (rows.length === 0) return res.status(404).json({ success: false, message: 'Clinic not found' });
  res.json({ success: true, clinic: rows[0] });
};

// ---------- ADMIN ----------

// GET /api/admin/clinics
exports.adminGetAllClinics = async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM clinics ORDER BY id DESC');
  res.json({ success: true, clinics: rows });
};

// POST /api/admin/clinics
exports.createClinic = async (req, res) => {
  try {
    const {
      name, address, city, state, pincode, lat, lng, phone,
      appointment_number, whatsapp_number, email, timing_json, slot_duration_minutes
    } = req.body;
    const slug = makeSlug(name);
    const [result] = await pool.query(
      `INSERT INTO clinics (name, slug, address, city, state, pincode, lat, lng, phone, appointment_number, whatsapp_number, email, timing_json, slot_duration_minutes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [name, slug, address, city, state, pincode, lat || null, lng || null, phone, appointment_number, whatsapp_number, email, JSON.stringify(timing_json || {}), slot_duration_minutes || 30]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create clinic' });
  }
};

// PUT /api/admin/clinics/:id
exports.updateClinic = async (req, res) => {
  try {
    const fields = req.body;
    if (fields.timing_json) fields.timing_json = JSON.stringify(fields.timing_json);
    if (fields.name) fields.slug = makeSlug(fields.name);
    const keys = Object.keys(fields);
    if (keys.length === 0) return res.status(400).json({ success: false, message: 'No fields to update' });
    const setClause = keys.map((k) => `${k} = ?`).join(', ');
    await pool.query(`UPDATE clinics SET ${setClause} WHERE id = ?`, [...keys.map((k) => fields[k]), req.params.id]);
    res.json({ success: true, message: 'Clinic updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update clinic' });
  }
};

// DELETE /api/admin/clinics/:id
exports.deleteClinic = async (req, res) => {
  await pool.query('UPDATE clinics SET is_active = 0 WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Clinic deactivated' });
};

// ---------- HOLIDAYS ----------

// GET /api/admin/clinics/:id/holidays
exports.getClinicHolidays = async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM clinic_holidays WHERE clinic_id = ? ORDER BY holiday_date', [req.params.id]);
  res.json({ success: true, holidays: rows });
};

// POST /api/admin/clinics/:id/holidays { holiday_date, reason }
exports.addClinicHoliday = async (req, res) => {
  try {
    const { holiday_date, reason } = req.body;
    await pool.query('INSERT INTO clinic_holidays (clinic_id, holiday_date, reason) VALUES (?,?,?)', [
      req.params.id,
      holiday_date,
      reason || null
    ]);
    res.status(201).json({ success: true, message: 'Holiday added' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add holiday (maybe duplicate date)' });
  }
};

exports.deleteClinicHoliday = async (req, res) => {
  await pool.query('DELETE FROM clinic_holidays WHERE id = ? AND clinic_id = ?', [req.params.holidayId, req.params.id]);
  res.json({ success: true, message: 'Holiday removed' });
};
