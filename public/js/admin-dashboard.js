document.addEventListener('DOMContentLoaded', function() {
    // Initialize Materialize components
    M.Sidenav.init(document.querySelectorAll('.sidenav'));

    // Check admin authentication
    checkAdminAuth();

    // Setup event listeners
    setupEventListeners();

    // Load initial data
    loadDashboardData();
    loadSalesChart();
    loadTopProducts();
    loadRecentOrders();
    loadNewUsers();
});

// Authentication check
async function checkAdminAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    try {
        const response = await fetch('/api/auth/verify', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (!response.ok || !data.user || data.user.role !== 'admin') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login.html';
            return;
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Logout
    document.querySelectorAll('#logout, #mobile-logout').forEach(button => {
        button.addEventListener('click', handleLogout);
    });
}

// Handle Logout
function handleLogout(e) {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

// Load Dashboard Summary Data
async function loadDashboardData() {
    try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch data from existing endpoints
        const [orders, users, products] = await Promise.all([
            fetch('/api/orders', { headers }).then(res => res.json()),
            fetch('/api/users', { headers }).then(res => res.json()),
            fetch('/api/products', { headers }).then(res => res.json())
        ]);
        
        // Calculate summary data
        const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalOrders = orders.length;
        const totalUsers = users.length;
        const totalProducts = products.length;
        
        // Calculate month-over-month changes
        const today = new Date();
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1);
        
        const thisMonthOrders = orders.filter(order => new Date(order.createdAt) >= lastMonth);
        const lastMonthOrders = orders.filter(order => {
            const date = new Date(order.createdAt);
            return date >= new Date(lastMonth.getFullYear(), lastMonth.getMonth() - 1) && date < lastMonth;
        });

        const salesChange = lastMonthOrders.length ? 
            ((thisMonthOrders.reduce((sum, order) => sum + order.totalAmount, 0) - 
              lastMonthOrders.reduce((sum, order) => sum + order.totalAmount, 0)) / 
              lastMonthOrders.reduce((sum, order) => sum + order.totalAmount, 0) * 100).toFixed(1) : 0;
        
        const ordersChange = lastMonthOrders.length ? 
            ((thisMonthOrders.length - lastMonthOrders.length) / lastMonthOrders.length * 100).toFixed(1) : 0;
        
        const lastMonthUsers = users.filter(user => {
            const date = new Date(user.createdAt);
            return date >= new Date(lastMonth.getFullYear(), lastMonth.getMonth() - 1) && date < lastMonth;
        });
        const thisMonthUsers = users.filter(user => new Date(user.createdAt) >= lastMonth);
        
        const usersChange = lastMonthUsers.length ? 
            ((thisMonthUsers.length - lastMonthUsers.length) / lastMonthUsers.length * 100).toFixed(1) : 0;

        // Update summary cards
        document.getElementById('total-sales').textContent = formatCurrency(totalSales);
        document.getElementById('total-orders').textContent = totalOrders;
        document.getElementById('total-users').textContent = totalUsers;
        document.getElementById('total-products').textContent = totalProducts;
        
        // Update change indicators
        updateChangeIndicator('sales-change', parseFloat(salesChange));
        updateChangeIndicator('orders-change', parseFloat(ordersChange));
        updateChangeIndicator('users-change', parseFloat(usersChange));
        document.getElementById('low-stock').textContent = `${products.filter(p => p.stock < 10).length} items low`;
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showToast('Error loading dashboard summary', 'red');
    }
}

