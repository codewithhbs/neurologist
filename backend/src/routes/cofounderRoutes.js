const router = require('express').Router();
const { protectCofounder } = require('../middleware/cofounderAuth');
const { upload, setFolder } = require('../config/cloudinary');

const doctorController = require('../controllers/doctorController');
const clinicController = require('../controllers/clinicController');
const serviceController = require('../controllers/serviceController');
const patientController = require('../controllers/patientController');
const appointmentController = require('../controllers/appointmentController');
const medicalController = require('../controllers/medicalController');
const uploadController = require('../controllers/uploadController');

// every route below requires header: x-cofounder-key
router.use(protectCofounder);

// ---- Dropdown data ----
router.get('/doctors', doctorController.adminGetAllDoctors);
router.get('/clinics', clinicController.adminGetAllClinics);
router.get('/services', serviceController.adminGetAllServices);

// ---- Patients (add user + manage) ----
router.get('/patients', patientController.adminGetAllPatients);
// family members (?patient_type=old -> new_patinet table)
router.get('/patients/family-lookup', patientController.adminFamilyLookup);
router.get('/patients/:id/family', patientController.adminGetFamily);
router.post('/patients/:id/family', patientController.adminAddFamilyMember);
router.put('/patients/:id/family/:memberId', patientController.adminUpdateFamilyMember);
router.delete('/patients/:id/family/:memberId', patientController.adminDeleteFamilyMember);
router.get('/patients/:id', patientController.adminGetPatientById);
router.post('/patients', patientController.cofounderCreatePatient);
router.put('/patients/:id', patientController.adminUpdatePatient);

router.get("/cofounder/patients", patientController.cofounderSearchPatients);
router.get("/cofounder/patients/:id", patientController.cofounderGetPatient);
router.post("/cofounder/patients", patientController.cofounderCreatePatient);

// ---- Appointments (backdate up to 1 year) ----
router.get('/appointments/available-slots', appointmentController.cofounderGetAvailableSlots);
router.get('/appointments', appointmentController.adminGetAppointments);
router.get('/appointments/:id', appointmentController.adminGetAppointmentById);
router.post('/appointments', appointmentController.cofounderCreateAppointment);
router.put('/appointments/:id', appointmentController.cofounderUpdateAppointment);
router.put('/appointments/:id/status', appointmentController.adminUpdateStatus);

// ---- Medical history ----
router.post('/medical-history', medicalController.createHistory);
router.put('/medical-history/:id', medicalController.updateHistory);
router.delete('/medical-history/:id', medicalController.deleteHistory);

// ---- Prescriptions ----
router.post('/prescriptions', medicalController.createPrescription);
router.put('/prescriptions/:id', medicalController.updatePrescription);
router.delete('/prescriptions/:id', medicalController.deletePrescription);

// ---- Follow-ups ----
router.get('/follow-ups', medicalController.adminGetAllFollowUps);
router.post('/follow-ups', medicalController.createFollowUp);
router.put('/follow-ups/:id', medicalController.updateFollowUp);
router.delete('/follow-ups/:id', medicalController.deleteFollowUp);

// ---- Upload (attachments for history/prescriptions) ----
router.post('/upload/:folder', (req, res, next) => { req.uploadFolder = req.params.folder; next(); }, upload.single('file'), uploadController.uploadFile);

module.exports = router;