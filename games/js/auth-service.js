/**
 * auth-service.js
 * Centralized authentication service for all games
 * This file should be loaded AFTER firebase-core.js
 */

// Ensure the EconGames namespace exists
window.EconGames = window.EconGames || {};

// Authentication Service
EconGames.AuthService = {
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
            if (!/^\\d{4}$/.test(passcode)) {
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
        if (typeof StudentAuth !== 'undefined' && StudentAuth.showRegistrationModal) {
            StudentAuth.showRegistrationModal();
        } else {
            // Fallback implementation
            this._createModals();
            document.getElementById('registration-modal').classList.remove('hidden');
        }
    },
    
    // Show login modal
    showLoginModal: function() {
        if (typeof StudentAuth !== 'undefined' && StudentAuth.showLoginModal) {
            StudentAuth.showLoginModal();
        } else {
            // Fallback implementation
            this._createModals();
            document.getElementById('login-modal').classList.remove('hidden');
        }
    },
    
    // Logout user
    logout: function() {
        this.clearSession();
        window.location.reload();
    },
    
    // Private method to create modals if needed
    _createModals: function() {
        // Implementation similar to student-auth.js createAuthModals function
        // This is a fallback if the StudentAuth object is not available
        console.log("Creating auth modals from AuthService");
        // Modal creation code would go here
    }
};

// Export for backward compatibility
window.StudentAuth = EconGames.AuthService;

console.log("Auth service loaded");
