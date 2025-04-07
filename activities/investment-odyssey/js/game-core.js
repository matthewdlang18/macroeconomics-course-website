// Game Core JavaScript for Investment Odyssey

// Game state
let gameState = {
    roundNumber: 0,
    assetPrices: {
        'S&P 500': 5000,
        'Bonds': 1000,
        'Real Estate': 2000,
        'Gold': 1800,
        'Commodities': 1000,
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
    maxRounds: 20
};

// Player state
let playerState = {
    cash: 10000,
    portfolio: {},
    tradeHistory: [],
    portfolioValueHistory: [10000]
};

// Asset returns configuration
const assetReturns = {
    'S&P 500': {
        mean: 0.01,
        stdDev: 0.02,
        min: -0.05,
        max: 0.07
    },
    'Bonds': {
        mean: 0.005,
        stdDev: 0.01,
        min: -0.02,
        max: 0.03
    },
    'Real Estate': {
        mean: 0.008,
        stdDev: 0.015,
        min: -0.04,
        max: 0.05
    },
    'Gold': {
        mean: 0.006,
        stdDev: 0.02,
        min: -0.04,
        max: 0.06
    },
    'Commodities': {
        mean: 0.007,
        stdDev: 0.025,
        min: -0.06,
        max: 0.08
    },
    'Bitcoin': {
        mean: 0.02,
        stdDev: 0.05,
        min: -0.15,
        max: 0.20
    }
};

// Initialize game
function initializeGame() {
    // Reset game state
    gameState = {
        roundNumber: 0,
        assetPrices: {
            'S&P 500': 5000,
            'Bonds': 1000,
            'Real Estate': 2000,
            'Gold': 1800,
            'Commodities': 1000,
            'Bitcoin': 50000
        },
        priceHistory: {
            'S&P 500': [5000],
            'Bonds': [1000],
            'Real Estate': [2000],
            'Gold': [1800],
            'Commodities': [1000],
            'Bitcoin': [50000]
        },
        lastCashInjection: 0,
        totalCashInjected: 0,
        maxRounds: 20
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

// Generate new prices
function generateNewPrices() {
    // Store current prices in history
    for (const [asset, price] of Object.entries(gameState.assetPrices)) {
        if (!gameState.priceHistory[asset]) {
            gameState.priceHistory[asset] = [];
        }
        
        gameState.priceHistory[asset].push(price);
    }
    
    // Generate new prices
    for (const [asset, price] of Object.entries(gameState.assetPrices)) {
        const returns = assetReturns[asset];
        
        if (!returns) {
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
        gameState.assetPrices[asset] = price * (1 + randomReturn);
    }
}

// Generate cash injection
function generateCashInjection() {
    const baseAmount = 2500;
    const variability = 500;
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
    
    // Calculate return percentage
    const initialCash = 10000;
    const returnPercentage = ((totalValue - initialCash - gameState.totalCashInjected) / initialCash) * 100;
    
    // Show game over message
    alert(`Game Over!\n\nFinal Portfolio Value: $${totalValue.toFixed(2)}\nTotal Cash Injected: $${gameState.totalCashInjected.toFixed(2)}\nAdjusted Return: ${returnPercentage.toFixed(2)}%`);
    
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
