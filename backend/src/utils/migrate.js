const pool = require('../config/database');
const bcrypt = require('bcryptjs');

// Import Models
const UserModel = require('../models/userModel');
const SongModel = require('../models/songModel');
const NotificationModel = require('../models/notificationModel');
const ReportModel = require('../models/reportModel');
const PaymentModel = require('../models/paymentModel');
const ContractModel = require('../models/contractModel');
const CreatorModel = require('../models/creatorModel');
const SettingModel = require('../models/settingModel');

async function migrate() {
  console.log('Starting Database Migration & Initialization...');

  try {
    // 1. Users Table (Core)
    console.log('Ensuring Users Table...');
    await UserModel.ensureTable();

    // 2. Songs & Writers Table (Depends on Users)
    console.log('Ensuring Songs & Writers Tables...');
    await SongModel.ensureTable();

    // 3. Contracts (Depends on Users)
    console.log('Ensuring Contracts Table...');
    await ContractModel.ensureTable();

    // 4. Creators (Depends on Users)
    console.log('Ensuring Creators Table...');
    await CreatorModel.ensureColumns(); // CreatorModel uses ensureColumns but creates table inside it

    // 5. Reports (Standalone/Linked)
    console.log('Ensuring Reports & Import History Tables...');
    await ReportModel.ensureTable();

    // 6. Payments (Depends on Users)
    console.log('Ensuring Payments Tables...');
    await PaymentModel.ensureTable();

    // 7. Notifications (Depends on Users)
    console.log('Ensuring Notifications Table...');
    await NotificationModel.ensureTable();

    // 8. Settings
    console.log('Ensuring Settings Table...');
    // SettingModel.update() creates table if not exists, but let's call a get or mock update check
    // Actually SettingModel.update does CREATE TABLE IF NOT EXISTS.
    // We can just call a dummy update check or better, add ensureTable to SettingModel.
    // For now, let's just run the CREATE SQL manually here or rely on the app usage.
    // Or we can invoke a lightweight check.
    await pool.query(`
        CREATE TABLE IF NOT EXISTS settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            company_name VARCHAR(255),
            logo VARCHAR(255),
            app_icon VARCHAR(255),
            login_background VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);
    
    // Check for app_icon column
    try {
        const [columns] = await pool.query("SHOW COLUMNS FROM settings LIKE 'app_icon'");
        if (columns.length === 0) {
            await pool.query("ALTER TABLE settings ADD COLUMN app_icon VARCHAR(255) AFTER logo");
            console.log('Added app_icon column to settings');
        }
    } catch (e) {}


    // 9. Seed Admin
    console.log('Seeding Admin User...');
    const adminEmail = 'admin@mail.com';
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [adminEmail]);
    
    if (rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.query(
        'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
        ['Admin', adminEmail, hashedPassword, 'admin', 'accepted']
      );
      console.log('Admin account created: admin@mail.com / admin123');
    } else {
      console.log('Admin account already exists.');
    }

    console.log('Migration Completed Successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Migration Failed:', error);
    process.exit(1);
  }
}

migrate();