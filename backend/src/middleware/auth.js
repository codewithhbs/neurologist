const { verifyPatientToken } = require('../utils/jwt');

const protectPatient = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = verifyPatientToken(token);
    req.patient = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// optional auth: attaches req.patient if token present, but doesn't block
const optionalPatient = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      req.patient = verifyPatientToken(authHeader.split(' ')[1]);
    } catch (e) {
      req.patient = null;
    }
  }
  next();
};

module.exports = { protectPatient, optionalPatient };