// Load Sales Chart
async function loadSalesChart() {
    try {
        const token = localStorage.getItem('token');
        // Instead of using a non-existent endpoint, we'll fetch orders and process them
        const response = await fetch('/api/orders', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const orders = await response.json();
        
        // Process orders to create chart data
        const last7Days = Array.from({length: 7}, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const salesData = last7Days.map(date => {
            const dayOrders = orders.filter(order => 
                order.createdAt.split('T')[0] === date
            );
            return {
                date,
                sales: dayOrders.reduce((sum, order) => sum + order.totalAmount, 0),
                orders: dayOrders.length
            };
        });

        const data = {
            labels: salesData.map(d => d.date),
            sales: salesData.map(d => d.sales),
            orders: salesData.map(d => d.orders)
        };
        
        const ctx = document.getElementById('sales-chart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Sales',
                    data: data.sales,
                    borderColor: '#4CAF50',
                    tension: 0.1
                }, {
                    label: 'Orders',
                    data: data.orders,
                    borderColor: '#2196F3',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading sales chart:', error);
        showToast('Error loading sales chart', 'red');
    }
}

// Load Top Products
async function loadTopProducts() {
    try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch orders and products
        const [orders, products] = await Promise.all([
            fetch('/api/orders', { headers }).then(res => res.json()),
            fetch('/api/products', { headers }).then(res => res.json())
        ]);

        // Calculate product sales and revenue
        const productStats = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                if (!productStats[item.product]) {
                    productStats[item.product] = {
                        soldCount: 0,
                        revenue: 0
                    };
                }
                productStats[item.product].soldCount += item.quantity;
                productStats[item.product].revenue += item.quantity * item.price;
            });
        });

        // Map product stats with product details
        const topProducts = products
            .map(product => ({
                ...product,
                soldCount: productStats[product._id]?.soldCount || 0,
                revenue: productStats[product._id]?.revenue || 0
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
        
        const topProductsList = document.getElementById('top-products');
        topProductsList.innerHTML = topProducts.map(product => `
            <li class="collection-item">
                <div class="row mb-0">
                    <div class="col s8">
                        <span class="title">${product.name}</span>
                        <p class="grey-text">${product.soldCount} sold</p>
                    </div>
                    <div class="col s4 right-align">
                        <span class="green-text">${formatCurrency(product.revenue)}</span>
                    </div>
                </div>
            </li>
        `).join('');
    } catch (error) {
        console.error('Error loading top products:', error);
        showToast('Error loading top products', 'red');
    }
}

// Load Recent Orders
async function loadRecentOrders() {
    try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch all orders and get the most recent ones
        const response = await fetch('/api/orders', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const allOrders = await response.json();
        
        // Sort orders by date and get the 5 most recent ones
        const recentOrders = allOrders
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
        
        const recentOrdersTable = document.getElementById('recent-orders');
        recentOrdersTable.innerHTML = recentOrders.map(order => `
            <tr>
                <td>${order._id}</td>
                <td>${order.user.name}</td>
                <td>${formatCurrency(order.totalAmount)}</td>
                <td>
                    <span class="status-badge ${order.status.toLowerCase()}">
                        ${order.status}
                    </span>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading recent orders:', error);
        showToast('Error loading recent orders', 'red');
    }
}

// Load New Users
async function loadNewUsers() {
    try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch all users and sort by creation date
        const response = await fetch('/api/users', { headers });
        const users = await response.json();
        
        // Get the 5 most recent users
        const newUsers = users
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
        
        const newUsersTable = document.getElementById('new-users');
        newUsersTable.innerHTML = newUsers.map(user => `
            <tr>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${formatDate(user.createdAt)}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading new users:', error);
        showToast('Error loading new users', 'red');
    }
}

// Update change indicator with percentage
function updateChangeIndicator(elementId, changePercentage) {
    const element = document.getElementById(elementId);
    const isPositive = changePercentage > 0;
    element.innerHTML = `
        <i class="material-icons tiny">${isPositive ? 'arrow_upward' : 'arrow_downward'}</i>
        ${Math.abs(changePercentage)}% from last month
    `;
    element.className = `change-indicator ${isPositive ? 'green-text' : 'red-text'}`;
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);

}

// Format date
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-AU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Show toast message
function showToast(message, classes = 'green') {
    M.toast({
        html: message,
        classes: classes,
        displayLength: 3000
    });
} 