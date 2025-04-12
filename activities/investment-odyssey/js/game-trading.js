// Trading Functions for Investment Odyssey

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
        console.log('Buying all assets evenly...');
        console.log(`Current cash: ${playerState.cash}`);
        console.log(`Current portfolio:`, playerState.portfolio);

        // Check if there are assets to buy
        const assetNames = Object.keys(gameState.assetPrices);

        if (assetNames.length === 0) {
            console.log('No assets available to buy.');
            alert('No assets available to buy.');
            return;
        }

        // Check if player has cash
        if (playerState.cash <= 0) {
            console.log('No cash available to buy assets.');
            alert('No cash available to buy assets.');
            return;
        }

        // Calculate amount per asset
        const amountPerAsset = playerState.cash / assetNames.length;

        if (amountPerAsset <= 0) {
            console.log('Not enough cash to distribute.');
            alert('Not enough cash to distribute.');
            return;
        }

        console.log(`Distributing ${formatCurrency(playerState.cash)} across ${assetNames.length} assets (${formatCurrency(amountPerAsset)} per asset)`);

        // Buy assets
        for (const asset of assetNames) {
            const price = gameState.assetPrices[asset];
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

        // Update UI
        updateUI();

        // Update trade history list
        updateTradeHistoryList();

        // Save game state
        saveGameState();

        console.log('Distributed cash evenly across all assets');
        console.log(`Updated cash: ${playerState.cash}`);
        console.log(`Updated portfolio:`, playerState.portfolio);

        alert('Distributed cash evenly across all assets.');
    } catch (error) {
        console.error('Error in buyAllAssets:', error);
        alert('Error buying all assets. Please try again.');
    }
}

// Buy selected assets evenly
function buySelectedAssets() {
    try {
        console.log('Buying selected assets evenly...');
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
                alert('Please select at least one asset for diversification.');
                return;
            }
        }

        console.log(`Selected assets for diversification: ${selectedAssets.join(', ')}`);

        // Sort assets alphabetically for consistency
        selectedAssets.sort();

        // Check if we have cash first
        if (playerState.cash <= 0) {
            console.log('No cash to distribute.');
            alert('No cash to distribute.');
            return;
        }

        // Calculate cash per asset
        const cashPerAsset = playerState.cash / selectedAssets.length;

        if (cashPerAsset <= 0) {
            console.log('Not enough cash to distribute.');
            alert('Not enough cash to distribute.');
            return;
        }

        console.log(`Distributing ${formatCurrency(playerState.cash)} across ${selectedAssets.length} selected assets (${formatCurrency(cashPerAsset)} per asset)`);

        // Buy each selected asset
        for (const asset of selectedAssets) {
            const price = gameState.assetPrices[asset];
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

        // Update UI
        updateUI();

        // Update trade history list
        updateTradeHistoryList();

        // Save game state
        saveGameState();

        console.log('Distributed cash evenly across selected assets');
        console.log(`Updated cash: ${playerState.cash}`);
        console.log(`Updated portfolio:`, playerState.portfolio);

        alert(`Distributed cash evenly across ${selectedAssets.length} selected assets.`);
    } catch (error) {
        console.error('Error buying selected assets:', error);
        alert('Error buying selected assets. Please try again.');
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
