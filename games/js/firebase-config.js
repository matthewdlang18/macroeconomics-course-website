// Centralized Firebase Configuration for Economics Games
// This file provides a unified Firebase setup for all games

// Firebase configuration
// Replace these values with your actual Firebase project details
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

// Collections
const studentsCollection = db.collection('students');
const classesCollection = db.collection('classes');
const fiscalGameCollection = db.collection('fiscalGameData');
const investmentGameCollection = db.collection('investmentGameData');

// Student Management Service
const StudentService = {
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
            const snapshot = await studentsCollection
                .where('name', '==', name)
                .where('passcode', '==', passcode)
                .get();
            
            if (!snapshot.empty) {
                // Student already exists, return existing data
                const studentDoc = snapshot.docs[0];
                const studentData = studentDoc.data();
                
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
            const studentRef = studentsCollection.doc();
            await studentRef.set({
                name: name,
                passcode: passcode,
                created: firebase.firestore.FieldValue.serverTimestamp(),
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
            const snapshot = await studentsCollection
                .where('name', '==', name)
                .where('passcode', '==', passcode)
                .get();
            
            if (snapshot.empty) {
                return { success: false, error: 'Invalid name or passcode' };
            }
            
            const studentDoc = snapshot.docs[0];
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
            console.error('Error logging in:', error);
            return { success: false, error: error.message || 'Login failed' };
        }
    },
    
    // Get student data
    getStudentData: async function(studentId) {
        try {
            const studentDoc = await studentsCollection.doc(studentId).get();
            
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
            const snapshot = await classesCollection
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
            await studentsCollection.doc(studentId).update({
                enrollments: firebase.firestore.FieldValue.arrayUnion(classId)
            });
            
            // Update class's student list
            await classesCollection.doc(classId).update({
                students: firebase.firestore.FieldValue.arrayUnion(studentId)
            });
            
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
            const studentDoc = await studentsCollection.doc(studentId).get();
            
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
                classesCollection.doc(classId).get()
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
    }
};

// Class Management Service
const ClassService = {
    // Create a new class (admin only)
    createClass: async function(className, instructor, classCode) {
        try {
            // Check if class code already exists
            const snapshot = await classesCollection
                .where('classCode', '==', classCode)
                .get();
            
            if (!snapshot.empty) {
                return { success: false, error: 'Class code already in use' };
            }
            
            // Create new class
            const classRef = classesCollection.doc();
            await classRef.set({
                name: className,
                instructor: instructor,
                classCode: classCode,
                active: true,
                created: firebase.firestore.FieldValue.serverTimestamp(),
                students: []
            });
            
            return { 
                success: true, 
                data: {
                    classId: classRef.id,
                    name: className,
                    instructor: instructor,
                    classCode: classCode
                }
            };
        } catch (error) {
            console.error('Error creating class:', error);
            return { success: false, error: error.message || 'Failed to create class' };
        }
    },
    
    // Get class data
    getClassData: async function(classId) {
        try {
            const classDoc = await classesCollection.doc(classId).get();
            
            if (!classDoc.exists) {
                return { success: false, error: 'Class not found' };
            }
            
            return { 
                success: true, 
                data: {
                    classId: classDoc.id,
                    ...classDoc.data()
                }
            };
        } catch (error) {
            console.error('Error getting class data:', error);
            return { success: false, error: error.message || 'Failed to get class data' };
        }
    },
    
    // Get students in a class
    getClassStudents: async function(classId) {
        try {
            const classDoc = await classesCollection.doc(classId).get();
            
            if (!classDoc.exists) {
                return { success: false, error: 'Class not found' };
            }
            
            const classData = classDoc.data();
            const studentIds = classData.students || [];
            
            if (studentIds.length === 0) {
                return { success: true, data: [] };
            }
            
            // Get student details
            const studentPromises = studentIds.map(studentId => 
                studentsCollection.doc(studentId).get()
            );
            
            const studentDocs = await Promise.all(studentPromises);
            const students = studentDocs
                .filter(doc => doc.exists)
                .map(doc => ({
                    studentId: doc.id,
                    name: doc.data().name,
                    created: doc.data().created
                }));
            
            return { success: true, data: students };
        } catch (error) {
            console.error('Error getting class students:', error);
            return { success: false, error: error.message || 'Failed to get students' };
        }
    }
};

// Game Data Service
const GameDataService = {
    // Save game data for a student
    saveGameData: async function(gameType, studentId, classId, gameData) {
        try {
            const collection = gameType === 'fiscal' ? fiscalGameCollection : investmentGameCollection;
            const docId = `${studentId}_${classId || 'single'}`;
            
            await collection.doc(docId).set({
                studentId: studentId,
                classId: classId || 'single',
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                gameData: gameData
            }, { merge: true });
            
            return { success: true };
        } catch (error) {
            console.error('Error saving game data:', error);
            return { success: false, error: error.message || 'Failed to save game data' };
        }
    },
    
    // Get game data for a student
    getGameData: async function(gameType, studentId, classId) {
        try {
            const collection = gameType === 'fiscal' ? fiscalGameCollection : investmentGameCollection;
            const docId = `${studentId}_${classId || 'single'}`;
            
            const doc = await collection.doc(docId).get();
            
            if (!doc.exists) {
                return { success: true, data: null };
            }
            
            return { success: true, data: doc.data().gameData };
        } catch (error) {
            console.error('Error getting game data:', error);
            return { success: false, error: error.message || 'Failed to get game data' };
        }
    },
    
    // Get leaderboard data for a class
    getLeaderboard: async function(gameType, classId) {
        try {
            const collection = gameType === 'fiscal' ? fiscalGameCollection : investmentGameCollection;
            
            const snapshot = await collection
                .where('classId', '==', classId)
                .get();
            
            if (snapshot.empty) {
                return { success: true, data: [] };
            }
            
            // Get student names
            const studentIds = snapshot.docs.map(doc => doc.data().studentId);
            const studentPromises = studentIds.map(id => studentsCollection.doc(id).get());
            const studentDocs = await Promise.all(studentPromises);
            
            const studentNames = {};
            studentDocs.forEach(doc => {
                if (doc.exists) {
                    studentNames[doc.id] = doc.data().name;
                }
            });
            
            // Format leaderboard data
            const leaderboardData = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    studentId: data.studentId,
                    studentName: studentNames[data.studentId] || 'Unknown',
                    score: data.gameData.score || 0,
                    lastUpdated: data.lastUpdated
                };
            });
            
            // Sort by score (descending)
            leaderboardData.sort((a, b) => b.score - a.score);
            
            return { success: true, data: leaderboardData };
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            return { success: false, error: error.message || 'Failed to get leaderboard' };
        }
    }
};

// Session Management
const SessionManager = {
    // Save student session to localStorage
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
    
    // Check if session is valid (not expired)
    isSessionValid: function() {
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
    }
};

// Export services
window.StudentService = StudentService;
window.ClassService = ClassService;
window.GameDataService = GameDataService;
window.SessionManager = SessionManager;
