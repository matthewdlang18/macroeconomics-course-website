/**
 * Game Service for Investment Odyssey
 * 
 * Handles game state management, including creating games,
 * saving/loading game state, and managing game sessions.
 */

import BaseService from './base-service.js';
import firebaseManager from './firebase-config.js';

class GameService extends BaseService {
  constructor() {
    super();
    
    // Collections
    this.gamesCollection = this.getCollection('games');
    this.gameStatesCollection = this.getCollection('gameStates');
    this.gameParticipantsCollection = this.getCollection('gameParticipants');
    
    // Local storage keys
    this.GAME_STATE_KEY = 'investment_odyssey_game_state';
    this.PLAYER_STATE_KEY = 'investment_odyssey_player_state';
  }
  
  // Create a new single player game
  async createSinglePlayerGame(userId, userName) {
    try {
      // Generate game ID
      const gameId = `single_${userId}_${Date.now()}`;
      
      // Initial game state
      const gameState = {
        id: gameId,
        userId: userId,
        userName: userName,
        type: 'single',
        roundNumber: 0,
        maxRounds: 20,
        assetPrices: {
          'S&P 500': 100,
          'Bonds': 100,
          'Real Estate': 5000,
          'Gold': 3000,
          'Commodities': 100,
          'Bitcoin': 50000
        },
        priceHistory: {
          'S&P 500': [100],
          'Bonds': [100],
          'Real Estate': [5000],
          'Gold': [3000],
          'Commodities': [100],
          'Bitcoin': [50000]
        },
        CPI: 100,
        CPIHistory: [100],
        lastCashInjection: 0,
        totalCashInjected: 0,
        status: 'active',
        createdAt: this.useFirebase ? this.getServerTimestamp() : new Date().toISOString()
      };
      
      // Initial player state
      const playerState = {
        cash: 10000,
        portfolio: {},
        tradeHistory: [],
        portfolioValueHistory: [10000]
      };
      
      if (this.useFirebase) {
        // Save game state to Firestore
        await this.gamesCollection.doc(gameId).set(gameState);
        
        // Save initial game state
        await this.saveGameState(gameId, userId, userName, gameState, playerState);
      }
      
      // Always save to local storage as backup
      this.saveToLocalStorage(this.GAME_STATE_KEY, gameState);
      this.saveToLocalStorage(this.PLAYER_STATE_KEY, playerState);
      
      return this.success({ gameState, playerState });
    } catch (error) {
      return this.error('Error creating single player game', error);
    }
  }
  
  // Create a class game
  async createClassGame(sectionId, taName, day, time) {
    try {
      if (!sectionId || !taName) {
        return this.error('Section ID and TA name are required');
      }
      
      // Generate game ID
      const gameId = `class_${sectionId}_${Date.now()}`;
      
      // Initial game state
      const gameState = {
        id: gameId,
        sectionId: sectionId,
        taName: taName,
        day: day,
        time: time,
        type: 'class',
        roundNumber: 0,
        maxRounds: 20,
        assetPrices: {
          'S&P 500': 100,
          'Bonds': 100,
          'Real Estate': 5000,
          'Gold': 3000,
          'Commodities': 100,
          'Bitcoin': 50000
        },
        priceHistory: {
          'S&P 500': [100],
          'Bonds': [100],
          'Real Estate': [5000],
          'Gold': [3000],
          'Commodities': [100],
          'Bitcoin': [50000]
        },
        CPI: 100,
        CPIHistory: [100],
        lastCashInjection: 0,
        totalCashInjected: 0,
        playerCount: 0,
        status: 'active',
        createdAt: this.useFirebase ? this.getServerTimestamp() : new Date().toISOString()
      };
      
      if (this.useFirebase) {
        // Save game state to Firestore
        await this.gamesCollection.doc(gameId).set(gameState);
        
        // Create TA game state document with a consistent ID
        const taGameStateId = `${gameId}_TA_DEFAULT_0`;
        await this.gameStatesCollection.doc(taGameStateId).set({
          id: taGameStateId,
          gameId: gameId,
          userId: 'TA_DEFAULT',
          userName: taName,
          roundNumber: 0,
          gameState: gameState,
          playerState: null,
          createdAt: this.getServerTimestamp()
        });
      }
      
      return this.success(gameState);
    } catch (error) {
      return this.error('Error creating class game', error);
    }
  }
  
