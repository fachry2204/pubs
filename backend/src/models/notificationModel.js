const pool = require('../config/database');

const NotificationModel = {
    ensureTable: async () => {
        let connection;
        try {
            connection = await pool.getConnection();
            await connection.query(`
                CREATE TABLE IF NOT EXISTS notifications (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    message TEXT,
                    is_read BOOLEAN DEFAULT FALSE,
                    type VARCHAR(50) DEFAULT 'info',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            `);
        } catch (err) {
            console.error("Error creating notifications table:", err);
        } finally {
            if (connection) connection.release();
        }
    },

    create: async ({ user_id, title, message, type = 'info' }) => {
        // Ensure table exists (best effort)
        // Note: In high traffic, relying on ensureTable here might be slow. 
        // Better to rely on app initialization.
        // await NotificationModel.ensureTable(); 
        
        try {
            const [result] = await pool.query(
                'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
                [user_id, title, message, type]
            );
            return result.insertId;
        } catch (error) {
            console.error('Failed to create notification:', error);
            // If error is due to table missing (rare if init worked), try to create and retry once
            if (error.code === 'ER_NO_SUCH_TABLE') {
                 await NotificationModel.ensureTable();
                 try {
                    const [retryResult] = await pool.query(
                        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
                        [user_id, title, message, type]
                    );
                    return retryResult.insertId;
                 } catch (retryErr) {
                     console.error('Retry failed:', retryErr);
                 }
            }
            return null;
        }
    },

    getByUser: async (userId) => {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
                [userId]
            );
            return rows;
        } catch (error) {
            // Return empty if table doesn't exist yet
            return [];
        }
    },

    getUnreadCount: async (userId) => {
        try {
            const [rows] = await pool.query(
                'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
                [userId]
            );
            return rows[0].count;
        } catch (error) {
            return 0;
        }
    },

    markAsRead: async (id) => {
        try {
            await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [id]);
        } catch (e) {}
    },

    markAllAsRead: async (userId) => {
        try {
            await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [userId]);
        } catch (e) {}
    },

    // Helper to notify all admins
    notifyAdmins: async ({ title, message, type }) => {
        try {
            // Find all users with role = 'admin'
            const [admins] = await pool.query("SELECT id FROM users WHERE role = 'admin'");
            for (const admin of admins) {
                await NotificationModel.create({
                    user_id: admin.id,
                    title,
                    message,
                    type
                });
            }
        } catch (e) {
            console.error("Failed to notify admins", e);
        }
    }
};

module.exports = NotificationModel;