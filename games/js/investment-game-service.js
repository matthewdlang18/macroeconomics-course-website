// Investment Odyssey Game Service
// This service provides game-specific functionality for the Investment Odyssey game

// Ensure EconGames namespace exists
window.EconGames = window.EconGames || {};

// Investment Odyssey Game Service
EconGames.InvestmentGame = {
    // Game ID
    gameId: 'investment-odyssey',

    // Game configuration
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
            variability: 500 // +/- this amount
        }
    },

    // Initialize
    init: function() {
        try {
            this.db = firebase.firestore();

            // Check if centralized data service is available
            if (typeof EconGames.DataService !== 'undefined' && EconGames.DataService) {
                console.log('Using centralized data service');
                this.usesCentralizedData = true;

                // Register game with centralized service if not already registered
                this.registerGame();
            } else {
                console.log('Centralized data service not available, using local collections');
                this.usesCentralizedData = false;

                // Set up local collections
                this.sessionsCollection = this.db.collection('investmentGameSessions');
                this.participantsCollection = this.db.collection('investmentGameParticipants');
                this.leaderboardCollection = this.db.collection('investmentGameLeaderboard');
            }

            console.log('Investment Game Service initialized');
        } catch (error) {
            console.error('Error initializing Investment Game Service:', error);
        }
    },

    // Register game with centralized service
    registerGame: async function() {
        if (!this.usesCentralizedData) return;

        try {
            // Check if game is already registered
            const gameResult = await EconGames.DataService.getGame(this.gameId);

            if (!gameResult.success) {
                // Register game
                await EconGames.DataService.registerGame({
                    gameId: this.gameId,
                    name: 'Investment Odyssey',
                    description: 'Manage an investment portfolio and navigate market volatility.',
                    config: this.config
                });

                console.log('Game registered with centralized service');
            }
        } catch (error) {
            console.error('Error registering game:', error);
        }
    },

    // Create a new game session (TA only)
    createSession: async function(sessionName) {
        try {
            if (this.usesCentralizedData) {
                // Use centralized service
                return await EconGames.DataService.createSession(this.gameId, sessionName);
            } else {
                // Use local collections
                const sessionRef = this.sessionsCollection.doc();
                const sessionData = {
                    id: sessionRef.id,
                    name: sessionName,
                    gameId: this.gameId,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    roundNumber: 0,
                    active: true,
                    assetPrices: { ...this.config.baseAssetPrices },
                    priceHistory: {},
                    totalCashInjected: 0
                };

                await sessionRef.set(sessionData);

                return { success: true, data: sessionData };
            }
        } catch (error) {
            console.error('Error creating session:', error);
            return { success: false, error: error.message };
        }
    },

    // Get session data
    getSession: async function(sessionId) {
        try {
            if (this.usesCentralizedData) {
                // Use centralized service
                return await EconGames.DataService.getSession(sessionId);
            } else {
                // Use local collections
                const sessionDoc = await this.sessionsCollection.doc(sessionId).get();

                if (!sessionDoc.exists) {
                    return { success: false, error: 'Session not found' };
                }

                return { success: true, data: { id: sessionDoc.id, ...sessionDoc.data() } };
            }
        } catch (error) {
            console.error('Error getting session:', error);
            return { success: false, error: error.message };
        }
    },

    // Join a session
    joinSession: async function(sessionId) {
        try {
            // Check if user is logged in
            if (!EconGames.SimpleAuth.isLoggedIn()) {
                return { success: false, error: 'User not logged in' };
            }

            const session = EconGames.SimpleAuth.getSession();

            if (this.usesCentralizedData) {
                // Use centralized service
                const result = await EconGames.DataService.createParticipant(session.userId, sessionId, {
                    cash: this.config.initialCash,
                    portfolio: {},
                    tradeHistory: []
                });

                return result;
            } else {
                // Use local collections
                // Check if participant already exists
                const snapshot = await this.participantsCollection
                    .where('userId', '==', session.userId)
                    .where('sessionId', '==', sessionId)
                    .get();

                if (!snapshot.empty) {
                    return { success: true, data: { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } };
                }

                // Create new participant
                const participantRef = this.participantsCollection.doc();
                const participantData = {
                    id: participantRef.id,
                    userId: session.userId,
                    sessionId: sessionId,
                    name: session.name,
                    cash: this.config.initialCash,
                    portfolio: {},
                    tradeHistory: [],
                    joinedAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                await participantRef.set(participantData);

                return { success: true, data: participantData };
            }
        } catch (error) {
            console.error('Error joining session:', error);
            return { success: false, error: error.message };
        }
    },

    // Get participant data
    getParticipant: async function(sessionId) {
        try {
            // Check if user is logged in
            if (!EconGames.SimpleAuth.isLoggedIn()) {
                return { success: false, error: 'User not logged in' };
            }

            const session = EconGames.SimpleAuth.getSession();

            if (this.usesCentralizedData) {
                // Use centralized service
                return await EconGames.DataService.getParticipant(session.userId, sessionId);
            } else {
                // Use local collections
                const snapshot = await this.participantsCollection
                    .where('userId', '==', session.userId)
                    .where('sessionId', '==', sessionId)
                    .get();

                if (snapshot.empty) {
                    return { success: false, error: 'Participant not found' };
                }

                return { success: true, data: { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } };
            }
        } catch (error) {
            console.error('Error getting participant:', error);
            return { success: false, error: error.message };
        }
    },

    // Get all participants for a session
    getSessionParticipants: async function(sessionId) {
        try {
            if (this.usesCentralizedData) {
                // Use centralized service
                return await EconGames.DataService.getSessionParticipants(sessionId);
            } else {
                // Use local collections
                const snapshot = await this.participantsCollection
                    .where('sessionId', '==', sessionId)
                    .get();

                const participants = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                return { success: true, data: participants };
            }
        } catch (error) {
            console.error('Error getting session participants:', error);
            return { success: false, error: error.message };
        }
    },

    // Advance to next round (TA only)
    advanceToNextRound: async function(sessionId) {
        try {
            // Get session data
            const sessionResult = await this.getSession(sessionId);

            if (!sessionResult.success) {
                return sessionResult;
            }

            const sessionData = sessionResult.data;

            // Check if game is already at max rounds
            if (sessionData.roundNumber >= this.config.maxRounds) {
                return { success: false, error: 'Game has reached the maximum number of rounds' };
            }

            // Generate new asset prices
            const newPrices = this.generateNewAssetPrices(sessionData.assetPrices);

            // Generate cash injection
            const cashInjection = this.generateCashInjection();

            // Update price history
            const priceHistory = sessionData.priceHistory || {};
            for (const [asset, price] of Object.entries(sessionData.assetPrices)) {
                if (!priceHistory[asset]) {
                    priceHistory[asset] = [];
                }
                priceHistory[asset].push(price);
            }

            // Update session data
            const updatedSessionData = {
                roundNumber: sessionData.roundNumber + 1,
                assetPrices: newPrices,
                priceHistory: priceHistory,
                totalCashInjected: (sessionData.totalCashInjected || 0) + cashInjection,
                lastCashInjection: cashInjection,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (this.usesCentralizedData) {
                // Use centralized service
                await EconGames.DataService.updateSession(sessionId, updatedSessionData);
            } else {
                // Use local collections
                await this.sessionsCollection.doc(sessionId).update(updatedSessionData);
            }

            // Update all participants with cash injection
            const participantsResult = await this.getSessionParticipants(sessionId);

            if (participantsResult.success) {
                const participants = participantsResult.data;

                for (const participant of participants) {
                    const newCash = participant.cash + cashInjection;

                    if (this.usesCentralizedData) {
                        // Use centralized service
                        await EconGames.DataService.updateParticipant(participant.id, {
                            ...participant,
                            cash: newCash,
                            cashInjectionHistory: [...(participant.cashInjectionHistory || []), cashInjection]
                        });
                    } else {
                        // Use local collections
                        await this.participantsCollection.doc(participant.id).update({
                            cash: newCash,
                            cashInjectionHistory: firebase.firestore.FieldValue.arrayUnion(cashInjection)
                        });
                    }
                }
            }

            return {
                success: true,
                data: {
                    roundNumber: sessionData.roundNumber + 1,
                    assetPrices: newPrices,
                    cashInjection: cashInjection
                }
            };
        } catch (error) {
            console.error('Error advancing to next round:', error);
            return { success: false, error: error.message };
        }
    },

    // Generate new asset prices based on previous prices
    generateNewAssetPrices: function(previousPrices) {
        const newPrices = {};

        for (const [asset, price] of Object.entries(previousPrices)) {
            const returns = this.config.assetReturns[asset];

            if (!returns) {
                newPrices[asset] = price;
                continue;
            }

            // Generate random return using normal distribution
            let randomReturn;
            do {
                // Box-Muller transform for normal distribution
                const u1 = Math.random();
                const u2 = Math.random();
                const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

                // Apply mean and standard deviation
                randomReturn = returns.mean + returns.stdDev * z;

                // Ensure return is within bounds
            } while (randomReturn < returns.min || randomReturn > returns.max);

            // Apply return to price
            newPrices[asset] = price * (1 + randomReturn);
        }

        return newPrices;
    },

    // Generate cash injection
    generateCashInjection: function() {
        const base = this.config.cashInjection.baseAmount;
        const variability = this.config.cashInjection.variability;

        // Random amount between base-variability and base+variability
        return base + (Math.random() * 2 - 1) * variability;
    },

    // Execute buy order
    executeBuy: async function(sessionId, asset, quantity) {
        try {
            // Check if user is logged in
            if (!EconGames.SimpleAuth.isLoggedIn()) {
                return { success: false, error: 'User not logged in' };
            }

            // Get session data
            const sessionResult = await this.getSession(sessionId);

            if (!sessionResult.success) {
                return sessionResult;
            }

            const sessionData = sessionResult.data;

            // Get participant data
            const participantResult = await this.getParticipant(sessionId);

            if (!participantResult.success) {
                return participantResult;
            }

            const participantData = participantResult.data;

            // Check if asset exists
            if (!sessionData.assetPrices[asset]) {
                return { success: false, error: 'Asset not found' };
            }

            // Calculate cost
            const price = sessionData.assetPrices[asset];
            const cost = price * quantity;

            // Check if participant has enough cash
            if (participantData.cash < cost) {
                return { success: false, error: 'Insufficient funds' };
            }

            // Update portfolio
            const portfolio = participantData.portfolio || {};
            portfolio[asset] = (portfolio[asset] || 0) + quantity;

            // Update cash
            const newCash = participantData.cash - cost;

            // Add to trade history
            const tradeHistory = participantData.tradeHistory || [];
            tradeHistory.push({
                timestamp: new Date().toISOString(),
                asset: asset,
                action: 'buy',
                quantity: quantity,
                price: price,
                totalValue: cost,
                roundNumber: sessionData.roundNumber
            });

            // Update participant data
            const updatedParticipantData = {
                ...participantData,
                cash: newCash,
                portfolio: portfolio,
                tradeHistory: tradeHistory
            };

            if (this.usesCentralizedData) {
                // Use centralized service
                await EconGames.DataService.updateParticipant(participantData.id, updatedParticipantData);
            } else {
                // Use local collections
                await this.participantsCollection.doc(participantData.id).update({
                    cash: newCash,
                    portfolio: portfolio,
                    tradeHistory: firebase.firestore.FieldValue.arrayUnion({
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        asset: asset,
                        action: 'buy',
                        quantity: quantity,
                        price: price,
                        totalValue: cost,
                        roundNumber: sessionData.roundNumber
                    })
                });
            }

            return {
                success: true,
                data: {
                    newCash: newCash,
                    portfolio: portfolio
                }
            };
        } catch (error) {
            console.error('Error executing buy order:', error);
            return { success: false, error: error.message };
        }
    },

    // Execute sell order
    executeSell: async function(sessionId, asset, quantity) {
        try {
            // Check if user is logged in
            if (!EconGames.SimpleAuth.isLoggedIn()) {
                return { success: false, error: 'User not logged in' };
            }

            // Get session data
            const sessionResult = await this.getSession(sessionId);

            if (!sessionResult.success) {
                return sessionResult;
            }

            const sessionData = sessionResult.data;

            // Get participant data
            const participantResult = await this.getParticipant(sessionId);

            if (!participantResult.success) {
                return participantResult;
            }

            const participantData = participantResult.data;

            // Check if asset exists
            if (!sessionData.assetPrices[asset]) {
                return { success: false, error: 'Asset not found' };
            }

            // Check if participant has enough of the asset
            const portfolio = participantData.portfolio || {};
            if (!portfolio[asset] || portfolio[asset] < quantity) {
                return { success: false, error: 'Insufficient assets' };
            }

            // Calculate value
            const price = sessionData.assetPrices[asset];
            const value = price * quantity;

            // Update portfolio
            portfolio[asset] -= quantity;
            if (portfolio[asset] === 0) {
                delete portfolio[asset];
            }

            // Update cash
            const newCash = participantData.cash + value;

            // Add to trade history
            const tradeHistory = participantData.tradeHistory || [];
            tradeHistory.push({
                timestamp: new Date().toISOString(),
                asset: asset,
                action: 'sell',
                quantity: quantity,
                price: price,
                totalValue: value,
                roundNumber: sessionData.roundNumber
            });

            // Update participant data
            const updatedParticipantData = {
                ...participantData,
                cash: newCash,
                portfolio: portfolio,
                tradeHistory: tradeHistory
            };

            if (this.usesCentralizedData) {
                // Use centralized service
                await EconGames.DataService.updateParticipant(participantData.id, updatedParticipantData);
            } else {
                // Use local collections
                await this.participantsCollection.doc(participantData.id).update({
                    cash: newCash,
                    portfolio: portfolio,
                    tradeHistory: firebase.firestore.FieldValue.arrayUnion({
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        asset: asset,
                        action: 'sell',
                        quantity: quantity,
                        price: price,
                        totalValue: value,
                        roundNumber: sessionData.roundNumber
                    })
                });
            }

            return {
                success: true,
                data: {
                    newCash: newCash,
                    portfolio: portfolio
                }
            };
        } catch (error) {
            console.error('Error executing sell order:', error);
            return { success: false, error: error.message };
        }
    },

    // Calculate portfolio value
    calculatePortfolioValue: function(portfolio, assetPrices) {
        let value = 0;

        for (const [asset, quantity] of Object.entries(portfolio)) {
            if (assetPrices[asset]) {
                value += assetPrices[asset] * quantity;
            }
        }

        return value;
    },

    // Update leaderboard
    updateLeaderboard: async function(sessionId) {
        try {
            // Get session data
            const sessionResult = await this.getSession(sessionId);

            if (!sessionResult.success) {
                return sessionResult;
            }

            const sessionData = sessionResult.data;

            // Get all participants
            const participantsResult = await this.getSessionParticipants(sessionId);

            if (!participantsResult.success) {
                return participantsResult;
            }

            const participants = participantsResult.data;

            // Calculate portfolio values and create leaderboard entries
            const leaderboardEntries = participants.map(participant => {
                const portfolioValue = this.calculatePortfolioValue(participant.portfolio || {}, sessionData.assetPrices);
                const totalValue = portfolioValue + participant.cash;

                // Calculate total cash injected for this participant
                const totalCashInjected = (participant.cashInjectionHistory || []).reduce((sum, injection) => sum + injection, 0);

                // Calculate return percentage
                const initialCash = this.config.initialCash;
                const returnPercentage = ((totalValue - initialCash - totalCashInjected) / initialCash) * 100;

                return {
                    userId: participant.userId,
                    name: participant.name,
                    cash: participant.cash,
                    portfolioValue: portfolioValue,
                    totalValue: totalValue,
                    totalCashInjected: totalCashInjected,
                    returnPercentage: returnPercentage
                };
            });

            // Sort by total value (descending)
            leaderboardEntries.sort((a, b) => b.totalValue - a.totalValue);

            if (this.usesCentralizedData) {
                // Use centralized service
                await EconGames.DataService.updateLeaderboard(this.gameId, sessionId, leaderboardEntries);
            } else {
                // Use local collections
                const leaderboardRef = this.leaderboardCollection.doc(sessionId);
                await leaderboardRef.set({
                    entries: leaderboardEntries,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            return { success: true, data: leaderboardEntries };
        } catch (error) {
            console.error('Error updating leaderboard:', error);
            return { success: false, error: error.message };
        }
    },

    // Get leaderboard
    getLeaderboard: async function(sessionId) {
        try {
            if (this.usesCentralizedData) {
                // Use centralized service
                return await EconGames.DataService.getLeaderboard(this.gameId, sessionId);
            } else {
                // Use local collections
                const leaderboardDoc = await this.leaderboardCollection.doc(sessionId).get();

                if (!leaderboardDoc.exists) {
                    return { success: true, data: [] };
                }

                return { success: true, data: leaderboardDoc.data().entries || [] };
            }
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            return { success: false, error: error.message };
        }
    },

    // Reset leaderboard (TA only)
    resetLeaderboard: async function(sessionId) {
        try {
            // Check if user is a TA
            if (!EconGames.SimpleAuth.isTA()) {
                return { success: false, error: 'Only TAs can reset leaderboards' };
            }

            if (this.usesCentralizedData) {
                // Use centralized service
                return await EconGames.DataService.resetLeaderboard(this.gameId, sessionId);
            } else {
                // Use local collections
                await this.leaderboardCollection.doc(sessionId).set({
                    entries: [],
                    resetAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                return { success: true };
            }
        } catch (error) {
            console.error('Error resetting leaderboard:', error);
            return { success: false, error: error.message };
        }
    },

    // Save single player game data
    saveSinglePlayerGame: async function(gameData) {
        try {
            // Check if user is logged in
            if (!EconGames.SimpleAuth.isLoggedIn()) {
                // Store in localStorage for guest play
                localStorage.setItem('investmentGameSinglePlayer', JSON.stringify(gameData));
                return { success: true };
            }

            const session = EconGames.SimpleAuth.getSession();

            if (this.usesCentralizedData) {
                // Use centralized service
                return await EconGames.DataService.saveGameData(session.userId, this.gameId, gameData);
            } else {
                // Use local collections
                const gameDataRef = this.db.collection('investmentGameSinglePlayer').doc(session.userId);
                await gameDataRef.set({
                    userId: session.userId,
                    name: session.name,
                    gameData: gameData,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

                return { success: true };
            }
        } catch (error) {
            console.error('Error saving single player game:', error);
            return { success: false, error: error.message };
        }
    },

    // Load single player game data
    loadSinglePlayerGame: async function() {
        try {
            // Check if user is logged in
            if (!EconGames.SimpleAuth.isLoggedIn()) {
                // Load from localStorage for guest play
                const gameData = localStorage.getItem('investmentGameSinglePlayer');
                return { success: true, data: gameData ? JSON.parse(gameData) : null };
            }

            const session = EconGames.SimpleAuth.getSession();

            if (this.usesCentralizedData) {
                // Use centralized service
                return await EconGames.DataService.getGameData(session.userId, this.gameId);
            } else {
                // Use local collections
                const gameDataDoc = await this.db.collection('investmentGameSinglePlayer').doc(session.userId).get();

                if (!gameDataDoc.exists) {
                    return { success: true, data: null };
                }

                return { success: true, data: gameDataDoc.data().gameData };
            }
        } catch (error) {
            console.error('Error loading single player game:', error);
            return { success: false, error: error.message };
        }
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize investment game service
    EconGames.InvestmentGame.init();
});
