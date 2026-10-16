const pool = require("../config/db");
const {
  generateOtp,
  storeOtp,
  verifyOtp,
  sendOtpSms,
} = require("../utils/otp");
const { signPatientToken } = require("../utils/jwt");

// POST /api/auth/send-otp { mobile }
exports.sendOtp = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Valid 10-digit mobile number required",
      });
    }

    const [patients] = await pool.query(
      `
      SELECT
        id,
        patient_id,
        name,
        father_husband_name,
        mobile,
        email,
        gender,
        dob,
        nationality,
        marital_status,
        permanent_address,
        permanent_pincode,
        local_address,
        local_pincode,
        referred_by,
        referrer_name,
        referrer_address
      FROM patients
      WHERE mobile = ? AND parent_patient_id IS NULL
      ORDER BY id ASC
      LIMIT 1
      `,
      [mobile],
    );

    const patient = patients[0] || null;

    const otp = generateOtp();

    await storeOtp(mobile, otp, "login");
    await sendOtpSms(mobile, otp);

    return res.json({
      success: true,
      message: "OTP sent successfully",
      patient,
      is_new_patient: !patient,
    });
  } catch (err) {
    console.error("Send OTP error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
};
// POST /api/auth/verify-otp
// {
//   mobile,
//   otp,
//   name?,
//   father_husband_name?,
//   email?,
//   gender?,
//   dob?,
//   nationality?,
//   marital_status?,
//   permanent_address?,
//   permanent_pincode?,
//   local_address?,
//   local_pincode?,
//   referred_by?,
//   referrer_name?,
//   referrer_address?,
//   consent_date?
// }

exports.verifyOtpAndLogin = async (req, res) => {
  try {
    const {
      mobile,
      otp,
      name,
      father_husband_name,
      email,
      gender,
      dob,
      nationality,
      marital_status,
      permanent_address,
      permanent_pincode,
      local_address,
      local_pincode,
      referred_by,
      referrer_name,
      referrer_address,
    } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({
        success: false,
        message: "Mobile and OTP required",
      });
    }

    const isValid = await verifyOtp(mobile, otp, "login");

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    let [rows] = await pool.query(
      "SELECT * FROM patients WHERE mobile = ? AND parent_patient_id IS NULL ORDER BY id ASC LIMIT 1",
      [mobile]
    );

    let patient;

    if (rows.length === 0) {
      const [result] = await pool.query(
        `
        INSERT INTO patients (
          name,
          father_husband_name,
          mobile,
          email,
          gender,
          dob,
          nationality,
          marital_status,
          permanent_address,
          permanent_pincode,
          local_address,
          local_pincode,
          referred_by,
          referrer_name,
          referrer_address
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          name?.trim() || null,
          father_husband_name?.trim() || null,
          mobile,
          email?.trim() || null,
          gender || null,
          dob || null,
          nationality?.trim() || null,
          marital_status || null,
          permanent_address?.trim() || null,
          permanent_pincode?.trim() || null,
          local_address?.trim() || null,
          local_pincode?.trim() || null,
          referred_by || null,
          referrer_name?.trim() || null,
          referrer_address?.trim() || null,
        ]
      );

      const [newRows] = await pool.query(
        "SELECT * FROM patients WHERE id = ?",
        [result.insertId]
      );

      patient = newRows[0];
    } else {
      patient = rows[0];

      await pool.query(
        `
        UPDATE patients SET
          name = COALESCE(?, name),
          father_husband_name = COALESCE(?, father_husband_name),
          email = COALESCE(?, email),
          gender = COALESCE(?, gender),
          dob = COALESCE(?, dob),
          nationality = COALESCE(?, nationality),
          marital_status = COALESCE(?, marital_status),
          permanent_address = COALESCE(?, permanent_address),
          permanent_pincode = COALESCE(?, permanent_pincode),
          local_address = COALESCE(?, local_address),
          local_pincode = COALESCE(?, local_pincode),
          referred_by = COALESCE(?, referred_by),
          referrer_name = COALESCE(?, referrer_name),
          referrer_address = COALESCE(?, referrer_address)
        WHERE id = ?
        `,
        [
          name?.trim() || null,
          father_husband_name?.trim() || null,
          email?.trim() || null,
          gender || null,
          dob || null,
          nationality?.trim() || null,
          marital_status || null,
          permanent_address?.trim() || null,
          permanent_pincode?.trim() || null,
          local_address?.trim() || null,
          local_pincode?.trim() || null,
          referred_by || null,
          referrer_name?.trim() || null,
          referrer_address?.trim() || null,
          patient.id,
        ]
      );

      const [updatedRows] = await pool.query(
        "SELECT * FROM patients WHERE id = ?",
        [patient.id]
      );

      patient = updatedRows[0];
    }

    const token = signPatientToken(patient);

    return res.json({
      success: true,
      token,
      patient,
    });
  } catch (err) {
    console.error("OTP verification error:", err);

    return res.status(500).json({
      success: false,
      message: "OTP verification failed",
    });
  }
};

exports.createPatient = async (req, res) => {
  try {
    const { name, mobile, email } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Patient name is required",
      });
    }

    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Valid 10-digit mobile number required",
      });
    }

    const [existing] = await pool.query(
      `SELECT id, name, mobile, email
       FROM patients
       WHERE mobile = ? AND parent_patient_id IS NULL
       LIMIT 1`,
      [mobile],
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Patient with this mobile number already exists",
        patient: existing[0],
      });
    }

    const [result] = await pool.query(
      `INSERT INTO patients
       (name, mobile, email)
       VALUES (?, ?, ?)`,
      [name.trim(), mobile, email?.trim() || null],
    );

    const [rows] = await pool.query(
      `SELECT *
       FROM patients
       WHERE id = ?`,
      [result.insertId],
    );

    return res.status(201).json({
      success: true,
      message: "Patient added successfully",
      patient: rows[0],
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Failed to add patient",
    });
  }
};
// GET /api/auth/me
exports.getMe = async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM patients WHERE id = ?", [
    req.patient.id,
  ]);
  if (rows.length === 0)
    return res
      .status(404)
      .json({ success: false, message: "Patient not found" });
  const [family] = await pool.query(
    "SELECT * FROM patients WHERE parent_patient_id = ? ORDER BY id ASC",
    [req.patient.id],
  );
  return res.json({ success: true, patient: rows[0], family });
};
