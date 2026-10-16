# DHIC Backend — Neurocare Clinic

Node.js + Express + MySQL (mysql2) + Redis + Razorpay + Cloudinary backend.

## Setup (XAMPP MySQL)

1. Start XAMPP → Apache + MySQL running.
2. Open phpMyAdmin or CLI, run schema:
   ```
   mysql -u root -p < src/schema.sql
   ```
3. Copy `.env.example` → `.env` and fill in:
   - DB_* (defaults work for default XAMPP root/no-password)
   - CLOUDINARY_* (create free account, get cloud_name/api_key/api_secret)
   - RAZORPAY_* (test mode keys from Razorpay dashboard)
   - REDIS_URL (install Redis locally, or use `OTP_PROVIDER=console` + Redis fallback to DB works even without Redis running — server just logs a warning)
4. Install deps:
   ```
   npm install
   ```
5. Seed database (creates admin user, clinic, doctors, services, blogs, reviews, coupons, settings):
   ```
   npm run seed
   ```
   Default admin login: `adminneurocareclinic.in` / `Admin@12345` (change via .env before seeding)
6. Run dev server:
   ```
   npm run dev
   ```
   API on https://api.dentalhealthcareandimplantcentre.in

## OTP in dev mode
`OTP_PROVIDER=console` in .env → OTP prints in terminal logs instead of sending real SMS. Plug in MSG91/Fast2SMS/Twilio in `src/utils/otp.js` → `sendOtpSms()` for production.

## Key API groups
- `POST /api/auth/send-otp`, `/api/auth/verify-otp` — patient login
- `GET /api/clinics`, `/api/doctors`, `/api/services`, `/api/blogs`, `/api/offers`, `/api/reviews` — public content
- `GET /api/appointments/available-slots` — slot engine (public)
- `POST /api/patients/appointments/book` — booking (patient auth)
- `POST /api/patients/payments/create-order` + `/verify` — Razorpay flow
- `POST /api/admin/auth/login` — admin login
- `/api/admin/*` — full admin CRUD (clinics, doctors, services, appointments, patients, medical records, inventory, coupons, blogs, reviews, settings, CMS, SEO, reports)

## No double-booking
Enforced at DB level via `UNIQUE KEY (doctor_id, clinic_id, appointment_date, start_time)` on `appointments` table + slot validation before insert. Concurrent booking attempts get a 409 conflict.

## Redis caching & invalidation

Public read endpoints are cached in Redis. Cache is invalidated by **namespace version bumping**, not by key deletion — bumping `dhic:ver:doctors` makes every `dhic:doctors:v<old>:*` key unreachable instantly, with no SCAN loop and no race window.

**Files**
- `src/utils/cache.js` — get/set/bump/remember helpers, namespace list, graceful no-Redis fallback
- `src/middleware/cache.js` — `cacheRoute()`, `invalidate()`, `autoInvalidate()`, `noStore`

**Namespaces:** `doctors, clinics, services, blogs, offers, reviews, settings, cms, seo, slots, onboarding, hero-banners`

**How stale data is prevented**
1. `router.use(autoInvalidate())` sits at the top of `adminRoutes.js`. Every successful non-GET admin request bumps the namespaces its path touches. A path with no mapping bumps **everything** — a new route can never silently serve stale data.
2. Controllers that matter (e.g. `doctorController`) also bump explicitly *before* responding, so the very next GET is guaranteed fresh.
3. `app.use('/api', noStore)` sends `Cache-Control: no-store` on every API response, so the browser, the Next.js fetch cache and any CDN in front cannot hold an old copy. Redis still provides the speed server-side.

**Debug headers on cached routes**
- `X-Cache: HIT | MISS | BYPASS | DISABLED`
- `X-Cache-Namespace: doctors`

Bypass the cache for one request with `?nocache=1` or header `x-no-cache: 1`.

**Admin cache endpoints**
```
GET  /api/admin/cache/status              # connection, key count, per-namespace versions
POST /api/admin/cache/clear               # bump all namespaces
POST /api/admin/cache/clear  {"namespaces":["doctors"]}
POST /api/admin/cache/clear  {"hard":true}   # physically DEL every dhic:* key
POST /api/admin/cache/clear/doctors       # clear one namespace
```

**Env**
```
CACHE_ENABLED=true    # false => bypass cache entirely, every request hits MySQL
CACHE_TTL=300         # default seconds; routes override (slots 60s, settings 1800s)
CACHE_PREFIX=dhic     # keeps cache keys separate from otp:* keys
```

If Redis is unreachable the API keeps working — every request just falls through to MySQL.

**Verify it yourself**
```bash
curl -i https://api.dentalhealthcareandimplantcentre.in/api/doctors | grep -i x-cache   # MISS
curl -i https://api.dentalhealthcareandimplantcentre.in/api/doctors | grep -i x-cache   # HIT
# now PUT /api/admin/doctors/1 from the admin panel
curl -i https://api.dentalhealthcareandimplantcentre.in/api/doctors | grep -i x-cache   # MISS + new data
```

## Next
Frontend (Next.js) aur Admin panel (React/Vite) is agla — same architecture ke saath connect hoga in API_BASE_URL.
