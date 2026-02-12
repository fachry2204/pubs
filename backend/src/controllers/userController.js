const UserModel = require('../models/userModel');
const bcrypt = require('bcryptjs');

const getUsers = async (req, res, next) => {
  try {
    const users = await UserModel.getAll();
    res.json(users);
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
    try {
        const id = await UserModel.create(req.body);
        res.status(201).json({ message: 'User created', id });
    } catch (error) {
        next(error);
    }
}

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    await UserModel.update(id, req.body);
    res.json({ message: 'User updated' });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    await UserModel.delete(id);
    res.json({ message: 'User deleted' });
  } catch (error) {
    next(error);
  }
};

const generateContract = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await UserModel.findById(id);
        
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        // Mock contract generation logic
        // In a real app, this would generate a PDF or DOCX file
        const contractData = {
            userId: user.id,
            userName: user.name,
            share: user.percentage_share,
            date: new Date().toISOString(),
            status: 'Draft'
        };
        
        // For now, just return success
        res.json({ 
            message: 'Contract generated successfully', 
            contract: contractData 
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getUsers, createUser, updateUser, deleteUser, generateContract };
