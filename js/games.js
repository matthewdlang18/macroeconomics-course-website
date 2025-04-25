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

    // Change name button
    const changeNameBtn = document.getElementById('change-name-btn');
    if (changeNameBtn) {
        changeNameBtn.addEventListener('click', () => {
            // Get current display name from localStorage
            const currentName = localStorage.getItem('display_name') || localStorage.getItem('student_name') || '';

            // Set current name in the input field
            const displayNameInput = document.getElementById('displayName');
            if (displayNameInput) {
                displayNameInput.value = currentName;
            }

            // Show the modal
            $('#nameChangeModal').modal('show');
        });
    }

    // Save name button
    const saveNameBtn = document.getElementById('saveNameBtn');
    if (saveNameBtn) {
        saveNameBtn.addEventListener('click', () => {
            const displayNameInput = document.getElementById('displayName');
            const newName = displayNameInput.value.trim();

            if (newName) {
                // Save the new display name to localStorage
                localStorage.setItem('display_name', newName);

                // Update the display name in the header
                const userNameDisplay = document.getElementById('current-user-name');
                if (userNameDisplay) {
                    userNameDisplay.textContent = newName;
                }

                // Hide the modal
                $('#nameChangeModal').modal('hide');

                // Show success notification
                showNotification('Your display name has been updated!', 'success');
            } else {
                // Show error if name is empty
                showNotification('Please enter a valid name', 'danger');
            }
        });
    }

    // Handle form submission
    const nameChangeForm = document.getElementById('nameChangeForm');
    if (nameChangeForm) {
        nameChangeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (saveNameBtn) {
                saveNameBtn.click();
            }
        });
    }

    // Auto-populate display name field when student name is entered
    const studentNameInput = document.getElementById('student-name');
    const displayNameInput = document.getElementById('display-name');
    if (studentNameInput && displayNameInput) {
        studentNameInput.addEventListener('input', () => {
            if (!displayNameInput.value) {
                displayNameInput.value = studentNameInput.value;
            }
        });
    }
}

// Handle login
async function handleLogin() {
    const name = document.getElementById('student-name').value.trim();
    const displayName = document.getElementById('display-name').value.trim() || name; // Use student name as fallback
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

            // Save display name to localStorage
            localStorage.setItem('display_name', displayName);

            showLoggedInView(displayName); // Use display name in the UI
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
    const displayName = document.getElementById('display-name').value.trim() || name; // Use student name as fallback
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

            // Save display name to localStorage
            localStorage.setItem('display_name', displayName);

            showLoggedInView(displayName); // Use display name in the UI
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
    // Auto redirect if no section selected
    const sectionId = localStorage.getItem('section_id');
    if (!sectionId) {
        window.location.href = 'select-section.html';
        return;
    }

    // Get display name if available, otherwise use provided name
    const displayName = localStorage.getItem('display_name') || name;

    // Update UI for logged in user
    document.getElementById('current-user-name').textContent = displayName;
    document.getElementById('auth-status').classList.remove('d-none');
    document.getElementById('auth-form').classList.add('d-none');

    // Display selected section if available
    const sectionName = localStorage.getItem('section_name');
    if (sectionName) {
        const authStatus = document.getElementById('auth-status');
        const p = authStatus.querySelector('p');
        if (p && !document.getElementById('current-section-name')) {
            p.innerHTML += ` | Section: <span id="current-section-name">${sectionName}</span>`;
        }
    }

    // Check if student has selected a section
    checkSectionSelection();

    // Show games section
    showGamesSection();
}

// Check if student has selected a section
async function checkSectionSelection() {
    const studentId = localStorage.getItem('student_id');
    const sectionId = localStorage.getItem('section_id');

    if (studentId && !sectionId) {
        // Student doesn't have a section, show a notification
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

// Show notification message
function showNotification(message, type = 'info', duration = 3000) {
    // Create notification container if it doesn't exist
    let notificationContainer = document.getElementById('notification-container');

    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.top = '20px';
        notificationContainer.style.right = '20px';
        notificationContainer.style.zIndex = '9999';
        notificationContainer.style.maxWidth = '350px';
        document.body.appendChild(notificationContainer);
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show`;
    notification.role = 'alert';
    notification.style.marginBottom = '10px';
    notification.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';

    // Add notification content
    notification.innerHTML = `
        <div>${message}</div>
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    `;

    // Add notification to container
    notificationContainer.appendChild(notification);

    // Auto-remove notification after duration
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, duration);

    // Add click event to close button
    const closeButton = notification.querySelector('.close');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
    }
}
