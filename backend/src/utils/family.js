// ============================================================
// Family members ("add my family under one mobile number")
// ------------------------------------------------------------
// A family member is a normal row in `patients` (or `new_patinet` for the
// cofounder "old" flow) with parent_patient_id = account holder's id and the
// SAME mobile as the holder. That way every existing feature (appointments,
// history, prescriptions, WhatsApp to patient mobile, admin search by mobile)
// works for members without any extra joins.
//
// Account holder  = row where parent_patient_id IS NULL
// Family member   = row where parent_patient_id = <holder id>
// ============================================================
const pool = require("../config/db");

const ALLOWED_TABLES = ["patients", "new_patinet"];
const RELATIONS = [
  "spouse",
  "son",
  "daughter",
  "father",
  "mother",
  "brother",
  "sister",
  "grandfather",
  "grandmother",
  "other",
];

const assertTable = (table) => {
  if (!ALLOWED_TABLES.includes(table)) throw new Error("Invalid patient table");
};

async function generateOldPatientCode(conn) {
  let code, exists;
  do {
    code = `PAT${Math.floor(1000 + Math.random() * 9000)}`;
    const [rows] = await conn.query(
      "SELECT id FROM new_patinet WHERE patient_id = ? LIMIT 1",
      [code],
    );
    exists = rows.length > 0;
  } while (exists);
  return code;
}

// account holder by mobile (never returns a family member row)
async function findHolderByMobile(mobile, table = "patients", conn = pool) {
  assertTable(table);
  const [rows] = await conn.query(
    `SELECT * FROM \`${table}\` WHERE mobile = ? AND parent_patient_id IS NULL ORDER BY id ASC LIMIT 1`,
    [mobile],
  );
  return rows[0] || null;
}

// holder id for any patient row (member -> its parent, holder -> itself)
async function getHolderId(patientId, table = "patients", conn = pool) {
  assertTable(table);
  const [rows] = await conn.query(
    `SELECT id, parent_patient_id FROM \`${table}\` WHERE id = ? LIMIT 1`,
    [patientId],
  );
  if (!rows.length) return null;
  return rows[0].parent_patient_id || rows[0].id;
}

// all members (not the holder) of a holder
async function listMembers(holderId, table = "patients", conn = pool) {
  assertTable(table);
  const [rows] = await conn.query(
    `SELECT * FROM \`${table}\` WHERE parent_patient_id = ? ORDER BY id ASC`,
    [holderId],
  );
  return rows;
}

// [holderId, ...memberIds]
async function familyIds(holderId, table = "patients", conn = pool) {
  assertTable(table);
  const [rows] = await conn.query(
    `SELECT id FROM \`${table}\` WHERE id = ? OR parent_patient_id = ?`,
    [holderId, holderId],
  );
  return rows.map((r) => r.id);
}

function cleanMember(input = {}) {
  const name = String(input.name || "").trim();
  const relation = String(input.relation || "other").trim().toLowerCase();
  return {
    name,
    relation: RELATIONS.includes(relation) ? relation : "other",
    gender: ["male", "female", "other"].includes(input.gender)
      ? input.gender
      : null,
    dob: input.dob || null,
    email: input.email ? String(input.email).trim() : null,
  };
}

// create a family member under holderId
async function createMember(holderId, input, table = "patients", conn = pool) {
  assertTable(table);
  const m = cleanMember(input);
  if (!m.name) {
    const e = new Error("Family member name is required");
    e.status = 400;
    throw e;
  }

  const [holderRows] = await conn.query(
    `SELECT id, mobile, parent_patient_id FROM \`${table}\` WHERE id = ? LIMIT 1`,
    [holderId],
  );
  if (!holderRows.length) {
    const e = new Error("Account holder not found");
    e.status = 404;
    throw e;
  }
  // always attach to the real holder (if someone passes a member id)
  const holder = holderRows[0];
  const realHolderId = holder.parent_patient_id || holder.id;

  let code = null;
  if (table === "new_patinet") code = await generateOldPatientCode(conn);

  const [result] = await conn.query(
    `INSERT INTO \`${table}\`
       (patient_id, parent_patient_id, relation, name, mobile, email, gender, dob)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [code, realHolderId, m.relation, m.name, holder.mobile, m.email, m.gender, m.dob],
  );

  if (table === "patients") {
    await conn.query("UPDATE patients SET patient_id = ? WHERE id = ?", [
      String(result.insertId),
      result.insertId,
    ]);
  }

  const [rows] = await conn.query(`SELECT * FROM \`${table}\` WHERE id = ?`, [
    result.insertId,
  ]);
  return rows[0];
}

