const mysql = require('mysql2/promise');

async function ensureDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });
    await connection.query('CREATE DATABASE IF NOT EXISTS `pubs_db`');
    console.log('Database pubs_db ensured');
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('Failed to ensure database:', error.message);
    process.exit(1);
  }
}

ensureDatabase();
