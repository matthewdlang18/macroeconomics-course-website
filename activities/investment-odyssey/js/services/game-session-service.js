/**
 * Game Session Service for Investment Odyssey
 * 
 * This service handles all interactions with the game_sessions, game_states,
 * player_states, and game_participants tables in the Supabase database.
 * 
 * It provides a clean interface for the TA controls and class game functionality.
 */

import BaseService from './base-service.js';

class GameSessionService extends BaseService {
  constructor() {
    super();
  }

  /**
   * Create a new game session for a section
   * 
   * @param {string} sectionId - The ID of the section for this game
   * @param {number} maxRounds - Maximum number of rounds (default: 20)
   * @returns {Promise<object>} - Result object with success/error status and data
   */
  async createGame(sectionId, maxRounds = 20) {
    try {
      // Validate inputs
      if (!sectionId) {
        return this.error('Section ID is required');
      }

      // Create game session
      const { data, error } = await this.supabase
        .from('game_sessions')
        .insert({
          section_id: sectionId,
          current_round: 0,
          max_rounds: maxRounds,
          status: 'active',
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        return this.error('Error creating game session', error);
      }

      return this.success(data);
    } catch (error) {
      return this.error('Exception creating game session', error);
    }
  }

  /**
   * Get a game session by ID
   * 
   * @param {string} gameId - The ID of the game to retrieve
   * @returns {Promise<object>} - Result object with success/error status and data
   */
  async getGame(gameId) {
    try {
      if (!gameId) {
        return this.error('Game ID is required');
      }

      const { data, error } = await this.supabase
        .from('game_sessions')
        .select(`
          *,
          section:section_id (
            id,
            day,
            time,
            location,
            ta_id,
            ta:ta_id (
              name
            )
          )
        `)
        .eq('id', gameId)
        .single();

      if (error) {
        return this.error('Error retrieving game session', error);
      }

      return this.success(data);
    } catch (error) {
      return this.error('Exception retrieving game session', error);
    }
  }

  /**
   * Get active game for a section
   * 
   * @param {string} sectionId - The ID of the section
   * @returns {Promise<object>} - Result object with success/error status and data
   */
  async getActiveGameForSection(sectionId) {
    try {
      if (!sectionId) {
        return this.error('Section ID is required');
      }

      const { data, error } = await this.supabase
        .from('game_sessions')
        .select('*')
        .eq('section_id', sectionId)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        return this.error('Error retrieving active game', error);
      }

      return this.success(data);
    } catch (error) {
      return this.error('Exception retrieving active game', error);
    }
  }

  /**
   * Advance a game to the next round
   * 
   * @param {string} gameId - The ID of the game to advance
   * @returns {Promise<object>} - Result object with success/error status and data
   */
  async advanceRound(gameId) {
    try {
      if (!gameId) {
        return this.error('Game ID is required');
      }

      // Get current game state
      const { data: game, error: gameError } = await this.supabase
        .from('game_sessions')
        .select('*')
        .eq('id', gameId)
        .single();

      if (gameError) {
        return this.error('Error retrieving game session', gameError);
      }

      // Check if game is active
      if (game.status !== 'active' && game.active !== true) {
        return this.error('Game is not active');
      }

      // Check if game is already at max rounds
      if (game.current_round >= game.max_rounds) {
        return this.error('Game has already reached maximum rounds');
      }

      // Increment round
      const newRound = game.current_round + 1;
      const { data, error } = await this.supabase
        .from('game_sessions')
        .update({
          current_round: newRound,
          updated_at: new Date().toISOString()
        })
        .eq('id', gameId)
        .select()
        .single();

      if (error) {
        return this.error('Error advancing round', error);
      }

      return this.success(data);
    } catch (error) {
      return this.error('Exception advancing round', error);
    }
  }

