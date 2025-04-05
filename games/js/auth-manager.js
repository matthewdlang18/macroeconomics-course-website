/**
 * auth-manager.js
 * Centralized authentication system for the economics games
 * Handles both student and TA authentication
 */

// Create a namespace for our authentication system
console.log('Loading AuthManager...');

// Check if EconGames is initialized
if (!window.EconGames || !window.EconGames.collections) {
    console.error('EconGames is not properly initialized. Make sure firebase-core.js is loaded before auth-manager.js');
    // Create a fallback collections object
    window.EconGames = window.EconGames || {};
    window.EconGames.collections = {
        users: firebase.firestore().collection('users'),
        students: firebase.firestore().collection('students'),
        classes: firebase.firestore().collection('classes'),
        fiscalGameData: firebase.firestore().collection('fiscalGameData'),
        investmentGameData: firebase.firestore().collection('investmentGameData')
    };
}

window.AuthManager = {
    // User roles
    ROLES: {
        STUDENT: 'student',
        TA: 'ta',
        ADMIN: 'admin'
    },

    // Check if user is logged in
    isLoggedIn: function() {
        const userId = localStorage.getItem('userId');
        const userName = localStorage.getItem('userName');
        const userRole = localStorage.getItem('userRole');
        const timestamp = localStorage.getItem('sessionTimestamp');

        if (!userId || !userName || !userRole || !timestamp) {
            return false;
        }

        // Check if session is less than 24 hours old
        const sessionAge = Date.now() - parseInt(timestamp);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        return sessionAge < maxAge;
    },

    // Check if user is a TA
    isTA: function() {
        if (!this.isLoggedIn()) {
            return false;
        }

        const userRole = localStorage.getItem('userRole');
        return userRole === this.ROLES.TA || userRole === this.ROLES.ADMIN;
    },

    // Get current session
    getSession: function() {
        if (!this.isLoggedIn()) {
            return null;
        }

        return {
            userId: localStorage.getItem('userId'),
            userName: localStorage.getItem('userName'),
            userRole: localStorage.getItem('userRole'),
            enrollments: JSON.parse(localStorage.getItem('enrollments') || '[]'),
            currentClassId: localStorage.getItem('currentClassId'),
            timestamp: localStorage.getItem('sessionTimestamp')
        };
    },

    // Save session
    saveSession: function(userData, classId = null) {
        localStorage.setItem('userId', userData.userId);
        localStorage.setItem('userName', userData.userName);
        localStorage.setItem('userRole', userData.userRole);
        localStorage.setItem('enrollments', JSON.stringify(userData.enrollments || []));

        if (classId) {
            localStorage.setItem('currentClassId', classId);
        }

        localStorage.setItem('sessionTimestamp', Date.now().toString());
    },

    // Clear session
    clearSession: function() {
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('userRole');
        localStorage.removeItem('enrollments');
        localStorage.removeItem('currentClassId');
        localStorage.removeItem('sessionTimestamp');
    },

    // Register a new student
    registerUser: async function(name, passcode, role = 'student') {
        try {
            console.log('Registering user:', { name, role });
            console.log('Using Firestore collections:', EconGames.collections);

            // Validate inputs
            if (!name || !passcode) {
                return { success: false, error: 'Name and passcode are required' };
            }

            // Validate passcode format (4 digits)
            if (!/^[0-9]{4}$/.test(passcode)) {
                return { success: false, error: 'Passcode must be exactly 4 digits' };
            }

            // If registering as TA, check if the name is in the allowed list
            if (role === this.ROLES.TA) {
                // For now, only allow testTA with passcode 1234
                if (name !== 'testTA' || passcode !== '1234') {
                    return { success: false, error: 'Invalid TA credentials' };
                }
            }

            // Check if user already exists with this name and passcode
            const snapshot = await EconGames.collections.users
                .where('name', '==', name)
                .where('passcode', '==', passcode)
                .get();

            if (!snapshot.empty) {
                // User already exists, return existing data
                const userDoc = snapshot.docs[0];
                const userData = userDoc.data();

                // Save to session
                this.saveSession({
                    userId: userDoc.id,
                    userName: userData.name,
                    userRole: userData.role,
                    enrollments: userData.enrollments || []
                });

                return {
                    success: true,
                    data: {
                        userId: userDoc.id,
                        userName: userData.name,
                        userRole: userData.role,
                        enrollments: userData.enrollments || []
                    },
                    message: 'Logged in with existing account'
                };
            }

            // Create new user document
            const userRef = EconGames.collections.users.doc();
            await userRef.set({
                name: name,
                passcode: passcode,
                role: role,
                created: firebase.firestore.FieldValue.serverTimestamp(),
                enrollments: []
            });

            // Save to session
            this.saveSession({
                userId: userRef.id,
                userName: name,
                userRole: role,
                enrollments: []
            });

            return {
                success: true,
                data: {
                    userId: userRef.id,
                    userName: name,
                    userRole: role,
                    enrollments: []
                },
                message: 'New user registered successfully'
            };
        } catch (error) {
            console.error('Error registering user:', error);
            return { success: false, error: error.message || 'Registration failed' };
        }
    },

    // Login a user
    loginUser: async function(name, passcode) {
        try {
            console.log('Logging in user:', name);
            console.log('Using Firestore collections:', EconGames.collections);

            // Validate inputs
            if (!name || !passcode) {
                return { success: false, error: 'Name and passcode are required' };
            }

            // Find user by name and passcode
            const snapshot = await EconGames.collections.users
                .where('name', '==', name)
                .where('passcode', '==', passcode)
                .get();

            if (snapshot.empty) {
                return { success: false, error: 'Invalid name or passcode' };
            }

            const userDoc = snapshot.docs[0];
            const userData = userDoc.data();

            // Save to session
            this.saveSession({
                userId: userDoc.id,
                userName: userData.name,
                userRole: userData.role,
                enrollments: userData.enrollments || []
            });

            return {
                success: true,
                data: {
                    userId: userDoc.id,
                    userName: userData.name,
                    userRole: userData.role,
                    enrollments: userData.enrollments || []
                }
            };
        } catch (error) {
            console.error('Error logging in:', error);
            return { success: false, error: error.message || 'Login failed' };
        }
    },

    // Logout user
    logout: function() {
        this.clearSession();
        window.location.href = '../games/index.html';
    },

    // Show login modal
    showLoginModal: function(role = null) {
        // Create modal if it doesn't exist
        if (!document.getElementById('auth-login-modal')) {
            this._createModals();
        }

        // Set role if provided
        if (role) {
            document.getElementById('login-role').value = role;
        }

        // Show login modal
        document.getElementById('auth-login-modal').style.display = 'flex';
    },

    // Show registration modal
    showRegistrationModal: function(role = null) {
        // Create modal if it doesn't exist
        if (!document.getElementById('auth-registration-modal')) {
            this._createModals();
        }

        // Set role if provided
        if (role) {
            document.getElementById('register-role').value = role;
        }

        // Show registration modal
        document.getElementById('auth-registration-modal').style.display = 'flex';
    },

    // Create modals
    _createModals: function() {
        // Check if modals already exist
        if (document.getElementById('auth-login-modal')) {
            return;
        }

        // Create login modal
        const loginModal = document.createElement('div');
        loginModal.id = 'auth-login-modal';
        loginModal.style.cssText = 'display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: center;';

        loginModal.innerHTML = `
            <div style="background-color: white; padding: 20px; border-radius: 5px; width: 300px;">
                <h2 style="margin-top: 0;">Login</h2>
                <form id="auth-login-form">
                    <div style="margin-bottom: 10px;">
                        <label for="login-name" style="display: block; margin-bottom: 5px;">Name</label>
                        <input type="text" id="login-name" style="width: 100%; padding: 8px; box-sizing: border-box;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label for="login-passcode" style="display: block; margin-bottom: 5px;">Passcode (4 digits)</label>
                        <input type="password" id="login-passcode" style="width: 100%; padding: 8px; box-sizing: border-box;" maxlength="4" pattern="[0-9]{4}">
                    </div>
                    <input type="hidden" id="login-role" value="">
                    <div style="display: flex; justify-content: space-between;">
                        <button type="button" class="auth-modal-close" style="padding: 8px 15px; background-color: #f0f0f0; border: none; border-radius: 3px; cursor: pointer;">Cancel</button>
                        <button type="submit" style="padding: 8px 15px; background-color: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer;">Login</button>
                    </div>
                </form>
            </div>
        `;

        // Create registration modal
        const registrationModal = document.createElement('div');
        registrationModal.id = 'auth-registration-modal';
        registrationModal.style.cssText = 'display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: center;';

        registrationModal.innerHTML = `
            <div style="background-color: white; padding: 20px; border-radius: 5px; width: 300px;">
                <h2 style="margin-top: 0;">New Registration</h2>
                <form id="auth-registration-form">
                    <div style="margin-bottom: 10px;">
                        <label for="register-name" style="display: block; margin-bottom: 5px;">Name</label>
                        <input type="text" id="register-name" style="width: 100%; padding: 8px; box-sizing: border-box;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label for="register-passcode" style="display: block; margin-bottom: 5px;">Passcode (4 digits)</label>
                        <input type="password" id="register-passcode" style="width: 100%; padding: 8px; box-sizing: border-box;" maxlength="4" pattern="[0-9]{4}">
                    </div>
                    <input type="hidden" id="register-role" value="student">
                    <div style="display: flex; justify-content: space-between;">
                        <button type="button" class="auth-modal-close" style="padding: 8px 15px; background-color: #f0f0f0; border: none; border-radius: 3px; cursor: pointer;">Cancel</button>
                        <button type="submit" style="padding: 8px 15px; background-color: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer;">Register</button>
                    </div>
                </form>
            </div>
        `;

        // Add modals to the document
        document.body.appendChild(loginModal);
        document.body.appendChild(registrationModal);

        // Add event listeners for close buttons
        document.querySelectorAll('.auth-modal-close').forEach(button => {
            button.addEventListener('click', function() {
                document.getElementById('auth-login-modal').style.display = 'none';
                document.getElementById('auth-registration-modal').style.display = 'none';
            });
        });

        // Add event listener for login form
        document.getElementById('auth-login-form').addEventListener('submit', async function(e) {
            e.preventDefault();

            const name = document.getElementById('login-name').value.trim();
            const passcode = document.getElementById('login-passcode').value.trim();

            if (!name || !passcode) {
                alert('Please enter your name and passcode');
                return;
            }

            try {
                const result = await AuthManager.loginUser(name, passcode);

                if (result.success) {
                    // Login successful
                    alert('Login successful!');

                    // Hide modal
                    document.getElementById('auth-login-modal').style.display = 'none';

                    // Redirect based on role
                    if (result.data.userRole === AuthManager.ROLES.TA) {
                        window.location.href = 'ta-dashboard.html';
                    } else {
                        // Reload page to update UI
                        window.location.reload();
                    }
                } else {
                    // Login failed
                    alert('Login failed: ' + result.error);
                }
            } catch (error) {
                console.error('Error during login:', error);
                alert('An unexpected error occurred. Please try again.');
            }
        });

        // Add event listener for registration form
        document.getElementById('auth-registration-form').addEventListener('submit', async function(e) {
            e.preventDefault();

            const name = document.getElementById('register-name').value.trim();
            const passcode = document.getElementById('register-passcode').value.trim();
            const role = document.getElementById('register-role').value.trim() || 'student';

            if (!name || !passcode) {
                alert('Please enter your name and passcode');
                return;
            }

            if (!/^[0-9]{4}$/.test(passcode)) {
                alert('Passcode must be exactly 4 digits');
                return;
            }

            try {
                const result = await AuthManager.registerUser(name, passcode, role);

                if (result.success) {
                    // Registration successful
                    alert('Registration successful! You are now logged in.');

                    // Hide modal
                    document.getElementById('auth-registration-modal').style.display = 'none';

                    // Redirect based on role
                    if (result.data.userRole === AuthManager.ROLES.TA) {
                        window.location.href = 'ta-dashboard.html';
                    } else {
                        // Reload page to update UI
                        window.location.reload();
                    }
                } else {
                    // Registration failed
                    alert('Registration failed: ' + result.error);
                }
            } catch (error) {
                console.error('Error during registration:', error);
                alert('An unexpected error occurred. Please try again.');
            }
        });
    }
};

// For backward compatibility
window.StudentAuth = AuthManager;

console.log("Auth Manager loaded");
