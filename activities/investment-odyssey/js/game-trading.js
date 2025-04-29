// Trading Functions for Investment Odyssey

// Sync local playerState with PortfolioManager
function syncPlayerState() {
    if (typeof PortfolioManager !== 'undefined') {
        console.log('Syncing local playerState with PortfolioManager');
        playerState = PortfolioManager.getPlayerState();
        console.log('Synced playerState:', playerState);
    } else {
        console.warn('PortfolioManager not available for syncing');
    }
}

// Update PortfolioManager with local playerState
function updatePortfolioManager() {
    if (typeof PortfolioManager !== 'undefined') {
        console.log('Updating PortfolioManager with local playerState');
        // Copy local playerState properties to PortfolioManager.playerState
        PortfolioManager.playerState.cash = playerState.cash;
        PortfolioManager.playerState.portfolio = JSON.parse(JSON.stringify(playerState.portfolio));
        PortfolioManager.playerState.tradeHistory = JSON.parse(JSON.stringify(playerState.tradeHistory));

        // Calculate portfolio value and update totalValue
        if (typeof PortfolioManager.getPortfolioValue === 'function') {
            const portfolioValue = PortfolioManager.getPortfolioValue();
            PortfolioManager.playerState.totalValue = playerState.cash + portfolioValue;
        } else {
            // If getPortfolioValue is not available, just use the cash value
            PortfolioManager.playerState.totalValue = playerState.cash;
        }

        console.log('Updated PortfolioManager.playerState:', PortfolioManager.playerState);
    } else {
        console.warn('PortfolioManager not available for updating');
    }
}

// Set amount based on percentage of available cash
function setAmountPercentage(percentage) {
    const cashDisplay = document.getElementById('cash-display');
    const amountInput = document.getElementById('amount-input');
    const actionSelect = document.getElementById('action-select');

    if (!cashDisplay || !amountInput || !actionSelect) return;

    const action = actionSelect.value;
    const cash = parseFloat(cashDisplay.innerText.replace(/,/g, '')) || 0;

    if (action === 'buy' && cash > 0) {
        const amount = Math.floor(cash * (percentage / 100));
        amountInput.value = amount;
        // Trigger the input event to update related fields
        amountInput.dispatchEvent(new Event('input'));
    }
}

// Execute trade
function executeTrade() {
    const assetSelect = document.getElementById('asset-select');
    const actionSelect = document.getElementById('action-select');
    const quantityInput = document.getElementById('quantity-input');

    if (!assetSelect || !actionSelect || !quantityInput) return;

    const asset = assetSelect.value;
    const action = actionSelect.value;
    const quantity = parseFloat(quantityInput.value) || 0;

    if (!asset || quantity <= 0) {
        console.log('Please select an asset and enter a valid quantity');
        return;
    }

    // Always get the latest price from MarketSimulator if available
    let price = 0;
    if (typeof MarketSimulator !== 'undefined' && MarketSimulator.getMarketData) {
        const md = MarketSimulator.getMarketData();
        price = md.assetPrices[asset] || 0;
    } else {
        price = gameState.assetPrices[asset] || 0;
    }

    if (price <= 0) {
        console.log('Invalid asset price');
        return;
    }

    // Sync with PortfolioManager first to ensure we have the latest state
    syncPlayerState();

    if (action === 'buy') {
        // Check if player has enough cash
        const cost = price * quantity;

        if (playerState.cash < cost) {
            console.log('Not enough cash to complete this purchase');
            return;
        }

        // Update player state
        playerState.cash -= cost;

        if (!playerState.portfolio[asset]) {
            playerState.portfolio[asset] = 0;
        }

        playerState.portfolio[asset] += quantity;

        // Add to trade history
        playerState.tradeHistory.push({
            asset: asset,
            action: 'buy',
            quantity: quantity,
            price: price,
            cost: cost,
            timestamp: new Date()
        });
    } else {
        // Check if player has enough of the asset
        const currentQuantity = playerState.portfolio[asset] || 0;

        if (currentQuantity < quantity) {
            console.log('Not enough of this asset to sell');
            return;
        }

        // Calculate value
        const value = price * quantity;

        // Update player state
        playerState.cash += value;
        playerState.portfolio[asset] -= quantity;

        // Remove asset from portfolio if quantity is 0
        if (playerState.portfolio[asset] <= 0) {
            delete playerState.portfolio[asset];
        }

        // Add to trade history
        playerState.tradeHistory.push({
            asset: asset,
            action: 'sell',
            quantity: quantity,
            price: price,
            value: value,
            timestamp: new Date()
        });
    }

    // Update PortfolioManager with our changes
    updatePortfolioManager();

    // Update UI
    updateUI();

    // Update trade history list
    updateTradeHistoryList();

    // Reset form
    quantityInput.value = '';
    updateTotalCost();

    // Save player state to database
    if (typeof PortfolioManager !== 'undefined' && PortfolioManager.savePlayerState) {
        console.log('Saving player state to database after trade');
        PortfolioManager.savePlayerState().then(() => {
            console.log('Player state saved successfully');
        }).catch(error => {
            console.error('Error saving player state:', error);
        });
    } else {
        console.warn('PortfolioManager not available, falling back to saveGameState');
        saveGameState();
    }
}

