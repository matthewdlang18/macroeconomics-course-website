// Simple Game JavaScript for Investment Odyssey

// Game state
let gameState = {
    roundNumber: 0,
    assetPrices: {},
    priceHistory: {},
    lastCashInjection: 0
};

// Player state
let playerState = {
    cash: 10000,
    portfolio: {},
    tradeHistory: [],
    portfolioValueHistory: []
};

// Session info
let sessionInfo = {
    id: null,
    name: null,
    joinCode: null
};

// Charts
let portfolioChart = null;
let portfolioAllocationChart = null;
let miniCharts = {};

// Document ready
document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    await checkAuthentication();

    // Set up event listeners
    setupEventListeners();

    // Start polling for updates
    startPolling();
});

// Check authentication
async function checkAuthentication() {
    const authCheck = document.getElementById('auth-check');
    const gameContent = document.getElementById('game-content');

    try {
        // Check if user is logged in
        if (!SimpleAuth.isLoggedIn()) {
            // Not logged in, show error and redirect
            authCheck.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle mr-2"></i> You must be logged in to play the game.
                        <div class="mt-3">
                            <a href="../simple-login.html" class="btn btn-primary">Go to Login Page</a>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        // Get user session
        const session = SimpleAuth.getSession();

        // Update user name in header
        document.getElementById('user-name').textContent = session.name || 'Player';

        // Check if user has joined a game session
        if (session.gameSession) {
            // Get session data
            sessionInfo.id = session.gameSession.id;
            sessionInfo.name = session.gameSession.name;
            sessionInfo.joinCode = session.gameSession.joinCode;

            // Get session data from Firestore
            const sessionResult = await GameService.getSession(sessionInfo.id);

            if (!sessionResult.success) {
                throw new Error(sessionResult.error);
            }

            // Update game state
            gameState.roundNumber = sessionResult.data.roundNumber || 0;
            gameState.assetPrices = sessionResult.data.assetPrices || {};
            gameState.priceHistory = sessionResult.data.priceHistory || {};
            gameState.lastCashInjection = sessionResult.data.lastCashInjection || 0;

            // Get participant data
            const participantResult = await GameService.getParticipant(sessionInfo.id, session.userId);

            if (participantResult.success) {
                // Update player state
                playerState.cash = participantResult.data.cash || 10000;
                playerState.portfolio = participantResult.data.portfolio || {};
                playerState.tradeHistory = participantResult.data.tradeHistory || [];
            } else {
                // Create participant
                const db = firebase.firestore();
                await db.collection('participants').add({
                    userId: session.userId,
                    sessionId: sessionInfo.id,
                    name: session.name || 'Anonymous',
                    cash: 10000,
                    portfolio: {},
                    tradeHistory: [],
                    joinedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Set default player state
                playerState.cash = 10000;
                playerState.portfolio = {};
                playerState.tradeHistory = [];
            }
        } else {
            // No session joined, show error and redirect
            authCheck.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-circle mr-2"></i> You haven't joined a game session yet.
                        <div class="mt-3">
                            <a href="../simple-login.html" class="btn btn-primary">Join a Session</a>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        // Update header
        document.getElementById('header-round').textContent = gameState.roundNumber;
        document.getElementById('header-cash').textContent = playerState.cash.toFixed(2);

        // Hide auth check and show game content
        authCheck.style.display = 'none';
        gameContent.classList.remove('d-none');

        // Update UI
        updateUI();
    } catch (error) {
        console.error('Error checking authentication:', error);

        // Show error
        authCheck.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle mr-2"></i> Error: ${error.message}
                    <div class="mt-3">
                        <a href="../simple-login.html" class="btn btn-primary">Go to Login Page</a>
                    </div>
                </div>
            </div>
        `;
    }
}

// Set up event listeners
function setupEventListeners() {
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', function() {
        SimpleAuth.logout();
        window.location.href = '../simple-login.html';
    });

    // Trade form
    document.getElementById('trade-form').addEventListener('submit', handleTrade);

    // Asset select change
    document.getElementById('asset-select').addEventListener('change', updateAssetPrice);

    // Quantity input change
    document.getElementById('quantity-input').addEventListener('input', updateTotalCost);

    // Action select change
    document.getElementById('action-select').addEventListener('change', updateTotalCost);

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
        if (!sessionInfo.id) return;

        try {
            // Get session data
            const sessionResult = await GameService.getSession(sessionInfo.id);

            if (!sessionResult.success) {
                throw new Error(sessionResult.error);
            }

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
            gameState.roundNumber = newRoundNumber;
            gameState.assetPrices = sessionResult.data.assetPrices || {};
            gameState.priceHistory = sessionResult.data.priceHistory || {};
            gameState.lastCashInjection = sessionResult.data.lastCashInjection || 0;

            // Update header
            document.getElementById('header-round').textContent = gameState.roundNumber;

            // Get participant data
            const session = SimpleAuth.getSession();
            const participantResult = await GameService.getParticipant(sessionInfo.id, session.userId);

            if (participantResult.success) {
                // Update player state
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
            console.error('Error polling for updates:', error);
        }
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

// Update asset prices table
function updateAssetPricesTable() {
    const tableBody = document.getElementById('asset-prices-table');
    if (!tableBody) return;

    // Clear existing rows
    tableBody.innerHTML = '';

    // Add rows for each asset
    for (const [asset, price] of Object.entries(gameState.assetPrices)) {
        const row = document.createElement('tr');

        // Get previous price
        let previousPrice = price;
        if (gameState.priceHistory && gameState.priceHistory[asset] && gameState.priceHistory[asset].length > 0) {
            previousPrice = gameState.priceHistory[asset][gameState.priceHistory[asset].length - 1];
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
    const priceHistory = gameState.priceHistory[asset] || [];

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
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            },
            scales: {
                x: {
                    display: false
                },
                y: {
                    display: false
                }
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
    const tableBody = document.getElementById('portfolio-table');
    if (!tableBody) return;

    // Clear existing rows
    tableBody.innerHTML = '';

    // Calculate total portfolio value
    let portfolioValue = 0;
    for (const [asset, quantity] of Object.entries(playerState.portfolio)) {
        if (gameState.assetPrices[asset]) {
            portfolioValue += gameState.assetPrices[asset] * quantity;
        }
    }

    // Add rows for each asset in portfolio
    for (const [asset, quantity] of Object.entries(playerState.portfolio)) {
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
    const totalValue = portfolioValue + playerState.cash;
    const cashPercentage = totalValue > 0 ? (playerState.cash / totalValue) * 100 : 100;

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
        if (gameState.priceHistory && gameState.priceHistory[asset] && gameState.priceHistory[asset].length > 0) {
            previousPrice = gameState.priceHistory[asset][gameState.priceHistory[asset].length - 1];
        }

        // Calculate change
        const change = price - previousPrice;
        const percentChange = (change / previousPrice) * 100;

        // Create change class
        let changeClass = '';
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
            <span class="ticker-change ${changeClass}">${changeIcon} ${percentChange.toFixed(2)}%</span>
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
    let portfolioValue = 0;
    for (const [asset, quantity] of Object.entries(playerState.portfolio)) {
        if (gameState.assetPrices[asset]) {
            portfolioValue += gameState.assetPrices[asset] * quantity;
        }
    }

    const totalValue = portfolioValue + playerState.cash;

    // Add current value to history
    portfolioValueHistory.push(totalValue);
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
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Round'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Value ($)'
                    },
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Value: $' + context.parsed.y.toFixed(2);
                        }
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
    for (const [asset, quantity] of Object.entries(playerState.portfolio)) {
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
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 12
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const label = context.label;
                            return label + ': $' + value.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

// Update leaderboard
async function updateLeaderboard() {
    if (!sessionInfo.id) return;

    try {
        const result = await GameService.getLeaderboard(sessionInfo.id);

        if (!result.success) {
            throw new Error(result.error);
        }

        const leaderboard = result.data;
        const tableBody = document.getElementById('leaderboard-table');

        if (!tableBody) return;

        // Clear existing rows
        tableBody.innerHTML = '';

        // Add rows for each player
        leaderboard.forEach((entry, index) => {
            const row = document.createElement('tr');

            // Add class for current user
            if (SimpleAuth.isLoggedIn() && entry.userId === SimpleAuth.getSession().userId) {
                row.className = 'table-primary';
            }

            // Add class for top 3
            if (index === 0) {
                row.className = 'gold';
            } else if (index === 1) {
                row.className = 'silver';
            } else if (index === 2) {
                row.className = 'bronze';
            }

            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${entry.name || 'Anonymous'}</td>
                <td>$${entry.totalValue.toFixed(2)}</td>
                <td>${entry.returnPercentage.toFixed(2)}%</td>
            `;

            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error updating leaderboard:', error);
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
        const session = SimpleAuth.getSession();

        if (action === 'buy') {
            result = await GameService.executeBuy(sessionInfo.id, session.userId, asset, quantity);
        } else {
            result = await GameService.executeSell(sessionInfo.id, session.userId, asset, quantity);
        }

        if (result.success) {
            // Show success message
            alert(`Successfully ${action === 'buy' ? 'bought' : 'sold'} ${quantity} of ${asset}.`);

            // Clear form
            assetSelect.selectedIndex = 0;
            quantityInput.value = '';
            document.getElementById('current-price-display').textContent = '0.00';
            document.getElementById('total-cost-display').textContent = '0.00';

            // Update player state
            const participantResult = await GameService.getParticipant(sessionInfo.id, session.userId);
            if (participantResult.success) {
                playerState.cash = participantResult.data.cash || 0;
                playerState.portfolio = participantResult.data.portfolio || {};
                playerState.tradeHistory = participantResult.data.tradeHistory || [];

                // Update header
                document.getElementById('header-cash').textContent = playerState.cash.toFixed(2);
            }

            // Update UI
            updateUI();
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
        const session = SimpleAuth.getSession();

        // Execute trades for each asset
        for (const asset of assetNames) {
            const price = gameState.assetPrices[asset];
            if (!price || price <= 0) continue;

            // Calculate quantity (rounded to 2 decimal places)
            const quantity = Math.floor((amountPerAsset / price) * 100) / 100;

            if (quantity > 0) {
                // Buy the asset
                await GameService.executeBuy(sessionInfo.id, session.userId, asset, quantity);
            }
        }

        // Update player state
        const participantResult = await GameService.getParticipant(sessionInfo.id, session.userId);
        if (participantResult.success) {
            playerState.cash = participantResult.data.cash || 0;
            playerState.portfolio = participantResult.data.portfolio || {};
            playerState.tradeHistory = participantResult.data.tradeHistory || [];

            // Update header
            document.getElementById('header-cash').textContent = playerState.cash.toFixed(2);
        }

        // Update UI
        updateUI();

        // Show success message
        alert('Cash has been distributed evenly across all assets.');
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
        const session = SimpleAuth.getSession();

        // Execute trades for each asset
        for (const [asset, quantity] of Object.entries(assets)) {
            if (quantity > 0) {
                await GameService.executeSell(sessionInfo.id, session.userId, asset, quantity);
            }
        }

        // Update player state
        const participantResult = await GameService.getParticipant(sessionInfo.id, session.userId);
        if (participantResult.success) {
            playerState.cash = participantResult.data.cash || 0;
            playerState.portfolio = participantResult.data.portfolio || {};
            playerState.tradeHistory = participantResult.data.tradeHistory || [];

            // Update header
            document.getElementById('header-cash').textContent = playerState.cash.toFixed(2);
        }

        // Update UI
        updateUI();

        // Show success message
        alert('All assets have been sold.');
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
