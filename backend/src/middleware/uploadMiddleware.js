const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/';
    if (file.fieldname === 'report') {
      folder = 'uploads/reports/';
    } else if (file.fieldname === 'contract') {
      folder = 'uploads/contracts/';
    } else if (file.fieldname === 'logo' || file.fieldname === 'login_background' || file.fieldname === 'app_icon' || file.fieldname === 'social_image') {
      folder = 'uploads/logo/';
    } else if (file.fieldname === 'ktp') {
      folder = 'uploads/ktp/';
    } else if (file.fieldname === 'npwp') {
      folder = 'uploads/npwp/';
    } else if (file.fieldname === 'proof') {
      folder = 'uploads/proof/';
    }
    
    // Ensure directory exists
    // Use path.resolve to ensure absolute path relative to backend root
    const dir = path.resolve(__dirname, '../../uploads', file.fieldname === 'report' ? 'reports' : 
                                                         file.fieldname === 'contract' ? 'contracts' :
                                                         (file.fieldname === 'logo' || file.fieldname === 'login_background' || file.fieldname === 'app_icon' || file.fieldname === 'social_image') ? 'logo' :
                                                         file.fieldname === 'ktp' ? 'ktp' :
                                                         file.fieldname === 'npwp' ? 'npwp' :
                                                         file.fieldname === 'proof' ? 'proof' : '');
    
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

module.exports = upload;
