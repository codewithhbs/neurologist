const pool = require('../config/db');
const { toUrl } = require('../utils/imageUrl');

// GET /api/settings (public - key-value site settings like phone, email, social links)
exports.getPublicSettings = async (req, res) => {
  const [rows] = await pool.query('SELECT setting_key, setting_value, setting_type FROM site_settings');
  const settings = {};
  rows.forEach((r) => {
    settings[r.setting_key] =
      r.setting_type === 'json' ? JSON.parse(r.setting_value || 'null')
      : r.setting_type === 'image' ? toUrl(r.setting_value, req)
      : r.setting_value;
  });
  res.json({ success: true, settings });
};

// GET /api/cms/:pageKey (public)
exports.getCmsPage = async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM cms_pages WHERE page_key = ?', [req.params.pageKey]);
  if (rows.length === 0) return res.status(404).json({ success: false, message: 'Page not found' });
  const page = rows[0];
  page.content_json = typeof page.content_json === 'string' ? JSON.parse(page.content_json) : page.content_json;
  res.json({ success: true, page });
};

// GET /api/seo/:entityType/:entityId (public, used by generateMetadata on frontend)
exports.getSeoMeta = async (req, res) => {
  const { entityType, entityId } = req.params;
  const [rows] = await pool.query('SELECT * FROM seo_meta WHERE entity_type = ? AND entity_id = ?', [entityType, entityId]);
  if (rows.length === 0) return res.json({ success: true, seo: null });
  res.json({ success: true, seo: rows[0] });
};

// ---------- ADMIN ----------
exports.adminGetAllSettings = async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM site_settings ORDER BY setting_key');
  res.json({ success: true, settings: rows });
};

// PUT /api/admin/settings  { key, value, type }  - upsert
exports.upsertSetting = async (req, res) => {
  const { key, value, type } = req.body;
  const storedValue = type === 'json' ? JSON.stringify(value) : value;
  await pool.query(
    `INSERT INTO site_settings (setting_key, setting_value, setting_type) VALUES (?,?,?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), setting_type = VALUES(setting_type)`,
    [key, storedValue, type || 'text']
  );
  res.json({ success: true, message: 'Setting saved' });
};

exports.adminGetAllCmsPages = async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM cms_pages ORDER BY page_key');
  res.json({ success: true, pages: rows });
};

// PUT /api/admin/cms/:pageKey - upsert
exports.upsertCmsPage = async (req, res) => {
  const { title, content_json, meta_title, meta_description } = req.body;
  await pool.query(
    `INSERT INTO cms_pages (page_key, title, content_json, meta_title, meta_description) VALUES (?,?,?,?,?)
     ON DUPLICATE KEY UPDATE title=VALUES(title), content_json=VALUES(content_json), meta_title=VALUES(meta_title), meta_description=VALUES(meta_description)`,
    [req.params.pageKey, title, JSON.stringify(content_json || {}), meta_title, meta_description]
  );
  res.json({ success: true, message: 'CMS page saved' });
};

// PUT /api/admin/seo - upsert seo meta for an entity
exports.upsertSeoMeta = async (req, res) => {
  const { entity_type, entity_id, path, meta_title, meta_description, og_image, canonical_url, schema_json } = req.body;
  const [existing] = await pool.query(
    'SELECT id FROM seo_meta WHERE entity_type = ? AND (entity_id = ? OR (entity_id IS NULL AND ? IS NULL))',
    [entity_type, entity_id || null, entity_id || null]
  );
  if (existing.length) {
    await pool.query(
      `UPDATE seo_meta SET meta_title=?, meta_description=?, og_image=?, canonical_url=?, schema_json=?, path=? WHERE id=?`,
      [meta_title, meta_description, og_image, canonical_url, JSON.stringify(schema_json || null), path || null, existing[0].id]
    );
  } else {
    await pool.query(
      `INSERT INTO seo_meta (entity_type, entity_id, path, meta_title, meta_description, og_image, canonical_url, schema_json)
       VALUES (?,?,?,?,?,?,?,?)`,
      [entity_type, entity_id || null, path || null, meta_title, meta_description, og_image, canonical_url, JSON.stringify(schema_json || null)]
    );
  }
  res.json({ success: true, message: 'SEO meta saved' });
};
