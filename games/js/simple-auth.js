/**
 * simple-auth.js
 * A simple authentication system for the economics games
 * This is a standalone system that doesn't rely on any other code
 */

// Create a namespace for our authentication system
window.SimpleAuth = {
    // Check if user is logged in
    isLoggedIn: function() {
        const studentId = localStorage.getItem('studentId');
        const studentName = localStorage.getItem('studentName');
        const timestamp = localStorage.getItem('sessionTimestamp');

        if (!studentId || !studentName || !timestamp) {
            return false;
        }

        // Check if session is less than 24 hours old
        const sessionAge = Date.now() - parseInt(timestamp);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        return sessionAge < maxAge;
    },

    // Get current session
    getSession: function() {
        if (!this.isLoggedIn()) {
            return null;
        }

        return {
            studentId: localStorage.getItem('studentId'),
            studentName: localStorage.getItem('studentName'),
            enrollments: JSON.parse(localStorage.getItem('enrollments') || '[]'),
            currentClassId: localStorage.getItem('currentClassId'),
            timestamp: localStorage.getItem('sessionTimestamp')
        };
    },

    // Save session
    saveSession: function(studentData, classId = null) {
        localStorage.setItem('studentId', studentData.studentId);
        localStorage.setItem('studentName', studentData.studentName);
        localStorage.setItem('enrollments', JSON.stringify(studentData.enrollments || []));

        if (classId) {
            localStorage.setItem('currentClassId', classId);
        }

        localStorage.setItem('sessionTimestamp', Date.now().toString());
    },

    // Clear session
    clearSession: function() {
        localStorage.removeItem('studentId');
        localStorage.removeItem('studentName');
        localStorage.removeItem('enrollments');
        localStorage.removeItem('currentClassId');
        localStorage.removeItem('sessionTimestamp');
    },

    // Register a new student
    registerStudent: async function(name, passcode) {
        console.log('registerStudent called with:', { name, passcode });
        try {
            // Validate inputs
            if (!name || !passcode) {
                console.log('Validation failed: name or passcode missing');
                return { success: false, error: 'Name and passcode are required' };
            }

            // Validate passcode format (4 digits)
            if (!/^[0-9]{4}$/.test(passcode)) {
                console.log('Validation failed: passcode not 4 digits, passcode =', passcode);
                return { success: false, error: 'Passcode must be exactly 4 digits' };
            }

            // Check if student already exists with this name and passcode
            const db = firebase.firestore();
            console.log('Checking if student exists in Firestore');
            try {
                const snapshot = await db.collection('students')
                    .where('name', '==', name)
                    .where('passcode', '==', passcode)
                    .get();

                console.log('Firestore query result:', snapshot.empty ? 'No matching student' : 'Student found');

                if (!snapshot.empty) {
                    // Student already exists, return existing data
                    const studentDoc = snapshot.docs[0];
                    const studentData = studentDoc.data();
                    console.log('Existing student data:', studentData);

                    // Save to session
                    this.saveSession({
                        studentId: studentDoc.id,
                        studentName: studentData.name,
                        enrollments: studentData.enrollments || []
                    });

                    return {
                        success: true,
                        data: {
                            studentId: studentDoc.id,
                            studentName: studentData.name,
                            enrollments: studentData.enrollments || []
                        },
                        message: 'Logged in with existing account'
                    };
                }
            } catch (queryError) {
                console.error('Error querying Firestore:', queryError);
                return { success: false, error: 'Error checking if student exists: ' + queryError.message };
            }

            // Create new student document
            console.log('Creating new student document');
            try {
                const studentRef = db.collection('students').doc();
                await studentRef.set({
                    name: name,
                    passcode: passcode,
                    created: firebase.firestore.FieldValue.serverTimestamp(),
                    enrollments: []
                });

                console.log('New student created with ID:', studentRef.id);

                // Save to session
                this.saveSession({
                    studentId: studentRef.id,
                    studentName: name,
                    enrollments: []
                });

                return {
                    success: true,
                    data: {
                        studentId: studentRef.id,
                        studentName: name,
                        enrollments: []
                    },
                    message: 'New student registered successfully'
                };
            } catch (createError) {
                console.error('Error creating new student:', createError);
                return { success: false, error: 'Error creating new student: ' + createError.message };
            }
        } catch (error) {
            console.error('Error registering student:', error);
            return { success: false, error: error.message || 'Registration failed' };
        }
    },

    // Login a student
    loginStudent: async function(name, passcode) {
        try {
            // Validate inputs
            if (!name || !passcode) {
                return { success: false, error: 'Name and passcode are required' };
            }

            // Find student by name and passcode
            const db = firebase.firestore();
            const snapshot = await db.collection('students')
                .where('name', '==', name)
                .where('passcode', '==', passcode)
                .get();

            if (snapshot.empty) {
                return { success: false, error: 'Invalid name or passcode' };
            }

            const studentDoc = snapshot.docs[0];
            const studentData = studentDoc.data();

            // Save to session
            this.saveSession({
                studentId: studentDoc.id,
                studentName: studentData.name,
                enrollments: studentData.enrollments || []
            });

            return {
                success: true,
                data: {
                    studentId: studentDoc.id,
                    studentName: studentData.name,
                    enrollments: studentData.enrollments || []
                }
            };
        } catch (error) {
            console.error('Error logging in:', error);
            return { success: false, error: error.message || 'Login failed' };
        }
    },

    // Logout
    logout: function() {
        this.clearSession();
        window.location.reload();
    },

    // Show login modal
    showLoginModal: function() {
        // Create modal if it doesn't exist
        if (!document.getElementById('simple-login-modal')) {
            this._createModals();
        }

        // Show login modal
        document.getElementById('simple-login-modal').style.display = 'flex';
    },

    // Show registration modal
    showRegistrationModal: function() {
        // Create modal if it doesn't exist
        if (!document.getElementById('simple-registration-modal')) {
            this._createModals();
        }

        // Show registration modal
        document.getElementById('simple-registration-modal').style.display = 'flex';
    },

    // Create modals
    _createModals: function() {
        // Check if modals already exist
        if (document.getElementById('simple-login-modal')) {
            return;
        }

        // Create login modal
        const loginModal = document.createElement('div');
        loginModal.id = 'simple-login-modal';
        loginModal.style.cssText = 'display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: center;';

        loginModal.innerHTML = `
            <div style="background-color: white; padding: 20px; border-radius: 5px; width: 300px;">
                <h2 style="margin-top: 0;">Student Login</h2>
                <form id="simple-login-form">
                    <div style="margin-bottom: 10px;">
                        <label for="simple-login-name" style="display: block; margin-bottom: 5px;">Name</label>
                        <input type="text" id="simple-login-name" style="width: 100%; padding: 8px; box-sizing: border-box;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label for="simple-login-passcode" style="display: block; margin-bottom: 5px;">Passcode (4 digits)</label>
                        <input type="password" id="simple-login-passcode" style="width: 100%; padding: 8px; box-sizing: border-box;" maxlength="4" pattern="[0-9]{4}">
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <button type="button" class="simple-modal-close" style="padding: 8px 15px; background-color: #f0f0f0; border: none; border-radius: 3px; cursor: pointer;">Cancel</button>
                        <button type="submit" style="padding: 8px 15px; background-color: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer;">Login</button>
                    </div>
                </form>
            </div>
        `;

        // Create registration modal
        const registrationModal = document.createElement('div');
        registrationModal.id = 'simple-registration-modal';
        registrationModal.style.cssText = 'display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: center;';

        registrationModal.innerHTML = `
            <div style="background-color: white; padding: 20px; border-radius: 5px; width: 300px;">
                <h2 style="margin-top: 0;">New Student Registration</h2>
                <form id="simple-registration-form">
                    <div style="margin-bottom: 10px;">
                        <label for="simple-register-name" style="display: block; margin-bottom: 5px;">Name</label>
                        <input type="text" id="simple-register-name" style="width: 100%; padding: 8px; box-sizing: border-box;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label for="simple-register-passcode" style="display: block; margin-bottom: 5px;">Passcode (4 digits)</label>
                        <input type="password" id="simple-register-passcode" style="width: 100%; padding: 8px; box-sizing: border-box;" maxlength="4" pattern="[0-9]{4}">
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <button type="button" class="simple-modal-close" style="padding: 8px 15px; background-color: #f0f0f0; border: none; border-radius: 3px; cursor: pointer;">Cancel</button>
                        <button type="submit" style="padding: 8px 15px; background-color: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer;">Register</button>
                    </div>
                </form>
            </div>
        `;

        // Add modals to the document
        document.body.appendChild(loginModal);
        document.body.appendChild(registrationModal);

        // Add event listeners for close buttons
        document.querySelectorAll('.simple-modal-close').forEach(button => {
            button.addEventListener('click', function() {
                document.getElementById('simple-login-modal').style.display = 'none';
                document.getElementById('simple-registration-modal').style.display = 'none';
            });
        });

        // Add event listener for login form
        document.getElementById('simple-login-form').addEventListener('submit', async function(e) {
            e.preventDefault();

            const name = document.getElementById('simple-login-name').value.trim();
            const passcode = document.getElementById('simple-login-passcode').value.trim();

            if (!name || !passcode) {
                alert('Please enter your name and passcode');
                return;
            }

            try {
                const result = await SimpleAuth.loginStudent(name, passcode);

                if (result.success) {
                    // Login successful
                    alert('Login successful!');

                    // Hide modal
                    document.getElementById('simple-login-modal').style.display = 'none';

                    // Reload page to update UI
                    window.location.reload();
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
        document.getElementById('simple-registration-form').addEventListener('submit', async function(e) {
            e.preventDefault();

            const name = document.getElementById('simple-register-name').value.trim();
            const passcode = document.getElementById('simple-register-passcode').value.trim();

            console.log('Registration attempt:', { name, passcode });

            if (!name || !passcode) {
                alert('Please enter your name and passcode');
                return;
            }

            // Check if passcode is 4 digits
            if (!/^[0-9]{4}$/.test(passcode)) {
                console.log('Passcode validation failed:', passcode, 'Pattern test result:', /^[0-9]{4}$/.test(passcode));
                alert('Passcode must be exactly 4 digits');
                return;
            }

            try {
                console.log('Calling registerStudent with:', name, passcode);
                const result = await SimpleAuth.registerStudent(name, passcode);
                console.log('Registration result:', result);

                if (result.success) {
                    // Registration successful
                    alert('Registration successful! You are now logged in.');

                    // Hide modal
                    document.getElementById('simple-registration-modal').style.display = 'none';

                    // Reload page to update UI
                    window.location.reload();
                } else {
                    // Registration failed
                    console.error('Registration failed:', result.error);
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
window.StudentAuth = SimpleAuth;

console.log('Simple Auth loaded');
