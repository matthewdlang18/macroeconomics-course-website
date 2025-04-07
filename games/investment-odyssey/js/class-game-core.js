// Class Game JavaScript for Investment Odyssey

// Game state
let gameState = {
    roundNumber: 0,
    assetPrices: {},
    priceHistory: {},
    lastCashInjection: 0
};

// Player state
let playerState = {
    cash: 10000,
    portfolio: {},
    tradeHistory: [],
    portfolioValueHistory: []
};

// Session info
let sessionInfo = {
    id: null,
    name: null,
    joinCode: null
};

// Charts
let portfolioChart = null;
let portfolioAllocationChart = null;
let miniCharts = {};

// Document ready
document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    await checkAuthentication();
    
    // Set up event listeners
    setupEventListeners();
    
    // Start polling for updates
    startPolling();
});

// Check authentication
async function checkAuthentication() {
    const authCheck = document.getElementById('auth-check');
    const gameContent = document.getElementById('game-content');
    
    try {
        // Check if user is logged in
        if (!EconGames.Auth.isLoggedIn()) {
            // Not logged in, show error and redirect
            authCheck.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle mr-2"></i> You must be logged in to play the game.
                        <div class="mt-3">
                            <a href="../index.html" class="btn btn-primary">Go to Login Page</a>
                        </div>
                    </div>
                </div>
            `;
            return;
        }
        
        // Get user session
        const session = EconGames.Auth.getSession();
        
        // Update user name in header
        document.getElementById('user-name').textContent = session.name || 'Player';
        
        // Check if user has joined a game session
        if (!session.gameSession) {
            // No session joined, show error and redirect
            authCheck.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-circle mr-2"></i> You haven't joined a game session yet.
                        <div class="mt-3">
                            <a href="../selection.html" class="btn btn-primary">Join a Session</a>
                        </div>
                    </div>
                </div>
            `;
            return;
        }
        
        // Get session info
        sessionInfo.id = session.gameSession.id;
        sessionInfo.name = session.gameSession.name;
        
        // Get session data
        const sessionResult = await EconGames.Game.getGameSession(sessionInfo.id);
        
        if (!sessionResult.success) {
            throw new Error(sessionResult.error);
        }
        
        const sessionData = sessionResult.data;
        
        // Check if session is active
        if (!sessionData.active) {
            authCheck.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-circle mr-2"></i> This game session has ended.
                        <div class="mt-3">
                            <a href="../selection.html" class="btn btn-primary">Join Another Session</a>
                        </div>
                    </div>
                </div>
            `;
            return;
        }
        
        // Get game data
        const gameData = sessionData.gameData || {};
        
        // Update game state
        gameState.roundNumber = gameData.roundNumber || 0;
        gameState.assetPrices = gameData.assetPrices || {};
        gameState.priceHistory = gameData.priceHistory || {};
        gameState.lastCashInjection = gameData.lastCashInjection || 0;
        
        // Get participant data
        const participantResult = await EconGames.Game.getParticipant(sessionInfo.id, session.userId);
        
        if (!participantResult.success) {
            throw new Error(participantResult.error);
        }
        
        const participantData = participantResult.data;
        
        // Update player state
        playerState.cash = participantData.cash || 10000;
        playerState.portfolio = participantData.portfolio || {};
        playerState.tradeHistory = participantData.tradeHistory || [];
        
        // Update header
        document.getElementById('header-round').textContent = gameState.roundNumber;
        document.getElementById('header-cash').textContent = playerState.cash.toFixed(2);
        
        // Hide auth check and show game content
        authCheck.style.display = 'none';
        gameContent.classList.remove('d-none');
        
        // Update UI
        updateUI();
        
        // Update leaderboard
        updateLeaderboard();
    } catch (error) {
        console.error('Error checking authentication:', error);
        
        // Show error
        authCheck.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle mr-2"></i> Error: ${error.message}
                    <div class="mt-3">
                        <a href="../index.html" class="btn btn-primary">Go to Login Page</a>
                    </div>
                </div>
            </div>
        `;
    }
}

// Set up event listeners
function setupEventListeners() {
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', function() {
        EconGames.Auth.logout();
        window.location.href = '../index.html';
    });
    
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
}

// Start polling for updates
function startPolling() {
    // Poll every 5 seconds
    setInterval(async function() {
        if (!sessionInfo.id) return;
        
        try {
            // Get session data
            const sessionResult = await EconGames.Game.getGameSession(sessionInfo.id);
            
            if (!sessionResult.success) {
                throw new Error(sessionResult.error);
            }
            
            const sessionData = sessionResult.data;
            const gameData = sessionData.gameData || {};
            
            // Check if round number has changed
            const newRoundNumber = gameData.roundNumber || 0;
            
            if (newRoundNumber > gameState.roundNumber) {
                // New round, show cash injection alert
                const cashInjection = gameData.lastCashInjection || 0;
                
                if (cashInjection > 0) {
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
            }
            
            // Update game state
            gameState.roundNumber = newRoundNumber;
            gameState.assetPrices = gameData.assetPrices || {};
            gameState.priceHistory = gameData.priceHistory || {};
            gameState.lastCashInjection = gameData.lastCashInjection || 0;
            
            // Update header
            document.getElementById('header-round').textContent = gameState.roundNumber;
            
            // Get participant data
            const session = EconGames.Auth.getSession();
            const participantResult = await EconGames.Game.getParticipant(sessionInfo.id, session.userId);
            
            if (participantResult.success) {
                // Update player state
                playerState.cash = participantResult.data.cash || 0;
                playerState.portfolio = participantResult.data.portfolio || {};
                playerState.tradeHistory = participantResult.data.tradeHistory || [];
                
                // Update header
                document.getElementById('header-cash').textContent = playerState.cash.toFixed(2);
            }
            
            // Update UI
            updateUI();
            
            // Update leaderboard
            updateLeaderboard();
        } catch (error) {
            console.error('Error polling for updates:', error);
        }
    }, 5000);
}
