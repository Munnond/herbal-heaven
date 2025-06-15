document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const user = token ? JSON.parse(localStorage.getItem('user')) : null;

    if (!user) {
        // Redirect to login if not logged in
        window.location.href = '/login.html?redirect=/notifications.html';
        return;
    }

    // Load notifications
    loadNotifications();

    // Setup event listeners
    setupEventListeners();
});

// Load Notifications
async function loadNotifications() {
    try {
        const token = localStorage.getItem('token');
        
        // Get all notifications
        const response = await fetch('/api/notifications', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const notifications = await response.json();
        
        // Display notifications
        displayNotifications(notifications);
    } catch (error) {
        console.error('Error loading notifications:', error);
        showToast('Error loading notifications', 'red');
    }
}

// Display Notifications
function displayNotifications(notifications) {
    const notificationsList = document.getElementById('notifications-list');
    const noNotifications = document.getElementById('no-notifications');
    const notificationsLoading = document.getElementById('notifications-loading');

    // Hide loading spinner
    notificationsLoading.style.display = 'none';

    // Check if there are notifications
    if (notifications.length === 0) {
        noNotifications.style.display = 'block';
        notificationsList.style.display = 'none';
        return;
    }

    // Show notifications list
    noNotifications.style.display = 'none';
    notificationsList.style.display = 'block';

    // Generate notifications HTML
    notificationsList.innerHTML = notifications.map(notification => `
        <div class="notification-card card ${notification.isRead ? '' : 'unread'}">
            <div class="card-content">
                <div class="notification-header">
                    <div class="notification-type chip ${getTypeColor(notification.type)}">
                        ${getTypeLabel(notification.type)}
                    </div>
                    <span class="notification-time right">${formatNotificationTime(notification.createdAt)}</span>
                </div>
                <div class="notification-body">
                    <h5 class="notification-title">${notification.title}</h5>
                    <p class="notification-message">${notification.message}</p>
                    ${notification.image ? `
                        <div class="notification-image">
                            <img src="${notification.image}" alt="Notification Image" class="responsive-img">
                        </div>
                    ` : ''}
                </div>
                <div class="notification-actions">
                    ${notification.link ? `
                        <a href="${notification.link}" class="btn-flat green-text waves-effect">
                            View Details
                            <i class="material-icons right">arrow_forward</i>
                        </a>
                    ` : ''}
                    ${!notification.isRead ? `
                        <button class="btn-flat waves-effect mark-read-btn" data-id="${notification._id}">
                            Mark as Read
                            <i class="material-icons right">done</i>
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');

    // Add event listeners to mark as read buttons
    const markReadButtons = document.querySelectorAll('.mark-read-btn');
    markReadButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const notificationId = button.getAttribute('data-id');
            await markNotificationAsRead(notificationId);
        });
    });
}

// Setup Event Listeners
function setupEventListeners() {
    // Mark all as read button
    const markAllReadBtn = document.getElementById('mark-all-read-btn');
    markAllReadBtn.addEventListener('click', markAllAsRead);
}

// Mark Notification as Read
async function markNotificationAsRead(id) {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`/api/notifications/${id}/read`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            // Reload notifications
            loadNotifications();
            
            // Update notification count in the navbar
            if (typeof window.fetchNotifications === 'function') {
                window.fetchNotifications();
            }
            
            showToast('Notification marked as read');
        } else {
            throw new Error('Failed to mark notification as read');
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
        showToast('Error marking notification as read', 'red');
    }
}

// Mark All Notifications as Read
async function markAllAsRead() {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch('/api/notifications/mark-all-read', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            // Reload notifications
            loadNotifications();
            
            // Update notification count in the navbar
            if (typeof window.fetchNotifications === 'function') {
                window.fetchNotifications();
            }
            
            showToast('All notifications marked as read');
        } else {
            throw new Error('Failed to mark all notifications as read');
        }
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        showToast('Error marking all notifications as read', 'red');
    }
}

// Helper Functions
function getTypeColor(type) {
    switch (type) {
        case 'product':
            return 'green';
        case 'order':
            return 'blue';
        case 'system':
            return 'orange';
        default:
            return 'grey';
    }
}

function getTypeLabel(type) {
    switch (type) {
        case 'product':
            return 'Product';
        case 'order':
            return 'Order';
        case 'system':
            return 'System';
        default:
            return 'General';
    }
}

function formatNotificationTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
    });
}

// Show Toast Message
function showToast(message, classes = 'green') {
    M.toast({
        html: message,
        classes: classes,
        displayLength: 3000
    });
} 