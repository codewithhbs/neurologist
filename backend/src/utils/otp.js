const dayjs = require("dayjs");
const pool = require("../config/db");
const redisClient = require("../config/redis");
const { sendOtpWhatsapp } = require("./sendWhatsappMessage");
require("dotenv").config();

const OTP_EXPIRY = parseInt(process.env.OTP_EXPIRY_MINUTES || "5", 10);

// const generateOtp = () =>
//   Math.floor(100000 + Math.random() * 900000).toString();
const generateOtp = () => 123456;

// Store OTP in Redis (fast) with DB row as durable fallback/audit trail
const storeOtp = async (mobile, otp, purpose = "login") => {
  const key = `otp:${purpose}:${mobile}`;
  try {
    if (redisClient.isOpen) {
      await redisClient.set(key, otp, { EX: OTP_EXPIRY * 60 });
    }
  } catch (e) {
    console.error("Redis set OTP failed, relying on DB:", e.message);
  }
  const expiresAt = dayjs()
    .add(OTP_EXPIRY, "minute")
    .format("YYYY-MM-DD HH:mm:ss");
  await pool.query(
    "INSERT INTO otp_requests (mobile, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?)",
    [mobile, otp, purpose, expiresAt],
  );
};

const verifyOtp = async (mobile, otp, purpose = "login") => {
  const key = `otp:${purpose}:${mobile}`;
  try {
    if (redisClient.isOpen) {
      const cached = await redisClient.get(key);
      if (cached && cached === otp) {
        await redisClient.del(key);
        // mark latest DB row used too (best-effort)
        await pool.query(
          `UPDATE otp_requests SET is_used = 1 WHERE mobile = ? AND otp_code = ? AND purpose = ? ORDER BY id DESC LIMIT 1`,
          [mobile, otp, purpose],
        );
        return true;
      }
    }
  } catch (e) {
    console.error("Redis verify OTP failed, falling back to DB:", e.message);
  }

  // DB fallback verification
  const [rows] = await pool.query(
    `SELECT * FROM otp_requests WHERE mobile = ? AND otp_code = ? AND purpose = ? AND is_used = 0 AND expires_at >= NOW() ORDER BY id DESC LIMIT 1`,
    [mobile, otp, purpose],
  );
  if (rows.length === 0) return false;
  await pool.query("UPDATE otp_requests SET is_used = 1 WHERE id = ?", [
    rows[0].id,
  ]);
  return true;
};

// Pluggable SMS sender. Default 'console' provider just logs (dev mode).
const sendOtpSms = async (mobile, otp) => {
  const provider = process.env.OTP_PROVIDER || "console";

  if (provider === "console") {
    return true;
  }

  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Sending OTP via WhatsApp to ${mobile}: ${otp}`);
      await sendOtpWhatsapp(mobile, otp);
      return true;
    } catch (error) {
      console.error(
        `Attempt ${attempt} to send OTP via WhatsApp failed:`,
        error.message,
      );
      if (attempt === MAX_RETRIES) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
};

module.exports = { generateOtp, storeOtp, verifyOtp, sendOtpSms };
