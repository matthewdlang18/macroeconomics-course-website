// Games Home Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    checkAuthStatus();

    // Set up event listeners
    setupEventListeners();
});

// Check authentication status
function checkAuthStatus() {
    const studentId = localStorage.getItem('student_id');
    const studentName = localStorage.getItem('student_name');
    
    if (studentId && studentName) {
        // User is logged in
        showLoggedInView(studentName);
    } else {
        // User is not logged in
        showLoggedOutView();
    }
}

// Set up event listeners
function setupEventListeners() {
    // Login button
    document.getElementById('login-btn').addEventListener('click', handleLogin);
    
    // Register button
    document.getElementById('register-btn').addEventListener('click', handleRegister);
    
    // Guest button
    document.getElementById('guest-btn').addEventListener('click', handleGuestAccess);
    
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
}

// Handle login
async function handleLogin() {
    const name = document.getElementById('student-name').value.trim();
    const passcode = document.getElementById('student-passcode').value.trim();
    const errorElement = document.getElementById('auth-error');
    
    // Validate inputs
    if (!name || !passcode) {
        errorElement.textContent = 'Please enter both name and passcode.';
        return;
    }
    
    try {
        // Attempt to login
        const result = await Service.loginStudent(name, passcode);
        
        if (result.success) {
            // Login successful
            showLoggedInView(name);
            errorElement.textContent = '';
        } else {
            // Login failed
            errorElement.textContent = result.error || 'Login failed. Please check your name and passcode.';
        }
    } catch (error) {
        console.error('Login error:', error);
        errorElement.textContent = 'An error occurred during login. Please try again.';
    }
}

// Handle registration
async function handleRegister() {
    const name = document.getElementById('student-name').value.trim();
    const passcode = document.getElementById('student-passcode').value.trim();
    const errorElement = document.getElementById('auth-error');
    
    // Validate inputs
    if (!name || !passcode) {
        errorElement.textContent = 'Please enter both name and passcode.';
        return;
    }
    
    try {
        // Attempt to register
        const result = await Service.registerStudent(name, passcode);
        
        if (result.success) {
            // Registration successful
            showLoggedInView(name);
            errorElement.textContent = '';
        } else {
            // Registration failed
            errorElement.textContent = result.error || 'Registration failed. Please try a different name.';
        }
    } catch (error) {
        console.error('Registration error:', error);
        errorElement.textContent = 'An error occurred during registration. Please try again.';
    }
}

// Handle guest access
function handleGuestAccess() {
    // Store guest status in localStorage
    localStorage.setItem('is_guest', 'true');
    
    // Show games section
    showGamesSection();
}

// Handle logout
function handleLogout() {
    // Clear authentication data from localStorage
    localStorage.removeItem('student_id');
    localStorage.removeItem('student_name');
    localStorage.removeItem('is_guest');
    
    // Show logged out view
    showLoggedOutView();
}

// Show logged in view
function showLoggedInView(name) {
    // Update UI for logged in user
    document.getElementById('current-user-name').textContent = name;
    document.getElementById('auth-status').classList.remove('d-none');
    document.getElementById('auth-form').classList.add('d-none');
    
    // Show games section
    showGamesSection();
}

// Show logged out view
function showLoggedOutView() {
    // Update UI for logged out user
    document.getElementById('auth-status').classList.add('d-none');
    document.getElementById('auth-form').classList.remove('d-none');
    
    // Hide games section
    document.getElementById('games-section').classList.add('d-none');
}

// Show games section
function showGamesSection() {
    document.getElementById('games-section').classList.remove('d-none');
}
