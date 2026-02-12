const pool = require('../config/database');

async function migrate() {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to database.');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS creators (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        nik VARCHAR(50),
        birth_place VARCHAR(100),
        birth_date DATE,
        address TEXT,
        religion VARCHAR(50),
        marital_status VARCHAR(50),
        occupation VARCHAR(100),
        nationality VARCHAR(50),
        ktp_path VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Creators table created successfully.');
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();