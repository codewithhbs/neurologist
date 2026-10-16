const pool = require('../config/db');

// GET /api/onboarding-slides (public, used by mobile app)
exports.getPublicSlides = async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, title, subtitle, image_url, display_order FROM onboarding_slides WHERE is_active = 1 ORDER BY display_order, id'
  );
  res.json({ success: true, slides: rows });
};

// ---------- ADMIN ----------
exports.adminGetAllSlides = async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM onboarding_slides ORDER BY display_order, id');
  res.json({ success: true, slides: rows });
};

exports.createSlide = async (req, res) => {
  const { title, subtitle, image_url, display_order } = req.body;
  if (!title || !image_url) return res.status(400).json({ success: false, message: 'Title and image_url are required' });
  const [result] = await pool.query(
    'INSERT INTO onboarding_slides (title, subtitle, image_url, display_order) VALUES (?,?,?,?)',
    [title, subtitle || null, image_url, display_order || 0]
  );
  res.status(201).json({ success: true, id: result.insertId });
};

exports.updateSlide = async (req, res) => {
  const fields = req.body;
  const keys = Object.keys(fields);
  if (keys.length === 0) return res.status(400).json({ success: false, message: 'No fields to update' });
  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  await pool.query(`UPDATE onboarding_slides SET ${setClause} WHERE id = ?`, [...keys.map((k) => fields[k]), req.params.id]);
  res.json({ success: true, message: 'Slide updated' });
};

exports.deleteSlide = async (req, res) => {
  await pool.query('DELETE FROM onboarding_slides WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Slide deleted' });
};