// Buy all assets
function buyAllAssets() {
    try {
        console.log('Buying all assets evenly...');

        // Sync with PortfolioManager first to ensure we have the latest state
        syncPlayerState();

        console.log(`Current cash: ${playerState.cash}`);
        console.log(`Current portfolio:`, playerState.portfolio);

        // Always use the latest prices from MarketSimulator
        const latestMarketData = (typeof MarketSimulator !== 'undefined' && MarketSimulator.getMarketData) ? MarketSimulator.getMarketData() : gameState;
        // Exclude 'cash' from the asset list
        let assetNames = Object.keys(latestMarketData.assetPrices).filter(a => a.toLowerCase() !== 'cash');

        if (assetNames.length === 0) {
            console.log('No assets available to buy.');
            if (typeof showNotification === 'function') {
                showNotification('No assets available to buy.', 'warning');
            }
            return;
        }

        // Check if player has cash
        if (playerState.cash <= 0) {
            console.log('No cash available to buy assets.');
            if (typeof showNotification === 'function') {
                showNotification('No cash available to buy assets.', 'warning');
            }
            return;
        }

        // Calculate amount per asset
        const amountPerAsset = playerState.cash / assetNames.length;

        if (amountPerAsset <= 0) {
            console.log('Not enough cash to distribute.');
            if (typeof showNotification === 'function') {
                showNotification('Not enough cash to distribute.', 'warning');
            }
            return;
        }

        console.log(`Distributing $${playerState.cash.toFixed(2)} across ${assetNames.length} assets ($${amountPerAsset.toFixed(2)} per asset)`);

        // Buy assets
        for (const asset of assetNames) {
            // Always use the latest price for this asset
            const price = latestMarketData.assetPrices[asset];
            if (!price || price <= 0) {
                console.log(`Price not available for ${asset}, skipping.`);
                continue;
            }

            // Calculate quantity
            const quantity = amountPerAsset / price;

            console.log(`Buying ${asset}: Price=${price}, Quantity=${quantity.toFixed(4)}, Cost=${amountPerAsset.toFixed(2)}`);

            if (quantity > 0) {
                // Update player state
                if (!playerState.portfolio[asset]) {
                    playerState.portfolio[asset] = 0;
                }

                playerState.portfolio[asset] += quantity;

                // Add to trade history
                playerState.tradeHistory.push({
                    asset: asset,
                    action: 'buy',
                    quantity: quantity,
                    price: price,
                    cost: amountPerAsset,
                    timestamp: new Date()
                });
            }
        }

        // Set cash to 0
        playerState.cash = 0;

        // Update PortfolioManager with our changes
        updatePortfolioManager();

        // Update UI
        updateUI();

        // Update trade history list
        updateTradeHistoryList();

        // Save player state to database
        if (typeof PortfolioManager !== 'undefined' && PortfolioManager.savePlayerState) {
            console.log('Saving player state to database after trade');
            PortfolioManager.savePlayerState().then(() => {
                console.log('Player state saved successfully');
            }).catch(error => {
                console.error('Error saving player state:', error);
            });
        } else {
            console.warn('PortfolioManager not available, falling back to saveGameState');
            saveGameState();
        }

        console.log('Distributed cash evenly across all assets');
        console.log(`Updated cash: ${playerState.cash}`);
        console.log(`Updated portfolio:`, playerState.portfolio);

        if (typeof showNotification === 'function') {
            showNotification('Distributed cash evenly across all assets.', 'success');
        }
    } catch (error) {
        console.error('Error in buyAllAssets:', error);
        if (typeof showNotification === 'function') {
            showNotification('Error buying all assets. Please try again.', 'danger');
        }
    }
}

