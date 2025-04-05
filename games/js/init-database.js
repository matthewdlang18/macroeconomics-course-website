// Initialize Database Script
// This script initializes the Firestore database with required data

// Ensure EconGames namespace exists
window.EconGames = window.EconGames || {};

// Database Initialization Service
EconGames.InitDatabase = {
    // Initialize database
    init: async function() {
        try {
            console.log('Initializing database...');
            
            // Create test TA user if it doesn't exist
            await this.createTestTAUser();
            
            // Register Investment Odyssey game
            await this.registerInvestmentOdysseyGame();
            
            console.log('Database initialization complete');
        } catch (error) {
            console.error('Error initializing database:', error);
        }
    },
    
    // Create test TA user
    createTestTAUser: async function() {
        try {
            const db = firebase.firestore();
            const usersCollection = db.collection('users');
            
            // Check if test TA user exists
            const snapshot = await usersCollection
                .where('username', '==', 'testTA')
                .where('role', '==', 'ta')
                .get();
            
            if (snapshot.empty) {
                // Create test TA user
                await usersCollection.doc('testTA').set({
                    id: 'testTA',
                    name: 'Test TA',
                    username: 'testTA',
                    passcode: '1234',
                    role: 'ta',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log('Created test TA user');
            } else {
                console.log('Test TA user already exists');
            }
        } catch (error) {
            console.error('Error creating test TA user:', error);
            throw error;
        }
    },
    
    // Register Investment Odyssey game
    registerInvestmentOdysseyGame: async function() {
        try {
            if (!EconGames.DataService) {
                console.warn('DataService not available, skipping game registration');
                return;
            }
            
            // Check if game already exists
            const gameResult = await EconGames.DataService.getGame('investment-odyssey');
            
            if (!gameResult.success) {
                // Game doesn't exist, register it
                const gameConfig = {
                    initialCash: 10000,
                    maxRounds: 20,
                    baseAssetPrices: {
                        'S&P 500': 5000,
                        'Bonds': 1000,
                        'Real Estate': 2000,
                        'Gold': 1800,
                        'Commodities': 1000,
                        'Bitcoin': 50000
                    },
                    assetReturns: {
                        'S&P 500': { mean: 0.1151, stdDev: 0.1949, min: -0.43, max: 0.50 },
                        'Bonds': { mean: 0.0334, stdDev: 0.0301, min: 0.0003, max: 0.14 },
                        'Real Estate': { mean: 0.0439, stdDev: 0.062, min: -0.12, max: 0.24 },
                        'Gold': { mean: 0.0648, stdDev: 0.2076, min: -0.32, max: 1.25 },
                        'Commodities': { mean: 0.0815, stdDev: 0.1522, min: -0.25, max: 2.00 },
                        'Bitcoin': { mean: 0.50, stdDev: 1.00, min: -0.73, max: 4.50 }
                    },
                    cashInjection: {
                        baseAmount: 2500,
                        variability: 500
                    }
                };
                
                await EconGames.DataService.registerGame({
                    gameId: 'investment-odyssey',
                    name: 'Investment Odyssey',
                    description: 'Manage an investment portfolio and navigate market volatility.',
                    config: gameConfig
                });
                
                console.log('Registered Investment Odyssey game');
            } else {
                console.log('Investment Odyssey game already registered');
            }
        } catch (error) {
            console.error('Error registering Investment Odyssey game:', error);
            throw error;
        }
    }
};

// Initialize database on load
document.addEventListener('DOMContentLoaded', function() {
    // Wait for services to initialize
    setTimeout(function() {
        EconGames.InitDatabase.init();
    }, 1000);
});
