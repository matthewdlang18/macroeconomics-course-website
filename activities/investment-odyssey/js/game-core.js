// Game Core JavaScript for Investment Odyssey

// Game state
let gameState = {
    roundNumber: 0,
    assetPrices: {
        'S&P 500': 100,
        'Bonds': 100,
        'Real Estate': 10000,
        'Gold': 2000,
        'Commodities': 100,
        'Bitcoin': 50000
    },
    priceHistory: {
        'S&P 500': [100],
        'Bonds': [100],
        'Real Estate': [10000],
        'Gold': [2000],
        'Commodities': [100],
        'Bitcoin': [50000]
    },
    lastCashInjection: 0,
    totalCashInjected: 0,
    maxRounds: 20,
    CPI: 100,
    CPIHistory: [100]
};

// Player state
let playerState = {
    cash: 10000,
    portfolio: {},
    tradeHistory: [],
    portfolioValueHistory: [10000]
};

// Asset returns configuration - from macro3.py
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
        max: 4.50
    }
};

// Correlation matrix for assets - from macro3.py
const correlationMatrix = [
    [1.0000, -0.5169, 0.3425, 0.0199, 0.1243, 0.4057],
    [-0.5169, 1.0000, 0.0176, 0.0289, -0.0235, -0.2259],
    [0.3425, 0.0176, 1.0000, -0.4967, -0.0334, 0.1559],
    [0.0199, 0.0289, -0.4967, 1.0000, 0.0995, -0.5343],
    [0.1243, -0.0235, -0.0334, 0.0995, 1.0000, 0.0436],
    [0.4057, -0.2259, 0.1559, -0.5343, 0.0436, 1.0000]
];

// Initialize game
function initializeGame() {
    // Reset game state
    gameState = {
        roundNumber: 0,
        assetPrices: {
            'S&P 500': 100,
            'Bonds': 100,
            'Real Estate': 10000,
            'Gold': 2000,
            'Commodities': 100,
            'Bitcoin': 50000
        },
        priceHistory: {
            'S&P 500': [100],
            'Bonds': [100],
            'Real Estate': [10000],
            'Gold': [2000],
            'Commodities': [100],
            'Bitcoin': [50000]
        },
        lastCashInjection: 0,
        totalCashInjected: 0,
        maxRounds: 20,
        CPI: 100,
        CPIHistory: [100]
    };

    // Reset player state
    playerState = {
        cash: 10000,
        portfolio: {},
        tradeHistory: [],
        portfolioValueHistory: [10000]
    };

    // Update UI
    updateUI();

    // Save game state to local storage
    saveGameState();
}

// Start a new game
function startGame() {
    // Reset game
    initializeGame();

    // Enable next round button
    document.getElementById('next-round').disabled = false;

    // Disable start game button
    document.getElementById('start-game').disabled = true;

    alert('Game started! You have $10,000 to invest. Click "Next Round" to advance the game.');
}

// Reset game
function resetGame() {
    if (confirm('Are you sure you want to reset the game? All progress will be lost.')) {
        initializeGame();

        // Enable start game button
        document.getElementById('start-game').disabled = false;

        // Disable next round button
        document.getElementById('next-round').disabled = true;

        alert('Game has been reset.');
    }
}

// Advance to next round
function nextRound() {
    // Increment round number
    gameState.roundNumber++;

    // Generate new prices
    generateNewPrices();

    // Update CPI
    updateCPI();

    // Generate cash injection
    generateCashInjection();

    // Calculate portfolio value
    const portfolioValue = calculatePortfolioValue();

    // Add to portfolio value history
    playerState.portfolioValueHistory[gameState.roundNumber] = portfolioValue + playerState.cash;

    // Update round displays
    document.getElementById('current-round-display').textContent = gameState.roundNumber;
    document.getElementById('current-round-display-control').textContent = gameState.roundNumber;
    document.getElementById('market-round-display').textContent = gameState.roundNumber;
    document.getElementById('portfolio-round-display').textContent = gameState.roundNumber;

    // Update progress bar
    const progress = (gameState.roundNumber / gameState.maxRounds) * 100;
    const progressBar = document.getElementById('round-progress');
    progressBar.style.width = progress + '%';
    progressBar.setAttribute('aria-valuenow', progress);
    progressBar.textContent = progress.toFixed(0) + '%';

    // Update UI
    updateUI();

    // Check if game is over
    if (gameState.roundNumber >= gameState.maxRounds) {
        endGame();
    }

    // Save game state to local storage
    saveGameState();
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

    // Update CPI display if it exists
    const cpiDisplay = document.getElementById('cpi-display');
    if (cpiDisplay) {
        cpiDisplay.textContent = newCPI.toFixed(2);
    }
}

