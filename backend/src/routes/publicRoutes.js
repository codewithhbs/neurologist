const router = require('express').Router();

const clinicController = require('../controllers/clinicController');
const doctorController = require('../controllers/doctorController');
const serviceController = require('../controllers/serviceController');
const blogController = require('../controllers/blogController');
const couponController = require('../controllers/couponController');
const reviewController = require('../controllers/reviewController');
const settingsController = require('../controllers/settingsController');
const appointmentController = require('../controllers/appointmentController');
const onboardingController = require('../controllers/onboardingController');
const heroBannerController = require('../controllers/heroBannerController');

const { cacheRoute } = require('../middleware/cache');

// TTLs (seconds). Cache is version-invalidated on every admin write,
// so these are just an upper bound / safety expiry.
const LONG = 60 * 30; // 30 min - rarely changes
const MED = 60 * 10;  // 10 min
const SHORT = 60;     // 1 min - slots change constantly

// Clinics
router.get('/clinics', cacheRoute('clinics', MED), clinicController.getAllClinics);
router.get('/clinics/:slug', cacheRoute('clinics', MED), clinicController.getClinicBySlug);

// Doctors
router.get('/doctors', cacheRoute('doctors', MED), doctorController.getAllDoctors);
router.get('/doctors/:slug', cacheRoute('doctors', MED), doctorController.getDoctorBySlug);

// Services
router.get('/services', cacheRoute('services', MED), serviceController.getAllServices);
router.get('/services/categories/list', cacheRoute('services', LONG), serviceController.getCategories);
router.get('/services/:slug', cacheRoute('services', MED), serviceController.getServiceBySlug);

// Blogs
router.get('/blogs', cacheRoute('blogs', MED), blogController.getAllBlogs);
router.get('/blogs/categories/list', cacheRoute('blogs', LONG), blogController.getCategories);
router.get('/blogs/:slug', cacheRoute('blogs', MED), blogController.getBlogBySlug);

// Offers
router.get('/offers', cacheRoute('offers', MED), couponController.getPublicOffers);

// Reviews
router.get('/reviews', cacheRoute('reviews', MED), reviewController.getPublicReviews);

// Settings / CMS / SEO
router.get('/settings', cacheRoute('settings', LONG), settingsController.getPublicSettings);
router.get('/cms/:pageKey', cacheRoute('cms', LONG), settingsController.getCmsPage);
router.get('/seo/:entityType/:entityId', cacheRoute('seo', LONG), settingsController.getSeoMeta);

// Available slots (public, used before login too) - short TTL, bookings change these
router.get('/appointments/available-slots', cacheRoute('slots', SHORT), appointmentController.getAvailableSlots);

// Onboarding slides (mobile app)
router.get('/onboarding-slides', cacheRoute('onboarding', LONG), onboardingController.getPublicSlides);

// Hero banners (website hero section slider)
router.get('/hero-banners', cacheRoute('hero-banners', LONG), heroBannerController.getPublicBanners);

module.exports = router;
