// Function to show toast messages
function showToast(message, classes = 'green') {
    M.toast({html: message, classes: classes});
}

// Function to verify token and redirect based on role
async function verifyTokenAndRedirect(token) {
    try {
        const response = await fetch('/api/auth/verify', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.user && data.user.role === 'admin') {
                window.location.href = '/admin/dashboard.html';
            } else {
                window.location.href = 'products.html';
            }
        } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    } catch (error) {
        console.error('Token verification error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
        verifyTokenAndRedirect(token);
        return;
    }

    // Handle form submission
    document.getElementById('login-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('remember-me').checked;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password, rememberMe })
            });

            const data = await response.json();

            if (response.ok) {
                // Store token and user data
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                // Show success message
                showToast('Login successful!');

                // Verify token and redirect
                await verifyTokenAndRedirect(data.token);
            } else {
                throw new Error(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            showToast(error.message || 'Login failed. Please check your credentials.', 'red');
        }
    });
}); 