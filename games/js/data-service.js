// Data Service for Economics Games
// This service handles data operations for all games

// Ensure EconGames namespace exists
const EconGames = window.EconGames || {};

// Data Service
EconGames.DataService = {
    // Initialize
    init: function() {
        this.db = firebase.firestore();
        this.gamesCollection = this.db.collection('games');
        this.sessionsCollection = this.db.collection('sessions');
        this.participantsCollection = this.db.collection('participants');
        this.gameDataCollection = this.db.collection('gameData');
        
        console.log('Data Service initialized');
    },
    
    // Register a game
    registerGame: async function(gameData) {
        try {
            // Check if game already exists
            const snapshot = await this.gamesCollection
                .where('gameId', '==', gameData.gameId)
                .get();
            
            if (!snapshot.empty) {
                return { success: false, error: 'Game already registered' };
            }
            
            // Create new game document
            const gameRef = this.gamesCollection.doc(gameData.gameId);
            await gameRef.set({
                ...gameData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return { success: true, data: { id: gameRef.id } };
        } catch (error) {
            console.error('Error registering game:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Get game data
    getGame: async function(gameId) {
        try {
            const gameDoc = await this.gamesCollection.doc(gameId).get();
            
            if (!gameDoc.exists) {
                return { success: false, error: 'Game not found' };
            }
            
            return { success: true, data: gameDoc.data() };
        } catch (error) {
            console.error('Error getting game:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Create a participant record for a session
    createParticipant: async function(userId, sessionId, initialData = {}) {
        try {
            // Check if participant already exists
            const snapshot = await this.participantsCollection
                .where('userId', '==', userId)
                .where('sessionId', '==', sessionId)
                .get();
            
            if (!snapshot.empty) {
                return { success: false, error: 'Participant already exists' };
            }
            
            // Create new participant document
            const participantRef = this.participantsCollection.doc();
            const participantData = {
                id: participantRef.id,
                userId: userId,
                sessionId: sessionId,
                joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
                gameData: initialData
            };
            
            await participantRef.set(participantData);
            
            return { success: true, data: participantData };
        } catch (error) {
            console.error('Error creating participant:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Get participant data
    getParticipant: async function(userId, sessionId) {
        try {
            const snapshot = await this.participantsCollection
                .where('userId', '==', userId)
                .where('sessionId', '==', sessionId)
                .get();
            
            if (snapshot.empty) {
                return { success: false, error: 'Participant not found' };
            }
            
            const participantData = {
                id: snapshot.docs[0].id,
                ...snapshot.docs[0].data()
            };
            
            return { success: true, data: participantData };
        } catch (error) {
            console.error('Error getting participant:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Update participant data
    updateParticipant: async function(participantId, updateData) {
        try {
            await this.participantsCollection.doc(participantId).update({
                'gameData': updateData,
                'updatedAt': firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return { success: true };
        } catch (error) {
            console.error('Error updating participant:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Get all participants for a session
    getSessionParticipants: async function(sessionId) {
        try {
            const snapshot = await this.participantsCollection
                .where('sessionId', '==', sessionId)
                .get();
            
            const participants = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            return { success: true, data: participants };
        } catch (error) {
            console.error('Error getting session participants:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Save game data (for individual play)
    saveGameData: async function(userId, gameId, gameData) {
        try {
            // Check if game data already exists
            const snapshot = await this.gameDataCollection
                .where('userId', '==', userId)
                .where('gameId', '==', gameId)
                .get();
            
            if (snapshot.empty) {
                // Create new game data document
                const gameDataRef = this.gameDataCollection.doc();
                await gameDataRef.set({
                    id: gameDataRef.id,
                    userId: userId,
                    gameId: gameId,
                    data: gameData,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            } else {
                // Update existing game data
                await this.gameDataCollection.doc(snapshot.docs[0].id).update({
                    'data': gameData,
                    'updatedAt': firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error saving game data:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Get game data (for individual play)
    getGameData: async function(userId, gameId) {
        try {
            const snapshot = await this.gameDataCollection
                .where('userId', '==', userId)
                .where('gameId', '==', gameId)
                .get();
            
            if (snapshot.empty) {
                return { success: false, error: 'Game data not found' };
            }
            
            const gameData = {
                id: snapshot.docs[0].id,
                ...snapshot.docs[0].data()
            };
            
            return { success: true, data: gameData };
        } catch (error) {
            console.error('Error getting game data:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Save leaderboard entry
    saveLeaderboardEntry: async function(gameId, userData, score, sessionId = null) {
        try {
            const leaderboardRef = this.db.collection('leaderboards').doc(gameId);
            
            // Get current leaderboard
            const leaderboardDoc = await leaderboardRef.get();
            
            let entries = [];
            if (leaderboardDoc.exists) {
                entries = leaderboardDoc.data().entries || [];
            }
            
            // Create new entry
            const newEntry = {
                id: EconGames.FirebaseCore.generateId(),
                userId: userData.id,
                name: userData.name,
                score: score,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Add session ID if provided
            if (sessionId) {
                newEntry.sessionId = sessionId;
            }
            
            // Add to entries
            entries.push(newEntry);
            
            // Sort by score (descending)
            entries.sort((a, b) => b.score - a.score);
            
            // Keep only top 100 entries
            if (entries.length > 100) {
                entries = entries.slice(0, 100);
            }
            
            // Save to Firestore
            await leaderboardRef.set({
                entries: entries,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            return { success: true, data: { rank: entries.findIndex(e => e.id === newEntry.id) + 1 } };
        } catch (error) {
            console.error('Error saving leaderboard entry:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Get leaderboard
    getLeaderboard: async function(gameId, sessionId = null) {
        try {
            const leaderboardRef = this.db.collection('leaderboards').doc(gameId);
            const leaderboardDoc = await leaderboardRef.get();
            
            if (!leaderboardDoc.exists) {
                return { success: true, data: [] };
            }
            
            let entries = leaderboardDoc.data().entries || [];
            
            // Filter by session if provided
            if (sessionId) {
                entries = entries.filter(entry => entry.sessionId === sessionId);
            }
            
            return { success: true, data: entries };
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Reset leaderboard (admin only)
    resetLeaderboard: async function(gameId) {
        try {
            // Check if user is admin (implement your own admin check)
            const isAdmin = EconGames.AuthService && 
                            EconGames.AuthService.isLoggedIn() && 
                            EconGames.AuthService.getSession().role === 'ta';
            
            if (!isAdmin) {
                return { success: false, error: 'Only admins can reset leaderboards' };
            }
            
            const leaderboardRef = this.db.collection('leaderboards').doc(gameId);
            
            await leaderboardRef.set({
                entries: [],
                resetAt: firebase.firestore.FieldValue.serverTimestamp(),
                resetBy: EconGames.AuthService.getSession().userId
            });
            
            return { success: true };
        } catch (error) {
            console.error('Error resetting leaderboard:', error);
            return { success: false, error: error.message };
        }
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize data service
    EconGames.DataService.init();
});
