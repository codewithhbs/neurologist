const pool = require('../config/db');
const { makeSlug } = require('../utils/helpers');

// GET /api/offers (public)
exports.getPublicOffers = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT o.*, c.code AS coupon_code, c.discount_type, c.discount_value FROM offers o
     LEFT JOIN coupons c ON c.id = o.coupon_id
     WHERE o.is_active = 1 AND (o.valid_till IS NULL OR o.valid_till >= CURDATE())
     ORDER BY o.id DESC`
  );
  res.json({ success: true, offers: rows });
};

// POST /api/coupons/validate { code, service_id, amount } (patient auth)
exports.validateCoupon = async (req, res) => {
  const { code, service_id, amount } = req.body;
  const [rows] = await pool.query(
    `SELECT * FROM coupons WHERE code = ? AND is_active = 1
     AND (valid_from IS NULL OR valid_from <= CURDATE())
     AND (valid_till IS NULL OR valid_till >= CURDATE())`,
    [code]
  );
  if (rows.length === 0) return res.status(400).json({ success: false, message: 'Invalid or expired coupon' });
  const coupon = rows[0];

  if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
    return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
  }
  const [usageRows] = await pool.query('SELECT COUNT(*) AS cnt FROM coupon_usages WHERE coupon_id = ? AND patient_id = ?', [
    coupon.id, req.patient.id
  ]);
  if (usageRows[0].cnt >= coupon.per_patient_limit) {
    return res.status(400).json({ success: false, message: 'You have already used this coupon' });
  }
  if (amount < parseFloat(coupon.min_amount)) {
    return res.status(400).json({ success: false, message: `Minimum amount ₹${coupon.min_amount} required` });
  }
  const applicableIds = coupon.applicable_service_ids
    ? (typeof coupon.applicable_service_ids === 'string' ? JSON.parse(coupon.applicable_service_ids) : coupon.applicable_service_ids)
    : null;
  if (applicableIds && applicableIds.length && service_id && !applicableIds.includes(parseInt(service_id, 10))) {
    return res.status(400).json({ success: false, message: 'Coupon not applicable to this service' });
  }

  let discount = coupon.discount_type === 'flat' ? parseFloat(coupon.discount_value) : (amount * parseFloat(coupon.discount_value)) / 100;
  if (coupon.max_discount) discount = Math.min(discount, parseFloat(coupon.max_discount));
  discount = Math.min(discount, amount);

  res.json({ success: true, coupon, discount, final_amount: Math.max(0, amount - discount) });
};

// ---------- ADMIN: Coupons ----------
exports.adminGetAllCoupons = async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM coupons ORDER BY id DESC');
  res.json({ success: true, coupons: rows });
};

exports.createCoupon = async (req, res) => {
  try {
    const {
      code, title, description, discount_type, discount_value, max_discount,
      min_amount, usage_limit, per_patient_limit, applicable_service_ids, valid_from, valid_till
    } = req.body;
    const [result] = await pool.query(
      `INSERT INTO coupons (code, title, description, discount_type, discount_value, max_discount, min_amount, usage_limit, per_patient_limit, applicable_service_ids, valid_from, valid_till)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [code.toUpperCase(), title, description, discount_type, discount_value, max_discount || null, min_amount || 0, usage_limit || null, per_patient_limit || 1, JSON.stringify(applicable_service_ids || null), valid_from || null, valid_till || null]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create coupon (code may already exist)' });
  }
};

exports.updateCoupon = async (req, res) => {
  const fields = req.body;
  if (fields.code) fields.code = fields.code.toUpperCase();
  if (fields.applicable_service_ids) fields.applicable_service_ids = JSON.stringify(fields.applicable_service_ids);
  const keys = Object.keys(fields);
  if (keys.length === 0) return res.status(400).json({ success: false, message: 'No fields to update' });
  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  await pool.query(`UPDATE coupons SET ${setClause} WHERE id = ?`, [...keys.map((k) => fields[k]), req.params.id]);
  res.json({ success: true, message: 'Coupon updated' });
};

exports.deleteCoupon = async (req, res) => {
  await pool.query('UPDATE coupons SET is_active = 0 WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Coupon deactivated' });
};

// ---------- ADMIN: Offers ----------
exports.adminGetAllOffers = async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM offers ORDER BY id DESC');
  res.json({ success: true, offers: rows });
};

exports.createOffer = async (req, res) => {
  const { title, description, image_url, coupon_id, valid_from, valid_till } = req.body;
  const slug = makeSlug(title) + '-' + Date.now().toString().slice(-5);
  const [result] = await pool.query(
    `INSERT INTO offers (title, slug, description, image_url, coupon_id, valid_from, valid_till) VALUES (?,?,?,?,?,?,?)`,
    [title, slug, description, image_url, coupon_id || null, valid_from || null, valid_till || null]
  );
  res.status(201).json({ success: true, id: result.insertId });
};

exports.updateOffer = async (req, res) => {
  const fields = req.body;
  const keys = Object.keys(fields);
  if (keys.length === 0) return res.status(400).json({ success: false, message: 'No fields to update' });
  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  await pool.query(`UPDATE offers SET ${setClause} WHERE id = ?`, [...keys.map((k) => fields[k]), req.params.id]);
  res.json({ success: true, message: 'Offer updated' });
};

exports.deleteOffer = async (req, res) => {
  await pool.query('UPDATE offers SET is_active = 0 WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Offer deactivated' });
};
