document.addEventListener('DOMContentLoaded', function() {
    // Load navigation
    loadNavigation();

    // Load footer
    loadFooter();

    // Initialize Materialize components
    initializeMaterialize();
});

// Load Navigation
async function loadNavigation() {
    const navPlaceholder = document.getElementById('nav-placeholder');
    
    // Get user data if logged in
    const token = localStorage.getItem('token');
    const user = token ? JSON.parse(localStorage.getItem('user')) : null;

    // Create navigation HTML
    const navHTML = `
        <nav class="green">
            <div class="nav-wrapper">
                <div class="container">
                    <a href="/products.html" class="brand-logo">Herbal Heaven</a>
                    <a href="#" data-target="mobile-nav" class="sidenav-trigger">
                        <i class="material-icons">menu</i>
                    </a>
                    <ul class="right hide-on-med-and-down">
                        <li><a href="/products.html">Home</a></li>
                        <li><a href="/products.html">Products</a></li>
                        <li><a href="/blog.html">Blog</a></li>
                        <li><a href="/about.html">About</a></li>
                        <li><a href="/contact.html">Contact</a></li>
                        ${user ? `
                            <li>
                                <a href="#!" class="dropdown-trigger notification-bell" data-target="notifications-dropdown">
                                    <i class="material-icons">notifications</i>
                                    <span class="notification-badge new badge" data-badge-caption="" style="display:none"></span>
                                </a>
                            </li>
                            <li>
                                <a href="/cart.html" class="cart-link">
                                    <i class="material-icons left">shopping_cart</i>
                                    Cart
                                    <span class="cart-count new badge" data-badge-caption=""></span>
                                </a>
                            </li>
                            <li>
                                <a class="dropdown-trigger" href="#!" data-target="user-dropdown">
                                    <i class="material-icons left">person</i>
                                    ${user.name}
                                    <i class="material-icons right">arrow_drop_down</i>
                                </a>
                            </li>
                        ` : `
                            <li><a href="/login.html">Login</a></li>
                            <li><a href="/register.html" class="btn waves-effect waves-light white green-text">Sign Up</a></li>
                        `}
                    </ul>
                </div>
            </div>
        </nav>

        <!-- User Dropdown -->
        ${user ? `
            <ul id="user-dropdown" class="dropdown-content">
                <li><a href="/profile.html">My Profile</a></li>
                <li><a href="/orders.html">My Orders</a></li>
                ${user.role === 'admin' ? `
                    <li class="divider"></li>
                    <li><a href="/admin/dashboard.html">Admin Dashboard</a></li>
                ` : ''}
                <li class="divider"></li>
                <li><a href="#!" onclick="handleLogout()">Logout</a></li>
            </ul>
        ` : ''}

        <!-- Notifications Dropdown -->
        ${user ? `
            <ul id="notifications-dropdown" class="dropdown-content notifications-dropdown">
                <li class="notifications-header">
                    <span class="title">Notifications</span>
                    <a href="#!" class="mark-all-read right" onclick="markAllNotificationsAsRead()">Mark all as read</a>
                </li>
                <li class="divider"></li>
                <li class="notifications-loading">
                    <div class="preloader-wrapper small active">
                        <div class="spinner-layer spinner-green-only">
                            <div class="circle-clipper left">
                                <div class="circle"></div>
                            </div>
                            <div class="gap-patch">
                                <div class="circle"></div>
                            </div>
                            <div class="circle-clipper right">
                                <div class="circle"></div>
                            </div>
                        </div>
                    </div>
                </li>
                <li class="no-notifications" style="display:none">
                    <p class="center-align">No notifications</p>
                </li>
                <li class="notifications-list" style="display:none">
                    <!-- Notifications will be populated here -->
                </li>
                <li class="divider"></li>
                <li><a href="/notifications.html" class="center-align">View All Notifications</a></li>
            </ul>
        ` : ''}

        <!-- Mobile Navigation -->
        <ul class="sidenav" id="mobile-nav">
            <li>
                <div class="user-view">
                    <div class="background green">
                        <img src="/images/nav-bg.jpg" alt="Background">
                    </div>
                    ${user ? `
                        <a href="/profile.html">
                            <img class="circle" src="${user.avatar || '/images/avatars/default.jpg'}" alt="User">
                        </a>
                        <a href="/profile.html">
                            <span class="white-text name">${user.name}</span>
                        </a>
                        <a href="/profile.html">
                            <span class="white-text email">${user.email}</span>
                        </a>
                    ` : `
                        <div class="center-align" style="padding: 20px;">
                            <a href="/login.html" class="btn-flat white-text">Login</a>
                            <a href="/register.html" class="btn white green-text">Sign Up</a>
                        </div>
                    `}
                </div>
            </li>
            <li><a href="/index.html"><i class="material-icons">home</i>Home</a></li>
            <li><a href="/products.html"><i class="material-icons">local_florist</i>Products</a></li>
            <li><a href="/blog.html"><i class="material-icons">article</i>Blog</a></li>
            <li><a href="/about.html"><i class="material-icons">info</i>About</a></li>
            <li><a href="/contact.html"><i class="material-icons">mail</i>Contact</a></li>
            ${user ? `
                <li><div class="divider"></div></li>
                <li><a href="/notifications.html"><i class="material-icons">notifications</i>Notifications</a></li>
                <li><a href="/cart.html"><i class="material-icons">shopping_cart</i>Cart</a></li>
                <li><a href="/profile.html"><i class="material-icons">person</i>My Profile</a></li>
                <li><a href="/orders.html"><i class="material-icons">receipt</i>My Orders</a></li>
                ${user.role === 'admin' ? `
                    <li><div class="divider"></div></li>
                    <li><a href="/admin/dashboard.html"><i class="material-icons">dashboard</i>Admin Dashboard</a></li>
                ` : ''}
                <li><div class="divider"></div></li>
                <li><a href="#!" onclick="handleLogout()"><i class="material-icons">exit_to_app</i>Logout</a></li>
            ` : ''}
        </ul>
    `;

    // Set navigation HTML
    navPlaceholder.innerHTML = navHTML;

    // Update cart count if user is logged in
    if (user) {
        updateCartCount();
        fetchNotifications();
    }
}

