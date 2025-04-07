// Single Player Game JavaScript for Investment Odyssey

// Load the core, UI, and trading modules
document.addEventListener('DOMContentLoaded', function() {
    // Include the other JavaScript files
    loadScript('js/single-player-core.js', function() {
        loadScript('js/single-player-ui.js', function() {
            loadScript('js/single-player-trading.js', function() {
                console.log('All scripts loaded');
                
                // Try to load saved game state
                if (!loadGameState()) {
                    // Initialize new game if no saved state
                    initializeGame();
                }
                
                // Update UI
                updateUI();
            });
        });
    });
});

// Helper function to load scripts dynamically
function loadScript(url, callback) {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.onload = callback;
    document.head.appendChild(script);
}
