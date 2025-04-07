// Single Player Trading Functions for Investment Odyssey

// Update asset price in trade form
function updateAssetPrice() {
    const assetSelect = document.getElementById('asset-select');
    const asset = assetSelect.value;
    
    if (!asset) {
        document.getElementById('current-price-display').textContent = '0.00';
        return;
    }
    
    const price = gameState.assetPrices[asset];
    document.getElementById('current-price-display').textContent = price ? price.toFixed(2) : '0.00';
    
    // Update total cost
    updateTotalCost();
}

// Update total cost in trade form
function updateTotalCost() {
    const assetSelect = document.getElementById('asset-select');
    const quantityInput = document.getElementById('quantity-input');
    const actionSelect = document.getElementById('action-select');
    
    const asset = assetSelect.value;
    const quantity = parseFloat(quantityInput.value) || 0;
    const action = actionSelect.value;
    
    if (!asset) {
        document.getElementById('total-cost-display').textContent = '0.00';
        return;
    }
    
    const price = gameState.assetPrices[asset] || 0;
    const totalCost = price * quantity;
    
    document.getElementById('total-cost-display').textContent = totalCost.toFixed(2);
}

// Set maximum quantity based on available cash or assets
function setMaxQuantity() {
    const assetSelect = document.getElementById('asset-select');
    const actionSelect = document.getElementById('action-select');
    const quantityInput = document.getElementById('quantity-input');
    
    const asset = assetSelect.value;
    const action = actionSelect.value;
    
    if (!asset) {
        alert('Please select an asset first.');
        return;
    }
    
    const price = gameState.assetPrices[asset] || 0;
    
    if (price <= 0) {
        alert('Invalid asset price.');
        return;
    }
    
    let maxQuantity = 0;
    
    if (action === 'buy') {
        // Max quantity based on available cash
        maxQuantity = playerState.cash / price;
    } else {
        // Max quantity based on owned assets
        maxQuantity = playerState.portfolio[asset] || 0;
    }
    
    // Round to 2 decimal places
    maxQuantity = Math.floor(maxQuantity * 100) / 100;
    
    // Update quantity input
    quantityInput.value = maxQuantity;
    
    // Update total cost
    updateTotalCost();
}

// Handle trade
function handleTrade(event) {
    event.preventDefault();
    
    const assetSelect = document.getElementById('asset-select');
    const actionSelect = document.getElementById('action-select');
    const quantityInput = document.getElementById('quantity-input');
    
    const asset = assetSelect.value;
    const action = actionSelect.value;
    const quantity = parseFloat(quantityInput.value);
    
    if (!asset || !action || isNaN(quantity) || quantity <= 0) {
        alert('Please fill in all fields with valid values.');
        return;
    }
    
    const price = gameState.assetPrices[asset] || 0;
    
    if (price <= 0) {
        alert('Invalid asset price.');
        return;
    }
    
    if (action === 'buy') {
        // Check if player has enough cash
        const cost = price * quantity;
        
        if (playerState.cash < cost) {
            alert('Not enough cash to complete this purchase.');
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
            alert('Not enough of this asset to sell.');
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
    
    // Update header
    document.getElementById('header-cash').textContent = playerState.cash.toFixed(2);
    
    // Clear form
    assetSelect.selectedIndex = 0;
    quantityInput.value = '';
    document.getElementById('current-price-display').textContent = '0.00';
    document.getElementById('total-cost-display').textContent = '0.00';
    
    // Update UI
    updateUI();
    
    // Save game state
    saveGameState();
}

// Distribute cash evenly across all assets
function distributeCashEvenly() {
    if (playerState.cash <= 0) {
        alert('No cash available to distribute.');
        return;
    }
    
    const assetNames = Object.keys(gameState.assetPrices);
    if (assetNames.length === 0) {
        alert('No assets available for purchase.');
        return;
    }
    
    // Calculate amount per asset
    const amountPerAsset = playerState.cash / assetNames.length;
    
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
        }
    }
    
    // Update header
    document.getElementById('header-cash').textContent = playerState.cash.toFixed(2);
    
    // Update UI
    updateUI();
    
    // Save game state
    saveGameState();
}

// Sell all assets
function sellAllAssets() {
    const assets = { ...playerState.portfolio };
    
    // Check if there are any assets to sell
    if (Object.keys(assets).length === 0) {
        alert('No assets to sell.');
        return;
    }
    
    // Sell assets
    for (const [asset, quantity] of Object.entries(assets)) {
        if (quantity <= 0) continue;
        
        const price = gameState.assetPrices[asset] || 0;
        
        if (price <= 0) continue;
        
        // Calculate value
        const value = price * quantity;
        
        // Update player state
        playerState.cash += value;
        delete playerState.portfolio[asset];
        
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
    
    // Update header
    document.getElementById('header-cash').textContent = playerState.cash.toFixed(2);
    
    // Update UI
    updateUI();
    
    // Save game state
    saveGameState();
}
