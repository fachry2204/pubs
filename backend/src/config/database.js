const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

// Explicitly load .env from project root
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath, override: true });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pubs_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