  /**
   * End a game
   * 
   * @param {string} gameId - The ID of the game to end
   * @returns {Promise<object>} - Result object with success/error status and data
   */
  async endGame(gameId) {
    try {
      if (!gameId) {
        return this.error('Game ID is required');
      }

      const { data, error } = await this.supabase
        .from('game_sessions')
        .update({
          active: false,
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', gameId)
        .select()
        .single();

      if (error) {
        return this.error('Error ending game', error);
      }

      return this.success(data);
    } catch (error) {
      return this.error('Exception ending game', error);
    }
  }

  /**
   * Join a game as a player
   * 
   * @param {string} gameId - The ID of the game to join
   * @param {string} userId - The ID of the user joining
   * @param {string} userName - The name of the user joining
   * @returns {Promise<object>} - Result object with success/error status and data
   */
  async joinGame(gameId, userId, userName) {
    try {
      if (!gameId || !userId || !userName) {
        return this.error('Game ID, user ID, and user name are required');
      }

      // Check if game exists and is active
      const { data: game, error: gameError } = await this.supabase
        .from('game_sessions')
        .select('*')
        .eq('id', gameId)
        .single();

      if (gameError) {
        return this.error('Error retrieving game session', gameError);
      }

      if (game.status !== 'active' && game.active !== true) {
        return this.error('Game is not active');
      }

      // Join game
      const { data, error } = await this.supabase
        .from('game_participants')
        .upsert({
          game_id: gameId,
          student_id: userId,
          student_name: userName,
          portfolio_value: 10000,
          last_updated: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        return this.error('Error joining game', error);
      }

      // Initialize player state if it doesn't exist
      const { data: playerState, error: playerStateError } = await this.supabase
        .from('player_states')
        .select('*')
        .eq('game_id', gameId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!playerState && !playerStateError) {
        // Create initial player state
        const { error: createError } = await this.supabase
          .from('player_states')
          .insert({
            game_id: gameId,
            user_id: userId,
            cash: 10000,
            portfolio: {},
            trade_history: [],
            portfolio_value_history: [{ round: 0, value: 10000 }],
            total_value: 10000,
            updated_at: new Date().toISOString()
          });

        if (createError) {
          console.error('Error creating initial player state:', createError);
          // Continue anyway - the player can still join the game
        }
      }

      return this.success(data);
    } catch (error) {
      return this.error('Exception joining game', error);
    }
  }

  /**
   * Get game state for a specific round
   * 
   * @param {string} gameId - The ID of the game
   * @param {number} roundNumber - The round number
   * @returns {Promise<object>} - Result object with success/error status and data
   */
  async getGameState(gameId, roundNumber) {
    try {
      if (!gameId || roundNumber === undefined) {
        return this.error('Game ID and round number are required');
      }

      // Try to get the TA-generated game state first (most authoritative)
      const { data, error } = await this.supabase
        .from('game_states')
        .select('*')
        .eq('game_id', gameId)
        .eq('round_number', roundNumber)
        .eq('user_id', '32bb7f40-5b33-4680-b0ca-76e64c5a23d9')
        .maybeSingle();

      if (!error && data) {
        return this.success(data);
      }

      // If no TA-generated state, try to get any game state for this round
      const { data: anyState, error: anyError } = await this.supabase
        .from('game_states')
        .select('*')
        .eq('game_id', gameId)
        .eq('round_number', roundNumber)
        .limit(1)
        .maybeSingle();

      if (!anyError && anyState) {
        return this.success(anyState);
      }

      // If no game state found, return null (client will need to generate one)
      return this.success(null);
    } catch (error) {
      return this.error('Exception retrieving game state', error);
    }
  }

  /**
   * Save game state for a specific round
   * 
   * @param {string} gameId - The ID of the game
   * @param {string} userId - The ID of the user saving the state
   * @param {number} roundNumber - The round number
   * @param {object} assetPrices - Asset prices for this round
   * @param {object} priceHistory - Price history up to this round
   * @param {number} cpi - CPI value for this round
   * @param {array} cpiHistory - CPI history up to this round
   * @returns {Promise<object>} - Result object with success/error status and data
   */
  async saveGameState(gameId, userId, roundNumber, assetPrices, priceHistory, cpi, cpiHistory) {
    try {
      if (!gameId || !userId || roundNumber === undefined || !assetPrices || !priceHistory) {
        return this.error('Game ID, user ID, round number, asset prices, and price history are required');
      }

      // Check if game state already exists
      const { data: existingState, error: checkError } = await this.supabase
        .from('game_states')
        .select('id')
        .eq('game_id', gameId)
        .eq('user_id', userId)
        .eq('round_number', roundNumber)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" which is expected
        return this.error('Error checking for existing game state', checkError);
      }

      let gameState;
      if (existingState) {
        // Update existing state
        const { data: updatedState, error: updateError } = await this.supabase
          .from('game_states')
          .update({
            asset_prices: assetPrices,
            price_history: priceHistory,
            cpi: cpi || 100,
            cpi_history: cpiHistory || [100],
            updated_at: new Date().toISOString()
          })
          .eq('id', existingState.id)
          .select()
          .single();

        if (updateError) {
          return this.error('Error updating game state', updateError);
        }

        gameState = updatedState;
      } else {
        // Create new state
        const { data: newState, error: insertError } = await this.supabase
          .from('game_states')
          .insert({
            game_id: gameId,
            user_id: userId,
            round_number: roundNumber,
            asset_prices: assetPrices,
            price_history: priceHistory,
            cpi: cpi || 100,
            cpi_history: cpiHistory || [100],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          return this.error('Error creating game state', insertError);
        }

        gameState = newState;
      }

      return this.success(gameState);
    } catch (error) {
      return this.error('Exception saving game state', error);
    }
  }

  /**
   * Get player state for a game
   * 
   * @param {string} gameId - The ID of the game
   * @param {string} userId - The ID of the user
   * @returns {Promise<object>} - Result object with success/error status and data
   */
  async getPlayerState(gameId, userId) {
    try {
      if (!gameId || !userId) {
        return this.error('Game ID and user ID are required');
      }

      const { data, error } = await this.supabase
        .from('player_states')
        .select('*')
        .eq('game_id', gameId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        return this.error('Error retrieving player state', error);
      }

      return this.success(data);
    } catch (error) {
      return this.error('Exception retrieving player state', error);
    }
  }

  /**
   * Save player state for a game
   * 
   * @param {string} gameId - The ID of the game
   * @param {string} userId - The ID of the user
   * @param {number} cash - Cash amount
   * @param {object} portfolio - Portfolio of assets
   * @param {array} tradeHistory - History of trades
   * @param {array} portfolioValueHistory - History of portfolio values
   * @param {number} totalValue - Total portfolio value
   * @returns {Promise<object>} - Result object with success/error status and data
   */
  async savePlayerState(gameId, userId, cash, portfolio, tradeHistory, portfolioValueHistory, totalValue) {
    try {
      if (!gameId || !userId || cash === undefined || !portfolio) {
        return this.error('Game ID, user ID, cash, and portfolio are required');
      }

      // Check if player state already exists
      const { data: existingState, error: checkError } = await this.supabase
        .from('player_states')
        .select('id')
        .eq('game_id', gameId)
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" which is expected
        return this.error('Error checking for existing player state', checkError);
      }

      let playerState;
      if (existingState) {
        // Update existing state
        const { data: updatedState, error: updateError } = await this.supabase
          .from('player_states')
          .update({
            cash: cash,
            portfolio: portfolio,
            trade_history: tradeHistory || [],
            portfolio_value_history: portfolioValueHistory || [],
            total_value: totalValue || cash,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingState.id)
          .select()
          .single();

        if (updateError) {
          return this.error('Error updating player state', updateError);
        }

        playerState = updatedState;
      } else {
        // Create new state
        const { data: newState, error: insertError } = await this.supabase
          .from('player_states')
          .insert({
            game_id: gameId,
            user_id: userId,
            cash: cash,
            portfolio: portfolio,
            trade_history: tradeHistory || [],
            portfolio_value_history: portfolioValueHistory || [],
            total_value: totalValue || cash,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          return this.error('Error creating player state', insertError);
        }

        playerState = newState;
      }

      // Also update the game_participants table
      try {
        await this.supabase
          .from('game_participants')
          .upsert({
            game_id: gameId,
            student_id: userId,
            portfolio_value: totalValue || cash,
            last_updated: new Date().toISOString()
          });
      } catch (participantError) {
        console.error('Error updating game participant:', participantError);
        // Continue anyway - the player state is more important
      }

      return this.success(playerState);
    } catch (error) {
      return this.error('Exception saving player state', error);
    }
  }

  /**
   * Get participants for a game
   * 
   * @param {string} gameId - The ID of the game
   * @returns {Promise<object>} - Result object with success/error status and data
   */
  async getGameParticipants(gameId) {
    try {
      if (!gameId) {
        return this.error('Game ID is required');
      }

      const { data, error } = await this.supabase
        .from('game_participants')
        .select('*')
        .eq('game_id', gameId)
        .order('portfolio_value', { ascending: false });

      if (error) {
        return this.error('Error retrieving game participants', error);
      }

      return this.success(data);
    } catch (error) {
      return this.error('Exception retrieving game participants', error);
    }
  }

  /**
   * Get all games for a section
   * 
   * @param {string} sectionId - The ID of the section
   * @returns {Promise<object>} - Result object with success/error status and data
   */
  async getGamesForSection(sectionId) {
    try {
      if (!sectionId) {
        return this.error('Section ID is required');
      }

      const { data, error } = await this.supabase
        .from('game_sessions')
        .select('*')
        .eq('section_id', sectionId)
        .order('created_at', { ascending: false });

      if (error) {
        return this.error('Error retrieving games for section', error);
      }

      return this.success(data);
    } catch (error) {
      return this.error('Exception retrieving games for section', error);
    }
  }
}

// Create and export singleton instance
const gameSessionService = new GameSessionService();
export default gameSessionService;
