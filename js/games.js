// Games Home Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Debug: Check if Service object is available
    console.log('Service object available:', typeof Service !== 'undefined');
    if (typeof Service !== 'undefined') {
        console.log('Service methods:', Object.keys(Service));
    } else {
        console.error('Service object is not defined! Authentication will not work.');

        // Create a fallback Service object for testing
        window.Service = {
            registerStudent: async function(name, passcode) {
                console.log('Using fallback registerStudent with:', name);
                // Generate a unique ID for the student
                const studentId = `${name.replace(/\s+/g, '_')}_${Date.now()}`;

                // Store student info in local storage for session
                localStorage.setItem('student_id', studentId);
                localStorage.setItem('student_name', name);

                return { success: true, data: { id: studentId, name, passcode } };
            },

            loginStudent: async function(name, passcode) {
                console.log('Using fallback loginStudent with:', name);
                // Generate a unique ID for the student
                const studentId = `${name.replace(/\s+/g, '_')}_${Date.now()}`;

                // Store student info in local storage for session
                localStorage.setItem('student_id', studentId);
                localStorage.setItem('student_name', name);

                return { success: true, data: { id: studentId, name, passcode } };
            },

            getStudent: async function(studentId) {
                return {
                    success: true,
                    data: {
                        id: studentId,
                        name: localStorage.getItem('student_name') || 'Student',
                        sectionId: null
                    }
                };
            }
        };

        console.log('Created fallback Service object with methods:', Object.keys(window.Service));
    }

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
        console.log('Attempting to login with:', { name });

        // Check if Service is available
        if (typeof Service === 'undefined') {
            console.error('Service object is not defined!');
            errorElement.textContent = 'Authentication service is not available. Please try again later.';
            return;
        }

        // Check if loginStudent method exists
        if (typeof Service.loginStudent !== 'function') {
            console.error('Service.loginStudent is not a function!');
            errorElement.textContent = 'Authentication method is not available. Please try again later.';
            return;
        }

        // Attempt to login
        console.log('Calling Service.loginStudent...');
        const result = await Service.loginStudent(name, passcode);
        console.log('Login result:', result);

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
        console.log('Attempting to register with:', { name });

        // Check if Service is available
        if (typeof Service === 'undefined') {
            console.error('Service object is not defined!');
            errorElement.textContent = 'Authentication service is not available. Please try again later.';
            return;
        }

        // Check if registerStudent method exists
        if (typeof Service.registerStudent !== 'function') {
            console.error('Service.registerStudent is not a function!');
            errorElement.textContent = 'Authentication method is not available. Please try again later.';
            return;
        }

        // Attempt to register
        console.log('Calling Service.registerStudent...');
        const result = await Service.registerStudent(name, passcode);
        console.log('Registration result:', result);

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

    // Check if student has selected a section
    checkSectionSelection();

    // Show games section
    showGamesSection();
}

// Check if student has selected a section
async function checkSectionSelection() {
    const studentId = localStorage.getItem('student_id');

    if (studentId) {
        try {
            const result = await Service.getStudent(studentId);

            if (result.success) {
                const student = result.data;

                // If student doesn't have a section, show a notification
                if (!student.sectionId) {
                    const gamesSection = document.getElementById('games-section');

                    // Add a notification at the top of the games section
                    const notification = document.createElement('div');
                    notification.className = 'alert alert-info mb-4';
                    notification.innerHTML = `
                        <h5>Select Your TA Section</h5>
                        <p>You haven't selected a TA section yet. Selecting a section will help your TA track your progress.</p>
                        <a href="select-section.html" class="btn btn-info">Select TA Section</a>
                    `;

                    // Insert at the beginning of the games section
                    gamesSection.insertBefore(notification, gamesSection.firstChild);
                }
            }
        } catch (error) {
            console.error('Error checking section selection:', error);
        }
    }
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
