const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function addRoleColumn() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'pubs_db'
    });

    console.log('Connected to database.');

    // Check if column exists
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'writers' AND COLUMN_NAME = 'role'
    `, [process.env.DB_NAME || 'pubs_db']);

    if (columns.length === 0) {
      console.log('Adding role column to writers table...');
      await connection.query('ALTER TABLE writers ADD COLUMN role VARCHAR(100)');
      console.log('Column added successfully.');
    } else {
      console.log('Column role already exists.');
    }

  } catch (error) {
    console.error('Error updating schema:', error);
  } finally {
    if (connection) await connection.end();
  }
}

addRoleColumn();
