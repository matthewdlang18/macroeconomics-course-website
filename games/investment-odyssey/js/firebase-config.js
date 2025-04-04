// Firebase Configuration for Investment Odyssey Game

// Initialize Firebase if not already initialized
if (typeof firebase === 'undefined') {
    console.error('Firebase SDK not loaded');
} else if (!firebase.apps.length) {
    // Use the config from the centralized firebase-config.js if available
    if (typeof firebaseConfig !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
    } else {
        console.error('Firebase configuration not found');
    }
}

// Get Firestore instance
const db = firebase.firestore();

// Collections
let classesCollection;
let studentsCollection;
let gameStatesCollection;
let leaderboardCollection;

// Check if Firebase is available
const usingFirebase = typeof firebase !== 'undefined' && firebase.apps.length > 0;

if (usingFirebase) {
    // Use the centralized collections from the new authentication system
    try {
        // Check if we can access the centralized collections
        if (typeof window.ClassService !== 'undefined') {
            console.log('Using centralized authentication system');
            // We'll use the centralized services directly
            classesCollection = db.collection('classes');
            studentsCollection = db.collection('students');
            gameStatesCollection = db.collection('investmentGameData');
            leaderboardCollection = db.collection('investmentGameData'); // Leaderboard is part of game data now
        } else {
            console.log('Centralized authentication system not available, using local collections');
            // Fallback to local collections
            classesCollection = db.collection('activity4a_classes');
            studentsCollection = db.collection('activity4a_students');
            gameStatesCollection = db.collection('activity4a_game_states');
            leaderboardCollection = db.collection('activity4a_leaderboard');
        }
    } catch (error) {
        console.warn('Error accessing centralized collections:', error);
        // Fallback to local collections
        classesCollection = db.collection('activity4a_classes');
        studentsCollection = db.collection('activity4a_students');
        gameStatesCollection = db.collection('activity4a_game_states');
        leaderboardCollection = db.collection('activity4a_leaderboard');
    }
}

