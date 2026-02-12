const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const UserModel = {
  ensureTable: async () => {
      try {
          await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role ENUM('admin', 'user', 'operator') DEFAULT 'user',
                status ENUM('pending', 'review', 'accepted', 'rejected') DEFAULT 'pending',
                percentage_share DECIMAL(5,2) DEFAULT 0.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);
          await UserModel.ensureColumns(); // Then check for extra columns
      } catch (err) {
          console.error("Error ensuring users table:", err);
      }
  },

  // Check if columns exist and add them if not
  ensureColumns: async () => {
    try {
      // Check for status column
      const [statusCheck] = await pool.query("SHOW COLUMNS FROM users LIKE 'status'");
      if (statusCheck.length === 0) {
        await pool.query("ALTER TABLE users ADD COLUMN status ENUM('pending', 'review', 'accepted', 'rejected') DEFAULT 'pending'");
        // Set existing users to accepted so they don't get locked out
        await pool.query("UPDATE users SET status = 'accepted'");
      }

      // Check for percentage_share column
      const [shareCheck] = await pool.query("SHOW COLUMNS FROM users LIKE 'percentage_share'");
      if (shareCheck.length === 0) {
        await pool.query("ALTER TABLE users ADD COLUMN percentage_share DECIMAL(5,2) DEFAULT 0.00");
      }

      // Check for new address/contact columns
      const newColumns = [
          { name: 'whatsapp', type: 'VARCHAR(20)' },
          { name: 'address', type: 'TEXT' },
          { name: 'country', type: 'VARCHAR(100)' },
          { name: 'province', type: 'VARCHAR(100)' },
          { name: 'city', type: 'VARCHAR(100)' },
          { name: 'district', type: 'VARCHAR(100)' },
          { name: 'subdistrict', type: 'VARCHAR(100)' },
          { name: 'rejected_reason', type: 'TEXT' }
      ];

      for (const col of newColumns) {
          const [check] = await pool.query(`SHOW COLUMNS FROM users LIKE '${col.name}'`);
          if (check.length === 0) {
              await pool.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
          }
      }

      // Check for role column modification (to support 'operator')
      // Note: modifying ENUM in MySQL usually requires recreating the column definition
      const [roleCheck] = await pool.query("SHOW COLUMNS FROM users LIKE 'role'");
      if (roleCheck.length > 0) {
          const type = roleCheck[0].Type;
          if (!type.includes("'operator'")) {
              await pool.query("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'user', 'operator') DEFAULT 'user'");
          }
      }

    } catch (error) {
      console.error('Error ensuring user columns:', error);
    }
  },

  findByEmail: async (email) => {
    // Ensure columns exist before querying
    await UserModel.ensureColumns();
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  },

  findByWhatsapp: async (whatsapp) => {
    await UserModel.ensureColumns();
    const [rows] = await pool.query('SELECT * FROM users WHERE whatsapp = ?', [whatsapp]);
    return rows[0];
  },
  
  create: async (userData) => {
    await UserModel.ensureColumns();
    const { name, email, password, role, whatsapp, address, country, province, city, district, subdistrict } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role, status, whatsapp, address, country, province, city, district, subdistrict) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role || 'user', 'pending', whatsapp, address, country, province, city, district, subdistrict]
    );
    return result.insertId;
  },

  findById: async (id) => {
    const [rows] = await pool.query('SELECT id, name, email, role, status, percentage_share, whatsapp, address, country, province, city, district, subdistrict, rejected_reason, created_at FROM users WHERE id = ?', [id]);
    return rows[0];
  },

  getAll: async () => {
      await UserModel.ensureColumns();
      const [rows] = await pool.query('SELECT id, name, email, role, status, percentage_share, rejected_reason, created_at FROM users ORDER BY created_at DESC');
      return rows;
  },

  update: async (id, data) => {
      const fields = [];
      const values = [];
      if (data.name) { fields.push('name = ?'); values.push(data.name); }
      if (data.email) { fields.push('email = ?'); values.push(data.email); }
      if (data.role) { fields.push('role = ?'); values.push(data.role); }
      if (data.status) { fields.push('status = ?'); values.push(data.status); }
      if (data.percentage_share !== undefined) { fields.push('percentage_share = ?'); values.push(data.percentage_share); }
      if (data.rejected_reason !== undefined) { fields.push('rejected_reason = ?'); values.push(data.rejected_reason); }
      if (data.password) { 
          const hashed = await bcrypt.hash(data.password, 10);
          fields.push('password = ?'); values.push(hashed);
      }
      
      if (fields.length === 0) return 0;
      
      values.push(id);
      const [result] = await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
      return result.affectedRows;
  },

  delete: async (id) => {
      const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
      return result.affectedRows;
  }
};

module.exports = UserModel;
