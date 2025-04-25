// Investment Odyssey Supabase Integration

// Use the Supabase client that was initialized in supabase-init.js
// This ensures we're using the same client throughout the application
const supabase = window.supabase;

// Store the current user profile
let currentUser = null;

// Initialize the game with user data from the parent application
async function initializeUser(userData) {
  currentUser = userData;
  displayUserInfo();

  // Since we don't have email in the profiles table, we'll use a different approach
  // We'll use the service role key to bypass RLS for now
  // In a real application, you would implement proper authentication

  // For now, we'll just store the user data and proceed
  return;
}

// Display user information in the header
function displayUserInfo() {
  const userInfoElement = document.getElementById('user-info');
  if (currentUser) {
    userInfoElement.innerHTML = `
      <span>Welcome, ${currentUser.name}</span>
      <button id="back-to-dashboard" class="secondary-btn">Back to Dashboard</button>
    `;

    // Add event listener for the back button
    document.getElementById('back-to-dashboard').addEventListener('click', () => {
      window.location.href = '../index.html';
    });
  }
}

// Check if a game session exists for the current user's section
async function checkExistingGameSession() {
  if (!currentUser || !currentUser.section_id) return null;

  const { data, error } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('section_id', currentUser.section_id)
    .eq('active', true)
    .maybeSingle();

  if (error) {
    console.error('Error checking for game session:', error);
    return null;
  }

  return data;
}

// Create a new game session for single player mode
async function createSinglePlayerGame() {
  if (!currentUser) return null;

  try {
    // Create a game session with 5 rounds
    const { data: gameSession, error: sessionError } = await supabase
      .from('game_sessions')
      .insert([
        {
          section_id: currentUser.section_id,
          current_round: 0,
          max_rounds: 5, // Simplified to 5 rounds
          active: true
        }
      ])
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating game session:', sessionError);
      return null;
    }

    // Initialize game state with starting asset prices
    const initialGameState = {
      game_id: gameSession.id,
      user_id: currentUser.id,
      round_number: 0,
      asset_prices: {
        'S&P 500': 100,
        'Bonds': 100,
        'Real Estate': 5000,
        'Gold': 3000,
        'Commodities': 100,
        'Bitcoin': 50000
      },
      price_history: {
        'S&P 500': [100],
        'Bonds': [100],
        'Real Estate': [5000],
        'Gold': [3000],
        'Commodities': [100],
        'Bitcoin': [50000]
      },
      cpi: 100,
      cpi_history: [100],
      last_bitcoin_crash_round: 0,
      bitcoin_shock_range: [-0.5, -0.75]
    };

    // Save initial game state to Supabase
    const { error: gameStateError } = await supabase
      .from('game_states')
      .insert([initialGameState]);

    if (gameStateError) {
      console.error('Error creating initial game state:', gameStateError);
      // Delete the game session if we couldn't create the game state
      await supabase.from('game_sessions').delete().eq('id', gameSession.id);
      return null;
    }

    return gameSession;
  } catch (error) {
    console.error('Error in createSinglePlayerGame:', error);
    return null;
  }
}