// Generate new prices
function generateNewPrices() {
    // Store current prices in history
    for (const [asset, price] of Object.entries(gameState.assetPrices)) {
        if (!gameState.priceHistory[asset]) {
            gameState.priceHistory[asset] = [];
        }

        gameState.priceHistory[asset].push(price);
    }

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

    // Apply Cholesky decomposition to get correlated random variables
    // This is a simplified approach - we'll use the correlation matrix directly
    const correlatedReturns = {};

    // Special handling for Bitcoin
    const bitcoinPrice = gameState.assetPrices['Bitcoin'];
    let bitcoinReturn;

    // Bitcoin has special growth patterns based on its price
    if (bitcoinPrice < 10000) {
        // Low price: rapid growth
        bitcoinReturn = 2 + Math.random() * 2; // Return between 200% and 400%
    } else if (bitcoinPrice >= 1000000) {
        // Very high price: crash
        bitcoinReturn = -0.3 - Math.random() * 0.2; // Return between -30% and -50%
    } else {
        // Normal price range: correlated with other assets but with high volatility
        let weightedReturn = 0;
        for (let j = 0; j < assetNames.length; j++) {
            weightedReturn += correlationMatrix[5][j] * uncorrelatedZ[j];
        }
        bitcoinReturn = assetReturns['Bitcoin'].mean + assetReturns['Bitcoin'].stdDev * weightedReturn;

        // Adjust Bitcoin's return based on its current price
        const priceThreshold = 100000;
        if (bitcoinPrice > priceThreshold) {
            const incrementsAboveThreshold = Math.max(0, (bitcoinPrice - priceThreshold) / 50000);
            bitcoinReturn = Math.max(0.05, bitcoinReturn - incrementsAboveThreshold * 0.1);
        }
    }

    // Ensure Bitcoin return is within bounds
    bitcoinReturn = Math.max(
        assetReturns['Bitcoin'].min,
        Math.min(assetReturns['Bitcoin'].max, bitcoinReturn)
    );

    correlatedReturns['Bitcoin'] = bitcoinReturn;

    // Generate correlated returns for other assets
    for (let i = 0; i < assetNames.length - 1; i++) { // Skip Bitcoin which we handled separately
        const asset = assetNames[i];
        if (asset === 'Bitcoin') continue;

        let weightedReturn = 0;
        for (let j = 0; j < assetNames.length; j++) {
            weightedReturn += correlationMatrix[i][j] * uncorrelatedZ[j];
        }

        let assetReturn = means[i] + stdDevs[i] * weightedReturn;

        // Ensure return is within bounds
        assetReturn = Math.max(
            assetReturns[asset].min,
            Math.min(assetReturns[asset].max, assetReturn)
        );

        correlatedReturns[asset] = assetReturn;
    }

    // Apply returns to prices
    for (const [asset, price] of Object.entries(gameState.assetPrices)) {
        const returnRate = correlatedReturns[asset] || 0;
        gameState.assetPrices[asset] = price * (1 + returnRate);
    }
}

// Generate cash injection
function generateCashInjection() {
    // Base amount increases each round to simulate growing economy
    const baseAmount = 2000 + (gameState.roundNumber * 200); // Starts at 2000, increases by 200 each round
    const variability = 1000; // Higher variability for more dynamic gameplay

    // Generate random cash injection with increasing trend
    const cashInjection = baseAmount + (Math.random() * 2 - 1) * variability;

    // Update player cash
    playerState.cash += cashInjection;

    // Update game state
    gameState.lastCashInjection = cashInjection;
    gameState.totalCashInjected += cashInjection;

    // Show cash injection alert
    const cashInjectionAlert = document.getElementById('cash-injection-alert');
    const cashInjectionAmount = document.getElementById('cash-injection-amount');

    cashInjectionAmount.textContent = cashInjection.toFixed(2);
    cashInjectionAlert.style.display = 'block';

    // Hide alert after 5 seconds
    setTimeout(() => {
        cashInjectionAlert.style.display = 'none';
    }, 5000);
}

// Calculate portfolio value
function calculatePortfolioValue() {
    let portfolioValue = 0;

    for (const [asset, quantity] of Object.entries(playerState.portfolio)) {
        const price = gameState.assetPrices[asset] || 0;
        portfolioValue += price * quantity;
    }

    return portfolioValue;
}

