const pool = require('../config/database');

const SongModel = {
  create: async (data, writers) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const {
        song_id, title, other_title, authorized_rights, performer,
        duration, genre, language, region, iswc, isrc, note, status, user_id, lyrics_file
      } = data;

      const [result] = await connection.query(
        `INSERT INTO songs (song_id, title, other_title, authorized_rights, performer, duration, genre, language, region, iswc, isrc, note, status, user_id, lyrics_file)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [song_id || null, title, other_title, authorized_rights, performer, duration, genre, language, region, iswc, isrc, note, status || 'pending', user_id, lyrics_file]
      );
      
      const songId = result.insertId;

      if (writers && writers.length > 0) {
        const writerValues = writers.map(w => [songId, w.name, w.share_percent, w.role]);
        await connection.query(
          'INSERT INTO writers (song_id, name, share_percent, role) VALUES ?',
          [writerValues]
        );
      }

      await connection.commit();
      return songId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  findAll: async (filters = {}) => {
    let sql = `
      SELECT s.*, u.name as user_name 
      FROM songs s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.user_id) {
      sql += ' AND s.user_id = ?';
      params.push(filters.user_id);
    }
    
    if (filters.status) {
        sql += ' AND s.status = ?';
        params.push(filters.status);
    }

    if (filters.writer_name) {
        sql += ' AND EXISTS (SELECT 1 FROM writers w WHERE w.song_id = s.id AND w.name = ?)';
        params.push(filters.writer_name);
    }

    sql += ' ORDER BY s.created_at DESC';

    const [songs] = await pool.query(sql, params);
    
    if (songs.length === 0) {
        return [];
    }

    // Optimized writer fetching
    const songIds = songs.map(s => s.id);
    const [allWriters] = await pool.query(
        'SELECT * FROM writers WHERE song_id IN (?)',
        [songIds]
    );

    const writersBySongId = {};
    for (const writer of allWriters) {
        if (!writersBySongId[writer.song_id]) {
            writersBySongId[writer.song_id] = [];
        }
        writersBySongId[writer.song_id].push(writer);
    }

    for (let song of songs) {
      song.writers = writersBySongId[song.id] || [];
    }
    
    return songs;
  },

  findById: async (id) => {
    const [rows] = await pool.query('SELECT * FROM songs WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    
    const song = rows[0];
    const [writers] = await pool.query('SELECT * FROM writers WHERE song_id = ?', [id]);
    song.writers = writers;
    return song;
  },

  update: async (id, data, writers) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Update Song fields
      const fields = [];
      const values = [];
      const allowed = ['song_id', 'title', 'other_title', 'authorized_rights', 'performer', 'duration', 'genre', 'language', 'region', 'iswc', 'isrc', 'note', 'status', 'rejection_reason', 'lyrics_file'];
      
      for (const key of allowed) {
        if (data[key] !== undefined) {
          fields.push(`${key} = ?`);
          values.push(data[key]);
        }
      }

      if (fields.length > 0) {
        values.push(id);
        await connection.query(`UPDATE songs SET ${fields.join(', ')} WHERE id = ?`, values);
      }

      // Update Writers if provided (Replace all)
      if (writers) {
        await connection.query('DELETE FROM writers WHERE song_id = ?', [id]);
        if (writers.length > 0) {
          const writerValues = writers.map(w => [id, w.name, w.share_percent, w.role]);
          await connection.query(
            'INSERT INTO writers (song_id, name, share_percent, role) VALUES ?',
            [writerValues]
          );
        }
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  delete: async (id) => {
    const [result] = await pool.query('DELETE FROM songs WHERE id = ?', [id]);
    return result.affectedRows;
  },
  
  count: async () => {
      const [rows] = await pool.query('SELECT COUNT(*) as count FROM songs');
      return rows[0].count;
  }
};

module.exports = SongModel;
