const NotificationModel = require('../models/notificationModel');

const notificationController = {
    getMyNotifications: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const notifications = await NotificationModel.getByUser(userId);
            const unreadCount = await NotificationModel.getUnreadCount(userId);
            
            res.json({
                notifications,
                unreadCount
            });
        } catch (error) {
            next(error);
        }
    },

    markRead: async (req, res, next) => {
        try {
            const { id } = req.params;
            await NotificationModel.markAsRead(id);
            res.json({ message: 'Marked as read' });
        } catch (error) {
            next(error);
        }
    },

    markAllRead: async (req, res, next) => {
        try {
            const userId = req.user.id;
            await NotificationModel.markAllAsRead(userId);
            res.json({ message: 'All marked as read' });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = notificationController;