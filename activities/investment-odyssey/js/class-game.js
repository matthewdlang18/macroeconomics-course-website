/**
 * Investment Odyssey - Class Game
 * A completely rebuilt implementation with state machine pattern,
 * real-time Supabase integration, and enhanced UI/UX
 */

// ======= CORE ARCHITECTURE =======

/**
 * Game State Machine
 * Manages the overall state of the game and transitions between states
 */
class GameStateMachine {
    constructor() {
      // Define possible states
      this.states = {
        INITIALIZING: 'initializing',
        AUTHENTICATION: 'authentication',
        WAITING_FOR_GAME: 'waiting_for_game',
        WAITING_FOR_ROUND: 'waiting_for_round',
        ROUND_TRANSITION: 'round_transition',
        TRADING: 'trading',
        GAME_OVER: 'game_over',
        ERROR: 'error'
      };
      
      // Current state
      this.currentState = this.states.INITIALIZING;
      
      // State handlers
      this.stateHandlers = {
        [this.states.INITIALIZING]: this.handleInitializing.bind(this),
        [this.states.AUTHENTICATION]: this.handleAuthentication.bind(this),
        [this.states.WAITING_FOR_GAME]: this.handleWaitingForGame.bind(this),
        [this.states.WAITING_FOR_ROUND]: this.handleWaitingForRound.bind(this),
        [this.states.ROUND_TRANSITION]: this.handleRoundTransition.bind(this),
        [this.states.TRADING]: this.handleTrading.bind(this),
        [this.states.GAME_OVER]: this.handleGameOver.bind(this),
        [this.states.ERROR]: this.handleError.bind(this)
      };
      
      // Event listeners
      this.eventListeners = {};
    }
    
    // Initialize the state machine
    async initialize() {
      console.log('Initializing game state machine');
      try {
        // Set initial state
        this.transitionTo(this.states.AUTHENTICATION);
      } catch (error) {
        console.error('Error initializing game state machine:', error);
        this.transitionTo(this.states.ERROR, { error });
      }
    }
    
    // Transition to a new state
    transitionTo(newState, data = {}) {
      const oldState = this.currentState;
      console.log(`Transitioning from ${oldState} to ${newState}`);
      
      // Update current state
      this.currentState = newState;
      
      // Call the handler for the new state
      if (this.stateHandlers[newState]) {
        this.stateHandlers[newState](data);
      }
      
      // Trigger state change event
      this.triggerEvent('stateChanged', { oldState, newState, data });
    }
    
    // Register an event listener
    on(event, callback) {
      if (!this.eventListeners[event]) {
        this.eventListeners[event] = [];
      }
      this.eventListeners[event].push(callback);
    }
    
    // Trigger an event
    triggerEvent(event, data) {
      if (this.eventListeners[event]) {
        this.eventListeners[event].forEach(callback => callback(data));
      }
    }
    
    // State handlers
    async handleInitializing() {
      // Initialize components
      console.log('Initializing game components');
    }
    
    async handleAuthentication(data) {
      console.log('Handling authentication');
      // Check if user is authenticated
      const isAuthenticated = await SupabaseConnector.isAuthenticated();
      
      if (isAuthenticated) {
        // Check if user has a section
        const hasSection = await SupabaseConnector.hasSection();
        
        if (hasSection) {
          this.transitionTo(this.states.WAITING_FOR_GAME);
        } else {
          UIController.showSectionSelectionPrompt();
        }
      } else {
        UIController.showAuthenticationPrompt();
      }
    }
    
    async handleWaitingForGame() {
      console.log('Waiting for active game');
      UIController.showWaitingForGameScreen();
      
      // Check for active game
      const activeGame = await SupabaseConnector.getActiveGame();
      
      if (activeGame) {
        // Store game data
        GameData.setGameSession(activeGame);
        
        // Join the game
        await SupabaseConnector.joinGame(activeGame.id);
        
        // Subscribe to game updates
        SupabaseConnector.subscribeToGameUpdates(activeGame.id, this.handleGameUpdate.bind(this));
        
        // Check current round
        if (activeGame.currentRound > 0) {
          this.transitionTo(this.states.TRADING);
        } else {
          this.transitionTo(this.states.WAITING_FOR_ROUND);
        }
      } else {
        // No active game, keep waiting
        setTimeout(() => this.handleWaitingForGame(), 5000);
      }
    }
    
    async handleWaitingForRound() {
      console.log('Waiting for round to start');
      UIController.showWaitingForRoundScreen();
    }
    
    async handleRoundTransition(data) {
      console.log('Handling round transition', data);
      
      // Show round transition animation
      await UIController.showRoundTransitionAnimation(data.oldRound, data.newRound);
      
      // Load market data for the new round
      await MarketSimulator.loadMarketData(data.newRound);
      
      // Update UI with new market data
      UIController.updateMarketData();
      
      // Transition to trading state
      this.transitionTo(this.states.TRADING);
    }
    
    async handleTrading() {
      console.log('Handling trading state');
      UIController.showTradingScreen();
      
      // Enable trading controls
      UIController.enableTradingControls();
      
      // Update portfolio display
      UIController.updatePortfolioDisplay();
    }
    
    async handleGameOver(data) {
      console.log('Handling game over', data);
      UIController.showGameOverScreen(data);
      
      // Save final score
      await SupabaseConnector.saveFinalScore(data.finalValue);
    }
    
    async handleError(data) {
      console.error('Error in game state machine:', data.error);
      UIController.showErrorScreen(data.error);
    }
    
