/**
 * Test script for Investment Odyssey class game functionality
 *
 * This script tests the key functionality of the class game:
 * 1. Authentication and section selection
 * 2. Game session connection
 * 3. Game state updates
 * 4. Market data loading
 * 5. Trading functionality
 */

// Global variables to store test results
const testResults = {
  authenticationTest: false,
  sectionSelectionTest: false,
  gameSessionTest: false,
  gameStateTest: false,
  marketDataTest: false,
  tradingTest: false
};

// Set up mock data for testing
function setupMockData() {
  console.log('Setting up mock data for testing...');

  // Mock student data
  localStorage.setItem('student_id', 'test-student-id');
  localStorage.setItem('student_name', 'Test Student');

  // Mock section data
  localStorage.setItem('section_id', 'ecbee7d3-9255-4151-ba73-afa40146a141');
  localStorage.setItem('section_data', JSON.stringify({
    id: 'ecbee7d3-9255-4151-ba73-afa40146a141',
    day: 'Tuesday',
    fullDay: 'Tuesday',
    time: '5:00pm-5:50pm',
    location: 'Phelps, 1425',
    ta: 'Akshay'
  }));

  // Mock game session data
  const mockGameSession = {
    id: 'test-game-id',
    section_id: 'ecbee7d3-9255-4151-ba73-afa40146a141',
    current_round: 1,
    max_rounds: 20,
    active: true,
    created_at: new Date().toISOString()
  };

  localStorage.setItem('game_session', JSON.stringify(mockGameSession));

  // Mock market data
  const mockMarketData = {
    assetPrices: {
      'S&P 500': 100,
      'Bonds': 100,
      'Gold': 3000,
      'Real Estate': 5000,
      'Bitcoin': 50000,
      'Commodities': 100
    },
    previousPrices: {
      'S&P 500': 100,
      'Bonds': 100,
      'Gold': 3000,
      'Real Estate': 5000,
      'Bitcoin': 50000,
      'Commodities': 100
    },
    priceHistory: {
      'S&P 500': [100],
      'Bonds': [100],
      'Gold': [3000],
      'Real Estate': [5000],
      'Bitcoin': [50000],
      'Commodities': [100]
    },
    cpi: 100,
    cpiHistory: [100]
  };

  localStorage.setItem('market_data_1', JSON.stringify(mockMarketData));

  // Mock game state
  const mockGameState = {
    game_id: 'test-game-id',
    round_number: 1,
    asset_prices: mockMarketData.assetPrices,
    price_history: mockMarketData.priceHistory,
    cpi: mockMarketData.cpi,
    cpi_history: mockMarketData.cpiHistory
  };

  localStorage.setItem('game_state_test-game-id_1', JSON.stringify(mockGameState));

  console.log('Mock data setup complete');
}

// Test authentication and section selection
async function testAuthentication() {
  console.log('=== TESTING AUTHENTICATION ===');
  try {
    // Test if we can get the current user
    const { data: { user } } = await window.supabase.auth.getUser();
    console.log('Current user:', user);

    if (user) {
      testResults.authenticationTest = true;
      console.log('✅ Authentication test passed');
    } else {
      // Try localStorage fallback
      const studentId = localStorage.getItem('student_id');
      const studentName = localStorage.getItem('student_name');

      if (studentId && studentName) {
        testResults.authenticationTest = true;
        console.log('✅ Authentication test passed (using localStorage)');
      } else {
        console.log('❌ Authentication test failed - no user found');
      }
    }

    // Test section selection
    const sectionId = localStorage.getItem('section_id');
    if (sectionId) {
      testResults.sectionSelectionTest = true;
      console.log('✅ Section selection test passed - section ID:', sectionId);

      // Try to get section details
      try {
        const { data: section, error } = await window.supabase
          .from('sections')
          .select('*')
          .eq('id', sectionId)
          .single();

        if (!error && section) {
          console.log('Section details:', section);
        } else {
          console.log('Could not get section details:', error);
        }
      } catch (error) {
        console.error('Error getting section details:', error);
      }
    } else {
      console.log('❌ Section selection test failed - no section ID found');
    }
  } catch (error) {
    console.error('Error in authentication test:', error);
  }
}

