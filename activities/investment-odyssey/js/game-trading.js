// Trading Functions for Investment Odyssey

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

    const price = gameState.assetPrices[asset] || 0;

    if (price <= 0) {
        console.log('Invalid asset price');
        return;
    }

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

    // Update UI
    updateUI();

    // Update trade history list
    updateTradeHistoryList();

    // Reset form
    quantityInput.value = '';
    updateTotalCost();

    // Save game state
    saveGameState();
}

// Buy all assets
function buyAllAssets() {
    try {
        // Check if there are assets to buy
        const assetNames = Object.keys(gameState.assetPrices);

        if (assetNames.length === 0) {
            alert('No assets available to buy.');
            return;
        }

        // Check if player has cash
        if (playerState.cash <= 0) {
            alert('No cash available to buy assets.');
            return;
        }

        // Calculate amount per asset
        const amountPerAsset = playerState.cash / assetNames.length;
        let totalSpent = 0;
        let assetsCount = 0;

        // Buy assets
        for (const asset of assetNames) {
            const price = gameState.assetPrices[asset];
            if (!price || price <= 0) continue;

            // Calculate quantity (rounded to 2 decimal places)
            const quantity = Math.floor((amountPerAsset / price) * 100) / 100;

            if (quantity > 0) {
                // Calculate cost
                const cost = price * quantity;

                // Update player state
                playerState.cash -= cost;
                totalSpent += cost;

                if (!playerState.portfolio[asset]) {
                    playerState.portfolio[asset] = 0;
                }

                playerState.portfolio[asset] += quantity;
                assetsCount++;

                // Add to trade history
                playerState.tradeHistory.push({
                    asset: asset,
                    action: 'buy',
                    quantity: quantity,
                    price: price,
                    cost: cost,
                    timestamp: new Date()
                });
            }
        }

        // Update UI
        updateUI();

        // Update trade history list
        updateTradeHistoryList();

        // Save game state
        saveGameState();

        // Show confirmation
        if (assetsCount > 0) {
            alert(`Successfully purchased ${assetsCount} different assets for a total of $${totalSpent.toFixed(2)}.`);
        } else {
            alert('No assets were purchased. Try increasing your cash amount.');
        }
    } catch (error) {
        console.error('Error in buyAllAssets:', error);
        alert('An error occurred while trying to buy assets. Please try again.');
    }
}

// Sell all assets
function sellAllAssets() {
    // Check if there are assets to sell
    const assetNames = Object.keys(playerState.portfolio);

    if (assetNames.length === 0) {
        alert('No assets in portfolio to sell.');
        return;
    }

    // Sell assets
    for (const asset of assetNames) {
        const quantity = playerState.portfolio[asset];
        const price = gameState.assetPrices[asset];

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
            timestamp: new Date()
        });
    }

    // Clear portfolio
    playerState.portfolio = {};

    // Update UI
    updateUI();

    // Update trade history list
    updateTradeHistoryList();

    // Save game state
    saveGameState();
}

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

        const timestamp = new Date(trade.timestamp);
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
