// Single Player Game JavaScript for Investment Odyssey

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

// Charts
let portfolioChart = null;
let portfolioAllocationChart = null;
let miniCharts = {};

// Document ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize game
    initializeGame();
    
    // Set up event listeners
    setupEventListeners();
    
    // Update UI
    updateUI();
});

// Initialize game
function initializeGame() {
    // Reset game state
    gameState.roundNumber = 0;
    gameState.assetPrices = {
        'S&P 500': 5000,
        'Bonds': 1000,
        'Real Estate': 2000,
        'Gold': 1800,
        'Commodities': 1000,
        'Bitcoin': 50000
    };
    gameState.priceHistory = {
        'S&P 500': [],
        'Bonds': [],
        'Real Estate': [],
        'Gold': [],
        'Commodities': [],
        'Bitcoin': []
    };
    gameState.lastCashInjection = 0;
    gameState.totalCashInjected = 0;
    
    // Reset player state
    playerState.cash = 10000;
    playerState.portfolio = {};
    playerState.tradeHistory = [];
    playerState.portfolioValueHistory = [10000];
    
    // Update header
    document.getElementById('header-round').textContent = gameState.roundNumber;
    document.getElementById('header-cash').textContent = playerState.cash.toFixed(2);
    
    // Update game status
    document.getElementById('current-round').textContent = gameState.roundNumber;
    document.getElementById('total-cash-injected').textContent = gameState.totalCashInjected.toFixed(2);
    
    // Update progress bar
    const progress = (gameState.roundNumber / gameState.maxRounds) * 100;
    const progressBar = document.getElementById('round-progress');
    progressBar.style.width = progress + '%';
    progressBar.setAttribute('aria-valuenow', progress);
    progressBar.textContent = progress.toFixed(0) + '%';
    
    // Hide leaderboard entry
    document.getElementById('leaderboard-entry').style.display = 'none';
    
    // Get player name
    const userName = document.getElementById('user-name');
    if (EconGames.Auth.isLoggedIn()) {
        userName.textContent = EconGames.Auth.getSession().name;
    } else if (localStorage.getItem('guestName')) {
        userName.textContent = localStorage.getItem('guestName');
    } else {
        userName.textContent = 'Player';
    }
    
    // Save initial state to localStorage
    saveGameState();
}

// Set up event listeners
function setupEventListeners() {
    // Next round button
    document.getElementById('next-round-btn').addEventListener('click', handleNextRound);
    
    // Reset game button
    document.getElementById('reset-game-btn').addEventListener('click', handleResetGame);
    
    // Trade form
    document.getElementById('trade-form').addEventListener('submit', handleTrade);
    
    // Asset select change
    document.getElementById('asset-select').addEventListener('change', updateAssetPrice);
    
    // Quantity input change
    document.getElementById('quantity-input').addEventListener('input', updateTotalCost);
    
    // Action select change
    document.getElementById('action-select').addEventListener('change', updateTotalCost);
    
    // Max quantity button
    document.getElementById('max-quantity-btn').addEventListener('click', setMaxQuantity);
    
    // Distribute cash button
    document.getElementById('distribute-cash').addEventListener('click', distributeCashEvenly);
    
    // Sell all button
    document.getElementById('sell-all').addEventListener('click', sellAllAssets);
    
    // Leaderboard form
    document.getElementById('leaderboard-form').addEventListener('submit', handleLeaderboardSubmit);
    
    // Play again button
    document.getElementById('play-again-btn').addEventListener('click', handleResetGame);
}

// Handle next round
function handleNextRound() {
    // Check if game is over
    if (gameState.roundNumber >= gameState.maxRounds) {
        alert('Game is already over. Please start a new game.');
        return;
    }
    
    // Increment round number
    gameState.roundNumber++;
    
    // Update price history
    for (const [asset, price] of Object.entries(gameState.assetPrices)) {
        if (!gameState.priceHistory[asset]) {
            gameState.priceHistory[asset] = [];
        }
        gameState.priceHistory[asset].push(price);
    }
    
    // Generate new asset prices
    generateNewPrices();
    
    // Generate cash injection
    generateCashInjection();
    
    // Update header
    document.getElementById('header-round').textContent = gameState.roundNumber;
    document.getElementById('header-cash').textContent = playerState.cash.toFixed(2);
    
    // Update game status
    document.getElementById('current-round').textContent = gameState.roundNumber;
    document.getElementById('total-cash-injected').textContent = gameState.totalCashInjected.toFixed(2);
    
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
    
    // Save game state
    saveGameState();
}

