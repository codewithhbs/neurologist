// Cofounder bypass auth.
// No login form, no JWT — just a static secret key set in .env (COFOUNDER_SECRET_KEY).
// Sends the key as header: x-cofounder-key
// On success, req.admin is set with role 'superadmin' so every existing
// admin controller (which reads req.admin.role) works without changes.
const protectCofounder = (req, res, next) => {
  const key = req.headers['x-cofounder-key'];
  const expected = process.env.COFOUNDER_SECRET_KEY;

  if (!expected) {
    return res.status(500).json({ success: false, message: 'COFOUNDER_SECRET_KEY not configured on server' });
  }
  if (!key || key !== expected) {
    return res.status(401).json({ success: false, message: 'Invalid cofounder key' });
  }

  req.admin = { id: 0, email: 'cofounder', role: 'superadmin' };
  next();
};

module.exports = { protectCofounder };