// Buy selected assets evenly
function buySelectedAssets() {
    try {
        console.log('Buying selected assets evenly...');

        // Sync with PortfolioManager first to ensure we have the latest state
        syncPlayerState();

        console.log(`Current cash: ${playerState.cash}`);
        console.log(`Current portfolio:`, playerState.portfolio);

        // Get selected assets
        const checkboxes = document.querySelectorAll('.diversify-asset:checked');
        let selectedAssets = Array.from(checkboxes).map(checkbox => checkbox.value);

        // If no checkboxes are found or none are checked, use the currently selected asset
        if (selectedAssets.length === 0) {
            const assetSelect = document.getElementById('asset-select');
            if (assetSelect && assetSelect.value) {
                selectedAssets.push(assetSelect.value);
                console.log(`No assets selected for diversification, using current selected asset: ${assetSelect.value}`);
            } else {
                console.log('No assets selected for diversification.');
                if (typeof showNotification === 'function') {
                    showNotification('Please select at least one asset for diversification.', 'warning');
                }
                return;
            }
        }

        console.log(`Selected assets for diversification: ${selectedAssets.join(', ')}`);

        // Exclude 'cash' from selected assets
        selectedAssets = selectedAssets.filter(a => a.toLowerCase() !== 'cash');
        // Sort assets alphabetically for consistency
        selectedAssets.sort();

        // Check if we have cash first
        if (playerState.cash <= 0) {
            console.log('No cash to distribute.');
            if (typeof showNotification === 'function') {
                showNotification('No cash to distribute.', 'warning');
            }
            return;
        }

        // Calculate cash per asset
        const cashPerAsset = playerState.cash / selectedAssets.length;

        if (cashPerAsset <= 0) {
            console.log('Not enough cash to distribute.');
            if (typeof showNotification === 'function') {
                showNotification('Not enough cash to distribute.', 'warning');
            }
            return;
        }

        console.log(`Distributing $${playerState.cash.toFixed(2)} across ${selectedAssets.length} selected assets ($${cashPerAsset.toFixed(2)} per asset)`);

        // Always use the latest prices from MarketSimulator
        const latestMarketData = (typeof MarketSimulator !== 'undefined' && MarketSimulator.getMarketData) ? MarketSimulator.getMarketData() : gameState;
        // Buy each selected asset
        for (const asset of selectedAssets) {
            // Use the latest price for this asset
            const price = latestMarketData.assetPrices[asset];
            if (!price) {
                console.log(`Price not available for ${asset}, skipping.`);
                continue;
            }

            const quantity = cashPerAsset / price;

            console.log(`Buying ${asset}: Price=${price}, Quantity=${quantity.toFixed(4)}, Cost=${cashPerAsset.toFixed(2)}`);

            if (quantity > 0) {
                // Update player state
                if (!playerState.portfolio[asset]) {
                    playerState.portfolio[asset] = 0;
                }
                playerState.portfolio[asset] += quantity;

                // Add to trade history
                playerState.tradeHistory.push({
                    asset: asset,
                    action: 'buy',
                    quantity: quantity,
                    price: price,
                    cost: cashPerAsset,
                    timestamp: new Date()
                });
            }
        }

        // Set cash to 0
        playerState.cash = 0;

        // Update PortfolioManager with our changes
        updatePortfolioManager();

        // Update UI
        updateUI();

        // Update trade history list
        updateTradeHistoryList();

        // Save player state to database
        if (typeof PortfolioManager !== 'undefined' && PortfolioManager.savePlayerState) {
            console.log('Saving player state to database after trade');
            PortfolioManager.savePlayerState().then(() => {
                console.log('Player state saved successfully');
            }).catch(error => {
                console.error('Error saving player state:', error);
            });
        } else {
            console.warn('PortfolioManager not available, falling back to saveGameState');
            saveGameState();
        }

        console.log('Distributed cash evenly across selected assets');
        console.log(`Updated cash: ${playerState.cash}`);
        console.log(`Updated portfolio:`, playerState.portfolio);

        if (typeof showNotification === 'function') {
            showNotification(`Distributed cash evenly across ${selectedAssets.length} selected assets.`, 'success');
        }
    } catch (error) {
        console.error('Error buying selected assets:', error);
        if (typeof showNotification === 'function') {
            showNotification('Error buying selected assets. Please try again.', 'danger');
        }
    }
}