// Load Footer
function loadFooter() {
    const footerPlaceholder = document.getElementById('footer-placeholder');
    
    const footerHTML = `
        <footer class="page-footer green">
            <div class="container">
                <div class="row">
                    <div class="col l4 s12">
                        <h5 class="white-text">Herbal Heaven</h5>
                        <p class="grey-text text-lighten-4">
                            Your trusted source for premium herbal products and natural wellness solutions.
                        </p>
                        <div class="social-links">
                            <a href="#!" class="white-text">
                                <i class="material-icons">facebook</i>
                            </a>
                            <a href="#!" class="white-text">
                                <i class="material-icons">twitter</i>
                            </a>
                            <a href="#!" class="white-text">
                                <i class="material-icons">instagram</i>
                            </a>
                        </div>
                    </div>
                    <div class="col l2 s12">
                        <h5 class="white-text">Shop</h5>
                        <ul>
                            <li><a class="grey-text text-lighten-3" href="/products.html">All Products</a></li>
                            <li><a class="grey-text text-lighten-3" href="/products.html?category=herbs">Herbs</a></li>
                            <li><a class="grey-text text-lighten-3" href="/products.html?category=teas">Teas</a></li>
                            <li><a class="grey-text text-lighten-3" href="/products.html?category=supplements">Supplements</a></li>
                        </ul>
                    </div>
                    <div class="col l2 s12">
                        <h5 class="white-text">Company</h5>
                        <ul>
                            <li><a class="grey-text text-lighten-3" href="/about.html">About Us</a></li>
                            <li><a class="grey-text text-lighten-3" href="/contact.html">Contact</a></li>
                            <li><a class="grey-text text-lighten-3" href="/blog.html">Blog</a></li>
                            <li><a class="grey-text text-lighten-3" href="/careers.html">Careers</a></li>
                        </ul>
                    </div>
                    <div class="col l4 s12">
                        <h5 class="white-text">Newsletter</h5>
                        <p class="grey-text text-lighten-4">
                            Subscribe to get updates on new products and herbal wellness tips.
                        </p>
                        <form id="footer-newsletter-form">
                            <div class="input-field">
                                <input type="email" id="footer-newsletter-email" class="white-text" required>
                                <label for="footer-newsletter-email">Your Email</label>
                            </div>
                            <button class="btn waves-effect waves-light white green-text" type="submit">
                                Subscribe
                                <i class="material-icons right">send</i>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            <div class="footer-copyright">
                <div class="container">
                    © ${new Date().getFullYear()} Herbal Heaven. All rights reserved.
                    <div class="grey-text text-lighten-4 right">
                        <a class="grey-text text-lighten-4" href="/privacy.html">Privacy Policy</a> |
                        <a class="grey-text text-lighten-4" href="/terms.html">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    `;

    // Set footer HTML
    footerPlaceholder.innerHTML = footerHTML;

    // Setup newsletter form
    const newsletterForm = document.getElementById('footer-newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', handleNewsletterSignup);
    }
}