  // Save game state
  async saveGameState(gameId, userId, userName, gameState, playerState) {
    try {
      if (!gameId || !userId || !gameState || !playerState) {
        return this.error('Game ID, user ID, game state, and player state are required');
      }
      
      // Calculate portfolio value
      const portfolioValue = this.calculatePortfolioValue(playerState.portfolio, gameState.assetPrices);
      const totalValue = portfolioValue + playerState.cash;
      
      if (this.useFirebase) {
        // Generate a unique ID for the game state
        const stateId = `${gameId}_${userId}_${gameState.roundNumber}`;
        
        // Save game state
        await this.gameStatesCollection.doc(stateId).set({
          id: stateId,
          gameId: gameId,
          userId: userId,
          userName: userName,
          roundNumber: gameState.roundNumber,
          gameState: gameState,
          playerState: playerState,
          portfolioValue: portfolioValue,
          totalValue: totalValue,
          createdAt: this.getServerTimestamp()
        });
        
        // Update or create participant record
        const participantId = `${gameId}_${userId}`;
        await this.gameParticipantsCollection.doc(participantId).set({
          id: participantId,
          gameId: gameId,
          userId: userId,
          userName: userName,
          portfolioValue: totalValue,
          lastRound: gameState.roundNumber,
          lastUpdated: this.getServerTimestamp()
        }, { merge: true });
      }
      
      // Always save to local storage as backup
      this.saveToLocalStorage(this.GAME_STATE_KEY, gameState);
      this.saveToLocalStorage(this.PLAYER_STATE_KEY, playerState);
      
      return this.success({ portfolioValue, totalValue });
    } catch (error) {
      return this.error('Error saving game state', error);
    }
  }
  
  // Get game state
  async getGameState(gameId, userId, roundNumber = null) {
    try {
      if (!gameId || !userId) {
        return this.error('Game ID and user ID are required');
      }
      
      if (this.useFirebase) {
        let query = this.gameStatesCollection
          .where('gameId', '==', gameId)
          .where('userId', '==', userId);
        
        if (roundNumber !== null) {
          query = query.where('roundNumber', '==', roundNumber);
        } else {
          query = query.orderBy('roundNumber', 'desc').limit(1);
        }
        
        const snapshot = await query.get();
        
        if (snapshot.empty) {
          return this.error('Game state not found');
        }
        
        const gameStateData = snapshot.docs[0].data();
        
        return this.success({
          gameState: gameStateData.gameState,
          playerState: gameStateData.playerState,
          roundNumber: gameStateData.roundNumber
        });
      } else {
        // Fallback to localStorage
        const gameState = this.loadFromLocalStorage(this.GAME_STATE_KEY);
        const playerState = this.loadFromLocalStorage(this.PLAYER_STATE_KEY);
        
        if (!gameState || !playerState) {
          return this.error('Game state not found in local storage');
        }
        
        return this.success({
          gameState: gameState,
          playerState: playerState,
          roundNumber: gameState.roundNumber
        });
      }
    } catch (error) {
      return this.error('Error getting game state', error);
    }
  }
  
