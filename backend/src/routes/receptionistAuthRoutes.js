const router = require('express').Router();
const receptionistAuthController = require('../controllers/receptionistAuthController');
const { protectAdmin } = require('../middleware/adminAuth');

router.post('/send-otp', receptionistAuthController.sendOtp);
router.post('/verify-otp', receptionistAuthController.verifyOtpAndLogin);
router.get('/me', protectAdmin, receptionistAuthController.getMe);

module.exports = router;
