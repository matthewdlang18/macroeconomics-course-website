// Initialize Firestore Database
// This script creates the necessary collections and documents in Firestore

// Wait for Firebase to be initialized
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit to ensure Firebase is fully loaded
    setTimeout(initializeFirestore, 1000);
});

// Initialize Firestore
async function initializeFirestore() {
    try {
        console.log('Initializing Firestore...');
        
        // Check if Firebase is initialized
        if (typeof firebase === 'undefined' || !firebase.apps.length) {
            console.error('Firebase is not initialized');
            return;
        }
        
        const db = firebase.firestore();
        
        // Create collections if they don't exist
        await createCollection(db, 'users');
        await createCollection(db, 'sessions');
        await createCollection(db, 'participants');
        await createCollection(db, 'games');
        await createCollection(db, 'leaderboards');
        
        // Create test TA user if it doesn't exist
        await createTestTAUser(db);
        
        // Register Investment Odyssey game
        await registerInvestmentOdysseyGame(db);
        
        console.log('Firestore initialization complete');
    } catch (error) {
        console.error('Error initializing Firestore:', error);
    }
}

// Create a collection by adding and then deleting a document
async function createCollection(db, collectionName) {
    try {
        // Check if collection exists by trying to get a document
        const snapshot = await db.collection(collectionName).limit(1).get();
        
        if (snapshot.empty) {
            console.log(`Creating collection: ${collectionName}`);
            
            // Add a temporary document to create the collection
            const tempDoc = await db.collection(collectionName).add({
                temp: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Delete the temporary document
            await tempDoc.delete();
            
            console.log(`Collection created: ${collectionName}`);
        } else {
            console.log(`Collection already exists: ${collectionName}`);
        }
    } catch (error) {
        console.error(`Error creating collection ${collectionName}:`, error);
        throw error;
    }
}

// Create test TA user
async function createTestTAUser(db) {
    try {
        // Check if test TA user exists
        const snapshot = await db.collection('users')
            .where('username', '==', 'testTA')
            .where('role', '==', 'ta')
            .get();
        
        if (snapshot.empty) {
            console.log('Creating test TA user');
            
            // Create test TA user
            await db.collection('users').doc('testTA').set({
                id: 'testTA',
                name: 'Test TA',
                username: 'testTA',
                passcode: '1234',
                role: 'ta',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('Test TA user created');
        } else {
            console.log('Test TA user already exists');
        }
    } catch (error) {
        console.error('Error creating test TA user:', error);
        throw error;
    }
}

// Register Investment Odyssey game
async function registerInvestmentOdysseyGame(db) {
    try {
        // Check if game already exists
        const gameDoc = await db.collection('games').doc('investment-odyssey').get();
        
        if (!gameDoc.exists) {
            console.log('Registering Investment Odyssey game');
            
            // Create game document
            await db.collection('games').doc('investment-odyssey').set({
                id: 'investment-odyssey',
                name: 'Investment Odyssey',
                description: 'Manage an investment portfolio and navigate market volatility.',
                config: {
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
                },
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Create leaderboard document
            await db.collection('leaderboards').doc('investment-odyssey').set({
                gameId: 'investment-odyssey',
                entries: [],
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('Investment Odyssey game registered');
        } else {
            console.log('Investment Odyssey game already registered');
        }
    } catch (error) {
        console.error('Error registering Investment Odyssey game:', error);
        throw error;
    }
}
