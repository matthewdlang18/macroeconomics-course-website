// Firebase Authentication Configuration for TA Sections
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAQ8GqaRb9J3jwjsnZD_rGtNuMdTr2jKjI",
  authDomain: "economics-games.firebaseapp.com",
  projectId: "economics-games",
  storageBucket: "economics-games.firebasestorage.app",
  messagingSenderId: "433473208850",
  appId: "1:433473208850:web:dbc35cfbe0caf382a80ecb",
  measurementId: "G-KYB0YB4J97"
};

// Flag to determine if we're using Firebase or localStorage
let usingFirebase = true;
let db;

// Try to initialize Firebase
try {
    // Check if Firebase is already initialized
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    db = firebase.firestore();

    // Set up CORS settings
    db.settings({
        ignoreUndefinedProperties: true,
        cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
    });

    // Enable offline persistence
    db.enablePersistence({ synchronizeTabs: true })
        .then(() => {
            console.log("Offline persistence enabled");
        })
        .catch((err) => {
            if (err.code === 'failed-precondition') {
                // Multiple tabs open, persistence can only be enabled in one tab at a time
                console.warn("Multiple tabs open, persistence only enabled in one tab");
            } else if (err.code === 'unimplemented') {
                // The current browser does not support all of the features required for persistence
                console.warn("Current browser doesn't support persistence");
            } else {
                console.error("Error enabling persistence:", err);
            }
        });

    console.log("Firebase initialized successfully");
} catch (error) {
    // If Firebase initialization fails, fall back to localStorage
    console.warn("Firebase initialization failed. Falling back to localStorage:", error);
    usingFirebase = false;
}

// Collection references - these will be used if Firebase is available
let tasCollection, sectionsCollection, studentsCollection, gamesCollection;
let gameScoresCollection, gameSessionsCollection, gameParticipantsCollection, gameStatesCollection;

if (usingFirebase && db) {
    try {
        console.log('Setting up Firestore collections...');
        tasCollection = db.collection('tas');
        sectionsCollection = db.collection('sections');
        studentsCollection = db.collection('students');
        gamesCollection = db.collection('games');
        gameScoresCollection = db.collection('game_scores');
        gameSessionsCollection = db.collection('game_sessions');
        gameParticipantsCollection = db.collection('game_participants');
        gameStatesCollection = db.collection('game_states');
        console.log('Collections set up successfully');

        // Make collections available globally for debugging
        window.tasCollection = tasCollection;
        window.sectionsCollection = sectionsCollection;
        window.studentsCollection = studentsCollection;
        window.gamesCollection = gamesCollection;
    } catch (error) {
        console.error('Error setting up collections:', error);
        usingFirebase = false;
    }
}

// Generate TA passcode based on name
function generateTAPasscode(name) {
    // Take first three letters of name (lowercase) and add "econ2"
    const firstThreeLetters = name.toLowerCase().substring(0, 3);
    return `${firstThreeLetters}econ2`;
}

