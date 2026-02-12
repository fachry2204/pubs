const pool = require('../config/database');
const SongModel = require('../models/songModel');
const ReportModel = require('../models/reportModel');

const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.role === 'admin' ? null : req.user.id;
    
    // Total Summary (Revenue, Shares)
    const summary = await ReportModel.getTotalSummary(userId);
    
    // Monthly Revenue Data
    const monthlyData = await ReportModel.getMonthlyRevenue(userId);

    // Song Stats
    let songStats = { total: 0, pending: 0, approved: 0 };
    if (userId) {
        const [rows] = await pool.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as approved
            FROM songs 
            WHERE user_id = ?
        `, [userId]);
        songStats = rows[0];
    } else {
        const [rows] = await pool.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as approved
            FROM songs
        `);
        songStats = rows[0];
    }
    
    // Total Creators
    const totalCreators = await ReportModel.getTotalCreators(userId);

    // Top Songs
    const topSongs = await ReportModel.getTopSongs(userId);
    
    const stats = {
        totalRevenue: summary.total_sub_pub_share || 0, // Use sub_pub_share as main revenue for now
        totalSubPubShare: summary.total_sub_pub_share || 0,
        totalTBWShare: summary.total_tbw_share || 0,
        totalSongs: songStats.total,
        pendingSongs: songStats.pending,
        approvedSongs: songStats.approved,
        totalCreators,
        topSongs,
        monthlyData
    };

    if (req.user.role === 'admin') {
        const [userRows] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "user"');
        stats.totalUsers = userRows[0].count;
        
        // Total Reports count
        const [reportRows] = await pool.query('SELECT COUNT(*) as count FROM reports');
        stats.totalReports = reportRows[0].count;
    }

    res.json(stats);
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };
