const pool = require('../config/db');

// GET /api/admin/receptionists
exports.adminGetAllReceptionists = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT r.*, c.name AS clinic_name FROM receptionists r
     LEFT JOIN clinics c ON c.id = r.clinic_id ORDER BY r.id DESC`
  );
  res.json({ success: true, receptionists: rows });
};

// POST /api/admin/receptionists { name, mobile, clinic_id }
exports.adminCreateReceptionist = async (req, res) => {
  try {
    const { name, mobile, clinic_id } = req.body;
    if (!name || !/^[6-9]\d{9}$/.test(mobile || '')) {
      return res.status(400).json({ success: false, message: 'Name and valid 10-digit mobile required' });
    }
    const [result] = await pool.query(
      'INSERT INTO receptionists (name, mobile, clinic_id) VALUES (?,?,?)',
      [name, mobile, clinic_id || null]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'This mobile number is already registered as staff' });
    }
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create receptionist' });
  }
};

// PUT /api/admin/receptionists/:id { name, mobile, clinic_id, is_active }
exports.adminUpdateReceptionist = async (req, res) => {
  const fields = req.body;
  const keys = Object.keys(fields);
  if (keys.length === 0) return res.status(400).json({ success: false, message: 'No fields to update' });
  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  await pool.query(`UPDATE receptionists SET ${setClause} WHERE id = ?`, [...keys.map((k) => fields[k]), req.params.id]);
  res.json({ success: true, message: 'Receptionist updated' });
};

// DELETE /api/admin/receptionists/:id (soft-deactivate)
exports.adminDeleteReceptionist = async (req, res) => {
  await pool.query('UPDATE receptionists SET is_active = 0 WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Receptionist deactivated' });
};

// ---------- RECEPTIONIST'S OWN DASHBOARD (logged-in receptionist only) ----------

// GET /api/admin/receptionist/dashboard
exports.getMyDashboard = async (req, res) => {
  const receptionistId = req.admin.id;

  const [[todayBookings]] = await pool.query(
    `SELECT COUNT(*) AS count FROM appointments
     WHERE created_by_receptionist_id = ? AND appointment_date = CURDATE() AND status != 'cancelled'`,
    [receptionistId]
  );
  const [[totalBookings]] = await pool.query(
    `SELECT COUNT(*) AS count FROM appointments WHERE created_by_receptionist_id = ? AND status != 'cancelled'`,
    [receptionistId]
  );
  const [[todayCash]] = await pool.query(
    `SELECT COALESCE(SUM(amount),0) AS total FROM payments
     WHERE collected_by_receptionist_id = ? AND status = 'paid' AND method = 'cash' AND DATE(created_at) = CURDATE()`,
    [receptionistId]
  );
  const [[totalCash]] = await pool.query(
    `SELECT COALESCE(SUM(amount),0) AS total FROM payments
     WHERE collected_by_receptionist_id = ? AND status = 'paid' AND method = 'cash'`,
    [receptionistId]
  );
  const [[totalCollectedAllModes]] = await pool.query(
    `SELECT COALESCE(SUM(amount),0) AS total FROM payments
     WHERE collected_by_receptionist_id = ? AND status = 'paid'`,
    [receptionistId]
  );
  const [byMethod] = await pool.query(
    `SELECT method, COUNT(*) AS count, COALESCE(SUM(amount),0) AS total FROM payments
     WHERE collected_by_receptionist_id = ? AND status = 'paid' GROUP BY method`,
    [receptionistId]
  );

  res.json({
    success: true,
    stats: {
      todayBookings: todayBookings.count,
      totalBookings: totalBookings.count,
      todayCashCollected: todayCash.total,
      totalCashCollected: totalCash.total,
      totalCollectedAllModes: totalCollectedAllModes.total
    },
    collectionByMethod: byMethod
  });
};

// GET /api/admin/receptionist/appointments?date=&status=&from=&to=  -- bookings done by ME
exports.getMyAppointments = async (req, res) => {
  const receptionistId = req.admin.id;
  const { date, status, from, to } = req.query;
  let where = 'a.created_by_receptionist_id = ?';
  const params = [receptionistId];
  if (date) { where += ' AND a.appointment_date = ?'; params.push(date); }
  if (from) { where += ' AND a.appointment_date >= ?'; params.push(from); }
  if (to) { where += ' AND a.appointment_date <= ?'; params.push(to); }
  if (status) { where += ' AND a.status = ?'; params.push(status); }

  const [rows] = await pool.query(
    `SELECT a.*, p.name AS patient_name, p.mobile AS patient_mobile, d.name AS doctor_name, s.name AS service_name, c.name AS clinic_name
     FROM appointments a
     JOIN patients p ON p.id = a.patient_id
     JOIN doctors d ON d.id = a.doctor_id
     LEFT JOIN services s ON s.id = a.service_id
     JOIN clinics c ON c.id = a.clinic_id
     WHERE ${where}
     ORDER BY a.appointment_date DESC, a.start_time DESC`,
    params
  );
  res.json({ success: true, appointments: rows });
};

// GET /api/admin/receptionist/payments -- cash/card/upi collected by ME
exports.getMyCollections = async (req, res) => {
  const receptionistId = req.admin.id;
  const [rows] = await pool.query(
    `SELECT pay.*, a.appointment_code, a.appointment_date, p.name AS patient_name, p.mobile AS patient_mobile
     FROM payments pay
     JOIN appointments a ON a.id = pay.appointment_id
     JOIN patients p ON p.id = pay.patient_id
     WHERE pay.collected_by_receptionist_id = ?
     ORDER BY pay.created_at DESC`,
    [receptionistId]
  );
  res.json({ success: true, payments: rows });
};