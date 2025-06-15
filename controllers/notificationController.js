const notificationService = require('../services/notificationService');
const { Notification, User } = require('../models/Project');

/**
 * Get notifications for the authenticated user
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getUserNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 10;
        
        const notifications = await notificationService.getUserNotifications(userId, limit);
        
        res.status(200).json(notifications);
    } catch (error) {
        console.error('Error getting user notifications:', error);
        res.status(500).json({ message: 'Failed to retrieve notifications' });
    }
};

/**
 * Mark a notification as read
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { notificationId } = req.params;
        
        const notification = await notificationService.markAsRead(notificationId, userId);
        
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        
        res.status(200).json({ message: 'Notification marked as read', notification });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Failed to mark notification as read' });
    }
};

/**
 * Mark all notifications as read for the authenticated user
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const result = await notificationService.markAllAsRead(userId);
        
        res.status(200).json({ 
            message: 'All notifications marked as read',
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: 'Failed to mark notifications as read' });
    }
};

/**
 * Get unread notifications count for the authenticated user
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const count = await Notification.countDocuments({ 
            user: userId,
            isRead: false
        });
        
        res.status(200).json({ count });
    } catch (error) {
        console.error('Error getting unread notifications count:', error);
        res.status(500).json({ message: 'Failed to get unread notifications count' });
    }
};

/**
 * Send notification to users (admin only)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.sendNotification = async (req, res) => {
    try {
        const { type, title, message, image, link, target, role, users } = req.body;
        
        // Validate required fields
        if (!type || !title || !message) {
            return res.status(400).json({ message: 'Type, title and message are required' });
        }
        
        // Prepare notification data
        const notificationData = {
            type,
            title,
            message,
            image,
            link
        };
        
        let notifications = [];
        
        // Send notification based on target type
        if (target === 'all') {
            notifications = await notificationService.sendToAll(notificationData);
        } else if (target === 'role' && role) {
            notifications = await notificationService.sendByRole(notificationData, role);
        } else if (target === 'specific' && users && users.length > 0) {
            notifications = await notificationService.sendToSpecificUsers(notificationData, users);
        } else {
            return res.status(400).json({ message: 'Invalid target parameters' });
        }
        
        res.status(201).json({ 
            message: 'Notification sent successfully',
            count: notifications.length
        });
    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).json({ message: 'Failed to send notification' });
    }
};

/**
 * Get recent notifications sent by admins
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getRecentAdminNotifications = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        
        const notifications = await notificationService.getRecentAdminNotifications(limit);
        
        res.status(200).json(notifications);
    } catch (error) {
        console.error('Error getting recent admin notifications:', error);
        res.status(500).json({ message: 'Failed to retrieve recent notifications' });
    }
};

// Create a new notification (admin only)
exports.createNotification = async (req, res) => {
    try {
        const { type, title, message, image, link, userId, targetUsers, conditions } = req.body;
        
        // If targetUsers array is provided, create individual notifications for each user
        if (targetUsers && Array.isArray(targetUsers) && targetUsers.length > 0) {
            const notificationPromises = targetUsers.map(userId => {
                const notification = new Notification({
                    type,
                    title,
                    message,
                    image,
                    link,
                    user: userId
                });
                
                return notification.save()
                    .then(savedNotification => {
                        // Emit socket event for real-time notification to specific user
                        const io = global.io;
                        if (io) {
                            io.to(`user_${userId}`).emit("new_notification", {
                                notification: {
                                    _id: savedNotification._id,
                                    type: savedNotification.type,
                                    title: savedNotification.title,
                                    message: savedNotification.message,
                                    image: savedNotification.image,
                                    link: savedNotification.link,
                                    createdAt: savedNotification.createdAt
                                },
                                count: 1
                            });
                        }
                        return savedNotification;
                    });
            });
            
            const notifications = await Promise.all(notificationPromises);
            res.status(201).json({ 
                message: `Created ${notifications.length} targeted notifications`,
                count: notifications.length 
            });
            
        } else if (conditions && Object.keys(conditions).length > 0) {
            // Find users matching the conditions
            const users = await User.find(conditions);
            
            if (users.length === 0) {
                return res.status(404).json({ message: 'No users match the provided conditions' });
            }
            
            const notificationPromises = users.map(user => {
                const notification = new Notification({
                    type,
                    title,
                    message,
                    image,
                    link,
                    user: user._id
                });
                
                return notification.save()
                    .then(savedNotification => {
                        // Emit socket event for real-time notification to specific user
                        const io = global.io;
                        if (io) {
                            io.to(`user_${user._id}`).emit("new_notification", {
                                notification: {
                                    _id: savedNotification._id,
                                    type: savedNotification.type,
                                    title: savedNotification.title,
                                    message: savedNotification.message,
                                    image: savedNotification.image,
                                    link: savedNotification.link,
                                    createdAt: savedNotification.createdAt
                                },
                                count: 1
                            });
                        }
                        return savedNotification;
                    });
            });
            
            const notifications = await Promise.all(notificationPromises);
            res.status(201).json({ 
                message: `Created ${notifications.length} targeted notifications based on conditions`,
                count: notifications.length 
            });
            
        } else {
            // Single notification (to specific user or public)
            const notification = new Notification({
                type,
                title,
                message,
                image,
                link,
                user: userId || null // if userId is not provided, it's a public notification
            });
            
            await notification.save();
            
            // Emit socket event for real-time notification
            const io = global.io;
            if (io) {
                if (userId) {
                    // User-specific notification
                    io.to(`user_${userId}`).emit("new_notification", {
                        notification: {
                            _id: notification._id,
                            type: notification.type,
                            title: notification.title,
                            message: notification.message,
                            image: notification.image,
                            link: notification.link,
                            createdAt: notification.createdAt
                        },
                        count: 1
                    });
                } else {
                    // Public notification
                    io.to("public_notifications").emit("new_notification", {
                        notification: {
                            _id: notification._id,
                            type: notification.type,
                            title: notification.title,
                            message: notification.message,
                            image: notification.image,
                            link: notification.link,
                            createdAt: notification.createdAt
                        },
                        count: 1
                    });
                }
            }
            
            res.status(201).json(notification);
        }
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ message: 'Error creating notification' });
    }
};

// Helper function to create product notification (for internal use)
exports.createProductNotification = async (product) => {
    try {
        const notification = new Notification({
            type: 'product',
            title: 'New Product Added',
            message: `${product.name} has been added to our store!`,
            image: product.images && product.images.length > 0 ? product.images[0] : null,
            link: `/product-detail.html?id=${product._id}`,
            user: null // public notification
        });
        
        await notification.save();
        
        // Emit socket event for real-time notification
        const io = global.io;
        if (io) {
            console.log('Emitting new_notification event to public_notifications room');
            io.to("public_notifications").emit("new_notification", {
                notification: {
                    _id: notification._id,
                    type: notification.type,
                    title: notification.title,
                    message: notification.message,
                    image: notification.image,
                    link: notification.link,
                    createdAt: notification.createdAt
                },
                count: 1 // Incremental count
            });
        } else {
            console.error('Socket.IO instance not available');
        }
        
        return notification;
    } catch (error) {
        console.error('Error creating product notification:', error);
        throw error;
    }
};

// Create notification for specific users based on condition
exports.createTargetedNotifications = async (options) => {
    try {
        const { type, title, message, image, link, conditions } = options;
        
        // Find users matching the conditions
        const users = await User.find(conditions || {});
        
        if (users.length === 0) {
            console.log('No users match the provided conditions');
            return [];
        }
        
        const notificationPromises = users.map(user => {
            const notification = new Notification({
                type,
                title,
                message,
                image,
                link,
                user: user._id
            });
            
            return notification.save()
                .then(savedNotification => {
                    // Emit socket event for real-time notification to specific user
                    const io = global.io;
                    if (io) {
                        io.to(`user_${user._id}`).emit("new_notification", {
                            notification: {
                                _id: savedNotification._id,
                                type: savedNotification.type,
                                title: savedNotification.title,
                                message: savedNotification.message,
                                image: savedNotification.image,
                                link: savedNotification.link,
                                createdAt: savedNotification.createdAt
                            },
                            count: 1
                        });
                    }
                    return savedNotification;
                });
        });
        
        return await Promise.all(notificationPromises);
    } catch (error) {
        console.error('Error creating targeted notifications:', error);
        throw error;
    }
}; 