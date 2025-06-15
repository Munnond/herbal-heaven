document.addEventListener('DOMContentLoaded', function() {
    // Initialize Materialize components
    M.Sidenav.init(document.querySelectorAll('.sidenav'));
    M.Modal.init(document.querySelectorAll('.modal'));
    M.FormSelect.init(document.querySelectorAll('select'));

    // Load initial data
    loadUsers();

    // Add event listeners
    document.getElementById('role-filter').addEventListener('change', loadUsers);
    document.getElementById('search-users').addEventListener('input', debounce(loadUsers, 500));
    document.getElementById('status-filter').addEventListener('change', loadUsers);
});

let currentUserId = null;

// Load Users
async function loadUsers() {
    try {
        const token = localStorage.getItem('token');
        const roleFilter = document.getElementById('role-filter').value;
        const searchQuery = document.getElementById('search-users').value;
        const statusFilter = document.getElementById('status-filter').value;

        let url = '/api/users?';
        if (roleFilter) url += `role=${roleFilter}&`;
        if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
        if (statusFilter) url += `status=${statusFilter}`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const users = await response.json();
        
        const tbody = document.getElementById('users-table');
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>
                    <span class="role-badge ${user.role.toLowerCase()}">
                        ${user.role}
                    </span>
                </td>
                <td>
                    <span class="status-badge ${user.status.toLowerCase()}">
                        ${user.status}
                    </span>
                </td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn-small green" onclick="editUser('${user._id}')">
                        <i class="material-icons">edit</i>
                    </button>
                    ${user.role !== 'admin' ? `
                        <button class="btn-small red" onclick="deleteUser('${user._id}')">
                            <i class="material-icons">delete</i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading users:', error);
        showToast('Error loading users', 'red');
    }
}

// Edit User
async function editUser(userId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const user = await response.json();
        
        currentUserId = userId;
        const modal = M.Modal.getInstance(document.getElementById('user-modal'));
        
        // Fill form fields
        document.getElementById('user-name').value = user.name;
        document.getElementById('user-email').value = user.email;
        document.getElementById('user-role').value = user.role;
        document.getElementById('user-status').value = user.status;
        
        M.updateTextFields();
        M.FormSelect.init(document.querySelectorAll('select'));
        modal.open();
    } catch (error) {
        console.error('Error loading user details:', error);
        showToast('Error loading user details', 'red');
    }
}

// Save User
async function saveUser() {
    try {
        const token = localStorage.getItem('token');
        const userData = {
            name: document.getElementById('user-name').value,
            email: document.getElementById('user-email').value,
            role: document.getElementById('user-role').value,
            status: document.getElementById('user-status').value
        };
        
        const response = await fetch(`/api/users/${currentUserId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        if (response.ok) {
            showToast('User updated successfully');
            M.Modal.getInstance(document.getElementById('user-modal')).close();
            loadUsers();
        } else {
            throw new Error('Failed to update user');
        }
    } catch (error) {
        console.error('Error updating user:', error);
        showToast('Error updating user', 'red');
    }
}

// Delete User
async function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                showToast('User deleted successfully');
                loadUsers();
            } else {
                throw new Error('Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            showToast('Error deleting user', 'red');
        }
    }
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