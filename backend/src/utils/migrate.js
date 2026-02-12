const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');

async function migrate() {
  try {
    // Read schema file
    const schemaPath = path.join(__dirname, '../../schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Create database if not exists
    // Try connecting with database first
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'pubs_db'
        });
        console.log(`Connected to database ${process.env.DB_NAME}`);
    } catch (err) {
        // If connection fails, maybe DB doesn't exist? Try creating it (only if we have permissions)
        console.log('Could not connect to database directly. Attempting to create it...');
        try {
            const rootConnection = await mysql.createConnection({
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || ''
            });
            await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'pubs_db'}\``);
            await rootConnection.end();
            
            // Reconnect with database
            connection = await mysql.createConnection({
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'pubs_db'
            });
        } catch (createErr) {
             console.error('Failed to connect and failed to create database.', createErr);
             throw createErr;
        }
    }

    // Now use the pool (which uses the config) or just use this connection for migration
    // For simplicity, let's use the connection we established
    const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);

    console.log('Running migrations...');
    for (const statement of statements) {
      await connection.query(statement);
    }
    console.log('Schema applied.');

    // Seed Admin
    const [rows] = await connection.query('SELECT * FROM users WHERE email = ?', ['admin@mail.com']);
    if (rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await connection.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Admin', 'admin@mail.com', hashedPassword, 'admin']
      );
      console.log('Admin seeded.');
    } else {
      console.log('Admin already exists.');
    }

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Need to import mysql here since we used it for create db
const mysql = require('mysql2/promise');

migrate();
