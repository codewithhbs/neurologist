-- ============================================================
-- Neurocare Clinic - Full Production Schema (MySQL / MariaDB)
-- Run: mysql -u root -p < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS neurocare_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE neurocare_db;

SET FOREIGN_KEY_CHECKS = 0;

-- ---------------- ADMIN USERS ----------------
CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('superadmin','manager','frontdesk') DEFAULT 'manager',
  is_active TINYINT(1) DEFAULT 1,
  last_login DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ---------------- CLINICS (multi-clinic support) ----------------
CREATE TABLE IF NOT EXISTS clinics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(160) NOT NULL UNIQUE,
  address TEXT,
  city VARCHAR(80),
  state VARCHAR(80),
  pincode VARCHAR(12),
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  phone VARCHAR(20),
  appointment_number VARCHAR(20),
  whatsapp_number VARCHAR(20),
  email VARCHAR(150),
  timing_json JSON, -- {"mon_sat":[["10:00","14:00"],["17:00","21:00"]],"sun":[["11:00","14:00"]]}
  slot_duration_minutes INT DEFAULT 30,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ---------------- CLINIC HOLIDAYS/LEAVES ----------------
CREATE TABLE IF NOT EXISTS clinic_holidays (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  holiday_date DATE NOT NULL,
  reason VARCHAR(200),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_clinic_date (clinic_id, holiday_date)
);

-- ---------------- DOCTORS ----------------
CREATE TABLE IF NOT EXISTS doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(170) NOT NULL UNIQUE,
  qualification VARCHAR(200), -- BDS, MDS etc
  specialization VARCHAR(200),
  bio TEXT,
  experience_years INT DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 4.8,
  photo_url VARCHAR(500),
  registration_no VARCHAR(100),
  consultation_fee DECIMAL(10,2) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  meta_title VARCHAR(200),
  meta_description VARCHAR(500),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- doctor <-> clinic mapping with per-clinic weekly availability
CREATE TABLE IF NOT EXISTS doctor_clinics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_id INT NOT NULL,
  clinic_id INT NOT NULL,
  weekly_availability JSON,
  is_active TINYINT(1) DEFAULT 1,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_doctor_clinic (doctor_id, clinic_id)
);

-- doctor-wise leaves (separate from clinic holidays)
CREATE TABLE IF NOT EXISTS doctor_leaves (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_id INT NOT NULL,
  leave_date DATE NOT NULL,
  clinic_id INT NULL,
  reason VARCHAR(200),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);

-- block a specific time window for a doctor
CREATE TABLE IF NOT EXISTS doctor_slot_blocks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_id INT NOT NULL,
  clinic_id INT NULL,
  block_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  INDEX idx_slot_block_lookup (doctor_id, block_date)
);

-- ---------------- SERVICE CATEGORIES & SERVICES ----------------
CREATE TABLE IF NOT EXISTS service_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(140) NOT NULL UNIQUE,
  icon_url VARCHAR(500),
  display_order INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1
);

CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NULL,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(170) NOT NULL UNIQUE,
  short_description VARCHAR(500),
  description LONGTEXT,
  icon_url VARCHAR(500),
  banner_image_url VARCHAR(500),
  base_price DECIMAL(10,2) DEFAULT 0,
  duration_minutes INT DEFAULT 30,
  faqs_json JSON,
  is_featured TINYINT(1) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  display_order INT DEFAULT 0,
  meta_title VARCHAR(200),
  meta_description VARCHAR(500),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE SET NULL
);

-- doctor-wise fee override per service
CREATE TABLE IF NOT EXISTS doctor_services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_id INT NOT NULL,
  service_id INT NOT NULL,
  fee DECIMAL(10,2) NOT NULL,
  duration_minutes INT DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_doctor_service (doctor_id, service_id)
);

-- ---------------- RECEPTIONISTS STAFF ----------------
CREATE TABLE IF NOT EXISTS receptionists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  mobile VARCHAR(15) NOT NULL UNIQUE,
  clinic_id INT NULL,
  is_active TINYINT(1) DEFAULT 1,
  last_login DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL
);

