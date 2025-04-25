// Trading Functions for Investment Odyssey

// Set amount based on percentage of available cash
function setAmountPercentage(percentage) {
    const amountInput = document.getElementById('trade-amount');
    const actionSelect = document.getElementById('trade-action');

    if (!amountInput || !actionSelect) return;

    const action = actionSelect.value;

    if (action === 'buy' && playerState.cash > 0) {
        const amount = (playerState.cash * (percentage / 100)).toFixed(2);
        amountInput.value = amount;
        // Trigger the input event to update related fields
        amountInput.dispatchEvent(new Event('input'));
    }
}

// Set quantity based on percentage of available asset
function setQuantityPercentage(percentage) {
    const quantityInput = document.getElementById('trade-quantity');
    const assetSelect = document.getElementById('trade-asset');
    const actionSelect = document.getElementById('trade-action');

    if (!quantityInput || !assetSelect || !actionSelect) return;

    const asset = assetSelect.value;
    const action = actionSelect.value;

    if (action === 'sell' && asset) {
        const availableQuantity = playerState.portfolio[asset] || 0;
        if (availableQuantity > 0) {
            const quantity = (availableQuantity * (percentage / 100)).toFixed(6);
            quantityInput.value = quantity;
            // Trigger the input event to update related fields
            quantityInput.dispatchEvent(new Event('input'));
        }
    }
}

// Execute trade - based directly on templates/game-trading.js
function executeTrade() {
    try {
        console.log('Executing trade...');

        // Get trade form elements - use both possible IDs to handle different HTML structures
        const assetSelect = document.getElementById('asset-select') || document.getElementById('trade-asset-select');
        const actionSelect = document.getElementById('action-select') || document.getElementById('trade-action');
        const quantityInput = document.getElementById('quantity-input') || document.getElementById('trade-quantity');

        if (!assetSelect || !actionSelect || !quantityInput) {
            console.error('Missing required elements for executeTrade');
            console.log('Looking for: asset-select/trade-asset-select, action-select/trade-action, quantity-input/trade-quantity');
            window.showNotification('Error: Missing form elements', 'danger');
            return;
        }

        const assetName = assetSelect.value;
        const action = actionSelect.value;
        const quantity = parseFloat(quantityInput.value) || 0;

        console.log(`Trade details: Asset=${assetName}, Action=${action}, Quantity=${quantity}`);

        if (!assetName) {
            window.showNotification('Please select an asset', 'warning');
            return;
        }

        if (quantity <= 0) {
            window.showNotification('Please enter a valid quantity', 'warning');
            return;
        }

        // Get asset price
        const price = gameState.assetPrices[assetName] || 0;

        if (price <= 0) {
            window.showNotification('Invalid asset price', 'danger');
            return;
        }

        if (action === 'buy') {
            // Check if player has enough cash
            const cost = price * quantity;

            console.log(`Buy details: Price=${price}, Cost=${cost}, Cash=${playerState.cash}`);

            if (playerState.cash < cost) {
                window.showNotification(`Not enough cash to complete this purchase. You need $${cost.toFixed(2)} but have $${playerState.cash.toFixed(2)}`, 'warning');
                return;
            }

            // Update player state
            playerState.cash -= cost;

            if (!playerState.portfolio[assetName]) {
                playerState.portfolio[assetName] = 0;
            }

            playerState.portfolio[assetName] += quantity;

            // Add to trade history
            if (!playerState.tradeHistory) {
                playerState.tradeHistory = [];
            }

            playerState.tradeHistory.push({
                asset: assetName,
                action: 'buy',
                quantity: quantity,
                price: price,
                cost: cost,
                timestamp: new Date(),
                round: gameState.roundNumber || 0
            });

            window.showNotification(`Successfully bought ${quantity.toFixed(6)} ${assetName} for $${cost.toFixed(2)}`, 'success');
        } else {
            // Check if player has enough of the asset
            const currentQuantity = playerState.portfolio[assetName] || 0;

            console.log(`Sell details: CurrentQuantity=${currentQuantity}, SellingQuantity=${quantity}`);

            if (currentQuantity < quantity) {
                window.showNotification(`Not enough of this asset to sell. You have ${currentQuantity.toFixed(6)} but are trying to sell ${quantity.toFixed(6)}`, 'warning');
                return;
            }

            // Calculate value
            const value = price * quantity;

            // Update player state
            playerState.cash += value;
            playerState.portfolio[assetName] -= quantity;

            // Remove asset from portfolio if quantity is 0
            if (playerState.portfolio[assetName] <= 0) {
                delete playerState.portfolio[assetName];
            }

            // Add to trade history
            if (!playerState.tradeHistory) {
                playerState.tradeHistory = [];
            }

            playerState.tradeHistory.push({
                asset: assetName,
                action: 'sell',
                quantity: quantity,
                price: price,
                value: value,
                timestamp: new Date(),
                round: gameState.roundNumber || 0
            });

            window.showNotification(`Successfully sold ${quantity.toFixed(6)} ${assetName} for $${value.toFixed(2)}`, 'success');
        }

        // Calculate the new portfolio value
        const portfolioValue = calculatePortfolioValue();
        const totalValue = playerState.cash + portfolioValue;

        // Update player state with the final total value
        playerState.total_value = totalValue;

        console.log('Portfolio value after trade:', {
            portfolioValue,
            cash: playerState.cash,
            totalValue
        });

        // Update UI - this will update the simplified Portfolio Summary
        updateUI();

        // Reset form
        quantityInput.value = '';
        const amountInput = document.getElementById('amount-input') || document.getElementById('trade-amount');
        if (amountInput) {
            amountInput.value = '';
        }

        // Update trade history list if the function exists
        if (typeof window.updateTradeHistoryList === 'function') {
            window.updateTradeHistoryList();
        } else if (typeof updateTradeHistoryList === 'function') {
            updateTradeHistoryList();
        }

        // Update trade summary if the function exists
        if (typeof window.updateTradeSummary === 'function') {
            window.updateTradeSummary();
        } else if (typeof updateTradeSummary === 'function') {
            updateTradeSummary();
        }

        // Save game state
        if (window.gameSession && window.gameSupabase) {
            // Save to Supabase
            console.log('Saving trade to Supabase...');
            window.gameSupabase.updatePlayerState(window.gameSession.id, playerState)
                .then(() => {
                    console.log('Trade saved to Supabase successfully');
                })
                .catch(error => {
                    console.error('Error saving trade to Supabase:', error);
                    // Fall back to local storage
                    saveGameState();
                });
        } else {
            // Save to local storage
            saveGameState();
        }

        console.log('Trade executed successfully');
    } catch (error) {
        console.error('Error executing trade:', error);
        window.showNotification('An error occurred while executing the trade', 'danger');
    }
}

