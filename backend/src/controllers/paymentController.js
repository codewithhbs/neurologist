const crypto = require('crypto');
const Razorpay = require('razorpay');
const pool = require('../config/db');
const { sendMail, appointmentConfirmationHtml } = require('../utils/mailer');
require('dotenv').config();

let razorpayInstance = null;
function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret || key_id.includes('xxxx') || key_id.includes('your_')) {
    throw new Error('Razorpay keys (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are not properly configured');
  }
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({ key_id, key_secret });
  }
  return razorpayInstance;
}

// POST /api/payments/create-order  { appointment_id }  (patient auth)
exports.createOrder = async (req, res) => {
  try {
    const { appointment_id } = req.body;

    let razorpay;
    try {
      razorpay = getRazorpay();
    } catch (rzpErr) {
      console.warn('[Payment] Razorpay not configured:', rzpErr.message);
      return res.status(503).json({ success: false, message: rzpErr.message });
    }

    // holder can pay for own + family members' appointments
    const [rows] = await pool.query(
      `SELECT a.* FROM appointments a JOIN patients p ON p.id = a.patient_id
       WHERE a.id = ? AND (p.id = ? OR p.parent_patient_id = ?)`,
      [appointment_id, req.patient.id, req.patient.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Appointment not found' });
    const appt = rows[0];

    if (appt.payment_status === 'paid') {
      return res.status(400).json({ success: false, message: 'Already paid' });
    }
    if (appt.is_free) {
      return res.status(400).json({ success: false, message: 'This appointment is free, no payment needed' });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(parseFloat(appt.final_amount) * 100), // paise
      currency: 'INR',
      receipt: appt.appointment_code,
      notes: { appointment_id: String(appt.id) }
    });

    await pool.query(
      `INSERT INTO payments (appointment_id, patient_id, razorpay_order_id, amount, status)
       VALUES (?,?,?,?, 'created')`,
      [appt.id, appt.patient_id, order.id, appt.final_amount]
    );

    res.json({
      success: true,
      order,
      key_id: process.env.RAZORPAY_KEY_ID,
      appointment_code: appt.appointment_code
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to create payment order' });
  }
};

// POST /api/payments/verify  { razorpay_order_id, razorpay_payment_id, razorpay_signature }
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(503).json({ success: false, message: 'RAZORPAY_KEY_SECRET is not configured' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      await pool.query('UPDATE payments SET status = "failed" WHERE razorpay_order_id = ?', [razorpay_order_id]);
      return res.status(400).json({ success: false, message: 'Payment signature verification failed' });
    }

    const [payRows] = await pool.query('SELECT * FROM payments WHERE razorpay_order_id = ?', [razorpay_order_id]);
    if (payRows.length === 0) return res.status(404).json({ success: false, message: 'Payment record not found' });
    const payment = payRows[0];

    await pool.query(
      `UPDATE payments SET razorpay_payment_id = ?, razorpay_signature = ?, status = 'paid' WHERE id = ?`,
      [razorpay_payment_id, razorpay_signature, payment.id]
    );
    await pool.query(`UPDATE appointments SET payment_status = 'paid', status = 'confirmed' WHERE id = ?`, [
      payment.appointment_id
    ]);

    const [fullRows] = await pool.query(
      `SELECT a.*, p.name AS patient_name, p.email AS patient_email, d.name AS doctor_name, s.name AS service_name
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       JOIN doctors d ON d.id = a.doctor_id
       LEFT JOIN services s ON s.id = a.service_id
       WHERE a.id = ?`,
      [payment.appointment_id]
    );
    const appt = fullRows[0];
    if (appt?.patient_email) {
      sendMail({
        to: appt.patient_email,
        subject: `Payment Received - ${appt.appointment_code}`,
        html: appointmentConfirmationHtml(appt)
      });
    }

    res.json({ success: true, message: 'Payment verified successfully', appointment: appt });
  } catch (err) {
    console.error('Verify payment error:', err);
    res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
};

// POST /api/payments/webhook  (Razorpay server-to-server webhook, raw body needed)
exports.webhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers['x-razorpay-signature'];
      const expected = crypto.createHmac('sha256', webhookSecret).update(req.body).digest('hex');
      if (signature !== expected) return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }
    const payload = JSON.parse(req.body);
    if (payload.event === 'payment.captured') {
      const orderId = payload.payload.payment.entity.order_id;
      await pool.query('UPDATE payments SET status = "paid" WHERE razorpay_order_id = ?', [orderId]);
      const [payRows] = await pool.query('SELECT appointment_id FROM payments WHERE razorpay_order_id = ?', [orderId]);
      if (payRows.length) {
        await pool.query(`UPDATE appointments SET payment_status = 'paid', status = 'confirmed' WHERE id = ?`, [
          payRows[0].appointment_id
        ]);
      }
    }
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ success: false });
  }
};

// GET /api/payments/my (patient auth)
exports.getMyPayments = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT pay.*, a.appointment_code, a.appointment_date, s.name AS service_name,
            pt.name AS patient_name, pt.relation AS patient_relation
     FROM payments pay
     JOIN appointments a ON a.id = pay.appointment_id
     JOIN patients pt ON pt.id = pay.patient_id
     LEFT JOIN services s ON s.id = a.service_id
     WHERE (pt.id = ? OR pt.parent_patient_id = ?) ORDER BY pay.created_at DESC`,
    [req.patient.id, req.patient.id]
  );
  res.json({ success: true, payments: rows });
};

// ---------- ADMIN / RECEPTIONIST ----------
exports.adminGetAllPayments = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT pay.*, a.appointment_code, p.name AS patient_name, p.mobile AS patient_mobile
     FROM payments pay
     JOIN appointments a ON a.id = pay.appointment_id
     JOIN patients p ON p.id = pay.patient_id
     ORDER BY pay.created_at DESC`
  );
  res.json({ success: true, payments: rows });
};

// POST /api/admin/appointments/:id/collect-payment { method }  -- collect cash/card/upi at clinic desk
exports.adminCollectPayment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const method = req.body.method || 'cash';

    const [apptRows] = await pool.query('SELECT * FROM appointments WHERE id = ?', [appointmentId]);
    if (apptRows.length === 0) return res.status(404).json({ success: false, message: 'Appointment not found' });
    const appt = apptRows[0];

    if (appt.payment_status === 'paid') {
      return res.status(400).json({ success: false, message: 'Already paid' });
    }

    const collectedByReceptionist = req.admin?.role === 'receptionist' ? req.admin.id : null;

    const [existingPay] = await pool.query('SELECT * FROM payments WHERE appointment_id = ? ORDER BY id DESC LIMIT 1', [appointmentId]);
    if (existingPay.length) {
      await pool.query(
        `UPDATE payments SET status = 'paid', method = ?, collected_by_receptionist_id = ? WHERE id = ?`,
        [method, collectedByReceptionist, existingPay[0].id]
      );
    } else {
      await pool.query(
        `INSERT INTO payments (appointment_id, patient_id, amount, method, status, collected_by_receptionist_id)
         VALUES (?,?,?,?, 'paid', ?)`,
        [appointmentId, appt.patient_id, appt.final_amount, method, collectedByReceptionist]
      );
    }

    await pool.query(`UPDATE appointments SET payment_status = 'paid', status = 'confirmed' WHERE id = ?`, [appointmentId]);

    res.json({ success: true, message: 'Payment collected & marked paid' });
  } catch (err) {
    console.error('Collect payment error:', err);
    res.status(500).json({ success: false, message: 'Failed to collect payment' });
  }
};