-- ---------------- PATIENTS ----------------
CREATE TABLE IF NOT EXISTS patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  parent_patient_id INT NULL,
  relation VARCHAR(40) NULL,
  patient_id VARCHAR(50) NULL UNIQUE,
  name VARCHAR(150),
  father_husband_name VARCHAR(150) NULL,
  mobile VARCHAR(15) NOT NULL,
  email VARCHAR(150),
  gender ENUM('male','female','other') NULL,
  dob DATE NULL,
  nationality VARCHAR(80) NULL DEFAULT 'Indian',
  marital_status VARCHAR(40) NULL,
  address TEXT,
  permanent_address TEXT,
  permanent_pincode VARCHAR(12),
  local_address TEXT,
  local_pincode VARCHAR(12),
  referred_by VARCHAR(100),
  referrer_name VARCHAR(150),
  referrer_address TEXT,
  consent_date DATETIME NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_patients_mobile (mobile),
  INDEX idx_patients_mobile_parent (mobile, parent_patient_id),
  INDEX idx_parent_patient (parent_patient_id),
  FOREIGN KEY (parent_patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- ---------------- NEW PATINET (Offline / Backdated Patient Records) ----------------
CREATE TABLE IF NOT EXISTS new_patinet (
  id INT AUTO_INCREMENT PRIMARY KEY,
  parent_patient_id INT NULL,
  relation VARCHAR(40) NULL,
  patient_id VARCHAR(50) NULL UNIQUE,
  name VARCHAR(150),
  father_husband_name VARCHAR(150) NULL,
  mobile VARCHAR(15) NOT NULL,
  email VARCHAR(150),
  gender ENUM('male','female','other') NULL,
  dob DATE NULL,
  nationality VARCHAR(80) NULL DEFAULT 'Indian',
  marital_status VARCHAR(40) NULL,
  address TEXT,
  permanent_address TEXT,
  permanent_pincode VARCHAR(12),
  local_address TEXT,
  local_pincode VARCHAR(12),
  referred_by VARCHAR(100),
  referrer_name VARCHAR(150),
  referrer_address TEXT,
  consent_date DATETIME NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_np_mobile (mobile),
  INDEX idx_np_mobile_parent (mobile, parent_patient_id),
  INDEX idx_np_parent (parent_patient_id)
);

-- ---------------- OTP REQUESTS ----------------
CREATE TABLE IF NOT EXISTS otp_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mobile VARCHAR(15) NOT NULL,
  otp_code VARCHAR(10) NOT NULL,
  purpose ENUM('login','booking','reception_login') DEFAULT 'login',
  is_used TINYINT(1) DEFAULT 0,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_otp_mobile (mobile)
);

-- ---------------- COUPONS / OFFERS ----------------
CREATE TABLE IF NOT EXISTS coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(200),
  description VARCHAR(500),
  discount_type ENUM('flat','percent') DEFAULT 'percent',
  discount_value DECIMAL(10,2) NOT NULL,
  max_discount DECIMAL(10,2) NULL,
  min_amount DECIMAL(10,2) DEFAULT 0,
  usage_limit INT NULL,
  used_count INT DEFAULT 0,
  per_patient_limit INT DEFAULT 1,
  applicable_service_ids JSON NULL,
  valid_from DATE NULL,
  valid_till DATE NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS offers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(220) NOT NULL UNIQUE,
  description TEXT,
  image_url VARCHAR(500),
  coupon_id INT NULL,
  valid_from DATE,
  valid_till DATE,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL
);

