// Class Game Trading Functions for Investment Odyssey

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
async function handleTrade(event) {
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
    
    // Disable form during processing
    const submitButton = document.querySelector('#trade-form button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Processing...';
    }
    
    try {
        let result;
        const session = EconGames.Auth.getSession();
        
        if (action === 'buy') {
            result = await EconGames.Game.executeBuy(sessionInfo.id, session.userId, asset, quantity);
        } else {
            result = await EconGames.Game.executeSell(sessionInfo.id, session.userId, asset, quantity);
        }
        
        if (result.success) {
            // Update player state
            const participantResult = await EconGames.Game.getParticipant(sessionInfo.id, session.userId);
            if (participantResult.success) {
                playerState.cash = participantResult.data.cash || 0;
                playerState.portfolio = participantData.portfolio || {};
                playerState.tradeHistory = participantData.tradeHistory || [];
                
                // Update header
                document.getElementById('header-cash').textContent = playerState.cash.toFixed(2);
            }
            
            // Clear form
            assetSelect.selectedIndex = 0;
            quantityInput.value = '';
            document.getElementById('current-price-display').textContent = '0.00';
            document.getElementById('total-cost-display').textContent = '0.00';
            
            // Update UI
            updateUI();
            
            // Update leaderboard
            updateLeaderboard();
        } else {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error executing trade:', error);
        alert('An error occurred while executing the trade. Please try again.');
    } finally {
        // Re-enable form
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Execute Trade';
        }
    }
}

// Distribute cash evenly across all assets
async function distributeCashEvenly() {
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
    
    // Disable the button during processing
    const distributeCashBtn = document.getElementById('distribute-cash');
    if (distributeCashBtn) {
        distributeCashBtn.disabled = true;
        distributeCashBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Processing...';
    }
    
    try {
        const session = EconGames.Auth.getSession();
        
        // Execute trades for each asset
        for (const asset of assetNames) {
            const price = gameState.assetPrices[asset];
            if (!price || price <= 0) continue;
            
            // Calculate quantity (rounded to 2 decimal places)
            const quantity = Math.floor((amountPerAsset / price) * 100) / 100;
            
            if (quantity > 0) {
                // Buy the asset
                await EconGames.Game.executeBuy(sessionInfo.id, session.userId, asset, quantity);
            }
        }
        
        // Update player state
        const participantResult = await EconGames.Game.getParticipant(sessionInfo.id, session.userId);
        if (participantResult.success) {
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
        console.error('Error distributing cash:', error);
        alert('An error occurred while distributing cash. Please try again.');
    } finally {
        // Re-enable the button
        if (distributeCashBtn) {
            distributeCashBtn.disabled = false;
            distributeCashBtn.textContent = 'Distribute Cash Evenly';
        }
    }
}

// Sell all assets
async function sellAllAssets() {
    const assets = playerState.portfolio;
    
    // Check if there are any assets to sell
    if (Object.keys(assets).length === 0) {
        alert('No assets to sell.');
        return;
    }
    
    // Disable the button during processing
    const sellAllBtn = document.getElementById('sell-all');
    if (sellAllBtn) {
        sellAllBtn.disabled = true;
        sellAllBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Processing...';
    }
    
    try {
        const session = EconGames.Auth.getSession();
        
        // Execute trades for each asset
        for (const [asset, quantity] of Object.entries(assets)) {
            if (quantity > 0) {
                await EconGames.Game.executeSell(sessionInfo.id, session.userId, asset, quantity);
            }
        }
        
        // Update player state
        const participantResult = await EconGames.Game.getParticipant(sessionInfo.id, session.userId);
        if (participantResult.success) {
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
        console.error('Error selling assets:', error);
        alert('An error occurred while selling assets. Please try again.');
    } finally {
        // Re-enable the button
        if (sellAllBtn) {
            sellAllBtn.disabled = false;
            sellAllBtn.textContent = 'Sell All Assets';
        }
    }
}