// Sell all assets
function sellAllAssets() {
    // Sync with PortfolioManager first to ensure we have the latest state
    syncPlayerState();

    // Check if there are assets to sell
    const assetNames = Object.keys(playerState.portfolio);

    if (assetNames.length === 0) {
        if (typeof showNotification === 'function') {
            showNotification('No assets in portfolio to sell.', 'warning');
        }
        return;
    }

    // Batch update: accumulate all changes before updating UI
    let totalCashFromSales = 0;
    const tradeHistoryUpdates = [];

    for (const asset of assetNames) {
        const quantity = playerState.portfolio[asset];
        const price = gameState.assetPrices[asset];
        if (quantity <= 0 || !price || price <= 0) continue;
        const value = price * quantity;
        totalCashFromSales += value;
        tradeHistoryUpdates.push({
            asset: asset,
            action: 'sell',
            quantity: quantity,
            price: price,
            value: value,
            timestamp: new Date()
        });
    }

    // Apply all updates at once
    playerState.cash += totalCashFromSales;
    playerState.tradeHistory = playerState.tradeHistory.concat(tradeHistoryUpdates);
    playerState.portfolio = {};

    // Update PortfolioManager with our changes
    updatePortfolioManager();

    // Only update the UI after all state changes are complete (prevents flicker)
    updateUI();
    // FIX: UI only updates once, after all state is stable, preventing pie chart and price flicker.
}

    // Update trade history list
    updateTradeHistoryList();

    // Save player state to database
    if (typeof PortfolioManager !== 'undefined' && PortfolioManager.savePlayerState) {
        console.log('Saving player state to database after trade');
        PortfolioManager.savePlayerState().then(() => {
            console.log('Player state saved successfully');
        }).catch(error => {
            console.error('Error saving player state:', error);
        });
    } else {
        console.warn('PortfolioManager not available, falling back to saveGameState');
        saveGameState();
    }

    // Show notification
    if (typeof showNotification === 'function') {
        showNotification('All assets sold successfully.', 'success');
    }
// END sellAllAssets

// Update trade history list
function updateTradeHistoryList() {
    const tradeHistoryList = document.getElementById('trade-history-list');
    if (!tradeHistoryList) return;

    // Clear existing items
    tradeHistoryList.innerHTML = '';

    // Check if there are trades
    if (playerState.tradeHistory.length === 0) {
        tradeHistoryList.innerHTML = `
            <div class="list-group-item text-center text-muted">
                No trades yet
            </div>
        `;
        return;
    }

    // Add items for each trade (most recent first)
    for (let i = playerState.tradeHistory.length - 1; i >= 0; i--) {
        const trade = playerState.tradeHistory[i];

        const tradeItem = document.createElement('div');
        tradeItem.className = `list-group-item trade-history-item trade-${trade.action}`;

        // Use round number instead of timestamp for simplicity
        const formattedTime = `Round ${gameState.roundNumber}`;

        if (trade.action === 'buy') {
            tradeItem.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>Bought ${trade.quantity.toFixed(2)} ${trade.asset}</strong>
                        <div class="text-muted small">${formattedTime}</div>
                    </div>
                    <div class="text-right">
                        <div>$${trade.price.toFixed(2)} per unit</div>
                        <div class="font-weight-bold">Total: $${trade.cost.toFixed(2)}</div>
                    </div>
                </div>
            `;
        } else {
            tradeItem.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>Sold ${trade.quantity.toFixed(2)} ${trade.asset}</strong>
                        <div class="text-muted small">${formattedTime}</div>
                    </div>
                    <div class="text-right">
                        <div>$${trade.price.toFixed(2)} per unit</div>
                        <div class="font-weight-bold">Total: $${trade.value.toFixed(2)}</div>
                    </div>
                </div>
            `;
        }

        tradeHistoryList.appendChild(tradeItem);
    }
}

