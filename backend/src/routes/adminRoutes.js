const router = require('express').Router();
const { protectAdmin, allowRoles } = require('../middleware/adminAuth');
const { autoInvalidate } = require('../middleware/cache');
const { upload, setFolder } = require('../config/cloudinary');

const adminAuthController = require('../controllers/adminAuthController');
const clinicController = require('../controllers/clinicController');
const doctorController = require('../controllers/doctorController');
const serviceController = require('../controllers/serviceController');
const appointmentController = require('../controllers/appointmentController');
const paymentController = require('../controllers/paymentController');
const couponController = require('../controllers/couponController');
const blogController = require('../controllers/blogController');
const reviewController = require('../controllers/reviewController');
const patientController = require('../controllers/patientController');
const medicalController = require('../controllers/medicalController');
const inventoryController = require('../controllers/inventoryController');
const settingsController = require('../controllers/settingsController');
const uploadController = require('../controllers/uploadController');
const reportController = require('../controllers/reportController');
const onboardingController = require('../controllers/onboardingController');
const heroBannerController = require('../controllers/heroBannerController');
const cacheController = require('../controllers/cacheController');
const receptionistController = require('../controllers/receptionistController');

// ---- Auth (login is public, rest protected) ----
router.post('/auth/login', adminAuthController.login);
router.get('/auth/me', protectAdmin, adminAuthController.getMe);

// everything below requires admin token (admin OR receptionist)
router.use(protectAdmin);

// SAFETY NET: every successful non-GET admin request automatically invalidates
// the Redis namespaces its path touches. Unmapped paths clear everything.
// This is why a doctor edit can never leave stale doctor data in the cache.
router.use(autoInvalidate());

// ---- Dashboard & Reports ----
router.get('/dashboard', reportController.getDashboard);
router.get('/reports/revenue', reportController.revenueReport);
router.get('/reports/doctor-performance', reportController.doctorPerformance);

// ---- Clinics ----
router.get('/clinics', clinicController.adminGetAllClinics);
router.post('/clinics', allowRoles('superadmin', 'manager'), clinicController.createClinic);
router.put('/clinics/:id', allowRoles('superadmin', 'manager'), clinicController.updateClinic);
router.delete('/clinics/:id', allowRoles('superadmin'), clinicController.deleteClinic);
router.get('/clinics/:id/holidays', clinicController.getClinicHolidays);
router.post('/clinics/:id/holidays', allowRoles('superadmin', 'manager'), clinicController.addClinicHoliday);
router.delete('/clinics/:id/holidays/:holidayId', allowRoles('superadmin', 'manager'), clinicController.deleteClinicHoliday);

// ---- Doctors ----
router.get('/doctors', doctorController.adminGetAllDoctors);
router.get('/doctors/:id', doctorController.adminGetDoctorById);
router.post('/doctors', allowRoles('superadmin', 'manager'), doctorController.createDoctor);
router.put('/doctors/:id', allowRoles('superadmin', 'manager'), doctorController.updateDoctor);
router.delete('/doctors/:id', allowRoles('superadmin'), doctorController.deleteDoctor);
router.post('/doctors/:id/clinics', allowRoles('superadmin', 'manager'), doctorController.setDoctorClinic);
router.delete('/doctors/:id/clinics/:clinicId', allowRoles('superadmin', 'manager'), doctorController.removeDoctorClinic);
router.post('/doctors/:id/services', allowRoles('superadmin', 'manager'), doctorController.setDoctorService);
router.get('/doctors/:id/leaves', doctorController.getDoctorLeaves);
router.post('/doctors/:id/leaves', allowRoles('superadmin', 'manager', 'frontdesk'), doctorController.addDoctorLeave);
router.delete('/doctors/:id/leaves/:leaveId', allowRoles('superadmin', 'manager'), doctorController.deleteDoctorLeave);
router.get('/doctors/:id/slot-blocks', doctorController.getSlotBlocks);
router.post('/doctors/:id/slot-blocks', allowRoles('superadmin', 'manager', 'frontdesk'), doctorController.addSlotBlock);
router.delete('/doctors/:id/slot-blocks/:blockId', allowRoles('superadmin', 'manager'), doctorController.deleteSlotBlock);

