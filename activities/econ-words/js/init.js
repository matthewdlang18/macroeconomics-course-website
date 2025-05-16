/**
 * Initialization script for Econ Words
 * This script runs after all other scripts are loaded
 */

// Function to initialize the game and all its components
function initializeEconWordsGame() {
    console.log('Initializing Econ Words game components...');
    
    // Initialize user info
    initUserInfo();
    
    // Update game stats from Supabase
    updateGameStats();
    
    // Update game banner
    updateGameBanner();
    
    // Initialize the leaderboard if it exists
    if (typeof EconWordsLeaderboard !== 'undefined') {
        console.log('Initializing leaderboard...');
        EconWordsLeaderboard.init();
    }
    
    // Initialize the game
    initGame();
    
    // Update the game board and keyboard after a short delay
    // This ensures all functions are defined before they're called
    setTimeout(function() {
        console.log('Updating game board and keyboard...');
        updateGameBoard();
        updateKeyboard();
    }, 500);
}

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, waiting for authentication...');
    
    // Listen for the auth ready event
    window.addEventListener('econwords-auth-ready', function(e) {
        console.log('Auth is ready, user authenticated:', e.detail.authenticated);
        
        // Now that auth is ready, initialize the game components
        initializeEconWordsGame();
    });
    
    // If auth event doesn't fire within 2 seconds, initialize anyway
    setTimeout(function() {
        if (!window.authInitialized) {
            console.warn('Auth event did not fire, initializing game anyway');
            initializeEconWordsGame();
        }
    }, 2000);
});