  // Advance class game to next round
  async advanceClassGameRound(gameId, taName) {
    try {
      if (!gameId || !taName) {
        return this.error('Game ID and TA name are required');
      }
      
      if (this.useFirebase) {
        // Get current game state
        const gameDoc = await this.gamesCollection.doc(gameId).get();
        
        if (!gameDoc.exists) {
          return this.error('Game not found');
        }
        
        const gameData = gameDoc.data();
        
        // Check if TA matches
        if (gameData.taName !== taName) {
          return this.error('Unauthorized: Only the TA who created the game can advance rounds');
        }
        
        // Check if game is active
        if (gameData.status !== 'active') {
          return this.error('Game is not active');
        }
        
        // Check if we've reached max rounds
        if (gameData.roundNumber >= gameData.maxRounds) {
          return this.error('Game has reached maximum rounds');
        }
        
        // Generate new game state for next round
        const newRoundNumber = gameData.roundNumber + 1;
        const newGameState = await this.generateNextRoundState(gameData);
        
        // Update game document
        await this.gamesCollection.doc(gameId).update({
          roundNumber: newRoundNumber,
          assetPrices: newGameState.assetPrices,
          priceHistory: newGameState.priceHistory,
          CPI: newGameState.CPI,
          CPIHistory: newGameState.CPIHistory,
          lastCashInjection: newGameState.lastCashInjection,
          totalCashInjected: newGameState.totalCashInjected,
          updatedAt: this.getServerTimestamp()
        });
        
        // Create TA game state document with a consistent ID
        const taGameStateId = `${gameId}_TA_DEFAULT_${newRoundNumber}`;
        await this.gameStatesCollection.doc(taGameStateId).set({
          id: taGameStateId,
          gameId: gameId,
          userId: 'TA_DEFAULT',
          userName: taName,
          roundNumber: newRoundNumber,
          gameState: newGameState,
          playerState: null,
          createdAt: this.getServerTimestamp()
        });
        
        return this.success(newGameState);
      } else {
        return this.error('Firebase is required for class games');
      }
    } catch (error) {
      return this.error('Error advancing class game round', error);
    }
  }
  
  // End a class game
  async endClassGame(gameId, taName) {
    try {
      if (!gameId || !taName) {
        return this.error('Game ID and TA name are required');
      }
      
      if (this.useFirebase) {
        // Get current game state
        const gameDoc = await this.gamesCollection.doc(gameId).get();
        
        if (!gameDoc.exists) {
          return this.error('Game not found');
        }
        
        const gameData = gameDoc.data();
        
        // Check if TA matches
        if (gameData.taName !== taName) {
          return this.error('Unauthorized: Only the TA who created the game can end it');
        }
        
        // Update game document
        await this.gamesCollection.doc(gameId).update({
          status: 'completed',
          endedAt: this.getServerTimestamp()
        });
        
        return this.success({ message: 'Game ended successfully' });
      } else {
        return this.error('Firebase is required for class games');
      }
    } catch (error) {
      return this.error('Error ending class game', error);
    }
  }
  
  // Get active class game for a section
  async getActiveClassGame(sectionId) {
    try {
      if (!sectionId) {
        return this.error('Section ID is required');
      }
      
      if (this.useFirebase) {
        const snapshot = await this.gamesCollection
          .where('sectionId', '==', sectionId)
          .where('status', '==', 'active')
          .where('type', '==', 'class')
          .orderBy('createdAt', 'desc')
          .limit(1)
          .get();
        
        if (snapshot.empty) {
          return this.error('No active class game found for this section');
        }
        
        return this.success(snapshot.docs[0].data());
      } else {
        return this.error('Firebase is required for class games');
      }
    } catch (error) {
      return this.error('Error getting active class game', error);
    }
  }
  
  // Join a class game
  async joinClassGame(gameId, userId, userName) {
    try {
      if (!gameId || !userId || !userName) {
        return this.error('Game ID, user ID, and user name are required');
      }
      
      if (this.useFirebase) {
        // Get game
        const gameDoc = await this.gamesCollection.doc(gameId).get();
        
        if (!gameDoc.exists) {
          return this.error('Game not found');
        }
        
        const gameData = gameDoc.data();
        
        // Check if game is active
        if (gameData.status !== 'active') {
          return this.error('Game is not active');
        }
        
        // Create participant record
        const participantId = `${gameId}_${userId}`;
        await this.gameParticipantsCollection.doc(participantId).set({
          id: participantId,
          gameId: gameId,
          userId: userId,
          userName: userName,
          portfolioValue: 10000, // Starting value
          lastRound: 0,
          joinedAt: this.getServerTimestamp(),
          lastUpdated: this.getServerTimestamp()
        });
        
        // Update player count
        await this.gamesCollection.doc(gameId).update({
          playerCount: firebase.firestore.FieldValue.increment(1)
        });
        
        // Create initial game state
        const playerState = {
          cash: 10000,
          portfolio: {},
          tradeHistory: [],
          portfolioValueHistory: [10000]
        };
        
        await this.saveGameState(gameId, userId, userName, gameData, playerState);
        
        return this.success({
          gameState: gameData,
          playerState: playerState
        });
      } else {
        return this.error('Firebase is required for class games');
      }
    } catch (error) {
      return this.error('Error joining class game', error);
    }
  }
  