// Buy all assets evenly
function buyAllAssets() {
    try {
        console.log('Buying all assets evenly...');

        // Check if there are assets to buy - handle different property names
        const assetPrices = gameState.assetPrices || gameState.asset_prices || {};
        const assetNames = Object.keys(assetPrices);

        if (assetNames.length === 0) {
            showNotification('No assets available to buy.', 'warning');
            return;
        }

        // Check if player has cash
        if (playerState.cash <= 0) {
            showNotification('No cash available to buy assets.', 'warning');
            return;
        }

        // Calculate amount per asset
        const amountPerAsset = playerState.cash / assetNames.length;

        if (amountPerAsset <= 0) {
            showNotification('Not enough cash to distribute.', 'warning');
            return;
        }

        console.log(`Distributing $${playerState.cash.toFixed(2)} across ${assetNames.length} assets ($${amountPerAsset.toFixed(2)} per asset)`);

        // Buy assets
        for (const asset of assetNames) {
            const price = assetPrices[asset];
            if (!price || price <= 0) {
                console.log(`Price not available for ${asset}, skipping.`);
                continue;
            }

            // Calculate quantity
            const quantity = amountPerAsset / price;

            console.log(`Buying ${asset}: Price=${price}, Quantity=${quantity.toFixed(6)}, Cost=${amountPerAsset.toFixed(2)}`);

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
                    timestamp: new Date(),
                    round: currentRound
                });
            }
        }

        // Set cash to 0
        playerState.cash = 0;

        // Calculate the new portfolio value
        const portfolioValue = calculatePortfolioValue();
        const totalValue = playerState.cash + portfolioValue;

        // Update player state with the final total value
        playerState.total_value = totalValue;

        console.log('Portfolio value after distribution:', {
            portfolioValue,
            cash: playerState.cash,
            totalValue
        });

        // Update UI - this will update the simplified Portfolio Summary
        updateUI();

        // Save game state
        saveGameState();

        showNotification('Distributed cash evenly across all assets.', 'success');
    } catch (error) {
        console.error('Error in buyAllAssets:', error);
        showNotification('Error buying all assets. Please try again.', 'danger');
    }
}

