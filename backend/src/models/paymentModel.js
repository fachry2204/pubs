const pool = require('../config/database');

const PaymentModel = {
    ensureTable: async () => {
        const connection = await pool.getConnection();
        try {
            await connection.query(`
                CREATE TABLE IF NOT EXISTS payments (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    amount DECIMAL(15, 2) NOT NULL,
                    note TEXT,
                    payment_date DATE,
                    month INT,
                    year INT,
                    status ENUM('pending', 'process', 'success') DEFAULT 'pending',
                    proof_file VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            `);
            
            await connection.query(`
                 CREATE TABLE IF NOT EXISTS writer_payments (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    writer_name VARCHAR(255) NOT NULL,
                    amount DECIMAL(15, 2) NOT NULL,
                    month INT,
                    year INT,
                    status ENUM('pending', 'process', 'success') DEFAULT 'pending',
                    proof_file VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Check if status column exists in payments table
            const [columns] = await connection.query("SHOW COLUMNS FROM payments");
            const columnNames = columns.map(c => c.Field);

            const missingCols = [];
            if (!columnNames.includes('month')) missingCols.push('ADD COLUMN month INT');
            if (!columnNames.includes('year')) missingCols.push('ADD COLUMN year INT');
            if (!columnNames.includes('status')) missingCols.push("ADD COLUMN status ENUM('pending', 'process', 'success') DEFAULT 'pending'");
            if (!columnNames.includes('proof_file')) missingCols.push('ADD COLUMN proof_file VARCHAR(255)');
            
            if (missingCols.length > 0) {
                await connection.query(`ALTER TABLE payments ${missingCols.join(', ')}`);
            }
        } catch (error) {
            console.error('Table migration failed', error);
        } finally {
            connection.release();
        }
    },

    create: async (data) => {
        const { user_id, amount, note, payment_date, month, year, status, proof_file } = data;
        await PaymentModel.ensureTable();
        const [result] = await pool.query(
            'INSERT INTO payments (user_id, amount, note, payment_date, month, year, status, proof_file) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [user_id, amount, note, payment_date, month, year, status || 'pending', proof_file]
        );
        return result.insertId;
    },
    
    updateStatus: async (id, status, proof_file = null) => {
        await PaymentModel.ensureTable();
        let sql = 'UPDATE payments SET status = ?';
        const params = [status];
        
        if (proof_file) {
            sql += ', proof_file = ?';
            params.push(proof_file);
        }
        
        sql += ' WHERE id = ?';
        params.push(id);
        
        const [result] = await pool.query(sql, params);
        return result.affectedRows;
    },

    updateWriterStatus: async ({ user_id, month, year, writer_name, status, proof_file }) => {
        const connection = await pool.getConnection();
        try {
            // Check if exists
            const [rows] = await connection.query(
                'SELECT id FROM writer_payments WHERE user_id = ? AND month = ? AND year = ? AND writer_name = ?',
                [user_id, month, year, writer_name]
            );

            if (rows.length > 0) {
                // Update
                let sql = 'UPDATE writer_payments SET status = ?';
                const params = [status];
                if (proof_file) {
                    sql += ', proof_file = ?';
                    params.push(proof_file);
                }
                sql += ' WHERE id = ?';
                params.push(rows[0].id);
                await connection.query(sql, params);
            } else {
                // Insert
                await connection.query(
                    'INSERT INTO writer_payments (user_id, writer_name, amount, month, year, status, proof_file) VALUES (?, ?, 0, ?, ?, ?, ?)',
                    [user_id, writer_name, month, year, status, proof_file]
                );
            }
        } finally {
            connection.release();
        }
    },

    findByUserAndPeriod: async (userId, month, year) => {
        await PaymentModel.ensureTable();
        const [rows] = await pool.query(
            'SELECT * FROM payments WHERE user_id = ? AND month = ? AND year = ? LIMIT 1',
            [userId, month, year]
        );
        return rows[0];
    },
    
    getByUserId: async (userId) => {
        const [rows] = await pool.query('SELECT * FROM payments WHERE user_id = ? ORDER BY payment_date DESC', [userId]);
        return rows;
    },
    
    getAll: async () => {
        const [rows] = await pool.query(`
            SELECT p.*, u.name as user_name 
            FROM payments p
            JOIN users u ON p.user_id = u.id
            ORDER BY p.payment_date DESC
        `);
        return rows;
    },

    calculateRevenue: async (month, year, userId = null) => {
        const connection = await pool.getConnection();
        try {
            // 1. Fetch relevant reports with song and user data
            let sql = `
                SELECT 
                    r.id as report_id, r.sub_pub_share, r.month, r.year,
                    s.id as song_id, s.title as song_title, 
                    u.id as user_id, u.name as user_name, u.percentage_share as user_percentage,
                    COALESCE(s.song_id, r.custom_id) as custom_id
                FROM reports r
                JOIN songs s ON (r.song_id = s.id OR r.custom_id = s.song_id)
                JOIN users u ON s.user_id = u.id
                WHERE 1=1
            `;
            const params = [];
            
            if (month) {
                sql += ' AND r.month = ?';
                params.push(month);
            }
            if (year) {
                sql += ' AND r.year = ?';
                params.push(year);
            }
            if (userId) {
                sql += ' AND u.id = ?';
                params.push(userId);
            }
            
            const [reports] = await connection.query(sql, params);
            
            if (reports.length === 0) return [];

            // 2. Fetch writers for the involved songs
            const songIds = [...new Set(reports.map(r => r.song_id))];
            let writers = [];
            let creatorDetails = {};

            if (songIds.length > 0) {
                let writerSql = 'SELECT * FROM writers WHERE song_id IN (?)';
                const writerParams = [songIds];

                // If user is not admin, filter writers to only show those belonging to the user's songs
                // Actually, if we filter by userId above, we already get songs belonging to the user.
                // But for writers, a song might have multiple writers.
                // If the user is a Publisher/Admin, they see all writers.
                // If the user is a songwriter (User role), they typically only see themselves? 
                // Or if they are a publisher-client, they see all writers under their catalog.
                // Based on "di pembayaran tampilkan data user sesuai dengan pencipta yang user tersebut miliki":
                // If the user is the owner of the song (which they are if we filtered by userId), 
                // they should see all writers for that song because they are responsible for distributing (or just viewing).
                
                // However, if the request implies filtering the *list of writers* displayed:
                // Let's assume standard behavior: Show all writers for the songs owned by the user.
                // The current logic does this because we query writers by song_ids, and song_ids are already filtered by user_id.
                
                const [writerRows] = await connection.query(writerSql, writerParams);
                writers = writerRows;

                // Fetch creator details by matching names
                const writerNames = [...new Set(writers.map(w => w.name))];
                if (writerNames.length > 0) {
                    const [creatorRows] = await connection.query(
                        'SELECT name, phone, bank_name, bank_account_number, bank_account_name FROM creators WHERE name IN (?)',
                        [writerNames]
                    );
                    creatorRows.forEach(c => {
                        creatorDetails[c.name] = {
                            phone: c.phone,
                            bank_name: c.bank_name,
                            bank_account_number: c.bank_account_number,
                            bank_account_name: c.bank_account_name
                        };
                    });
                }
            }

            // Group writers by song
            const writersBySong = {};
            writers.forEach(w => {
                if (!writersBySong[w.song_id]) writersBySong[w.song_id] = [];
                writersBySong[w.song_id].push(w);
            });

            // 3. Calculate
            // Group by User -> Period (Month-Year) -> Song -> Writers
            // If month/year is specified, we just return one entry per user
            // If month/year is NOT specified (all), we return multiple entries per user (one for each month-year)
            
            const results = [];
            
            // Helper to get key for grouping
            // ALWAYS group by period now, regardless of filter, to show separate rows
            const getGroupKey = (r) => {
                return `${r.user_id}-${r.month}-${r.year}`; 
            };

            const periodMap = {};

            for (const r of reports) {
                const key = getGroupKey(r);
                
                if (!periodMap[key]) {
                    periodMap[key] = {
                        user_id: r.user_id,
                        user_name: r.user_name,
                        user_percentage: parseFloat(r.user_percentage || 0),
                        month: r.month,
                        year: r.year,
                        total_revenue: 0,
                        admin_share: 0,
                        net_share: 0,
                        songs: {},
                        payment_status: 'pending', 
                        payment_id: null,
                        proof_file: null
                    };
                }

                const entry = periodMap[key];
                const revenue = parseFloat(r.sub_pub_share || 0);
                
                const adminCut = revenue * (entry.user_percentage / 100);
                const net = revenue - adminCut;

                entry.total_revenue += revenue;
                entry.admin_share += adminCut;
                entry.net_share += net;

                // Song breakdown
                if (!entry.songs[r.song_id]) {
                    entry.songs[r.song_id] = {
                        song_id: r.song_id,
                        title: r.song_title,
                        revenue: 0,
                        net_distributable: 0,
                        writers: []
                    };
                }
                
                const song = entry.songs[r.song_id];
                song.revenue += revenue;
                song.net_distributable += net;
            }

            // Fetch payment statuses
            const keys = Object.keys(periodMap);
            let writerPayments = [];
            
            if (keys.length > 0) {
                await PaymentModel.ensureTable();
                
                // Get all user IDs involved
                const userIds = [...new Set(Object.values(periodMap).map(e => e.user_id))];
                
                let sql = 'SELECT * FROM payments WHERE user_id IN (?)';
                const params = [userIds];
                
                // If specific period requested, filter query too
                if (year) { sql += ' AND year = ?'; params.push(year); }
                if (month) { sql += ' AND month = ?'; params.push(month); }
                
                const [payments] = await connection.query(sql, params);

                // Fetch writer payments status
                let wpSql = 'SELECT * FROM writer_payments WHERE user_id IN (?)';
                const wpParams = [userIds];
                if (year) { wpSql += ' AND year = ?'; wpParams.push(year); }
                if (month) { wpSql += ' AND month = ?'; wpParams.push(month); }
                
                const [wp] = await connection.query(wpSql, wpParams);
                writerPayments = wp;
                
                for (const key of keys) {
                    const entry = periodMap[key];
                    // Find payment matching user AND month AND year
                    const p = payments.find(pay => 
                        pay.user_id == entry.user_id && 
                        pay.month == entry.month && 
                        pay.year == entry.year
                    );
                    
                    if (p) {
                        entry.payment_status = p.status;
                        entry.payment_id = p.id;
                        entry.proof_file = p.proof_file;
                    }
                }
            }

            // Final formatting
            const finalResults = Object.values(periodMap).map(entry => {
                const songs = Object.values(entry.songs).map(s => {
                    const songWriters = writersBySong[s.song_id] || [];
                    
                    const writerDistribution = songWriters.map(w => {
                        // Find writer payment status
                        const wPayment = writerPayments.find(wp => 
                            wp.user_id == entry.user_id && 
                            wp.month == entry.month && 
                            wp.year == entry.year &&
                            wp.writer_name == w.name
                        );

                        const details = creatorDetails[w.name] || {};

                        return {
                            name: w.name,
                            role: w.role,
                            share_percent: parseFloat(w.share_percent || 0),
                            amount: s.net_distributable * (parseFloat(w.share_percent || 0) / 100),
                            phone: details.phone || null,
                            bank_name: details.bank_name || null,
                            bank_account_number: details.bank_account_number || null,
                            bank_account_name: details.bank_account_name || null,
                            payment_status: wPayment ? wPayment.status : 'pending',
                            payment_proof: wPayment ? wPayment.proof_file : null,
                            writer_payment_id: wPayment ? wPayment.id : null
                        };
                    });

                    return { ...s, writers: writerDistribution };
                });

                return { ...entry, songs };
            });

            // Sort by Year DESC, Month DESC
            finalResults.sort((a, b) => {
                if (a.year !== b.year) return b.year - a.year;
                return b.month - a.month;
            });

            return finalResults;

        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
    }
};

module.exports = PaymentModel;
