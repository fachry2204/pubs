const SongModel = require('../models/songModel');
const xlsx = require('xlsx');

const createSong = async (req, res, next) => {
  try {
    // Check if writers is a string (from FormData) and parse it
    let writersData = req.body.writers;
    if (typeof writersData === 'string') {
        try {
            writersData = JSON.parse(writersData);
        } catch (e) {
            writersData = [];
        }
    }

    const songData = { ...req.body };
    delete songData.writers;
    
    // Set user_id from token
    songData.user_id = req.user.id;
    
    // Default status pending for user creation
    if (req.user.role !== 'admin') {
        songData.status = 'pending';
    }

    // Handle file upload
    if (req.file) {
        songData.lyrics_file = 'uploads/' + req.file.filename;
    }

    const songId = await SongModel.create(songData, writersData);

    res.status(201).json({ message: 'Song created', id: songId });
  } catch (error) {
    next(error);
  }
};

const getSongs = async (req, res, next) => {
  try {
    const filters = {};
    if (req.user.role !== 'admin') {
      filters.user_id = req.user.id;
    }
    if (req.query.writer_name) {
        filters.writer_name = req.query.writer_name;
    }
    const songs = await SongModel.findAll(filters);
    res.json(songs);
  } catch (error) {
    next(error);
  }
};

const getSongById = async (req, res, next) => {
  try {
    const song = await SongModel.findById(req.params.id);
    if (!song) return res.status(404).json({ message: 'Song not found' });
    
    // Authorization check
    if (req.user.role !== 'admin' && song.user_id !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
    }
    
    res.json(song);
  } catch (error) {
    next(error);
  }
};

const updateSong = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if writers is a string (from FormData) and parse it
    let writersData = req.body.writers;
    if (typeof writersData === 'string') {
        try {
            writersData = JSON.parse(writersData);
        } catch (e) {
            writersData = [];
        }
    }

    const data = { ...req.body };
    delete data.writers;
    
    const song = await SongModel.findById(id);
    if (!song) return res.status(404).json({ message: 'Song not found' });

    // Authorization
    if (req.user.role !== 'admin' && song.user_id !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    // Validation for Admin changing status to accepted
    if (req.user.role === 'admin' && data.status === 'accepted') {
        if (!data.song_id && !song.song_id) {
            return res.status(400).json({ message: 'Song ID is required when status is accepted' });
        }
    }
    
    // Prevent user from changing critical fields if needed, or status
    if (req.user.role !== 'admin') {
        delete data.status; // User cannot change status
        delete data.song_id; // User cannot change song_id
    }

    // Handle file upload
    if (req.file) {
        data.lyrics_file = 'uploads/' + req.file.filename;
    }

    await SongModel.update(id, data, writersData);

    res.json({ message: 'Song updated' });
  } catch (error) {
    next(error);
  }
};

const deleteSong = async (req, res, next) => {
  try {
    const { id } = req.params;
    const song = await SongModel.findById(id);
    if (!song) return res.status(404).json({ message: 'Song not found' });

    if (req.user.role !== 'admin' && song.user_id !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    await SongModel.delete(id);
    res.json({ message: 'Song deleted' });
  } catch (error) {
    next(error);
  }
};

const exportSongs = async (req, res, next) => {
  try {
    const filters = {};
    if (req.user.role !== 'admin') {
      filters.user_id = req.user.id;
    }
    const songs = await SongModel.findAll(filters);
    
    // Transform data for excel
    const data = songs.map(song => {
        const writers = song.writers || [];
        const writerNames = writers.map(w => w.name).join(' | ');
        const writerRoles = writers.map(w => w.role).join(' | ');
        // Remove trailing .00 from percentage
        const writerShares = writers.map(w => parseFloat(w.share_percent).toString() + '%').join(' | ');

        const songData = { ...song };
        delete songData.writers; // Remove original writers array

        return {
            ...songData,
            writer_names: writerNames,
            writer_roles: writerRoles,
            writer_shares: writerShares
        };
    });

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Songs");
    
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Disposition', 'attachment; filename="songs.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

const importSongs = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    let successCount = 0;
    let errors = [];

    for (const row of data) {
      try {
        if (!row.title) {
            throw new Error('Title is required');
        }

        let writers = [];
        // Check for new split format first
        if (row.writer_names) {
            const names = String(row.writer_names).split('|').map(s => s.trim());
            const roles = row.writer_roles ? String(row.writer_roles).split('|').map(s => s.trim()) : [];
            const shares = row.writer_shares ? String(row.writer_shares).split('|').map(s => s.trim()) : [];

            // Use the length of names as the base
            for (let i = 0; i < names.length; i++) {
                if (names[i]) {
                    // Remove % from share if present
                    let share = shares[i] ? shares[i].replace('%', '') : '0';
                    writers.push({
                        name: names[i],
                        role: roles[i] || 'Author',
                        share_percent: share
                    });
                }
            }
        } else if (row.writers) {
            // Fallback to old JSON format
            try {
                writers = JSON.parse(row.writers);
            } catch (e) {
                // If not JSON, maybe comma separated? or just ignore
                console.warn('Failed to parse writers JSON for song', row.title);
            }
        }

        const songData = {
            title: row.title,
            performer: row.performer || '',
            genre: row.genre || '',
            language: row.language || '',
            region: row.region || '',
            iswc: row.iswc ? String(row.iswc) : null,
            isrc: row.isrc ? String(row.isrc) : null,
            note: row.note || '',
            duration: row.duration || 0,
            status: 'pending', // Default status for imports
            user_id: req.user.id
        };
        
        // Debug Log
        console.log('Importing Row:', row);

        if (req.user.role === 'admin') {
            if (row.status) songData.status = row.status;
            // Check for song_id, or custom_id, or id (from excel export)
            // Use String() to ensure it's text, but check if it exists first
            if (row.song_id !== undefined && row.song_id !== null) {
                songData.song_id = String(row.song_id);
            } else if (row.custom_id !== undefined && row.custom_id !== null) {
                songData.song_id = String(row.custom_id);
            }
            // Fix: if song_id is missing, set to empty string or handle appropriately to avoid undefined error
            if (!songData.song_id) {
                songData.song_id = '';
            }
            
            // Allow admin to import user_id if present in Excel
            if (row.user_id) {
                // Ensure user_id is a valid number
                const importedUserId = parseInt(row.user_id);
                if (!isNaN(importedUserId) && importedUserId > 0) {
                    songData.user_id = importedUserId;
                }
            }
        }

        await SongModel.create(songData, writers);
        successCount++;
      } catch (err) {
        console.error(`Import error for row ${row.title}:`, err);
        errors.push({ title: row.title || 'Unknown', error: err.message });
      }
    }

    res.json({ 
      message: `Import complete. ${successCount} imported.`, 
      errors: errors.length > 0 ? errors : undefined 
    });

  } catch (error) {
    next(error);
  }
};

module.exports = { createSong, getSongs, getSongById, updateSong, deleteSong, exportSongs, importSongs };
