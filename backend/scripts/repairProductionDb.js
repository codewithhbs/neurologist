// ============================================================
// Neurocare Clinic - Safe Production Database Repair / Migration
// Run with: node scripts/repairProductionDb.js
// Idempotent: Safe to run multiple times without data loss.
// ============================================================

require("dotenv").config();
const mysql = require("mysql2/promise");

async function runRepair() {
  const host = process.env.DB_HOST || "localhost";
  const port = parseInt(process.env.DB_PORT || "3306", 10);
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const database = process.env.DB_NAME || "neurocare_db";
  const ssl = process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined;

  console.log(`🔌 Connecting to MySQL database "${database}" on ${host}:${port}...`);

  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database,
      ssl,
      multipleStatements: true,
    });
    console.log(" Connected to MySQL successfully.\n");
  } catch (err) {
    console.error("❌ MySQL connection error:", err.message);
    process.exit(1);
  }

  async function columnExists(table, column) {
    const [rows] = await connection.query(
      "SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?",
      [database, table, column],
    );
    return rows.length > 0;
  }

  async function tableExists(table) {
    const [rows] = await connection.query(
      "SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
      [database, table],
    );
    return rows.length > 0;
  }

  async function indexExists(table, index) {
    const [rows] = await connection.query(
      "SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?",
      [database, table, index],
    );
    return rows.length > 0;
  }

  async function addColumnIfMissing(table, col, def) {
    if (!(await columnExists(table, col))) {
      await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${col}\` ${def}`);
      console.log(`  ➕ Added column ${table}.${col}`);
    } else {
      console.log(`  ✔ Column ${table}.${col} already exists`);
    }
  }

  try {
    // 1. Receptionists table
    console.log("Checking receptionists table...");
    await connection.query(`
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
      )
    `);
    console.log("  ✔ Table receptionists ready.");

    // 2. Patients table columns
    console.log("\nChecking patients table columns...");
    const patientCols = [
      ["parent_patient_id", "INT NULL"],
      ["relation", "VARCHAR(40) NULL"],
      ["patient_id", "VARCHAR(50) NULL"],
      ["father_husband_name", "VARCHAR(150) NULL"],
      ["nationality", "VARCHAR(80) NULL DEFAULT 'Indian'"],
      ["marital_status", "VARCHAR(40) NULL"],
      ["permanent_address", "TEXT NULL"],
      ["permanent_pincode", "VARCHAR(12) NULL"],
      ["local_address", "TEXT NULL"],
      ["local_pincode", "VARCHAR(12) NULL"],
      ["referred_by", "VARCHAR(100) NULL"],
      ["referrer_name", "VARCHAR(150) NULL"],
      ["referrer_address", "TEXT NULL"],
      ["consent_date", "DATETIME NULL"],
    ];

    for (const [col, def] of patientCols) {
      await addColumnIfMissing("patients", col, def);
    }

    // Drop unique index on mobile in patients if it exists (since family members share phone numbers)
    const [patientIndexes] = await connection.query(
      `SELECT INDEX_NAME, GROUP_CONCAT(COLUMN_NAME) AS cols
       FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'patients' AND NON_UNIQUE = 0
       GROUP BY INDEX_NAME`,
      [database],
    );
    for (const idx of patientIndexes) {
      if (idx.cols === "mobile") {
        await connection.query(`ALTER TABLE patients DROP INDEX \`${idx.INDEX_NAME}\``);
        console.log(`  ✔ Dropped unique index ${idx.INDEX_NAME} on patients.mobile`);
      }
    }

    if (!(await indexExists("patients", "idx_patients_mobile"))) {
      await connection.query("ALTER TABLE patients ADD INDEX idx_patients_mobile (mobile)");
      console.log("  ➕ Added index idx_patients_mobile on patients(mobile)");
    }
    if (!(await indexExists("patients", "idx_patients_mobile_parent"))) {
      await connection.query("ALTER TABLE patients ADD INDEX idx_patients_mobile_parent (mobile, parent_patient_id)");
      console.log("  ➕ Added index idx_patients_mobile_parent on patients(mobile, parent_patient_id)");
    }

    // 3. New Patinet table (offline / legacy patient records)
    console.log("\nChecking new_patinet table...");
    await connection.query(`
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
      )
    `);
    console.log("  ✔ Table new_patinet ready.");

    // 4. Appointments table columns
    console.log("\nChecking appointments table columns...");
    await addColumnIfMissing("appointments", "payment_method", "VARCHAR(50) DEFAULT 'pending'");
    await addColumnIfMissing("appointments", "created_by_receptionist_id", "INT NULL");
    await addColumnIfMissing("appointments", "checked_in_at", "DATETIME NULL");
    await addColumnIfMissing("appointments", "checked_out_at", "DATETIME NULL");
    await addColumnIfMissing("appointments", "timer_minutes", "INT NULL");
    await addColumnIfMissing("appointments", "visit_duration_minutes", "INT NULL");
    await addColumnIfMissing("appointments", "checked_in_by", "INT NULL");
    await addColumnIfMissing("appointments", "checked_out_by", "INT NULL");

    // Modify booked_via enum to include 'reception'
    try {
      await connection.query("ALTER TABLE appointments MODIFY booked_via ENUM('website','admin','phone','reception') DEFAULT 'website'");
      console.log("  ✔ Updated appointments.booked_via enum");
    } catch (e) {
      console.warn("  ⚠️ Could not modify booked_via:", e.message);
    }

    if (!(await indexExists("appointments", "idx_appt_checked_in"))) {
      await connection.query("ALTER TABLE appointments ADD INDEX idx_appt_checked_in (checked_in_at)");
      console.log("  ➕ Added index idx_appt_checked_in");
    }

    // 5. Old Appointments table
    console.log("\nChecking old_appointments table...");
    await connection.query(`
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
      )
    `);
    console.log("  ✔ Table old_appointments ready.");

    // 6. Old Medical History & Prescriptions
    console.log("\nChecking old_medical_history & old_prescriptions tables...");
    await connection.query(`
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
      )
    `);

    await connection.query(`
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
      )
    `);
    console.log("  ✔ Tables old_medical_history & old_prescriptions ready.");

    // 7. Appointment Reminders Table (CRITICAL for cron job)
    console.log("\nChecking appointment_reminders table...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS appointment_reminders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        appointment_id INT NOT NULL,
        reminder_type VARCHAR(20) NOT NULL,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
        UNIQUE KEY uniq_appt_reminder (appointment_id, reminder_type)
      )
    `);
    console.log("  ✔ Table appointment_reminders ready.");

    // 8. Prescriptions attachment_urls
    console.log("\nChecking prescriptions table...");
    await addColumnIfMissing("prescriptions", "attachment_urls", "JSON NULL AFTER pdf_url");

    // 9. Payments collected_by_receptionist_id
    console.log("\nChecking payments table...");
    await addColumnIfMissing("payments", "collected_by_receptionist_id", "INT NULL");

    // 10. OTP Requests purpose enum
    console.log("\nChecking otp_requests table...");
    try {
      await connection.query("ALTER TABLE otp_requests MODIFY purpose ENUM('login','booking','reception_login') DEFAULT 'login'");
      console.log("  ✔ Updated otp_requests.purpose enum");
    } catch (e) {
      console.warn("  ⚠️ Could not modify otp_requests:", e.message);
    }

    // 11. Default Settings
    console.log("\nEnsuring default site_settings...");
    await connection.query(`
      INSERT INTO site_settings (setting_key, setting_value, setting_type)
      VALUES
        ('visit_timer_minutes', '40', 'text'),
        ('clinic_name', 'Neurocare Clinic', 'text'),
        ('contact_phone', '7042564433', 'text'),
        ('contact_email', 'neurocareclinic@gmail.com', 'text')
      ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
    `);
    console.log("  ✔ Default site_settings verified.");

    console.log("\n🎉 Database repair and migration completed successfully! All tables and columns are ready for production.");
  } catch (err) {
    console.error("\n❌ Error during database repair:", err);
  } finally {
    await connection.end();
  }
}

runRepair();