    // Handle game update from Supabase
    handleGameUpdate(update) {
      console.log('Received game update:', update);
      
      const gameSession = GameData.getGameSession();
      
      // Check if round has changed
      if (update.currentRound !== gameSession.currentRound) {
        // Round has changed
        if (update.currentRound > gameSession.maxRounds) {
          // Game is over
          this.transitionTo(this.states.GAME_OVER, {
            finalValue: PortfolioManager.getTotalValue()
          });
        } else {
          // Round transition
          this.transitionTo(this.states.ROUND_TRANSITION, {
            oldRound: gameSession.currentRound,
            newRound: update.currentRound
          });
        }
      }
      
      // Update game session data
      GameData.setGameSession(update);
    }
  }
  
  /**
   * Supabase Connector
   * Handles all interactions with the Supabase database
   */
  class SupabaseConnector {
    static async initialize() {
      console.log('Initializing Supabase connector');
      
      // Check if Supabase is available
      if (!window.supabase) {
        throw new Error('Supabase client not available');
      }
      
      this.supabase = window.supabase;
      console.log('Supabase connector initialized');
    }
    
    static async isAuthenticated() {
      try {
        const { data: { user } } = await this.supabase.auth.getUser();
        return !!user;
      } catch (error) {
        console.error('Error checking authentication:', error);
        return false;
      }
    }
    
    static async hasSection() {
      try {
        const { data: { user } } = await this.supabase.auth.getUser();
        
        if (!user) return false;
        
        const { data, error } = await this.supabase
          .from('profiles')
          .select('section_id')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        return !!data.section_id;
      } catch (error) {
        console.error('Error checking section:', error);
        return false;
      }
    }
    
    static async getActiveGame() {
      try {
        const { data: { user } } = await this.supabase.auth.getUser();
        
        if (!user) return null;
        
        // Get user's section
        const { data: profile, error: profileError } = await this.supabase
          .from('profiles')
          .select('section_id')
          .eq('id', user.id)
          .single();
        
        if (profileError) throw profileError;
        
        // Get active game for section
        const { data: games, error: gamesError } = await this.supabase
          .from('game_sessions')
          .select('*')
          .eq('section_id', profile.section_id)
          .eq('status', 'active');
        
        if (gamesError) throw gamesError;
        
        // Return the first active game or null
        return games && games.length > 0 ? games[0] : null;
      } catch (error) {
        console.error('Error getting active game:', error);
        return null;
      }
    }
    
    static async joinGame(gameId) {
      try {
        const { data: { user } } = await this.supabase.auth.getUser();
        
        if (!user) throw new Error('User not authenticated');
        
        // Get user profile
        const { data: profile, error: profileError } = await this.supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single();
        
        if (profileError) throw profileError;
        
        // Join game
        const { data, error } = await this.supabase
          .from('game_participants')
          .upsert({
            game_id: gameId,
            student_id: user.id,
            student_name: profile.name,
            portfolio_value: 10000,
            last_updated: new Date().toISOString()
          })
          .select();
        
        if (error) throw error;
        
        console.log('Joined game successfully:', data);
        return data;
      } catch (error) {
        console.error('Error joining game:', error);
        throw error;
      }
    }
    
    static subscribeToGameUpdates(gameId, callback) {
      try {
        // Subscribe to game_sessions changes
        const subscription = this.supabase
          .channel(`game_${gameId}`)
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'game_sessions',
            filter: `id=eq.${gameId}`
          }, payload => {
            console.log('Game session updated:', payload);
            callback(payload.new);
          })
          .subscribe();
        
        console.log('Subscribed to game updates:', subscription);
        return subscription;
      } catch (error) {
        console.error('Error subscribing to game updates:', error);
        // Fall back to polling
        this.startGamePolling(gameId, callback);
      }
    }
    
    static startGamePolling(gameId, callback) {
      console.log('Starting game polling as fallback');
      
      // Poll every 5 seconds
      const intervalId = setInterval(async () => {
        try {
          const { data, error } = await this.supabase
            .from('game_sessions')
            .select('*')
            .eq('id', gameId)
            .single();
          
          if (error) throw error;
          
          callback(data);
        } catch (error) {
          console.error('Error polling game:', error);
        }
      }, 5000);
      
      return intervalId;
    }
    
    static async getGameState(gameId, roundNumber) {
      try {
        // Try to get TA game state first (official prices)
        const { data: taState, error: taError } = await this.supabase
          .from('game_states')
          .select('*')
          .eq('game_id', gameId)
          .eq('round_number', roundNumber)
          .eq('user_id', 'TA_DEFAULT')
          .single();
        
        if (!taError && taState) {
          console.log('Found TA game state:', taState);
          return taState;
        }
        
        // Fall back to any game state for this round
        const { data, error } = await this.supabase
          .from('game_states')
          .select('*')
          .eq('game_id', gameId)
          .eq('round_number', roundNumber)
          .limit(1);
        
        if (error) throw error;
        
        return data && data.length > 0 ? data[0] : null;
      } catch (error) {
        console.error('Error getting game state:', error);
        return null;
      }
    }
    
    static async savePlayerState(gameId, playerState) {
      try {
        const { data: { user } } = await this.supabase.auth.getUser();
        
        if (!user) throw new Error('User not authenticated');
        
        const { data, error } = await this.supabase
          .from('player_states')
          .upsert({
            game_id: gameId,
            user_id: user.id,
            cash: playerState.cash,
            portfolio: playerState.portfolio,
            trade_history: playerState.tradeHistory,
            portfolio_value_history: playerState.portfolioValueHistory,
            total_value: playerState.totalValue,
            updated_at: new Date().toISOString()
          })
          .select();
        
        if (error) throw error;
        
        console.log('Saved player state:', data);
        return data;
      } catch (error) {
        console.error('Error saving player state:', error);
        throw error;
      }
    }
    
    static async saveFinalScore(finalValue) {
      try {
        const { data: { user } } = await this.supabase.auth.getUser();
        
        if (!user) throw new Error('User not authenticated');
        
        // Get user profile
        const { data: profile, error: profileError } = await this.supabase
          .from('profiles')
          .select('name, section_id')
          .eq('id', user.id)
          .single();
        
        if (profileError) throw profileError;
        
        // Get current game
        const gameSession = GameData.getGameSession();
        
        // Save to leaderboard
        const { data, error } = await this.supabase
          .from('leaderboard')
          .upsert({
            user_id: user.id,
            user_name: profile.name,
            game_mode: 'class',
            game_id: gameSession.id,
            section_id: profile.section_id,
            final_value: finalValue,
            created_at: new Date().toISOString()
          })
          .select();
        
        if (error) throw error;
        
        console.log('Saved final score:', data);
        return data;
      } catch (error) {
        console.error('Error saving final score:', error);
        throw error;
      }
    }
  }
  
  /**
   * UI Controller
   * Manages all UI updates and animations
   */
  class UIController {
    static initialize() {
      console.log('Initializing UI controller');
      
      // Cache DOM elements
      this.authCheck = document.getElementById('auth-check');
      this.classGameContainer = document.getElementById('class-game-container');
      this.waitingScreen = document.getElementById('waiting-screen');
      this.gameContent = document.getElementById('game-content');
      this.sectionInfo = document.getElementById('section-info');
      this.taName = document.getElementById('ta-name');
      this.roundNumber = document.getElementById('round-number');
      this.maxRounds = document.getElementById('max-rounds');
      this.playerCount = document.getElementById('player-count');
      this.currentRoundDisplay = document.getElementById('current-round-display');
      this.marketRoundDisplay = document.getElementById('market-round-display');
      this.roundProgress = document.getElementById('round-progress');
      this.cashDisplay = document.getElementById('cash-display');
      this.portfolioValueDisplay = document.getElementById('portfolio-value-display');
      this.totalValueDisplay = document.getElementById('total-value-display');
      this.cpiDisplay = document.getElementById('cpi-display');
      this.cashInjectionAlert = document.getElementById('cash-injection-alert');
      this.cashInjectionAmount = document.getElementById('cash-injection-amount');
      this.assetPricesTable = document.getElementById('asset-prices-table');
      this.priceTicker = document.getElementById('price-ticker');
      
      console.log('UI controller initialized');
    }
    
    static showAuthenticationPrompt() {
      console.log('Showing authentication prompt');
      this.authCheck.classList.remove('d-none');
      this.classGameContainer.classList.add('d-none');
    }
    
    static showSectionSelectionPrompt() {
      console.log('Showing section selection prompt');
      this.authCheck.innerHTML = `
        <div class="d-flex align-items-center">
          <div class="mr-3">
            <i class="fas fa-users fa-2x"></i>
          </div>
          <div>
            <h5 class="mb-1">TA Section Required</h5>
            <p class="mb-0">You need to select a TA section to join class games. <a href="select-section.html" class="font-weight-bold">Select a section here</a>.</p>
          </div>
        </div>
      `;
      this.authCheck.classList.remove('d-none');
      this.classGameContainer.classList.add('d-none');
    }
    
    static showWaitingForGameScreen() {
      console.log('Showing waiting for game screen');
      this.authCheck.innerHTML = `
        <div class="d-flex align-items-center">
          <div class="mr-3">
            <i class="fas fa-hourglass-start fa-2x"></i>
          </div>
          <div>
            <h5 class="mb-1">No Active Game</h5>
            <p class="mb-0">There is no active class game for your section at this time. Please check back later or ask your TA to start a game.</p>
          </div>
        </div>
      `;
      this.authCheck.classList.remove('d-none');
      this.classGameContainer.classList.add('d-none');
    }
    
    static showWaitingForRoundScreen() {
      console.log('Showing waiting for round screen');
      this.authCheck.classList.add('d-none');
      this.classGameContainer.classList.remove('d-none');
      this.waitingScreen.classList.remove('d-none');
      this.gameContent.classList.remove('d-none');
      
      // Update waiting screen message
      this.waitingScreen.innerHTML = `
        <i class="fas fa-hourglass-half waiting-icon"></i>
        <h3 class="mb-3">Waiting for TA to start the game</h3>
        <p class="text-muted mb-4">Your TA will advance the game to round 1. You can start trading now with the initial prices.</p>
        <div class="spinner-border text-primary" role="status">
          <span class="sr-only">Loading...</span>
        </div>
      `;
    }
    
    static async showRoundTransitionAnimation(oldRound, newRound) {
      console.log(`Animating transition from round ${oldRound} to ${newRound}`);
      
      // Show transition overlay
      const transitionOverlay = document.createElement('div');
      transitionOverlay.className = 'round-transition-overlay';
      transitionOverlay.innerHTML = `
        <div class="round-transition-content">
          <h2>Round ${newRound}</h2>
          <div class="round-transition-progress">
            <div class="round-transition-bar"></div>
          </div>
        </div>
            `;
    document.body.appendChild(transitionOverlay);
    
    // Animate the transition
    return new Promise(resolve => {
      // Fade in
      setTimeout(() => {
        transitionOverlay.classList.add('active');
        
        // Animate progress bar
        const progressBar = transitionOverlay.querySelector('.round-transition-bar');
        progressBar.style.width = '100%';
        
        // Fade out after animation completes
        setTimeout(() => {
          transitionOverlay.classList.remove('active');
          
          // Remove overlay after fade out
          setTimeout(() => {
            document.body.removeChild(transitionOverlay);
            resolve();
          }, 500);
        }, 2000);
      }, 100);
    });
  }
  
  static showTradingScreen() {
    console.log('Showing trading screen');
    this.authCheck.classList.add('d-none');
    this.classGameContainer.classList.remove('d-none');
    this.waitingScreen.classList.add('d-none');
    this.gameContent.classList.remove('d-none');
  }
  
  static showGameOverScreen(data) {
    console.log('Showing game over screen', data);
    this.authCheck.classList.add('d-none');
    this.classGameContainer.classList.remove('d-none');
    this.gameContent.classList.add('d-none');
    
    // Format currency
    const formattedValue = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(data.finalValue);
    
    // Update waiting screen with game over message
    this.waitingScreen.innerHTML = `
      <i class="fas fa-trophy waiting-icon text-warning"></i>
      <h3 class="mb-3">Game Complete!</h3>
      <p class="text-muted mb-4">The class game has ended. Your final portfolio value: ${formattedValue}</p>
      <p class="text-success">Your score has been saved to the leaderboard!</p>
      <a href="leaderboard.html" class="btn btn-primary">View Full Leaderboard</a>
    `;
    this.waitingScreen.classList.remove('d-none');
  }
  
  static showErrorScreen(error) {
    console.log('Showing error screen', error);
    this.authCheck.innerHTML = `
      <div class="d-flex align-items-center">
        <div class="mr-3">
          <i class="fas fa-exclamation-triangle fa-2x"></i>
        </div>
        <div>
          <h5 class="mb-1">Error</h5>
          <p class="mb-0">An error occurred: ${error.message || 'Unknown error'}</p>
          <button class="btn btn-primary mt-2" onclick="location.reload()">Reload Page</button>
        </div>
      </div>
    `;
    this.authCheck.classList.remove('d-none');
    this.classGameContainer.classList.add('d-none');
  }
  
  static updateSectionInfo() {
    console.log('Updating section info');
    const gameSession = GameData.getGameSession();
    const section = GameData.getSection();
    
    if (section) {
      this.sectionInfo.textContent = `${section.fullDay} ${section.time}`;
      
      if (section.ta) {
        this.taName.textContent = section.ta;
        document.getElementById('ta-name-container').classList.remove('d-none');
      } else {
        document.getElementById('ta-name-container').classList.add('d-none');
      }
    }
    
    if (gameSession) {
      this.roundNumber.textContent = gameSession.current_round;
      this.currentRoundDisplay.textContent = gameSession.current_round;
      this.marketRoundDisplay.textContent = gameSession.current_round;
      this.maxRounds.textContent = gameSession.max_rounds;
      
      // Update progress bar
      const progress = (gameSession.current_round / gameSession.max_rounds) * 100;
      this.roundProgress.style.width = `${progress}%`;
      this.roundProgress.setAttribute('aria-valuenow', progress);
      this.roundProgress.textContent = `${Math.round(progress)}%`;
    }
  }
  
  static updateMarketData() {
    console.log('Updating market data');
    const marketData = MarketSimulator.getMarketData();
    const playerState = PortfolioManager.getPlayerState();
    
    if (!marketData || !playerState) return;
    
    // Update CPI display
    this.cpiDisplay.textContent = marketData.cpi.toFixed(2);
    
    // Update asset prices table
    this.updateAssetPricesTable(marketData, playerState);
    
    // Update price ticker
    this.updatePriceTicker(marketData);
  }
  
  static updateAssetPricesTable(marketData, playerState) {
    console.log('Updating asset prices table');
    
    // Clear table
    this.assetPricesTable.innerHTML = '';
    
    // Add cash row
    const cashRow = document.createElement('tr');
    cashRow.innerHTML = `
      <td>Cash</td>
      <td>$1.00</td>
      <td>0.00%</td>
      <td>${playerState.cash.toFixed(2)}</td>
      <td>$${playerState.cash.toFixed(2)}</td>
      <td>${((playerState.cash / PortfolioManager.getTotalValue()) * 100).toFixed(2)}%</td>
    `;
    this.assetPricesTable.appendChild(cashRow);
    
    // Add asset rows
    for (const asset in marketData.assetPrices) {
      const price = marketData.assetPrices[asset];
      const previousPrice = marketData.previousPrices ? marketData.previousPrices[asset] : price;
      const priceChange = ((price - previousPrice) / previousPrice) * 100;
      const quantity = playerState.portfolio[asset] || 0;
      const value = quantity * price;
      const percentage = (value / PortfolioManager.getTotalValue()) * 100;
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${asset}</td>
        <td>$${price.toFixed(2)}</td>
        <td class="${priceChange >= 0 ? 'text-success' : 'text-danger'}">
          ${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%
        </td>
        <td>${quantity.toFixed(6)}</td>
        <td>$${value.toFixed(2)}</td>
        <td>${percentage.toFixed(2)}%</td>
      `;
      this.assetPricesTable.appendChild(row);
    }
  }
  
  static updatePriceTicker(marketData) {
    console.log('Updating price ticker');
    
    // Clear ticker
    this.priceTicker.innerHTML = '';
    
    // Add ticker items
    for (const asset in marketData.assetPrices) {
      const price = marketData.assetPrices[asset];
      const previousPrice = marketData.previousPrices ? marketData.previousPrices[asset] : price;
      const priceChange = ((price - previousPrice) / previousPrice) * 100;
      
      const tickerItem = document.createElement('div');
      tickerItem.className = `ticker-item ${priceChange >= 0 ? 'up' : 'down'}`;
      tickerItem.innerHTML = `
        ${asset}: $${price.toFixed(2)} 
        <i class="fas fa-${priceChange >= 0 ? 'arrow-up' : 'arrow-down'} ml-1"></i>
        ${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%
      `;
      this.priceTicker.appendChild(tickerItem);
    }
  }
  
  static updatePortfolioDisplay() {
    console.log('Updating portfolio display');
    const playerState = PortfolioManager.getPlayerState();
    
    if (!playerState) return;
    
    // Calculate portfolio value
    const portfolioValue = PortfolioManager.getPortfolioValue();
    const totalValue = PortfolioManager.getTotalValue();
    
    // Update displays
    this.cashDisplay.textContent = playerState.cash.toFixed(2);
    this.portfolioValueDisplay.textContent = portfolioValue.toFixed(2);
    this.totalValueDisplay.textContent = totalValue.toFixed(2);
  }
  
  static showCashInjection(amount) {
    if (amount <= 0) return;
    
    console.log('Showing cash injection:', amount);
    this.cashInjectionAmount.textContent = amount.toFixed(2);
    this.cashInjectionAlert.style.display = 'block';
    
    // Hide after 5 seconds
    setTimeout(() => {
      this.cashInjectionAlert.style.display = 'none';
    }, 5000);
  }
  
  static enableTradingControls() {
    console.log('Enabling trading controls');
    
    // Set up event listeners for trading form
    const tradeForm = document.getElementById('trade-form');
    if (tradeForm) {
      tradeForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        await PortfolioManager.executeTrade();
      });
    }
    
    // Asset select change
    const assetSelect = document.getElementById('asset-select');
    if (assetSelect) {
      assetSelect.addEventListener('change', function() {
        PortfolioManager.updateAssetPrice();
        PortfolioManager.updateTradeForm();
      });
    }
    
    // Other trading controls setup...
    // (Additional trading control setup would go here)
  }
}

/**
 * Market Simulator
 * Handles market data and simulations
 */
class MarketSimulator {
  static initialize() {
    console.log('Initializing market simulator');
    
    // Initialize market data
    this.marketData = {
      assetPrices: {
        'S&P 500': 100,
        'Bonds': 100,
        'Real Estate': 5000,
        'Gold': 3000,
        'Commodities': 100,
        'Bitcoin': 50000
      },
      previousPrices: null,
      priceHistory: {
        'S&P 500': [100],
        'Bonds': [100],
        'Real Estate': [5000],
        'Gold': [3000],
        'Commodities': [100],
        'Bitcoin': [50000]
      },
      cpi: 100,
      cpiHistory: [100]
    };
    
    console.log('Market simulator initialized');
  }
  
  static getMarketData() {
    return this.marketData;
  }
  
  static async loadMarketData(roundNumber) {
    console.log('Loading market data for round:', roundNumber);
    
    try {
      const gameSession = GameData.getGameSession();
      
      if (!gameSession) {
        throw new Error('No active game session');
      }
      
      // Get game state for this round
      const gameState = await SupabaseConnector.getGameState(gameSession.id, roundNumber);
      
      if (gameState && gameState.asset_prices) {
        console.log('Found game state with asset prices:', gameState);
        
        // Store previous prices before updating
        this.marketData.previousPrices = { ...this.marketData.assetPrices };
        
        // Update market data
        this.marketData.assetPrices = gameState.asset_prices;
        this.marketData.priceHistory = gameState.price_history;
        this.marketData.cpi = gameState.cpi;
        this.marketData.cpiHistory = gameState.cpi_history;
        
        return this.marketData;
      } else {
        console.warn('No game state found for round:', roundNumber);
        
        // Generate new market data
        return this.generateMarketData(roundNumber);
      }
    } catch (error) {
      console.error('Error loading market data:', error);
      
      // Fall back to generating market data
      return this.generateMarketData(roundNumber);
    }
  }
  
  static generateMarketData(roundNumber) {
    console.log('Generating market data for round:', roundNumber);
    
    // Store previous prices before updating
    this.marketData.previousPrices = { ...this.marketData.assetPrices };
    
    // Generate new prices based on previous prices
    for (const asset in this.marketData.assetPrices) {
      // Get asset parameters
      const params = this.getAssetParameters(asset);
      
      // Generate return
      const assetReturn = this.generateAssetReturn(asset, params);
      
      // Apply return to price
      const oldPrice = this.marketData.assetPrices[asset];
      const newPrice = oldPrice * (1 + assetReturn);
      
      // Update price
      this.marketData.assetPrices[asset] = newPrice;
      
      // Update price history
      if (!this.marketData.priceHistory[asset]) {
        this.marketData.priceHistory[asset] = [];
      }
      this.marketData.priceHistory[asset].push(newPrice);
    }
    
    // Update CPI
    const cpiChange = 0.005 + (Math.random() * 0.01); // 0.5% to 1.5% inflation per round
    this.marketData.cpi = this.marketData.cpi * (1 + cpiChange);
    this.marketData.cpiHistory.push(this.marketData.cpi);
    
    return this.marketData;
  }
  
  static getAssetParameters(asset) {
    // Default parameters
    const defaultParams = {
      mean: 0.02,
      stdDev: 0.05,
      min: -0.1,
      max: 0.15
    };
    
    // Asset-specific parameters
    const assetParams = {
      'S&P 500': {
        mean: 0.025,
        stdDev: 0.06,
        min: -0.12,
        max: 0.15
      },
      'Bonds': {
        mean: 0.01,
        stdDev: 0.03,
        min: -0.05,
        max: 0.08
      },
      'Real Estate': {
        mean: 0.02,
        stdDev: 0.05,
        min: -0.08,
        max: 0.12
      },
      'Gold': {
        mean: 0.015,
        stdDev: 0.07,
        min: -0.1,
        max: 0.13
      },
      'Commodities': {
        mean: 0.02,
        stdDev: 0.08,
        min: -0.15,
        max: 0.18
      },
      'Bitcoin': {
        mean: 0.05,
        stdDev: 0.2,
        min: -0.73,
        max: 2.5
      }
    };
    
    return assetParams[asset] || defaultParams;
  }
  
  static generateAssetReturn(asset, params) {
    // Generate random return based on normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    let assetReturn = params.mean + (z * params.stdDev);
    
    // Special case for Bitcoin
    if (asset === 'Bitcoin') {
      // Check for Bitcoin crash (20% chance per round)
      if (Math.random() < 0.2) {
        assetReturn = -0.3 - (Math.random() * 0.4); // -30% to -70%
      }
    }
    
    // Ensure return is within bounds, but avoid exact min/max values
    const min = params.min;
    const max = params.max;
    
    // Calculate the 5% buffer zones near the min and max
    const minBuffer = Math.abs(min * 0.05);
    const maxBuffer = Math.abs(max * 0.05);
    
    // Check if return would hit min or max exactly
    if (assetReturn <= min) {
      // Choose a random value between min and min+5%
      assetReturn = min + (Math.random() * minBuffer);
    } else if (assetReturn >= max) {
      // Choose a random value between max-5% and max
      assetReturn = max - (Math.random() * maxBuffer);
    } else {
      // Normal case - just ensure it's within bounds
      assetReturn = Math.max(min, Math.min(max, assetReturn));
    }
    
    return assetReturn;
  }
}

/**
 * Portfolio Manager
 * Manages the player's portfolio and trading
 */
class PortfolioManager {
  static initialize() {
    console.log('Initializing portfolio manager');
    
    // Initialize player state
    this.playerState = {
      cash: 10000,
      portfolio: {},
      tradeHistory: [],
      portfolioValueHistory: [10000],
      totalValue: 10000
    };
    
    console.log('Portfolio manager initialized');
  }
  
  static getPlayerState() {
    return this.playerState;
  }
  
  static async loadPlayerState() {
    console.log('Loading player state');
    
    try {
      const gameSession = GameData.getGameSession();
      
      if (!gameSession) {
        throw new Error('No active game session');
      }
      
      // Get player state from database
      const { data: { user } } = await SupabaseConnector.supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const { data, error } = await SupabaseConnector.supabase
        .from('player_states')
        .select('*')
        .eq('game_id', gameSession.id)
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.warn('Error loading player state:', error);
        return this.playerState;
      }
      
      if (data) {
        console.log('Found player state:', data);
        
        // Update player state
        this.playerState = {
          cash: data.cash,
          portfolio: data.portfolio,
          tradeHistory: data.trade_history,
          portfolioValueHistory: data.portfolio_value_history,
          totalValue: data.total_value
        };
      }
      
      return this.playerState;
    } catch (error) {
      console.error('Error loading player state:', error);
      return this.playerState;
    }
  }
  
  static async savePlayerState() {
    console.log('Saving player state');
    
    try {
      const gameSession = GameData.getGameSession();
      
      if (!gameSession) {
        throw new Error('No active game session');
      }
      
      // Calculate total value
      this.playerState.totalValue = this.getTotalValue();
      
      // Update portfolio value history
      this.playerState.portfolioValueHistory.push(this.playerState.totalValue);
      
      // Save player state to database
      await SupabaseConnector.savePlayerState(gameSession.id, this.playerState);
      
      return true;
    } catch (error) {
      console.error('Error saving player state:', error);
      return false;
    }
  }
  
  static getPortfolioValue() {
    const marketData = MarketSimulator.getMarketData();
    let portfolioValue = 0;
    
    for (const asset in this.playerState.portfolio) {
      const quantity = this.playerState.portfolio[asset];
      const price = marketData.assetPrices[asset];
      
      if (quantity && price) {
        portfolioValue += quantity * price;
    }
  }
  
  return portfolioValue;
}

static getTotalValue() {
  return this.playerState.cash + this.getPortfolioValue();
}

static async executeTrade() {
  console.log('Executing trade');
  
  try {
    // Get form values
    const assetSelect = document.getElementById('asset-select');
    const actionSelect = document.getElementById('action-select');
    const amountInput = document.getElementById('amount-input');
    const quantityInput = document.getElementById('quantity-input');
    
    const asset = assetSelect.value;
    const action = actionSelect.value;
    const amount = parseFloat(amountInput.value);
    const quantity = parseFloat(quantityInput.value);
    
    if (!asset || !action) {
      throw new Error('Please select an asset and action');
    }
    
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Please enter a valid amount');
    }
    
    if (isNaN(quantity) || quantity <= 0) {
      throw new Error('Please enter a valid quantity');
    }
    
    // Get asset price
    const marketData = MarketSimulator.getMarketData();
    const price = marketData.assetPrices[asset];
    
    if (!price) {
      throw new Error(`Price not found for ${asset}`);
    }
    
    // Execute trade
    if (action === 'buy') {
      // Check if player has enough cash
      if (amount > this.playerState.cash) {
        throw new Error('Not enough cash');
      }
      
      // Calculate quantity
      const calculatedQuantity = amount / price;
      
      // Update portfolio
      if (!this.playerState.portfolio[asset]) {
        this.playerState.portfolio[asset] = 0;
      }
      
      this.playerState.portfolio[asset] += calculatedQuantity;
      this.playerState.cash -= amount;
    } else if (action === 'sell') {
      // Check if player has enough of the asset
      if (!this.playerState.portfolio[asset] || this.playerState.portfolio[asset] < quantity) {
        throw new Error(`Not enough ${asset}`);
      }
      
      // Calculate amount
      const calculatedAmount = quantity * price;
      
      // Update portfolio
      this.playerState.portfolio[asset] -= quantity;
      this.playerState.cash += calculatedAmount;
      
      // Remove asset from portfolio if quantity is 0
      if (this.playerState.portfolio[asset] <= 0) {
        delete this.playerState.portfolio[asset];
      }
    }
    
    // Add to trade history
    this.playerState.tradeHistory.push({
      timestamp: new Date().toISOString(),
      asset,
      action,
      quantity: action === 'buy' ? quantity : -quantity,
      price,
      amount: action === 'buy' ? -amount : amount
    });
    
    // Save player state
    await this.savePlayerState();
    
    // Update UI
    UIController.updatePortfolioDisplay();
    UIController.updateMarketData();
    
    // Reset form
    assetSelect.selectedIndex = 0;
    amountInput.value = '';
    quantityInput.value = '';
    
    // Show success message
    alert(`Successfully ${action === 'buy' ? 'bought' : 'sold'} ${quantity} ${asset}`);
    
    return true;
  } catch (error) {
    console.error('Error executing trade:', error);
    alert(`Error: ${error.message}`);
    return false;
  }
}

static updateAssetPrice() {
  console.log('Updating asset price display');
  
  const assetSelect = document.getElementById('asset-select');
  const currentPriceDisplay = document.getElementById('current-price-display');
  const quantityUnit = document.getElementById('quantity-unit');
  
  if (!assetSelect || !currentPriceDisplay || !quantityUnit) return;
  
  const asset = assetSelect.value;
  
  if (!asset) {
    currentPriceDisplay.textContent = '0.00';
    quantityUnit.textContent = 'units';
    return;
  }
  
  const marketData = MarketSimulator.getMarketData();
  const price = marketData.assetPrices[asset];
  
  if (price) {
    currentPriceDisplay.textContent = price.toFixed(2);
    quantityUnit.textContent = asset === 'Bitcoin' ? 'BTC' : 'units';
  } else {
    currentPriceDisplay.textContent = '0.00';
    quantityUnit.textContent = 'units';
  }
}

static updateTradeForm(changedInput = null) {
  console.log('Updating trade form', changedInput);
  
  const assetSelect = document.getElementById('asset-select');
  const actionSelect = document.getElementById('action-select');
  const amountInput = document.getElementById('amount-input');
  const quantityInput = document.getElementById('quantity-input');
  const quantityDisplay = document.getElementById('quantity-display');
  const totalCostDisplay = document.getElementById('total-cost-display');
  const availableCashDisplay = document.getElementById('available-cash-display');
  
  if (!assetSelect || !actionSelect || !amountInput || !quantityInput || 
      !quantityDisplay || !totalCostDisplay || !availableCashDisplay) return;
  
  const asset = assetSelect.value;
  const action = actionSelect.value;
  
  if (!asset) return;
  
  const marketData = MarketSimulator.getMarketData();
  const price = marketData.assetPrices[asset];
  
  if (!price) return;
  
  // Update available cash
  availableCashDisplay.textContent = this.playerState.cash.toFixed(2);
  
  // Handle amount input change
  if (changedInput === 'amount' || !changedInput) {
    const amount = parseFloat(amountInput.value) || 0;
    const calculatedQuantity = amount / price;
    
    // Update quantity input
    quantityInput.value = calculatedQuantity.toFixed(6);
    
    // Update quantity display
    quantityDisplay.textContent = calculatedQuantity.toFixed(6);
    
    // Update total cost display
    totalCostDisplay.textContent = amount.toFixed(2);
  }
  
  // Handle quantity input change
  if (changedInput === 'quantity' || !changedInput) {
    const quantity = parseFloat(quantityInput.value) || 0;
    const calculatedAmount = quantity * price;
    
    // Update amount input
    amountInput.value = calculatedAmount.toFixed(2);
    
    // Update quantity display
    quantityDisplay.textContent = quantity.toFixed(6);
    
    // Update total cost display
    totalCostDisplay.textContent = calculatedAmount.toFixed(2);
  }
}
}

/**
* Game Data
* Manages game data and state
*/
class GameData {
static initialize() {
  console.log('Initializing game data');
  
  // Initialize game data
  this.gameSession = null;
  this.section = null;
  
  console.log('Game data initialized');
}

static getGameSession() {
  return this.gameSession;
}

static setGameSession(gameSession) {
  console.log('Setting game session:', gameSession);
  this.gameSession = gameSession;
}

static getSection() {
  return this.section;
}

static setSection(section) {
  console.log('Setting section:', section);
  this.section = section;
}

static async loadSection() {
  console.log('Loading section data');
  
  try {
    const { data: { user } } = await SupabaseConnector.supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Get user's section
    const { data: profile, error: profileError } = await SupabaseConnector.supabase
      .from('profiles')
      .select('section_id')
      .eq('id', user.id)
      .single();
    
    if (profileError) throw profileError;
    
    if (!profile.section_id) {
      throw new Error('User has no section');
    }
    
    // Get section details
    const { data: section, error: sectionError } = await SupabaseConnector.supabase
      .from('sections')
      .select(`
        id,
        day,
        time,
        location,
        ta_id,
        profiles:ta_id (name)
      `)
      .eq('id', profile.section_id)
      .single();
    
    if (sectionError) throw sectionError;
    
    // Format section data
    const formattedSection = {
      id: section.id,
      day: section.day,
      fullDay: this.getFullDayName(section.day),
      time: section.time,
      location: section.location,
      ta: section.profiles?.name || 'Unknown'
    };
    
    this.setSection(formattedSection);
    return formattedSection;
  } catch (error) {
    console.error('Error loading section:', error);
    return null;
  }
}

static getFullDayName(day) {
  const dayMap = {
    'M': 'Monday',
    'T': 'Tuesday',
    'W': 'Wednesday',
    'R': 'Thursday',
    'F': 'Friday'
  };
  
  return dayMap[day] || day;
}
}

/**
* Leaderboard Manager
* Manages the class leaderboard
*/
class LeaderboardManager {
static initialize() {
  console.log('Initializing leaderboard manager');
  
  // Initialize leaderboard data
  this.leaderboardData = [];
  
  console.log('Leaderboard manager initialized');
}

static async loadLeaderboard() {
  console.log('Loading leaderboard data');
  
  try {
    const gameSession = GameData.getGameSession();
    
    if (!gameSession) {
      throw new Error('No active game session');
    }
    
    // Get leaderboard data from database
    const { data, error } = await SupabaseConnector.supabase
      .from('game_participants')
      .select('*')
      .eq('game_id', gameSession.id);
    
    if (error) throw error;
    
    if (data) {
      console.log('Found leaderboard data:', data);
      
      // Format leaderboard data
      this.leaderboardData = data.map(participant => ({
        studentId: participant.student_id,
        studentName: participant.student_name,
        portfolioValue: participant.portfolio_value || 10000,
        lastUpdated: participant.last_updated
      }));
      
      // Sort by portfolio value
      this.leaderboardData.sort((a, b) => b.portfolioValue - a.portfolioValue);
    }
    
    return this.leaderboardData;
  } catch (error) {
    console.error('Error loading leaderboard:', error);
    return [];
  }
}

static updateLeaderboard() {
  console.log('Updating leaderboard display');
  
  const leaderboardBody = document.getElementById('class-leaderboard-body');
  const playerCount = document.getElementById('player-count');
  
  if (!leaderboardBody || !playerCount) return;
  
  // Clear leaderboard
  leaderboardBody.innerHTML = '';
  
  if (this.leaderboardData.length === 0) {
    leaderboardBody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center py-3">
          No participants have joined the game yet.
        </td>
      </tr>
    `;
    playerCount.textContent = '0';
    return;
  }
  
  // Get current user ID
  const currentUserId = SupabaseConnector.supabase.auth.getUser()
    .then(({ data }) => data.user?.id)
    .catch(() => null);
  
  // Add each participant to the leaderboard
  this.leaderboardData.forEach((participant, index) => {
    const rank = index + 1;
    const row = document.createElement('tr');
    
    // Highlight current user
    if (participant.studentId === currentUserId) {
      row.classList.add('table-primary');
    }
    
    // Create rank cell with badge for top 3
    let rankCell = '';
    if (rank <= 3) {
      rankCell = `
        <td>
          <div class="rank-badge rank-${rank}">
            ${rank}
          </div>
        </td>
      `;
    } else {
      rankCell = `<td>${rank}</td>`;
    }
    
    // Calculate return percentage
    const returnPct = ((participant.portfolioValue - 10000) / 10000) * 100;
    const returnClass = returnPct >= 0 ? 'text-success' : 'text-danger';
    
    // Format portfolio value
    const formattedValue = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(participant.portfolioValue);
    
    // Create the row HTML
    row.innerHTML = `
      ${rankCell}
      <td>${participant.studentName}${participant.studentId === currentUserId ? ' <span class="badge badge-info">You</span>' : ''}</td>
      <td>${formattedValue}</td>
      <td class="${returnClass}">${returnPct >= 0 ? '+' : ''}${returnPct.toFixed(2)}%</td>
    `;
    
    leaderboardBody.appendChild(row);
  });
  
  // Update player count
  playerCount.textContent = this.leaderboardData.length;
}

static startLeaderboardPolling() {
  console.log('Starting leaderboard polling');
  
  // Poll every 10 seconds
  const intervalId = setInterval(async () => {
    try {
      await this.loadLeaderboard();
      this.updateLeaderboard();
    } catch (error) {
      console.error('Error polling leaderboard:', error);
    }
  }, 10000);
  
  return intervalId;
}
}

// ======= MAIN APPLICATION =======

// Initialize the application
async function initializeApp() {
console.log('Initializing application');

try {
  // Initialize components
  await SupabaseConnector.initialize();
  GameData.initialize();
  UIController.initialize();
  MarketSimulator.initialize();
  PortfolioManager.initialize();
  LeaderboardManager.initialize();
  
  // Create game state machine
  const gameStateMachine = new GameStateMachine();
  
  // Register state change listener
  gameStateMachine.on('stateChanged', async (data) => {
    console.log('Game state changed:', data);
    
    // Update UI based on state
    UIController.updateSectionInfo();
  });
  
  // Initialize game state machine
  await gameStateMachine.initialize();
  
  console.log('Application initialized successfully');
} catch (error) {
  console.error('Error initializing application:', error);
  UIController.showErrorScreen(error);
}
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);