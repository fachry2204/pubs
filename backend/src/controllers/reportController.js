const xlsx = require('xlsx');
const ReportModel = require('../models/reportModel');
const pool = require('../config/database');

const uploadReport = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    // Columns: Custom ID, Judul, Pencipta, Asal Report, Revenue, Deduction, Net Revenue, Sub Publisher Share, TBW Share
    // Mapping: Custom ID -> songs.song_id
    
    const reportsToInsert = [];
    const errors = [];
    
    // Cache songs to minimize DB queries
    const [songs] = await pool.query('SELECT id, song_id FROM songs WHERE song_id IS NOT NULL');
    const songMap = new Map(); // song_id_string -> internal_id
    songs.forEach(s => songMap.set(String(s.song_id).trim(), s.id));

    const today = new Date();
    // Use provided month/year or default to current
    const currentMonth = req.body.month ? parseInt(req.body.month) : today.getMonth() + 1;
    const currentYear = req.body.year ? parseInt(req.body.year) : today.getFullYear();
    const period = req.body.period;

    for (const row of data) {
      const customId = row['Custom ID'] ? String(row['Custom ID']).trim() : '';
      let songId = null;

      if (customId && songMap.has(customId)) {
        songId = songMap.get(customId);
      } else {
        if (customId) {
            errors.push(`Custom ID ${customId} not found in songs database`);
        }
      }

      // Parse numbers (handle string formats if any, though xlsx usually handles numbers)
      const parseNum = (val) => {
          if (typeof val === 'number') return val;
          if (typeof val === 'string') {
              return parseFloat(val.replace(/[^0-9.-]+/g, '')) || 0;
          }
          return 0;
      };

      reportsToInsert.push({
        song_id: songId,
        custom_id: customId,
        title: row['Judul'] || '',
        writer: row['Pencipta'] || '',
        source: row['Asal Report'] || '',
        gross_revenue: parseNum(row['Revenue']),
        deduction: parseNum(row['Deduction']),
        net_revenue: parseNum(row['Net Revenue']),
        sub_pub_share: parseNum(row['Sub Publisher Share']),
        tbw_share: parseNum(row['TBW Share']),
        month: currentMonth,
        year: currentYear
      });
    }

    if (reportsToInsert.length > 0) {
      await ReportModel.createBulk(reportsToInsert);
      
      // Create History
      await ReportModel.createImportHistory({
        file_name: req.file.originalname,
        month: currentMonth,
        year: currentYear,
        period: period || '',
        total_records: reportsToInsert.length,
        status: errors.length > 0 ? 'Partial' : 'Success'
      });
    }

    res.json({
      message: 'Report processed',
      inserted: reportsToInsert.length,
      errors: errors
    });

  } catch (error) {
    next(error);
  }
};

const getReports = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    let reports;
    let summary = {
      total_net_revenue: 0,
      total_sub_pub_share: 0,
      total_tbw_share: 0
    };

    if (req.user.role === 'admin') {
      reports = await ReportModel.getAll(month, year);
      summary = await ReportModel.getSummaryByPeriod(month, year);
    } else {
      reports = await ReportModel.getByUserId(req.user.id, month, year);
      summary = await ReportModel.getSummaryByPeriod(month, year, req.user.id);
    }
    res.json({ reports, summary });
  } catch (error) {
    next(error);
  }
};

const getAnalytics = async (req, res, next) => {
    try {
        const userId = req.user.role === 'admin' ? null : req.user.id;
        const { year } = req.query; // Add year filter support for chart
        const data = await ReportModel.getMonthlyRevenue(userId, year);
        res.json(data);
    } catch (error) {
        next(error);
    }
};

const getImportHistory = async (req, res, next) => {
    try {
        const history = await ReportModel.getImportHistory();
        res.json(history);
    } catch (error) {
        next(error);
    }
};

const deleteImportHistory = async (req, res, next) => {
    try {
        const { id } = req.params;
        await ReportModel.deleteImportHistory(id);
        res.json({ message: 'History deleted' });
    } catch (error) {
        next(error);
    }
};

const getTopStats = async (req, res, next) => {
    try {
        const { type, page = 1, limit = 5, month, year } = req.query;
        const userId = req.user.role === 'admin' ? null : req.user.id;
        
        // If user is not admin, they can't see 'users' top list (makes no sense)
        if (type === 'users' && req.user.role !== 'admin') {
            return res.json([]);
        }

        const data = await ReportModel.getTopPerformers(type, userId, parseInt(page), parseInt(limit), month, year);
        res.json(data);
    } catch (error) {
        next(error);
    }
};

module.exports = { uploadReport, getReports, getAnalytics, getImportHistory, deleteImportHistory, getTopStats };
