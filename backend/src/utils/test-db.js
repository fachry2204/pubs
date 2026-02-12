require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') }); // Fix path to .env
const mysql = require('mysql2/promise');

async function testConnection() {
    console.log('Testing Database Connection...');
    console.log('Host:', process.env.DB_HOST);
    console.log('User:', process.env.DB_USER);
    console.log('Database:', process.env.DB_NAME);

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        console.log('✅ Connection Successful!');
        
        const [rows] = await connection.execute('SELECT 1 + 1 AS result');
        console.log('Query Test Result:', rows[0].result);
        
        await connection.end();
    } catch (error) {
        console.error('❌ Connection Failed:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('Hint: Check if your IP is allowed to access the remote database (Remote MySQL in cPanel/Plesk).');
        }
    }
}

testConnection();