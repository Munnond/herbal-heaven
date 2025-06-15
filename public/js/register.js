document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = '/';
        return;
    }

    // Setup form submission handler
    const registerForm = document.getElementById('register-form');
    registerForm.addEventListener('submit', handleRegister);

    // Setup password confirmation validation
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirm-password');
    confirmPassword.addEventListener('input', validatePasswordMatch);
});

// Validate password match
function validatePasswordMatch() {
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirm-password');
    
    if (password.value !== confirmPassword.value) {
        confirmPassword.setCustomValidity('Passwords do not match');
    } else {
        confirmPassword.setCustomValidity('');
    }
}

// Handle registration
async function handleRegister(e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const terms = document.getElementById('terms').checked;
    const newsletter = document.getElementById('newsletter').checked;

    // Validate form
    if (!terms) {
        showToast('Please accept the Terms and Conditions', 'red');
        return;
    }

    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'red');
        return;
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
        showToast('Password must be at least 8 characters long and contain at least one letter and one number', 'red');
        return;
    }

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                email,
                phone,
                password,
                newsletter
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Show success message
            showToast('Registration successful! Please check your email to verify your account.', 'green');
            
            // Store token if auto-login is enabled
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify({
                    id: data.user._id,
                    name: data.user.name,
                    email: data.user.email,
                    role: data.user.role
                }));
            }

            // Redirect after a short delay
            setTimeout(() => {
                window.location.href = data.token ? '/' : '/login';
            }, 2000);
        } else {
            throw new Error(data.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showToast(error.message || 'Registration failed. Please try again.', 'red');
    }
}

// Show toast message
function showToast(message, classes = 'red') {
    M.toast({
        html: message,
        classes: classes,
        displayLength: 3000
    });
}

// Password strength indicator
function updatePasswordStrength(password) {
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength++;
    
    // Letter check
    if (/[A-Za-z]/.test(password)) strength++;
    
    // Number check
    if (/\d/.test(password)) strength++;
    
    // Special character check
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const strengthBar = document.getElementById('password-strength');
    if (strengthBar) {
        strengthBar.className = `strength-${strength}`;
        
        switch(strength) {
            case 0:
            case 1:
                strengthBar.textContent = 'Weak';
                break;
            case 2:
                strengthBar.textContent = 'Medium';
                break;
            case 3:
                strengthBar.textContent = 'Strong';
                break;
            case 4:
                strengthBar.textContent = 'Very Strong';
                break;
        }
    }
} 