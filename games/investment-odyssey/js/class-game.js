// Class Game JavaScript for Investment Odyssey

// Document ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    if (typeof $ !== 'undefined' && $.fn.tooltip) {
        $('[data-toggle="tooltip"]').tooltip();
    }

    // Check if we need to redirect to game.html
    checkRedirect();
});

// Check if we should redirect to game.html
function checkRedirect() {
    // If user is logged in and has joined a session, redirect to game.html
    if (EconGames.SimpleAuth.isLoggedIn()) {
        const session = EconGames.SimpleAuth.getSession();

        // If user has a game session, redirect to game.html
        if (session.gameSession) {
            // Check if we're coming from game.html (to avoid redirect loop)
            const referrer = document.referrer;
            if (!referrer.includes('game.html')) {
                window.location.href = 'game.html';
            }
        }
    }
}

// Class Game Service
const ClassGameService = {
    // Get active sessions
    getActiveSessions: async function() {
        try {
            return await EconGames.DataService.getActiveSessions('investment-odyssey');
        } catch (error) {
            console.error('Error getting active sessions:', error);
            return { success: false, error: error.message };
        }
    },

    // Join session
    joinSession: async function(joinCode) {
        try {
            if (!EconGames.SimpleAuth.isLoggedIn()) {
                return { success: false, error: 'You must be logged in to join a session' };
            }

            const userId = EconGames.SimpleAuth.getSession().userId;
            return await EconGames.AuthService.joinSession(userId, joinCode);
        } catch (error) {
            console.error('Error joining session:', error);
            return { success: false, error: error.message };
        }
    },

    // Get current session
    getCurrentSession: async function() {
        try {
            if (!EconGames.SimpleAuth.isLoggedIn()) {
                return { success: false, error: 'You must be logged in to get session data' };
            }

            const session = EconGames.SimpleAuth.getSession();

            if (!session.gameSession) {
                return { success: false, error: 'No active game session' };
            }

            // Get session data directly from Firestore
            const db = firebase.firestore();
            const sessionDoc = await db.collection('sessions').doc(session.gameSession.id).get();

            if (!sessionDoc.exists) {
                return { success: false, error: 'Session not found' };
            }

            return {
                success: true,
                data: {
                    id: sessionDoc.id,
                    ...sessionDoc.data()
                }
            };
        } catch (error) {
            console.error('Error getting current session:', error);
            return { success: false, error: error.message };
        }
    },

    // Get participant data
    getParticipantData: async function() {
        try {
            if (!EconGames.SimpleAuth.isLoggedIn()) {
                return { success: false, error: 'You must be logged in to get participant data' };
            }

            const session = EconGames.SimpleAuth.getSession();

            if (!session.gameSession) {
                return { success: false, error: 'No active game session' };
            }

            // Get participant data directly from Firestore
            const db = firebase.firestore();
            const userId = session.userId;
            const sessionId = session.gameSession.id;

            // Check if participant exists
            const snapshot = await db.collection('participants')
                .where('userId', '==', userId)
                .where('sessionId', '==', sessionId)
                .limit(1)
                .get();

            if (snapshot.empty) {
                // Create participant if not exists
                const participantRef = db.collection('participants').doc();
                const participantData = {
                    id: participantRef.id,
                    userId: userId,
                    sessionId: sessionId,
                    name: session.name || 'Anonymous',
                    cash: 10000,
                    portfolio: {},
                    tradeHistory: [],
                    joinedAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                await participantRef.set(participantData);

                return {
                    success: true,
                    data: participantData
                };
            }

            // Return existing participant data
            return {
                success: true,
                data: {
                    id: snapshot.docs[0].id,
                    ...snapshot.docs[0].data()
                }
            };
        } catch (error) {
            console.error('Error getting participant data:', error);
            return { success: false, error: error.message };
        }
    },

    // Execute buy order
    executeBuy: async function(asset, quantity) {
        try {
            if (!EconGames.SimpleAuth.isLoggedIn()) {
                return { success: false, error: 'You must be logged in to execute trades' };
            }

            const session = EconGames.SimpleAuth.getSession();

            if (!session.gameSession) {
                return { success: false, error: 'No active game session' };
            }

            // Get participant and session data
            const db = firebase.firestore();
            const userId = session.userId;
            const sessionId = session.gameSession.id;

            // Get session for asset prices
            const sessionDoc = await db.collection('sessions').doc(sessionId).get();
            if (!sessionDoc.exists) {
                return { success: false, error: 'Session not found' };
            }

            const sessionData = sessionDoc.data();
            const assetPrices = sessionData.assetPrices || {};

            // Check if asset exists
            if (!assetPrices[asset]) {
                return { success: false, error: 'Asset not found' };
            }

            // Get participant
            const snapshot = await db.collection('participants')
                .where('userId', '==', userId)
                .where('sessionId', '==', sessionId)
                .limit(1)
                .get();

            if (snapshot.empty) {
                return { success: false, error: 'Participant not found' };
            }

            const participantRef = snapshot.docs[0].ref;
            const participantData = snapshot.docs[0].data();

            // Calculate cost
            const price = assetPrices[asset];
            const cost = price * quantity;

            // Check if participant has enough cash
            if (participantData.cash < cost) {
                return { success: false, error: 'Not enough cash' };
            }

            // Update participant data
            const portfolio = participantData.portfolio || {};
            const currentQuantity = portfolio[asset] || 0;
            const newQuantity = currentQuantity + quantity;

            // Update portfolio
            portfolio[asset] = newQuantity;

            // Update cash
            const newCash = participantData.cash - cost;

            // Update trade history
            const tradeHistory = participantData.tradeHistory || [];
            tradeHistory.push({
                asset: asset,
                action: 'buy',
                quantity: quantity,
                price: price,
                cost: cost,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Update participant
            await participantRef.update({
                portfolio: portfolio,
                cash: newCash,
                tradeHistory: tradeHistory,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return {
                success: true,
                data: {
                    asset: asset,
                    quantity: quantity,
                    price: price,
                    cost: cost,
                    newCash: newCash,
                    newQuantity: newQuantity
                }
            };
        } catch (error) {
            console.error('Error executing buy order:', error);
            return { success: false, error: error.message };
        }
    },

    // Execute sell order
    executeSell: async function(asset, quantity) {
        try {
            if (!EconGames.SimpleAuth.isLoggedIn()) {
                return { success: false, error: 'You must be logged in to execute trades' };
            }

            const session = EconGames.SimpleAuth.getSession();

            if (!session.gameSession) {
                return { success: false, error: 'No active game session' };
            }

            // Get participant and session data
            const db = firebase.firestore();
            const userId = session.userId;
            const sessionId = session.gameSession.id;

            // Get session for asset prices
            const sessionDoc = await db.collection('sessions').doc(sessionId).get();
            if (!sessionDoc.exists) {
                return { success: false, error: 'Session not found' };
            }

            const sessionData = sessionDoc.data();
            const assetPrices = sessionData.assetPrices || {};

            // Check if asset exists
            if (!assetPrices[asset]) {
                return { success: false, error: 'Asset not found' };
            }

            // Get participant
            const snapshot = await db.collection('participants')
                .where('userId', '==', userId)
                .where('sessionId', '==', sessionId)
                .limit(1)
                .get();

            if (snapshot.empty) {
                return { success: false, error: 'Participant not found' };
            }

            const participantRef = snapshot.docs[0].ref;
            const participantData = snapshot.docs[0].data();

            // Calculate value
            const price = assetPrices[asset];
            const value = price * quantity;

            // Check if participant has enough of the asset
            const portfolio = participantData.portfolio || {};
            const currentQuantity = portfolio[asset] || 0;

            if (currentQuantity < quantity) {
                return { success: false, error: 'Not enough of the asset' };
            }

            // Update portfolio
            const newQuantity = currentQuantity - quantity;
            if (newQuantity > 0) {
                portfolio[asset] = newQuantity;
            } else {
                delete portfolio[asset];
            }

            // Update cash
            const newCash = participantData.cash + value;

            // Update trade history
            const tradeHistory = participantData.tradeHistory || [];
            tradeHistory.push({
                asset: asset,
                action: 'sell',
                quantity: quantity,
                price: price,
                value: value,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Update participant
            await participantRef.update({
                portfolio: portfolio,
                cash: newCash,
                tradeHistory: tradeHistory,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return {
                success: true,
                data: {
                    asset: asset,
                    quantity: quantity,
                    price: price,
                    value: value,
                    newCash: newCash,
                    newQuantity: newQuantity
                }
            };
        } catch (error) {
            console.error('Error executing sell order:', error);
            return { success: false, error: error.message };
        }
    },

    // Get leaderboard
    getLeaderboard: async function() {
        try {
            if (!EconGames.SimpleAuth.isLoggedIn()) {
                return { success: false, error: 'You must be logged in to view the leaderboard' };
            }

            const session = EconGames.SimpleAuth.getSession();

            if (!session.gameSession) {
                return { success: false, error: 'No active game session' };
            }

            // Get session data
            const db = firebase.firestore();
            const sessionId = session.gameSession.id;

            // Get session for asset prices
            const sessionDoc = await db.collection('sessions').doc(sessionId).get();
            if (!sessionDoc.exists) {
                return { success: false, error: 'Session not found' };
            }

            const sessionData = sessionDoc.data();
            const assetPrices = sessionData.assetPrices || {};

            // Get all participants in this session
            const snapshot = await db.collection('participants')
                .where('sessionId', '==', sessionId)
                .get();

            if (snapshot.empty) {
                return { success: true, data: [] };
            }

            // Calculate portfolio values and create leaderboard entries
            const entries = [];

            snapshot.forEach(doc => {
                const participant = doc.data();
                const portfolio = participant.portfolio || {};

                // Calculate portfolio value
                let portfolioValue = 0;
                for (const [asset, quantity] of Object.entries(portfolio)) {
                    if (assetPrices[asset]) {
                        portfolioValue += assetPrices[asset] * quantity;
                    }
                }

                // Calculate total value
                const totalValue = portfolioValue + (participant.cash || 0);

                // Calculate return percentage
                const initialCash = 10000; // Initial cash amount
                const totalCashInjected = participant.totalCashInjected || 0;
                const returnPercentage = ((totalValue - initialCash) / initialCash) * 100;

                // Add to entries
                entries.push({
                    userId: participant.userId,
                    name: participant.name || 'Anonymous',
                    totalValue: totalValue,
                    returnPercentage: returnPercentage,
                    portfolioValue: portfolioValue,
                    cash: participant.cash || 0
                });
            });

            // Sort by total value (descending)
            entries.sort((a, b) => b.totalValue - a.totalValue);

            return { success: true, data: entries };
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            return { success: false, error: error.message };
        }
    }
};
