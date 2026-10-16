const pool = require('../config/db');
const { makeSlug, toMinutes, toHHMM } = require('../utils/helpers');
const cache = require('../utils/cache');

// Columns the admin panel is allowed to write to.
// (Previously the update built `SET ${key} = ?` straight from req.body keys,
//  which is an SQL-injection hole and also lets a typo'd field 500 the request.)
const DOCTOR_COLUMNS = [
  'name',
  'slug',
  'qualification',
  'specialization',
  'bio',
  'experience_years',
  'rating',
  'photo_url',
  'registration_no',
  'consultation_fee',
  'meta_title',
  'meta_description',
  'is_active',
  'display_order'
];

// Anything that changes a doctor also changes the pages/lists they appear on.
const DOCTOR_NAMESPACES = ['doctors', 'clinics', 'services', 'slots', 'seo'];

const bustDoctorCache = async (label = '') => {
  const list = await cache.bumpMany(DOCTOR_NAMESPACES);
  if (list.length) console.log(`♻️  [cache] doctor ${label} -> invalidated: ${list.join(', ')}`);
};

// GET /api/doctors  (public, active only)
exports.getAllDoctors = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
        d.*, 
        GROUP_CONCAT(DISTINCT c.name) AS clinic_names 
       FROM doctors d 
       LEFT JOIN doctor_clinics dc 
         ON dc.doctor_id = d.id 
         AND dc.is_active = 1 
       LEFT JOIN clinics c 
         ON c.id = dc.clinic_id 
       WHERE d.is_active = 1 
       GROUP BY d.id 
       ORDER BY d.id`
    );

    const doctors = rows;

    res.json({ success: true, doctors });
  } catch (error) {
    console.error('getAllDoctors error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch doctors' });
  }
};

// GET /api/doctors/:slug
// Public doctor detail with clinics + services + reviews
exports.getDoctorBySlug = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM doctors WHERE slug = ? AND is_active = 1`,
      [req.params.slug]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const doctor = rows[0];

    const [clinics] = await pool.query(
      `SELECT c.id, c.name, c.slug, c.address, dc.weekly_availability
       FROM doctor_clinics dc
       JOIN clinics c ON c.id = dc.clinic_id
       WHERE dc.doctor_id = ? AND dc.is_active = 1`,
      [doctor.id]
    );

const [services] = await pool.query(
  `SELECT s.id, s.name, s.slug, s.short_description,
          s.icon_url, s.banner_image_url,
          ds.duration_minutes
   FROM doctor_services ds
   JOIN services s ON s.id = ds.service_id
   WHERE ds.doctor_id = ? AND ds.is_active = 1 AND s.is_active = 1`,
  [doctor.id]
);

    const [reviews] = await pool.query(
      `SELECT id, patient_name, rating, review_text, created_at
       FROM reviews
       WHERE doctor_id = ? AND is_approved = 1
       ORDER BY created_at DESC
       LIMIT 10`,
      [doctor.id]
    );
    return res.json({ success: true, doctor, clinics, services, reviews });
  } catch (error) {
    console.error('getDoctorBySlug error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor',
      error: error.message
    });
  }
};

// ---------- ADMIN ----------

exports.adminGetAllDoctors = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM doctors ORDER BY id DESC');
    res.json({ success: true, doctors: rows });
  } catch (err) {
    console.error('adminGetAllDoctors error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch doctors' });
  }
};

exports.adminGetDoctorById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM doctors WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Doctor not found' });
    const [clinics] = await pool.query('SELECT * FROM doctor_clinics WHERE doctor_id = ?', [req.params.id]);
    const [services] = await pool.query('SELECT * FROM doctor_services WHERE doctor_id = ?', [req.params.id]);
    res.json({ success: true, doctor: rows[0], clinics, services });
  } catch (err) {
    console.error('adminGetDoctorById error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch doctor' });
  }
};

