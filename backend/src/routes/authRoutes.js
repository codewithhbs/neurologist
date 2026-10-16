const router = require('express').Router();
const authController = require('../controllers/authController');
const { protectPatient } = require('../middleware/auth');

router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtpAndLogin);
router.get('/me', protectPatient, authController.getMe);

module.exports = router;
