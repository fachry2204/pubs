const pool = require('../config/database');

const getWriters = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        name, 
        MAX(role) as role, 
        COUNT(song_id) as total_songs 
      FROM writers 
      GROUP BY name
      ORDER BY name ASC
    `);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

const getWriterDetails = async (req, res, next) => {
    try {
        const { name } = req.params;
        // Get all songs for this writer
        const [rows] = await pool.query(`
            SELECT w.*, s.title, s.song_id as song_code 
            FROM writers w
            JOIN songs s ON w.song_id = s.id
            WHERE w.name = ?
        `, [name]);
        res.json(rows);
    } catch (error) {
        next(error);
    }
}

module.exports = { getWriters, getWriterDetails };
