const pool = require('../config/db');

// GET /api/admin/dashboard
exports.getDashboard = async (req, res) => {
  const [[todayAppts]] = await pool.query(
    `SELECT COUNT(*) AS count FROM appointments WHERE appointment_date = CURDATE() AND status NOT IN ('cancelled')`
  );
  const [[totalPatients]] = await pool.query('SELECT COUNT(*) AS count FROM patients');
  const [[monthRevenue]] = await pool.query(
    `SELECT COALESCE(SUM(final_amount),0) AS total FROM appointments
     WHERE payment_status = 'paid' AND MONTH(appointment_date) = MONTH(CURDATE()) AND YEAR(appointment_date) = YEAR(CURDATE())`
  );
  const [[pendingAppts]] = await pool.query(`SELECT COUNT(*) AS count FROM appointments WHERE status = 'pending'`);
  const [upcoming] = await pool.query(
    `SELECT a.*, p.name AS patient_name, p.mobile, d.name AS doctor_name, s.name AS service_name
     FROM appointments a JOIN patients p ON p.id=a.patient_id JOIN doctors d ON d.id=a.doctor_id LEFT JOIN services s ON s.id=a.service_id
     WHERE a.appointment_date >= CURDATE() AND a.status IN ('pending','confirmed')
     ORDER BY a.appointment_date, a.start_time LIMIT 10`
  );
  const [lowStock] = await pool.query('SELECT * FROM medicines WHERE stock_qty <= reorder_level LIMIT 5');
  const [revenueTrend] = await pool.query(
    `SELECT DATE(appointment_date) AS date, SUM(final_amount) AS revenue FROM appointments
     WHERE payment_status = 'paid' AND appointment_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
     GROUP BY DATE(appointment_date) ORDER BY date`
  );
  const [topServices] = await pool.query(
    `SELECT s.name, COUNT(*) AS bookings FROM appointments a LEFT JOIN services s ON s.id=a.service_id
     WHERE a.status != 'cancelled' GROUP BY s.id ORDER BY bookings DESC LIMIT 5`
  );

  res.json({
    success: true,
    stats: {
      todayAppointments: todayAppts.count,
      totalPatients: totalPatients.count,
      monthRevenue: monthRevenue.total,
      pendingAppointments: pendingAppts.count
    },
    upcoming,
    lowStock,
    revenueTrend,
    topServices
  });
};

// GET /api/admin/reports/revenue?from=&to=
exports.revenueReport = async (req, res) => {
  const { from, to } = req.query;
  const [rows] = await pool.query(
    `SELECT a.appointment_code, a.appointment_date, a.final_amount, a.payment_status, p.name AS patient_name, d.name AS doctor_name, c.name AS clinic_name
     FROM appointments a
     JOIN patients p ON p.id=a.patient_id JOIN doctors d ON d.id=a.doctor_id JOIN clinics c ON c.id=a.clinic_id
     WHERE a.appointment_date BETWEEN ? AND ? ORDER BY a.appointment_date`,
    [from || '1970-01-01', to || '2999-12-31']
  );
  const total = rows.filter((r) => r.payment_status === 'paid').reduce((s, r) => s + parseFloat(r.final_amount), 0);
  res.json({ success: true, records: rows, total });
};

// GET /api/admin/reports/doctor-performance
exports.doctorPerformance = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT d.id, d.name, COUNT(a.id) AS total_appointments,
       SUM(CASE WHEN a.status='completed' THEN 1 ELSE 0 END) AS completed,
       SUM(CASE WHEN a.status='cancelled' THEN 1 ELSE 0 END) AS cancelled,
       COALESCE(SUM(CASE WHEN a.payment_status='paid' THEN a.final_amount ELSE 0 END),0) AS revenue
     FROM doctors d LEFT JOIN appointments a ON a.doctor_id = d.id
     GROUP BY d.id ORDER BY total_appointments DESC`
  );
  res.json({ success: true, doctors: rows });
};