-- ---------------- APPOINTMENTS ----------------
CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_code VARCHAR(30) NOT NULL UNIQUE,
  patient_id INT NOT NULL,
  clinic_id INT NOT NULL,
  doctor_id INT NOT NULL,
  service_id INT NULL,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  fee_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  coupon_id INT NULL,
  final_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_free TINYINT(1) DEFAULT 0,
  payment_status ENUM('not_required','pending','paid','failed','refunded') DEFAULT 'pending',
  payment_method VARCHAR(50) DEFAULT 'pending',
  status ENUM('pending','confirmed','completed','cancelled','no_show') DEFAULT 'pending',
  reason VARCHAR(500),
  notes TEXT,
  cancelled_reason VARCHAR(300),
  booked_via ENUM('website','admin','phone','reception') DEFAULT 'website',
  created_by_receptionist_id INT NULL,
  checked_in_at DATETIME NULL,
  checked_out_at DATETIME NULL,
  timer_minutes INT NULL,
  visit_duration_minutes INT NULL,
  checked_in_by INT NULL,
  checked_out_by INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id),
  FOREIGN KEY (service_id) REFERENCES services(id),
  FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by_receptionist_id) REFERENCES receptionists(id) ON DELETE SET NULL,
  UNIQUE KEY uniq_doctor_slot (doctor_id, clinic_id, appointment_date, start_time),
  INDEX idx_appt_date (appointment_date),
  INDEX idx_appt_status (status),
  INDEX idx_appt_patient (patient_id),
  INDEX idx_appt_checked_in (checked_in_at)
);

-- ---------------- OLD APPOINTMENTS (Historical/Backdated Records) ----------------
CREATE TABLE IF NOT EXISTS old_appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_code VARCHAR(30) NOT NULL UNIQUE,
  patient_id INT NOT NULL,
  clinic_id INT NOT NULL,
  doctor_id INT NOT NULL,
  service_id INT NULL,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  fee_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  coupon_id INT NULL,
  final_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_free TINYINT(1) DEFAULT 0,
  payment_status ENUM('not_required','pending','paid','failed','refunded') DEFAULT 'pending',
  payment_method VARCHAR(50) DEFAULT 'pending',
  status ENUM('pending','confirmed','completed','cancelled','no_show') DEFAULT 'pending',
  reason VARCHAR(500),
  notes TEXT,
  cancelled_reason VARCHAR(300),
  booked_via ENUM('website','admin','phone','reception') DEFAULT 'website',
  created_by_receptionist_id INT NULL,
  checked_in_at DATETIME NULL,
  checked_out_at DATETIME NULL,
  timer_minutes INT NULL,
  visit_duration_minutes INT NULL,
  checked_in_by INT NULL,
  checked_out_by INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_old_appt_date (appointment_date),
  INDEX idx_old_appt_patient (patient_id)
);

CREATE TABLE IF NOT EXISTS coupon_usages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  coupon_id INT NOT NULL,
  patient_id INT NOT NULL,
  appointment_id INT NOT NULL,
  used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);

-- ---------------- PAYMENTS (Razorpay & Cash) ----------------
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT NOT NULL,
  patient_id INT NOT NULL,
  razorpay_order_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  razorpay_signature VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  method VARCHAR(30),
  collected_by_receptionist_id INT NULL,
  status ENUM('created','paid','failed','refunded') DEFAULT 'created',
  raw_response JSON NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (collected_by_receptionist_id) REFERENCES receptionists(id) ON DELETE SET NULL
);

-- ---------------- MEDICAL HISTORY / PRESCRIPTIONS / FOLLOW-UPS ----------------
CREATE TABLE IF NOT EXISTS medical_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  appointment_id INT NULL,
  doctor_id INT NULL,
  title VARCHAR(200),
  diagnosis TEXT,
  treatment_notes TEXT,
  attachment_urls JSON NULL,
  visit_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS old_medical_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  appointment_id INT NULL,
  doctor_id INT NULL,
  title VARCHAR(200),
  diagnosis TEXT,
  treatment_notes TEXT,
  attachment_urls JSON NULL,
  visit_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_old_med_patient (patient_id)
);

CREATE TABLE IF NOT EXISTS prescriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  appointment_id INT NULL,
  doctor_id INT NULL,
  medicines_json JSON,
  notes TEXT,
  pdf_url VARCHAR(500),
  attachment_urls JSON NULL,
  prescribed_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS old_prescriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  appointment_id INT NULL,
  doctor_id INT NULL,
  medicines_json JSON,
  notes TEXT,
  pdf_url VARCHAR(500),
  attachment_urls JSON NULL,
  prescribed_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_old_presc_patient (patient_id)
);

CREATE TABLE IF NOT EXISTS follow_ups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  appointment_id INT NULL,
  doctor_id INT NULL,
  follow_up_date DATE NOT NULL,
  notes TEXT,
  status ENUM('pending','done','missed') DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
);

