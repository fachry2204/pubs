const ContractModel = require('../models/contractModel');

const uploadContract = async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        const { user_id } = req.body;
        if (!user_id) return res.status(400).json({ message: 'User ID required' });
        
        await ContractModel.create(user_id, req.file.path);
        res.status(201).json({ message: 'Contract uploaded' });
    } catch (error) {
        next(error);
    }
};

const getContracts = async (req, res, next) => {
    try {
        let contracts;
        if (req.user.role === 'admin') {
            contracts = await ContractModel.getAll();
        } else {
            contracts = await ContractModel.getByUserId(req.user.id);
        }
        res.json(contracts);
    } catch (error) {
        next(error);
    }
};

module.exports = { uploadContract, getContracts };
