const { Notification, User } = require('../models/Project');
const socketManager = require('../socket/socketManager');

/**
 * Notification Service
 * Handles sending notifications to users based on different targeting criteria
 */
class NotificationService {
    /**
     * Send notification to all users
     * @param {Object} notificationData - Notification data
     * @returns {Promise<Array>} - Array of created notifications
     */
    async sendToAll(notificationData) {
        try {
            const users = await User.find({ status: 'active' });
            const notifications = [];

            // Create notification for each user
            for (const user of users) {
                const notification = await this.createNotification({
                    ...notificationData,
                    user: user._id
                });
                
                notifications.push(notification);
                
                // Send real-time notification if user is connected
                this.sendRealTimeNotification(user._id, notification);
            }

            return notifications;
        } catch (error) {
            console.error('Error sending notification to all users:', error);
            throw error;
        }
    }

    /**
     * Send notification to users with specific role
     * @param {Object} notificationData - Notification data
     * @param {String} role - User role (admin, user)
     * @returns {Promise<Array>} - Array of created notifications
     */
    async sendByRole(notificationData, role) {
        try {
            const users = await User.find({ role, status: 'active' });
            const notifications = [];

            // Create notification for each user with the specified role
            for (const user of users) {
                const notification = await this.createNotification({
                    ...notificationData,
                    user: user._id
                });
                
                notifications.push(notification);
                
                // Send real-time notification if user is connected
                this.sendRealTimeNotification(user._id, notification);
            }

            return notifications;
        } catch (error) {
            console.error(`Error sending notification to users with role ${role}:`, error);
            throw error;
        }
    }

    /**
     * Send notification to specific users
     * @param {Object} notificationData - Notification data
     * @param {Array} userIds - Array of user IDs
     * @returns {Promise<Array>} - Array of created notifications
     */
    async sendToSpecificUsers(notificationData, userIds) {
        try {
            const users = await User.find({ 
                _id: { $in: userIds },
                status: 'active'
            });
            
            const notifications = [];

            // Create notification for each specified user
            for (const user of users) {
                const notification = await this.createNotification({
                    ...notificationData,
                    user: user._id
                });
                
                notifications.push(notification);
                
                // Send real-time notification if user is connected
                this.sendRealTimeNotification(user._id, notification);
            }

            return notifications;
        } catch (error) {
            console.error('Error sending notification to specific users:', error);
            throw error;
        }
    }

    /**
     * Create a notification in the database
     * @param {Object} notificationData - Notification data
     * @returns {Promise<Object>} - Created notification
     */
    async createNotification(notificationData) {
        try {
            const notification = new Notification(notificationData);
            await notification.save();
            return notification;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    /**
     * Send real-time notification to a user via socket.io
     * @param {String} userId - User ID
     * @param {Object} notification - Notification object
     */
    sendRealTimeNotification(userId, notification) {
        try {
            // Get socket manager instance
            const io = socketManager.getIO();
            
            if (!io) {
                console.warn('Socket.io not initialized, skipping real-time notification');
                return;
            }
            
            // Emit to user's room (user-{userId})
            io.to(`user-${userId}`).emit('notification', {
                notification: {
                    _id: notification._id,
                    type: notification.type,
                    title: notification.title,
                    message: notification.message,
                    image: notification.image,
                    link: notification.link,
                    isRead: notification.isRead,
                    createdAt: notification.createdAt
                }
            });
            
        } catch (error) {
            console.error('Error sending real-time notification:', error);
        }
    }

    /**
     * Get recent notifications for a user
     * @param {String} userId - User ID
     * @param {Number} limit - Maximum number of notifications to return
     * @returns {Promise<Array>} - Array of notifications
     */
    async getUserNotifications(userId, limit = 10) {
        try {
            return await Notification.find({ user: userId })
                .sort({ createdAt: -1 })
                .limit(limit);
        } catch (error) {
            console.error('Error getting user notifications:', error);
            throw error;
        }
    }

    /**
     * Mark a notification as read
     * @param {String} notificationId - Notification ID
     * @param {String} userId - User ID
     * @returns {Promise<Object>} - Updated notification
     */
    async markAsRead(notificationId, userId) {
        try {
            const notification = await Notification.findOneAndUpdate(
                { _id: notificationId, user: userId },
                { isRead: true },
                { new: true }
            );
            
            return notification;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }

    /**
     * Mark all notifications as read for a user
     * @param {String} userId - User ID
     * @returns {Promise<Object>} - Update result
     */
    async markAllAsRead(userId) {
        try {
            const result = await Notification.updateMany(
                { user: userId, isRead: false },
                { isRead: true }
            );
            
            return result;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    }

    /**
     * Get recent notifications sent by admins
     * @param {Number} limit - Maximum number of notifications to return
     * @returns {Promise<Array>} - Array of notifications
     */
    async getRecentAdminNotifications(limit = 20) {
        try {
            // Get distinct notifications by title and message (to avoid duplicates for mass notifications)
            const notifications = await Notification.aggregate([
                { $sort: { createdAt: -1 } },
                { $group: {
                    _id: { title: "$title", message: "$message", type: "$type" },
                    notification: { $first: "$$ROOT" }
                }},
                { $replaceRoot: { newRoot: "$notification" } },
                { $sort: { createdAt: -1 } },
                { $limit: limit }
            ]);
            
            return notifications;
        } catch (error) {
            console.error('Error getting recent admin notifications:', error);
            throw error;
        }
    }
}

module.exports = new NotificationService(); 