// Initialize Materialize Components
function initializeMaterialize() {
    // Initialize sidenav
    const sidenavElems = document.querySelectorAll('.sidenav');
    M.Sidenav.init(sidenavElems);

    // Initialize dropdowns
    const dropdownElems = document.querySelectorAll('.dropdown-trigger');
    M.Dropdown.init(dropdownElems, {
        coverTrigger: false,
        constrainWidth: false
    });
}

// Update Cart Count
async function updateCartCount() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/cart', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const cart = await response.json();
        const count = cart.items ? cart.items.reduce((total, item) => total + item.quantity, 0) : 0;

        // Update cart count badge
        const cartBadge = document.querySelector('.cart-count');
        if (cartBadge) {
            cartBadge.textContent = count;
            cartBadge.style.display = count > 0 ? 'block' : 'none';
        }

    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}

// Handle Newsletter Signup
async function handleNewsletterSignup(e) {
    e.preventDefault();

    const email = document.getElementById('footer-newsletter-email').value;
    
    try {
        const response = await fetch('/api/newsletter/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        if (response.ok) {
            showToast('Successfully subscribed to newsletter!');
            document.getElementById('footer-newsletter-email').value = '';
        } else {
            throw new Error('Failed to subscribe');
        }
    } catch (error) {
        console.error('Newsletter signup error:', error);
        showToast('Error subscribing to newsletter', 'red');
    }
}

// Handle Logout
async function handleLogout() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            // Clear local storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Show success message
            showToast('Successfully logged out');

            // Redirect to home page
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        } else {
            throw new Error('Logout failed');
        }
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Error logging out', 'red');
    }
}

// Show Toast Message
function showToast(message, classes = 'green') {
    M.toast({
        html: message,
        classes: classes,
        displayLength: 3000
    });
}

// Export updateCartCount for use in other files
window.updateCartCount = updateCartCount;

// Fetch Notifications
async function fetchNotifications() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Get unread count
        const countResponse = await fetch('/api/notifications/unread-count', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const countData = await countResponse.json();
        
        // Update notification badge
        const notificationBadge = document.querySelector('.notification-badge');
        if (notificationBadge) {
            notificationBadge.textContent = countData.count;
            notificationBadge.style.display = countData.count > 0 ? 'block' : 'none';
        }

        // Get notifications
        const notificationsResponse = await fetch('/api/notifications', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const notifications = await notificationsResponse.json();

        // Update notifications dropdown
        updateNotificationsDropdown(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
    }
}

// Make fetchNotifications available globally
window.fetchNotifications = fetchNotifications;

// Update Notifications Dropdown
function updateNotificationsDropdown(notifications) {
    const notificationsList = document.querySelector('.notifications-list');
    const noNotifications = document.querySelector('.no-notifications');
    const notificationsLoading = document.querySelector('.notifications-loading');

    if (!notificationsList) return;

    notificationsLoading.style.display = 'none';

    if (notifications.length === 0) {
        noNotifications.style.display = 'block';
        notificationsList.style.display = 'none';
        return;
    }

    noNotifications.style.display = 'none';
    notificationsList.style.display = 'block';

    // Generate notifications HTML
    notificationsList.innerHTML = notifications.slice(0, 5).map(notification => `
        <div class="notification-item ${notification.isRead ? '' : 'unread'}" data-id="${notification._id}">
            <a href="${notification.link || '#'}" onclick="markNotificationAsRead('${notification._id}')">
                ${notification.image ? `
                    <div class="notification-image">
                        <img src="${notification.image}" alt="Notification Image">
                    </div>
                ` : ''}
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${formatNotificationTime(notification.createdAt)}</div>
                </div>
            </a>
        </div>
    `).join('');
}

// Mark Notification as Read
async function markNotificationAsRead(id) {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        await fetch(`/api/notifications/${id}/read`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        // Refresh notifications
        fetchNotifications();
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

// Mark All Notifications as Read
async function markAllNotificationsAsRead() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        await fetch('/api/notifications/mark-all-read', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        // Refresh notifications
        fetchNotifications();
        
        // Show success message
        showToast('All notifications marked as read');
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
    }
}

// Format Notification Time
function formatNotificationTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffMin < 1) {
        return 'Just now';
    } else if (diffMin < 60) {
        return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
    } else if (diffHr < 24) {
        return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString();
    }
} 