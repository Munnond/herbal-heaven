const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const notificationController = require('../controllers/notificationController');

// User notification routes
router.get('/', auth, notificationController.getUserNotifications);
router.get('/unread-count', auth, notificationController.getUnreadCount);
router.put('/:notificationId/read', auth, notificationController.markAsRead);
router.put('/mark-all-read', auth, notificationController.markAllAsRead);

// Admin notification routes
router.post('/send', adminAuth, notificationController.sendNotification);
router.get('/admin/recent', adminAuth, notificationController.getRecentAdminNotifications);

module.exports = router; 