// End game
function endGame() {
    // Calculate final portfolio value
    const portfolioValue = calculatePortfolioValue();
    const totalValue = portfolioValue + playerState.cash;

    // Calculate return percentages
    const initialCash = 10000;
    const nominalReturn = ((totalValue - initialCash) / initialCash) * 100;
    const adjustedReturn = ((totalValue - initialCash - gameState.totalCashInjected) / initialCash) * 100;

    // Calculate asset performance statistics
    const assetStats = {};
    for (const asset of Object.keys(gameState.priceHistory)) {
        const priceHistory = gameState.priceHistory[asset];
        if (priceHistory.length > 1) {
            const initialPrice = priceHistory[0];
            const finalPrice = priceHistory[priceHistory.length - 1];
            const totalReturn = ((finalPrice - initialPrice) / initialPrice) * 100;

            // Calculate average return per round
            const returns = [];
            for (let i = 1; i < priceHistory.length; i++) {
                const returnRate = (priceHistory[i] - priceHistory[i-1]) / priceHistory[i-1];
                returns.push(returnRate * 100); // Convert to percentage
            }

            const avgReturn = returns.reduce((sum, val) => sum + val, 0) / returns.length;

            // Calculate standard deviation
            const variance = returns.reduce((sum, val) => sum + Math.pow(val - avgReturn, 2), 0) / returns.length;
            const stdDev = Math.sqrt(variance);

            // Find min and max returns
            const minReturn = Math.min(...returns);
            const maxReturn = Math.max(...returns);

            assetStats[asset] = {
                totalReturn,
                avgReturn,
                stdDev,
                minReturn,
                maxReturn
            };
        }
    }

    // Create a detailed end game message
    let message = `Game Over!\n\n`;
    message += `Final Portfolio Value: $${totalValue.toFixed(2)}\n`;
    message += `Initial Investment: $${initialCash.toFixed(2)}\n`;
    message += `Total Cash Injected: $${gameState.totalCashInjected.toFixed(2)}\n\n`;
    message += `Nominal Return: ${nominalReturn.toFixed(2)}%\n`;
    message += `Adjusted Return: ${adjustedReturn.toFixed(2)}%\n\n`;
    message += `Asset Performance:\n`;

    for (const [asset, stats] of Object.entries(assetStats)) {
        message += `\n${asset}:\n`;
        message += `  Total Return: ${stats.totalReturn.toFixed(2)}%\n`;
        message += `  Avg Return Per Round: ${stats.avgReturn.toFixed(2)}%\n`;
        message += `  Volatility (StdDev): ${stats.stdDev.toFixed(2)}%\n`;
        message += `  Min/Max Returns: ${stats.minReturn.toFixed(2)}% to ${stats.maxReturn.toFixed(2)}%\n`;
    }

    // Show game over message
    alert(message);

    // Disable next round button
    document.getElementById('next-round').disabled = true;

    // Enable start game button
    document.getElementById('start-game').disabled = false;
}

// Save game state to local storage
function saveGameState() {
    try {
        const gameData = {
            gameState: gameState,
            playerState: playerState
        };

        localStorage.setItem('investmentOdysseyGameData', JSON.stringify(gameData));
        return true;
    } catch (error) {
        console.error('Error saving game state:', error);
        return false;
    }
}

// Load game state from local storage
function loadGameState() {
    try {
        const gameData = localStorage.getItem('investmentOdysseyGameData');

        if (gameData) {
            const parsedData = JSON.parse(gameData);

            // Update game state
            gameState = parsedData.gameState;
            playerState = parsedData.playerState;

            // Update round displays
            document.getElementById('current-round-display').textContent = gameState.roundNumber;
            document.getElementById('current-round-display-control').textContent = gameState.roundNumber;
            document.getElementById('market-round-display').textContent = gameState.roundNumber;
            document.getElementById('portfolio-round-display').textContent = gameState.roundNumber;

            // Update progress bar
            const progress = (gameState.roundNumber / gameState.maxRounds) * 100;
            const progressBar = document.getElementById('round-progress');
            progressBar.style.width = progress + '%';
            progressBar.setAttribute('aria-valuenow', progress);
            progressBar.textContent = progress.toFixed(0) + '%';

            // Update UI
            updateUI();

            // Check if game is over
            if (gameState.roundNumber >= gameState.maxRounds) {
                // Disable next round button
                document.getElementById('next-round').disabled = true;

                // Enable start game button
                document.getElementById('start-game').disabled = false;
            } else if (gameState.roundNumber > 0) {
                // Enable next round button
                document.getElementById('next-round').disabled = false;

                // Disable start game button
                document.getElementById('start-game').disabled = true;
            }

            return true;
        }
    } catch (error) {
        console.error('Error loading game state:', error);
    }

    return false;
}

// Document ready
document.addEventListener('DOMContentLoaded', function() {
    // Try to load saved game state
    if (!loadGameState()) {
        // Initialize new game if no saved state
        initializeGame();
    }

    // Set up event listeners
    document.getElementById('start-game').addEventListener('click', startGame);
    document.getElementById('reset-game').addEventListener('click', resetGame);
    document.getElementById('next-round').addEventListener('click', nextRound);
    document.getElementById('trade-form').addEventListener('submit', function(event) {
        event.preventDefault();
        executeTrade();
    });
    document.getElementById('asset-select').addEventListener('change', updateAssetPrice);
    document.getElementById('quantity-input').addEventListener('input', updateTotalCost);
    document.getElementById('action-select').addEventListener('change', updateTotalCost);
    document.getElementById('buy-all-btn').addEventListener('click', buyAllAssets);
    document.getElementById('sell-all-btn').addEventListener('click', sellAllAssets);
});
