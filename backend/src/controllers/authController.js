const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    await UserModel.create({ name, email, password, role });
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findByEmail(email);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check status - Exempt admin and operator from status checks
    if (user.role === 'user' && user.status !== 'accepted') {
        return res.status(403).json({ 
            message: 'Account not active', 
            status: user.status || 'pending',
            detail: 'Your account is currently under review or pending approval.'
        });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
    try {
        const user = await UserModel.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        next(error);
    }
}

const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { email, password } = req.body;
        
        // Only allow updating email and password
        const updateData = {};
        if (email) updateData.email = email;
        if (password) updateData.password = password;
        
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No valid fields to update' });
        }
        
        await UserModel.update(userId, updateData);
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = { register, login, getMe, updateProfile };
