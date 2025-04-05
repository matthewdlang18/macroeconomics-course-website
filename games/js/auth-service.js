/**
 * auth-service.js
 * Centralized authentication service for all games
 * This file should be loaded AFTER firebase-core.js
 */

// Ensure the EconGames namespace exists
window.EconGames = window.EconGames || {};

// Authentication Service
EconGames.AuthService = {
    // Initialize collections if not already done
    init: function() {
        // Ensure collections are set up
        if (!EconGames.collections) {
            console.error('EconGames.collections not initialized. Make sure firebase-core.js is loaded first.');
            return;
        }

        // Create TA collection if it doesn't exist
        if (!EconGames.collections.tas) {
            EconGames.collections.tas = EconGames.db.collection('tas');
        }
    },
    // Check if user is logged in
    isLoggedIn: function() {
        const session = this.getSession();
        if (!session) {
            return false;
        }

        // Check if session is less than 24 hours old
        const timestamp = parseInt(session.timestamp);
        const now = Date.now();
        const sessionAge = now - timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        return sessionAge < maxAge;
    },

    // Register a new student
    registerStudent: async function(name, passcode) {
        try {
            // Validate inputs
            if (!name || !passcode) {
                return { success: false, error: 'Name and passcode are required' };
            }

            // Validate passcode format (4 digits)
            if (!/^\d{4}$/.test(passcode)) {
                return { success: false, error: 'Passcode must be exactly 4 digits' };
            }

            // Check if student already exists with this name and passcode
            const snapshot = await EconGames.collections.students
                .where('name', '==', name)
                .where('passcode', '==', passcode)
                .get();

            if (!snapshot.empty) {
                // Student already exists, return existing data
                const studentDoc = snapshot.docs[0];
                const studentData = studentDoc.data();

                // Save to session
                this.saveSession({
                    studentId: studentDoc.id,
                    name: studentData.name,
                    enrollments: studentData.enrollments || []
                });

                return {
                    success: true,
                    data: {
                        studentId: studentDoc.id,
                        name: studentData.name,
                        enrollments: studentData.enrollments || []
                    },
                    message: 'Logged in with existing account'
                };
            }

            // Create new student document
            const studentRef = EconGames.collections.students.doc();
            await studentRef.set({
                name: name,
                passcode: passcode,
                created: firebase.firestore.FieldValue.serverTimestamp(),
                enrollments: []
            });

            // Save to session
            this.saveSession({
                studentId: studentRef.id,
                name: name,
                enrollments: []
            });

            return {
                success: true,
                data: {
                    studentId: studentRef.id,
                    name: name,
                    enrollments: []
                },
                message: 'New student registered successfully'
            };
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
            const snapshot = await EconGames.collections.students
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
                name: studentData.name,
                enrollments: studentData.enrollments || []
            });

            return {
                success: true,
                data: {
                    studentId: studentDoc.id,
                    name: studentData.name,
                    enrollments: studentData.enrollments || []
                }
            };
        } catch (error) {
            console.error('Error logging in:', error);
            return { success: false, error: error.message || 'Login failed' };
        }
    },

    // Get student data
    getStudentData: async function(studentId) {
        try {
            const studentDoc = await EconGames.collections.students.doc(studentId).get();

            if (!studentDoc.exists) {
                return { success: false, error: 'Student not found' };
            }

            const studentData = studentDoc.data();

            return {
                success: true,
                data: {
                    studentId: studentDoc.id,
                    name: studentData.name,
                    enrollments: studentData.enrollments || []
                }
            };
        } catch (error) {
            console.error('Error getting student data:', error);
            return { success: false, error: error.message || 'Failed to get student data' };
        }
    },

    // Enroll student in a class
    enrollInClass: async function(studentId, classCode) {
        try {
            // Find class by class code
            const snapshot = await EconGames.collections.classes
                .where('classCode', '==', classCode)
                .where('active', '==', true)
                .get();

            if (snapshot.empty) {
                return { success: false, error: 'Invalid class code or class is not active' };
            }

            const classDoc = snapshot.docs[0];
            const classId = classDoc.id;
            const classData = classDoc.data();

            // Update student's enrollments
            await EconGames.collections.students.doc(studentId).update({
                enrollments: firebase.firestore.FieldValue.arrayUnion(classId)
            });

            // Update class's student list
            await EconGames.collections.classes.doc(classId).update({
                students: firebase.firestore.FieldValue.arrayUnion(studentId)
            });

            // Update session
            const session = this.getSession();
            if (session) {
                session.enrollments = session.enrollments || [];
                if (!session.enrollments.includes(classId)) {
                    session.enrollments.push(classId);
                }
                session.currentClassId = classId;
                this.saveSession(session);
            }

            return {
                success: true,
                data: {
                    classId: classId,
                    className: classData.name,
                    instructor: classData.instructor
                }
            };
        } catch (error) {
            console.error('Error enrolling in class:', error);
            return { success: false, error: error.message || 'Enrollment failed' };
        }
    },

    // Get classes for a student
    getStudentClasses: async function(studentId) {
        try {
            const studentDoc = await EconGames.collections.students.doc(studentId).get();

            if (!studentDoc.exists) {
                return { success: false, error: 'Student not found' };
            }

            const studentData = studentDoc.data();
            const enrollments = studentData.enrollments || [];

            if (enrollments.length === 0) {
                return { success: true, data: [] };
            }

            // Get class details for each enrollment
            const classPromises = enrollments.map(classId =>
                EconGames.collections.classes.doc(classId).get()
            );

            const classDocs = await Promise.all(classPromises);
            const classes = classDocs
                .filter(doc => doc.exists)
                .map(doc => ({
                    classId: doc.id,
                    ...doc.data()
                }));

            return { success: true, data: classes };
        } catch (error) {
            console.error('Error getting student classes:', error);
            return { success: false, error: error.message || 'Failed to get classes' };
        }
    },

    // Save session to localStorage
    saveSession: function(studentData, classId = null) {
        localStorage.setItem('studentId', studentData.studentId);
        localStorage.setItem('studentName', studentData.name);
        localStorage.setItem('enrollments', JSON.stringify(studentData.enrollments || []));

        if (classId) {
            localStorage.setItem('currentClassId', classId);
        }

        localStorage.setItem('sessionTimestamp', Date.now());
    },

    // Get current session
    getSession: function() {
        const studentId = localStorage.getItem('studentId');
        const studentName = localStorage.getItem('studentName');
        const enrollments = JSON.parse(localStorage.getItem('enrollments') || '[]');
        const currentClassId = localStorage.getItem('currentClassId');
        const timestamp = localStorage.getItem('sessionTimestamp');

        if (!studentId || !studentName) {
            return null;
        }

        return {
            studentId,
            studentName,
            enrollments,
            currentClassId,
            timestamp
        };
    },

    // Clear session
    clearSession: function() {
        localStorage.removeItem('studentId');
        localStorage.removeItem('studentName');
        localStorage.removeItem('enrollments');
        localStorage.removeItem('currentClassId');
        localStorage.removeItem('sessionTimestamp');
    },

    // Show registration modal
    showRegistrationModal: function() {
        // Direct implementation without checking StudentAuth to avoid circular reference
        this._createModals();
        document.getElementById('registration-modal').classList.remove('hidden');
    },

    // Show login modal
    showLoginModal: function() {
        // Direct implementation without checking StudentAuth to avoid circular reference
        this._createModals();
        document.getElementById('login-modal').classList.remove('hidden');
    },

    // Logout user
    logout: function() {
        this.clearSession();
        this.clearTASession();
        window.location.reload();
    },

    // TA Authentication Methods

    // Check if TA is logged in
    isTALoggedIn: function() {
        const session = this.getTASession();
        if (!session) {
            return false;
        }

        // Check if session is less than 24 hours old
        const timestamp = parseInt(session.timestamp);
        const now = Date.now();
        const sessionAge = now - timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        return sessionAge < maxAge;
    },

    // Login a TA
    loginTA: async function(name, passcode) {
        try {
            // Initialize if needed
            this.init();

            // Validate inputs
            if (!name || !passcode) {
                return { success: false, error: 'Name and passcode are required' };
            }

            // Find TA by name and passcode
            const snapshot = await EconGames.collections.tas
                .where('name', '==', name)
                .where('passcode', '==', passcode)
                .get();

            if (snapshot.empty) {
                return { success: false, error: 'Invalid TA credentials' };
            }

            const taDoc = snapshot.docs[0];
            const taData = taDoc.data();

            // Save to session
            this.saveTASession({
                taId: taDoc.id,
                name: taData.name,
                role: taData.role || 'ta'
            });

            return {
                success: true,
                data: {
                    taId: taDoc.id,
                    name: taData.name,
                    role: taData.role || 'ta'
                }
            };
        } catch (error) {
            console.error('Error logging in TA:', error);
            return { success: false, error: error.message || 'TA login failed' };
        }
    },

    // Create a TA (admin function)
    createTA: async function(name, passcode, role = 'ta') {
        try {
            // Initialize if needed
            this.init();

            // Validate inputs
            if (!name || !passcode) {
                return { success: false, error: 'Name and passcode are required' };
            }

            // Check if TA already exists with this name
            const snapshot = await EconGames.collections.tas
                .where('name', '==', name)
                .get();

            if (!snapshot.empty) {
                return { success: false, error: 'A TA with this name already exists' };
            }

            // Create new TA document
            const taRef = EconGames.collections.tas.doc();
            await taRef.set({
                name: name,
                passcode: passcode,
                role: role,
                created: firebase.firestore.FieldValue.serverTimestamp()
            });

            return {
                success: true,
                data: {
                    taId: taRef.id,
                    name: name,
                    role: role
                }
            };
        } catch (error) {
            console.error('Error creating TA:', error);
            return { success: false, error: error.message || 'Failed to create TA' };
        }
    },

    // Save TA session to localStorage
    saveTASession: function(taData) {
        localStorage.setItem('taId', taData.taId);
        localStorage.setItem('taName', taData.name);
        localStorage.setItem('taRole', taData.role);
        localStorage.setItem('taSessionTimestamp', Date.now());
    },

    // Get current TA session
    getTASession: function() {
        const taId = localStorage.getItem('taId');
        const taName = localStorage.getItem('taName');
        const taRole = localStorage.getItem('taRole');
        const timestamp = localStorage.getItem('taSessionTimestamp');

        if (!taId || !taName) {
            return null;
        }

        return {
            taId,
            taName,
            taRole,
            timestamp
        };
    },

    // Clear TA session
    clearTASession: function() {
        localStorage.removeItem('taId');
        localStorage.removeItem('taName');
        localStorage.removeItem('taRole');
        localStorage.removeItem('taSessionTimestamp');
    },

    // Show TA login modal
    showTALoginModal: function() {
        this._createTAModals();
        document.getElementById('ta-login-modal').classList.remove('hidden');
    },

    // Private method to create TA modals if needed
    _createTAModals: function() {
        // Check if modals already exist
        if (document.getElementById('ta-login-modal')) {
            return; // Modals already exist, no need to create them
        }

        console.log("Creating TA auth modals from AuthService");

        // Create TA login modal
        const taLoginModal = document.createElement('div');
        taLoginModal.id = 'ta-login-modal';
        taLoginModal.className = 'modal hidden fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50';
        taLoginModal.innerHTML = `
            <div class="modal-content bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <h2 class="text-2xl font-bold mb-4">TA Login</h2>
                <form id="ta-login-form" class="space-y-4">
                    <div>
                        <label for="ta-login-name" class="block text-sm font-medium text-gray-700">TA Name</label>
                        <input type="text" id="ta-login-name" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    </div>
                    <div>
                        <label for="ta-login-passcode" class="block text-sm font-medium text-gray-700">Passcode</label>
                        <input type="password" id="ta-login-passcode" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    </div>
                    <div class="flex justify-between">
                        <button type="button" class="modal-close px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100">Cancel</button>
                        <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Login</button>
                    </div>
                </form>
            </div>
        `;

        // Add modal to the document
        document.body.appendChild(taLoginModal);

        // Add event listeners for close buttons
        taLoginModal.querySelectorAll('.modal-close').forEach(button => {
            button.addEventListener('click', function() {
                taLoginModal.classList.add('hidden');
            });
        });

        // Add event listener for form submission
        document.getElementById('ta-login-form').addEventListener('submit', async function(e) {
            e.preventDefault();

            const name = document.getElementById('ta-login-name').value.trim();
            const passcode = document.getElementById('ta-login-passcode').value.trim();

            if (!name || !passcode) {
                alert('Please enter your name and passcode');
                return;
            }

            try {
                const result = await EconGames.AuthService.loginTA(name, passcode);

                if (result.success) {
                    // Login successful
                    alert('TA login successful!');

                    // Hide modal
                    document.getElementById('ta-login-modal').classList.add('hidden');

                    // Reload page to update UI
                    window.location.reload();
                } else {
                    // Login failed
                    alert('TA login failed: ' + result.error);
                }
            } catch (error) {
                console.error('Error during TA login:', error);
                alert('An unexpected error occurred. Please try again.');
            }
        });
    },

    // Private method to create modals if needed
    _createModals: function() {
        // Check if modals already exist
        if (document.getElementById('login-modal')) {
            return; // Modals already exist, no need to create them
        }

        console.log("Creating auth modals from AuthService");

        // Create login modal
        const loginModal = document.createElement('div');
        loginModal.id = 'login-modal';
        loginModal.className = 'modal hidden fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50';
        loginModal.innerHTML = `
            <div class="modal-content bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <h2 class="text-2xl font-bold mb-4">Student Login</h2>
                <form id="login-form" class="space-y-4">
                    <div>
                        <label for="login-name" class="block text-sm font-medium text-gray-700">Name</label>
                        <input type="text" id="login-name" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    </div>
                    <div>
                        <label for="login-passcode" class="block text-sm font-medium text-gray-700">Passcode (4 digits)</label>
                        <input type="password" id="login-passcode" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" maxlength="4" pattern="\d{4}">
                    </div>
                    <div class="flex justify-between">
                        <button type="button" class="modal-close px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100">Cancel</button>
                        <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Login</button>
                    </div>
                </form>
            </div>
        `;

        // Create registration modal
        const registrationModal = document.createElement('div');
        registrationModal.id = 'registration-modal';
        registrationModal.className = 'modal hidden fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50';
        registrationModal.innerHTML = `
            <div class="modal-content bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <h2 class="text-2xl font-bold mb-4">New Student Registration</h2>
                <form id="registration-form" class="space-y-4">
                    <div>
                        <label for="register-name" class="block text-sm font-medium text-gray-700">Name</label>
                        <input type="text" id="register-name" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    </div>
                    <div>
                        <label for="register-passcode" class="block text-sm font-medium text-gray-700">Passcode (4 digits)</label>
                        <input type="password" id="register-passcode" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" maxlength="4" pattern="\d{4}">
                    </div>
                    <div class="flex justify-between">
                        <button type="button" class="modal-close px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100">Cancel</button>
                        <button type="submit" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Register</button>
                    </div>
                </form>
            </div>
        `;

        // Add modals to the document
        document.body.appendChild(loginModal);
        document.body.appendChild(registrationModal);

        // Add event listeners for close buttons
        document.querySelectorAll('.modal-close').forEach(button => {
            button.addEventListener('click', function() {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.classList.add('hidden');
                });
            });
        });

        // Add event listeners for form submissions
        document.getElementById('login-form').addEventListener('submit', async function(e) {
            e.preventDefault();

            const name = document.getElementById('login-name').value.trim();
            const passcode = document.getElementById('login-passcode').value.trim();

            if (!name || !passcode) {
                alert('Please enter your name and passcode');
                return;
            }

            try {
                const result = await EconGames.AuthService.loginStudent(name, passcode);

                if (result.success) {
                    // Login successful
                    alert('Login successful!');

                    // Hide modal
                    document.getElementById('login-modal').classList.add('hidden');

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

        document.getElementById('registration-form').addEventListener('submit', async function(e) {
            e.preventDefault();

            const name = document.getElementById('register-name').value.trim();
            const passcode = document.getElementById('register-passcode').value.trim();

            if (!name || !passcode) {
                alert('Please enter your name and passcode');
                return;
            }

            if (!/^\d{4}$/.test(passcode)) {
                alert('Passcode must be exactly 4 digits');
                return;
            }

            try {
                const result = await EconGames.AuthService.registerStudent(name, passcode);

                if (result.success) {
                    // Registration successful
                    alert('Registration successful! You are now logged in.');

                    // Hide modal
                    document.getElementById('registration-modal').classList.add('hidden');

                    // Reload page to update UI
                    window.location.reload();
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

// Export for backward compatibility
// Use a different approach to avoid circular reference
if (!window.StudentAuth) {
    window.StudentAuth = {};

    // Copy methods from EconGames.AuthService to StudentAuth
    for (const key in EconGames.AuthService) {
        if (typeof EconGames.AuthService[key] === 'function') {
            window.StudentAuth[key] = function() {
                return EconGames.AuthService[key].apply(EconGames.AuthService, arguments);
            };
        }
    }
}

// Initialize the auth service
EconGames.AuthService.init();

console.log("Auth service loaded");