// Buy selected assets evenly
function buySelectedAssets() {
    try {
        console.log('Buying selected assets evenly...');

        // Get selected assets
        const checkboxes = document.querySelectorAll('.diversify-asset:checked');
        let selectedAssets = Array.from(checkboxes).map(checkbox => checkbox.value);

        if (selectedAssets.length === 0) {
            showNotification('Please select at least one asset for diversification.', 'warning');
            return;
        }

        console.log(`Selected assets for diversification: ${selectedAssets.join(', ')}`);

        // Check if we have cash first
        if (playerState.cash <= 0) {
            showNotification('No cash to distribute.', 'warning');
            return;
        }

        // Calculate cash per asset
        const cashPerAsset = playerState.cash / selectedAssets.length;

        if (cashPerAsset <= 0) {
            showNotification('Not enough cash to distribute.', 'warning');
            return;
        }

        console.log(`Distributing $${playerState.cash.toFixed(2)} across ${selectedAssets.length} selected assets ($${cashPerAsset.toFixed(2)} per asset)`);

        // Buy each selected asset
        for (const asset of selectedAssets) {
            // Handle different property names for asset prices
            const price = gameState.assetPrices?.[asset] || gameState.asset_prices?.[asset];
            if (!price) {
                console.log(`Price not available for ${asset}, skipping.`);
                continue;
            }

            const quantity = cashPerAsset / price;

            console.log(`Buying ${asset}: Price=${price}, Quantity=${quantity.toFixed(6)}, Cost=${cashPerAsset.toFixed(2)}`);

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
                    timestamp: new Date(),
                    round: currentRound
                });
            }
        }

        // Set cash to 0
        playerState.cash = 0;

        // Calculate the new portfolio value
        const portfolioValue = calculatePortfolioValue();
        const totalValue = playerState.cash + portfolioValue;

        // Update player state with the final total value
        playerState.total_value = totalValue;

        console.log('Portfolio value after distribution to selected assets:', {
            portfolioValue,
            cash: playerState.cash,
            totalValue
        });

        // Update UI - this will update the simplified Portfolio Summary
        updateUI();

        // Save game state
        saveGameState();

        showNotification(`Distributed cash evenly across ${selectedAssets.length} selected assets.`, 'success');
    } catch (error) {
        console.error('Error buying selected assets:', error);
        showNotification('Error buying selected assets. Please try again.', 'danger');
    }
}

// Sell all assets
function sellAllAssets() {
    // Check if there are assets to sell
    const assetNames = Object.keys(playerState.portfolio);

    if (assetNames.length === 0) {
        showNotification('No assets in portfolio to sell.', 'warning');
        return;
    }

    // Sell assets
    for (const asset of assetNames) {
        const quantity = playerState.portfolio[asset];
        // Handle different property names for asset prices
        const price = gameState.assetPrices?.[asset] || gameState.asset_prices?.[asset];

        if (quantity <= 0 || !price || price <= 0) continue;

        // Calculate value
        const value = price * quantity;

        // Update player state
        playerState.cash += value;

        // Add to trade history
        playerState.tradeHistory.push({
            asset: asset,
            action: 'sell',
            quantity: quantity,
            price: price,
            value: value,
            timestamp: new Date(),
            round: currentRound
        });
    }

    // Clear portfolio
    playerState.portfolio = {};

    // Calculate the new portfolio value (should be 0 now)
    const portfolioValue = 0;
    const totalValue = playerState.cash;

    // Update player state with the final total value
    playerState.total_value = totalValue;

    console.log('Portfolio value after selling all assets:', {
        portfolioValue,
        cash: playerState.cash,
        totalValue
    });

    // Update UI - this will update the simplified Portfolio Summary
    updateUI();

    // Save game state
    saveGameState();

    // Show notification
    showNotification('All assets sold successfully.', 'success');
}

