import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clinics from './pages/Clinics';
import Doctors from './pages/Doctors';
import DoctorDetail from './pages/DoctorDetail';
import Services from './pages/Services';
import Appointments from './pages/Appointments';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import Payments from './pages/Payments';
import Coupons from './pages/Coupons';
import Medicines from './pages/Medicines';
import Equipment from './pages/Equipment';
import Blogs from './pages/Blogs';
import Reviews from './pages/Reviews';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import OnboardingSlides from './pages/OnboardingSlides';
import HeroBanners from './pages/HeroBanners';
import Receptionists from './pages/Receptionists';
import AppointmentsDetails from './pages/AppointmentsDetails';
import Cofounder from './pages/Cofounder';
import NewPatient from './pages/NewPatient';
import NewPatientDetail from './pages/NewAppointment';
import NewAppointment from './pages/NewAppointment';
import AppointmentsDetailsNew from './pages/AppointmentsDetailsNew';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/cofounder" element={<Cofounder />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
      <Route path="/appointments/:id" element={<ProtectedRoute><AppointmentsDetails /></ProtectedRoute>} />

      <Route path="/doctors" element={<ProtectedRoute><Doctors /></ProtectedRoute>} />
      <Route path="/doctors/:id" element={<ProtectedRoute><DoctorDetail /></ProtectedRoute>} />
      <Route path="/clinics" element={<ProtectedRoute><Clinics /></ProtectedRoute>} />
      <Route path="/services" element={<ProtectedRoute><Services /></ProtectedRoute>} />
      <Route path="/patients" element={<ProtectedRoute><Patients /></ProtectedRoute>} />
            <Route path="/new-patients" element={<ProtectedRoute><NewPatient /></ProtectedRoute>} />
            <Route path="/new-appointments" element={<ProtectedRoute><NewAppointment /></ProtectedRoute>} />
            <Route path="/appointments/new/:id" element={<ProtectedRoute><AppointmentsDetailsNew /></ProtectedRoute>} />

            

      <Route path="/receptionists" element={<ProtectedRoute><Receptionists /></ProtectedRoute>} />

      <Route path="/patients/:id" element={<ProtectedRoute><PatientDetail /></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />

      <Route path="/coupons" element={<ProtectedRoute><Coupons /></ProtectedRoute>} />
      <Route path="/medicines" element={<ProtectedRoute><Medicines /></ProtectedRoute>} />
      <Route path="/equipment" element={<ProtectedRoute><Equipment /></ProtectedRoute>} />
      <Route path="/blogs" element={<ProtectedRoute><Blogs /></ProtectedRoute>} />
      <Route path="/reviews" element={<ProtectedRoute><Reviews /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/onboarding-slides" element={<ProtectedRoute><OnboardingSlides /></ProtectedRoute>} />
      <Route path="/hero-banners" element={<ProtectedRoute><HeroBanners /></ProtectedRoute>} />
    </Routes>
  );
}