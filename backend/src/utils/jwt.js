const jwt = require('jsonwebtoken');
require('dotenv').config();

const signPatientToken = (patient) =>
  jwt.sign({ id: patient.id, mobile: patient.mobile, role: 'patient' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });

const signAdminToken = (admin) =>
  jwt.sign({ id: admin.id, email: admin.email, role: admin.role }, process.env.ADMIN_JWT_SECRET, {
    expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '7d'
  });

// receptionist reuses admin secret + protectAdmin middleware, role='receptionist'
const signReceptionistToken = (receptionist) =>
  jwt.sign(
    { id: receptionist.id, mobile: receptionist.mobile, clinic_id: receptionist.clinic_id, role: 'receptionist' },
    process.env.ADMIN_JWT_SECRET,
    { expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '7d' }
  );

const verifyPatientToken = (token) => jwt.verify(token, process.env.JWT_SECRET);
const verifyAdminToken = (token) => jwt.verify(token, process.env.ADMIN_JWT_SECRET);

module.exports = {
  signPatientToken, signAdminToken, signReceptionistToken,
  verifyPatientToken, verifyAdminToken
};