// LocalStorage fallback service for offline development
const LocalStorageService = {
    // TA management
    createTA: async function(name, email = '') {
        try {
            const tas = JSON.parse(localStorage.getItem('tas') || '[]');
            const passcode = generateTAPasscode(name);

            const newTA = {
                name: name,
                email: email,
                passcode: passcode,
                createdAt: new Date().toISOString()
            };

            // Check if TA already exists
            const existingIndex = tas.findIndex(t => t.name === name);
            if (existingIndex >= 0) {
                return { success: false, error: "TA already exists" };
            }

            tas.push(newTA);
            localStorage.setItem('tas', JSON.stringify(tas));
            return { success: true, data: newTA };
        } catch (error) {
            console.error("Error creating TA:", error);
            return { success: false, error: error.message };
        }
    },

    getTA: async function(name) {
        try {
            const tas = JSON.parse(localStorage.getItem('tas') || '[]');
            const ta = tas.find(t => t.name === name);

            if (ta) {
                return { success: true, data: ta };
            } else {
                return { success: false, error: "TA not found" };
            }
        } catch (error) {
            console.error("Error getting TA:", error);
            return { success: false, error: error.message };
        }
    },

    getAllTAs: async function() {
        try {
            const tas = JSON.parse(localStorage.getItem('tas') || '[]');
            return { success: true, data: tas };
        } catch (error) {
            console.error("Error getting TAs:", error);
            return { success: false, error: error.message };
        }
    },

    // Section management
    createSection: async function(day, time, location, ta) {
        try {
            // Check if TA exists
            const taResult = await this.getTA(ta);
            if (!taResult.success) {
                return { success: false, error: "TA not found" };
            }

            const sections = JSON.parse(localStorage.getItem('sections') || '[]');

            // Generate a unique ID for the section
            const sectionId = `${day}_${time.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}`;

            const newSection = {
                id: sectionId,
                day: day,
                time: time,
                location: location,
                ta: ta,
                createdAt: new Date().toISOString()
            };

            sections.push(newSection);
            localStorage.setItem('sections', JSON.stringify(sections));
            return { success: true, data: newSection };
        } catch (error) {
            console.error("Error creating section:", error);
            return { success: false, error: error.message };
        }
    },

    getSection: async function(sectionId) {
        try {
            const sections = JSON.parse(localStorage.getItem('sections') || '[]');
            const section = sections.find(s => s.id === sectionId);

            if (section) {
                return { success: true, data: section };
            } else {
                return { success: false, error: "Section not found" };
            }
        } catch (error) {
            console.error("Error getting section:", error);
            return { success: false, error: error.message };
        }
    },

    getAllSections: async function() {
        try {
            const sections = JSON.parse(localStorage.getItem('sections') || '[]');
            return { success: true, data: sections };
        } catch (error) {
            console.error("Error getting sections:", error);
            return { success: false, error: error.message };
        }
    },

    getSectionsByTA: async function(taName) {
        try {
            const sections = JSON.parse(localStorage.getItem('sections') || '[]');
            const taSections = sections.filter(s => s.ta === taName);
            return { success: true, data: taSections };
        } catch (error) {
            console.error("Error getting sections by TA:", error);
            return { success: false, error: error.message };
        }
    },

    // Student management
    registerStudent: async function(name, passcode) {
        try {
            // Generate a unique ID for the student
            const studentId = `${name.replace(/\s+/g, '_')}_${Date.now()}`;

            // Get existing students
            const students = JSON.parse(localStorage.getItem('students') || '[]');

            // Check if student with same name already exists
            const existingStudent = students.find(s => s.name === name);
            if (existingStudent) {
                // If passcode matches, return success
                if (existingStudent.passcode === passcode) {
                    return { success: true, data: existingStudent };
                } else {
                    return { success: false, error: "Student with this name already exists with a different passcode" };
                }
            }

            // Create student object
            const newStudent = {
                id: studentId,
                name: name,
                passcode: passcode,
                sectionId: null,
                createdAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString()
            };

            // Add student to array
            students.push(newStudent);

            // Save to localStorage
            localStorage.setItem('students', JSON.stringify(students));

            // Store student info in local storage for session
            localStorage.setItem('student_id', studentId);
            localStorage.setItem('student_name', name);

            return { success: true, data: newStudent };
        } catch (error) {
            console.error("Error registering student:", error);
            return { success: false, error: error.message };
        }
    },

    loginStudent: async function(name, passcode) {
        try {
            const students = JSON.parse(localStorage.getItem('students') || '[]');
            const student = students.find(s => s.name === name && s.passcode === passcode);

            if (student) {
                // Update last login time
                const studentIndex = students.findIndex(s => s.id === student.id);
                students[studentIndex].lastLoginAt = new Date().toISOString();
                localStorage.setItem('students', JSON.stringify(students));

                // Store student info in local storage for session
                localStorage.setItem('student_id', student.id);
                localStorage.setItem('student_name', student.name);

                return { success: true, data: student };
            } else {
                return { success: false, error: "Invalid name or passcode" };
            }
        } catch (error) {
            console.error("Error logging in student:", error);
            return { success: false, error: error.message };
        }
    },

    getStudent: async function(studentId) {
        try {
            const students = JSON.parse(localStorage.getItem('students') || '[]');
            const student = students.find(s => s.id === studentId);

            if (student) {
                return { success: true, data: student };
            } else {
                return { success: false, error: "Student not found" };
            }
        } catch (error) {
            console.error("Error getting student:", error);
            return { success: false, error: error.message };
        }
    },

    assignStudentToSection: async function(studentId, sectionId) {
        try {
            // Check if section exists
            const sectionResult = await this.getSection(sectionId);
            if (!sectionResult.success) {
                return { success: false, error: "Section not found" };
            }

            // Get student
            const students = JSON.parse(localStorage.getItem('students') || '[]');
            const studentIndex = students.findIndex(s => s.id === studentId);

            if (studentIndex === -1) {
                return { success: false, error: "Student not found" };
            }

            // Update student's section
            students[studentIndex].sectionId = sectionId;
            localStorage.setItem('students', JSON.stringify(students));

            return { success: true, data: students[studentIndex] };
        } catch (error) {
            console.error("Error assigning student to section:", error);
            return { success: false, error: error.message };
        }
    },

    getStudentsInSection: async function(sectionId) {
        try {
            const students = JSON.parse(localStorage.getItem('students') || '[]');
            const sectionStudents = students.filter(s => s.sectionId === sectionId);
            return { success: true, data: sectionStudents };
        } catch (error) {
            console.error("Error getting students in section:", error);
            return { success: false, error: error.message };
        }
    }
};