-- ---------------- APPOINTMENT REMINDERS (automated 2hr / 30min jobs) ----------------
CREATE TABLE IF NOT EXISTS appointment_reminders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT NOT NULL,
  reminder_type VARCHAR(20) NOT NULL,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_appt_reminder (appointment_id, reminder_type)
);

-- ---------------- REVIEWS ----------------
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NULL,
  doctor_id INT NULL,
  clinic_id INT NULL,
  patient_name VARCHAR(150) NOT NULL,
  rating TINYINT NOT NULL,
  review_text TEXT,
  is_approved TINYINT(1) DEFAULT 0,
  is_featured TINYINT(1) DEFAULT 0,
  source ENUM('website','google','manual') DEFAULT 'website',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL
);

-- ---------------- BLOGS ----------------
CREATE TABLE IF NOT EXISTS blog_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(140) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS blogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NULL,
  title VARCHAR(250) NOT NULL,
  slug VARCHAR(270) NOT NULL UNIQUE,
  excerpt VARCHAR(500),
  content LONGTEXT NOT NULL,
  cover_image_url VARCHAR(500),
  author_name VARCHAR(120) DEFAULT 'Neurocare Clinic',
  is_published TINYINT(1) DEFAULT 0,
  published_at DATETIME NULL,
  views INT DEFAULT 0,
  meta_title VARCHAR(200),
  meta_description VARCHAR(500),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES blog_categories(id) ON DELETE SET NULL
);

-- ---------------- INVENTORY: MEDICINES & EQUIPMENT ----------------
CREATE TABLE IF NOT EXISTS medicines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(120),
  unit VARCHAR(40) DEFAULT 'strip',
  stock_qty INT DEFAULT 0,
  reorder_level INT DEFAULT 10,
  price_per_unit DECIMAL(10,2) DEFAULT 0,
  expiry_date DATE NULL,
  supplier VARCHAR(150),
  clinic_id INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS equipment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(120),
  clinic_id INT NULL,
  purchase_date DATE NULL,
  warranty_till DATE NULL,
  last_service_date DATE NULL,
  next_service_date DATE NULL,
  status ENUM('working','maintenance','out_of_order') DEFAULT 'working',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL
);

-- ---------------- CMS / SETTINGS / SEO ----------------
CREATE TABLE IF NOT EXISTS site_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value LONGTEXT,
  setting_type ENUM('text','json','image','html') DEFAULT 'text',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cms_pages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  page_key VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(200),
  content_json JSON,
  meta_title VARCHAR(200),
  meta_description VARCHAR(500),
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS seo_meta (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('service','doctor','blog','clinic','custom') NOT NULL,
  entity_id INT NULL,
  path VARCHAR(300) NULL,
  meta_title VARCHAR(200),
  meta_description VARCHAR(500),
  og_image VARCHAR(500),
  canonical_url VARCHAR(300),
  schema_json JSON NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ---------------- HERO BANNERS (homepage banner slider) ----------------
CREATE TABLE IF NOT EXISTS hero_banners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200),
  subtitle VARCHAR(500),
  image_url VARCHAR(500) NOT NULL,
  cta_text VARCHAR(80),
  cta_link VARCHAR(300),
  display_order INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  is_mobile TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ---------------- ONBOARDING SLIDES (mobile app) ----------------
CREATE TABLE IF NOT EXISTS onboarding_slides (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  subtitle VARCHAR(500),
  image_url VARCHAR(500) NOT NULL,
  display_order INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ---------------- INDEXES FOR PERFORMANCE ----------------
CREATE INDEX idx_doctor_active ON doctors(is_active);
CREATE INDEX idx_service_active ON services(is_active);
CREATE INDEX idx_blog_published ON blogs(is_published, published_at);
CREATE INDEX idx_review_approved ON reviews(is_approved);

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------- DEFAULT SITE SETTINGS ----------------
INSERT INTO site_settings (setting_key, setting_value, setting_type)
VALUES
  ('visit_timer_minutes', '40', 'text'),
  ('clinic_name', 'Neurocare Clinic', 'text'),
  ('contact_phone', '7042564433', 'text'),
  ('contact_email', 'neurocareclinic@gmail.com', 'text')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
