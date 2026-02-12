const PaymentModel = require('../models/paymentModel');
const NotificationModel = require('../models/notificationModel');

const createPayment = async (req, res, next) => {
    try {
        await PaymentModel.create(req.body);
        res.status(201).json({ message: 'Payment created' });
    } catch (error) {
        next(error);
    }
};

const getPayments = async (req, res, next) => {
    try {
        let payments;
        if (req.user.role === 'admin') {
            payments = await PaymentModel.getAll();
        } else {
            payments = await PaymentModel.getByUserId(req.user.id);
        }
        res.json(payments);
    } catch (error) {
        next(error);
    }
};

const getCalculatedPayments = async (req, res, next) => {
    try {
        const { month, year } = req.query;
        const userId = req.user.role === 'admin' ? null : req.user.id;
        const data = await PaymentModel.calculateRevenue(month, year, userId);
        res.json(data);
    } catch (error) {
        next(error);
    }
};

const updateStatus = async (req, res, next) => {
    try {
        const { user_id, month, year, status } = req.body;
        let proof_file = null;
        
        if (req.file) {
            proof_file = '/uploads/proof/' + req.file.filename;
        }

        const existing = await PaymentModel.findByUserAndPeriod(user_id, month, year);
        
        if (existing) {
            await PaymentModel.updateStatus(existing.id, status, proof_file);
        } else {
            // Create new record
            await PaymentModel.create({
                user_id,
                amount: 0, 
                note: 'Generated from Calculation',
                payment_date: new Date(),
                month,
                year,
                status,
                proof_file: proof_file // pass proof_file correctly
            });
        }
        
        // Notify User
        const monthName = new Date(0, month - 1).toLocaleString('default', { month: 'long' });
        let title = 'Update Pembayaran';
        let message = `Status pembayaran untuk periode ${monthName} ${year} telah diperbarui menjadi: ${status}.`;
        
        if (status === 'success') {
            title = 'Pembayaran Berhasil';
            message = `Hore! Pembayaran royalti periode ${monthName} ${year} telah ditransfer.`;
        } else if (status === 'process') {
            title = 'Pembayaran Diproses';
            message = `Pembayaran royalti periode ${monthName} ${year} sedang diproses.`;
        }

        await NotificationModel.create({
            user_id,
            title,
            message,
            type: status === 'success' ? 'success' : 'info'
        });

        res.json({ message: 'Status updated' });
    } catch (error) {
        next(error);
    }
};

const updateWriterStatus = async (req, res, next) => {
    try {
        const { user_id, month, year, writer_name, status } = req.body;
        let proof_file = null;
        
        if (req.file) {
            proof_file = '/uploads/proof/' + req.file.filename;
        }

        await PaymentModel.updateWriterStatus({
            user_id, month, year, writer_name, status, proof_file
        });
        
        res.json({ message: 'Writer payment status updated' });
    } catch (error) {
        next(error);
    }
};

module.exports = { createPayment, getPayments, getCalculatedPayments, updateStatus, updateWriterStatus };