// Generate new asset prices
function generateNewPrices() {
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
    
    if (cashInjectionAlert && cashInjectionAmount) {
        cashInjectionAmount.textContent = cashInjection.toFixed(2);
        cashInjectionAlert.style.display = 'block';
        
        // Hide the alert after 5 seconds
        setTimeout(() => {
            cashInjectionAlert.style.display = 'none';
        }, 5000);
    }
}

// Handle reset game
function handleResetGame() {
    if (confirm('Are you sure you want to reset the game? All progress will be lost.')) {
        initializeGame();
        updateUI();
    }
}

// End game
function endGame() {
    // Calculate final portfolio value
    let portfolioValue = 0;
    for (const [asset, quantity] of Object.entries(playerState.portfolio)) {
        if (gameState.assetPrices[asset]) {
            portfolioValue += gameState.assetPrices[asset] * quantity;
        }
    }
    
    const totalValue = portfolioValue + playerState.cash;
    
    // Calculate return percentage
    const initialCash = 10000;
    const returnPercentage = ((totalValue - initialCash - gameState.totalCashInjected) / initialCash) * 100;
    
    // Update leaderboard entry form
    document.getElementById('final-value').textContent = totalValue.toFixed(2);
    document.getElementById('final-return').textContent = returnPercentage.toFixed(2);
    
    // Show leaderboard entry form
    document.getElementById('leaderboard-entry').style.display = 'block';
    
    // Pre-fill name if logged in
    if (EconGames.Auth.isLoggedIn()) {
        document.getElementById('leaderboard-name').value = EconGames.Auth.getSession().name;
    } else if (localStorage.getItem('guestName')) {
        document.getElementById('leaderboard-name').value = localStorage.getItem('guestName');
    }
}

// Handle leaderboard submit
async function handleLeaderboardSubmit(event) {
    event.preventDefault();
    
    const name = document.getElementById('leaderboard-name').value.trim();
    
    if (!name) {
        alert('Please enter your name.');
        return;
    }
    
    // Calculate final portfolio value
    let portfolioValue = 0;
    for (const [asset, quantity] of Object.entries(playerState.portfolio)) {
        if (gameState.assetPrices[asset]) {
            portfolioValue += gameState.assetPrices[asset] * quantity;
        }
    }
    
    const totalValue = portfolioValue + playerState.cash;
    
    // Calculate return percentage
    const initialCash = 10000;
    const returnPercentage = ((totalValue - initialCash - gameState.totalCashInjected) / initialCash) * 100;
    
    try {
        // Add to leaderboard
        const result = await EconGames.Game.addToSinglePlayerLeaderboard('investment-odyssey', name, totalValue, returnPercentage);
        
        if (result.success) {
            alert('Your score has been submitted to the leaderboard!');
            window.location.href = 'leaderboard.html';
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error submitting to leaderboard:', error);
        alert('Error submitting to leaderboard: ' + error.message);
    }
}

// Save game state to localStorage
function saveGameState() {
    const gameData = {
        gameState: gameState,
        playerState: playerState
    };
    
    localStorage.setItem('investmentOdysseyGame', JSON.stringify(gameData));
}

// Load game state from localStorage
function loadGameState() {
    const gameData = localStorage.getItem('investmentOdysseyGame');
    
    if (gameData) {
        try {
            const parsedData = JSON.parse(gameData);
            
            // Update game state
            gameState = parsedData.gameState;
            playerState = parsedData.playerState;
            
            // Update header
            document.getElementById('header-round').textContent = gameState.roundNumber;
            document.getElementById('header-cash').textContent = playerState.cash.toFixed(2);
            
            // Update game status
            document.getElementById('current-round').textContent = gameState.roundNumber;
            document.getElementById('total-cash-injected').textContent = gameState.totalCashInjected.toFixed(2);
            
            // Update progress bar
            const progress = (gameState.roundNumber / gameState.maxRounds) * 100;
            const progressBar = document.getElementById('round-progress');
            progressBar.style.width = progress + '%';
            progressBar.setAttribute('aria-valuenow', progress);
            progressBar.textContent = progress.toFixed(0) + '%';
            
            // Check if game is over
            if (gameState.roundNumber >= gameState.maxRounds) {
                endGame();
            }
            
            return true;
        } catch (error) {
            console.error('Error loading game state:', error);
            return false;
        }
    }
    
    return false;
}
