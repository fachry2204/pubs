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
                seo_title VARCHAR(255),
                seo_description TEXT,
                social_image VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Check for app_icon column exists
        try {
            const [columns] = await pool.query("SHOW COLUMNS FROM settings LIKE 'app_icon'");
            if (columns.length === 0) {
                await pool.query("ALTER TABLE settings ADD COLUMN app_icon VARCHAR(255) AFTER logo");
            }
            
            const [seoTitleCheck] = await pool.query("SHOW COLUMNS FROM settings LIKE 'seo_title'");
            if (seoTitleCheck.length === 0) {
                await pool.query("ALTER TABLE settings ADD COLUMN seo_title VARCHAR(255) AFTER login_background");
            }

            const [seoDescCheck] = await pool.query("SHOW COLUMNS FROM settings LIKE 'seo_description'");
            if (seoDescCheck.length === 0) {
                await pool.query("ALTER TABLE settings ADD COLUMN seo_description TEXT AFTER seo_title");
            }

            const [socialImageCheck] = await pool.query("SHOW COLUMNS FROM settings LIKE 'social_image'");
            if (socialImageCheck.length === 0) {
                await pool.query("ALTER TABLE settings ADD COLUMN social_image VARCHAR(255) AFTER seo_description");
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
             if (data.seo_title !== undefined) { fields.push('seo_title = ?'); values.push(data.seo_title); }
             if (data.seo_description !== undefined) { fields.push('seo_description = ?'); values.push(data.seo_description); }
             if (data.social_image !== undefined) { fields.push('social_image = ?'); values.push(data.social_image); }
             
             if (fields.length > 0) {
                 values.push(current.id);
                 await pool.query(`UPDATE settings SET ${fields.join(', ')} WHERE id = ?`, values);
             }
        } else {
             await pool.query(
                 'INSERT INTO settings (company_name, logo, app_icon, login_background, seo_title, seo_description, social_image) VALUES (?, ?, ?, ?, ?, ?, ?)',
                 [data.company_name, data.logo, data.app_icon, data.login_background, data.seo_title, data.seo_description, data.social_image]
             );
        }
    }
};

module.exports = SettingModel;