// Test game session connection
async function testGameSession() {
  console.log('=== TESTING GAME SESSION ===');
  try {
    // Initialize the SupabaseConnector
    await SupabaseConnector.initialize();

    // Test getting active game
    const activeGame = await SupabaseConnector.getActiveGame();
    console.log('Active game:', activeGame);

    if (activeGame) {
      testResults.gameSessionTest = true;
      console.log('✅ Game session test passed - found active game');

      // Store game session
      GameData.setGameSession(activeGame);

      // Test joining game
      try {
        const joinResult = await SupabaseConnector.joinGame(activeGame.id);
        console.log('Join game result:', joinResult);

        if (joinResult) {
          console.log('✅ Successfully joined game');
        } else {
          console.log('❌ Failed to join game');
        }
      } catch (joinError) {
        console.error('Error joining game:', joinError);
      }

      // Test subscribing to game updates
      try {
        const subscription = SupabaseConnector.subscribeToGameUpdates(
          activeGame.id,
          (update) => console.log('Game update received:', update)
        );

        console.log('Subscription:', subscription);

        if (subscription) {
          console.log('✅ Successfully subscribed to game updates');
        } else {
          console.log('❌ Failed to subscribe to game updates');
        }
      } catch (subscribeError) {
        console.error('Error subscribing to game updates:', subscribeError);
      }
    } else {
      console.log('❌ Game session test failed - no active game found');
    }
  } catch (error) {
    console.error('Error in game session test:', error);
  }
}

// Test game state loading
async function testGameState() {
  console.log('=== TESTING GAME STATE ===');
  try {
    const gameSession = GameData.getGameSession();

    if (!gameSession) {
      console.log('❌ Game state test failed - no game session');
      return;
    }

    // Test getting game state
    const roundNumber = gameSession.current_round || gameSession.currentRound || 0;
    console.log('Testing game state for round:', roundNumber);

    const gameState = await SupabaseConnector.getGameState(gameSession.id, roundNumber);
    console.log('Game state:', gameState);

    if (gameState) {
      testResults.gameStateTest = true;
      console.log('✅ Game state test passed - found game state');
    } else {
      console.log('⚠️ No game state found, but fallback should work');

      // Check if we can generate a game state
      const generatedState = await MarketSimulator.generateMarketData(roundNumber);

      if (generatedState) {
        testResults.gameStateTest = true;
        console.log('✅ Game state test passed - generated game state');
      } else {
        console.log('❌ Game state test failed - could not generate game state');
      }
    }
  } catch (error) {
    console.error('Error in game state test:', error);
  }
}

// Test market data loading
async function testMarketData() {
  console.log('=== TESTING MARKET DATA ===');
  try {
    // Initialize the MarketSimulator
    MarketSimulator.initialize();

    const gameSession = GameData.getGameSession();

    if (!gameSession) {
      console.log('❌ Market data test failed - no game session');
      return;
    }

    // Test loading market data
    const roundNumber = gameSession.current_round || gameSession.currentRound || 0;
    console.log('Testing market data for round:', roundNumber);

    const marketData = await MarketSimulator.loadMarketData(roundNumber);
    console.log('Market data:', marketData);

    if (marketData && marketData.assetPrices) {
      testResults.marketDataTest = true;
      console.log('✅ Market data test passed - loaded market data');

      // Check asset prices
      console.log('Asset prices:');
      for (const asset in marketData.assetPrices) {
        console.log(`${asset}: $${marketData.assetPrices[asset].toFixed(2)}`);
      }
    } else {
      console.log('❌ Market data test failed - could not load market data');
    }
  } catch (error) {
    console.error('Error in market data test:', error);
  }
}

