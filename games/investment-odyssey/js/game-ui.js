// Game UI JavaScript for Investment Odyssey Class Game

// Game state
let gameState = {
    roundNumber: 0,
    CPI: 100,
    assetPrices: {},
    assetPriceHistory: {},
    CPIHistory: {},
    assetReturnHistory: {}
};

// Player state
let playerState = {
    cash: 0,
    portfolio: {
        assets: {}
    },
    tradeHistory: [],
    portfolioValueHistory: {}
};

// Charts
let portfolioChart = null;
let portfolioAllocationChart = null;
let miniCharts = {}; // For mini price charts in the market data table

// For animation control
let priceUpdateAnimationInProgress = false;

// Document ready
document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    await checkAuthentication();

    // Initialize tooltips
    $('[data-toggle="tooltip"]').tooltip();

    // Set up event listeners
    setupEventListeners();

    // Start polling for updates
    startPolling();
});

// Check authentication
async function checkAuthentication() {
    const authCheck = document.getElementById('auth-check');
    const gameContent = document.getElementById('game-content');

    if (!EconGames.SimpleAuth.isLoggedIn()) {
        // Not logged in, show error and redirect
        authCheck.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle mr-2"></i> You must be logged in to play the class game.
                    <div class="mt-3">
                        <a href="index.html" class="btn btn-primary">Go to Login Page</a>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    const session = EconGames.SimpleAuth.getSession();

    if (!session.gameSession) {
        // No game session, show error and redirect
        authCheck.innerHTML = `
            <div class="col-12">
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-circle mr-2"></i> You haven't joined a game session yet.
                    <div class="mt-3">
                        <a href="index.html" class="btn btn-primary">Join a Session</a>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    // Get session data
    const sessionResult = await ClassGameService.getCurrentSession();

    if (!sessionResult.success) {
        // Error getting session data
        authCheck.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle mr-2"></i> Error loading session data: ${sessionResult.error}
                    <div class="mt-3">
                        <a href="index.html" class="btn btn-primary">Go Back</a>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    // Get participant data
    const participantResult = await ClassGameService.getParticipantData();

    if (!participantResult.success) {
        // Error getting participant data
        authCheck.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle mr-2"></i> Error loading participant data: ${participantResult.error}
                    <div class="mt-3">
                        <a href="index.html" class="btn btn-primary">Go Back</a>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    // Authentication successful, hide auth check and show game content
    authCheck.style.display = 'none';
    gameContent.classList.remove('d-none');

    // Update game state
    updateGameState(sessionResult.data);

    // Update player state
    updatePlayerState(participantResult.data);

    // Update UI
    updateUI();
}

// Update game state
function updateGameState(sessionData) {
    gameState.roundNumber = sessionData.roundNumber || 0;
    gameState.assetPrices = sessionData.assetPrices || {};
    gameState.assetPriceHistory = sessionData.priceHistory || {};

    // Update session display
    document.getElementById('session-name').textContent = sessionData.name || 'Session ' + sessionData.id;
    document.getElementById('session-display').textContent = sessionData.name || 'Session ' + sessionData.id;
    document.getElementById('current-round-display').textContent = gameState.roundNumber;
}

// Update player state
function updatePlayerState(participantData) {
    playerState.cash = participantData.cash || 0;
    playerState.portfolio.assets = participantData.portfolio || {};
    playerState.tradeHistory = participantData.tradeHistory || [];

    // Update user display
    const session = EconGames.SimpleAuth.getSession();
    document.getElementById('user-display').textContent = session.name;
    document.getElementById('cash-display').textContent = playerState.cash.toFixed(2);

    // Calculate and update portfolio value
    const portfolioValue = calculatePortfolioValue();
    document.getElementById('portfolio-value-display').textContent = portfolioValue.toFixed(2);
}

// Calculate portfolio value
function calculatePortfolioValue() {
    let value = 0;

    for (const [asset, quantity] of Object.entries(playerState.portfolio.assets)) {
        if (gameState.assetPrices[asset]) {
            value += gameState.assetPrices[asset] * quantity;
        }
    }

    return value;
}

// Set up event listeners
function setupEventListeners() {
    // Trade form
    document.getElementById('trade-form').addEventListener('submit', handleTrade);

    // Asset select change
    document.getElementById('asset-select').addEventListener('change', updateAssetPrice);

    // Quantity input change
    document.getElementById('quantity-input').addEventListener('input', updateTotalCost);

    // Action select change
    document.getElementById('action-select').addEventListener('change', updateAssetPrice);

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
        // Get session data
        const sessionResult = await ClassGameService.getCurrentSession();

        if (sessionResult.success) {
            // Check if round number has changed
            const newRoundNumber = sessionResult.data.roundNumber || 0;

            if (newRoundNumber > gameState.roundNumber) {
                // New round, show cash injection alert
                const cashInjection = sessionResult.data.lastCashInjection || 0;

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
            updateGameState(sessionResult.data);
        }

        // Get participant data
        const participantResult = await ClassGameService.getParticipantData();

        if (participantResult.success) {
            // Update player state
            updatePlayerState(participantResult.data);
        }

        // Update UI
        updateUI();

        // Update leaderboard
        updateLeaderboard();
    }, 5000);
}

// Update UI
function updateUI() {
    // Update asset prices table
    updateAssetPricesTable();

    // Update portfolio table
    updatePortfolioTable();

    // Update price ticker
    updatePriceTicker();

    // Update charts
    updatePortfolioChart();
    updatePortfolioAllocationChart();

    // Update asset price in trade form
    updateAssetPrice();
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
        showStatusMessage('Please fill in all fields with valid values.', 'warning');
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

        if (action === 'buy') {
            result = await ClassGameService.executeBuy(asset, quantity);
        } else {
            result = await ClassGameService.executeSell(asset, quantity);
        }

        if (result.success) {
            // Show success message
            showStatusMessage(`Successfully ${action === 'buy' ? 'bought' : 'sold'} ${quantity} of ${asset}.`, 'success');

            // Clear form
            assetSelect.selectedIndex = 0;
            quantityInput.value = '';
            document.getElementById('current-price-display').textContent = '0.00';
            document.getElementById('total-cost-display').textContent = '0.00';

            // Update UI
            const participantResult = await ClassGameService.getParticipantData();
            if (participantResult.success) {
                updatePlayerState(participantResult.data);
                updateUI();
            }
        } else {
            showStatusMessage(`Error: ${result.error}`, 'danger');
        }
    } catch (error) {
        console.error('Error executing trade:', error);
        showStatusMessage('An error occurred while executing the trade. Please try again.', 'danger');
    } finally {
        // Re-enable form
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = action === 'buy' ? 'Buy Asset' : 'Sell Asset';
        }
    }
}

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

    // Update button text based on action
    const submitButton = document.querySelector('#trade-form button[type="submit"]');
    if (submitButton) {
        submitButton.textContent = action === 'buy' ? 'Buy Asset' : 'Sell Asset';
    }
}

// Set maximum quantity based on available cash or assets
function setMaxQuantity() {
    const assetSelect = document.getElementById('asset-select');
    const actionSelect = document.getElementById('action-select');
    const quantityInput = document.getElementById('quantity-input');

    const asset = assetSelect.value;
    const action = actionSelect.value;

    if (!asset) {
        showStatusMessage('Please select an asset first.', 'warning');
        return;
    }

    const price = gameState.assetPrices[asset] || 0;

    if (price <= 0) {
        showStatusMessage('Invalid asset price.', 'warning');
        return;
    }

    let maxQuantity = 0;

    if (action === 'buy') {
        // Max quantity based on available cash
        maxQuantity = playerState.cash / price;
    } else {
        // Max quantity based on owned assets
        maxQuantity = playerState.portfolio.assets[asset] || 0;
    }

    // Round to 2 decimal places
    maxQuantity = Math.floor(maxQuantity * 100) / 100;

    // Update quantity input
    quantityInput.value = maxQuantity;

    // Update total cost
    updateTotalCost();
}

// Distribute cash evenly across all assets
async function distributeCashEvenly() {
    if (playerState.cash <= 0) {
        showStatusMessage('No cash available to distribute.', 'warning');
        return;
    }

    const assetNames = Object.keys(gameState.assetPrices);
    if (assetNames.length === 0) {
        showStatusMessage('No assets available for purchase.', 'warning');
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
        // Execute trades for each asset
        for (const asset of assetNames) {
            const price = gameState.assetPrices[asset];
            if (!price || price <= 0) continue;

            // Calculate quantity (rounded to 2 decimal places)
            const quantity = Math.floor((amountPerAsset / price) * 100) / 100;

            if (quantity > 0) {
                // Buy the asset
                await ClassGameService.executeBuy(asset, quantity);
            }
        }

        // Update UI
        const participantResult = await ClassGameService.getParticipantData();
        if (participantResult.success) {
            updatePlayerState(participantResult.data);
            updateUI();
        }

        // Show success message
        showStatusMessage('Cash has been distributed evenly across all assets.', 'success');
    } catch (error) {
        console.error('Error distributing cash:', error);
        showStatusMessage('An error occurred while distributing cash. Please try again.', 'danger');
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
    const assets = playerState.portfolio.assets;

    // Check if there are any assets to sell
    if (Object.keys(assets).length === 0) {
        showStatusMessage('No assets to sell.', 'warning');
        return;
    }

    // Disable the button during processing
    const sellAllBtn = document.getElementById('sell-all');
    if (sellAllBtn) {
        sellAllBtn.disabled = true;
        sellAllBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Processing...';
    }

    try {
        // Execute trades for each asset
        for (const [asset, quantity] of Object.entries(assets)) {
            if (quantity > 0) {
                await ClassGameService.executeSell(asset, quantity);
            }
        }

        // Update UI
        const participantResult = await ClassGameService.getParticipantData();
        if (participantResult.success) {
            updatePlayerState(participantResult.data);
            updateUI();
        }

        // Show success message
        showStatusMessage('All assets have been sold.', 'success');
    } catch (error) {
        console.error('Error selling assets:', error);
        showStatusMessage('An error occurred while selling assets. Please try again.', 'danger');
    } finally {
        // Re-enable the button
        if (sellAllBtn) {
            sellAllBtn.disabled = false;
            sellAllBtn.textContent = 'Sell All Assets';
        }
    }
}

// Update asset prices table
function updateAssetPricesTable() {
    const tableBody = document.getElementById('asset-prices-table-body');
    if (!tableBody) return;

    // Clear existing rows
    tableBody.innerHTML = '';

    // Add rows for each asset
    for (const [asset, price] of Object.entries(gameState.assetPrices)) {
        const row = document.createElement('tr');

        // Get previous price
        let previousPrice = price;
        if (gameState.assetPriceHistory && gameState.assetPriceHistory[asset] && gameState.assetPriceHistory[asset].length > 0) {
            previousPrice = gameState.assetPriceHistory[asset][gameState.assetPriceHistory[asset].length - 1];
        }

        // Calculate change
        const change = price - previousPrice;
        const percentChange = (change / previousPrice) * 100;

        // Create change class
        let changeClass = 'text-secondary';
        let changeIcon = '';

        if (change > 0) {
            changeClass = 'text-success';
            changeIcon = '<i class="fas fa-arrow-up mr-1"></i>';
        } else if (change < 0) {
            changeClass = 'text-danger';
            changeIcon = '<i class="fas fa-arrow-down mr-1"></i>';
        }

        // Create mini chart canvas
        const chartId = `mini-chart-${asset.replace(/[^a-zA-Z0-9]/g, '-')}`;

        row.innerHTML = `
            <td>${asset}</td>
            <td>$${price.toFixed(2)}</td>
            <td class="${changeClass}">${changeIcon}${change.toFixed(2)} (${percentChange.toFixed(2)}%)</td>
            <td><canvas id="${chartId}" width="100" height="30"></canvas></td>
        `;

        tableBody.appendChild(row);

        // Create mini chart
        createMiniChart(chartId, asset);
    }
}

// Create mini price chart
function createMiniChart(chartId, asset) {
    const ctx = document.getElementById(chartId);
    if (!ctx) return;

    // Get price history
    const priceHistory = gameState.assetPriceHistory[asset] || [];

    // If we already have a chart, destroy it
    if (miniCharts[chartId]) {
        miniCharts[chartId].destroy();
    }

    // Create new chart
    miniCharts[chartId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({ length: priceHistory.length }, (_, i) => i),
            datasets: [{
                label: asset,
                data: priceHistory,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                fill: false,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            legend: {
                display: false
            },
            scales: {
                xAxes: [{
                    display: false
                }],
                yAxes: [{
                    display: false
                }]
            },
            tooltips: {
                enabled: false
            },
            elements: {
                line: {
                    tension: 0.4
                }
            }
        }
    });
}

// Update portfolio table
function updatePortfolioTable() {
    const tableBody = document.getElementById('portfolio-table-body');
    if (!tableBody) return;

    // Clear existing rows
    tableBody.innerHTML = '';

    // Calculate total portfolio value
    const portfolioValue = calculatePortfolioValue();

    // Add rows for each asset in portfolio
    for (const [asset, quantity] of Object.entries(playerState.portfolio.assets)) {
        if (quantity <= 0) continue;

        const row = document.createElement('tr');

        const price = gameState.assetPrices[asset] || 0;
        const value = price * quantity;
        const percentage = portfolioValue > 0 ? (value / portfolioValue) * 100 : 0;

        row.innerHTML = `
            <td>${asset}</td>
            <td>${quantity.toFixed(2)}</td>
            <td>$${price.toFixed(2)}</td>
            <td>$${value.toFixed(2)}</td>
            <td>${percentage.toFixed(2)}%</td>
        `;

        tableBody.appendChild(row);
    }

    // Add cash row
    const cashRow = document.createElement('tr');
    const cashPercentage = portfolioValue > 0 ? (playerState.cash / (portfolioValue + playerState.cash)) * 100 : 100;

    cashRow.innerHTML = `
        <td>Cash</td>
        <td>-</td>
        <td>-</td>
        <td>$${playerState.cash.toFixed(2)}</td>
        <td>${cashPercentage.toFixed(2)}%</td>
    `;

    tableBody.appendChild(cashRow);
}

// Update price ticker
function updatePriceTicker() {
    const tickerContainer = document.getElementById('price-ticker');
    if (!tickerContainer) return;

    // Clear existing ticker items
    tickerContainer.innerHTML = '';

    // Add ticker items for each asset
    for (const [asset, price] of Object.entries(gameState.assetPrices)) {
        // Get previous price
        let previousPrice = price;
        if (gameState.assetPriceHistory && gameState.assetPriceHistory[asset] && gameState.assetPriceHistory[asset].length > 0) {
            previousPrice = gameState.assetPriceHistory[asset][gameState.assetPriceHistory[asset].length - 1];
        }

        // Calculate change
        const change = price - previousPrice;
        const percentChange = (change / previousPrice) * 100;

        // Create change class
        let changeClass = 'neutral';
        let changeIcon = '';

        if (change > 0) {
            changeClass = 'up';
            changeIcon = '▲';
        } else if (change < 0) {
            changeClass = 'down';
            changeIcon = '▼';
        }

        // Create ticker item
        const tickerItem = document.createElement('div');
        tickerItem.className = `ticker-item ${changeClass}`;
        tickerItem.innerHTML = `
            <span class="ticker-asset">${asset}</span>
            <span class="ticker-price">$${price.toFixed(2)}</span>
            <span class="ticker-change">${changeIcon} ${percentChange.toFixed(2)}%</span>
        `;

        tickerContainer.appendChild(tickerItem);
    }
}

// Update portfolio chart
function updatePortfolioChart() {
    const ctx = document.getElementById('portfolio-chart');
    if (!ctx) return;

    // Calculate portfolio value history
    const portfolioValueHistory = [];
    const rounds = [];

    // Current portfolio value
    const currentPortfolioValue = calculatePortfolioValue() + playerState.cash;

    // Add current value to history
    portfolioValueHistory.push(currentPortfolioValue);
    rounds.push(gameState.roundNumber);

    // If we already have a chart, destroy it
    if (portfolioChart) {
        portfolioChart.destroy();
    }

    // Create new chart
    portfolioChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rounds,
            datasets: [{
                label: 'Portfolio Value',
                data: portfolioValueHistory,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                xAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Round'
                    }
                }],
                yAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Value ($)'
                    },
                    ticks: {
                        beginAtZero: true,
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }]
            },
            tooltips: {
                callbacks: {
                    label: function(tooltipItem, data) {
                        return 'Value: $' + tooltipItem.yLabel.toFixed(2);
                    }
                }
            }
        }
    });
}

// Update portfolio allocation chart
function updatePortfolioAllocationChart() {
    const ctx = document.getElementById('portfolio-allocation-chart');
    if (!ctx) return;

    // Calculate portfolio allocation
    const labels = [];
    const data = [];
    const colors = [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(255, 159, 64, 0.8)',
        'rgba(100, 100, 100, 0.8)'
    ];

    // Add assets to chart data
    let colorIndex = 0;
    for (const [asset, quantity] of Object.entries(playerState.portfolio.assets)) {
        if (quantity <= 0) continue;

        const price = gameState.assetPrices[asset] || 0;
        const value = price * quantity;

        labels.push(asset);
        data.push(value);
        colorIndex = (colorIndex + 1) % colors.length;
    }

    // Add cash to chart data
    labels.push('Cash');
    data.push(playerState.cash);

    // If we already have a chart, destroy it
    if (portfolioAllocationChart) {
        portfolioAllocationChart.destroy();
    }

    // Create new chart
    portfolioAllocationChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            legend: {
                position: 'right',
                labels: {
                    boxWidth: 12
                }
            },
            tooltips: {
                callbacks: {
                    label: function(tooltipItem, data) {
                        const value = data.datasets[0].data[tooltipItem.index];
                        const label = data.labels[tooltipItem.index];
                        return label + ': $' + value.toFixed(2);
                    }
                }
            }
        }
    });
}

// Update leaderboard
async function updateLeaderboard() {
    try {
        const result = await ClassGameService.getLeaderboard();

        if (!result.success) {
            console.error('Error getting leaderboard:', result.error);
            return;
        }

        const leaderboard = result.data;
        const tableBody = document.getElementById('leaderboard-body');

        if (!tableBody) return;

        // Clear existing rows
        tableBody.innerHTML = '';

        // Add rows for each player
        leaderboard.forEach((entry, index) => {
            const row = document.createElement('tr');

            // Add class for current user
            if (EconGames.SimpleAuth.isLoggedIn() && entry.userId === EconGames.SimpleAuth.getSession().userId) {
                row.className = 'table-primary';

                // Update player rank
                document.getElementById('player-rank').textContent = (index + 1);
            }

            // Add class for top 3
            if (index === 0) {
                row.className = 'table-warning';
            } else if (index === 1) {
                row.className = 'table-light';
            } else if (index === 2) {
                row.className = 'table-secondary';
            }

            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${entry.name}</td>
                <td>$${entry.totalValue.toFixed(2)}</td>
                <td>${entry.returnPercentage.toFixed(2)}%</td>
            `;

            tableBody.appendChild(row);
        });

        // Update players count
        document.getElementById('players-count').textContent = leaderboard.length;
    } catch (error) {
        console.error('Error updating leaderboard:', error);
    }
}

// Show status message
function showStatusMessage(message, type = 'info') {
    // Create alert container if it doesn't exist
    let statusContainer = document.getElementById('status-messages');

    if (!statusContainer) {
        statusContainer = document.createElement('div');
        statusContainer.id = 'status-messages';
        statusContainer.className = 'status-messages';
        statusContainer.style.position = 'fixed';
        statusContainer.style.top = '20px';
        statusContainer.style.right = '20px';
        statusContainer.style.zIndex = '1050';
        statusContainer.style.maxWidth = '300px';
        document.body.appendChild(statusContainer);
    }

    // Create alert element
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type} alert-dismissible fade show`;
    alertElement.innerHTML = `
        ${message}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    `;

    // Add the alert to the container
    statusContainer.appendChild(alertElement);

    // Remove the alert after 5 seconds
    setTimeout(() => {
        alertElement.classList.remove('show');
        setTimeout(() => {
            alertElement.remove();
        }, 300);
    }, 5000);
}
