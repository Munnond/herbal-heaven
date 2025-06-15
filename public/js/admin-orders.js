document.addEventListener('DOMContentLoaded', function() {
    // Initialize Materialize components
    M.Sidenav.init(document.querySelectorAll('.sidenav'));
    M.Modal.init(document.querySelectorAll('.modal'));
    M.FormSelect.init(document.querySelectorAll('select'));

    // Load initial data
    loadOrders();

    // Add event listeners
    document.getElementById('status-filter').addEventListener('change', loadOrders);
    document.getElementById('search-orders').addEventListener('input', debounce(loadOrders, 500));
    document.getElementById('date-filter').addEventListener('change', loadOrders);
    document.getElementById('update-status-btn').addEventListener('click', updateOrderStatus);
});

let currentOrderId = null;

// Load Orders
async function loadOrders() {
    try {
        const token = localStorage.getItem('token');
        const statusFilter = document.getElementById('status-filter').value;
        const searchQuery = document.getElementById('search-orders').value;
        const dateFilter = document.getElementById('date-filter').value;

        let url = '/api/orders?';
        if (statusFilter) url += `status=${statusFilter}&`;
        if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
        if (dateFilter) url += `date=${dateFilter}`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const orders = await response.json();
        
        const tbody = document.getElementById('orders-table');
        tbody.innerHTML = orders.map(order => `
            <tr>
                <td>${order._id}</td>
                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                <td>${formatCurrency(order.totalAmount)}</td>
                <td>
                    <span class="status-badge ${order.status.toLowerCase()}">
                        ${order.status}
                    </span>
                </td>
                <td>
                    <button class="btn-small green" onclick="viewOrderDetails('${order._id}')">
                        <i class="material-icons">visibility</i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading orders:', error);
        showToast('Error loading orders', 'red');
    }
}

// View Order Details
async function viewOrderDetails(orderId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/orders/${orderId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const order = await response.json();
        
        currentOrderId = orderId;
        const modal = M.Modal.getInstance(document.getElementById('order-modal'));
        
        // Populate order details
        document.getElementById('order-details').innerHTML = `
            <div class="row">
                <div class="col s12">
                    <h5>Order Information</h5>
                    <p><strong>Order ID:</strong> ${order._id}</p>
                    <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
                    <p><strong>Status:</strong> 
                        <select id="order-status" class="browser-default">
                            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                            <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                            <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </p>
                </div>
            </div>
            <div class="row">
                <div class="col s12 m6">
                    <h5>Customer Information</h5>
                    <p><strong>Name:</strong> ${order.user.name}</p>
                    <p><strong>Email:</strong> ${order.user.email}</p>
                </div>
                <div class="col s12 m6">
                    <h5>Shipping Information</h5>
                    <p><strong>Address:</strong> ${order.shippingAddress.street}</p>
                    <p><strong>City:</strong> ${order.shippingAddress.city}</p>
                    <p><strong>State:</strong> ${order.shippingAddress.state}</p>
                    <p><strong>Postal Code:</strong> ${order.shippingAddress.postalCode}</p>
                </div>
            </div>
            <div class="row">
                <div class="col s12">
                    <h5>Order Items</h5>
                    <table class="striped">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.items.map(item => `
                                <tr>
                                    <td>${item.product.name}</td>
                                    <td>${item.quantity}</td>
                                    <td>${formatCurrency(item.price)}</td>
                                    <td>${formatCurrency(item.quantity * item.price)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="3"><strong>Total</strong></td>
                                <td><strong>${formatCurrency(order.total)}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;
        
        modal.open();
    } catch (error) {
        console.error('Error loading order details:', error);
        showToast('Error loading order details', 'red');
    }
}

// Update Order Status
async function updateOrderStatus() {
    try {
        const token = localStorage.getItem('token');
        const status = document.getElementById('order-status').value;
        
        const response = await fetch(`/api/orders/${currentOrderId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        
        if (response.ok) {
            showToast('Order status updated successfully');
            M.Modal.getInstance(document.getElementById('order-modal')).close();
            loadOrders();
        } else {
            throw new Error('Failed to update order status');
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        showToast('Error updating order status', 'red');
    }
}

// Utility function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
}

// Utility function to debounce search input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Show toast message
function showToast(message, classes = 'green') {
    M.toast({
        html: message,
        classes: classes,
        displayLength: 3000
    });
} 