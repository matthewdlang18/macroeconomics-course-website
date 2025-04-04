/**
 * data-service.js
 * Centralized data service for all games
 * This file should be loaded AFTER firebase-core.js
 */

// Ensure the EconGames namespace exists
window.EconGames = window.EconGames || {};

// Data Service
EconGames.DataService = {
    // Class Management
    Class: {
        // Create a new class (admin only)
        create: async function(className, instructor, classCode) {
            try {
                // Check if class code already exists
                const snapshot = await EconGames.collections.classes
                    .where('classCode', '==', classCode)
                    .get();
                
                if (!snapshot.empty) {
                    return { success: false, error: 'Class code already in use' };
                }
                
                // Create new class
                const classRef = EconGames.collections.classes.doc();
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
        get: async function(classId) {
            try {
                const classDoc = await EconGames.collections.classes.doc(classId).get();
                
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
        
        // Get all classes
        getAll: async function() {
            try {
                const snapshot = await EconGames.collections.classes.get();
                
                const classes = snapshot.docs.map(doc => ({
                    classId: doc.id,
                    ...doc.data()
                }));
                
                return { success: true, data: classes };
            } catch (error) {
                console.error('Error getting all classes:', error);
                return { success: false, error: error.message || 'Failed to get classes' };
            }
        },
        
        // Get students in a class
        getStudents: async function(classId) {
            try {
                const classDoc = await EconGames.collections.classes.doc(classId).get();
                
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
                    EconGames.collections.students.doc(studentId).get()
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
        },
        
        // Update class
        update: async function(classId, updates) {
            try {
                await EconGames.collections.classes.doc(classId).update({
                    ...updates,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                return { success: true };
            } catch (error) {
                console.error('Error updating class:', error);
                return { success: false, error: error.message || 'Failed to update class' };
            }
        }
    },
    
    // Game Data Management
    Game: {
        // Save game data for a student
        saveData: async function(gameType, studentId, classId, gameData) {
            try {
                const collection = gameType === 'fiscal' 
                    ? EconGames.collections.fiscalGameData 
                    : EconGames.collections.investmentGameData;
                
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
        getData: async function(gameType, studentId, classId) {
            try {
                const collection = gameType === 'fiscal' 
                    ? EconGames.collections.fiscalGameData 
                    : EconGames.collections.investmentGameData;
                
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
                const collection = gameType === 'fiscal' 
                    ? EconGames.collections.fiscalGameData 
                    : EconGames.collections.investmentGameData;
                
                const snapshot = await collection
                    .where('classId', '==', classId)
                    .get();
                
                if (snapshot.empty) {
                    return { success: true, data: [] };
                }
                
                // Get student names
                const studentIds = snapshot.docs.map(doc => doc.data().studentId);
                const studentPromises = studentIds.map(id => 
                    EconGames.collections.students.doc(id).get()
                );
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
        },
        
        // Reset game data for a class
        resetClassData: async function(gameType, classId) {
            try {
                const collection = gameType === 'fiscal' 
                    ? EconGames.collections.fiscalGameData 
                    : EconGames.collections.investmentGameData;
                
                const snapshot = await collection
                    .where('classId', '==', classId)
                    .get();
                
                if (snapshot.empty) {
                    return { success: true, message: 'No data to reset' };
                }
                
                // Delete all documents for this class
                const batch = EconGames.db.batch();
                snapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                
                await batch.commit();
                
                return { success: true, message: `Reset ${snapshot.size} student records` };
            } catch (error) {
                console.error('Error resetting class data:', error);
                return { success: false, error: error.message || 'Failed to reset class data' };
            }
        }
    },
    
    // Investment Game Specific Functions
    InvestmentGame: {
        // Execute buy order
        executeBuy: async function(studentId, classId, asset, quantity, assetPrice, gameState) {
            try {
                // Get student data
                const docId = `${studentId}_${classId || 'single'}`;
                const doc = await EconGames.collections.investmentGameData.doc(docId).get();
                
                if (!doc.exists) {
                    return { success: false, error: 'Student game data not found' };
                }
                
                const gameData = doc.data().gameData;
                
                // Calculate cost
                const cost = quantity * assetPrice;
                
                // Check if student has enough cash
                if (gameData.cash < cost) {
                    return { success: false, error: 'Insufficient funds' };
                }
                
                // Update portfolio
                const portfolio = gameData.portfolio || {};
                portfolio[asset] = (portfolio[asset] || 0) + quantity;
                
                // Update cash
                const newCash = gameData.cash - cost;
                
                // Add to trade history
                const tradeHistory = gameData.tradeHistory || [];
                tradeHistory.push({
                    timestamp: EconGames.utils.timestamp(),
                    asset: asset,
                    action: 'buy',
                    quantity: quantity,
                    price: assetPrice,
                    totalValue: cost,
                    roundNumber: gameState.roundNumber
                });
                
                // Update game data
                const updatedGameData = {
                    ...gameData,
                    cash: newCash,
                    portfolio: portfolio,
                    tradeHistory: tradeHistory
                };
                
                // Save updated game data
                await EconGames.collections.investmentGameData.doc(docId).update({
                    gameData: updatedGameData,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                return { success: true, data: { newCash, portfolio } };
            } catch (error) {
                console.error('Error executing buy order:', error);
                return { success: false, error: error.message || 'Failed to execute buy order' };
            }
        },
        
        // Execute sell order
        executeSell: async function(studentId, classId, asset, quantity, assetPrice, gameState) {
            try {
                // Get student data
                const docId = `${studentId}_${classId || 'single'}`;
                const doc = await EconGames.collections.investmentGameData.doc(docId).get();
                
                if (!doc.exists) {
                    return { success: false, error: 'Student game data not found' };
                }
                
                const gameData = doc.data().gameData;
                
                // Check if student has enough of the asset
                const portfolio = gameData.portfolio || {};
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
                const newCash = gameData.cash + saleValue;
                
                // Add to trade history
                const tradeHistory = gameData.tradeHistory || [];
                tradeHistory.push({
                    timestamp: EconGames.utils.timestamp(),
                    asset: asset,
                    action: 'sell',
                    quantity: quantity,
                    price: assetPrice,
                    totalValue: saleValue,
                    roundNumber: gameState.roundNumber
                });
                
                // Update game data
                const updatedGameData = {
                    ...gameData,
                    cash: newCash,
                    portfolio: portfolio,
                    tradeHistory: tradeHistory
                };
                
                // Save updated game data
                await EconGames.collections.investmentGameData.doc(docId).update({
                    gameData: updatedGameData,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                return { success: true, data: { newCash, portfolio } };
            } catch (error) {
                console.error('Error executing sell order:', error);
                return { success: false, error: error.message || 'Failed to execute sell order' };
            }
        }
    }
};

// Export for backward compatibility
window.ClassService = EconGames.DataService.Class;
window.GameDataService = EconGames.DataService.Game;
window.Service = EconGames.DataService; // For legacy code

console.log("Data service loaded");
