const express = require('express');
const router = express.Router();
const writerController = require('../controllers/writerController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', isAdmin, writerController.getWriters);
router.get('/:name', isAdmin, writerController.getWriterDetails);

module.exports = router;
