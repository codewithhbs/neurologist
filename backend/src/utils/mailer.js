const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

const sendMail = async ({ to, subject, html }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`✉️ [DEV MAIL SKIPPED] to=${to} subject=${subject}`);
    return;
  }
  try {
    await transporter.sendMail({ from: process.env.SMTP_FROM, to, subject, html });
  } catch (e) {
    console.error('Email send failed:', e.message);
  }
};

const appointmentConfirmationHtml = (appt) => `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
    <h2 style="color:#1d4ed8">Appointment Confirmed ✅</h2>
    <p>Dear ${appt.patient_name || 'Patient'},</p>
    <p>Your appointment at <b>Neurocare Clinic</b> is confirmed.</p>
    <table style="width:100%;border-collapse:collapse;margin-top:12px">
      <tr><td style="padding:6px 0;color:#555">Appointment ID</td><td style="text-align:right"><b>${appt.appointment_code}</b></td></tr>
      <tr><td style="padding:6px 0;color:#555">Service</td><td style="text-align:right">${appt.service_name}</td></tr>
      <tr><td style="padding:6px 0;color:#555">Doctor</td><td style="text-align:right">${appt.doctor_name}</td></tr>
      <tr><td style="padding:6px 0;color:#555">Date & Time</td><td style="text-align:right">${appt.appointment_date} ${appt.start_time}</td></tr>
      <tr><td style="padding:6px 0;color:#555">Amount</td><td style="text-align:right">₹${appt.final_amount}</td></tr>
    </table>
    <p style="margin-top:16px;color:#555">For queries call 9716590959 / +91 8527271759.</p>
  </div>
`;

module.exports = { sendMail, appointmentConfirmationHtml };
