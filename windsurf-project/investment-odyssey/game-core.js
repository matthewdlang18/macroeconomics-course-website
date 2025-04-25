// Game Core JavaScript for Investment Odyssey

// Format currency function
function formatCurrency(value) {
    return parseFloat(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Default game state template (used for initialization)
const defaultGameState = {
    roundNumber: 0,
    assetPrices: {
        'S&P 500': 100,
        'Bonds': 100,
        'Real Estate': 5000,
        'Gold': 3000,
        'Commodities': 100,
        'Bitcoin': 50000
    },
    priceHistory: {
        'S&P 500': [],
        'Bonds': [],
        'Real Estate': [],
        'Gold': [],
        'Commodities': [],
        'Bitcoin': []
    },
    lastCashInjection: 0,
    totalCashInjected: 0,
    maxRounds: 20,
    CPI: 100,
    CPIHistory: [],
    lastBitcoinCrashRound: 0,
    bitcoinShockRange: [-0.5, -0.75] // Initial shock range for Bitcoin crashes
};

// Default player state template (used for initialization)
const defaultPlayerState = {
    cash: 10000,
    portfolio: {},
    tradeHistory: [],
    portfolioValueHistory: [10000]
};

// Asset returns configuration
const assetReturns = {
    'S&P 500': {
        mean: 0.1151,
        stdDev: 0.1949,
        min: -0.43,
        max: 0.50
    },
    'Bonds': {
        mean: 0.0334,
        stdDev: 0.0301,
        min: 0.0003,
        max: 0.14
    },
    'Real Estate': {
        mean: 0.0439,
        stdDev: 0.0620,
        min: -0.12,
        max: 0.24
    },
    'Gold': {
        mean: 0.0648,
        stdDev: 0.2076,
        min: -0.32,
        max: 1.25
    },
    'Commodities': {
        mean: 0.0815,
        stdDev: 0.1522,
        min: -0.25,
        max: 2.00
    },
    'Bitcoin': {
        mean: 0.50,
        stdDev: 1.00,
        min: -0.73,
        max: 2.50
    }
};

// Correlation matrix for assets
const assetCorrelationMatrix = [
    [1.0000, -0.5169, 0.3425, 0.0199, 0.1243, 0.4057],
    [-0.5169, 1.0000, 0.0176, 0.0289, -0.0235, -0.2259],
    [0.3425, 0.0176, 1.0000, -0.4967, -0.0334, 0.1559],
    [0.0199, 0.0289, -0.4967, 1.0000, 0.0995, -0.5343],
    [0.1243, -0.0235, -0.0334, 0.0995, 1.0000, 0.0436],
    [0.4057, -0.2259, 0.1559, -0.5343, 0.0436, 1.0000]
];

// Game session information
window.gameSession = null;
window.currentRound = 0;

// Initialize game
function initializeGame() {
    // Reset game state (if it exists)
    if (typeof gameState !== 'undefined') {
        // Copy properties from defaultGameState
        gameState.roundNumber = defaultGameState.roundNumber;
        gameState.assetPrices = JSON.parse(JSON.stringify(defaultGameState.assetPrices));
        gameState.priceHistory = JSON.parse(JSON.stringify(defaultGameState.priceHistory));
        gameState.lastCashInjection = defaultGameState.lastCashInjection;
        gameState.totalCashInjected = defaultGameState.totalCashInjected;
        gameState.maxRounds = defaultGameState.maxRounds;
        gameState.CPI = defaultGameState.CPI;
        gameState.CPIHistory = [];
        gameState.lastBitcoinCrashRound = defaultGameState.lastBitcoinCrashRound;
        gameState.bitcoinShockRange = [...defaultGameState.bitcoinShockRange];
    }

    // Reset player state (if it exists)
    if (typeof playerState !== 'undefined') {
        playerState.cash = defaultPlayerState.cash;
        playerState.portfolio = {};
        playerState.tradeHistory = [];
        playerState.portfolioValueHistory = [defaultPlayerState.cash];
    }

    // Reset current round
    window.currentRound = 0;

    // Update UI
    if (typeof window.updateUI === 'function') {
        window.updateUI();
    } else {
        console.error('updateUI function not found');
    }
}

// Reset all charts
function resetAllCharts() {
    if (window.portfolioChart) {
        window.portfolioChart.destroy();
        window.portfolioChart = null;
    }
    if (window.portfolioAllocationChart) {
        window.portfolioAllocationChart.destroy();
        window.portfolioAllocationChart = null;
    }
    if (window.realEstateGoldChart) {
        window.realEstateGoldChart.destroy();
        window.realEstateGoldChart = null;
    }
    if (window.bondsCommoditiesSPChart) {
        window.bondsCommoditiesSPChart.destroy();
        window.bondsCommoditiesSPChart = null;
    }
    if (window.bitcoinChart) {
        window.bitcoinChart.destroy();
        window.bitcoinChart = null;
    }
    if (window.cpiChart) {
        window.cpiChart.destroy();
        window.cpiChart = null;
    }
    if (window.comparativeReturnsChart) {
        window.comparativeReturnsChart.destroy();
        window.comparativeReturnsChart = null;
    }
}

// Start a new game
async function startGame() {
    // Reset all charts first
    resetAllCharts();

    // Reset game
    initializeGame();

    // Add initial prices to price history
    for (const [asset, price] of Object.entries(gameState.assetPrices)) {
        gameState.priceHistory[asset].push(price);
    }

    // Add initial CPI to CPI history
    gameState.CPIHistory.push(gameState.CPI);

    // Update UI to show initial state
    if (typeof window.updateUI === 'function') {
        window.updateUI();
    } else {
        console.error('updateUI function not found');
    }

    // Enable next round button
    const nextRoundBtn = document.getElementById('next-round-btn');
    if (nextRoundBtn) nextRoundBtn.disabled = false;

    // Show sticky next round button
    const stickyNextRoundBtn = document.getElementById('sticky-next-round');
    if (stickyNextRoundBtn) stickyNextRoundBtn.style.display = 'flex';

    // Show notification
    showNotification('Game started! You have $10,000 to invest. Click "Next Round" to advance the game.', 'success');
}

// Reset game
function resetGame() {
    // Reset all charts first
    resetAllCharts();

    // Initialize new game
    initializeGame();

    // Hide sticky next round button
    const stickyNextRoundBtn = document.getElementById('sticky-next-round');
    if (stickyNextRoundBtn) stickyNextRoundBtn.style.display = 'none';

    console.log('Game has been reset.');
}

// Restart game with confirmation
function restartGame() {
    if (confirm('Are you sure you want to start over? All progress will be lost.')) {
        resetGame();
        showNotification('Game has been reset.', 'info');
    }
}

// Advance to next round - simplified version
async function nextRound() {
    try {
        console.log('Starting nextRound function');

        // Check if we've already reached the maximum number of rounds
        if (window.currentRound >= gameState.maxRounds) {
            console.log('Maximum rounds reached, ending game');
            endGame();
            return;
        }

        // Increment round number
        window.currentRound++;
        gameState.roundNumber = window.currentRound;
        console.log('Round number incremented to:', window.currentRound);

        // Generate new prices
        console.log('Generating new prices...');
        for (const asset in gameState.assetPrices) {
            // Simple random price change between -10% and +15%
            const changePercent = -0.1 + Math.random() * 0.25;
            const newPrice = gameState.assetPrices[asset] * (1 + changePercent);
            gameState.assetPrices[asset] = newPrice;

            // Add to price history
            if (!gameState.priceHistory[asset]) {
                gameState.priceHistory[asset] = [];
            }
            gameState.priceHistory[asset].push(newPrice);
        }

        // Update CPI
        const cpiChange = -0.01 + Math.random() * 0.04; // Between -1% and 3%
        gameState.CPI = gameState.CPI * (1 + cpiChange);
        gameState.CPIHistory.push(gameState.CPI);

        // Add cash injection this round
        if (typeof generateCashInjection === 'function') generateCashInjection();

        // Calculate portfolio value
        const portfolioValue = calculatePortfolioValue();
        console.log('Portfolio value calculated:', portfolioValue);

        // Add to portfolio value history
        if (!playerState.portfolioValueHistory) {
            playerState.portfolioValueHistory = [];
        }
        playerState.portfolioValueHistory[window.currentRound] = portfolioValue + playerState.cash;

        // Update UI
        if (typeof window.updateUI === 'function') {
            window.updateUI();
        } else {
            console.error('updateUI function not found');
        }

        // Check if game is over
        if (window.currentRound >= gameState.maxRounds) {
            console.log('Game is over, calling endGame()');
            endGame();
            return;
        }

        // If connected to Supabase, save to database
        if (window.gameSession && window.gameSupabase) {
            console.log('Saving game state to database...');
            try {
                // Create next round state in Supabase
                await window.gameSupabase.createNextRoundState(window.gameSession.id, gameState);
                await window.gameSupabase.updatePlayerState(window.gameSession.id, playerState);
                console.log('Game state saved to database');
            } catch (error) {
                console.error('Error saving to database:', error);
                // Save to local storage as fallback
                saveGameState();
            }
        } else {
            // Save to local storage
            saveGameState();
        }

        // Show notification
        if (typeof window.showNotification === 'function') {
            window.showNotification(`Advanced to round ${window.currentRound}`, 'success');
        }

        console.log('nextRound function completed successfully');
    } catch (error) {
        console.error('Error in nextRound function:', error);
        if (typeof window.showNotification === 'function') {
            window.showNotification('Error advancing to next round', 'danger');
        }
    }
}

// Update CPI (Consumer Price Index)
function updateCPI() {
    // Average CPI increase of 2.5% with standard deviation of 1.5%
    const avgCPIIncrease = 0.025;
    const stdDevCPIIncrease = 0.015;

    // Generate random CPI increase using normal distribution
    let cpiIncrease;
    // Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    cpiIncrease = avgCPIIncrease + stdDevCPIIncrease * z;

    // Ensure CPI increase is reasonable (between -1% and 6%)
    cpiIncrease = Math.max(-0.01, Math.min(0.06, cpiIncrease));

    // Update CPI
    const newCPI = gameState.CPI * (1 + cpiIncrease);
    gameState.CPI = newCPI;
    gameState.CPIHistory.push(newCPI);
}

// Generate new prices
function generateNewPrices() {
    try {
        console.log('Starting generateNewPrices function');

        // Generate correlated random returns
        const assetNames = Object.keys(assetReturns);
        const means = assetNames.map(asset => assetReturns[asset].mean);
        const stdDevs = assetNames.map(asset => assetReturns[asset].stdDev);

        // Generate uncorrelated standard normal random variables
        const uncorrelatedZ = [];
        for (let i = 0; i < assetNames.length; i++) {
            // Box-Muller transform for normal distribution
            const u1 = Math.random();
            const u2 = Math.random();
            const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
            uncorrelatedZ.push(z);
        }

        // Apply correlation to get correlated random variables
        const correlatedZ = [];
        for (let i = 0; i < assetNames.length; i++) {
            let sum = 0;
            for (let j = 0; j < assetNames.length; j++) {
                sum += assetCorrelationMatrix[i][j] * uncorrelatedZ[j];
            }
            correlatedZ.push(sum);
        }

        // Calculate returns for each asset
        const returns = {};
        for (let i = 0; i < assetNames.length; i++) {
            const asset = assetNames[i];
            let returnValue = means[i] + stdDevs[i] * correlatedZ[i];

            // Special handling for Bitcoin
            if (asset === 'Bitcoin') {
                const bitcoinPrice = gameState.assetPrices['Bitcoin'];

                // Bitcoin has special growth patterns based on its price
                if (bitcoinPrice < 10000) {
                    // Low price: rapid growth
                    returnValue = 2 + Math.random() * 2; // Return between 200% and 400%
                } else if (bitcoinPrice >= 1000000) {
                    // Very high price: crash
                    returnValue = -0.3 - Math.random() * 0.2; // Return between -30% and -50%
                } else {
                    // Normal price range: correlated with other assets but with high volatility
                    // Adjust Bitcoin's return based on its current price
                    const priceThreshold = 100000;
                    if (bitcoinPrice > priceThreshold) {
                        // Calculate how many increments above threshold
                        const incrementsAboveThreshold = Math.max(0, (bitcoinPrice - priceThreshold) / 50000);
                        // Increase crash probability as price rises
                        const crashProbability = Math.min(0.8, 0.1 + (incrementsAboveThreshold * 0.05));

                        // Determine if a crash occurs
                        if (Math.random() < crashProbability) {
                            // Bitcoin crash
                            const crashSeverity = gameState.bitcoinShockRange[0] + (Math.random() * (gameState.bitcoinShockRange[1] - gameState.bitcoinShockRange[0]));
                            returnValue = crashSeverity; // Negative return (crash)
                            gameState.lastBitcoinCrashRound = window.currentRound;
                            console.log(`Bitcoin crash! Return: ${returnValue}`);
                        }
                    }
                }
            }

            // Ensure returns are within min/max bounds
            returnValue = Math.max(assetReturns[asset].min, Math.min(assetReturns[asset].max, returnValue));
            returns[asset] = returnValue;
        }

        // Update prices based on returns
        for (const [asset, returnValue] of Object.entries(returns)) {
            const oldPrice = gameState.assetPrices[asset];
            const newPrice = oldPrice * (1 + returnValue);
            gameState.assetPrices[asset] = newPrice;
            gameState.priceHistory[asset].push(newPrice);
        }

        console.log('New prices generated successfully');
    } catch (error) {
        console.error('Error in generateNewPrices function:', error);
        throw error;
    }
}

// Generate cash injection with growing base and variability
function generateCashInjection() {
    const baseAmount = 5000 + (gameState.roundNumber * 500); // growing base
    const variability = 1000;
    const injectionAmount = baseAmount + (Math.random() * 2 - 1) * variability;
    // Update player cash and totals
    playerState.cash += injectionAmount;
    gameState.lastCashInjection = injectionAmount;
    gameState.totalCashInjected = (gameState.totalCashInjected || 0) + injectionAmount;
    // Notify user
    showNotification(`Cash injection: $${injectionAmount.toFixed(2)}`, 'success');
}

// Calculate portfolio value
function calculatePortfolioValue() {
    let totalValue = 0;

    if (playerState && playerState.portfolio && gameState && gameState.assetPrices) {
        for (const [asset, quantity] of Object.entries(playerState.portfolio)) {
            const price = gameState.assetPrices[asset] || 0;
            totalValue += price * quantity;
        }
    }

    return totalValue;
}

// End game
function endGame() {
    try {
        console.log('Ending game...');

        // Calculate final portfolio value
        const portfolioValue = calculatePortfolioValue();
        const totalValue = playerState.cash + portfolioValue;

        // Update player state with the final total value
        playerState.total_value = totalValue;

        // Make sure portfolio value history is updated with the final value
        if (!playerState.portfolioValueHistory) {
            playerState.portfolioValueHistory = [];
        }
        playerState.portfolioValueHistory[window.currentRound] = totalValue;

        // Also update the snake_case version for database consistency
        if (!playerState.portfolio_value_history) {
            playerState.portfolio_value_history = [];
        }
        playerState.portfolio_value_history[window.currentRound] = totalValue;

        // Calculate performance metrics
        const initialValue = 10000; // Starting cash
        const totalReturn = totalValue - initialValue;
        const percentReturn = (totalReturn / initialValue) * 100;

        // Calculate inflation-adjusted return
        const realReturn = (totalValue / gameState.CPI * 100) - initialValue;
        const realPercentReturn = (realReturn / initialValue) * 100;

        // Debug: log totalValue and realReturn
        console.log('Debug endGame values:', { totalValue, initialValue, realReturn, realPercentReturn, portfolioValue, cash: playerState.cash });

        // Save to leaderboard if connected to Supabase
        if (window.gameSession && window.gameSupabase) {
            console.log('Saving to leaderboard...');
            try {
                // Update player state with final values before saving to leaderboard
                window.gameSupabase.updatePlayerState(window.gameSession.id, playerState);

                // Check if saveToLeaderboard function exists
                if (typeof window.gameSupabase.saveToLeaderboard === 'function') {
                    window.gameSupabase.saveToLeaderboard(window.gameSession.id, playerState, gameState);
                } else if (typeof saveToLeaderboard === 'function') {
                    saveToLeaderboard(window.gameSession.id, playerState, gameState);
                } else {
                    console.warn('saveToLeaderboard function not found');
                }
            } catch (error) {
                console.error('Error saving to leaderboard:', error);
            }
        }

        // Show results screen
        const gameScreen = document.getElementById('game-screen');
        if (gameScreen) {
            gameScreen.innerHTML = `
                <div class="results-screen text-center">
                    <h2 class="display-4 mb-4">Game Complete!</h2>

                    <div class="card mb-4">
                        <div class="card-header bg-primary text-white">
                            <h3 class="mb-0">Your Investment Results</h3>
                        </div>
                        <div class="card-body">
                            <div class="results-summary">
                                <div class="result-item">
                                    <span class="result-label">Initial Investment:</span>
                                    <span class="result-value">$${initialValue.toFixed(2)}</span>
                                </div>
                                <div class="result-item">
                                    <span class="result-label">Final Portfolio Value:</span>
                                    <span class="result-value">$${totalValue.toFixed(2)}</span>
                                </div>
                                <div class="result-item">
                                    <span class="result-label">Total Return:</span>
                                    <span class="result-value ${totalReturn >= 0 ? 'positive' : 'negative'}">
                                        $${totalReturn.toFixed(2)} (${percentReturn.toFixed(2)}%)
                                    </span>
                                </div>
                                <div class="result-item">
                                    <span class="result-label">Inflation-Adjusted Return:</span>
                                    <span class="result-value ${realReturn >= 0 ? 'positive' : 'negative'}">
                                        $${realReturn.toFixed(2)} (${realPercentReturn.toFixed(2)}%)
                                    </span>
                                </div>
                                <div class="result-item">
                                    <span class="result-label">Final CPI:</span>
                                    <span class="result-value">${gameState.CPI.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="results-actions">
                        <button id="play-again-btn" class="btn btn-primary btn-lg">Play Again</button>
                        <button id="back-to-welcome-btn" class="btn btn-secondary btn-lg">Back to Welcome</button>
                    </div>
                </div>
            `;

            // Add event listeners
            document.getElementById('play-again-btn').addEventListener('click', () => {
                // For Supabase-based game use startSinglePlayerGame, else fallback
                if (typeof startSinglePlayerGame === 'function') {
                    startSinglePlayerGame();
                } else {
                    resetGame();
                    startGame();
                }
            });

            document.getElementById('back-to-welcome-btn').addEventListener('click', () => {
                const welcomeScreen = document.getElementById('welcome-screen');
                if (welcomeScreen) {
                    gameScreen.style.display = 'none';
                    welcomeScreen.style.display = 'block';
                }
            });
        }

        // Hide sticky next round button
        const stickyNextRoundBtn = document.getElementById('sticky-next-round');
        if (stickyNextRoundBtn) {
            stickyNextRoundBtn.style.display = 'none';
        }

        // Show notification
        showNotification('Game complete! Check your results.', 'success');
    } catch (error) {
        console.error('Error in endGame function:', error);
        showNotification('Error ending game', 'danger');
    }
}

// Save game state to local storage
function saveGameState() {
    try {
        const gameData = {
            gameState: gameState,
            playerState: playerState,
            currentRound: window.currentRound
        };

        localStorage.setItem('investmentOdysseyGameData', JSON.stringify(gameData));
        console.log('Game state saved to local storage');
    } catch (error) {
        console.error('Error saving game state to local storage:', error);
    }
}

// Load game state from local storage
function loadGameState() {
    try {
        const gameData = localStorage.getItem('investmentOdysseyGameData');

        if (gameData) {
            const parsedData = JSON.parse(gameData);
            gameState = parsedData.gameState;
            playerState = parsedData.playerState;
            window.currentRound = parsedData.currentRound;

            console.log('Game state loaded from local storage');
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error loading game state from local storage:', error);
        return false;
    }
}

// Show notification
window.showNotification = function(message, type = 'info', duration = 5000) {
    // Create notification container if it doesn't exist
    let notificationContainer = document.getElementById('notification-container');

    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.top = '20px';
        notificationContainer.style.right = '20px';
        notificationContainer.style.zIndex = '9999';
        document.body.appendChild(notificationContainer);
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show`;
    notification.role = 'alert';
    notification.innerHTML = `
        ${message}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    `;

    // Add to container
    notificationContainer.appendChild(notification);

    // Auto-dismiss after duration
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, duration);
}