  // Helper: Calculate portfolio value
  calculatePortfolioValue(portfolio, assetPrices) {
    let portfolioValue = 0;
    
    for (const [asset, quantity] of Object.entries(portfolio)) {
      const price = assetPrices[asset] || 0;
      portfolioValue += price * quantity;
    }
    
    return portfolioValue;
  }
  
  // Helper: Generate next round state
  async generateNextRoundState(currentGameState) {
    // Clone the current game state to avoid modifying it
    const gameState = JSON.parse(JSON.stringify(currentGameState));
    
    // Increment round number
    gameState.roundNumber++;
    
    // Generate new prices using the same algorithm as in game-core.js
    this.generateNewPrices(gameState);
    
    // Update CPI
    this.updateCPI(gameState);
    
    // Generate cash injection
    this.generateCashInjection(gameState);
    
    return gameState;
  }
  
  // Helper: Generate new prices (simplified version of the algorithm in game-core.js)
  generateNewPrices(gameState) {
    // Asset returns configuration - from macro3.py
    const assetReturns = {
      'S&P 500': { mean: 0.1151, stdDev: 0.1949, min: -0.43, max: 0.50 },
      'Bonds': { mean: 0.0334, stdDev: 0.0301, min: 0.0003, max: 0.14 },
      'Real Estate': { mean: 0.0439, stdDev: 0.0620, min: -0.12, max: 0.24 },
      'Gold': { mean: 0.0648, stdDev: 0.2076, min: -0.32, max: 1.25 },
      'Commodities': { mean: 0.0815, stdDev: 0.1522, min: -0.25, max: 2.00 },
      'Bitcoin': { mean: 0.50, stdDev: 1.00, min: -0.73, max: 2.50 }
    };
    
    // Generate returns for each asset
    for (const [asset, price] of Object.entries(gameState.assetPrices)) {
      const returns = assetReturns[asset];
      
      // Generate random return using normal distribution
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      let returnRate = returns.mean + returns.stdDev * z;
      
      // Ensure return is within bounds
      returnRate = Math.max(returns.min, Math.min(returns.max, returnRate));
      
      // Apply return to price
      const newPrice = price * (1 + returnRate);
      gameState.assetPrices[asset] = newPrice;
      
      // Add to price history
      gameState.priceHistory[asset].push(newPrice);
    }
    
    return gameState;
  }
  
  // Helper: Update CPI
  updateCPI(gameState) {
    // Average CPI increase of 2.5% with standard deviation of 1.5%
    const avgCPIIncrease = 0.025;
    const stdDevCPIIncrease = 0.015;
    
    // Generate random CPI increase using normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    let cpiIncrease = avgCPIIncrease + stdDevCPIIncrease * z;
    
    // Ensure CPI increase is reasonable (between -1% and 6%)
    cpiIncrease = Math.max(-0.01, Math.min(0.06, cpiIncrease));
    
    // Update CPI
    const newCPI = gameState.CPI * (1 + cpiIncrease);
    gameState.CPI = newCPI;
    gameState.CPIHistory.push(newCPI);
    
    return gameState;
  }
  
  // Helper: Generate cash injection
  generateCashInjection(gameState) {
    // Base amount increases each round to simulate growing economy but needs to be random
    const baseAmount = 5000 + (gameState.roundNumber * 500); // Starts at 5000, increases by 500 each round
    const variability = 1000; // Higher variability for more dynamic gameplay
    
    // Generate random cash injection with increasing trend
    const cashInjection = baseAmount + (Math.random() * 2 - 1) * variability;
    
    // Update game state
    gameState.lastCashInjection = cashInjection;
    gameState.totalCashInjected += cashInjection;
    
    return gameState;
  }
}

// Create and export singleton instance
const gameService = new GameService();
export default gameService;
