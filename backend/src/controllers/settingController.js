const SettingModel = require('../models/settingModel');

const getSettings = async (req, res, next) => {
    try {
        const settings = await SettingModel.get();
        res.json(settings || {});
    } catch (error) {
        next(error);
    }
};

const updateSettings = async (req, res, next) => {
    try {
        const data = { ...req.body };
        
        // Handle Logo
        if (req.files && req.files['logo'] && req.files['logo'][0]) {
            data.logo = '/uploads/logo/' + req.files['logo'][0].filename;
        }

        // Handle Login Background
        if (req.files && req.files['login_background'] && req.files['login_background'][0]) {
            data.login_background = '/uploads/logo/' + req.files['login_background'][0].filename; 
        }

        // Handle App Icon (Favicon)
        if (req.files && req.files['app_icon'] && req.files['app_icon'][0]) {
            data.app_icon = '/uploads/logo/' + req.files['app_icon'][0].filename;
        }

        // Handle Social Image
        if (req.files && req.files['social_image'] && req.files['social_image'][0]) {
            data.social_image = '/uploads/logo/' + req.files['social_image'][0].filename;
        }

        console.log('Updating settings with:', data); // Debug log
        await SettingModel.update(data);
        res.json({ message: 'Settings updated' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getSettings, updateSettings };
