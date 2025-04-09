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
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
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
    saveGameScore: async function(studentId, studentName, gameType, finalPortfolio, taName = null) {
        try {
            // Generate a unique ID for the score
            const scoreId = `${studentId}_${gameType}_${Date.now()}`;

            // Create score document
            await gameScoresCollection.doc(scoreId).set({
                id: scoreId,
                studentId: studentId,
                studentName: studentName,
                gameType: gameType,
                finalPortfolio: finalPortfolio,
                taName: taName,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            return { success: true, data: { id: scoreId } };
        } catch (error) {
            console.error("Error saving game score:", error);
            return { success: false, error: error.message };
        }
    },

    getGameLeaderboard: async function(gameType, options = {}) {
        try {
            let query = gameScoresCollection.where('gameType', '==', gameType);

            // Apply filters
            if (options.startDate) {
                query = query.where('timestamp', '>=', options.startDate);
            }

            if (options.taName) {
                query = query.where('taName', '==', options.taName);
            }

            if (options.studentId) {
                query = query.where('studentId', '==', options.studentId);
            }

            // Get total count first
            const countSnapshot = await query.get();
            const totalScores = countSnapshot.size;

            // Apply pagination
            const page = options.page || 1;
            const pageSize = options.pageSize || 10;
            const startIndex = (page - 1) * pageSize;

            // Order by final portfolio (descending)
            query = query.orderBy('finalPortfolio', 'desc');

            // Apply limit
            if (startIndex > 0) {
                // Get the document at the start index
                const snapshot = await query.limit(startIndex).get();
                const lastDoc = snapshot.docs[snapshot.docs.length - 1];

                // Start after the last document
                query = query.startAfter(lastDoc);
            }

            query = query.limit(pageSize);

            // Execute query
            const snapshot = await query.get();
            const scores = [];

            snapshot.forEach(doc => {
                scores.push(doc.data());
            });

            return { success: true, data: { scores, totalScores } };
        } catch (error) {
            console.error("Error getting game leaderboard:", error);
            return { success: false, error: error.message };
        }
    },

    getStudentGameScores: async function(studentId, gameType) {
        try {
            const snapshot = await gameScoresCollection
                .where('studentId', '==', studentId)
                .where('gameType', '==', gameType)
                .orderBy('timestamp', 'desc')
                .get();

            const scores = [];
            snapshot.forEach(doc => {
                scores.push(doc.data());
            });

            return { success: true, data: scores };
        } catch (error) {
            console.error("Error getting student game scores:", error);
            return { success: false, error: error.message };
        }
    },

    getStudentGameRank: async function(studentId, gameType) {
        try {
            // Get student's best score
            const scoresResult = await this.getStudentGameScores(studentId, gameType);

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
            // Get current game state
            const gameResult = await this.getClassGame(gameId);

            if (!gameResult.success) {
                return gameResult;
            }

            const game = gameResult.data;

            // Check if game is already complete
            if (game.currentRound >= game.maxRounds) {
                return { success: false, error: "Game is already complete" };
            }

            // Increment round
            const newRound = game.currentRound + 1;

            // Update game session
            await gameSessionsCollection.doc(gameId).update({
                currentRound: newRound,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // If this was the last round, mark game as complete
            if (newRound >= game.maxRounds) {
                await gameSessionsCollection.doc(gameId).update({
                    status: 'completed'
                });
            }

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

            return { success: true };
        } catch (error) {
            console.error("Error ending class game:", error);
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
            // Generate a unique ID for the game state
            const stateId = `${gameId}_${studentId}_${gameState.roundNumber}`;

            // Create game state document
            await gameStatesCollection.doc(stateId).set({
                id: stateId,
                gameId: gameId,
                studentId: studentId,
                roundNumber: gameState.roundNumber,
                gameState: gameState,
                playerState: playerState,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Update participant's portfolio value
            const participantId = `${gameId}_${studentId}`;
            await gameParticipantsCollection.doc(participantId).update({
                portfolioValue: portfolioValue,
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
            } else {
                return { success: false, error: "Game state not found" };
            }
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
if (!usingFirebase) {
    console.log('To use Firebase, please set up your own Firebase project.');
}
