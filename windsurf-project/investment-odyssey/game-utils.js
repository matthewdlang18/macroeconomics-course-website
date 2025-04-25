// Utility functions for Investment Odyssey

// Normalize game state properties to ensure consistent naming
window.normalizeGameState = function(gameState) {
    if (!gameState) return null;
    
    const normalized = { ...gameState };
    
    // Handle asset_prices vs assetPrices
    if (gameState.asset_prices && !gameState.assetPrices) {
        normalized.assetPrices = gameState.asset_prices;
    } else if (gameState.assetPrices && !gameState.asset_prices) {
        normalized.asset_prices = gameState.assetPrices;
    }
    
    // Handle price_history vs priceHistory
    if (gameState.price_history && !gameState.priceHistory) {
        normalized.priceHistory = gameState.price_history;
    } else if (gameState.priceHistory && !gameState.price_history) {
        normalized.price_history = gameState.priceHistory;
    }
    
    // Handle cpi vs CPI
    if (gameState.cpi && !gameState.CPI) {
        normalized.CPI = gameState.cpi;
    } else if (gameState.CPI && !gameState.cpi) {
        normalized.cpi = gameState.CPI;
    }
    
    // Handle cpi_history vs CPIHistory
    if (gameState.cpi_history && !gameState.CPIHistory) {
        normalized.CPIHistory = gameState.cpi_history;
    } else if (gameState.CPIHistory && !gameState.cpi_history) {
        normalized.cpi_history = gameState.CPIHistory;
    }
    
    // Handle round_number vs roundNumber
    if (gameState.round_number && !gameState.roundNumber) {
        normalized.roundNumber = gameState.round_number;
    } else if (gameState.roundNumber && !gameState.round_number) {
        normalized.round_number = gameState.roundNumber;
    }
    
    // Handle max_rounds vs maxRounds
    if (gameState.max_rounds && !gameState.maxRounds) {
        normalized.maxRounds = gameState.max_rounds;
    } else if (gameState.maxRounds && !gameState.max_rounds) {
        normalized.max_rounds = gameState.maxRounds;
    }
    
    // Handle last_bitcoin_crash_round vs lastBitcoinCrashRound
    if (gameState.last_bitcoin_crash_round && !gameState.lastBitcoinCrashRound) {
        normalized.lastBitcoinCrashRound = gameState.last_bitcoin_crash_round;
    } else if (gameState.lastBitcoinCrashRound && !gameState.last_bitcoin_crash_round) {
        normalized.last_bitcoin_crash_round = gameState.lastBitcoinCrashRound;
    }
    
    // Handle bitcoin_shock_range vs bitcoinShockRange
    if (gameState.bitcoin_shock_range && !gameState.bitcoinShockRange) {
        normalized.bitcoinShockRange = gameState.bitcoin_shock_range;
    } else if (gameState.bitcoinShockRange && !gameState.bitcoin_shock_range) {
        normalized.bitcoin_shock_range = gameState.bitcoinShockRange;
    }
    
    return normalized;
};

// Calculate portfolio value
window.calculatePortfolioValue = function(playerState, gameState) {
    if (!playerState || !gameState) return 0;
    
    let portfolioValue = 0;
    const portfolio = playerState.portfolio || {};
    const assetPrices = gameState.assetPrices || gameState.asset_prices || {};
    
    for (const asset in portfolio) {
        const quantity = portfolio[asset];
        const price = assetPrices[asset];
        if (quantity && price) {
            portfolioValue += quantity * price;
        }
    }
    
    return portfolioValue;
};

// Format currency
window.formatCurrency = function(value) {
    return parseFloat(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Show notification
window.showNotification = function(message, type = 'info') {
    console.log(`Notification (${type}): ${message}`);
    
    // Check if notification container exists
    let notificationContainer = document.getElementById('notification-container');
    
    // Create container if it doesn't exist
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
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Style the notification
    notification.style.backgroundColor = type === 'success' ? '#d4edda' : 
                                        type === 'warning' ? '#fff3cd' :
                                        type === 'danger' ? '#f8d7da' : '#cce5ff';
    notification.style.color = type === 'success' ? '#155724' : 
                              type === 'warning' ? '#856404' :
                              type === 'danger' ? '#721c24' : '#004085';
    notification.style.border = `1px solid ${type === 'success' ? '#c3e6cb' : 
                                            type === 'warning' ? '#ffeeba' :
                                            type === 'danger' ? '#f5c6cb' : '#b8daff'}`;
    notification.style.borderRadius = '4px';
    notification.style.padding = '12px 20px';
    notification.style.marginBottom = '10px';
    notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
    notification.style.transition = 'all 0.3s ease';
    notification.style.opacity = '0';
    
    // Add notification to container
    notificationContainer.appendChild(notification);
    
    // Fade in
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);
    
    // Add close button event listener
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notificationContainer.removeChild(notification);
        }, 300);
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode === notificationContainer) {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode === notificationContainer) {
                    notificationContainer.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
};

// Next round function
window.nextRound = async function() {
    console.log('Next round function called');
    
    if (typeof advanceToNextRound === 'function') {
        console.log('Using advanceToNextRound function from game.js');
        return advanceToNextRound();
    } else if (typeof window.advanceToNextRound === 'function') {
        console.log('Using window.advanceToNextRound function');
        return window.advanceToNextRound();
    } else {
        console.error('advanceToNextRound function not found');
        window.showNotification('Error: Could not advance to next round. Function not found.', 'danger');
        return false;
    }
};