// ---- Services ----
router.get('/services', serviceController.adminGetAllServices);
router.post('/services', allowRoles('superadmin', 'manager'), serviceController.createService);
router.put('/services/:id', allowRoles('superadmin', 'manager'), serviceController.updateService);
router.delete('/services/:id', allowRoles('superadmin'), serviceController.deleteService);
router.post('/services/categories', allowRoles('superadmin', 'manager'), serviceController.createCategory);

// ---- Appointments (admin + receptionist) ----
router.get('/appointments/available-slots', appointmentController.adminGetAvailableSlots);
router.get('/appointments', appointmentController.adminGetAppointments);
router.get('/appointments/grouped', appointmentController.adminGetAppointmentsGrouped);
router.get('/appointments/:id', appointmentController.adminGetAppointmentById);
router.post('/appointments', appointmentController.adminCreateAppointment);
router.put('/appointments/:id', appointmentController.adminUpdateAppointment);
router.put('/appointments/:id/status', appointmentController.adminUpdateStatus);
router.post('/appointments/:id/send-reminder', appointmentController.sendManualReminder);

// ---- Reception In / Out visit timer ----
router.get('/visit-timer/settings', appointmentController.getVisitTimerSettings);
router.get('/appointments/in-clinic/live', appointmentController.getInClinicLive);
router.post('/appointments/:id/check-in', appointmentController.checkInAppointment);
router.post('/appointments/:id/check-out', appointmentController.checkOutAppointment);
router.put('/appointments/:id/timer', appointmentController.updateVisitTimer);
router.post('/appointments/:id/undo-check-in', appointmentController.undoCheckIn);


// ---- Payments (admin + receptionist) ----
router.get('/payments', paymentController.adminGetAllPayments);
router.post('/appointments/:id/collect-payment', paymentController.adminCollectPayment);

// ---- Coupons & Offers ----
router.get('/coupons', couponController.adminGetAllCoupons);
router.post('/coupons', allowRoles('superadmin', 'manager'), couponController.createCoupon);
router.put('/coupons/:id', allowRoles('superadmin', 'manager'), couponController.updateCoupon);
router.delete('/coupons/:id', allowRoles('superadmin'), couponController.deleteCoupon);
router.get('/offers', couponController.adminGetAllOffers);
router.post('/offers', allowRoles('superadmin', 'manager'), couponController.createOffer);
router.put('/offers/:id', allowRoles('superadmin', 'manager'), couponController.updateOffer);
router.delete('/offers/:id', allowRoles('superadmin'), couponController.deleteOffer);

// ---- Blogs ----
router.get('/blogs', blogController.adminGetAllBlogs);
router.post('/blogs', allowRoles('superadmin', 'manager'), blogController.createBlog);
router.put('/blogs/:id', allowRoles('superadmin', 'manager'), blogController.updateBlog);
router.delete('/blogs/:id', allowRoles('superadmin'), blogController.deleteBlog);
router.post('/blogs/categories', allowRoles('superadmin', 'manager'), blogController.createCategory);

// ---- Reviews ----
router.get('/reviews', reviewController.adminGetAllReviews);
router.post('/reviews', allowRoles('superadmin', 'manager'), reviewController.adminCreateReview);
router.put('/reviews/:id', allowRoles('superadmin', 'manager'), reviewController.adminUpdateReview);
router.delete('/reviews/:id', allowRoles('superadmin'), reviewController.adminDeleteReview);

// ---- Patients (admin + receptionist) ----
router.get('/patients', patientController.adminGetAllPatients);
router.get('/patients/family-lookup', patientController.adminFamilyLookup);
router.get('/patients/:id/family', patientController.adminGetFamily);
router.post('/patients/:id/family', patientController.adminAddFamilyMember);
router.put('/patients/:id/family/:memberId', patientController.adminUpdateFamilyMember);
router.delete('/patients/:id/family/:memberId', allowRoles('superadmin', 'manager', 'frontdesk', 'receptionist'), patientController.adminDeleteFamilyMember);
router.get('/patients/:id', patientController.adminGetPatientById);
router.put('/patients/:id', allowRoles('superadmin', 'manager', 'frontdesk', 'receptionist'), patientController.adminUpdatePatient);

// ---- Medical: History / Prescriptions / Follow-ups (admin + receptionist) ----
router.post('/medical-history', medicalController.createHistory);
router.put('/medical-history/:id', medicalController.updateHistory);
router.delete('/medical-history/:id', allowRoles('superadmin', 'manager'), medicalController.deleteHistory);

