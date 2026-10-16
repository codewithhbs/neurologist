# DHIC Admin Panel — Neurocare Clinic

React + Vite admin panel. Connects to `dhic-backend`'s `/api/admin/*` endpoints.

## Setup

1. Copy `.env.example` → `.env`, set `VITE_API_URL` (note: **must** point to `/api/admin`, e.g. `http://localhost:5000/api/admin`).
2. `npm install`
3. `npm run dev` → http://localhost:3001
4. Login with the admin credentials created by `npm run seed` in the backend (default: `adminneurocareclinic.in` / `Admin@12345`, or whatever you set in backend `.env` before seeding).

## Modules
- **Dashboard** — stats, revenue trend chart, top services, upcoming appointments, low-stock alerts.
- **Appointments** — filterable list, status updates, walk-in/phone booking creation with live slot picker.
- **Doctors** — CRUD + per-clinic weekly availability editor + per-service fee mapping + leave management (`/doctors/:id`).
- **Clinics** — CRUD + holiday calendar per clinic.
- **Services** — CRUD + categories.
- **Patients** — search, detail view with appointments/medical history/prescriptions, add history & prescriptions inline.
- **Payments** — Razorpay payment log.
- **Coupons & Offers** — create/manage discount coupons and homepage offer banners.
- **Medicines / Equipment** — inventory tracking with low-stock and service-due visibility.
- **Blogs** — CRUD with publish toggle, meta title/description.
- **Reviews** — approve/feature/delete patient reviews.
- **Reports** — revenue report (date range) + doctor performance.
- **Settings & SEO** — site-wide settings (phone, address, logo, etc.) and custom-page SEO meta overrides.

## Notes
- All API calls attach the admin JWT automatically via axios interceptor (`src/api/client.js`); a 401 response auto-logs-out and redirects to `/login`.
- Image uploads: for now, image/logo fields take a **Cloudinary URL** directly — wire up the backend's `/api/admin/upload/:folder` endpoint with a file input if you want in-panel uploads (multer + Cloudinary already configured server-side).
