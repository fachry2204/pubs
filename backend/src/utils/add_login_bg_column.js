const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

// Explicitly load .env from project root
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath, override: true });

async function addLoginBackgroundColumn() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'pubs_db'
    });
    
    // Check if column exists
    const [columns] = await connection.execute("SHOW COLUMNS FROM settings LIKE 'login_background'");
    if (columns.length === 0) {
        console.log('Adding login_background column...');
        await connection.execute("ALTER TABLE settings ADD COLUMN login_background VARCHAR(255) DEFAULT NULL AFTER logo");
        console.log('Column added successfully.');
    } else {
        console.log('Column login_background already exists.');
    }

    await connection.end();
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

addLoginBackgroundColumn();
