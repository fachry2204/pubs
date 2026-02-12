const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

// Explicitly load .env from project root (same logic as database.js)
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath, override: true });

console.log('Testing Database Connection...');
console.log('Host:', process.env.DB_HOST);
console.log('User:', process.env.DB_USER);
console.log('Database:', process.env.DB_NAME);

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'pubs_db'
    });
    
    console.log('✅ Connection successful!');
    
    const [rows] = await connection.execute('SELECT * FROM users WHERE email = ?', ['admin@mail.com']);
    console.log('User check for admin@mail.com:');
    if (rows.length > 0) {
        console.log('✅ User found:', rows[0].email, 'Role:', rows[0].role);
    } else {
        console.log('❌ User NOT found!');
        
        // List all users
        const [allUsers] = await connection.execute('SELECT id, name, email, role FROM users');
        console.log('Existing users:', allUsers);
    }

    // Check creators table
    const [creators] = await connection.execute('SELECT COUNT(*) as count FROM creators');
    console.log('Creators count:', creators[0].count);

    await connection.end();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testConnection();
