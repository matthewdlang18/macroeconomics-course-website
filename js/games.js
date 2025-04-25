// Games Home Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Wait for Auth to be initialized
    if (typeof window.Auth === 'undefined') {
        console.log('Auth not yet available, waiting...');
        // Wait for Auth to be initialized
        const authCheckInterval = setInterval(() => {
            if (typeof window.Auth !== 'undefined') {
                console.log('Auth now available, initializing games page');
                clearInterval(authCheckInterval);
                initGamesPage();
            }
        }, 100);

        // Fallback in case Auth never initializes
        setTimeout(() => {
            if (typeof window.Auth === 'undefined') {
                console.error('Auth still not available after timeout, initializing with fallback');
                clearInterval(authCheckInterval);
                // Create a minimal Auth object as fallback
                window.Auth = {
                    isLoggedIn: () => !!localStorage.getItem('student_id'),
                    isGuest: () => localStorage.getItem('is_guest') === 'true',
                    getCurrentUser: () => ({
                        id: localStorage.getItem('student_id'),
                        name: localStorage.getItem('student_name'),
                        isGuest: localStorage.getItem('is_guest') === 'true'
                    }),
                    registerStudent: async (name, passcode) => {
                        const studentId = `${name.replace(/\s+/g, '_')}_${Date.now()}`;
                        localStorage.setItem('student_id', studentId);
                        localStorage.setItem('student_name', name);
                        return { success: true, data: { id: studentId, name } };
                    },
                    loginStudent: async (name, passcode) => {
                        localStorage.setItem('student_id', `${name.replace(/\s+/g, '_')}_${Date.now()}`);
                        localStorage.setItem('student_name', name);
                        return { success: true, data: { name } };
                    },
                    setGuestMode: () => {
                        localStorage.setItem('is_guest', 'true');
                        return { success: true };
                    },
                    logout: () => {
                        localStorage.removeItem('student_id');
                        localStorage.removeItem('student_name');
                        localStorage.removeItem('is_guest');
                        return { success: true };
                    }
                };
                initGamesPage();
            }
        }, 2000);
    } else {
        // Auth is already available
        initGamesPage();
    }
});

// Initialize the games page
function initGamesPage() {
    // Check if user is already logged in
    checkAuthStatus();

    // Set up event listeners
    setupEventListeners();

    console.log('Games page initialized');
}

// Check authentication status
function checkAuthStatus() {
    if (Auth.isLoggedIn()) {
        // User is logged in
        const user = Auth.getCurrentUser();
        showLoggedInView(user.name);
    } else if (Auth.isGuest()) {
        // User is a guest
        showGamesSection();
    } else {
        // User is not logged in
        showLoggedOutView();
    }
}

// Set up event listeners
function setupEventListeners() {
    // Login button
    document.getElementById('login-btn').addEventListener('click', handleLogin);

    // Register button removed

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
        // Show loading state
        document.getElementById('login-btn').disabled = true;
        document.getElementById('login-btn').textContent = 'Signing in...';

        // Attempt to login
        const result = await Auth.loginStudent(name, passcode);

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
    } finally {
        // Reset button state
        document.getElementById('login-btn').disabled = false;
        document.getElementById('login-btn').textContent = 'Sign In';
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
        // Show loading state
        document.getElementById('register-btn').disabled = true;
        document.getElementById('register-btn').textContent = 'Registering...';

        // Attempt to register
        const result = await Auth.registerStudent(name, passcode);

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
    } finally {
        // Reset button state
        document.getElementById('register-btn').disabled = false;
        document.getElementById('register-btn').textContent = 'Register';
    }
}

// Handle guest access
function handleGuestAccess() {
    // Store guest status using Auth
    Auth.setGuestMode();

    // Show games section
    showGamesSection();
}

// Handle logout
function handleLogout() {
    // Log out using Auth
    Auth.logout();

    // Show logged out view
    showLoggedOutView();
}

// Show logged in view
function showLoggedInView(name) {
    // Update UI for logged in user
    document.getElementById('current-user-name').textContent = name;

    // Display section information if available
    const sectionId = localStorage.getItem('section_id');
    const sectionName = localStorage.getItem('section_name');
    const authStatusElement = document.getElementById('auth-status');

    if (sectionId && sectionName) {
        // Add section info to the green area
        const sectionInfoElement = document.createElement('p');
        sectionInfoElement.className = 'mb-0 mt-1';
        sectionInfoElement.innerHTML = `<strong>TA Section:</strong> ${sectionName}`;

        // Insert after the username
        const userInfoElement = authStatusElement.querySelector('p');
        userInfoElement.parentNode.insertBefore(sectionInfoElement, userInfoElement.nextSibling);
    } else {
        // Add a small note about selecting a section
        const sectionNoteElement = document.createElement('p');
        sectionNoteElement.className = 'mb-0 mt-1 small';
        sectionNoteElement.innerHTML = `<a href="select-section.html">Select your TA section</a>`;

        // Insert after the username
        const userInfoElement = authStatusElement.querySelector('p');
        userInfoElement.parentNode.insertBefore(sectionNoteElement, userInfoElement.nextSibling);
    }

    authStatusElement.classList.remove('d-none');
    document.getElementById('auth-form').classList.add('d-none');

    // Show games section
    showGamesSection();
}

// Check if student has selected a section - now handled in showLoggedInView
async function checkSectionSelection() {
    // This function is now empty as the section selection notification
    // is now displayed in the green auth-status area
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
