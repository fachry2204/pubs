const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', settingController.getSettings);
router.put('/', verifyToken, isAdmin, upload.fields([
    { name: 'logo', maxCount: 1 }, 
    { name: 'login_background', maxCount: 1 },
    { name: 'app_icon', maxCount: 1 }
]), settingController.updateSettings);

module.exports = router;
