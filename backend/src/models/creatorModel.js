const pool = require('../config/database');

const Creator = {
  ensureColumns: async () => {
    try {
      const [check] = await pool.query("SHOW COLUMNS FROM creators LIKE 'user_id'");
      if (check.length === 0) {
        await pool.query("ALTER TABLE creators ADD COLUMN user_id INT NULL");
        console.log("Added user_id column to creators table");
      }
    } catch (error) {
      console.error("Error checking creators columns:", error);
    }
  },

  create: async (data) => {
    await Creator.ensureColumns();
    const {
      name, nik, birth_place, birth_date, address, 
      religion, marital_status, occupation, nationality, ktp_path,
      npwp_path, bank_name, bank_account_name, bank_account_number,
      user_id // Add user_id
    } = data;
    
    const [result] = await pool.query(
      `INSERT INTO creators (
        name, nik, birth_place, birth_date, address, 
        religion, marital_status, occupation, nationality, ktp_path,
        npwp_path, bank_name, bank_account_name, bank_account_number,
        user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, nik, birth_place, birth_date, address, 
        religion, marital_status, occupation, nationality, ktp_path,
        npwp_path, bank_name, bank_account_name, bank_account_number,
        user_id || null
      ]
    );
    return result.insertId;
  },

  getAll: async () => {
    await Creator.ensureColumns();
    const [rows] = await pool.query(`
        SELECT c.*, u.name as user_name 
        FROM creators c
        LEFT JOIN users u ON c.user_id = u.id 
        ORDER BY c.name ASC
    `);
    return rows;
  },

  getByUserId: async (userId) => {
    await Creator.ensureColumns();
    // Debug log
    console.log(`Fetching creators for user_id: ${userId} (type: ${typeof userId})`);
    
    // Ensure userId is treated as number if column is INT
    const [rows] = await pool.query('SELECT * FROM creators WHERE user_id = ? ORDER BY name ASC', [userId]);
    console.log(`Found ${rows.length} creators`);
    
    // Double check with explicit string conversion if needed
    if (rows.length === 0) {
        console.log('Trying with string conversion check...');
        const [retryRows] = await pool.query('SELECT * FROM creators WHERE user_id = ? ORDER BY name ASC', [String(userId)]);
        console.log(`Found ${retryRows.length} creators on retry`);
        if (retryRows.length > 0) return retryRows;
    }
    
    return rows;
  },

  getById: async (id) => {
    const [rows] = await pool.query('SELECT * FROM creators WHERE id = ?', [id]);
    return rows[0];
  },

  delete: async (id) => {
    await pool.query('DELETE FROM creators WHERE id = ?', [id]);
  },

  update: async (id, data) => {
    const fields = [];
    const values = [];
    
    // List of allowed fields to update
    const allowedFields = [
      'name', 'nik', 'birth_place', 'birth_date', 'address', 
      'religion', 'marital_status', 'occupation', 'nationality', 
      'ktp_path', 'npwp_path', 'bank_name', 'bank_account_name', 'bank_account_number',
      'user_id' // Add user_id
    ];

    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }

    if (fields.length === 0) return 0;

    values.push(id);
    const [result] = await pool.query(
      `UPDATE creators SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows;
  }
};

module.exports = Creator;