async function updateMember(holderId, memberId, input, table = "patients", conn = pool) {
  assertTable(table);
  const [own] = await conn.query(
    `SELECT id FROM \`${table}\` WHERE id = ? AND parent_patient_id = ? LIMIT 1`,
    [memberId, holderId],
  );
  if (!own.length) {
    const e = new Error("Family member not found");
    e.status = 404;
    throw e;
  }
  const updates = {};
  if (input.name !== undefined) {
    const n = String(input.name || "").trim();
    if (!n) {
      const e = new Error("Name cannot be empty");
      e.status = 400;
      throw e;
    }
    updates.name = n;
  }
  if (input.relation !== undefined) updates.relation = cleanMember(input).relation;
  if (input.gender !== undefined) updates.gender = cleanMember(input).gender;
  if (input.dob !== undefined) updates.dob = input.dob || null;
  if (input.email !== undefined) updates.email = input.email ? String(input.email).trim() : null;

  const keys = Object.keys(updates);
  if (keys.length) {
    await conn.query(
      `UPDATE \`${table}\` SET ${keys.map((k) => `\`${k}\` = ?`).join(", ")} WHERE id = ?`,
      [...keys.map((k) => updates[k]), memberId],
    );
  }
  const [rows] = await conn.query(`SELECT * FROM \`${table}\` WHERE id = ?`, [memberId]);
  return rows[0];
}

// hard delete only when member has no appointments (keeps records safe)
async function deleteMember(holderId, memberId, table = "patients", conn = pool) {
  assertTable(table);
  const apptTable = table === "new_patinet" ? "old_appointments" : "appointments";
  const [own] = await conn.query(
    `SELECT id FROM \`${table}\` WHERE id = ? AND parent_patient_id = ? LIMIT 1`,
    [memberId, holderId],
  );
  if (!own.length) {
    const e = new Error("Family member not found");
    e.status = 404;
    throw e;
  }
  const [[cnt]] = await conn.query(
    `SELECT COUNT(*) AS c FROM \`${apptTable}\` WHERE patient_id = ?`,
    [memberId],
  );
  if (cnt.c > 0) {
    const e = new Error("This member has appointments and cannot be removed");
    e.status = 409;
    throw e;
  }
  await conn.query(`DELETE FROM \`${table}\` WHERE id = ?`, [memberId]);
  return true;
}

/**
 * Decide WHO the appointment is for.
 *  - member_patient_id === holder (or empty)  -> holder
 *  - member_patient_id = existing member      -> that member (must belong to holder)
 *  - new_member { name, relation, gender, dob } -> create member, use it
 * Returns the patient row id to store in appointments.patient_id
 */
async function resolveBookingPatientId({
  holderId,
  member_patient_id,
  new_member,
  table = "patients",
  conn = pool,
}) {
  assertTable(table);
  if (new_member && String(new_member.name || "").trim()) {
    const m = await createMember(holderId, new_member, table, conn);
    return m.id;
  }
  if (
    member_patient_id === undefined ||
    member_patient_id === null ||
    member_patient_id === "" ||
    String(member_patient_id) === String(holderId)
  ) {
    return holderId;
  }
  const [rows] = await conn.query(
    `SELECT id FROM \`${table}\` WHERE id = ? AND parent_patient_id = ? LIMIT 1`,
    [member_patient_id, holderId],
  );
  if (!rows.length) {
    const e = new Error("Selected family member does not belong to this account");
    e.status = 400;
    throw e;
  }
  return rows[0].id;
}

module.exports = {
  RELATIONS,
  findHolderByMobile,
  getHolderId,
  listMembers,
  familyIds,
  createMember,
  updateMember,
  deleteMember,
  resolveBookingPatientId,
};
