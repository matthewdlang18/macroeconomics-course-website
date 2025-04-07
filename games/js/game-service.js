// Game Service for Economics Games
// This file provides game-related functionality

// Ensure EconGames namespace exists
window.EconGames = window.EconGames || {};

// Game Service
EconGames.Game = {
  // Initialize game service
  init: function() {
    console.log('Game service initialized');
  },
  
  // Get all sections for a TA
  getTASections: async function(taId) {
    try {
      const snapshot = await EconGames.Firebase.db.collection('sections')
        .where('taId', '==', taId)
        .get();
      
      const sections = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return { success: true, data: sections };
    } catch (error) {
      console.error('Error getting TA sections:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Get active game sessions for a section
  getSectionSessions: async function(sectionId) {
    try {
      const snapshot = await EconGames.Firebase.db.collection('gameSessions')
        .where('sectionId', '==', sectionId)
        .where('active', '==', true)
        .get();
      
      const sessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return { success: true, data: sessions };
    } catch (error) {
      console.error('Error getting section sessions:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Create a new game session
  createGameSession: async function(gameId, sectionId, name) {
    try {
      // Generate join code
      const joinCode = EconGames.Firebase.generateJoinCode();
      
      // Get current user
      const session = EconGames.Auth.getSession();
      
      if (!session || session.role !== 'ta') {
        return { success: false, error: 'Only TAs can create game sessions' };
      }
      
      // Create game session
      const gameSessionRef = EconGames.Firebase.db.collection('gameSessions').doc();
      
      // Initial game data
      let gameData = {};
      
      // Set game-specific initial data
      if (gameId === 'investment-odyssey') {
        gameData = {
          roundNumber: 0,
          assetPrices: {
            'S&P 500': 5000,
            'Bonds': 1000,
            'Real Estate': 2000,
            'Gold': 1800,
            'Commodities': 1000,
            'Bitcoin': 50000
          },
          priceHistory: {},
          totalCashInjected: 0
        };
      }
      
      // Create session document
      await gameSessionRef.set({
        id: gameSessionRef.id,
        gameId: gameId,
        sectionId: sectionId,
        name: name,
        joinCode: joinCode,
        active: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdBy: session.userId,
        gameData: gameData
      });
      
      // Create empty leaderboard
      await EconGames.Firebase.db.collection('leaderboards').doc(gameSessionRef.id).set({
        gameId: gameId,
        sessionId: gameSessionRef.id,
        entries: [],
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      return {
        success: true,
        data: {
          id: gameSessionRef.id,
          gameId: gameId,
          sectionId: sectionId,
          name: name,
          joinCode: joinCode
        }
      };
    } catch (error) {
      console.error('Error creating game session:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Get game session by ID
  getGameSession: async function(sessionId) {
    try {
      const doc = await EconGames.Firebase.db.collection('gameSessions').doc(sessionId).get();
      
      if (!doc.exists) {
        return { success: false, error: 'Game session not found' };
      }
      
      return { success: true, data: { id: doc.id, ...doc.data() } };
    } catch (error) {
      console.error('Error getting game session:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Initialize game session (reset to round 0)
  initializeGameSession: async function(sessionId) {
    try {
      // Get session
      const sessionResult = await this.getGameSession(sessionId);
      
      if (!sessionResult.success) {
        return sessionResult;
      }
      
      const sessionData = sessionResult.data;
      
      // Check if user is the TA for this session
      const session = EconGames.Auth.getSession();
      
      if (!session || session.role !== 'ta') {
        return { success: false, error: 'Only TAs can initialize game sessions' };
      }
      
      // Reset game data
      let gameData = {};
      
      // Set game-specific initial data
      if (sessionData.gameId === 'investment-odyssey') {
        gameData = {
          roundNumber: 0,
          assetPrices: {
            'S&P 500': 5000,
            'Bonds': 1000,
            'Real Estate': 2000,
            'Gold': 1800,
            'Commodities': 1000,
            'Bitcoin': 50000
          },
          priceHistory: {},
          totalCashInjected: 0
        };
      }
      
      // Update session
      await EconGames.Firebase.db.collection('gameSessions').doc(sessionId).update({
        gameData: gameData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Reset all participants
      const participantsSnapshot = await EconGames.Firebase.db.collection('participants')
        .where('sessionId', '==', sessionId)
        .get();
      
      const batch = EconGames.Firebase.db.batch();
      
      participantsSnapshot.forEach(doc => {
        batch.update(doc.ref, {
          cash: 10000,
          portfolio: {},
          tradeHistory: [],
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      });
      
      await batch.commit();
      
      // Reset leaderboard
      await EconGames.Firebase.db.collection('leaderboards').doc(sessionId).update({
        entries: [],
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true, data: { id: sessionId, gameData: gameData } };
    } catch (error) {
      console.error('Error initializing game session:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Advance game session to next round
  advanceGameSession: async function(sessionId) {
    try {
      // Get session
      const sessionResult = await this.getGameSession(sessionId);
      
      if (!sessionResult.success) {
        return sessionResult;
      }
      
      const sessionData = sessionResult.data;
      
      // Check if user is the TA for this session
      const session = EconGames.Auth.getSession();
      
      if (!session || session.role !== 'ta') {
        return { success: false, error: 'Only TAs can advance game sessions' };
      }
      
      // Get game data
      const gameData = sessionData.gameData || {};
      
      // Handle game-specific logic
      if (sessionData.gameId === 'investment-odyssey') {
        // Get current round
        const currentRound = gameData.roundNumber || 0;
        const nextRound = currentRound + 1;
        
        // Check if we've reached the maximum number of rounds
        if (nextRound > 20) {
          return { success: false, error: 'Maximum number of rounds reached' };
        }
        
        // Get current asset prices
        const assetPrices = gameData.assetPrices || {
          'S&P 500': 5000,
          'Bonds': 1000,
          'Real Estate': 2000,
          'Gold': 1800,
          'Commodities': 1000,
          'Bitcoin': 50000
        };
        
        // Get price history
        const priceHistory = gameData.priceHistory || {};
        
        // Update price history
        for (const [asset, price] of Object.entries(assetPrices)) {
          if (!priceHistory[asset]) {
            priceHistory[asset] = [];
          }
          priceHistory[asset].push(price);
        }
        
        // Generate new asset prices
        const newPrices = {};
        
        // Asset returns configuration
        const assetReturns = {
          'S&P 500': { mean: 0.1151, stdDev: 0.1949, min: -0.43, max: 0.50 },
          'Bonds': { mean: 0.0334, stdDev: 0.0301, min: 0.0003, max: 0.14 },
          'Real Estate': { mean: 0.0439, stdDev: 0.062, min: -0.12, max: 0.24 },
          'Gold': { mean: 0.0648, stdDev: 0.2076, min: -0.32, max: 1.25 },
          'Commodities': { mean: 0.0815, stdDev: 0.1522, min: -0.25, max: 2.00 },
          'Bitcoin': { mean: 0.50, stdDev: 1.00, min: -0.73, max: 4.50 }
        };
        
        // Generate new prices
        for (const [asset, price] of Object.entries(assetPrices)) {
          const returns = assetReturns[asset];
          
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
        
        // Generate cash injection
        const baseAmount = 2500;
        const variability = 500;
        const cashInjection = baseAmount + (Math.random() * 2 - 1) * variability;
        
        // Update game data
        const updatedGameData = {
          ...gameData,
          roundNumber: nextRound,
          assetPrices: newPrices,
          priceHistory: priceHistory,
          totalCashInjected: (gameData.totalCashInjected || 0) + cashInjection,
          lastCashInjection: cashInjection
        };
        
        // Update session
        await EconGames.Firebase.db.collection('gameSessions').doc(sessionId).update({
          gameData: updatedGameData,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Update all participants with cash injection
        const participantsSnapshot = await EconGames.Firebase.db.collection('participants')
          .where('sessionId', '==', sessionId)
          .get();
        
        const batch = EconGames.Firebase.db.batch();
        
        participantsSnapshot.forEach(doc => {
          const participant = doc.data();
          const newCash = (participant.cash || 0) + cashInjection;
          
          batch.update(doc.ref, {
            cash: newCash,
            totalCashInjected: (participant.totalCashInjected || 0) + cashInjection,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        });
        
        await batch.commit();
        
        // Update leaderboard
        await this.updateLeaderboard(sessionId);
        
        return { success: true, data: { id: sessionId, gameData: updatedGameData } };
      }
      
      return { success: false, error: 'Unsupported game type' };
    } catch (error) {
      console.error('Error advancing game session:', error);
      return { success: false, error: error.message };
    }
  },
  
  // End game session
  endGameSession: async function(sessionId) {
    try {
      // Check if user is the TA for this session
      const session = EconGames.Auth.getSession();
      
      if (!session || session.role !== 'ta') {
        return { success: false, error: 'Only TAs can end game sessions' };
      }
      
      // Update session
      await EconGames.Firebase.db.collection('gameSessions').doc(sessionId).update({
        active: false,
        endedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Update leaderboard one last time
      await this.updateLeaderboard(sessionId);
      
      return { success: true };
    } catch (error) {
      console.error('Error ending game session:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Get participant data
  getParticipant: async function(sessionId, userId) {
    try {
      const snapshot = await EconGames.Firebase.db.collection('participants')
        .where('sessionId', '==', sessionId)
        .where('userId', '==', userId)
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return { success: false, error: 'Participant not found' };
      }
      
      return { success: true, data: { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } };
    } catch (error) {
      console.error('Error getting participant:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Get all participants for a session
  getSessionParticipants: async function(sessionId) {
    try {
      const snapshot = await EconGames.Firebase.db.collection('participants')
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
  
  // Execute buy order
  executeBuy: async function(sessionId, userId, asset, quantity) {
    try {
      // Get session
      const sessionResult = await this.getGameSession(sessionId);
      
      if (!sessionResult.success) {
        return sessionResult;
      }
      
      const sessionData = sessionResult.data;
      const gameData = sessionData.gameData || {};
      const assetPrices = gameData.assetPrices || {};
      
      // Check if asset exists
      if (!assetPrices[asset]) {
        return { success: false, error: 'Asset not found' };
      }
      
      // Get participant
      const participantResult = await this.getParticipant(sessionId, userId);
      
      if (!participantResult.success) {
        return participantResult;
      }
      
      const participantData = participantResult.data;
      
      // Calculate cost
      const price = assetPrices[asset];
      const cost = price * quantity;
      
      // Check if participant has enough cash
      if (participantData.cash < cost) {
        return { success: false, error: 'Not enough cash' };
      }
      
      // Update portfolio
      const portfolio = participantData.portfolio || {};
      const currentQuantity = portfolio[asset] || 0;
      const newQuantity = currentQuantity + quantity;
      
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
      await EconGames.Firebase.db.collection('participants').doc(participantData.id).update({
        portfolio: portfolio,
        cash: newCash,
        tradeHistory: tradeHistory,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Update leaderboard
      await this.updateLeaderboard(sessionId);
      
      return { success: true, data: { asset, quantity, price, cost, newCash, newQuantity } };
    } catch (error) {
      console.error('Error executing buy order:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Execute sell order
  executeSell: async function(sessionId, userId, asset, quantity) {
    try {
      // Get session
      const sessionResult = await this.getGameSession(sessionId);
      
      if (!sessionResult.success) {
        return sessionResult;
      }
      
      const sessionData = sessionResult.data;
      const gameData = sessionData.gameData || {};
      const assetPrices = gameData.assetPrices || {};
      
      // Check if asset exists
      if (!assetPrices[asset]) {
        return { success: false, error: 'Asset not found' };
      }
      
      // Get participant
      const participantResult = await this.getParticipant(sessionId, userId);
      
      if (!participantResult.success) {
        return participantResult;
      }
      
      const participantData = participantResult.data;
      
      // Check if participant has enough of the asset
      const portfolio = participantData.portfolio || {};
      const currentQuantity = portfolio[asset] || 0;
      
      if (currentQuantity < quantity) {
        return { success: false, error: 'Not enough of the asset' };
      }
      
      // Calculate value
      const price = assetPrices[asset];
      const value = price * quantity;
      
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
      await EconGames.Firebase.db.collection('participants').doc(participantData.id).update({
        portfolio: portfolio,
        cash: newCash,
        tradeHistory: tradeHistory,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Update leaderboard
      await this.updateLeaderboard(sessionId);
      
      return { success: true, data: { asset, quantity, price, value, newCash, newQuantity } };
    } catch (error) {
      console.error('Error executing sell order:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Update leaderboard
  updateLeaderboard: async function(sessionId) {
    try {
      // Get session
      const sessionResult = await this.getGameSession(sessionId);
      
      if (!sessionResult.success) {
        return sessionResult;
      }
      
      const sessionData = sessionResult.data;
      const gameData = sessionData.gameData || {};
      const assetPrices = gameData.assetPrices || {};
      
      // Get all participants
      const participantsResult = await this.getSessionParticipants(sessionId);
      
      if (!participantsResult.success) {
        return participantsResult;
      }
      
      const participants = participantsResult.data;
      
      // Calculate portfolio values and create leaderboard entries
      const entries = [];
      
      for (const participant of participants) {
        // Calculate portfolio value
        let portfolioValue = 0;
        const portfolio = participant.portfolio || {};
        
        for (const [asset, quantity] of Object.entries(portfolio)) {
          if (assetPrices[asset]) {
            portfolioValue += assetPrices[asset] * quantity;
          }
        }
        
        // Calculate total value
        const totalValue = portfolioValue + (participant.cash || 0);
        
        // Calculate return percentage
        const initialCash = 10000;
        const totalCashInjected = participant.totalCashInjected || 0;
        const totalInvested = initialCash + totalCashInjected;
        const returnPercentage = ((totalValue - totalInvested) / initialCash) * 100;
        
        // Add to entries
        entries.push({
          userId: participant.userId,
          name: participant.name,
          portfolioValue: portfolioValue,
          cash: participant.cash,
          totalValue: totalValue,
          totalCashInjected: totalCashInjected,
          returnPercentage: returnPercentage,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      
      // Sort by total value (descending)
      entries.sort((a, b) => b.totalValue - a.totalValue);
      
      // Update leaderboard
      await EconGames.Firebase.db.collection('leaderboards').doc(sessionId).update({
        entries: entries,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true, data: entries };
    } catch (error) {
      console.error('Error updating leaderboard:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Get leaderboard
  getLeaderboard: async function(sessionId) {
    try {
      const doc = await EconGames.Firebase.db.collection('leaderboards').doc(sessionId).get();
      
      if (!doc.exists) {
        return { success: false, error: 'Leaderboard not found' };
      }
      
      const data = doc.data();
      
      return { success: true, data: data.entries || [] };
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Get single player leaderboard
  getSinglePlayerLeaderboard: async function(gameId) {
    try {
      const doc = await EconGames.Firebase.db.collection('leaderboards').doc(`${gameId}-singleplayer`).get();
      
      if (!doc.exists) {
        // Create leaderboard if it doesn't exist
        await EconGames.Firebase.db.collection('leaderboards').doc(`${gameId}-singleplayer`).set({
          gameId: gameId,
          sessionId: 'singleplayer',
          entries: [],
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        return { success: true, data: [] };
      }
      
      const data = doc.data();
      
      return { success: true, data: data.entries || [] };
    } catch (error) {
      console.error('Error getting single player leaderboard:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Add entry to single player leaderboard
  addToSinglePlayerLeaderboard: async function(gameId, name, totalValue, returnPercentage) {
    try {
      // Get current leaderboard
      const result = await this.getSinglePlayerLeaderboard(gameId);
      
      if (!result.success) {
        return result;
      }
      
      const entries = result.data;
      
      // Add new entry
      entries.push({
        name: name,
        totalValue: totalValue,
        returnPercentage: returnPercentage,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Sort by total value (descending)
      entries.sort((a, b) => b.totalValue - a.totalValue);
      
      // Keep only top 100 entries
      const topEntries = entries.slice(0, 100);
      
      // Update leaderboard
      await EconGames.Firebase.db.collection('leaderboards').doc(`${gameId}-singleplayer`).update({
        entries: topEntries,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true, data: topEntries };
    } catch (error) {
      console.error('Error adding to single player leaderboard:', error);
      return { success: false, error: error.message };
    }
  }
};

// Initialize Game service when document is ready
document.addEventListener('DOMContentLoaded', function() {
  // Initialize Game service
  EconGames.Game.init();
});
