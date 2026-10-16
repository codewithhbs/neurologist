const router = require('express').Router();
const { protectPatient } = require('../middleware/auth');
const { invalidate } = require('../middleware/cache');

const patientController = require('../controllers/patientController');
const appointmentController = require('../controllers/appointmentController');
const paymentController = require('../controllers/paymentController');
const couponController = require('../controllers/couponController');
const reviewController = require('../controllers/reviewController');

router.use(protectPatient);

// Profile
router.put('/profile', patientController.updateProfile);
router.get('/medical-history', patientController.getMyMedicalHistory);
router.get('/prescriptions', patientController.getMyPrescriptions);
router.get('/follow-ups', patientController.getMyFollowUps);

// Family members (book for spouse/kids/parents from the same account)
router.get('/family', patientController.getMyFamily);
router.post('/family', patientController.addMyFamilyMember);
router.put('/family/:memberId', patientController.updateMyFamilyMember);
router.delete('/family/:memberId', patientController.deleteMyFamilyMember);

// Appointments
router.post('/appointments/book', invalidate('slots'), appointmentController.bookAppointment);
router.get('/appointments/my', appointmentController.getMyAppointments);
router.post('/appointments/:id/cancel', invalidate('slots'), appointmentController.cancelMyAppointment);

// Payments
router.post('/payments/create-order', paymentController.createOrder);
router.post('/payments/verify', paymentController.verifyPayment);
router.get('/payments/my', paymentController.getMyPayments);

// Coupons
router.post('/coupons/validate', couponController.validateCoupon);

// Reviews
router.post('/reviews', invalidate('reviews', 'doctors'), reviewController.submitReview);

module.exports = router;
