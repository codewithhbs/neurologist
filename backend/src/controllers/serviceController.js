const pool = require('../config/db');
const { makeSlug } = require('../utils/helpers');

// GET /api/services
exports.getAllServices = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        s.*,
        sc.name AS category_name,
        sc.slug AS category_slug
      FROM services s
      LEFT JOIN service_categories sc 
        ON sc.id = s.category_id
      WHERE s.is_active = 1
      ORDER BY s.display_order, s.id
    `);

    // image paths -> full URLs are added centrally (middleware/imageUrl.js)
    const services = rows;

    res.json({
      success: true,
      services,
    });
  } catch (error) {
    console.error('getAllServices error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch services',
    });
  }
};

// GET /api/services/categories
exports.getCategories = async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM service_categories WHERE is_active = 1 ORDER BY display_order');
  res.json({ success: true, categories: rows });
};

// GET /api/services/:slug
exports.getServiceBySlug = async (req, res) => {
  try {
    // Service
    const [rows] = await pool.query(
      `SELECT
        s.*,
        sc.name AS category_name
       FROM services s
       LEFT JOIN service_categories sc
         ON sc.id = s.category_id
       WHERE s.slug = ?
         AND s.is_active = 1`,
      [req.params.slug]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    const service = rows[0];

    // Get ALL doctor fields
    const [doctors] = await pool.query(
      `SELECT
        d.*,
        d.consultation_fee AS service_fee,
        ds.duration_minutes AS service_duration_minutes
       FROM doctor_services ds
       JOIN doctors d
         ON d.id = ds.doctor_id
       WHERE ds.service_id = ?
         AND ds.is_active = 1
         AND d.is_active = 1`,
      [service.id]
    );

    const formattedDoctors = doctors;

    return res.json({
      success: true,
      service,
      doctors: formattedDoctors,
    });
  } catch (error) {
    console.error("getServiceBySlug error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch service",
    });
  }
};
// ---------- ADMIN ----------

exports.adminGetAllServices = async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM services ORDER BY id DESC');
  res.json({ success: true, services: rows });
};

exports.createService = async (req, res) => {
  try {
    const {
      category_id, name, short_description, description, icon_url, banner_image_url,
      base_price, duration_minutes, faqs_json, is_featured, display_order, meta_title, meta_description
    } = req.body;
    const slug = makeSlug(name);
    const [result] = await pool.query(
      `INSERT INTO services (category_id, name, slug, short_description, description, icon_url, banner_image_url, base_price, duration_minutes, faqs_json, is_featured, display_order, meta_title, meta_description)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [category_id || null, name, slug, short_description, description, icon_url, banner_image_url, base_price || 0, duration_minutes || 30, JSON.stringify(faqs_json || []), is_featured ? 1 : 0, display_order || 0, meta_title, meta_description]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create service' });
  }
};

exports.updateService = async (req, res) => {
  try {
    const fields = req.body;
    if (fields.name) fields.slug = makeSlug(fields.name);
    if (fields.faqs_json) fields.faqs_json = JSON.stringify(fields.faqs_json);
    const keys = Object.keys(fields);
    if (keys.length === 0) return res.status(400).json({ success: false, message: 'No fields to update' });
    const setClause = keys.map((k) => `${k} = ?`).join(', ');
    await pool.query(`UPDATE services SET ${setClause} WHERE id = ?`, [...keys.map((k) => fields[k]), req.params.id]);
    res.json({ success: true, message: 'Service updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update service' });
  }
};

exports.deleteService = async (req, res) => {
  await pool.query('UPDATE services SET is_active = 0 WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Service deactivated' });
};

// categories admin
exports.createCategory = async (req, res) => {
  const { name, icon_url, display_order } = req.body;
  const slug = makeSlug(name);
  const [result] = await pool.query(
    'INSERT INTO service_categories (name, slug, icon_url, display_order) VALUES (?,?,?,?)',
    [name, slug, icon_url || null, display_order || 0]
  );
  res.status(201).json({ success: true, id: result.insertId });
};
