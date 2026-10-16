const pool = require('../config/db');

// ---------- MEDICINES ----------
exports.getAllMedicines = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT m.*, c.name AS clinic_name FROM medicines m LEFT JOIN clinics c ON c.id = m.clinic_id ORDER BY m.name`
  );
  res.json({ success: true, medicines: rows });
};

exports.createMedicine = async (req, res) => {
  const { name, category, unit, stock_qty, reorder_level, price_per_unit, expiry_date, supplier, clinic_id } = req.body;
  const [result] = await pool.query(
    `INSERT INTO medicines (name, category, unit, stock_qty, reorder_level, price_per_unit, expiry_date, supplier, clinic_id)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [name, category, unit || 'strip', stock_qty || 0, reorder_level || 10, price_per_unit || 0, expiry_date || null, supplier, clinic_id || null]
  );
  res.status(201).json({ success: true, id: result.insertId });
};

exports.updateMedicine = async (req, res) => {
  const fields = req.body;
  const keys = Object.keys(fields);
  if (keys.length === 0) return res.status(400).json({ success: false, message: 'No fields' });
  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  await pool.query(`UPDATE medicines SET ${setClause} WHERE id = ?`, [...keys.map((k) => fields[k]), req.params.id]);
  res.json({ success: true, message: 'Medicine updated' });
};

exports.deleteMedicine = async (req, res) => {
  await pool.query('DELETE FROM medicines WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Medicine removed' });
};

exports.getLowStockMedicines = async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM medicines WHERE stock_qty <= reorder_level ORDER BY stock_qty ASC');
  res.json({ success: true, medicines: rows });
};

// ---------- EQUIPMENT ----------
exports.getAllEquipment = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT e.*, c.name AS clinic_name FROM equipment e LEFT JOIN clinics c ON c.id = e.clinic_id ORDER BY e.name`
  );
  res.json({ success: true, equipment: rows });
};

exports.createEquipment = async (req, res) => {
  const { name, category, clinic_id, purchase_date, warranty_till, last_service_date, next_service_date, status, notes } = req.body;
  const [result] = await pool.query(
    `INSERT INTO equipment (name, category, clinic_id, purchase_date, warranty_till, last_service_date, next_service_date, status, notes)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [name, category, clinic_id || null, purchase_date || null, warranty_till || null, last_service_date || null, next_service_date || null, status || 'working', notes]
  );
  res.status(201).json({ success: true, id: result.insertId });
};

exports.updateEquipment = async (req, res) => {
  const fields = req.body;
  const keys = Object.keys(fields);
  if (keys.length === 0) return res.status(400).json({ success: false, message: 'No fields' });
  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  await pool.query(`UPDATE equipment SET ${setClause} WHERE id = ?`, [...keys.map((k) => fields[k]), req.params.id]);
  res.json({ success: true, message: 'Equipment updated' });
};

exports.deleteEquipment = async (req, res) => {
  await pool.query('DELETE FROM equipment WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Equipment removed' });
};
