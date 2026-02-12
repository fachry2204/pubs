const pool = require('../config/database');

const alterTable = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Check if columns exist
    const [columns] = await connection.query(`SHOW COLUMNS FROM creators`);
    const columnNames = columns.map(c => c.Field);
    
    if (!columnNames.includes('npwp_path')) {
      await connection.query(`ALTER TABLE creators ADD COLUMN npwp_path VARCHAR(255) AFTER ktp_path`);
      console.log('Added npwp_path column');
    }

    if (!columnNames.includes('bank_name')) {
      await connection.query(`ALTER TABLE creators ADD COLUMN bank_name VARCHAR(100)`);
      console.log('Added bank_name column');
    }

    if (!columnNames.includes('bank_account_name')) {
        await connection.query(`ALTER TABLE creators ADD COLUMN bank_account_name VARCHAR(100)`);
        console.log('Added bank_account_name column');
    }

    if (!columnNames.includes('bank_account_number')) {
        await connection.query(`ALTER TABLE creators ADD COLUMN bank_account_number VARCHAR(50)`);
        console.log('Added bank_account_number column');
    }

    console.log('Database schema updated successfully');
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('Error updating schema:', error);
    process.exit(1);
  }
};

alterTable();