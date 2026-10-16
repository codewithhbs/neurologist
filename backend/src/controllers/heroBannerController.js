const pool = require('../config/db');

// GET /api/hero-banners (public, used in website hero section)
exports.getPublicBanners = async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, title, subtitle, image_url, cta_text, cta_link, display_order, is_mobile FROM hero_banners WHERE is_active = 1 ORDER BY display_order, id'
  );
  res.json({ success: true, banners: rows });
};

// ---------- ADMIN ----------
exports.adminGetAllBanners = async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM hero_banners ORDER BY display_order, id');
  res.json({ success: true, banners: rows });
};

exports.createBanner = async (req, res) => {
  const { title, subtitle, image_url, cta_text, cta_link, display_order, is_mobile } = req.body;
  if (!image_url) return res.status(400).json({ success: false, message: 'image_url is required' });
  const [result] = await pool.query(
    'INSERT INTO hero_banners (title, subtitle, image_url, cta_text, cta_link, display_order, is_mobile) VALUES (?,?,?,?,?,?,?)',
    [title || null, subtitle || null, image_url, cta_text || null, cta_link || null, display_order || 0, is_mobile ? 1 : 0]
  );
  res.status(201).json({ success: true, id: result.insertId });
};

exports.updateBanner = async (req, res) => {
  const fields = req.body;
  const keys = Object.keys(fields);
  if (keys.length === 0) return res.status(400).json({ success: false, message: 'No fields to update' });
  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  await pool.query(`UPDATE hero_banners SET ${setClause} WHERE id = ?`, [...keys.map((k) => fields[k]), req.params.id]);
  res.json({ success: true, message: 'Banner updated' });
};

exports.deleteBanner = async (req, res) => {
  await pool.query('DELETE FROM hero_banners WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Banner deleted' });
};
