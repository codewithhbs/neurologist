const pool = require("../config/db");

// GET /api/reviews?doctor_id=&clinic_id=&limit=
exports.getPublicReviews = async (req, res) => {
  const { doctor_id, clinic_id, featured } = req.query;
  let where = "is_approved = 1";
  const params = [];
  if (doctor_id) {
    where += " AND doctor_id = ?";
    params.push(doctor_id);
  }
  if (clinic_id) {
    where += " AND clinic_id = ?";
    params.push(clinic_id);
  }
  if (featured) {
    where += " AND is_featured = 1";
  }
  const [rows] = await pool.query(
    `SELECT id, patient_name, rating, review_text, created_at FROM reviews WHERE ${where} ORDER BY created_at DESC LIMIT 50`,
    params,
  );
  const [avgRows] = await pool.query(
    `SELECT AVG(rating) AS avg_rating, COUNT(*) AS total FROM reviews WHERE ${where}`,
    params,
  );
  res.json({
    success: true,
    reviews: rows,
    avg_rating: avgRows[0].avg_rating,
    total: avgRows[0].total,
  });
};

// POST /api/reviews (patient auth) { doctor_id, clinic_id, rating, review_text }
exports.submitReview = async (req, res) => {
  try {
    const { doctor_id, clinic_id, rating, review_text } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ success: false, message: "Rating must be between 1 and 5" });
    }
    const [patientRows] = await pool.query(
      "SELECT name FROM patients WHERE id = ?",
      [req.patient.id],
    );
    const [result] = await pool.query(
      `INSERT INTO reviews (patient_id, doctor_id, clinic_id, patient_name, rating, review_text, source)
       VALUES (?,?,?,?,?,?,'website')`,
      [
        req.patient.id,
        doctor_id || null,
        clinic_id || null,
        patientRows[0]?.name || "Patient",
        rating,
        review_text || null,
      ],
    );
    res
      .status(201)
      .json({
        success: true,
        id: result.insertId,
        message: "Review submitted, pending approval",
      });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Failed to submit review" });
  }
};

// ---------- ADMIN ----------
exports.adminGetAllReviews = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT r.*, d.name AS doctor_name, c.name AS clinic_name FROM reviews r
     LEFT JOIN doctors d ON d.id = r.doctor_id
     LEFT JOIN clinics c ON c.id = r.clinic_id
     ORDER BY r.created_at DESC`,
  );
  res.json({ success: true, reviews: rows });
};

exports.adminCreateReview = async (req, res) => {
  const {
    patient_name,
    doctor_id,
    clinic_id,
    rating,
    review_text,
    is_approved,
    is_featured,
  } = req.body;
  const [result] = await pool.query(
    `INSERT INTO reviews (patient_name, doctor_id, clinic_id, rating, review_text, is_approved, is_featured, source)
     VALUES (?,?,?,?,?,?,?,'manual')`,
    [
      patient_name,
      doctor_id || null,
      clinic_id || null,
      rating,
      review_text || null,
      is_approved ? 1 : 0,
      is_featured ? 1 : 0,
    ],
  );
  res.status(201).json({ success: true, id: result.insertId });
};

exports.adminUpdateReview = async (req, res) => {
  const fields = req.body;
  const keys = Object.keys(fields);
  if (keys.length === 0)
    return res
      .status(400)
      .json({ success: false, message: "No fields to update" });
  const setClause = keys.map((k) => `${k} = ?`).join(", ");
  await pool.query(`UPDATE reviews SET ${setClause} WHERE id = ?`, [
    ...keys.map((k) => fields[k]),
    req.params.id,
  ]);
  res.json({ success: true, message: "Review updated" });
};

exports.adminDeleteReview = async (req, res) => {
  await pool.query("DELETE FROM reviews WHERE id = ?", [req.params.id]);
  res.json({ success: true, message: "Review deleted" });
};
