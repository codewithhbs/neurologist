const pool = require('../config/db');
const { generateOtp, storeOtp, verifyOtp, sendOtpSms } = require('../utils/otp');
const { signReceptionistToken } = require('../utils/jwt');

// POST /api/reception/auth/send-otp { mobile }
exports.sendOtp = async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
      return res.status(400).json({ success: false, message: 'Valid 10-digit mobile number required' });
    }

    const [rows] = await pool.query(
      'SELECT id, name, mobile, clinic_id, is_active FROM receptionists WHERE mobile = ? LIMIT 1',
      [mobile]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'This number is not registered as staff. Contact admin.' });
    }
    if (!rows[0].is_active) {
      return res.status(403).json({ success: false, message: 'This staff account is deactivated. Contact admin.' });
    }

    const otp = generateOtp();
    await storeOtp(mobile, otp, 'reception_login');
    await sendOtpSms(mobile, otp);
    return res.json({ success: true, message: 'OTP sent successfully', receptionist: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

// POST /api/reception/auth/verify-otp { mobile, otp }
exports.verifyOtpAndLogin = async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    if (!mobile || !otp) {
      return res.status(400).json({ success: false, message: 'Mobile and OTP required' });
    }
    const isValid = await verifyOtp(mobile, otp, 'reception_login');
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const [rows] = await pool.query('SELECT * FROM receptionists WHERE mobile = ?', [mobile]);
    if (rows.length === 0 || !rows[0].is_active) {
      return res.status(403).json({ success: false, message: 'Staff account not found or inactive' });
    }
    const receptionist = rows[0];
    await pool.query('UPDATE receptionists SET last_login = NOW() WHERE id = ?', [receptionist.id]);

    const token = signReceptionistToken(receptionist);
    return res.json({ success: true, token, receptionist });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'OTP verification failed' });
  }
};

// GET /api/reception/auth/me (protectAdmin, role=receptionist)
exports.getMe = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT r.*, c.name AS clinic_name FROM receptionists r
     LEFT JOIN clinics c ON c.id = r.clinic_id WHERE r.id = ?`,
    [req.admin.id]
  );
  if (rows.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
  return res.json({ success: true, receptionist: rows[0] });
};
