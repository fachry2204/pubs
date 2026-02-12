const pool = require('../config/database');

const SettingModel = {
    get: async () => {
        const [rows] = await pool.query('SELECT * FROM settings LIMIT 1');
        return rows[0];
    },
    
    update: async (data) => {
        // Ensure table exists
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

        // Check if app_icon column exists
        try {
            const [columns] = await pool.query("SHOW COLUMNS FROM settings LIKE 'app_icon'");
            if (columns.length === 0) {
                await pool.query("ALTER TABLE settings ADD COLUMN app_icon VARCHAR(255) AFTER logo");
            }
        } catch (e) {
            console.error('Error checking columns:', e);
        }

        const current = await SettingModel.get();
        if (current) {
             const fields = [];
             const values = [];
             if (data.company_name !== undefined) { fields.push('company_name = ?'); values.push(data.company_name); }
             if (data.logo !== undefined) { fields.push('logo = ?'); values.push(data.logo); }
             if (data.app_icon !== undefined) { fields.push('app_icon = ?'); values.push(data.app_icon); }
             if (data.login_background !== undefined) { fields.push('login_background = ?'); values.push(data.login_background); }
             
             if (fields.length > 0) {
                 values.push(current.id);
                 await pool.query(`UPDATE settings SET ${fields.join(', ')} WHERE id = ?`, values);
             }
        } else {
             await pool.query(
                 'INSERT INTO settings (company_name, logo, app_icon, login_background) VALUES (?, ?, ?, ?)',
                 [data.company_name, data.logo, data.app_icon, data.login_background]
             );
        }
    }
};

module.exports = SettingModel;
