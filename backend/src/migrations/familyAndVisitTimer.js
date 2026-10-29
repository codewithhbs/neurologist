// ============================================================
// Migration: Family members + Reception In/Out visit timer
// Run ONCE on the live DB (safe to re-run, every step is idempotent):
//   node src/migrations/familyAndVisitTimer.js
// ============================================================
require("dotenv").config();
const pool = require("../config/db");

const DB = () => process.env.DB_NAME || "neurocare_db";

async function tableExists(table) {
  const [r] = await pool.query(
    "SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
    [DB(), table],
  );
  return r.length > 0;
}

async function columnExists(table, column) {
  const [r] = await pool.query(
    "SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?",
    [DB(), table, column],
  );
  return r.length > 0;
}

async function indexExists(table, index) {
  const [r] = await pool.query(
    "SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?",
    [DB(), table, index],
  );
  return r.length > 0;
}

// unique indexes that consist ONLY of the mobile column
async function uniqueMobileIndexes(table) {
  const [r] = await pool.query(
    `SELECT INDEX_NAME, GROUP_CONCAT(COLUMN_NAME) AS cols
       FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND NON_UNIQUE = 0
      GROUP BY INDEX_NAME`,
    [DB(), table],
  );
  return r.filter((x) => x.cols === "mobile").map((x) => x.INDEX_NAME);
}

async function run(sql, label) {
  await pool.query(sql);
  console.log("  ✔", label);
}

async function familyColumns(table) {
  if (!(await tableExists(table))) {
    console.log(`- ${table}: table not found, skipped`);
    return;
  }
  console.log(`- ${table}`);
  if (!(await columnExists(table, "parent_patient_id")))
    await run(
      `ALTER TABLE \`${table}\` ADD COLUMN parent_patient_id INT NULL AFTER id`,
      "parent_patient_id added",
    );
  if (!(await columnExists(table, "relation")))
    await run(
      `ALTER TABLE \`${table}\` ADD COLUMN relation VARCHAR(40) NULL AFTER parent_patient_id`,
      "relation added",
    );
  if (!(await indexExists(table, "idx_parent_patient")))
    await run(
      `ALTER TABLE \`${table}\` ADD INDEX idx_parent_patient (parent_patient_id)`,
      "idx_parent_patient added",
    );

  // members share the holder's mobile -> mobile can no longer be UNIQUE
  for (const idx of await uniqueMobileIndexes(table)) {
    await run(`ALTER TABLE \`${table}\` DROP INDEX \`${idx}\``, `unique index ${idx} on mobile dropped`);
  }
  if (!(await indexExists(table, "idx_mobile_parent")))
    await run(
      `ALTER TABLE \`${table}\` ADD INDEX idx_mobile_parent (mobile, parent_patient_id)`,
      "idx_mobile_parent added",
    );
}

async function visitTimerColumns() {
  console.log("- appointments (in/out timer)");
  const cols = [
    ["checked_in_at", "DATETIME NULL"],
    ["checked_out_at", "DATETIME NULL"],
    ["timer_minutes", "INT NULL"],
    ["visit_duration_minutes", "INT NULL"],
    ["checked_in_by", "INT NULL"],
    ["checked_out_by", "INT NULL"],
  ];
  for (const [c, def] of cols) {
    if (!(await columnExists("appointments", c)))
      await run(`ALTER TABLE appointments ADD COLUMN ${c} ${def}`, `${c} added`);
  }
  if (!(await indexExists("appointments", "idx_appt_checked_in")))
    await run(
      "ALTER TABLE appointments ADD INDEX idx_appt_checked_in (checked_in_at)",
      "idx_appt_checked_in added",
    );

  // default visit timer (minutes) — editable from admin Settings (key: visit_timer_minutes)
  await pool.query(
    `INSERT INTO site_settings (setting_key, setting_value, setting_type)
     VALUES ('visit_timer_minutes', '40', 'text')
     ON DUPLICATE KEY UPDATE setting_key = setting_key`,
  );
  console.log("  ✔ site_settings.visit_timer_minutes ensured (default 40)");
}

(async () => {
  try {
    console.log("Running family + visit timer migration on", DB());
    await familyColumns("patients");
    await familyColumns("new_patinet");
    await visitTimerColumns();
    console.log("✅ Migration complete");
  } catch (e) {
    console.error("❌ Migration failed:", e.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();