router.post('/prescriptions', medicalController.createPrescription);
router.put('/prescriptions/:id', medicalController.updatePrescription);
router.delete('/prescriptions/:id', allowRoles('superadmin', 'manager'), medicalController.deletePrescription);

router.get('/follow-ups', medicalController.adminGetAllFollowUps);
router.post('/follow-ups', medicalController.createFollowUp);
router.put('/follow-ups/:id', medicalController.updateFollowUp);
router.delete('/follow-ups/:id', allowRoles('superadmin', 'manager'), medicalController.deleteFollowUp);

// ---- Inventory ----
router.get('/medicines', inventoryController.getAllMedicines);
router.get('/medicines/low-stock', inventoryController.getLowStockMedicines);
router.post('/medicines', allowRoles('superadmin', 'manager'), inventoryController.createMedicine);
router.put('/medicines/:id', allowRoles('superadmin', 'manager'), inventoryController.updateMedicine);
router.delete('/medicines/:id', allowRoles('superadmin', 'manager'), inventoryController.deleteMedicine);

router.get('/equipment', inventoryController.getAllEquipment);
router.post('/equipment', allowRoles('superadmin', 'manager'), inventoryController.createEquipment);
router.put('/equipment/:id', allowRoles('superadmin', 'manager'), inventoryController.updateEquipment);
router.delete('/equipment/:id', allowRoles('superadmin', 'manager'), inventoryController.deleteEquipment);

// ---- Settings / CMS / SEO ----
router.get('/settings', settingsController.adminGetAllSettings);
router.put('/settings', allowRoles('superadmin', 'manager'), settingsController.upsertSetting);
router.get('/cms', settingsController.adminGetAllCmsPages);
router.put('/cms/:pageKey', allowRoles('superadmin', 'manager'), settingsController.upsertCmsPage);
router.put('/seo', allowRoles('superadmin', 'manager'), settingsController.upsertSeoMeta);

// ---- Upload (Cloudinary) ----
router.post('/upload/:folder', (req, res, next) => { req.uploadFolder = req.params.folder; next(); }, upload.single('file'), uploadController.uploadFile);
router.post('/upload/:folder/multiple', (req, res, next) => { req.uploadFolder = req.params.folder; next(); }, upload.array('files', 10), uploadController.uploadMultiple);

// ---- Onboarding Slides (mobile app) ----
router.get('/onboarding-slides', onboardingController.adminGetAllSlides);
router.post('/onboarding-slides', allowRoles('superadmin', 'manager'), onboardingController.createSlide);
router.put('/onboarding-slides/:id', allowRoles('superadmin', 'manager'), onboardingController.updateSlide);
router.delete('/onboarding-slides/:id', allowRoles('superadmin', 'manager'), onboardingController.deleteSlide);

// ---- Hero Banners (website hero section slider) ----
router.get('/hero-banners', heroBannerController.adminGetAllBanners);
router.post('/hero-banners', allowRoles('superadmin', 'manager'), heroBannerController.createBanner);
router.put('/hero-banners/:id', allowRoles('superadmin', 'manager'), heroBannerController.updateBanner);
router.delete('/hero-banners/:id', allowRoles('superadmin', 'manager'), heroBannerController.deleteBanner);

// ---- Cache ----
router.get('/cache/status', cacheController.getCacheStatus);
router.post('/cache/clear', allowRoles('superadmin', 'manager'), cacheController.clearCache);
router.post('/cache/clear/:namespace', allowRoles('superadmin', 'manager'), cacheController.clearNamespace);

// ---- Receptionist staff accounts (superadmin/manager only) ----
router.get('/receptionists', allowRoles('superadmin', 'manager'), receptionistController.adminGetAllReceptionists);
router.post('/receptionists', allowRoles('superadmin', 'manager'), receptionistController.adminCreateReceptionist);
router.put('/receptionists/:id', allowRoles('superadmin', 'manager'), receptionistController.adminUpdateReceptionist);
router.delete('/receptionists/:id', allowRoles('superadmin', 'manager'), receptionistController.adminDeleteReceptionist);

// ---- Receptionist's own dashboard (self-service, receptionist role only) ----
router.get('/receptionist/dashboard', allowRoles('receptionist'), receptionistController.getMyDashboard);
router.get('/receptionist/appointments', allowRoles('receptionist'), receptionistController.getMyAppointments);
router.get('/receptionist/payments', allowRoles('receptionist'), receptionistController.getMyCollections);

module.exports = router;