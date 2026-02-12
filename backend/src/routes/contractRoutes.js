const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(verifyToken);
router.post('/', isAdmin, upload.single('contract'), contractController.uploadContract);
router.get('/', contractController.getContracts);

module.exports = router;