// Helper functions for Firebase operations
const FirebaseService = {
    // TA management
    createTA: async function(name, email = '') {
        try {
            const passcode = generateTAPasscode(name);

            await tasCollection.doc(name).set({
                name: name,
                email: email,
                passcode: passcode,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return { success: true, data: { name, email, passcode } };
        } catch (error) {
            console.error("Error creating TA:", error);
            return { success: false, error: error.message };
        }
    },

    getTA: async function(name) {
        try {
            console.log('FirebaseService.getTA called for:', name);
            console.log('tasCollection:', tasCollection);

            if (!tasCollection) {
                console.error('tasCollection is not available');
                throw new Error('Firestore collection not available');
            }

            // Try to get the document
            console.log('Attempting to get document...');
            const doc = await tasCollection.doc(name).get();
            console.log('Document retrieved:', doc);

            if (doc.exists) {
                const data = doc.data();
                console.log('TA data:', data);
                return { success: true, data: data };
            } else {
                console.log('TA not found in Firestore');

                // Fallback: Check if we should create this TA on the fly
                // This is useful for testing when the database is empty
                if (['Akshay', 'Simran', 'Camilla', 'Hui Yann', 'Lars', 'Luorao'].includes(name)) {
                    console.log('Creating TA on the fly for testing');
                    const passcode = generateTAPasscode(name);
                    return {
                        success: true,
                        data: {
                            name: name,
                            passcode: passcode,
                            createdAt: new Date().toISOString()
                        }
                    };
                }

                return { success: false, error: "TA not found" };
            }
        } catch (error) {
            console.error("Error getting TA:", error);

            // Fallback to localStorage or create test data
            console.log('Falling back to test data for:', name);
            if (['Akshay', 'Simran', 'Camilla', 'Hui Yann', 'Lars', 'Luorao'].includes(name)) {
                const passcode = generateTAPasscode(name);
                return {
                    success: true,
                    data: {
                        name: name,
                        passcode: passcode,
                        createdAt: new Date().toISOString()
                    }
                };
            }

            return { success: false, error: error.message };
        }
    },

    getAllTAs: async function() {
        try {
            const snapshot = await tasCollection.get();
            const tas = [];
            snapshot.forEach(doc => {
                tas.push(doc.data());
            });
            return { success: true, data: tas };
        } catch (error) {
            console.error("Error getting TAs:", error);
            return { success: false, error: error.message };
        }
    },

    // Section management
    createSection: async function(day, time, location, ta) {
        try {
            // Check if TA exists
            const taResult = await this.getTA(ta);
            if (!taResult.success) {
                return { success: false, error: "TA not found" };
            }

            // Generate a unique ID for the section
            const sectionId = `${day}_${time.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}`;

            // Create section document
            await sectionsCollection.doc(sectionId).set({
                id: sectionId,
                day: day,
                time: time,
                location: location,
                ta: ta,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return { success: true, data: { id: sectionId, day, time, location, ta } };
        } catch (error) {
            console.error("Error creating section:", error);
            return { success: false, error: error.message };
        }
    },

    getSection: async function(sectionId) {
        try {
            const doc = await sectionsCollection.doc(sectionId).get();
            if (doc.exists) {
                return { success: true, data: doc.data() };
            } else {
                return { success: false, error: "Section not found" };
            }
        } catch (error) {
            console.error("Error getting section:", error);
            return { success: false, error: error.message };
        }
    },

    getAllSections: async function() {
        try {
            const snapshot = await sectionsCollection.get();
            const sections = [];
            snapshot.forEach(doc => {
                sections.push(doc.data());
            });
            return { success: true, data: sections };
        } catch (error) {
            console.error("Error getting sections:", error);
            return { success: false, error: error.message };
        }
    },

    getSectionsByTA: async function(taName) {
        try {
            const snapshot = await sectionsCollection.where('ta', '==', taName).get();
            const sections = [];
            snapshot.forEach(doc => {
                sections.push(doc.data());
            });
            return { success: true, data: sections };
        } catch (error) {
            console.error("Error getting sections by TA:", error);
            return { success: false, error: error.message };
        }
    },

    // Student management
    registerStudent: async function(name, passcode) {
        try {
            // Generate a unique ID for the student
            const studentId = `${name.replace(/\s+/g, '_')}_${Date.now()}`;

            // Check if student with same name already exists
            const snapshot = await studentsCollection.where('name', '==', name).get();
            if (!snapshot.empty) {
                const existingStudent = snapshot.docs[0].data();
                // If passcode matches, return success
                if (existingStudent.passcode === passcode) {
                    return { success: true, data: existingStudent };
                } else {
                    return { success: false, error: "Student with this name already exists with a different passcode" };
                }
            }

            // Create student document
            await studentsCollection.doc(studentId).set({
                id: studentId,
                name: name,
                passcode: passcode,
                sectionId: null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Store student info in local storage for session
            localStorage.setItem('student_id', studentId);
            localStorage.setItem('student_name', name);

            return { success: true, data: { id: studentId, name, passcode } };
        } catch (error) {
            console.error("Error registering student:", error);
            return { success: false, error: error.message };
        }
    },

    loginStudent: async function(name, passcode) {
        try {
            const snapshot = await studentsCollection.where('name', '==', name).where('passcode', '==', passcode).get();

            if (!snapshot.empty) {
                const student = snapshot.docs[0].data();

                // Update last login time
                await studentsCollection.doc(student.id).update({
                    lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Store student info in local storage for session
                localStorage.setItem('student_id', student.id);
                localStorage.setItem('student_name', student.name);

                return { success: true, data: student };
            } else {
                return { success: false, error: "Invalid name or passcode" };
            }
        } catch (error) {
            console.error("Error logging in student:", error);
            return { success: false, error: error.message };
        }
    },

    getStudent: async function(studentId) {
        try {
            const doc = await studentsCollection.doc(studentId).get();
            if (doc.exists) {
                return { success: true, data: doc.data() };
            } else {
                return { success: false, error: "Student not found" };
            }
        } catch (error) {
            console.error("Error getting student:", error);
            return { success: false, error: error.message };
        }
    },

    assignStudentToSection: async function(studentId, sectionId) {
        try {
            // Check if section exists
            const sectionResult = await this.getSection(sectionId);
            if (!sectionResult.success) {
                return { success: false, error: "Section not found" };
            }

            // Update student document
            await studentsCollection.doc(studentId).update({
                sectionId: sectionId
            });

            // Get updated student data
            const studentResult = await this.getStudent(studentId);
            return studentResult;
        } catch (error) {
            console.error("Error assigning student to section:", error);
            return { success: false, error: error.message };
        }
    },

    getStudentsInSection: async function(sectionId) {
        try {
            const snapshot = await studentsCollection.where('sectionId', '==', sectionId).get();
            const students = [];
            snapshot.forEach(doc => {
                students.push(doc.data());
            });
            return { success: true, data: students };
        } catch (error) {
            console.error("Error getting students in section:", error);
            return { success: false, error: error.message };
        }
    },

    getAllStudents: async function() {
        try {
            const snapshot = await studentsCollection.get();
            const students = [];
            snapshot.forEach(doc => {
                students.push(doc.data());
            });
            return { success: true, data: students };
        } catch (error) {
            console.error("Error getting all students:", error);
            return { success: false, error: error.message };
        }
    },

    // Game Score Management
    saveGameScore: async function(studentId, studentName, gameType, finalPortfolio, taName = null, isClassGame = false) {
        try {
            // Add a flag to distinguish between single player and class games
            const gameMode = isClassGame ? 'class' : 'single';

            // First, check if the student already has a score for this game type and mode
            const existingScoresSnapshot = await gameScoresCollection
                .where('studentId', '==', studentId)
                .where('gameType', '==', gameType)
                .where('gameMode', '==', gameMode)
                .get();

            let existingHighScore = 0;
            let existingScoreId = null;

            existingScoresSnapshot.forEach(doc => {
                const scoreData = doc.data();
                if (scoreData.finalPortfolio > existingHighScore) {
                    existingHighScore = scoreData.finalPortfolio;
                    existingScoreId = doc.id;
                }
            });

            // Only save if this score is higher than the existing one or there is no existing score
            if (finalPortfolio > existingHighScore || !existingScoreId) {
                // Generate a unique ID for the score that's consistent for the student and game type
                const scoreId = `${studentId}_${gameType}_${gameMode}`;

                // Create or update score document
                await gameScoresCollection.doc(scoreId).set({
                    id: scoreId,
                    studentId: studentId,
                    studentName: studentName,
                    gameType: gameType,
                    gameMode: gameMode,
                    finalPortfolio: finalPortfolio,
                    taName: taName,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });

                console.log(`New high score saved: ${finalPortfolio} (previous: ${existingHighScore})`);
                return { success: true, data: { id: scoreId, isNewHighScore: true } };
            } else {
                console.log(`Score not saved as it's not a new high score: ${finalPortfolio} (current high: ${existingHighScore})`);
                return { success: true, data: { id: existingScoreId, isNewHighScore: false } };
            }
        } catch (error) {
            console.error("Error saving game score:", error);
            return { success: false, error: error.message };
        }
    },

    getGameLeaderboard: async function(gameType, options = {}) {
        try {
            // First, get all scores for this game type without ordering
            // This avoids needing a composite index
            let baseQuery = gameScoresCollection.where('gameType', '==', gameType);

            // Default to single player mode unless specified
            const gameMode = options.gameMode || 'single';
            baseQuery = baseQuery.where('gameMode', '==', gameMode);

            // Apply filters that don't require composite indexes
            if (options.taName) {
                baseQuery = baseQuery.where('taName', '==', options.taName);
            }

            if (options.studentId) {
                baseQuery = baseQuery.where('studentId', '==', options.studentId);
            }

            // Get all matching documents
            const allScoresSnapshot = await baseQuery.get();

            // Process results in memory
            let allScores = [];
            allScoresSnapshot.forEach(doc => {
                allScores.push(doc.data());
            });

            // Apply date filter in memory if needed
            if (options.startDate) {
                const startDateMs = options.startDate instanceof Date ? options.startDate.getTime() :
                                   (options.startDate.seconds ? options.startDate.seconds * 1000 : 0);
                allScores = allScores.filter(score => {
                    const scoreDate = score.timestamp ? score.timestamp.seconds * 1000 : 0;
                    return scoreDate >= startDateMs;
                });
            }

            // Since we're now storing only one score per student (the highest),
            // we don't need to filter for unique students, but we'll keep the sorting

            // Sort by final portfolio value (descending)
            allScores.sort((a, b) => {
                const portfolioA = a.finalPortfolio || 0;
                const portfolioB = b.finalPortfolio || 0;
                return portfolioB - portfolioA; // Descending order
            });

            // Get total count
            const totalScores = allScores.length;

            // Apply pagination in memory
            const page = options.page || 1;
            const pageSize = options.pageSize || 10;
            const startIndex = (page - 1) * pageSize;
            const endIndex = Math.min(startIndex + pageSize, allScores.length);

            // Get the scores for the current page
            const scores = allScores.slice(startIndex, endIndex);

            return { success: true, data: { scores, totalScores } };
        } catch (error) {
            console.error("Error getting game leaderboard:", error);
            return { success: false, error: error.message };
        }
    },

    getStudentGameScores: async function(studentId, gameType, gameMode = 'single') {
        try {
            // First, get all scores for this student and game type without ordering
            // This avoids needing a composite index
            const snapshot = await gameScoresCollection
                .where('studentId', '==', studentId)
                .where('gameType', '==', gameType)
                .where('gameMode', '==', gameMode)
                .get();

            // Then sort the results in memory
            const scores = [];
            snapshot.forEach(doc => {
                scores.push(doc.data());
            });

            // Sort by timestamp descending
            scores.sort((a, b) => {
                const timestampA = a.timestamp ? new Date(a.timestamp.seconds * 1000) : new Date(0);
                const timestampB = b.timestamp ? new Date(b.timestamp.seconds * 1000) : new Date(0);
                return timestampB - timestampA; // Descending order
            });

            return { success: true, data: scores };
        } catch (error) {
            console.error("Error getting student game scores:", error);
            return { success: false, error: error.message };
        }
    },

    getStudentGameRank: async function(studentId, gameType, gameMode = 'single') {
        try {
            // Get student's best score
            const scoresResult = await this.getStudentGameScores(studentId, gameType, gameMode);

            if (!scoresResult.success || scoresResult.data.length === 0) {
                return { success: false, error: "No scores found for student" };
            }

            // Find best score
            const bestScore = scoresResult.data.reduce((best, score) => {
                return score.finalPortfolio > best.finalPortfolio ? score : best;
            }, scoresResult.data[0]);

            // Count how many scores are higher than this one
            const snapshot = await gameScoresCollection
                .where('gameType', '==', gameType)
                .where('gameMode', '==', gameMode)
                .where('finalPortfolio', '>', bestScore.finalPortfolio)
                .get();

            // Rank is number of higher scores + 1
            const rank = snapshot.size + 1;

            return { success: true, data: rank };
        } catch (error) {
            console.error("Error getting student game rank:", error);
            return { success: false, error: error.message };
        }
    },

    // Class Game Management
    createClassGame: async function(sectionId, taName, day, time) {
        try {
            // Generate a unique ID for the game session
            const gameId = `${sectionId}_${Date.now()}`;

            // Create game session document
            await gameSessionsCollection.doc(gameId).set({
                id: gameId,
                sectionId: sectionId,
                taName: taName,
                day: day,
                time: time,
                currentRound: 0,
                maxRounds: 20,
                playerCount: 0,
                status: 'active',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return { success: true, data: {
                id: gameId,
                sectionId: sectionId,
                taName: taName,
                day: day,
                time: time,
                currentRound: 0,
                maxRounds: 20,
                playerCount: 0,
                status: 'active'
            }};
        } catch (error) {
            console.error("Error creating class game:", error);
            return { success: false, error: error.message };
        }
    },

    getClassGame: async function(gameId) {
        try {
            const doc = await gameSessionsCollection.doc(gameId).get();

            if (doc.exists) {
                return { success: true, data: doc.data() };
            } else {
                return { success: false, error: "Game session not found" };
            }
        } catch (error) {
            console.error("Error getting class game:", error);
            return { success: false, error: error.message };
        }
    },

    getActiveClassGame: async function(sectionId) {
        try {
            const snapshot = await gameSessionsCollection
                .where('sectionId', '==', sectionId)
                .where('status', '==', 'active')
                .get();

            if (!snapshot.empty) {
                return { success: true, data: snapshot.docs[0].data() };
            } else {
                return { success: false, error: "No active game found for section" };
            }
        } catch (error) {
            console.error("Error getting active class game:", error);
            return { success: false, error: error.message };
        }
    },

    getActiveClassGamesByTA: async function(taName) {
        try {
            const snapshot = await gameSessionsCollection
                .where('taName', '==', taName)
                .where('status', '==', 'active')
                .get();

            const games = [];
            snapshot.forEach(doc => {
                games.push(doc.data());
            });

            return { success: true, data: games };
        } catch (error) {
            console.error("Error getting active class games by TA:", error);
            return { success: false, error: error.message };
        }
    },

    advanceClassGameRound: async function(gameId) {
        try {
            console.log('Starting advanceClassGameRound for game:', gameId);

            // Get current game state
            const gameResult = await this.getClassGame(gameId);

            if (!gameResult.success) {
                console.error('Failed to get game:', gameResult.error);
                return gameResult;
            }

            const game = gameResult.data;
            console.log('Current game state:', game);

            // Check if game is already complete
            if (game.currentRound >= game.maxRounds) {
                console.error('Game is already complete');
                return { success: false, error: "Game is already complete" };
            }

            // Increment round
            const newRound = game.currentRound + 1;
            console.log(`Advancing to round ${newRound}`);

            // Define standard initial prices - must match across the application
            const initialPrices = {
                'S&P 500': 100,
                'Bonds': 100,
                'Real Estate': 5000,
                'Gold': 3000,
                'Commodities': 100,
                'Bitcoin': 50000
            };

            // Create a default game state for the TA to see
            // This ensures there's always at least one game state for the TA to display
            let defaultGameState = {
                assetPrices: {},
                priceHistory: {},
                CPI: 100,
                CPIHistory: [100],
                lastCashInjection: 0,
                totalCashInjected: 0,
                roundNumber: newRound // Add round number to game state for easier reference
            };

            // Initialize price history if needed
            for (const asset in initialPrices) {
                if (!defaultGameState.priceHistory[asset]) {
                    defaultGameState.priceHistory[asset] = [];
                }
            }

            // Get previous round data - for ALL rounds including round 1
            try {
                console.log(`Fetching previous round data for round ${newRound-1}`);

                // Get the TA's game state from the previous round
                const prevStatesSnapshot = await gameStatesCollection
                    .where('gameId', '==', gameId)
                    .where('roundNumber', '==', newRound - 1)
                    .where('studentId', '==', 'TA_DEFAULT') // Specifically get the TA's state
                    .limit(1)
                    .get();

                if (!prevStatesSnapshot.empty) {
                    console.log('Found previous round data');
                    const prevState = prevStatesSnapshot.docs[0].data().gameState;

                    // For round 1, we need to ensure we have the initial prices in the history
                    if (newRound === 1) {
                        console.log('Setting up initial price history for round 1');
                        // Initialize price history with initial prices
                        for (const asset in initialPrices) {
                            defaultGameState.priceHistory[asset] = [initialPrices[asset]];
                        }
                    } else {
                        // For rounds 2+, use the previous round's price history
                        console.log('Using previous round price history');
                        defaultGameState.priceHistory = JSON.parse(JSON.stringify(prevState.priceHistory || {}));

                        // Ensure CPI history is properly initialized
                        defaultGameState.CPIHistory = Array.isArray(prevState.CPIHistory || prevState.cpiHistory) ?
                            [...(prevState.CPIHistory || prevState.cpiHistory)] : [100];
                    }

                    // Update price history with previous prices for all rounds
                    for (const asset in prevState.assetPrices) {
                        const prevPrice = prevState.assetPrices[asset];

                        // Add previous price to history if it's not already there
                        if (!defaultGameState.priceHistory[asset].includes(prevPrice)) {
                            defaultGameState.priceHistory[asset].push(prevPrice);
                        }

                        // Generate new price based on previous price
                        let percentChange = 0;

                        // Different volatility for different assets
                        switch(asset) {
                            case 'S&P 500':
                                percentChange = Math.random() * 0.13 - 0.05; // -5% to +8%
                                break;
                            case 'Bonds':
                                percentChange = Math.random() * 0.07 - 0.03; // -3% to +4%
                                break;
                            case 'Real Estate':
                                percentChange = Math.random() * 0.16 - 0.07; // -7% to +9%
                                break;
                            case 'Gold':
                                percentChange = Math.random() * 0.13 - 0.06; // -6% to +7%
                                break;
                            case 'Commodities':
                                percentChange = Math.random() * 0.18 - 0.08; // -8% to +10%
                                break;
                            case 'Bitcoin':
                                percentChange = Math.random() * 0.35 - 0.15; // -15% to +20%
                                break;
                            default:
                                percentChange = Math.random() * 0.1 - 0.05; // -5% to +5%
                        }

                        // Calculate new price and ensure it's not negative or too small
                        const newPrice = prevPrice * (1 + percentChange);
                        const minPrice = asset === 'Bitcoin' ? 1000 : 10;
                        defaultGameState.assetPrices[asset] = Math.max(newPrice, minPrice);

                        console.log(`${asset}: ${prevPrice} -> ${defaultGameState.assetPrices[asset]} (${(percentChange*100).toFixed(2)}%)`);
                    }

                    // Update CPI
                    const cpiChange = Math.random() * 0.04 - 0.01; // -1% to +3%
                    const prevCPI = prevState.CPI || prevState.cpi || 100;
                    defaultGameState.CPI = prevCPI * (1 + cpiChange);
                    defaultGameState.CPIHistory.push(prevCPI);
                    console.log(`CPI: ${prevCPI} -> ${defaultGameState.CPI} (${(cpiChange*100).toFixed(2)}%)`);
                } else {
                    console.log('No previous round data found, using initial values');
                    // If no previous state found, use initial values
                    for (const asset in initialPrices) {
                        // For round 1, generate prices based on initial values
                        if (newRound === 1) {
                            let percentChange = 0;
                            // Different volatility for different assets
                            switch(asset) {
                                case 'S&P 500':
                                    percentChange = Math.random() * 0.13 - 0.05; // -5% to +8%
                                    break;
                                case 'Bonds':
                                    percentChange = Math.random() * 0.07 - 0.03; // -3% to +4%
                                    break;
                                case 'Real Estate':
                                    percentChange = Math.random() * 0.16 - 0.07; // -7% to +9%
                                    break;
                                case 'Gold':
                                    percentChange = Math.random() * 0.13 - 0.06; // -6% to +7%
                                    break;
                                case 'Commodities':
                                    percentChange = Math.random() * 0.18 - 0.08; // -8% to +10%
                                    break;
                                case 'Bitcoin':
                                    percentChange = Math.random() * 0.35 - 0.15; // -15% to +20%
                                    break;
                                default:
                                    percentChange = Math.random() * 0.1 - 0.05; // -5% to +5%
                            }

                            // Calculate new price based on initial price
                            const initialPrice = initialPrices[asset];
                            const newPrice = initialPrice * (1 + percentChange);
                            const minPrice = asset === 'Bitcoin' ? 1000 : 10;
                            defaultGameState.assetPrices[asset] = Math.max(newPrice, minPrice);

                            // Initialize price history with initial price
                            defaultGameState.priceHistory[asset] = [initialPrice];

                            console.log(`${asset} (initial): ${initialPrice} -> ${defaultGameState.assetPrices[asset]} (${(percentChange*100).toFixed(2)}%)`);
                        } else {
                            // For other rounds, this is a fallback - should not normally happen
                            defaultGameState.assetPrices[asset] = initialPrices[asset];
                            defaultGameState.priceHistory[asset] = [initialPrices[asset]];
                            console.warn(`Using fallback initial price for ${asset} in round ${newRound}`);
                        }
                    }
                }
            } catch (error) {
                console.error('Error getting previous round data:', error);
                // Fallback to initial prices if there's an error
                for (const asset in initialPrices) {
                    defaultGameState.assetPrices[asset] = initialPrices[asset];
                    defaultGameState.priceHistory[asset] = [initialPrices[asset]];
                }
            }

            // Update game session first
            console.log('Updating game session with new round:', newRound);
            await gameSessionsCollection.doc(gameId).update({
                currentRound: newRound,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // If this was the last round, mark game as complete
            if (newRound >= game.maxRounds) {
                console.log('This is the last round, marking game as complete');
                await gameSessionsCollection.doc(gameId).update({
                    status: 'completed'
                });
            }

            // Create a unique ID for the market data to ensure consistency
            const marketDataId = `${gameId}_market_${newRound}`;

            // Save the market data with a consistent ID
            console.log('Saving market data with ID:', marketDataId);
            await gameStatesCollection.doc(marketDataId).set({
                id: marketDataId,
                gameId: gameId,
                roundNumber: newRound,
                assetPrices: defaultGameState.assetPrices,
                CPI: defaultGameState.CPI,
                lastCashInjection: defaultGameState.lastCashInjection,
                totalCashInjected: defaultGameState.totalCashInjected,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Also save the TA game state for backward compatibility
            const taGameStateId = `${gameId}_TA_DEFAULT_${newRound}`;
            console.log('Saving TA game state with ID:', taGameStateId);
            await gameStatesCollection.doc(taGameStateId).set({
                id: taGameStateId,
                gameId: gameId,
                studentId: 'TA_DEFAULT',
                studentName: 'TA Default',
                roundNumber: newRound,
                gameState: defaultGameState,
                playerState: {
                    cash: 10000,
                    portfolio: {},
                    tradeHistory: [],
                    portfolioValueHistory: [10000]
                },
                portfolioValue: 10000,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log('Round advancement complete');

            // Return updated game data
            return { success: true, data: {
                ...game,
                currentRound: newRound,
                status: newRound >= game.maxRounds ? 'completed' : 'active'
            }};
        } catch (error) {
            console.error("Error advancing class game round:", error);
            return { success: false, error: error.message };
        }
    },

    endClassGame: async function(gameId) {
        try {
            // Update game session
            await gameSessionsCollection.doc(gameId).update({
                status: 'completed',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Clean up old game states
            await this.cleanupGameStates(gameId);

            return { success: true };
        } catch (error) {
            console.error("Error ending class game:", error);
            return { success: false, error: error.message };
        }
    },

    cleanupGameStates: async function(gameId) {
        try {
            console.log('Cleaning up game states for game:', gameId);

            // Get all game states for this game
            const snapshot = await gameStatesCollection
                .where('gameId', '==', gameId)
                .get();

            if (snapshot.empty) {
                console.log('No game states to clean up');
                return { success: true };
            }

            console.log(`Found ${snapshot.size} game states to process`);

            // Get all market data documents
            const marketDataDocs = [];
            const taGameStateDocs = [];
            const playerStateDocs = [];
            const oldPlayerStateDocs = [];

            snapshot.forEach(doc => {
                const id = doc.id;

                // Identify document type by ID pattern
                if (id.includes('_market_')) {
                    marketDataDocs.push(doc.ref);
                } else if (id.includes('_TA_DEFAULT_')) {
                    taGameStateDocs.push(doc.ref);
                } else if (id.includes('_player')) {
                    playerStateDocs.push(doc.ref);
                } else {
                    // This is an old-style player state document
                    oldPlayerStateDocs.push(doc.ref);
                }
            });

            console.log(`Found ${marketDataDocs.length} market data docs, ${taGameStateDocs.length} TA game state docs, ${playerStateDocs.length} player state docs, and ${oldPlayerStateDocs.length} old player state docs`);

            // We'll keep all market data and player state docs, but we can delete old-style player state docs
            // since they're redundant with the new format
            if (oldPlayerStateDocs.length > 0) {
                console.log(`Deleting ${oldPlayerStateDocs.length} old player state documents`);

                // Delete in batches of 500 (Firestore limit)
                const batchSize = 500;
                for (let i = 0; i < oldPlayerStateDocs.length; i += batchSize) {
                    const batch = db.batch();
                    const docsToDelete = oldPlayerStateDocs.slice(i, i + batchSize);

                    docsToDelete.forEach(docRef => {
                        batch.delete(docRef);
                    });

                    await batch.commit();
                    console.log(`Deleted batch of ${docsToDelete.length} documents`);
                }
            }

            return { success: true };
        } catch (error) {
            console.error('Error cleaning up game states:', error);
            return { success: false, error: error.message };
        }
    },

    joinClassGame: async function(gameId, studentId, studentName) {
        try {
            // Generate a unique ID for the participant
            const participantId = `${gameId}_${studentId}`;

            // Create participant document
            await gameParticipantsCollection.doc(participantId).set({
                id: participantId,
                gameId: gameId,
                studentId: studentId,
                studentName: studentName,
                portfolioValue: 10000, // Starting value
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                joinedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Increment player count in game session
            const gameRef = gameSessionsCollection.doc(gameId);
            await firebase.firestore().runTransaction(async (transaction) => {
                const gameDoc = await transaction.get(gameRef);
                if (!gameDoc.exists) {
                    throw new Error("Game session does not exist");
                }

                const playerCount = gameDoc.data().playerCount || 0;
                transaction.update(gameRef, { playerCount: playerCount + 1 });
            });

            return { success: true };
        } catch (error) {
            console.error("Error joining class game:", error);
            return { success: false, error: error.message };
        }
    },

    getGameParticipant: async function(gameId, studentId) {
        try {
            const participantId = `${gameId}_${studentId}`;
            const doc = await gameParticipantsCollection.doc(participantId).get();

            if (doc.exists) {
                return { success: true, data: doc.data() };
            } else {
                return { success: false, error: "Participant not found" };
            }
        } catch (error) {
            console.error("Error getting game participant:", error);
            return { success: false, error: error.message };
        }
    },

    saveGameState: async function(gameId, studentId, studentName, gameState, playerState, portfolioValue) {
        try {
            // First, check if this is a TA game state (used for market data)
            const isTA = studentId === 'TA_DEFAULT';

            if (isTA) {
                // For TA game states, we only need to store market data (asset prices, CPI)
                // This is shared data that all students will reference
                const marketDataId = `${gameId}_market_${gameState.roundNumber}`;

                // Store only the essential market data
                await gameStatesCollection.doc(marketDataId).set({
                    id: marketDataId,
                    gameId: gameId,
                    roundNumber: gameState.roundNumber,
                    assetPrices: gameState.assetPrices,
                    CPI: gameState.CPI,
                    lastCashInjection: gameState.lastCashInjection,
                    totalCashInjected: gameState.totalCashInjected,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Also store the TA game state for backward compatibility
                const taStateId = `${gameId}_TA_DEFAULT_${gameState.roundNumber}`;
                await gameStatesCollection.doc(taStateId).set({
                    id: taStateId,
                    gameId: gameId,
                    studentId: studentId,
                    roundNumber: gameState.roundNumber,
                    gameState: gameState,
                    playerState: playerState,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            } else {
                // For student game states, we only need to store their portfolio and trades
                // Generate a unique ID for the player state
                const playerStateId = `${gameId}_${studentId}_player`;

                // Store only the current player state (not the full history)
                await gameStatesCollection.doc(playerStateId).set({
                    id: playerStateId,
                    gameId: gameId,
                    studentId: studentId,
                    studentName: studentName,
                    currentRound: gameState.roundNumber,
                    cash: playerState.cash,
                    portfolio: playerState.portfolio,
                    // Store only the last trade if there are any
                    lastTrade: playerState.tradeHistory.length > 0 ?
                        playerState.tradeHistory[playerState.tradeHistory.length - 1] : null,
                    portfolioValue: portfolioValue,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Store the trade if one was made this round
                if (playerState.tradeHistory.length > 0) {
                    const lastTrade = playerState.tradeHistory[playerState.tradeHistory.length - 1];
                    if (lastTrade.round === gameState.roundNumber) {
                        const tradeId = `${gameId}_${studentId}_trade_${gameState.roundNumber}_${Date.now()}`;
                        await firebase.firestore().collection('game_trades').doc(tradeId).set({
                            id: tradeId,
                            gameId: gameId,
                            studentId: studentId,
                            roundNumber: gameState.roundNumber,
                            trade: lastTrade,
                            timestamp: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    }
                }
            }

            // Always update participant's portfolio value
            const participantId = `${gameId}_${studentId}`;
            await gameParticipantsCollection.doc(participantId).update({
                portfolioValue: portfolioValue,
                currentRound: gameState.roundNumber,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });

            return { success: true };
        } catch (error) {
            console.error("Error saving game state:", error);
            return { success: false, error: error.message };
        }
    },

    getGameState: async function(gameId, studentId, roundNumber = null) {
        try {
            // If this is a TA request or we need market data
            if (studentId === 'TA_DEFAULT' || roundNumber !== null) {
                // First try to get the market data for the specified round
                const marketRound = roundNumber !== null ? roundNumber :
                    (await gameSessionsCollection.doc(gameId).get()).data().currentRound;

                const marketDataId = `${gameId}_market_${marketRound}`;
                const marketDoc = await gameStatesCollection.doc(marketDataId).get();

                // If market data exists, use it
                if (marketDoc.exists) {
                    const marketData = marketDoc.data();

                    // If this is a TA request, just return the market data
                    if (studentId === 'TA_DEFAULT') {
                        // Format it to match the expected structure
                        const gameState = {
                            roundNumber: marketData.roundNumber,
                            assetPrices: marketData.assetPrices,
                            CPI: marketData.CPI,
                            lastCashInjection: marketData.lastCashInjection,
                            totalCashInjected: marketData.totalCashInjected
                        };

                        return {
                            success: true,
                            data: {
                                gameState: gameState,
                                playerState: {
                                    cash: 10000,
                                    portfolio: {},
                                    tradeHistory: []
                                }
                            }
                        };
                    }

                    // For student requests, combine market data with player data
                    const playerStateId = `${gameId}_${studentId}_player`;
                    const playerDoc = await gameStatesCollection.doc(playerStateId).get();

                    if (playerDoc.exists) {
                        const playerData = playerDoc.data();

                        // Get trade history
                        const tradesSnapshot = await firebase.firestore()
                            .collection('game_trades')
                            .where('gameId', '==', gameId)
                            .where('studentId', '==', studentId)
                            .orderBy('roundNumber')
                            .get();

                        const tradeHistory = [];
                        tradesSnapshot.forEach(doc => {
                            tradeHistory.push(doc.data().trade);
                        });

                        // Construct the response
                        return {
                            success: true,
                            data: {
                                id: `${gameId}_${studentId}_${marketRound}`,
                                gameId: gameId,
                                studentId: studentId,
                                roundNumber: marketRound,
                                gameState: {
                                    roundNumber: marketRound,
                                    assetPrices: marketData.assetPrices,
                                    CPI: marketData.CPI,
                                    lastCashInjection: marketData.lastCashInjection,
                                    totalCashInjected: marketData.totalCashInjected
                                },
                                playerState: {
                                    cash: playerData.cash,
                                    portfolio: playerData.portfolio,
                                    tradeHistory: tradeHistory
                                }
                            }
                        };
                    }
                }

                // Fallback to the old method if market data doesn't exist
                let query = gameStatesCollection
                    .where('gameId', '==', gameId)
                    .where('studentId', '==', studentId);

                if (roundNumber !== null) {
                    query = query.where('roundNumber', '==', roundNumber);
                } else {
                    query = query.orderBy('roundNumber', 'desc').limit(1);
                }

                const snapshot = await query.get();

                if (!snapshot.empty) {
                    return { success: true, data: snapshot.docs[0].data() };
                }
            } else {
                // For student requests without a specific round, get their latest state
                const playerStateId = `${gameId}_${studentId}_player`;
                const playerDoc = await gameStatesCollection.doc(playerStateId).get();

                if (playerDoc.exists) {
                    const playerData = playerDoc.data();
                    const currentRound = playerData.currentRound || 0;

                    // Get the market data for the current round
                    const marketDataId = `${gameId}_market_${currentRound}`;
                    const marketDoc = await gameStatesCollection.doc(marketDataId).get();

                    if (marketDoc.exists) {
                        const marketData = marketDoc.data();

                        // Get trade history
                        const tradesSnapshot = await firebase.firestore()
                            .collection('game_trades')
                            .where('gameId', '==', gameId)
                            .where('studentId', '==', studentId)
                            .orderBy('roundNumber')
                            .get();

                        const tradeHistory = [];
                        tradesSnapshot.forEach(doc => {
                            tradeHistory.push(doc.data().trade);
                        });

                        // Construct the response
                        return {
                            success: true,
                            data: {
                                id: `${gameId}_${studentId}_${currentRound}`,
                                gameId: gameId,
                                studentId: studentId,
                                roundNumber: currentRound,
                                gameState: {
                                    roundNumber: currentRound,
                                    assetPrices: marketData.assetPrices,
                                    CPI: marketData.CPI,
                                    lastCashInjection: marketData.lastCashInjection,
                                    totalCashInjected: marketData.totalCashInjected
                                },
                                playerState: {
                                    cash: playerData.cash,
                                    portfolio: playerData.portfolio,
                                    tradeHistory: tradeHistory
                                }
                            }
                        };
                    }
                }

                // Fallback to the old method
                const snapshot = await gameStatesCollection
                    .where('gameId', '==', gameId)
                    .where('studentId', '==', studentId)
                    .orderBy('roundNumber', 'desc')
                    .limit(1)
                    .get();

                if (!snapshot.empty) {
                    return { success: true, data: snapshot.docs[0].data() };
                }
            }

            return { success: false, error: "Game state not found" };
        } catch (error) {
            console.error("Error getting game state:", error);
            return { success: false, error: error.message };
        }
    }
};

// Select the appropriate service based on Firebase availability
const Service = usingFirebase ? FirebaseService : LocalStorageService;

// Make Service available globally
window.Service = Service;

// Display a message about which service is being used
console.log(`Using ${usingFirebase ? 'Firebase' : 'localStorage'} for TA sections data storage.`);
console.log('Service object initialized with methods:', Object.keys(Service));

// Verify that critical methods exist
if (typeof Service.registerStudent !== 'function' || typeof Service.loginStudent !== 'function') {
    console.error('Critical authentication methods are missing from Service object!');
}

if (!usingFirebase) {
    console.log('To use Firebase, please set up your own Firebase project.');
}