// Firebase Service for Investment Odyssey
const FirebaseService = {
    // Check if Firebase is available
    isAvailable: function() {
        return usingFirebase;
    },

    // Get game state
    getGameState: async function(classNumber) {
        if (!usingFirebase) {
            return { success: false, error: 'Firebase not available' };
        }

        try {
            const snapshot = await gameStatesCollection.where('classNumber', '==', classNumber).get();
            
            if (snapshot.empty) {
                return { success: false, error: 'Game state not found' };
            }

            const gameState = snapshot.docs[0].data();
            return { success: true, data: gameState };
        } catch (error) {
            console.error('Error getting game state:', error);
            return { success: false, error: error.message };
        }
    },

    // Create game state
    createGameState: async function(classNumber, initialState) {
        if (!usingFirebase) {
            return { success: false, error: 'Firebase not available' };
        }

        try {
            // Check if game state already exists
            const snapshot = await gameStatesCollection.where('classNumber', '==', classNumber).get();
            
            if (!snapshot.empty) {
                return { success: false, error: 'Game state already exists' };
            }

            // Create new game state
            const gameStateRef = gameStatesCollection.doc();
            await gameStateRef.set({
                classNumber: classNumber,
                roundNumber: 0,
                assetPrices: initialState.assetPrices,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return { success: true, data: { id: gameStateRef.id } };
        } catch (error) {
            console.error('Error creating game state:', error);
            return { success: false, error: error.message };
        }
    },

    // Update game state
    updateGameState: async function(classNumber, newState) {
        if (!usingFirebase) {
            return { success: false, error: 'Firebase not available' };
        }

        try {
            const snapshot = await gameStatesCollection.where('classNumber', '==', classNumber).get();
            
            if (snapshot.empty) {
                return { success: false, error: 'Game state not found' };
            }

            const gameStateRef = snapshot.docs[0].ref;
            await gameStateRef.update({
                ...newState,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return { success: true };
        } catch (error) {
            console.error('Error updating game state:', error);
            return { success: false, error: error.message };
        }
    },

    // Get student data
    getStudentData: async function(studentId, classNumber) {
        if (!usingFirebase) {
            return { success: false, error: 'Firebase not available' };
        }

        try {
            const snapshot = await studentsCollection
                .where('studentId', '==', studentId)
                .where('classNumber', '==', classNumber)
                .get();
            
            if (snapshot.empty) {
                return { success: false, error: 'Student not found' };
            }

            const studentData = snapshot.docs[0].data();
            return { success: true, data: studentData };
        } catch (error) {
            console.error('Error getting student data:', error);
            return { success: false, error: error.message };
        }
    },

    // Register student
    registerStudent: async function(studentName, studentId, classNumber) {
        if (!usingFirebase) {
            return { success: false, error: 'Firebase not available' };
        }

        try {
            // Check if student already exists
            const snapshot = await studentsCollection
                .where('studentId', '==', studentId)
                .where('classNumber', '==', classNumber)
                .get();
            
            if (!snapshot.empty) {
                return { success: false, error: 'Student already registered' };
            }

            // Create new student
            const studentRef = studentsCollection.doc();
            await studentRef.set({
                name: studentName,
                studentId: studentId,
                classNumber: classNumber,
                cash: 10000, // Starting cash
                portfolio: {}, // Empty portfolio
                tradeHistory: [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return { success: true, data: { id: studentRef.id } };
        } catch (error) {
            console.error('Error registering student:', error);
            return { success: false, error: error.message };
        }
    },

    // Execute buy order
    executeBuy: async function(studentId, classNumber, asset, quantity, assetPrice, gameState) {
        if (!usingFirebase) {
            return { success: false, error: 'Firebase not available' };
        }

        try {
            // Get student data
            const snapshot = await studentsCollection
                .where('studentId', '==', studentId)
                .where('classNumber', '==', classNumber)
                .get();
            
            if (snapshot.empty) {
                return { success: false, error: 'Student not found' };
            }

            const studentDoc = snapshot.docs[0];
            const student = studentDoc.data();
            
            // Calculate cost
            const cost = quantity * assetPrice;
            
            // Check if student has enough cash
            if (student.cash < cost) {
                return { success: false, error: 'Insufficient funds' };
            }
            
            // Update portfolio
            const portfolio = student.portfolio || {};
            portfolio[asset] = (portfolio[asset] || 0) + quantity;
            
            // Update cash
            const newCash = student.cash - cost;
            
            // Add to trade history
            const tradeHistory = student.tradeHistory || [];
            tradeHistory.push({
                timestamp: new Date().toISOString(), // Use ISO string instead of serverTimestamp
                asset: asset,
                action: 'buy',
                quantity: quantity,
                price: assetPrice,
                totalValue: cost,
                roundNumber: gameState.roundNumber
            });
            
            // Update student document
            await studentsCollection.doc(studentDoc.id).update({
                cash: newCash,
                portfolio: portfolio,
                tradeHistory: tradeHistory
            });
            
            return { success: true, data: { newCash, portfolio } };
        } catch (error) {
            console.error('Error executing buy order:', error);
            return { success: false, error: error.message };
        }
    },

    // Execute sell order
    executeSell: async function(studentId, classNumber, asset, quantity, assetPrice, gameState) {
        if (!usingFirebase) {
            return { success: false, error: 'Firebase not available' };
        }

        try {
            // Get student data
            const snapshot = await studentsCollection
                .where('studentId', '==', studentId)
                .where('classNumber', '==', classNumber)
                .get();
            
            if (snapshot.empty) {
                return { success: false, error: 'Student not found' };
            }

            const studentDoc = snapshot.docs[0];
            const student = studentDoc.data();
            
            // Check if student has enough of the asset
            const portfolio = student.portfolio || {};
            if (!portfolio[asset] || portfolio[asset] < quantity) {
                return { success: false, error: 'Insufficient assets' };
            }
            
            // Calculate sale value
            const saleValue = quantity * assetPrice;
            
            // Update portfolio
            portfolio[asset] -= quantity;
            if (portfolio[asset] === 0) {
                delete portfolio[asset];
            }
            
            // Update cash
            const newCash = student.cash + saleValue;
            
            // Add to trade history
            const tradeHistory = student.tradeHistory || [];
            tradeHistory.push({
                timestamp: new Date().toISOString(), // Use ISO string instead of serverTimestamp
                asset: asset,
                action: 'sell',
                quantity: quantity,
                price: assetPrice,
                totalValue: saleValue,
                roundNumber: gameState.roundNumber
            });
            
            // Update student document
            await studentsCollection.doc(studentDoc.id).update({
                cash: newCash,
                portfolio: portfolio,
                tradeHistory: tradeHistory
            });
            
            return { success: true, data: { newCash, portfolio } };
        } catch (error) {
            console.error('Error executing sell order:', error);
            return { success: false, error: error.message };
        }
    },

    // Get all students for a class
    getStudents: async function(classNumber) {
        if (!usingFirebase) {
            return { success: false, error: 'Firebase not available' };
        }

        try {
            const snapshot = await studentsCollection
                .where('classNumber', '==', classNumber)
                .get();
            
            const students = snapshot.docs.map(doc => doc.data());
            return { success: true, data: students };
        } catch (error) {
            console.error('Error getting students:', error);
            return { success: false, error: error.message };
        }
    },

    // Update leaderboard
    updateLeaderboard: async function(classNumber, leaderboardData) {
        if (!usingFirebase) {
            return { success: false, error: 'Firebase not available' };
        }

        try {
            const snapshot = await leaderboardCollection
                .where('classNumber', '==', classNumber)
                .get();
            
            if (snapshot.empty) {
                // Create new leaderboard
                const leaderboardRef = leaderboardCollection.doc();
                await leaderboardRef.set({
                    classNumber: classNumber,
                    entries: leaderboardData,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            } else {
                // Update existing leaderboard
                const leaderboardRef = snapshot.docs[0].ref;
                await leaderboardRef.update({
                    entries: leaderboardData,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error updating leaderboard:', error);
            return { success: false, error: error.message };
        }
    },

    // Get leaderboard
    getLeaderboard: async function(classNumber) {
        if (!usingFirebase) {
            return { success: false, error: 'Firebase not available' };
        }

        try {
            const snapshot = await leaderboardCollection
                .where('classNumber', '==', classNumber)
                .get();
            
            if (snapshot.empty) {
                return { success: true, data: [] };
            }
            
            const leaderboardData = snapshot.docs[0].data();
            return { success: true, data: leaderboardData.entries || [] };
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            return { success: false, error: error.message };
        }
    }
};

// Export the service
window.FirebaseService = FirebaseService;