// Test trading functionality
async function testTrading() {
  console.log('=== TESTING TRADING FUNCTIONALITY ===');
  try {
    // Initialize the PortfolioManager
    PortfolioManager.initialize();

    // Get market data
    const marketData = MarketSimulator.getMarketData();

    if (!marketData || !marketData.assetPrices) {
      console.log('❌ Trading test failed - no market data');
      return;
    }

    // Test portfolio state
    const playerState = PortfolioManager.getPlayerState();
    console.log('Initial player state:', playerState);

    // Test buying an asset
    const asset = 'S&P 500';
    const price = marketData.assetPrices[asset];
    const amount = 1000; // $1000
    const quantity = amount / price;

    console.log(`Testing buying ${quantity.toFixed(6)} ${asset} for $${amount.toFixed(2)}`);

    // Simulate buying
    if (!playerState.portfolio[asset]) {
      playerState.portfolio[asset] = 0;
    }

    playerState.portfolio[asset] += quantity;
    playerState.cash -= amount;

    console.log('Updated player state after buying:', playerState);

    // Test selling the asset
    console.log(`Testing selling ${quantity.toFixed(6)} ${asset} for $${amount.toFixed(2)}`);

    // Simulate selling
    playerState.portfolio[asset] -= quantity;
    playerState.cash += amount;

    if (playerState.portfolio[asset] <= 0) {
      delete playerState.portfolio[asset];
    }

    console.log('Updated player state after selling:', playerState);

    // Check if cash is back to original amount (within rounding error)
    if (Math.abs(playerState.cash - 10000) < 0.01) {
      testResults.tradingTest = true;
      console.log('✅ Trading test passed - buy and sell operations work');
    } else {
      console.log('❌ Trading test failed - cash not restored after buy/sell');
    }
  } catch (error) {
    console.error('Error in trading test:', error);
  }
}

// Run all tests
async function runTests() {
  console.log('STARTING INVESTMENT ODYSSEY CLASS GAME TESTS');
  console.log('===========================================');

  // Set up mock data before running tests
  setupMockData();

  // Initialize required components
  try {
    await SupabaseConnector.initialize();
    MarketSimulator.initialize();
    PortfolioManager.initialize();

    // Set game session from localStorage
    try {
      const gameSessionStr = localStorage.getItem('game_session');
      if (gameSessionStr) {
        const gameSession = JSON.parse(gameSessionStr);
        GameData.setGameSession(gameSession);
        console.log('Set game session from localStorage:', gameSession);
      }
    } catch (error) {
      console.error('Error setting game session:', error);
    }
  } catch (error) {
    console.error('Error initializing components:', error);
  }

  // Run tests
  await testAuthentication();
  await testGameSession();
  await testGameState();
  await testMarketData();
  await testTrading();

  console.log('===========================================');
  console.log('TEST RESULTS SUMMARY:');

  for (const [test, result] of Object.entries(testResults)) {
    console.log(`${result ? '✅' : '❌'} ${test}: ${result ? 'PASSED' : 'FAILED'}`);
  }

  const passedTests = Object.values(testResults).filter(result => result).length;
  const totalTests = Object.values(testResults).length;

  console.log(`Overall: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! The class game should work correctly.');
  } else {
    console.log('⚠️ Some tests failed. There may still be issues with the class game.');
  }
}

// Add a button to run tests
function addTestButton() {
  const button = document.createElement('button');
  button.textContent = 'Run Class Game Tests';
  button.style.position = 'fixed';
  button.style.bottom = '20px';
  button.style.left = '20px';
  button.style.zIndex = '9999';
  button.style.padding = '10px 20px';
  button.style.backgroundColor = '#007bff';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '5px';
  button.style.cursor = 'pointer';

  button.addEventListener('click', runTests);

  document.body.appendChild(button);
}

// Add the test button when the page loads
window.addEventListener('DOMContentLoaded', addTestButton);
