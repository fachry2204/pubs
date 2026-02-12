const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

const upload = require('../middleware/uploadMiddleware');

router.use(verifyToken);
// Remove isAdmin from getCalculatedPayments to allow Users to see their own calculation
router.get('/calculate', paymentController.getCalculatedPayments);
router.post('/status', isAdmin, upload.single('proof'), paymentController.updateStatus);
router.post('/writer-status', isAdmin, upload.single('proof'), paymentController.updateWriterStatus);
router.post('/', isAdmin, paymentController.createPayment);
router.get('/', paymentController.getPayments);

module.exports = router;
