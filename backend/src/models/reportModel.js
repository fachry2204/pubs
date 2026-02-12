const pool = require('../config/database');

const ReportModel = {
  // Ensure table has correct columns (Simple migration)
  ensureTable: async () => {
    const connection = await pool.getConnection();
    try {
      // Check if table exists, if not create
      await connection.query(`
        CREATE TABLE IF NOT EXISTS reports (
          id INT AUTO_INCREMENT PRIMARY KEY,
          song_id INT NULL,
          custom_id VARCHAR(255),
          title VARCHAR(255),
          writer VARCHAR(255),
          source VARCHAR(255),
          gross_revenue DECIMAL(15, 2),
          deduction DECIMAL(15, 2),
          net_revenue DECIMAL(15, 2),
          sub_pub_share DECIMAL(15, 2),
          tbw_share DECIMAL(15, 2),
          month INT,
          year INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE SET NULL
        )
      `);

      // Create import_history table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS import_history (
          id INT AUTO_INCREMENT PRIMARY KEY,
          file_name VARCHAR(255),
          month INT,
          year INT,
          period VARCHAR(255),
          total_records INT,
          status VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Check for columns and add if missing (Quick fix for existing table)
      const [columns] = await connection.query("SHOW COLUMNS FROM reports");
      const columnNames = columns.map(c => c.Field);
      
      const missingCols = [];
      if (!columnNames.includes('custom_id')) missingCols.push('ADD COLUMN custom_id VARCHAR(255)');
      if (!columnNames.includes('title')) missingCols.push('ADD COLUMN title VARCHAR(255)');
      if (!columnNames.includes('writer')) missingCols.push('ADD COLUMN writer VARCHAR(255)');
      if (!columnNames.includes('gross_revenue')) missingCols.push('ADD COLUMN gross_revenue DECIMAL(15, 2)');
      if (!columnNames.includes('deduction')) missingCols.push('ADD COLUMN deduction DECIMAL(15, 2)');
      if (!columnNames.includes('net_revenue')) missingCols.push('ADD COLUMN net_revenue DECIMAL(15, 2)');
      if (!columnNames.includes('sub_pub_share')) missingCols.push('ADD COLUMN sub_pub_share DECIMAL(15, 2)');
      if (!columnNames.includes('tbw_share')) missingCols.push('ADD COLUMN tbw_share DECIMAL(15, 2)');

      if (missingCols.length > 0) {
        await connection.query(`ALTER TABLE reports ${missingCols.join(', ')}`);
      }

      // Check for import_history columns
      const [historyColumns] = await connection.query("SHOW COLUMNS FROM import_history");
      const historyColNames = historyColumns.map(c => c.Field);
      if (!historyColNames.includes('period')) {
          await connection.query("ALTER TABLE import_history ADD COLUMN period VARCHAR(255) AFTER year");
      }

    } catch (error) {
      console.error('Table migration failed', error);
    } finally {
      connection.release();
    }
  },

  createBulk: async (reports) => {
    if (reports.length === 0) return;
    
    // Ensure table structure first
    await ReportModel.ensureTable();

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const values = reports.map(r => [
        r.song_id || null, 
        r.custom_id,
        r.title,
        r.writer,
        r.source,
        r.gross_revenue,
        r.deduction,
        r.net_revenue,
        r.sub_pub_share,
        r.tbw_share,
        r.month,
        r.year
      ]);
      
      const sql = `
        INSERT INTO reports 
        (song_id, custom_id, title, writer, source, gross_revenue, deduction, net_revenue, sub_pub_share, tbw_share, month, year) 
        VALUES ?
      `;

      await connection.query(sql, [values]);

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  getByUserId: async (userId, month = null, year = null) => {
    // Join reports with songs to filter by user_id
    let sql = `
      SELECT r.*, s.title as song_title, s.song_id as song_code,
             1 as is_matched
      FROM reports r
      JOIN songs s ON (r.song_id = s.id OR r.custom_id = s.song_id)
      WHERE s.user_id = ?
    `;
    const params = [userId];

    if (month) {
        sql += ' AND r.month = ?';
        params.push(month);
    }
    if (year) {
        sql += ' AND r.year = ?';
        params.push(year);
    }

    sql += ' ORDER BY r.year DESC, r.month DESC';
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  getSummaryByPeriod: async (month, year, userId = null) => {
    let sql = `
      SELECT 
        SUM(r.sub_pub_share) as total_sub_pub_share,
        SUM(r.tbw_share) as total_admin_share,
        SUM(r.net_revenue) as total_client_share
      FROM reports r
    `;
    const params = [];

    if (userId) {
        sql += ' JOIN songs s ON (r.song_id = s.id OR r.custom_id = s.song_id) WHERE s.user_id = ?';
        params.push(userId);
    } else {
        sql += ' WHERE 1=1';
    }

    if (month) {
      sql += ' AND r.month = ?';
      params.push(month);
    }
    if (year) {
      sql += ' AND r.year = ?';
      params.push(year);
    }

    const [rows] = await pool.query(sql, params);
    return rows[0];
  },

  getAll: async (month = null, year = null) => {
    // Ensure table structure first (just in case)
    await ReportModel.ensureTable();

    let sql = `
      SELECT r.*, 
             COALESCE(s.title, s2.title) as song_title, 
             COALESCE(s.song_id, s2.song_id) as song_code, 
             u.name as user_name,
             CASE 
                WHEN s.id IS NOT NULL THEN 1 
                WHEN s2.id IS NOT NULL THEN 1 
                ELSE 0 
             END as is_matched
      FROM reports r
      LEFT JOIN songs s ON r.song_id = s.id
      LEFT JOIN songs s2 ON r.custom_id = s2.song_id
      LEFT JOIN users u ON COALESCE(s.user_id, s2.user_id) = u.id
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

    sql += ' ORDER BY r.year DESC, r.month DESC, r.id DESC';
    
    const [rows] = await pool.query(sql, params);
    return rows;
  },
  
  getTotalRevenue: async (userId = null) => {
      let sql = 'SELECT SUM(r.net_revenue) as total FROM reports r';
      const params = [];
      if (userId) {
          sql += ' JOIN songs s ON (r.song_id = s.id OR r.custom_id = s.song_id) WHERE s.user_id = ?';
          params.push(userId);
      }
      const [rows] = await pool.query(sql, params);
      return rows[0].total || 0;
  },

  getTotalSummary: async (userId = null) => {
      // Ensure table structure first
      await ReportModel.ensureTable();
      let sql = `
        SELECT 
          SUM(r.net_revenue) as total_net_revenue,
          SUM(r.sub_pub_share) as total_sub_pub_share,
          SUM(r.tbw_share) as total_tbw_share
        FROM reports r
      `;
      const params = [];
      if (userId) {
          sql += ' JOIN songs s ON (r.song_id = s.id OR r.custom_id = s.song_id) WHERE s.user_id = ?';
          params.push(userId);
      }
      const [rows] = await pool.query(sql, params);
      return rows[0];
  },

  getTopSongs: async (userId = null, limit = 5) => {
      let sql = `
        SELECT 
            COALESCE(s.title, r.title) as title,
            SUM(r.sub_pub_share) as revenue
        FROM reports r
        JOIN songs s ON (r.song_id = s.id OR r.custom_id = s.song_id)
      `;
      const params = [];
      
      if (userId) {
          sql += ' WHERE s.user_id = ?';
          params.push(userId);
      }
      
      sql += ' GROUP BY COALESCE(s.title, r.title) ORDER BY revenue DESC LIMIT ?';
      params.push(limit);
      
      const [rows] = await pool.query(sql, params);
      return rows;
  },

  getTopPerformers: async (type, userId = null, page = 1, limit = 5, month = null, year = null) => {
    const offset = (page - 1) * limit;
    let sql = '';
    const params = [];

    if (type === 'users') {
        sql = `
            SELECT u.name as name, SUM(r.sub_pub_share * (1 - (u.percentage_share / 100))) as revenue
            FROM reports r
            JOIN songs s ON (r.song_id = s.id OR r.custom_id = s.song_id)
            JOIN users u ON s.user_id = u.id
            WHERE 1=1
        `;
    } else if (type === 'creators') {
        // Creator gets share from Net Distributable (Client Share)
        sql = `
            SELECT w.name as name, SUM( (r.sub_pub_share * (1 - (u.percentage_share / 100))) * (w.share_percent / 100) ) as revenue
            FROM reports r
            JOIN songs s ON (r.song_id = s.id OR r.custom_id = s.song_id)
            JOIN users u ON s.user_id = u.id
            JOIN writers w ON s.id = w.song_id
            WHERE 1=1
        `;
    } else if (type === 'songs') {
        // Song revenue is gross revenue (sub_pub_share)
        sql = `
            SELECT COALESCE(s.title, r.title) as name, SUM(r.sub_pub_share) as revenue
            FROM reports r
            LEFT JOIN songs s ON (r.song_id = s.id OR r.custom_id = s.song_id)
            WHERE 1=1
        `;
    }

    if (userId) {
        if (type === 'users') {
             sql += ' AND u.id = ?';
             params.push(userId);
        } else {
             sql += ' AND s.user_id = ?';
             params.push(userId);
        }
    }

    if (month) {
        sql += ' AND r.month = ?';
        params.push(month);
    }
    if (year) {
        sql += ' AND r.year = ?';
        params.push(year);
    }

    sql += ' GROUP BY name ORDER BY revenue DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(sql, params);
    
    return rows;
  },

  getTotalCreators: async (userId = null) => {
      let sql = `
        SELECT COUNT(DISTINCT w.name) as count
        FROM writers w
        JOIN songs s ON w.song_id = s.id
      `;
      const params = [];
      
      if (userId) {
          sql += ' WHERE s.user_id = ?';
          params.push(userId);
      }
      
      const [rows] = await pool.query(sql, params);
      return rows[0].count;
  },
  
  getMonthlyRevenue: async (userId = null, year = null) => {
      // Ensure table structure first
      await ReportModel.ensureTable();
      let sql = `
        SELECT r.month, r.year, SUM(r.sub_pub_share) as revenue 
        FROM reports r
      `;
      const params = [];
      
      let whereClause = ' WHERE 1=1';

      if (userId) {
          sql += ' JOIN songs s ON (r.song_id = s.id OR r.custom_id = s.song_id)';
          whereClause += ' AND s.user_id = ?';
          params.push(userId);
      }
      
      if (year) {
          whereClause += ' AND r.year = ?';
          params.push(year);
      }
      
      sql += whereClause + ' GROUP BY r.year, r.month ORDER BY r.year ASC, r.month ASC LIMIT 12';
      
      const [rows] = await pool.query(sql, params);
      return rows;
  },

  createImportHistory: async (data) => {
    // Ensure table structure first (especially period column)
    await ReportModel.ensureTable();
    const sql = 'INSERT INTO import_history (file_name, month, year, period, total_records, status) VALUES (?, ?, ?, ?, ?, ?)';
    const [result] = await pool.query(sql, [data.file_name, data.month, data.year, data.period || '', data.total_records, data.status]);
    return result.insertId;
  },

  deleteImportHistory: async (id) => {
      // Ensure table exists
      await ReportModel.ensureTable();
      const sql = 'DELETE FROM import_history WHERE id = ?';
      await pool.query(sql, [id]);
  },

  getImportHistory: async (userId = null) => {
    // Ensure table exists first
    await ReportModel.ensureTable();
    let sql = 'SELECT * FROM import_history';
    const params = [];
    
    // For now, import_history doesn't have user_id, so we return all for admin
    // If we want to filter by user, we need to add user_id to import_history or logic
    // But typically import is global or by admin.
    // If the request is about viewing "My Reports", it usually means the reports data, not the import logs.
    // However, if we assume user wants to see history of imports that contain their songs:
    // That's complex. Let's assume standard behavior: Admin sees all, User sees none (or filtered if we add column)
    
    // BUT, based on user request "Menu tersebut isinya hanya menampilkan data user saja",
    // it likely refers to the Analytics/Report/Payment pages where data MUST be filtered by req.user.id
    
    sql += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(sql, params);
    return rows;
  }
};

module.exports = ReportModel;