// Update total cost
function updateTotalCost() {
    const assetSelect = document.getElementById('asset-select');
    const actionSelect = document.getElementById('action-select');
    const quantityInput = document.getElementById('quantity-input');
    const amountInput = document.getElementById('amount-input');
    const totalCostDisplay = document.getElementById('total-cost-display');
    const currentPriceDisplay = document.getElementById('current-price-display');
    const quantityDisplay = document.getElementById('quantity-display');
    const availableCashDisplay = document.getElementById('available-cash-display');

    if (!assetSelect || !actionSelect || !quantityInput || !totalCostDisplay || !currentPriceDisplay) return;

    const asset = assetSelect.value;
    const action = actionSelect.value;
    const quantity = parseFloat(quantityInput.value) || 0;

    // Get current price
    const price = gameState.assetPrices[asset] || 0;
    currentPriceDisplay.textContent = formatCurrency(price);

    // Calculate total cost
    const totalCost = price * quantity;
    totalCostDisplay.textContent = formatCurrency(totalCost);

    // Update quantity display
    if (quantityDisplay) {
        quantityDisplay.textContent = quantity.toFixed(6);
    }

    // Update available cash display
    if (availableCashDisplay) {
        availableCashDisplay.textContent = formatCurrency(playerState.cash);
    }

    // If amount input is changed, update quantity
    if (amountInput && price > 0) {
        const amount = parseFloat(amountInput.value) || 0;
        if (action === 'buy' && amountInput === document.activeElement) {
            // Only update quantity if amount input is focused
            const calculatedQuantity = amount / price;
            quantityInput.value = calculatedQuantity.toFixed(6);
        }
    }
}

// Format currency
function formatCurrency(amount) {
    return amount.toFixed(2);
}

// Initialize player state from PortfolioManager when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing game-trading.js');

    // Wait a short time to ensure PortfolioManager is initialized
    setTimeout(function() {
        console.log('Syncing initial player state from PortfolioManager');
        syncPlayerState();

        // === FIELD SYNC LOGIC FOR GAME CONTROLS ===
        const amountInput = document.getElementById('amount-input');
        const quantityInput = document.getElementById('quantity-input');
        const assetSelect = document.getElementById('asset-select');
        const actionSelect = document.getElementById('action-select');

        // Helper to get the latest price for the selected asset
        function getCurrentAssetPrice() {
            const asset = assetSelect && assetSelect.value;
            if (!asset) return 0;
            if (typeof MarketSimulator !== 'undefined' && MarketSimulator.getMarketData) {
                const md = MarketSimulator.getMarketData();
                return md.assetPrices[asset] || 0;
            }
            return gameState.assetPrices[asset] || 0;
        }

        // Amount input updates quantity
        if (amountInput && quantityInput) {
            amountInput.addEventListener('input', function() {
                const price = getCurrentAssetPrice();
                const amount = parseFloat(amountInput.value) || 0;
                if (price > 0) {
                    quantityInput.value = (amount / price).toFixed(4);
                } else {
                    quantityInput.value = '';
                }
            });
        }

        // Quantity input updates amount
        if (quantityInput && amountInput) {
            quantityInput.addEventListener('input', function() {
                const price = getCurrentAssetPrice();
                const quantity = parseFloat(quantityInput.value) || 0;
                if (price > 0) {
                    amountInput.value = (quantity * price).toFixed(2);
                } else {
                    amountInput.value = '';
                }
            });
        }

        // Percentage buttons update amount (and trigger input event)
        const percentBtns = document.querySelectorAll('.amount-percent-btn');
        percentBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const percent = parseFloat(btn.dataset.percent);
                if (!isNaN(percent)) {
                    setAmountPercentage(percent);
                }
            });
        });

        // If asset or action changes, recalc quantity/amount
        if (assetSelect && amountInput && quantityInput) {
            assetSelect.addEventListener('change', function() {
                amountInput.dispatchEvent(new Event('input'));
            });
        }
        if (actionSelect && amountInput && quantityInput) {
            actionSelect.addEventListener('change', function() {
                amountInput.dispatchEvent(new Event('input'));
            });
        }
        // === END FIELD SYNC LOGIC ===
    }, 1000);
});
