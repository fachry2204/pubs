const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');

const register = async (req, res, next) => {
  try {
    const { name, email, password, role, whatsapp, address, country, province, city, district, subdistrict } = req.body;
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    await UserModel.create({ name, email, password, role, whatsapp, address, country, province, city, district, subdistrict });
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

    // REMOVED: Status check block that returned 403
    // We now allow login for all statuses so frontend can show appropriate status page
    
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
        role: user.role,
        status: user.status || 'pending' // Send status to frontend
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

const checkAvailability = async (req, res, next) => {
    try {
        const { email, whatsapp } = req.body;
        
        if (email) {
            const existingEmail = await UserModel.findByEmail(email);
            if (existingEmail) {
                return res.json({ 
                    available: false, 
                    field: 'email', 
                    message: 'Email sudah terdaftar. Silakan gunakan email lain atau login.' 
                });
            }
        }

        if (whatsapp) {
            const existingWhatsapp = await UserModel.findByWhatsapp(whatsapp);
            if (existingWhatsapp) {
                return res.json({ 
                    available: false, 
                    field: 'whatsapp', 
                    message: 'Nomor WhatsApp sudah terdaftar. Silakan gunakan nomor lain.' 
                });
            }
        }

        res.json({ available: true });
    } catch (error) {
        next(error);
    }
};

module.exports = { register, login, getMe, updateProfile, checkAvailability };
