const Creator = require('../models/creatorModel');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');

const createCreator = async (req, res, next) => {
  try {
    const data = req.body;
    
    // Sanitize user_id
    if (data.user_id === '' || data.user_id === 'null' || data.user_id === undefined) {
        data.user_id = null;
    }

    // Handle multiple file uploads
    if (req.files) {
        if (req.files['ktp'] && req.files['ktp'][0]) {
            data.ktp_path = 'uploads/ktp/' + req.files['ktp'][0].filename;
        }
        if (req.files['npwp'] && req.files['npwp'][0]) {
            data.npwp_path = 'uploads/npwp/' + req.files['npwp'][0].filename;
        }
    }
    
    const id = await Creator.create(data);
    res.status(201).json({ message: 'Creator added successfully', id });
  } catch (error) {
    next(error);
  }
};

const getCreators = async (req, res, next) => {
  try {
    let creators;
    // Admin and Operator can see all creators
    if (req.user.role === 'admin' || req.user.role === 'operator') {
      creators = await Creator.getAll();
    } else {
      creators = await Creator.getByUserId(req.user.id);
    }
    res.json(creators);
  } catch (error) {
    next(error);
  }
};

const getCreatorById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const creator = await Creator.getById(id);
    if (!creator) {
      return res.status(404).json({ message: 'Creator not found' });
    }
    res.json(creator);
  } catch (error) {
    next(error);
  }
};

const updateCreator = async (req, res, next) => {
  try {
    const id = req.params.id;
    const data = req.body;

    // Sanitize user_id
    if (data.user_id === '' || data.user_id === 'null' || data.user_id === undefined) {
        data.user_id = null;
    }
    
    // Handle multiple file uploads
    if (req.files) {
        if (req.files['ktp'] && req.files['ktp'][0]) {
            data.ktp_path = 'uploads/ktp/' + req.files['ktp'][0].filename;
        }
        if (req.files['npwp'] && req.files['npwp'][0]) {
            data.npwp_path = 'uploads/npwp/' + req.files['npwp'][0].filename;
        }
    }

    const updated = await Creator.update(id, data);
    if (updated === 0) {
       // Check if creator exists? Or maybe no fields were updated.
       // For now assume success or no changes needed
    }
    
    res.json({ message: 'Creator updated successfully' });
  } catch (error) {
    next(error);
  }
};

const deleteCreator = async (req, res, next) => {
  try {
    const id = req.params.id;
    const creator = await Creator.getById(id);
    
    if (!creator) {
      return res.status(404).json({ message: 'Creator not found' });
    }

    // Optional: Delete associated files (ktp, npwp) if needed
    // if (creator.ktp_path) fs.unlinkSync(creator.ktp_path);
    // if (creator.npwp_path) fs.unlinkSync(creator.npwp_path);

    await Creator.delete(id);
    res.json({ message: 'Creator deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const exportCreators = async (req, res, next) => {
  try {
    const creators = await Creator.getAll();
    const worksheet = xlsx.utils.json_to_sheet(creators);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Creators");
    
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Disposition', 'attachment; filename="creators.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

const importCreators = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    let successCount = 0;
    let errors = [];

    for (const row of data) {
      try {
        // Basic mapping - assume excel headers match db columns or use defaults
        const creatorData = {
          name: row.name,
          nik: row.nik ? String(row.nik) : null,
          birth_place: row.birth_place,
          birth_date: row.birth_date, // Excel might return date number or string
          address: row.address,
          religion: row.religion,
          marital_status: row.marital_status,
          occupation: row.occupation,
          nationality: row.nationality || 'WNI',
          bank_name: row.bank_name,
          bank_account_name: row.bank_account_name,
          bank_account_number: row.bank_account_number ? String(row.bank_account_number) : null
        };

        // TODO: Add validation if needed
        await Creator.create(creatorData);
        successCount++;
      } catch (err) {
        errors.push({ name: row.name, error: err.message });
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

module.exports = { createCreator, getCreators, getCreatorById, updateCreator, deleteCreator, exportCreators, importCreators };