const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkData() {
    try {
        console.log('Connecting to database...');
        console.log('Host:', process.env.DB_HOST);
        console.log('User:', process.env.DB_USER);
        console.log('Database:', process.env.DB_NAME);

        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('Connected!');

        const [creators] = await connection.execute('SELECT count(*) as count FROM creators');
        console.log('Creators count:', creators[0].count);

        const [songs] = await connection.execute('SELECT count(*) as count FROM songs');
        console.log('Songs count:', songs[0].count);
        
        // Show first 3 creators if any
        if (creators[0].count > 0) {
            const [creatorList] = await connection.execute('SELECT id, name FROM creators LIMIT 3');
            console.log('Sample Creators:', creatorList);
        }

        await connection.end();
    } catch (error) {
        console.error('Database Error:', error);
    }
}

checkData();