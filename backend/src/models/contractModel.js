const pool = require('../config/database');

const ContractModel = {
    create: async (userId, filePath) => {
        const [result] = await pool.query(
            'INSERT INTO contracts (user_id, file_path) VALUES (?, ?)',
            [userId, filePath]
        );
        return result.insertId;
    },
    
    getByUserId: async (userId) => {
        const [rows] = await pool.query('SELECT * FROM contracts WHERE user_id = ? ORDER BY created_at DESC', [userId]);
        return rows;
    },

    getAll: async () => {
         const [rows] = await pool.query(`
            SELECT c.*, u.name as user_name 
            FROM contracts c
            JOIN users u ON c.user_id = u.id
            ORDER BY c.created_at DESC
        `);
        return rows;
    }
};

module.exports = ContractModel;
