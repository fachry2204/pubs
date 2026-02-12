const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(verifyToken);

router.post('/import', isAdmin, upload.single('report'), reportController.uploadReport);
router.get('/history', isAdmin, reportController.getImportHistory);
router.delete('/history/:id', isAdmin, reportController.deleteImportHistory);
router.get('/', reportController.getReports);
router.get('/analytics', reportController.getAnalytics);
router.get('/top-stats', reportController.getTopStats);

module.exports = router;
