const express = require('express');
const router = express.Router();
const songController = require('../controllers/songController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.use(verifyToken);

const upload = require('../middleware/uploadMiddleware');

router.post('/', upload.single('lyrics'), songController.createSong);
router.get('/', songController.getSongs);
router.get('/export', songController.exportSongs);
router.post('/import', upload.single('file'), songController.importSongs);
router.get('/:id', songController.getSongById);
router.put('/:id', upload.single('lyrics'), songController.updateSong);
router.delete('/:id', songController.deleteSong);

module.exports = router;