exports.createDoctor = async (req, res) => {
  try {
    const {
      name, qualification, specialization, bio, experience_years, rating,
      photo_url, registration_no, consultation_fee, meta_title, meta_description
    } = req.body;

    if (!name) return res.status(400).json({ success: false, message: 'name is required' });

    const slug = makeSlug(name);
    const [result] = await pool.query(
      `INSERT INTO doctors (name, slug, qualification, specialization, bio, experience_years, rating, photo_url, registration_no, consultation_fee, meta_title, meta_description)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [name, slug, qualification, specialization, bio, experience_years || 0, rating || 4.8, photo_url, registration_no, consultation_fee || 0, meta_title, meta_description]
    );

    await bustDoctorCache(`create #${result.insertId}`);

    const [rows] = await pool.query('SELECT * FROM doctors WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, id: result.insertId, doctor: rows[0] });
  } catch (err) {
    console.error('createDoctor error:', err);
    res.status(500).json({ success: false, message: 'Failed to create doctor' });
  }
};

exports.updateDoctor = async (req, res) => {
  try {
    const id = req.params.id;
    const body = { ...req.body };

    // regenerate the slug whenever the name changes
    if (body.name) body.slug = makeSlug(body.name);

    // whitelist: ignore unknown keys instead of injecting them into SQL
    const keys = Object.keys(body).filter((k) => DOCTOR_COLUMNS.includes(k));
    if (keys.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    const setClause = keys.map((k) => `\`${k}\` = ?`).join(', ');
    const values = keys.map((k) => body[k]);

    const [result] = await pool.query(`UPDATE doctors SET ${setClause} WHERE id = ?`, [...values, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    // invalidate BEFORE responding, so the very next GET is guaranteed fresh
    await bustDoctorCache(`update #${id}`);

    const [rows] = await pool.query('SELECT * FROM doctors WHERE id = ?', [id]);
    res.json({ success: true, message: 'Doctor updated', doctor: rows[0] });
  } catch (err) {
    console.error('updateDoctor error:', err);
    res.status(500).json({ success: false, message: 'Failed to update doctor' });
  }
};

exports.deleteDoctor = async (req, res) => {
  try {
    await pool.query('UPDATE doctors SET is_active = 0 WHERE id = ?', [req.params.id]);
    await bustDoctorCache(`delete #${req.params.id}`);
    res.json({ success: true, message: 'Doctor deactivated' });
  } catch (err) {
    console.error('deleteDoctor error:', err);
    res.status(500).json({ success: false, message: 'Failed to deactivate doctor' });
  }
};

// doctor <-> clinic mapping with weekly availability
exports.setDoctorClinic = async (req, res) => {
  try {
    const { clinic_id, weekly_availability } = req.body;
    const doctor_id = req.params.id;
    await pool.query(
      `INSERT INTO doctor_clinics (doctor_id, clinic_id, weekly_availability)
       VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE weekly_availability = VALUES(weekly_availability), is_active = 1`,
      [doctor_id, clinic_id, JSON.stringify(weekly_availability || {})]
    );
    await bustDoctorCache(`clinic-map #${doctor_id}`);
    res.json({ success: true, message: 'Doctor-clinic availability saved' });
  } catch (err) {
    console.error('setDoctorClinic error:', err);
    res.status(500).json({ success: false, message: 'Failed to save availability' });
  }
};

exports.removeDoctorClinic = async (req, res) => {
  try {
    await pool.query('UPDATE doctor_clinics SET is_active = 0 WHERE doctor_id = ? AND clinic_id = ?', [
      req.params.id,
      req.params.clinicId
    ]);
    await bustDoctorCache(`clinic-unmap #${req.params.id}`);
    res.json({ success: true, message: 'Doctor removed from clinic' });
  } catch (err) {
    console.error('removeDoctorClinic error:', err);
    res.status(500).json({ success: false, message: 'Failed to remove doctor from clinic' });
  }
};

// doctor-wise service fee mapping
exports.setDoctorService = async (req, res) => {
  try {
    const { service_id, fee, duration_minutes } = req.body;
    const doctor_id = req.params.id;
    await pool.query(
      `INSERT INTO doctor_services (doctor_id, service_id, fee, duration_minutes)
       VALUES (?,?,?,?)
       ON DUPLICATE KEY UPDATE fee = VALUES(fee), duration_minutes = VALUES(duration_minutes), is_active = 1`,
      [doctor_id, service_id, fee, duration_minutes || null]
    );
    await bustDoctorCache(`service-map #${doctor_id}`);
    res.json({ success: true, message: 'Doctor service fee saved' });
  } catch (err) {
    console.error('setDoctorService error:', err);
    res.status(500).json({ success: false, message: 'Failed to save doctor service' });
  }
};

// doctor leaves
exports.addDoctorLeave = async (req, res) => {
  try {
    const { leave_date, clinic_id, reason } = req.body;
    await pool.query('INSERT INTO doctor_leaves (doctor_id, leave_date, clinic_id, reason) VALUES (?,?,?,?)', [
      req.params.id,
      leave_date,
      clinic_id || null,
      reason || null
    ]);
    await cache.bumpMany(['slots', 'doctors']);
    res.status(201).json({ success: true, message: 'Leave added' });
  } catch (err) {
    console.error('addDoctorLeave error:', err);
    res.status(500).json({ success: false, message: 'Failed to add leave' });
  }
};

exports.getDoctorLeaves = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM doctor_leaves WHERE doctor_id = ? ORDER BY leave_date', [req.params.id]);
    res.json({ success: true, leaves: rows });
  } catch (err) {
    console.error('getDoctorLeaves error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch leaves' });
  }
};

exports.deleteDoctorLeave = async (req, res) => {
  try {
    await pool.query('DELETE FROM doctor_leaves WHERE id = ? AND doctor_id = ?', [req.params.leaveId, req.params.id]);
    await cache.bumpMany(['slots', 'doctors']);
    res.json({ success: true, message: 'Leave removed' });
  } catch (err) {
    console.error('deleteDoctorLeave error:', err);
    res.status(500).json({ success: false, message: 'Failed to remove leave' });
  }
};

// ---------- slot-level blocking (block a particular time window, not the whole day) ----------

// POST /api/admin/doctors/:id/slot-blocks  { clinic_id?, block_date, start_time, end_time?, reason? }
// end_time is optional — if you only want to block a single time (e.g. just 11:30),
// leave it blank and it defaults to start_time + 1 minute, which blocks exactly that slot.
exports.addSlotBlock = async (req, res) => {
  try {
    const { clinic_id, block_date, start_time, end_time, reason } = req.body;
    if (!block_date || !start_time) {
      return res.status(400).json({ success: false, message: 'block_date and start_time are required' });
    }
    const finalEndTime = end_time || toHHMM(toMinutes(start_time) + 1);
    if (start_time >= finalEndTime) {
      return res.status(400).json({ success: false, message: 'end_time must be after start_time' });
    }
    const [result] = await pool.query(
      `INSERT INTO doctor_slot_blocks (doctor_id, clinic_id, block_date, start_time, end_time, reason)
       VALUES (?,?,?,?,?,?)`,
      [req.params.id, clinic_id || null, block_date, start_time, finalEndTime, reason || null]
    );
    await cache.bumpMany(['slots', 'doctors']);
    res.status(201).json({ success: true, id: result.insertId, message: 'Slot blocked' });
  } catch (err) {
    console.error('addSlotBlock error:', err);
    res.status(500).json({ success: false, message: 'Failed to block slot' });
  }
};

// GET /api/admin/doctors/:id/slot-blocks?date=YYYY-MM-DD (date optional)
exports.getSlotBlocks = async (req, res) => {
  try {
    const { date } = req.query;
    const params = [req.params.id];
    let where = 'doctor_id = ?';
    if (date) {
      where += ' AND block_date = ?';
      params.push(date);
    }
    const [rows] = await pool.query(
      `SELECT * FROM doctor_slot_blocks WHERE ${where} ORDER BY block_date, start_time`,
      params
    );
    res.json({ success: true, blocks: rows });
  } catch (err) {
    console.error('getSlotBlocks error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch slot blocks' });
  }
};

// DELETE /api/admin/doctors/:id/slot-blocks/:blockId
exports.deleteSlotBlock = async (req, res) => {
  try {
    await pool.query('DELETE FROM doctor_slot_blocks WHERE id = ? AND doctor_id = ?', [req.params.blockId, req.params.id]);
    await cache.bumpMany(['slots', 'doctors']);
    res.json({ success: true, message: 'Slot block removed' });
  } catch (err) {
    console.error('deleteSlotBlock error:', err);
    res.status(500).json({ success: false, message: 'Failed to remove slot block' });
  }
};