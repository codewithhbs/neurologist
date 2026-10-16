const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { signAdminToken } = require('../utils/jwt');

// POST /api/admin/auth/login { email, password }
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }
    const [rows] = await pool.query('SELECT * FROM admin_users WHERE email = ? AND is_active = 1', [email]);
    if (rows.length === 0) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const admin = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    await pool.query('UPDATE admin_users SET last_login = NOW() WHERE id = ?', [admin.id]);
    const token = signAdminToken(admin);
    delete admin.password;
    return res.json({ success: true, token, admin });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Login failed' });
  }
};

// GET /api/admin/auth/me
exports.getMe = async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, name, email, role, is_active, last_login FROM admin_users WHERE id = ?',
    [req.admin.id]
  );
  if (rows.length === 0) return res.status(404).json({ success: false, message: 'Admin not found' });
  return res.json({ success: true, admin: rows[0] });
};
