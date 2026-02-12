const express = require('express');
const router = express.Router();
const creatorController = require('../controllers/creatorController');
const upload = require('../middleware/uploadMiddleware');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyToken, creatorController.getCreators);
router.get('/export', verifyToken, isAdmin, creatorController.exportCreators);
router.post('/import', verifyToken, isAdmin, upload.single('file'), creatorController.importCreators);
router.get('/:id', verifyToken, isAdmin, creatorController.getCreatorById);
router.put('/:id', verifyToken, isAdmin, upload.fields([
    { name: 'ktp', maxCount: 1 },
    { name: 'npwp', maxCount: 1 }
]), creatorController.updateCreator);
router.delete('/:id', verifyToken, isAdmin, creatorController.deleteCreator);
router.post('/', verifyToken, isAdmin, upload.fields([
    { name: 'ktp', maxCount: 1 },
    { name: 'npwp', maxCount: 1 }
]), creatorController.createCreator);

module.exports = router;