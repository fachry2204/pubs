const pool = require('../config/database');

const NotificationModel = {
    ensureTable: async () => {
        const connection = await pool.getConnection();
        try {
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
        } finally {
            connection.release();
        }
    },

    create: async ({ user_id, title, message, type = 'info' }) => {
        await NotificationModel.ensureTable();
        try {
            const [result] = await pool.query(
                'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
                [user_id, title, message, type]
            );
            return result.insertId;
        } catch (error) {
            console.error('Failed to create notification:', error);
            // Don't throw, just log so main process continues
            return null;
        }
    },

    getByUser: async (userId) => {
        await NotificationModel.ensureTable();
        const [rows] = await pool.query(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
            [userId]
        );
        return rows;
    },

    getUnreadCount: async (userId) => {
        await NotificationModel.ensureTable();
        const [rows] = await pool.query(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
            [userId]
        );
        return rows[0].count;
    },

    markAsRead: async (id) => {
        await NotificationModel.ensureTable();
        await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [id]);
    },

    markAllAsRead: async (userId) => {
        await NotificationModel.ensureTable();
        await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [userId]);
    },

    // Helper to notify all admins
    notifyAdmins: async ({ title, message, type }) => {
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
    }
};

module.exports = NotificationModel;