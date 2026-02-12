const pool = require('../config/database');

const updateSchema = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Add bank details to creators if not exists
    const [cColumns] = await connection.query(`SHOW COLUMNS FROM creators`);
    const cColumnNames = cColumns.map(c => c.Field);
    
    if (!cColumnNames.includes('bank_name')) {
      await connection.query(`ALTER TABLE creators ADD COLUMN bank_name VARCHAR(100)`);
      console.log('Added bank_name column to creators');
    }

    if (!cColumnNames.includes('bank_account_number')) {
      await connection.query(`ALTER TABLE creators ADD COLUMN bank_account_number VARCHAR(50)`);
      console.log('Added bank_account_number column to creators');
    }
    
    if (!cColumnNames.includes('bank_account_name')) {
        await connection.query(`ALTER TABLE creators ADD COLUMN bank_account_name VARCHAR(100)`);
        console.log('Added bank_account_name column to creators');
    }

    console.log('Database schema updated successfully (v4)');
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('Error updating schema:', error);
    process.exit(1);
  }
};

updateSchema();
