# Neurocare Clinic — Frontend

Website + patient portal for **Neurocare Clinic | Dr Neeraj Kumar, Senior Consultant Neurologist, Vasant Kunj, New Delhi**.

Next.js 14 (App Router) + React + Tailwind CSS. SSR/SSG/ISR throughout.

## Setup

1. Copy `.env.example` → `.env.local`, set `NEXT_PUBLIC_API_URL` to the running backend (e.g. `https://api.neurocareclinic.in/api`).
2. `npm install`
3. `npm run dev` → http://localhost:3000
4. `npm run build && npm start` for production.

Backend must be running and seeded first (`seed.js`).

## Brand colours (from logo)
| Token | Hex | Use |
|---|---|---|
| `brand-700` | `#11417e` | Navy — headings, dark sections |
| `brand-500` | `#0a75cb` | Blue — links, highlights |
| `brand-600` | `#0d5ca8` | Primary buttons |
| `accent-500` | `#08a599` | Teal — eyebrows, accents |
| `leaf-500` | `#8dc63f` | Green arc — small accents |

## Structure
- `app/` — App Router pages with `generateMetadata()` SEO.
- `lib/api.js` — server-side fetch helpers with ISR caching.
- `lib/apiClient.js` — client-side axios (OTP login, booking, payments).
- `lib/schema.js` — JSON-LD builders (Physician / MedicalClinic, MedicalProcedure, Article, FAQ, Breadcrumb).
- `components/SafeImage.jsx` — `next/image` wrapper that never crashes on `null` / empty `src`.
- `components/BookingWizard.jsx` — Service → Doctor → Date/Time → OTP login + coupon → Razorpay → Confirmation.

## Pages
Home, About, Doctors, Services, Blog, Offers, Reviews, Contact, Appointment, Login (OTP), Profile.
