// Firebase configuration - Replace with your own Firebase project details
// See firebase-setup.js for instructions on setting up your own Firebase project
const firebaseConfig = {
    apiKey: "AIzaSyBkFOYrBOibPhfEFLI6nyElfI2sN64mCdw",
    authDomain: "investment-odyssey.firebaseapp.com",
    projectId: "investment-odyssey",
    storageBucket: "investment-odyssey.firebasestorage.app",
    messagingSenderId: "447309505114",
    appId: "1:447309505114:web:a1242b13429a4c4a316e63",
    measurementId: "G-TTMD5QQD5M"
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
let classesCollection, studentsCollection, gameStatesCollection, leaderboardCollection;

if (usingFirebase) {
    classesCollection = db.collection('activity4a_classes');
    studentsCollection = db.collection('activity4a_students');
    gameStatesCollection = db.collection('activity4a_game_states');
    leaderboardCollection = db.collection('activity4a_leaderboard');
}

// LocalStorage fallback service for offline development
const LocalStorageService = {
    // Class management
    createClass: async function(classNumber, description = '') {
        try {
            const classes = JSON.parse(localStorage.getItem('activity4a_classes') || '[]');
            const newClass = {
                classNumber: classNumber,
                description: description,
                createdAt: new Date().toISOString(),
                active: true
            };

            // Check if class already exists
            const existingIndex = classes.findIndex(c => c.classNumber === classNumber);
            if (existingIndex >= 0) {
                return { success: false, error: "Class already exists" };
            }

            classes.push(newClass);
            localStorage.setItem('activity4a_classes', JSON.stringify(classes));
            return { success: true };
        } catch (error) {
            console.error("Error creating class:", error);
            return { success: false, error: error.message };
        }
    },

    getClass: async function(classNumber) {
        try {
            const classes = JSON.parse(localStorage.getItem('activity4a_classes') || '[]');
            const classData = classes.find(c => c.classNumber === classNumber);

            if (classData) {
                return { success: true, data: classData };
            } else {
                return { success: false, error: "Class not found" };
            }
        } catch (error) {
            console.error("Error getting class:", error);
            return { success: false, error: error.message };
        }
    },

    getAllClasses: async function() {
        try {
            const classes = JSON.parse(localStorage.getItem('activity4a_classes') || '[]');
            return { success: true, data: classes };
        } catch (error) {
            console.error("Error getting classes:", error);
            return { success: false, error: error.message };
        }
    },

    // Game state management
    initializeGame: async function(classNumber) {
        try {
            // Initialize game state
            const gameStates = JSON.parse(localStorage.getItem('activity4a_game_states') || '[]');
            const gameState = {
                classNumber: classNumber,
                roundNumber: 0,
                CPI: 100,
                assetPrices: {
                    "S&P500": 100,
                    "Bonds": 100,
                    "Real Estate": 10000,
                    "Gold": 2000,
                    "Commodities": 100,
                    "Bitcoin": 50000,
                },
                assetPriceHistory: {
                    0: {
                        "S&P500": 100,
                        "Bonds": 100,
                        "Real Estate": 10000,
                        "Gold": 2000,
                        "Commodities": 100,
                        "Bitcoin": 50000,
                    }
                },
                CPIHistory: {
                    0: 100
                },
                assetReturnHistory: {},
                bitcoinShockRange: [-0.5, -0.75],
                extremeBitcoinEvent: false,
                totalCashInjected: 0,
                active: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Check if game state already exists
            const existingIndex = gameStates.findIndex(g => g.classNumber === classNumber);
            if (existingIndex >= 0) {
                gameStates[existingIndex] = gameState;
            } else {
                gameStates.push(gameState);
            }

            localStorage.setItem('activity4a_game_states', JSON.stringify(gameStates));

            // Initialize student portfolios
            const students = JSON.parse(localStorage.getItem('activity4a_students') || '[]');
            const classStudents = students.filter(s => s.classNumber === classNumber);

            classStudents.forEach(student => {
                student.cash = 5000;
                student.portfolio = { assets: {} };
                student.tradeHistory = [];
                student.portfolioValueHistory = { 0: 5000 };
            });

            localStorage.setItem('activity4a_students', JSON.stringify(students));

            return { success: true };
        } catch (error) {
            console.error("Error initializing game:", error);
            return { success: false, error: error.message };
        }
    },

    // Student management
    registerStudent: async function(name, classNumber) {
        try {
            // Check if class exists
            const classResult = await this.getClass(classNumber);
            if (!classResult.success) {
                return { success: false, error: "Class not found" };
            }

            // Generate a unique ID for the student
            const studentId = `${name.replace(/\s+/g, '_')}_${classNumber}_${Date.now()}`;

            // Get existing students
            const students = JSON.parse(localStorage.getItem('activity4a_students') || '[]');

            // Create student object
            const newStudent = {
                id: studentId,
                name: name,
                classNumber: classNumber,
                cash: 5000,
                portfolio: {
                    assets: {}
                },
                tradeHistory: [],
                portfolioValueHistory: {
                    0: 5000
                },
                createdAt: new Date().toISOString()
            };

            // Add student to array
            students.push(newStudent);

            // Save to localStorage
            localStorage.setItem('activity4a_students', JSON.stringify(students));

            // Store student info in local storage for session
            localStorage.setItem('activity4a_student_id', studentId);
            localStorage.setItem('activity4a_student_name', name);
            localStorage.setItem('activity4a_class_number', classNumber);

            return { success: true, data: { studentId, name, classNumber } };
        } catch (error) {
            console.error("Error registering student:", error);
            return { success: false, error: error.message };
        }
    },

    getStudent: async function(studentId) {
        try {
            const students = JSON.parse(localStorage.getItem('activity4a_students') || '[]');
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

    getStudentsInClass: async function(classNumber) {
        try {
            const students = JSON.parse(localStorage.getItem('activity4a_students') || '[]');
            const classStudents = students.filter(s => s.classNumber === classNumber);
            return { success: true, data: classStudents };
        } catch (error) {
            console.error("Error getting students in class:", error);
            return { success: false, error: error.message };
        }
    },

    // Trading
    executeTrade: async function(studentId, asset, action, quantity) {
        try {
            // Get student data
            const studentResult = await this.getStudent(studentId);
            if (!studentResult.success) {
                return studentResult;
            }

            const student = studentResult.data;
            const classNumber = student.classNumber;

            // Get game state
            const gameStateResult = await this.getGameState(classNumber);
            if (!gameStateResult.success) {
                return gameStateResult;
            }

            const gameState = gameStateResult.data;
            const assetPrice = gameState.assetPrices[asset];

            if (!assetPrice) {
                return { success: false, error: "Invalid asset" };
            }

            // Get all students to update the current one
            const students = JSON.parse(localStorage.getItem('activity4a_students') || '[]');
            const studentIndex = students.findIndex(s => s.id === studentId);

            if (studentIndex === -1) {
                return { success: false, error: "Student not found" };
            }

            // Execute trade
            if (action === 'buy') {
                const totalCost = assetPrice * quantity;

                // Check if student has enough cash
                if (student.cash < totalCost) {
                    return { success: false, error: "Insufficient funds" };
                }

                // Update student portfolio
                const portfolio = student.portfolio || { assets: {} };
                const assets = portfolio.assets || {};
                const currentQuantity = assets[asset] || 0;
                const newQuantity = currentQuantity + quantity;

                assets[asset] = newQuantity;

                // Update student cash
                const newCash = student.cash - totalCost;

                // Add to trade history
                const tradeHistory = student.tradeHistory || [];
                tradeHistory.push({
                    timestamp: new Date().toISOString(),
                    asset: asset,
                    action: 'buy',
                    quantity: quantity,
                    price: assetPrice,
                    totalValue: totalCost,
                    roundNumber: gameState.roundNumber
                });

                // Update student object
                students[studentIndex].cash = newCash;
                students[studentIndex].portfolio.assets = assets;
                students[studentIndex].tradeHistory = tradeHistory;

                // Save to localStorage
                localStorage.setItem('activity4a_students', JSON.stringify(students));

                return {
                    success: true,
                    data: {
                        newCash,
                        newQuantity,
                        totalCost,
                        message: `Successfully bought ${quantity} of ${asset} for $${totalCost.toFixed(2)}`
                    }
                };

            } else if (action === 'sell') {
                // Check if student has enough of the asset
                const portfolio = student.portfolio || { assets: {} };
                const assets = portfolio.assets || {};
                const currentQuantity = assets[asset] || 0;

                if (currentQuantity < quantity) {
                    return { success: false, error: "Insufficient assets to sell" };
                }

                // Calculate sale value
                const saleValue = assetPrice * quantity;

                // Update portfolio
                const newQuantity = currentQuantity - quantity;
                if (newQuantity > 0) {
                    assets[asset] = newQuantity;
                } else {
                    delete assets[asset];
                }

                // Update cash
                const newCash = student.cash + saleValue;

                // Add to trade history
                const tradeHistory = student.tradeHistory || [];
                tradeHistory.push({
                    timestamp: new Date().toISOString(),
                    asset: asset,
                    action: 'sell',
                    quantity: quantity,
                    price: assetPrice,
                    totalValue: saleValue,
                    roundNumber: gameState.roundNumber
                });

                // Update student object
                students[studentIndex].cash = newCash;
                students[studentIndex].portfolio.assets = assets;
                students[studentIndex].tradeHistory = tradeHistory;

                // Save to localStorage
                localStorage.setItem('activity4a_students', JSON.stringify(students));

                return {
                    success: true,
                    data: {
                        newCash,
                        newQuantity,
                        saleValue,
                        message: `Successfully sold ${quantity} of ${asset} for $${saleValue.toFixed(2)}`
                    }
                };
            } else {
                return { success: false, error: "Invalid action" };
            }
        } catch (error) {
            console.error("Error executing trade:", error);
            return { success: false, error: error.message };
        }
    },

    // Leaderboard
    getLeaderboard: async function(classNumber) {
        try {
            const studentsResult = await this.getStudentsInClass(classNumber);
            if (!studentsResult.success) {
                return studentsResult;
            }

            const students = studentsResult.data;
            const gameStateResult = await this.getGameState(classNumber);

            if (!gameStateResult.success) {
                return { success: false, error: "Game state not found" };
            }

            const gameState = gameStateResult.data;
            const assetPrices = gameState.assetPrices;

            const leaderboard = students.map(student => {
                // Calculate total portfolio value
                let portfolioValue = student.cash;
                const assets = student.portfolio?.assets || {};

                // Add value of each asset
                for (const [asset, quantity] of Object.entries(assets)) {
                    if (assetPrices[asset]) {
                        portfolioValue += assetPrices[asset] * quantity;
                    }
                }

                return {
                    id: student.id,
                    name: student.name,
                    portfolioValue: portfolioValue
                };
            });

            // Sort by portfolio value (descending)
            leaderboard.sort((a, b) => b.portfolioValue - a.portfolioValue);

            return { success: true, data: leaderboard };
        } catch (error) {
            console.error("Error getting leaderboard:", error);
            return { success: false, error: error.message };
        }
    },

    // Game state management
    getGameState: async function(classNumber) {
        try {
            const gameStates = JSON.parse(localStorage.getItem('activity4a_game_states') || '[]');
            const gameState = gameStates.find(g => g.classNumber === classNumber);

            if (gameState) {
                return { success: true, data: gameState };
            } else {
                return { success: false, error: "Game state not found" };
            }
        } catch (error) {
            console.error("Error getting game state:", error);
            return { success: false, error: error.message };
        }
    },

    advanceToNextRound: async function(classNumber) {
        try {
            // Get current game state
            const gameStateResult = await this.getGameState(classNumber);
            if (!gameStateResult.success) {
                return gameStateResult;
            }

            const gameState = gameStateResult.data;
            const newRoundNumber = gameState.roundNumber + 1;

            // Random cash injection (between $500 and $1500)
            const cashInjection = Math.floor(Math.random() * 1000) + 500;

            // Calculate new asset prices using the correlation matrix
            const correlationMatrix = [
                [1.0000, -0.5169, 0.3425, 0.0199, 0.1243, 0.4057],
                [-0.5169, 1.0000, 0.0176, 0.0289, -0.0235, -0.2259],
                [0.3425, 0.0176, 1.0000, -0.4967, -0.0334, 0.1559],
                [0.0199, 0.0289, -0.4967, 1.0000, 0.0995, -0.5343],
                [0.1243, -0.0235, -0.0334, 0.0995, 1.0000, 0.0436],
                [0.4057, -0.2259, 0.1559, -0.5343, 0.0436, 1.0000]
            ];

            const assets = ["S&P500", "Bonds", "Real Estate", "Gold", "Commodities", "Bitcoin"];
            const means = [0.02, 0.01, 0.015, 0.01, 0.02, 0.05];
            const stdDevs = [0.05, 0.02, 0.04, 0.03, 0.06, 0.15];

            // Generate correlated returns
            const returns = this.generateCorrelatedReturns(means, stdDevs, correlationMatrix);

            // Calculate new prices
            const newAssetPrices = {};
            const newAssetReturns = {};

            assets.forEach((asset, i) => {
                const currentPrice = gameState.assetPrices[asset];
                const returnRate = returns[i];
                const newPrice = currentPrice * (1 + returnRate);

                newAssetPrices[asset] = newPrice;
                newAssetReturns[asset] = returnRate;
            });

            // Update CPI
            const avgCpiIncrease = 0.025;
            const stdDevCpiIncrease = 0.015;
            const cpiIncrease = this.normalRandom(avgCpiIncrease, stdDevCpiIncrease);
            const newCpi = gameState.CPI * (1 + cpiIncrease);

            // Update game state
            const assetPriceHistory = gameState.assetPriceHistory || {};
            assetPriceHistory[newRoundNumber] = newAssetPrices;

            const CPIHistory = gameState.CPIHistory || {};
            CPIHistory[newRoundNumber] = newCpi;

            const assetReturnHistory = gameState.assetReturnHistory || {};
            assetReturnHistory[newRoundNumber] = newAssetReturns;

            // Get all game states
            const gameStates = JSON.parse(localStorage.getItem('activity4a_game_states') || '[]');
            const gameStateIndex = gameStates.findIndex(g => g.classNumber === classNumber);

            if (gameStateIndex === -1) {
                return { success: false, error: "Game state not found" };
            }

            // Update game state
            gameStates[gameStateIndex].roundNumber = newRoundNumber;
            gameStates[gameStateIndex].assetPrices = newAssetPrices;
            gameStates[gameStateIndex].CPI = newCpi;
            gameStates[gameStateIndex].assetPriceHistory = assetPriceHistory;
            gameStates[gameStateIndex].CPIHistory = CPIHistory;
            gameStates[gameStateIndex].assetReturnHistory = assetReturnHistory;
            gameStates[gameStateIndex].updatedAt = new Date().toISOString();

            // Save game states
            localStorage.setItem('activity4a_game_states', JSON.stringify(gameStates));

            // Update student portfolios with cash injection
            await this.updateStudentPortfolios(classNumber, newRoundNumber, newAssetPrices, cashInjection);

            return { success: true, data: { roundNumber: newRoundNumber, assetPrices: newAssetPrices, CPI: newCpi } };
        } catch (error) {
            console.error("Error advancing to next round:", error);
            return { success: false, error: error.message };
        }
    },

    updateStudentPortfolios: async function(classNumber, roundNumber, assetPrices, cashInjection = 0) {
        try {
            const studentsResult = await this.getStudentsInClass(classNumber);
            if (!studentsResult.success) {
                return;
            }

            const students = studentsResult.data;
            const allStudents = JSON.parse(localStorage.getItem('activity4a_students') || '[]');

            students.forEach(student => {
                // Find student in all students array
                const studentIndex = allStudents.findIndex(s => s.id === student.id);
                if (studentIndex === -1) return;

                // Add cash injection
                const newCash = student.cash + cashInjection;

                // Calculate total portfolio value
                let portfolioValue = newCash;
                const assets = student.portfolio?.assets || {};

                // Add value of each asset
                for (const [asset, quantity] of Object.entries(assets)) {
                    if (assetPrices[asset]) {
                        portfolioValue += assetPrices[asset] * quantity;
                    }
                }

                // Update portfolio value history
                const portfolioValueHistory = student.portfolioValueHistory || {};
                portfolioValueHistory[roundNumber] = portfolioValue;

                // Update student document
                allStudents[studentIndex].cash = newCash;
                allStudents[studentIndex].portfolioValueHistory = portfolioValueHistory;
            });

            // Save all students
            localStorage.setItem('activity4a_students', JSON.stringify(allStudents));

            // Update game state with total cash injected
            if (cashInjection > 0) {
                const gameStates = JSON.parse(localStorage.getItem('activity4a_game_states') || '[]');
                const gameStateIndex = gameStates.findIndex(g => g.classNumber === classNumber);

                if (gameStateIndex !== -1) {
                    const totalCashInjected = gameStates[gameStateIndex].totalCashInjected || 0;
                    gameStates[gameStateIndex].totalCashInjected = totalCashInjected + (cashInjection * students.length);
                    localStorage.setItem('activity4a_game_states', JSON.stringify(gameStates));
                }
            }
        } catch (error) {
            console.error("Error updating student portfolios:", error);
        }
    },

    // Statistical functions
    normalRandom: function(mean, stdDev) {
        // Box-Muller transform for normal distribution
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        return z0 * stdDev + mean;
    },

    generateCorrelatedReturns: function(means, stdDevs, correlationMatrix) {
        // Generate uncorrelated standard normal variables
        const n = means.length;
        const uncorrelated = Array(n).fill(0).map(() => this.normalRandom(0, 1));

        // Perform Cholesky decomposition of correlation matrix
        const L = this.choleskyDecomposition(correlationMatrix);

        // Generate correlated standard normal variables
        const correlated = Array(n).fill(0);
        for (let i = 0; i < n; i++) {
            for (let j = 0; j <= i; j++) {
                correlated[i] += L[i][j] * uncorrelated[j];
            }
        }

        // Transform to desired means and standard deviations
        return correlated.map((z, i) => z * stdDevs[i] + means[i]);
    },

    choleskyDecomposition: function(A) {
        const n = A.length;
        const L = Array(n).fill(0).map(() => Array(n).fill(0));

        for (let i = 0; i < n; i++) {
            for (let j = 0; j <= i; j++) {
                let sum = 0;
                for (let k = 0; k < j; k++) {
                    sum += L[i][k] * L[j][k];
                }

                if (i === j) {
                    L[i][j] = Math.sqrt(A[i][i] - sum);
                } else {
                    L[i][j] = (A[i][j] - sum) / L[j][j];
                }
            }
        }

        return L;
    }
};

// Helper functions for Firebase operations
const FirebaseService = {
    // Class management
    createClass: async function(classNumber, description = '') {
        try {
            await classesCollection.doc(classNumber).set({
                classNumber: classNumber,
                description: description,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                active: true
            });
            return { success: true };
        } catch (error) {
            console.error("Error creating class:", error);
            return { success: false, error: error.message };
        }
    },

    getClass: async function(classNumber) {
        try {
            const doc = await classesCollection.doc(classNumber).get();
            if (doc.exists) {
                return { success: true, data: doc.data() };
            } else {
                return { success: false, error: "Class not found" };
            }
        } catch (error) {
            console.error("Error getting class:", error);
            return { success: false, error: error.message };
        }
    },

    getAllClasses: async function() {
        try {
            const snapshot = await classesCollection.get();
            const classes = [];
            snapshot.forEach(doc => {
                classes.push(doc.data());
            });
            return { success: true, data: classes };
        } catch (error) {
            console.error("Error getting classes:", error);
            return { success: false, error: error.message };
        }
    },

    // Game state management
    initializeGame: async function(classNumber) {
        try {
            // Initialize game state
            await gameStatesCollection.doc(classNumber).set({
                classNumber: classNumber,
                roundNumber: 0,
                CPI: 100,
                assetPrices: {
                    "S&P500": 100,
                    "Bonds": 100,
                    "Real Estate": 10000,
                    "Gold": 2000,
                    "Commodities": 100,
                    "Bitcoin": 25000,
                },
                assetPriceHistory: {},
                CPIHistory: {},
                assetReturnHistory: {},
                bitcoinShockRange: [-0.5, -0.75],
                extremeBitcoinEvent: false,
                totalCashInjected: 0,
                active: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Initialize student portfolios
            const studentsSnapshot = await studentsCollection.where('classNumber', '==', classNumber).get();
            const batch = db.batch();

            studentsSnapshot.forEach(doc => {
                const studentRef = studentsCollection.doc(doc.id);
                batch.update(studentRef, {
                    cash: 5000,
                    portfolio: {
                        assets: {}
                    },
                    tradeHistory: [],
                    portfolioValueHistory: {
                        0: 5000
                    }
                });
            });

            await batch.commit();
            return { success: true };
        } catch (error) {
            console.error("Error initializing game:", error);
            return { success: false, error: error.message };
        }
    },

    getGameState: async function(classNumber) {
        try {
            const doc = await gameStatesCollection.doc(classNumber).get();
            if (doc.exists) {
                return { success: true, data: doc.data() };
            } else {
                return { success: false, error: "Game state not found" };
            }
        } catch (error) {
            console.error("Error getting game state:", error);
            return { success: false, error: error.message };
        }
    },

    advanceToNextRound: async function(classNumber) {
        try {
            // Get current game state
            const gameStateResult = await this.getGameState(classNumber);
            if (!gameStateResult.success) {
                return gameStateResult;
            }

            const gameState = gameStateResult.data;
            const newRoundNumber = gameState.roundNumber + 1;

            // Random cash injection (between $500 and $1500)
            const cashInjection = Math.floor(Math.random() * 1000) + 500;

            // Calculate new asset prices using the correlation matrix
            const correlationMatrix = [
                [1.0000, -0.5169, 0.3425, 0.0199, 0.1243, 0.4057],
                [-0.5169, 1.0000, 0.0176, 0.0289, -0.0235, -0.2259],
                [0.3425, 0.0176, 1.0000, -0.4967, -0.0334, 0.1559],
                [0.0199, 0.0289, -0.4967, 1.0000, 0.0995, -0.5343],
                [0.1243, -0.0235, -0.0334, 0.0995, 1.0000, 0.0436],
                [0.4057, -0.2259, 0.1559, -0.5343, 0.0436, 1.0000]
            ];

            const assets = ["S&P500", "Bonds", "Real Estate", "Gold", "Commodities", "Bitcoin"];
            const means = [0.02, 0.01, 0.015, 0.01, 0.02, 0.05];
            const stdDevs = [0.05, 0.02, 0.04, 0.03, 0.06, 0.15];

            // Generate correlated returns
            const returns = this.generateCorrelatedReturns(means, stdDevs, correlationMatrix);

            // Calculate new prices
            const newAssetPrices = {};
            const newAssetReturns = {};

            assets.forEach((asset, i) => {
                const currentPrice = gameState.assetPrices[asset];
                const returnRate = returns[i];
                const newPrice = currentPrice * (1 + returnRate);

                newAssetPrices[asset] = newPrice;
                newAssetReturns[asset] = returnRate;
            });

            // Update CPI
            const avgCpiIncrease = 0.025;
            const stdDevCpiIncrease = 0.015;
            const cpiIncrease = this.normalRandom(avgCpiIncrease, stdDevCpiIncrease);
            const newCpi = gameState.CPI * (1 + cpiIncrease);

            // Update game state
            const assetPriceHistory = gameState.assetPriceHistory || {};
            assetPriceHistory[newRoundNumber] = newAssetPrices;

            const CPIHistory = gameState.CPIHistory || {};
            CPIHistory[newRoundNumber] = newCpi;

            const assetReturnHistory = gameState.assetReturnHistory || {};
            assetReturnHistory[newRoundNumber] = newAssetReturns;

            await gameStatesCollection.doc(classNumber).update({
                roundNumber: newRoundNumber,
                assetPrices: newAssetPrices,
                CPI: newCpi,
                assetPriceHistory: assetPriceHistory,
                CPIHistory: CPIHistory,
                assetReturnHistory: assetReturnHistory,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Update student portfolios with cash injection
            await this.updateStudentPortfolios(classNumber, newRoundNumber, newAssetPrices, cashInjection);

            return { success: true, data: { roundNumber: newRoundNumber, assetPrices: newAssetPrices, CPI: newCpi } };
        } catch (error) {
            console.error("Error advancing to next round:", error);
            return { success: false, error: error.message };
        }
    },

    // Student management
    registerStudent: async function(name, classNumber) {
        try {
            // Check if class exists
            const classResult = await this.getClass(classNumber);
            if (!classResult.success) {
                return { success: false, error: "Class not found" };
            }

            // Generate a unique ID for the student
            const studentId = `${name.replace(/\s+/g, '_')}_${classNumber}_${Date.now()}`;

            // Create student document
            await studentsCollection.doc(studentId).set({
                id: studentId,
                name: name,
                classNumber: classNumber,
                cash: 5000,
                portfolio: {
                    assets: {}
                },
                tradeHistory: [],
                portfolioValueHistory: {
                    0: 5000
                },
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Store student info in local storage
            localStorage.setItem('activity4a_student_id', studentId);
            localStorage.setItem('activity4a_student_name', name);
            localStorage.setItem('activity4a_class_number', classNumber);

            return { success: true, data: { studentId, name, classNumber } };
        } catch (error) {
            console.error("Error registering student:", error);
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

    getStudentsInClass: async function(classNumber) {
        try {
            const snapshot = await studentsCollection.where('classNumber', '==', classNumber).get();
            const students = [];
            snapshot.forEach(doc => {
                students.push(doc.data());
            });
            return { success: true, data: students };
        } catch (error) {
            console.error("Error getting students in class:", error);
            return { success: false, error: error.message };
        }
    },

    // Trading
    executeTrade: async function(studentId, asset, action, quantity) {
        try {
            // Get student data
            const studentResult = await this.getStudent(studentId);
            if (!studentResult.success) {
                return studentResult;
            }

            const student = studentResult.data;
            const classNumber = student.classNumber;

            // Get game state
            const gameStateResult = await this.getGameState(classNumber);
            if (!gameStateResult.success) {
                return gameStateResult;
            }

            const gameState = gameStateResult.data;
            const assetPrice = gameState.assetPrices[asset];

            if (!assetPrice) {
                return { success: false, error: "Invalid asset" };
            }

            // Execute trade
            if (action === 'buy') {
                const totalCost = assetPrice * quantity;

                // Check if student has enough cash
                if (student.cash < totalCost) {
                    return { success: false, error: "Insufficient funds" };
                }

                // Update student portfolio
                const portfolio = student.portfolio || { assets: {} };
                const assets = portfolio.assets || {};
                const currentQuantity = assets[asset] || 0;
                const newQuantity = currentQuantity + quantity;

                assets[asset] = newQuantity;

                // Update student cash
                const newCash = student.cash - totalCost;

                // Add to trade history
                const tradeHistory = student.tradeHistory || [];
                tradeHistory.push({
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    asset: asset,
                    action: 'buy',
                    quantity: quantity,
                    price: assetPrice,
                    totalValue: totalCost,
                    roundNumber: gameState.roundNumber
                });

                // Update student document
                await studentsCollection.doc(studentId).update({
                    cash: newCash,
                    'portfolio.assets': assets,
                    tradeHistory: tradeHistory
                });

                return {
                    success: true,
                    data: {
                        newCash,
                        newQuantity,
                        totalCost,
                        message: `Successfully bought ${quantity} of ${asset} for $${totalCost.toFixed(2)}`
                    }
                };

            } else if (action === 'sell') {
                // Check if student has enough of the asset
                const portfolio = student.portfolio || { assets: {} };
                const assets = portfolio.assets || {};
                const currentQuantity = assets[asset] || 0;

                if (currentQuantity < quantity) {
                    return { success: false, error: "Insufficient assets to sell" };
                }

                // Calculate sale value
                const saleValue = assetPrice * quantity;

                // Update portfolio
                const newQuantity = currentQuantity - quantity;
                if (newQuantity > 0) {
                    assets[asset] = newQuantity;
                } else {
                    delete assets[asset];
                }

                // Update cash
                const newCash = student.cash + saleValue;

                // Add to trade history
                const tradeHistory = student.tradeHistory || [];
                tradeHistory.push({
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    asset: asset,
                    action: 'sell',
                    quantity: quantity,
                    price: assetPrice,
                    totalValue: saleValue,
                    roundNumber: gameState.roundNumber
                });

                // Update student document
                await studentsCollection.doc(studentId).update({
                    cash: newCash,
                    'portfolio.assets': assets,
                    tradeHistory: tradeHistory
                });

                return {
                    success: true,
                    data: {
                        newCash,
                        newQuantity,
                        saleValue,
                        message: `Successfully sold ${quantity} of ${asset} for $${saleValue.toFixed(2)}`
                    }
                };
            } else {
                return { success: false, error: "Invalid action" };
            }
        } catch (error) {
            console.error("Error executing trade:", error);
            return { success: false, error: error.message };
        }
    },

    // Leaderboard
    getLeaderboard: async function(classNumber) {
        try {
            const studentsResult = await this.getStudentsInClass(classNumber);
            if (!studentsResult.success) {
                return studentsResult;
            }

            const students = studentsResult.data;
            const leaderboard = students.map(student => {
                // Calculate total portfolio value
                let portfolioValue = student.cash;
                const assets = student.portfolio?.assets || {};

                // Get game state to get current asset prices
                const gameStateResult = this.getGameState(classNumber);
                if (gameStateResult.success) {
                    const gameState = gameStateResult.data;
                    const assetPrices = gameState.assetPrices;

                    // Add value of each asset
                    for (const [asset, quantity] of Object.entries(assets)) {
                        if (assetPrices[asset]) {
                            portfolioValue += assetPrices[asset] * quantity;
                        }
                    }
                }

                return {
                    id: student.id,
                    name: student.name,
                    portfolioValue: portfolioValue
                };
            });

            // Sort by portfolio value (descending)
            leaderboard.sort((a, b) => b.portfolioValue - a.portfolioValue);

            return { success: true, data: leaderboard };
        } catch (error) {
            console.error("Error getting leaderboard:", error);
            return { success: false, error: error.message };
        }
    },

    // Helper methods
    updateStudentPortfolios: async function(classNumber, roundNumber, assetPrices, cashInjection = 0) {
        try {
            const studentsResult = await this.getStudentsInClass(classNumber);
            if (!studentsResult.success) {
                return;
            }

            const students = studentsResult.data;
            const batch = db.batch();

            students.forEach(student => {
                // Add cash injection
                const newCash = student.cash + cashInjection;

                // Calculate total portfolio value
                let portfolioValue = newCash;
                const assets = student.portfolio?.assets || {};

                // Add value of each asset
                for (const [asset, quantity] of Object.entries(assets)) {
                    if (assetPrices[asset]) {
                        portfolioValue += assetPrices[asset] * quantity;
                    }
                }

                // Update portfolio value history
                const portfolioValueHistory = student.portfolioValueHistory || {};
                portfolioValueHistory[roundNumber] = portfolioValue;

                // Update student document
                const studentRef = studentsCollection.doc(student.id);
                batch.update(studentRef, {
                    cash: newCash,
                    portfolioValueHistory: portfolioValueHistory
                });

                // Update leaderboard
                this.updateLeaderboard(student.id, student.name, classNumber, portfolioValue);
            });

            // Update game state with total cash injected
            if (cashInjection > 0) {
                const gameStateRef = gameStatesCollection.doc(classNumber);
                batch.update(gameStateRef, {
                    totalCashInjected: firebase.firestore.FieldValue.increment(cashInjection * students.length)
                });
            }

            await batch.commit();
        } catch (error) {
            console.error("Error updating student portfolios:", error);
        }
    },

    updateLeaderboard: async function(studentId, name, classNumber, portfolioValue) {
        try {
            await leaderboardCollection.doc(studentId).set({
                id: studentId,
                name: name,
                classNumber: classNumber,
                portfolioValue: portfolioValue,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error("Error updating leaderboard:", error);
        }
    },

    // Statistical functions
    normalRandom: function(mean, stdDev) {
        // Box-Muller transform for normal distribution
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        return z0 * stdDev + mean;
    },

    generateCorrelatedReturns: function(means, stdDevs, correlationMatrix) {
        // Generate uncorrelated standard normal variables
        const n = means.length;
        const uncorrelated = Array(n).fill(0).map(() => this.normalRandom(0, 1));

        // Perform Cholesky decomposition of correlation matrix
        const L = this.choleskyDecomposition(correlationMatrix);

        // Generate correlated standard normal variables
        const correlated = Array(n).fill(0);
        for (let i = 0; i < n; i++) {
            for (let j = 0; j <= i; j++) {
                correlated[i] += L[i][j] * uncorrelated[j];
            }
        }

        // Transform to desired means and standard deviations
        return correlated.map((z, i) => z * stdDevs[i] + means[i]);
    },

    choleskyDecomposition: function(A) {
        const n = A.length;
        const L = Array(n).fill(0).map(() => Array(n).fill(0));

        for (let i = 0; i < n; i++) {
            for (let j = 0; j <= i; j++) {
                let sum = 0;
                for (let k = 0; k < j; k++) {
                    sum += L[i][k] * L[j][k];
                }

                if (i === j) {
                    L[i][j] = Math.sqrt(A[i][i] - sum);
                } else {
                    L[i][j] = (A[i][j] - sum) / L[j][j];
                }
            }
        }

        return L;
    }
};

// Select the appropriate service based on Firebase availability
const Service = usingFirebase ? FirebaseService : LocalStorageService;

// Display a message about which service is being used
console.log(`Using ${usingFirebase ? 'Firebase' : 'localStorage'} for data storage.`);
if (!usingFirebase) {
    console.log('To use Firebase, please set up your own Firebase project. See firebase-setup.js for instructions.');
}
