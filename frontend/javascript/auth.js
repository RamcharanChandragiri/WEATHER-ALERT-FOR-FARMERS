// ===================================
// Authentication Logic - Register & Login
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    // Register Form Handler
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Login Form Handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

/**
 * Handle User Registration
 */
async function handleRegister(e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const role = document.getElementById('role').value;

    const errorMsg = document.getElementById('errorMessage');
    const successMsg = document.getElementById('successMessage');

    // Clear previous messages
    errorMsg.classList.remove('show');
    successMsg.classList.remove('show');

    try {
        // Validate input
        if (!name || !email || !password) {
            throw new Error('All fields are required');
        }

        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }

        // Send registration request to backend
        const response = await fetch(API_ENDPOINTS.auth.register, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password, role })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Registration failed');
        }

        // Show success message
        successMsg.textContent = 'Registration successful! Redirecting to login...';
        successMsg.classList.add('show');

        // Redirect to login after 2 seconds
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);

    } catch (error) {
        errorMsg.textContent = error.message;
        errorMsg.classList.add('show');
        console.error('Register error:', error);
    }
}

/**
 * Handle User Login
 */
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorMsg = document.getElementById('errorMessage');

    // Clear previous messages
    errorMsg.classList.remove('show');

    try {
        // Validate input
        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        // Send login request to backend
        const response = await fetch(API_ENDPOINTS.auth.login, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Login failed');
        }

        // Store token and user info
        setToken(result.token);
        setUserInfo(result.user);

        // Redirect based on user role
        if (result.user.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
        } else {
            window.location.href = 'farmer-dashboard.html';
        }

    } catch (error) {
        errorMsg.textContent = error.message;
        errorMsg.classList.add('show');
        console.error('Login error:', error);
    }
}

/**
 * Logout User
 */
function logout() {
    clearToken();
    clearUserInfo();
    window.location.href = 'login.html';
}

/**
 * Check if user is authenticated, redirect if not
 */
function checkAuthentication() {
    const token = getToken();
    if (!token) {
        window.location.href = 'login.html';
    }
}