// Update trade summary
function updateTradeSummary() {
    try {
        console.log('Updating trade summary...');

        // Get trade form elements
        const assetSelect = document.getElementById('trade-asset-select');
        const actionSelect = document.getElementById('trade-action');
        const quantityInput = document.getElementById('trade-quantity');
        const amountInput = document.getElementById('trade-amount');
        const summaryQuantity = document.getElementById('summary-quantity');
        const summaryCost = document.getElementById('summary-cost');
        const summaryCash = document.getElementById('summary-cash');
        const currentPrice = document.getElementById('current-price-display');
        const executeTradeBtn = document.getElementById('execute-trade-btn');

        if (!assetSelect) {
            console.error('Asset select not found');
            return;
        }

        const assetName = assetSelect.value;
        if (!assetName) {
            console.log('No asset selected');
            return;
        }

        // Get action
        const action = actionSelect ? actionSelect.value : 'buy';

        // Get asset price - handle different property names
        const price = gameState.assetPrices?.[assetName] || gameState.asset_prices?.[assetName] || 0;

        // Update current price display
        if (currentPrice) {
            currentPrice.textContent = price.toFixed(2);
        }

        // Update available cash
        if (summaryCash) {
            summaryCash.textContent = playerState.cash.toFixed(2);
        }

        // Get quantity
        const quantity = parseFloat(quantityInput?.value) || 0;

        // Calculate total cost
        const totalCost = price * quantity;

        // Update summary
        if (summaryQuantity) {
            summaryQuantity.textContent = quantity.toFixed(6);
        }

        if (summaryCost) {
            summaryCost.textContent = totalCost.toFixed(2);
        }

        // Enable/disable execute button
        if (executeTradeBtn) {
            if (assetName && quantity > 0) {
                if (action === 'buy' && totalCost <= playerState.cash) {
                    executeTradeBtn.disabled = false;
                } else if (action === 'sell' && quantity <= (playerState.portfolio[assetName] || 0)) {
                    executeTradeBtn.disabled = false;
                } else {
                    executeTradeBtn.disabled = true;
                }
            } else {
                executeTradeBtn.disabled = true;
            }
        }

        // Handle amount input changes
        if (amountInput && price > 0 && quantityInput) {
            // If amount input is the active element, update quantity based on amount
            if (amountInput === document.activeElement) {
                const amount = parseFloat(amountInput.value) || 0;
                const calculatedQuantity = amount / price;
                // Set the quantity without triggering the input event
                if (!quantityInput._updating) {
                    quantityInput._updating = true;
                    quantityInput.value = calculatedQuantity.toFixed(6);
                    quantityInput._updating = false;
                }
            }
        }

        // Handle quantity input changes
        if (quantityInput && price > 0 && amountInput) {
            // If quantity input is the active element, update amount based on quantity
            if (quantityInput === document.activeElement) {
                const calculatedAmount = quantity * price;
                // Set the amount without triggering the input event
                if (!amountInput._updating) {
                    amountInput._updating = true;
                    amountInput.value = calculatedAmount.toFixed(2);
                    amountInput._updating = false;
                }
            }
        }

        console.log('Trade summary updated successfully');
    } catch (error) {
        console.error('Error updating trade summary:', error);
    }
}

// Generate trade history rows for the trade history modal
function generateTradeHistoryRows() {
    if (!playerState.tradeHistory || playerState.tradeHistory.length === 0) {
        return '<tr><td colspan="6" class="text-center">No trades yet</td></tr>';
    }

    // Sort trade history by round (descending) and then by timestamp (descending)
    const sortedHistory = [...playerState.tradeHistory].sort((a, b) => {
        if (b.round !== a.round) {
            return b.round - a.round;
        }
        return new Date(b.timestamp) - new Date(a.timestamp);
    });

    let rows = '';
    for (const trade of sortedHistory) {
        const actionClass = trade.action === 'buy' ? 'text-success' : 'text-danger';
        const actionIcon = trade.action === 'buy' ?
            '<i class="fas fa-arrow-down text-success"></i>' :
            '<i class="fas fa-arrow-up text-danger"></i>';

        rows += `
            <tr>
                <td>${trade.round}</td>
                <td>${trade.asset}</td>
                <td class="${actionClass}">${actionIcon} ${trade.action.toUpperCase()}</td>
                <td>${trade.quantity.toFixed(6)}</td>
                <td>$${trade.price.toFixed(2)}</td>
                <td>$${(trade.action === 'buy' ? trade.cost : trade.value).toFixed(2)}</td>
            </tr>
        `;
    }

    return rows;
}

// Function removed - we now use updateUI() for all UI updates

// Update asset price in trade form
function updateAssetPrice() {
    const assetSelect = document.getElementById('trade-asset-select');
    const currentPriceDisplay = document.getElementById('current-price-display');

    if (!assetSelect || !currentPriceDisplay) {
        console.error('Asset select or price display not found');
        return;
    }

    const asset = assetSelect.value;
    if (!asset) {
        console.log('No asset selected');
        return;
    }

    // Handle different property names for asset prices
    const price = gameState.assetPrices?.[asset] || gameState.asset_prices?.[asset] || 0;
    console.log(`Updating price for ${asset}: $${price.toFixed(2)}`);

    currentPriceDisplay.textContent = price.toFixed(2);

    // Update trade summary
    updateTradeSummary();
}
