/**
 * Socket Notifications
 * Handles real-time notifications via Socket.IO
 */
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) return;

    // Initialize Socket.IO connection
    const socket = io({
        auth: {
            token: token
        }
    });

    // Connection events
    socket.on('connect', () => {
        console.log('Socket connected');
    });

    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
    });

    // Listen for notifications
    socket.on('notification', (data) => {
        console.log('Received notification:', data);
        
        // Update notification badge
        updateNotificationBadge();
        
        // Show toast notification if enabled
        if (shouldShowToast()) {
            showNotificationToast(data.notification);
        }
        
        // Update notifications dropdown if it exists
        if (typeof updateNotificationsDropdown === 'function') {
            updateNotificationsDropdown([data.notification]);
        }
    });

    /**
     * Check if toast notifications are enabled
     * @returns {Boolean} - True if toast notifications are enabled
     */
    function shouldShowToast() {
        // Get user preferences from localStorage or use default (true)
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.notificationPreferences?.pushNotifications !== false;
    }

    /**
     * Show toast notification
     * @param {Object} notification - Notification object
     */
    function showNotificationToast(notification) {
        // Check if Materialize is available
        if (typeof M !== 'undefined' && M.toast) {
            // Create toast HTML
            let toastHTML = `
                <div class="notification-toast">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                </div>
            `;
            
            // Show toast
            M.toast({
                html: toastHTML,
                classes: `notification-toast-container ${notification.type}-notification`,
                displayLength: 5000,
                completeCallback: function() {
                    // Handle toast dismissed
                }
            });
        }
    }

    /**
     * Update notification badge count
     */
    function updateNotificationBadge() {
        // Fetch unread count
        fetch('/api/notifications/unread-count', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            const badge = document.querySelector('.notification-badge');
            if (badge) {
                if (data.count > 0) {
                    badge.textContent = data.count > 99 ? '99+' : data.count;
                    badge.style.display = 'block';
                } else {
                    badge.style.display = 'none';
                }
            }
        })
        .catch(error => console.error('Error updating notification badge:', error));
    }

    // Initial badge update
    updateNotificationBadge();
}); 