// Join an existing game session
async function joinGameSession(gameId) {
  if (!currentUser) return false;

  try {
    // Check if player already exists
    const { data: existingPlayers } = await supabase
      .from('player_states')
      .select('id')
      .eq('game_id', gameId)
      .eq('user_id', currentUser.id);

    if (existingPlayers && existingPlayers.length > 0) {
      return true; // Player already joined
    }

    // Initialize player state for this game
    const { error } = await supabase
      .from('player_states')
      .insert([
        {
          game_id: gameId,
          user_id: currentUser.id,
          cash: 10000,
          portfolio: {},
          trade_history: [],
          portfolio_value_history: [10000],
          total_value: 10000
        }
      ]);

    if (error) {
      // Check if error is because player already exists (unique violation)
      if (error.code === '23505') { // Unique violation
        return true; // Player already joined
      }
      console.error('Error joining game session:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in joinGameSession:', error);
    return false;
  }
}

// Get player state for the current game
async function getPlayerState(gameId) {
  if (!currentUser) return null;

  try {
    const { data, error } = await supabase
      .from('player_states')
      .select('*')
      .eq('game_id', gameId)
      .eq('user_id', currentUser.id)
      .maybeSingle();

    if (error) {
      console.error('Error getting player state:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getPlayerState:', error);
    return null;
  }
}

// Get game state for the current round
async function getGameState(gameId, roundNumber) {
  try {
    const { data, error } = await supabase
      .from('game_states')
      .select('*')
      .eq('game_id', gameId)
      .eq('round_number', roundNumber)
      .maybeSingle();

    if (error) {
      console.error('Error getting game state:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getGameState:', error);
    return null;
  }
}

// Update player state after making trades
async function updatePlayerState(gameId, updatedState) {
  if (!currentUser) return false;

  try {
    // Create a copy of the state to modify
    const stateToUpdate = { ...updatedState };

    // Handle portfolio value history naming inconsistency
    if (stateToUpdate.portfolioValueHistory && !stateToUpdate.portfolio_value_history) {
      stateToUpdate.portfolio_value_history = stateToUpdate.portfolioValueHistory;
      delete stateToUpdate.portfolioValueHistory; // Remove the camelCase version
    } else if (stateToUpdate.portfolio_value_history && !stateToUpdate.portfolioValueHistory) {
      // Keep using snake_case version which matches the database schema
    }

    // Handle trade history naming inconsistency
    if (stateToUpdate.tradeHistory) {
      // If tradeHistory exists, convert it to trade_history
      stateToUpdate.trade_history = stateToUpdate.tradeHistory;
      delete stateToUpdate.tradeHistory; // Remove the camelCase version
    }

    // Make sure portfolio_value_history is an array
    if (!stateToUpdate.portfolio_value_history) {
      stateToUpdate.portfolio_value_history = [stateToUpdate.total_value || 10000];
    } else if (!Array.isArray(stateToUpdate.portfolio_value_history)) {
      stateToUpdate.portfolio_value_history = [stateToUpdate.total_value || 10000];
    }

    // Make sure trade_history is an array
    if (!stateToUpdate.trade_history) {
      stateToUpdate.trade_history = [];
    } else if (!Array.isArray(stateToUpdate.trade_history)) {
      stateToUpdate.trade_history = [];
    }

    // Create a clean version of the state with only the columns that exist in the database
    const cleanState = {
      cash: stateToUpdate.cash,
      portfolio: stateToUpdate.portfolio,
      portfolio_value_history: stateToUpdate.portfolio_value_history,
      trade_history: stateToUpdate.trade_history,
      total_value: stateToUpdate.total_value || (stateToUpdate.cash + calculatePortfolioValue(stateToUpdate.portfolio, gameState?.asset_prices || {}))
    };

    console.log('Updating player state with:', cleanState);

    const { error } = await supabase
      .from('player_states')
      .update(cleanState)
      .eq('game_id', gameId)
      .eq('user_id', currentUser.id);

    if (error) {
      console.error('Error updating player state:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updatePlayerState:', error);
    return false;
  }
}

// Helper function to calculate portfolio value
function calculatePortfolioValue(portfolio, assetPrices) {
  let value = 0;
  if (!portfolio || !assetPrices) return value;

  for (const [asset, quantity] of Object.entries(portfolio)) {
    const price = assetPrices[asset] || 0;
    value += price * quantity;
  }

  return value;
}

// Save game results to leaderboard
async function saveToLeaderboard(gameId, playerState, gameState) {
  if (!currentUser) {
    console.error('No current user found');
    return false;
  }

  try {
    console.log('Saving game results to leaderboard for game:', gameId);

    // Make sure we have the correct asset prices
    let assetPrices = gameState.assetPrices || gameState.asset_prices;

    // If we don't have asset prices in the provided gameState, fetch the latest from the database
    if (!assetPrices || Object.keys(assetPrices).length === 0) {
      console.log('Asset prices not found in provided gameState, fetching from database...');
      const { data: latestGameState, error: gameStateError } = await supabase
        .from('game_states')
        .select('*')
        .eq('game_id', gameId)
        .order('round_number', { ascending: false })
        .limit(1)
        .single();

      if (gameStateError) {
        console.error('Error getting latest game state:', gameStateError);
      } else if (latestGameState) {
        assetPrices = latestGameState.asset_prices;
        console.log('Using asset prices from latest game state in database');
      }
    }

    // Calculate final portfolio value
    const portfolioValue = calculatePortfolioValue(playerState.portfolio, assetPrices);
    const totalValue = playerState.cash + portfolioValue;

    // Log the values for debugging
    console.log('Final values for leaderboard:', {
      portfolioValue,
      cash: playerState.cash,
      totalValue,
      portfolio: playerState.portfolio,
      assetPrices
    });

    // Calculate performance metrics
    const initialValue = 10000; // Starting cash
    const totalReturn = totalValue - initialValue;
    const percentReturn = (totalReturn / initialValue) * 100;

    // Calculate inflation-adjusted return
    const cpi = gameState.cpi || gameState.CPI || 100;
    const realReturn = (totalValue / cpi * 100) - initialValue;
    const realPercentReturn = (realReturn / initialValue) * 100;

    // Update player state with final total value
    const { error: updatePlayerError } = await supabase
      .from('player_states')
      .update({ total_value: totalValue })
      .eq('game_id', gameId)
      .eq('user_id', currentUser.id);

    if (updatePlayerError) {
      console.error('Error updating player state with final value:', updatePlayerError);
      // Continue anyway to try to save to leaderboard
    }

    // Create leaderboard entry - match the exact schema from db-setup.sql
    const leaderboardEntry = {
      game_id: gameId,
      user_id: currentUser.id,
      user_name: currentUser.name || 'Anonymous',
      game_mode: 'single',
      section_id: currentUser.section_id,
      final_value: totalValue // Use the calculated total value
      // No percent_return or real_return fields in the schema
    };

    console.log('Final leaderboard entry with total value:', totalValue);

    console.log('Leaderboard entry:', leaderboardEntry);

    // Save to leaderboard table
    const { data, error } = await supabase
      .from('leaderboard')
      .upsert([leaderboardEntry], { onConflict: 'game_id,user_id' })
      .select()
      .single();

    if (error) {
      console.error('Error saving to leaderboard:', error);
      return false;
    }

    console.log('Successfully saved to leaderboard:', data);
    return true;
  } catch (error) {
    console.error('Error in saveToLeaderboard:', error);
    return false;
  }
}

// Create a new game state for the next round
async function createNextRoundState(gameId, previousState) {
  if (!currentUser) {
    console.error('No current user found');
    return null;
  }

  try {
    console.log('Creating next round state for game:', gameId);

    // Normalize previous state to handle different property naming conventions
    const normalizedPreviousState = window.normalizeGameState ?
      window.normalizeGameState(previousState) : previousState;

    // Get the current game session
    const { data: gameSession, error: sessionError } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', gameId)
      .single();

    if (sessionError) {
      console.error('Error getting game session:', sessionError);
      return null;
    }

    // Calculate new round number
    const newRoundNumber = gameSession.current_round + 1;
    console.log('New round number:', newRoundNumber);

    // Check if we've reached the maximum number of rounds
    if (newRoundNumber > gameSession.max_rounds) {
      console.log('Game over: reached maximum rounds');
      return { gameOver: true };
    }

    // Get asset prices from previous state, handling different property names
    const previousPrices = normalizedPreviousState.asset_prices || normalizedPreviousState.assetPrices;
    if (!previousPrices) {
      console.error('Previous prices not found in game state');
      return null;
    }

    // Generate new asset prices based on previous state
    let newPrices;
    if (window.priceGenerator && typeof window.priceGenerator.generateNewPrices === 'function') {
      console.log('Using window.priceGenerator.generateNewPrices');
      newPrices = window.priceGenerator.generateNewPrices(previousPrices, normalizedPreviousState);
    } else {
      console.log('Using fallback generateNewPrices');
      newPrices = generateNewPrices(previousPrices, normalizedPreviousState);
    }

    console.log('New prices generated:', newPrices);

    // Get price history from previous state, handling different property names
    const previousPriceHistory = normalizedPreviousState.price_history || normalizedPreviousState.priceHistory;
    if (!previousPriceHistory) {
      console.error('Previous price history not found in game state');
      return null;
    }

    // Create price history by copying previous history and adding new prices
    const newPriceHistory = {};
    for (const asset in previousPriceHistory) {
      newPriceHistory[asset] = [...previousPriceHistory[asset], newPrices[asset]];
    }

    // Get CPI from previous state, handling different property names
    const previousCPI = normalizedPreviousState.cpi || normalizedPreviousState.CPI;
    if (!previousCPI) {
      console.error('Previous CPI not found in game state');
      return null;
    }

    // Update CPI (simplified for now)
    const cpiChange = -0.01 + Math.random() * 0.04; // Between -1% and 3%
    const newCPI = previousCPI * (1 + cpiChange);

    // Get CPI history from previous state, handling different property names
    const previousCPIHistory = normalizedPreviousState.cpi_history || normalizedPreviousState.CPIHistory || [];

    // Get Bitcoin crash data from previous state, handling different property names
    const lastBitcoinCrashRound = normalizedPreviousState.last_bitcoin_crash_round ||
      normalizedPreviousState.lastBitcoinCrashRound || 0;
    const bitcoinShockRange = normalizedPreviousState.bitcoin_shock_range ||
      normalizedPreviousState.bitcoinShockRange || [-0.5, -0.75];

    // Create new game state
    const newGameState = {
      game_id: gameId,
      user_id: currentUser.id,
      round_number: newRoundNumber,
      asset_prices: newPrices,
      price_history: newPriceHistory,
      cpi: newCPI,
      cpi_history: [...previousCPIHistory, newCPI],
      last_bitcoin_crash_round: lastBitcoinCrashRound,
      bitcoin_shock_range: bitcoinShockRange
    };

    // Check for Bitcoin crash (handled by price generator)
    // If a crash occurred, update the last crash round and shock range
    if (newGameState.asset_prices['Bitcoin'] < previousPrices['Bitcoin'] * 0.7) {
      console.log('Bitcoin crash detected (>30% drop)');
      // A significant drop occurred (more than 30%), consider it a crash
      newGameState.last_bitcoin_crash_round = newRoundNumber;

      // Update shock range for next crash (less severe but still negative)
      newGameState.bitcoin_shock_range = [
        Math.min(Math.max(bitcoinShockRange[0] + 0.1, -0.5), -0.05),
        Math.min(Math.max(bitcoinShockRange[1] + 0.1, -0.75), -0.15)
      ];
    }

    console.log('Saving new game state to Supabase');

    // First check if a state for this round already exists
    try {
      const { data: existingState, error: checkError } = await supabase
        .from('game_states')
        .select('*')
        .eq('game_id', gameId)
        .eq('user_id', currentUser.id)
        .eq('round_number', newRoundNumber)
        .maybeSingle();

      // If there's already a state for this round, use it instead of creating a new one
      if (existingState) {
        console.log('Found existing game state for this round, using it instead');
        return existingState;
      }

      // If there was an error, log it but continue
      if (checkError) {
        console.warn('Error checking for existing game state:', checkError);
      }

      // Use upsert instead of insert to handle potential race conditions
      const { data, error: gameStateError } = await supabase
        .from('game_states')
        .upsert([newGameState], { onConflict: 'game_id,user_id,round_number' })
        .select()
        .maybeSingle();

      if (gameStateError) {
        console.error('Error creating new game state:', gameStateError);

        // If it's a duplicate key error, try to get the existing state
        if (gameStateError.code === '23505') {
          console.log('Duplicate key error, trying to get existing state');
          const { data: existingData, error: getError } = await supabase
            .from('game_states')
            .select('*')
            .eq('game_id', gameId)
            .eq('user_id', currentUser.id)
            .eq('round_number', newRoundNumber)
            .maybeSingle();

          if (getError) {
            console.error('Error getting existing game state:', getError);
            return null;
          }

          return existingData;
        }

        return null;
      }

      return data;
    } catch (error) {
      console.error('Error handling game state creation/retrieval:', error);
      return null;
    }

    // Update game session with new round number
    try {
      console.log('Updating game session with new round number');

      const { error: updateError } = await supabase
        .from('game_sessions')
        .update({ current_round: newRoundNumber })
        .eq('id', gameId);

      if (updateError) {
        console.error('Error updating game session:', updateError);
      }
    } catch (error) {
      console.error('Error updating game session:', error);
    }

    // Try to get the game state one more time to ensure we return the correct data
    try {
      const { data: finalState, error: finalError } = await supabase
        .from('game_states')
        .select('*')
        .eq('game_id', gameId)
        .eq('user_id', currentUser.id)
        .eq('round_number', newRoundNumber)
        .maybeSingle();

      if (finalError) {
        console.error('Error getting final game state:', finalError);
      } else if (finalState) {
        return finalState;
      }
    } catch (error) {
      console.error('Error getting final game state:', error);
    }

    // If we get here, something went wrong, but we'll return the newGameState anyway
    return newGameState;
  } catch (error) {
    console.error('Error in createNextRoundState:', error);
    return null;
  }
}

// Generate new prices based on previous prices
function generateNewPrices(previousPrices, gameState) {
  // Use the advanced price generator if available, otherwise fall back to simple generation
  if (window.priceGenerator) {
    return window.priceGenerator.generateNewPrices(previousPrices, gameState);
  }

  // Fallback simple price generation (for backward compatibility)
  const newPrices = {};

  // Define asset parameters (simplified version)
  const assetParams = {
    'S&P 500': { mean: 0.03, stdDev: 0.05, min: -0.15, max: 0.15 },
    'Bonds': { mean: 0.01, stdDev: 0.01, min: 0, max: 0.05 },
    'Real Estate': { mean: 0.02, stdDev: 0.03, min: -0.05, max: 0.08 },
    'Gold': { mean: 0.02, stdDev: 0.06, min: -0.10, max: 0.12 },
    'Commodities': { mean: 0.025, stdDev: 0.04, min: -0.08, max: 0.10 },
    'Bitcoin': { mean: 0.10, stdDev: 0.25, min: -0.30, max: 0.50 }
  };

  // Generate new prices for each asset
  for (const asset in previousPrices) {
    // Special case for Bitcoin
    if (asset === 'Bitcoin') {
      // Bitcoin has more volatility
      const params = assetParams[asset];
      const randomFactor = (Math.random() * 2 - 1) * params.stdDev;
      const percentChange = params.mean + randomFactor;

      // Ensure return is within bounds
      const boundedChange = Math.max(
        params.min,
        Math.min(params.max, percentChange)
      );

      newPrices[asset] = previousPrices[asset] * (1 + boundedChange);
    } else {
      // Regular assets
      const params = assetParams[asset];
      const randomFactor = (Math.random() * 2 - 1) * params.stdDev;
      const percentChange = params.mean + randomFactor;

      // Ensure return is within bounds
      const boundedChange = Math.max(
        params.min,
        Math.min(params.max, percentChange)
      );

      newPrices[asset] = previousPrices[asset] * (1 + boundedChange);
    }
  }

  return newPrices;
}

// Complete the game and save to leaderboard
async function completeGame(gameId) {
  if (!currentUser) return false;

  try {
    // Get final player state
    const { data: playerState, error: playerError } = await supabase
      .from('player_states')
      .select('*')
      .eq('game_id', gameId)
      .eq('user_id', currentUser.id)
      .single();

    if (playerError) {
      console.error('Error getting player state:', playerError);
      return false;
    }

    // Get the latest game state to calculate the final portfolio value
    const { data: gameState, error: gameStateError } = await supabase
      .from('game_states')
      .select('*')
      .eq('game_id', gameId)
      .order('round_number', { ascending: false })
      .limit(1)
      .single();

    if (gameStateError) {
      console.error('Error getting game state:', gameStateError);
      return false;
    }

    // Calculate the final portfolio value
    const portfolioValue = calculatePortfolioValue(playerState.portfolio, gameState.asset_prices);
    const totalValue = playerState.cash + portfolioValue;

    // Update the player state with the final total value
    console.log('Calculated final portfolio value:', {
      portfolioValue,
      cash: playerState.cash,
      totalValue
    });

    // Update the player state with the final total value
    const { error: updatePlayerError } = await supabase
      .from('player_states')
      .update({ total_value: totalValue })
      .eq('game_id', gameId)
      .eq('user_id', currentUser.id);

    if (updatePlayerError) {
      console.error('Error updating player state with final value:', updatePlayerError);
      // Continue anyway to try to save to leaderboard
    }

    // Get game session
    const { data: gameSession, error: sessionError } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', gameId)
      .single();

    if (sessionError) {
      console.error('Error getting game session:', sessionError);
      return false;
    }

    // Check if entry already exists in leaderboard
    const { data: existingEntry, error: checkError } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('user_id', currentUser.id)
      .eq('game_id', gameId)
      .single();

    if (existingEntry) {
      console.log('Entry already exists in leaderboard, updating with final value:', totalValue);

      // Update existing entry
      const { error: updateError } = await supabase
        .from('leaderboard')
        .update({ final_value: totalValue })
        .eq('user_id', currentUser.id)
        .eq('game_id', gameId);

      if (updateError) {
        console.error('Error updating leaderboard entry:', updateError);
        return false;
      }
    } else {
      // Add or update entry in leaderboard using upsert
      try {
        const leaderboardEntry = {
          user_id: currentUser.id,
          user_name: currentUser.name || 'Anonymous',
          game_mode: 'single',
          game_id: gameId,
          section_id: gameSession.section_id,
          final_value: totalValue
          // Ensure we only include fields that exist in the schema
        };

        console.log('Upserting leaderboard entry:', leaderboardEntry);

        const { error: leaderboardError } = await supabase
          .from('leaderboard')
          .upsert([leaderboardEntry], { onConflict: 'user_id,game_id' })
          .select();

        if (leaderboardError) {
          console.error('Error upserting to leaderboard:', leaderboardError);

          // If it's still a duplicate key error, try a direct update as a fallback
          if (leaderboardError.code === '23505') {
            console.log('Duplicate key error even with upsert, trying direct update');

            const { error: updateError } = await supabase
              .from('leaderboard')
              .update({ final_value: totalValue }) // Use the calculated totalValue
              .eq('user_id', currentUser.id)
              .eq('game_id', gameId);

            if (updateError) {
              console.error('Error updating leaderboard entry:', updateError);
              return false;
            }
          } else {
            return false;
          }
        }
      } catch (error) {
        console.error('Error handling leaderboard upsert:', error);
        return false;
      }
    }

    // Mark game as inactive
    const { error: updateError } = await supabase
      .from('game_sessions')
      .update({ active: false })
      .eq('id', gameId);

    if (updateError) {
      console.error('Error updating game session:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in completeGame:', error);
    return false;
  }
}

// Check for existing game session
async function checkExistingGameSession(sectionId) {
  try {
    // Get current user
    if (!currentUser) {
      console.error('No current user found');
      return null;
    }

    // Check for active class game for the user's section
    if (!sectionId) {
      sectionId = localStorage.getItem('section_id');
      if (!sectionId) {
        console.log('No section ID found');
        return null;
      }
    }

    // Query for active class game for this section
    const { data: gameSessions, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('section_id', sectionId)
      .eq('active', true)
      .eq('type', 'class')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error checking for existing game session:', error);
      return null;
    }

    if (!gameSessions || gameSessions.length === 0) {
      console.log('No active class game found for section:', sectionId);
      return null;
    }

    console.log('Found active class game:', gameSessions[0]);
    return gameSessions[0];
  } catch (error) {
    console.error('Error in checkExistingGameSession:', error);
    return null;
  }
}

// Export functions for use in game.js
window.gameSupabase = {
  initializeUser,
  checkExistingGameSession,
  createSinglePlayerGame,
  joinGameSession,
  getPlayerState,
  getGameState,
  updatePlayerState,
  createNextRoundState,
  completeGame,
  saveToLeaderboard
};
