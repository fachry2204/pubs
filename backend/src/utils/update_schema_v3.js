const pool = require('../config/database');

const updateSchema = async () => {
  try {
    const connection = await pool.getConnection();
    
    // 1. Add phone to creators if not exists
    const [cColumns] = await connection.query(`SHOW COLUMNS FROM creators`);
    const cColumnNames = cColumns.map(c => c.Field);
    
    if (!cColumnNames.includes('phone')) {
      await connection.query(`ALTER TABLE creators ADD COLUMN phone VARCHAR(20)`);
      console.log('Added phone column to creators');
    }

    // 2. Create writer_payments table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS writer_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        writer_name VARCHAR(255),
        amount DECIMAL(15, 2),
        month INT,
        year INT,
        status ENUM('pending', 'process', 'success') DEFAULT 'pending',
        proof_file VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_writer_period (writer_name, month, year),
        INDEX idx_user_period (user_id, month, year)
      )
    `);
    console.log('Created writer_payments table');

    console.log('Database schema updated successfully');
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('Error updating schema:', error);
    process.exit(1);
  }
};

updateSchema();
