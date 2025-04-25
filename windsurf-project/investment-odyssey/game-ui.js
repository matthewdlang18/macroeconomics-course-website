// UI Functions for Investment Odyssey

// Update UI - robust version that handles missing elements
window.updateUI = function() {
    try {
        console.log('Updating UI...');

        // Update round displays - try multiple possible IDs
        const currentRoundDisplay = document.getElementById('current-round') ||
                                   document.getElementById('current-round-display');
        if (currentRoundDisplay) {
            currentRoundDisplay.textContent = gameState.roundNumber || 0;
        }

        // Update market round display
        const marketRoundDisplay = document.getElementById('market-round-display');
        if (marketRoundDisplay) {
            marketRoundDisplay.textContent = gameState.roundNumber || 0;
        }

        // Update progress bar
        const progressBar = document.getElementById('round-progress');
        if (progressBar) {
            const progress = ((gameState.roundNumber || 0) / (gameState.maxRounds || 20)) * 100;
            progressBar.style.width = progress + '%';
            progressBar.setAttribute('aria-valuenow', progress);
            progressBar.textContent = Math.round(progress) + '%';
        }

        // Calculate portfolio value
        const portfolioValue = calculatePortfolioValue();
        const totalValue = playerState.cash + portfolioValue;

        // Update player state with the calculated total value
        playerState.total_value = totalValue;

        // Calculate return values
        const initialValue = 10000; // Starting cash
        const totalReturn = totalValue - initialValue;
        const percentReturn = (totalReturn / initialValue) * 100;

        // Log the calculated values for debugging
        console.log('Portfolio Summary Values:', {
            cash: playerState.cash,
            portfolioValue: portfolioValue,
            totalValue: totalValue,
            totalReturn: totalReturn,
            percentReturn: percentReturn,
            portfolio: playerState.portfolio
        });

        // Update simplified portfolio summary
        const cashDisplay = document.getElementById('cash-display');
        if (cashDisplay) {
            cashDisplay.textContent = '$' + playerState.cash.toFixed(2);
            console.log('Updated Cash display to:', playerState.cash.toFixed(2));
        }

        const portfolioValueDisplay = document.getElementById('portfolio-value-display');
        if (portfolioValueDisplay) {
            portfolioValueDisplay.textContent = '$' + portfolioValue.toFixed(2);
            console.log('Updated Invested display to:', portfolioValue.toFixed(2));
        }

        const totalValueDisplay = document.getElementById('total-value-display');
        if (totalValueDisplay) {
            totalValueDisplay.textContent = '$' + totalValue.toFixed(2);
            console.log('Updated Total Value display to:', totalValue.toFixed(2));
        }

        const returnDisplay = document.getElementById('return-display');
        if (returnDisplay) {
            returnDisplay.textContent = '$' + totalReturn.toFixed(2) + ' (' + percentReturn.toFixed(2) + '%)';
            returnDisplay.className = totalReturn >= 0 ? 'mb-0 text-success' : 'mb-0 text-danger';
            console.log('Updated Return display to:', totalReturn.toFixed(2), percentReturn.toFixed(2) + '%');
        }

        const cpiDisplay = document.getElementById('cpi-display');
        if (cpiDisplay) {
            cpiDisplay.textContent = gameState.CPI.toFixed(2);
        }

        // Update market data table - safely
        try {
            updateMarketData();
        } catch (error) {
            console.error('Error updating market data:', error);
        }

        // Update price ticker - safely
        try {
            updatePriceTicker();
        } catch (error) {
            console.error('Error updating price ticker:', error);
        }

        // Update trade summary
        if (typeof window.updateTradeSummary === 'function') {
            try {
                window.updateTradeSummary();
            } catch (error) {
                console.error('Error updating trade summary:', error);
            }
        }

        // Update asset price in trade form
        try {
            updateAssetPrice();
        } catch (error) {
            console.error('Error updating asset price:', error);
        }

        // Update charts - safely
        try {
            updatePortfolioChart();
        } catch (error) {
            console.error('Error updating portfolio chart:', error);
        }

        try {
            updatePortfolioAllocationChart();
        } catch (error) {
            console.error('Error updating portfolio allocation chart:', error);
        }

        console.log('UI updated successfully');
    } catch (error) {
        console.error('Error in updateUI function:', error);
    }
};

// Calculate portfolio value
window.calculatePortfolioValue = function() {
    let value = 0;
    if (!playerState || !playerState.portfolio || !gameState) return value;

    // Get asset prices, handling different property names
    const assetPrices = gameState.assetPrices || gameState.asset_prices || {};

    // Log the inputs for debugging
    console.log('calculatePortfolioValue inputs:', {
        portfolio: playerState.portfolio,
        assetPrices: assetPrices
    });

    // Calculate the total value of all assets in the portfolio
    for (const [asset, quantity] of Object.entries(playerState.portfolio)) {
        const price = assetPrices[asset] || 0;
        const assetValue = price * quantity;
        value += assetValue;

        // Log each asset's contribution to the portfolio value
        console.log(`Asset ${asset}: ${quantity} × $${price} = $${assetValue}`);
    }

    console.log('Total portfolio value calculated:', value);
    return value;
};

// Update cash and portfolio displays
window.updateCashAndPortfolioDisplays = function() {
    // Calculate portfolio value
    const portfolioValue = window.calculatePortfolioValue();
    const totalValue = playerState.cash + portfolioValue;

    // Update player state with the calculated total value
    playerState.total_value = totalValue;

    // Calculate return values
    const initialValue = 10000; // Starting cash
    const totalReturn = totalValue - initialValue;
    const percentReturn = (totalReturn / initialValue) * 100;

    // Log the calculated values for debugging
    console.log('Portfolio Summary Values (updateCashAndPortfolioDisplays):', {
        cash: playerState.cash,
        portfolioValue: portfolioValue,
        totalValue: totalValue,
        totalReturn: totalReturn,
        percentReturn: percentReturn,
        portfolio: playerState.portfolio
    });

    // Update simplified portfolio summary
    const cashDisplay = document.getElementById('cash-display');
    if (cashDisplay) {
        cashDisplay.textContent = '$' + playerState.cash.toFixed(2);
        console.log('Updated Cash display to:', playerState.cash.toFixed(2));
    }

    const portfolioValueDisplay = document.getElementById('portfolio-value-display');
    if (portfolioValueDisplay) {
        portfolioValueDisplay.textContent = '$' + portfolioValue.toFixed(2);
        console.log('Updated Invested display to:', portfolioValue.toFixed(2));
    }

    const totalValueDisplay = document.getElementById('total-value-display');
    if (totalValueDisplay) {
        totalValueDisplay.textContent = '$' + totalValue.toFixed(2);
        console.log('Updated Total Value display to:', totalValue.toFixed(2));
    }

    const returnDisplay = document.getElementById('return-display');
    if (returnDisplay) {
        returnDisplay.textContent = '$' + totalReturn.toFixed(2) + ' (' + percentReturn.toFixed(2) + '%)';
        returnDisplay.className = totalReturn >= 0 ? 'mb-0 text-success' : 'mb-0 text-danger';
        console.log('Updated Return display to:', totalReturn.toFixed(2), percentReturn.toFixed(2) + '%');
    }

    const cpiDisplay = document.getElementById('cpi-display');
    if (cpiDisplay) {
        cpiDisplay.textContent = gameState.CPI.toFixed(2);
    }
}

// Update element text helper function
window.updateElementText = function(id, text) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = text;
    }
}

// Update round progress
window.updateRoundProgress = function() {
    try {
        console.log('Updating round progress...');

        // Get current round from various possible sources
        let currentRound = 0;
        if (typeof window.currentRound !== 'undefined' && window.currentRound !== null) {
            currentRound = parseInt(window.currentRound) || 0;
        } else if (gameState && typeof gameState.roundNumber !== 'undefined') {
            currentRound = parseInt(gameState.roundNumber) || 0;
        } else if (gameState && typeof gameState.round_number !== 'undefined') {
            currentRound = parseInt(gameState.round_number) || 0;
        }

        console.log('Current round for progress bar:', currentRound);

        // Get max rounds
        let maxRounds = 20; // Default
        if (gameState && typeof gameState.maxRounds !== 'undefined') {
            maxRounds = parseInt(gameState.maxRounds) || 20;
        } else if (gameState && typeof gameState.max_rounds !== 'undefined') {
            maxRounds = parseInt(gameState.max_rounds) || 20;
        }

        console.log('Max rounds for progress bar:', maxRounds);

        // Update round displays
        const currentRoundDisplay = document.getElementById('current-round-display');
        if (currentRoundDisplay) {
            currentRoundDisplay.textContent = currentRound;
        }

        const marketRoundDisplay = document.getElementById('market-round-display');
        if (marketRoundDisplay) {
            marketRoundDisplay.textContent = currentRound;
        }

        // Update progress bar
        const progressBar = document.getElementById('round-progress');
        if (progressBar) {
            // Calculate progress percentage, ensuring it's a valid number
            let progress = 0;
            if (maxRounds > 0) {
                progress = (currentRound / maxRounds) * 100;
            }

            // Ensure progress is a valid number
            if (isNaN(progress) || !isFinite(progress)) {
                console.warn('Invalid progress value:', progress);
                progress = 0;
            }

            // Ensure progress is between 0 and 100
            progress = Math.max(0, Math.min(100, progress));

            console.log('Progress bar percentage:', progress);

            // Update progress bar
            progressBar.style.width = progress + '%';
            progressBar.setAttribute('aria-valuenow', progress);
            progressBar.textContent = Math.round(progress) + '%';
        } else {
            console.error('Progress bar element not found');
        }

        console.log('Round progress updated successfully');
    } catch (error) {
        console.error('Error updating round progress:', error);
    }
}

// Update market data - robust version that handles missing elements
window.updateMarketData = function() {
    try {
        // Try multiple possible IDs for the market data table
        let tableBody = document.getElementById('market-data-table') ||
                        document.getElementById('asset-prices-table') ||
                        document.querySelector('#market-data-table tbody');

        if (!tableBody) {
            // If we still can't find it, try to find any table that might be the market data table
            const tables = document.querySelectorAll('table');
            for (const table of tables) {
                if (table.id.includes('market') || table.id.includes('asset') ||
                    table.className.includes('market') || table.className.includes('asset')) {
                    tableBody = table.querySelector('tbody') || table;
                    break;
                }
            }
        }

        if (!tableBody) {
            console.warn('Market data table not found, skipping update');
            return;
        }

        // Clear existing rows
        tableBody.innerHTML = '';

        // Add Cash row first
        const cashRow = document.createElement('tr');
        cashRow.innerHTML = `
            <td>Cash</td>
            <td class="price-cell">$1.00</td>
            <td class="text-secondary">0.00%</td>
            <td>${playerState.cash.toFixed(6)}</td>
            <td>$${playerState.cash.toFixed(2)}</td>
            <td>${(playerState.cash / (window.calculatePortfolioValue() + playerState.cash) * 100).toFixed(2)}%</td>
            <td>
                <!-- No action button for cash -->
            </td>
        `;
        tableBody.appendChild(cashRow);

    // Add rows for each asset
    for (const [asset, price] of Object.entries(gameState.assetPrices)) {
        const row = document.createElement('tr');

        // Calculate price change
        let priceChange = 0;
        let percentChange = 0;

        const priceHistory = gameState.priceHistory[asset];
        if (priceHistory && priceHistory.length > 1) {
            const previousPrice = priceHistory[priceHistory.length - 2];
            priceChange = price - previousPrice;
            percentChange = (priceChange / previousPrice) * 100;
        }

        // Create change class
        let changeClass = 'text-secondary';
        let changeIcon = '';

        if (priceChange > 0) {
            changeClass = 'text-success';
            changeIcon = '<i class="fas fa-arrow-up mr-1"></i>';
        } else if (priceChange < 0) {
            changeClass = 'text-danger';
            changeIcon = '<i class="fas fa-arrow-down mr-1"></i>';
        }

        // Get portfolio quantity and value
        const quantity = playerState.portfolio[asset] || 0;
        const value = quantity * price;
        const portfolioTotal = window.calculatePortfolioValue() + playerState.cash;
        const percentage = portfolioTotal > 0 ? (value / portfolioTotal) * 100 : 0;

        row.innerHTML = `
            <td>${asset}</td>
            <td class="price-cell">$${price.toFixed(2)}</td>
            <td class="${changeClass}">${changeIcon}${percentChange.toFixed(2)}%</td>
            <td>${quantity.toFixed(6)}</td>
            <td>$${value.toFixed(2)}</td>
            <td>${percentage.toFixed(2)}%</td>
            <td>
                <button class="btn btn-sm btn-secondary select-asset-btn" data-asset="${asset}">Select</button>
            </td>
        `;

        tableBody.appendChild(row);
    }

    // Add event listeners to the select asset buttons
    const selectButtons = document.querySelectorAll('.select-asset-btn');
    selectButtons.forEach(button => {
        button.addEventListener('click', function() {
            const asset = this.getAttribute('data-asset');
            console.log(`Select button clicked for ${asset}`);

            // Set the asset in the trade form
            const assetSelect = document.getElementById('asset-select') || document.getElementById('trade-asset-select');
            if (assetSelect) assetSelect.value = asset;

            // Update the asset price display
            if (typeof updateAssetPrice === 'function') {
                updateAssetPrice();
            } else if (typeof window.updateAssetPrice === 'function') {
                window.updateAssetPrice();
            }

            // Show the trade panel if it exists
            if (typeof showTradePanel === 'function') {
                showTradePanel(asset, 'buy');
            } else if (typeof window.showTradePanel === 'function') {
                window.showTradePanel(asset, 'buy');
            }
        });
    });
    } catch (error) {
        console.error('Error in updateMarketData:', error);
    }
}

// Update price ticker - robust version that handles missing elements
window.updatePriceTicker = function() {
    try {
        const ticker = document.getElementById('price-ticker');
        if (!ticker) {
            console.warn('Price ticker not found, skipping update');
            return;
        }

        // Clear existing items
        ticker.innerHTML = '';

    // Add items for each asset
    for (const [asset, price] of Object.entries(gameState.assetPrices)) {
        // Get previous price
        const priceHistory = gameState.priceHistory[asset] || [];
        const previousPrice = priceHistory.length > 1 ? priceHistory[priceHistory.length - 2] : price;

        // Calculate change
        const change = price - previousPrice;
        const percentChange = (change / previousPrice) * 100;

        // Create change class
        let changeClass = '';
        let changeIcon = '';

        if (change > 0) {
            changeClass = 'text-success';
            changeIcon = '▲';
        } else if (change < 0) {
            changeClass = 'text-danger';
            changeIcon = '▼';
        }

        const tickerItem = document.createElement('div');
        tickerItem.className = 'ticker-item';

        tickerItem.innerHTML = `
            <span class="asset-name">${asset}</span>
            <span class="price">$${price.toFixed(2)}</span>
            <span class="${changeClass}">${changeIcon} ${percentChange.toFixed(2)}%</span>
        `;

        ticker.appendChild(tickerItem);
    }
    } catch (error) {
        console.error('Error in updatePriceTicker:', error);
    }
}

// Update portfolio chart - robust version that handles missing elements
window.updatePortfolioChart = function() {
    try {
        const canvas = document.getElementById('portfolio-chart');
        if (!canvas) {
            console.warn('Portfolio chart canvas not found, skipping update');
            return;
        }

    // Get portfolio value history (handle both naming conventions)
    const portfolioValueHistory = playerState.portfolio_value_history || playerState.portfolioValueHistory || [];

    // If portfolio value history is not an array, create an empty array
    const valueHistory = Array.isArray(portfolioValueHistory) ? portfolioValueHistory : [];

    // Create labels
    const labels = [];
    for (let i = 0; i < valueHistory.length; i++) {
        labels.push(`Round ${i}`);
    }

    // Create data
    const data = valueHistory;

    // Create chart
    if (window.portfolioChart) {
        window.portfolioChart.data.labels = labels;
        window.portfolioChart.data.datasets[0].data = data;
        window.portfolioChart.update();
    } else {
        const ctx = canvas.getContext('2d');

        window.portfolioChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Portfolio Value',
                    data: data,
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderColor: 'rgba(0, 123, 255, 1)',
                    borderWidth: 2,
                    pointRadius: 3,
                    pointBackgroundColor: 'rgba(0, 123, 255, 1)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Portfolio Value Over Time',
                        font: {
                            size: 16
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `Value: $${context.raw.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Value ($)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(0);
                            }
                        }
                    }
                }
            }
        });
    }
    } catch (error) {
        console.error('Error in updatePortfolioChart:', error);
    }
}

// Update portfolio allocation chart
window.updatePortfolioAllocationChart = function() {
    try {
        console.log('Updating portfolio allocation chart...');

        // Get the chart container
        const chartContainer = document.querySelector('.chart-container');
        if (!chartContainer) {
            console.error('Chart container not found');
            return;
        }

        // Create a unique ID for this chart instance to avoid conflicts
        const chartId = 'portfolio-allocation-' + Date.now();

        // First, ensure any existing chart is properly destroyed
        if (window.portfolioAllocationChart) {
            try {
                console.log('Destroying existing portfolio allocation chart');
                window.portfolioAllocationChart.destroy();
                window.portfolioAllocationChart = null;
            } catch (chartError) {
                console.error('Error destroying portfolio allocation chart:', chartError);
            }
        }

        // Force cleanup of any Chart.js instances
        if (typeof Chart !== 'undefined') {
            try {
                // Try to destroy all charts on the container
                const canvases = chartContainer.querySelectorAll('canvas');
                canvases.forEach(canvas => {
                    try {
                        if (typeof Chart.getChart === 'function') {
                            const chart = Chart.getChart(canvas);
                            if (chart) {
                                console.log(`Destroying chart on canvas ${canvas.id}`);
                                chart.destroy();
                            }
                        }
                    } catch (e) {
                        // Ignore errors, just trying to clean up
                    }
                });

                // Also check the Chart.instances registry
                if (typeof Chart.instances === 'object') {
                    Object.keys(Chart.instances).forEach(key => {
                        try {
                            Chart.instances[key].destroy();
                        } catch (e) {
                            // Ignore errors, just trying to clean up
                        }
                    });
                }
            } catch (e) {
                console.error('Error cleaning up charts:', e);
            }
        }

        // Remove all existing canvases from the container
        chartContainer.innerHTML = '';

        // Create a new canvas with the unique ID
        const canvas = document.createElement('canvas');
        canvas.id = chartId;
        chartContainer.appendChild(canvas);

        // Prepare data for portfolio allocation chart
        const portfolioData = [];
        const portfolioLabels = [];
        const portfolioColors = [
            '#4285F4', '#EA4335', '#FBBC05', '#34A853', '#8F00FF', '#FF6D01', '#1976D2'
        ];

        // Add assets to portfolio data
        let colorIndex = 0;
        if (playerState && playerState.portfolio) {
            for (const [asset, quantity] of Object.entries(playerState.portfolio)) {
                if (quantity > 0) {
                    // Get the price from gameState
                    const assetPrices = window.gameState?.assetPrices || window.gameState?.asset_prices ||
                                       gameState?.assetPrices || gameState?.asset_prices || {};
                    const price = assetPrices[asset] || 0;
                    const value = quantity * price;

                    if (value > 0) {
                        portfolioData.push(value);
                        portfolioLabels.push(asset);
                        colorIndex = (colorIndex + 1) % portfolioColors.length;
                    }
                }
            }
        }

        // Add cash to portfolio allocation
        if (playerState && playerState.cash > 0) {
            portfolioData.push(playerState.cash);
            portfolioLabels.push('Cash');
        }

        // Check if we have any data to display
        if (portfolioData.length === 0) {
            console.log('No portfolio data to display');
            // Add default data to avoid empty chart
            portfolioData.push(10000);
            portfolioLabels.push('Cash');
        }

        console.log('Creating new portfolio allocation chart with data:', portfolioData, portfolioLabels);

        // Get the context
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Could not get 2D context for portfolio allocation chart');
            return;
        }

        // Create the chart
        window.portfolioAllocationChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: portfolioLabels,
                datasets: [{
                    data: portfolioData,
                    backgroundColor: portfolioColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Portfolio Allocation',
                        font: {
                            size: 16
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${context.label}: $${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        console.log('Portfolio allocation chart created successfully with ID:', chartId);
    } catch (error) {
        console.error('Error updating portfolio allocation chart:', error);
    }
}

// Update asset price charts - robust version that handles missing elements
window.updateAssetPriceCharts = function() {
    try {
        // Update Real Estate & Gold chart
        if (typeof updateRealEstateGoldChart === 'function') {
            updateRealEstateGoldChart();
        } else if (typeof window.updateRealEstateGoldChart === 'function') {
            window.updateRealEstateGoldChart();
        }

        // Update Bonds, Commodities & S&P chart
        if (typeof updateBondsCommoditiesSPChart === 'function') {
            updateBondsCommoditiesSPChart();
        } else if (typeof window.updateBondsCommoditiesSPChart === 'function') {
            window.updateBondsCommoditiesSPChart();
        }

        // Update Bitcoin chart
        if (typeof updateBitcoinChart === 'function') {
            updateBitcoinChart();
        } else if (typeof window.updateBitcoinChart === 'function') {
            window.updateBitcoinChart();
        }
    } catch (error) {
        console.error('Error in updateAssetPriceCharts:', error);
    }
}

// Update Real Estate & Gold chart
window.updateRealEstateGoldChart = function() {
    const canvas = document.getElementById('real-estate-gold-chart');
    if (!canvas) return;

    // Get price history
    const realEstateHistory = gameState.priceHistory['Real Estate'] || [];
    const goldHistory = gameState.priceHistory['Gold'] || [];

    // Create labels
    const labels = [];
    for (let i = 0; i <= window.currentRound; i++) {
        labels.push(`Round ${i}`);
    }

    // Update chart
    if (window.realEstateGoldChart) {
        window.realEstateGoldChart.data.labels = labels;
        window.realEstateGoldChart.data.datasets[0].data = realEstateHistory;
        window.realEstateGoldChart.data.datasets[1].data = goldHistory;
        window.realEstateGoldChart.update();
    }
}

// Update Bonds, Commodities & S&P chart
window.updateBondsCommoditiesSPChart = function() {
    const canvas = document.getElementById('bonds-commodities-sp-chart');
    if (!canvas) return;

    // Get price history
    const bondsHistory = gameState.priceHistory['Bonds'] || [];
    const commoditiesHistory = gameState.priceHistory['Commodities'] || [];
    const spHistory = gameState.priceHistory['S&P 500'] || [];

    // Create labels
    const labels = [];
    for (let i = 0; i <= window.currentRound; i++) {
        labels.push(`Round ${i}`);
    }

    // Update chart
    if (window.bondsCommoditiesSPChart) {
        window.bondsCommoditiesSPChart.data.labels = labels;
        window.bondsCommoditiesSPChart.data.datasets[0].data = bondsHistory;
        window.bondsCommoditiesSPChart.data.datasets[1].data = commoditiesHistory;
        window.bondsCommoditiesSPChart.data.datasets[2].data = spHistory;
        window.bondsCommoditiesSPChart.update();
    }
}

// Update Bitcoin chart
window.updateBitcoinChart = function() {
    const canvas = document.getElementById('bitcoin-chart');
    if (!canvas) return;

    // Get price history
    const bitcoinHistory = gameState.priceHistory['Bitcoin'] || [];

    // Create labels
    const labels = [];
    for (let i = 0; i <= window.currentRound; i++) {
        labels.push(`Round ${i}`);
    }

    // Update chart
    if (window.bitcoinChart) {
        window.bitcoinChart.data.labels = labels;
        window.bitcoinChart.data.datasets[0].data = bitcoinHistory;
        window.bitcoinChart.update();
    }
}

// Update CPI chart
window.updateCPIChart = function() {
    const canvas = document.getElementById('cpi-chart');
    if (!canvas) return;

    // Get CPI history
    const cpiHistory = gameState.CPIHistory || [];

    // Create labels
    const labels = [];
    for (let i = 0; i <= window.currentRound; i++) {
        labels.push(`Round ${i}`);
    }

    // Update chart
    if (window.cpiChart) {
        window.cpiChart.data.labels = labels;
        window.cpiChart.data.datasets[0].data = cpiHistory;
        window.cpiChart.update();
    }
}

// Initialize charts
window.initializeCharts = function() {
    console.log('Initializing charts...');

    try {
        // Make sure Chart.js is available
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not available');
            return;
        }

        // Destroy all existing charts to prevent errors
        if (typeof window.destroyAllCharts === 'function') {
            window.destroyAllCharts();
        } else if (typeof destroyAllCharts === 'function') {
            destroyAllCharts();
        }

        // Wait a moment for the DOM to be ready and charts to be destroyed
        setTimeout(() => {
            // Double-check that all charts are destroyed
            if (typeof Chart.getChart === 'function') {
                const canvases = document.querySelectorAll('canvas');
                canvases.forEach(canvas => {
                    const chartInstance = Chart.getChart(canvas.id);
                    if (chartInstance) {
                        console.log(`Found existing chart on ${canvas.id}, destroying it`);
                        chartInstance.destroy();
                    }
                });
            }
        // Initialize portfolio value chart
        const portfolioValueCanvas = document.getElementById('portfolio-value-chart');
        if (portfolioValueCanvas) {
            const ctx = portfolioValueCanvas.getContext('2d');
            window.portfolioChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Round 0'],
                    datasets: [{
                        label: 'Portfolio Value',
                        data: [10000],
                        backgroundColor: 'rgba(0, 123, 255, 0.1)',
                        borderColor: 'rgba(0, 123, 255, 1)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(0, 123, 255, 1)',
                        pointBorderColor: '#fff',
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: false,
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toFixed(0);
                                }
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return 'Value: $' + context.raw.toFixed(2);
                                }
                            }
                        }
                    }
                }
            });
        }

        // Initialize portfolio allocation chart - use the dedicated function instead
        // This will handle all the chart creation and error handling
        if (typeof window.updatePortfolioAllocationChart === 'function') {
            window.updatePortfolioAllocationChart();
        } else {
            console.error('Portfolio allocation chart update function not found');
        }

        // Initialize Real Estate & Gold chart
        const realEstateGoldCanvas = document.getElementById('real-estate-gold-chart');
        if (realEstateGoldCanvas) {
            const ctx = realEstateGoldCanvas.getContext('2d');
            window.realEstateGoldChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Round 0'],
                    datasets: [
                        {
                            label: 'Real Estate',
                            data: [5000],
                            borderColor: 'rgba(255, 99, 132, 1)',
                            backgroundColor: 'rgba(255, 99, 132, 0.1)',
                            borderWidth: 2,
                            fill: false
                        },
                        {
                            label: 'Gold',
                            data: [3000],
                            borderColor: 'rgba(255, 206, 86, 1)',
                            backgroundColor: 'rgba(255, 206, 86, 0.1)',
                            borderWidth: 2,
                            fill: false
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        y: {
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toLocaleString();
                                }
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': $' + context.raw.toLocaleString();
                                }
                            }
                        }
                    }
                }
            });
        }

        // Initialize Bonds, Commodities & S&P chart
        const bondsCommoditiesSPCanvas = document.getElementById('bonds-commodities-sp-chart');
        if (bondsCommoditiesSPCanvas) {
            const ctx = bondsCommoditiesSPCanvas.getContext('2d');
            window.bondsCommoditiesSPChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Round 0'],
                    datasets: [
                        {
                            label: 'Bonds',
                            data: [100],
                            borderColor: 'rgba(54, 162, 235, 1)',
                            backgroundColor: 'rgba(54, 162, 235, 0.1)',
                            borderWidth: 2,
                            fill: false
                        },
                        {
                            label: 'Commodities',
                            data: [100],
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.1)',
                            borderWidth: 2,
                            fill: false
                        },
                        {
                            label: 'S&P 500',
                            data: [100],
                            borderColor: 'rgba(153, 102, 255, 1)',
                            backgroundColor: 'rgba(153, 102, 255, 0.1)',
                            borderWidth: 2,
                            fill: false
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        y: {
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toLocaleString();
                                }
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': $' + context.raw.toLocaleString();
                                }
                            }
                        }
                    }
                }
            });
        }

        // Initialize Bitcoin chart
        const bitcoinCanvas = document.getElementById('bitcoin-chart');
        if (bitcoinCanvas) {
            const ctx = bitcoinCanvas.getContext('2d');
            window.bitcoinChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Round 0'],
                    datasets: [
                        {
                            label: 'Bitcoin',
                            data: [50000],
                            borderColor: 'rgba(255, 159, 64, 1)',
                            backgroundColor: 'rgba(255, 159, 64, 0.1)',
                            borderWidth: 2,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        y: {
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toLocaleString();
                                }
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': $' + context.raw.toLocaleString();
                                }
                            }
                        }
                    }
                }
            });
        }

        // Initialize CPI chart
        const cpiCanvas = document.getElementById('cpi-chart');
        if (cpiCanvas) {
            const ctx = cpiCanvas.getContext('2d');
            window.cpiChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Round 0'],
                    datasets: [
                        {
                            label: 'CPI',
                            data: [100],
                            borderColor: 'rgba(40, 167, 69, 1)',
                            backgroundColor: 'rgba(40, 167, 69, 0.1)',
                            borderWidth: 2,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        y: {
                            beginAtZero: false,
                            ticks: {
                                callback: function(value) {
                                    return value.toFixed(2);
                                }
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return 'CPI: ' + context.raw.toFixed(2);
                                }
                            }
                        }
                    }
                }
            });
        }

        console.log('Charts initialized successfully');
        }, 500); // End of setTimeout - increased to 500ms for better reliability
    } catch (error) {
        console.error('Error initializing charts:', error);
    }
}

// Destroy all charts to prevent errors
window.destroyAllCharts = function() {
    console.log('Destroying all charts...');
    try {
        // First, try to destroy charts by reference
        const chartRefs = [
            'portfolioChart', 'portfolioAllocationChart', 'realEstateGoldChart',
            'bondsCommoditiesSPChart', 'bitcoinChart', 'cpiChart'
        ];

        chartRefs.forEach(ref => {
            try {
                if (window[ref]) {
                    console.log(`Destroying chart by reference: ${ref}`);
                    window[ref].destroy();
                    window[ref] = null;
                }
            } catch (refError) {
                console.error(`Error destroying chart reference ${ref}:`, refError);
            }
        });

        // Then, try to destroy all charts using Chart.getChart
        if (typeof Chart !== 'undefined' && typeof Chart.getChart === 'function') {
            // Get all canvas elements
            const canvases = document.querySelectorAll('canvas');
            console.log(`Found ${canvases.length} canvas elements`);

            // Clear each canvas
            canvases.forEach(canvas => {
                try {
                    // Try to get the chart instance from the canvas
                    try {
                        const chartInstance = Chart.getChart(canvas);
                        if (chartInstance) {
                            console.log(`Destroying chart on canvas ${canvas.id}`);
                            chartInstance.destroy();
                        } else {
                            console.log(`No chart instance found for canvas ${canvas.id}`);
                        }
                    } catch (chartError) {
                        console.error(`Error getting chart for canvas ${canvas.id}:`, chartError);
                    }

                    // Clear the canvas manually anyway
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }

                    // Replace the canvas with a new one
                    const parent = canvas.parentNode;
                    if (parent) {
                        const newCanvas = document.createElement('canvas');
                        newCanvas.id = canvas.id;
                        newCanvas.width = canvas.width;
                        newCanvas.height = canvas.height;
                        newCanvas.className = canvas.className;
                        parent.replaceChild(newCanvas, canvas);
                    }
                } catch (canvasError) {
                    console.error(`Error clearing canvas ${canvas.id}:`, canvasError);
                }
            });
        } else {
            console.warn('Chart.getChart is not available, using fallback method');

            // Fallback: try to clear all canvases manually
            const canvases = document.querySelectorAll('canvas');
            canvases.forEach(canvas => {
                try {
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }

                    // Replace the canvas with a new one
                    const parent = canvas.parentNode;
                    if (parent) {
                        const newCanvas = document.createElement('canvas');
                        newCanvas.id = canvas.id;
                        newCanvas.width = canvas.width;
                        newCanvas.height = canvas.height;
                        newCanvas.className = canvas.className;
                        parent.replaceChild(newCanvas, canvas);
                    }
                } catch (canvasError) {
                    console.error(`Error clearing canvas ${canvas.id}:`, canvasError);
                }
            });
        }

        // Reset all chart references to be safe
        window.portfolioChart = null;
        window.portfolioAllocationChart = null;
        window.realEstateGoldChart = null;
        window.bondsCommoditiesSPChart = null;
        window.bitcoinChart = null;
        window.cpiChart = null;

        // Force garbage collection by removing any lingering references
        if (typeof Chart !== 'undefined' && typeof Chart.instances === 'object') {
            console.log('Clearing Chart.instances registry');
            Object.keys(Chart.instances).forEach(key => {
                try {
                    if (Chart.instances[key]) {
                        Chart.instances[key].destroy();
                        delete Chart.instances[key];
                    }
                } catch (error) {
                    console.error(`Error destroying Chart.instances[${key}]:`, error);
                }
            });
        }

        console.log('All charts destroyed successfully');
    } catch (error) {
        console.error('Error destroying charts:', error);
    }
}

// Update comparative returns chart
window.updateComparativeReturnsChart = function() {
    // This is a placeholder for the comparative returns chart
    // We'll implement this in a separate function to keep the file size manageable
}

// Update asset price in trade form
window.updateAssetPrice = function() {
    const assetSelect = document.getElementById('trade-asset');
    const priceDisplay = document.getElementById('trade-price');

    if (!assetSelect || !priceDisplay) return;

    const selectedAsset = assetSelect.value;
    if (!selectedAsset) return;

    const price = gameState.assetPrices[selectedAsset] || 0;
    priceDisplay.textContent = `$${price.toFixed(2)}`;
}

// Show trade panel
window.showTradePanel = function(asset, action = 'buy') {
    console.log(`Showing trade panel for ${asset}, action: ${action}`);

    // Get the trade panel
    const tradePanel = document.querySelector('.trade-panel');
    if (!tradePanel) {
        console.error('Trade panel not found');
        return;
    }

    // Debug log to check if gameState and asset prices are available
    console.log('gameState:', window.gameState || gameState);
    console.log('Asset prices:', window.gameState?.assetPrices || gameState?.assetPrices ||
                             window.gameState?.asset_prices || gameState?.asset_prices);
    console.log('Trade panel element:', tradePanel);

    // Make sure the trade panel is visible
    tradePanel.style.display = 'block';
    tradePanel.style.zIndex = '9999';

    // Set the asset in the dropdown
    const assetSelect = document.getElementById('trade-asset-select');
    if (assetSelect) {
        assetSelect.value = asset;
    }

    // Set the action
    const actionSelect = document.getElementById('trade-action');
    if (actionSelect) {
        actionSelect.value = action;
    }

    // Set the asset price
    // Handle different property naming conventions
    const assetPrices = window.gameState?.assetPrices || window.gameState?.asset_prices ||
                       gameState?.assetPrices || gameState?.asset_prices || {};
    const price = assetPrices[asset] || 0;

    const priceElement = document.getElementById('current-price-display');
    if (priceElement) {
        priceElement.textContent = price.toFixed(2);
    }

    // Reset quantity and amount
    const quantityInput = document.getElementById('trade-quantity');
    if (quantityInput) {
        quantityInput.value = '';
    }

    const amountInput = document.getElementById('trade-amount');
    if (amountInput) {
        amountInput.value = '';
    }

    // Reset sliders
    const quantitySlider = document.getElementById('quantity-slider');
    if (quantitySlider) {
        quantitySlider.value = 0;
    }

    const amountSlider = document.getElementById('amount-slider');
    if (amountSlider) {
        amountSlider.value = 0;
    }

    // Reset percentage inputs
    const quantityPercentage = document.getElementById('quantity-percentage');
    if (quantityPercentage) {
        quantityPercentage.value = 0;
    }

    const amountPercentage = document.getElementById('amount-percentage');
    if (amountPercentage) {
        amountPercentage.value = 0;
    }

    // Update trade summary
    if (typeof window.updateTradeSummary === 'function') {
        window.updateTradeSummary();
    } else if (typeof updateTradeSummary === 'function') {
        updateTradeSummary();
    }

    // Scroll to the trading panel
    tradePanel.scrollIntoView({ behavior: 'smooth' });
}

// Update trade summary
window.updateTradeSummary = function() {
    try {
        // Get asset from dropdown
        const assetSelect = document.getElementById('trade-asset-select');
        if (!assetSelect) {
            console.error('Asset select dropdown not found');
            return;
        }

        const assetName = assetSelect.value;
        if (!assetName) {
            console.log('No asset selected');
            return;
        }

        const action = document.getElementById('trade-action').value;
        const quantity = parseFloat(document.getElementById('trade-quantity').value) || 0;

        // Handle different property naming conventions
        const assetPrices = window.gameState?.assetPrices || window.gameState?.asset_prices ||
                           gameState?.assetPrices || gameState?.asset_prices || {};
        const price = assetPrices[assetName] || 0;
        const total = price * quantity;

        console.log(`Updating trade summary: ${assetName}, ${action}, ${quantity} @ $${price} = $${total}`);

        // Update total display
        const totalElement = document.getElementById('trade-total');
        if (totalElement) {
            totalElement.textContent = `$${total.toFixed(2)}`;
        }

        // Update available cash display
        const cashElement = document.getElementById('available-cash');
        if (cashElement && playerState) {
            cashElement.textContent = playerState.cash.toFixed(2);
        }

        // Update available quantity display for sell actions
        const availableQuantityElement = document.getElementById('available-quantity');
        if (availableQuantityElement && action === 'sell') {
            const availableQuantity = playerState?.portfolio?.[assetName] || 0;
            availableQuantityElement.textContent = availableQuantity.toFixed(6);
        }

        // Validate trade
        const executeTradeBtn = document.getElementById('execute-trade-btn');
        if (executeTradeBtn) {
            if (action === 'buy') {
                // Check if player has enough cash
                executeTradeBtn.disabled = total > playerState.cash || quantity <= 0;
            } else if (action === 'sell') {
                // Check if player has enough of the asset
                const playerQuantity = playerState?.portfolio?.[assetName] || 0;
                executeTradeBtn.disabled = quantity > playerQuantity || quantity <= 0;
            }
        }
    } catch (error) {
        console.error('Error updating trade summary:', error);
    }
}

// Execute trade
window.executeTrade = function() {
    try {
        // Try to call the executeTrade function in game-trading.js if available
        if (typeof executeTrade === 'function') {
            console.log('Calling executeTrade function in game-trading.js');
            executeTrade();
            return;
        }

        // Get asset from dropdown
        const assetSelect = document.getElementById('trade-asset-select');
        const action = document.getElementById('trade-action').value;
        const quantity = parseFloat(document.getElementById('trade-quantity').value) || 0;

        if (!assetSelect) {
            console.error('Asset select dropdown not found');
            if (typeof window.showNotification === 'function') {
                window.showNotification('Error: Asset select dropdown not found', 'danger');
            } else {
                alert('Error: Asset select dropdown not found');
            }
            return;
        }

        const assetName = assetSelect.value;

        if (!assetName) {
            if (typeof window.showNotification === 'function') {
                window.showNotification('Please select an asset', 'warning');
            } else {
                alert('Please select an asset');
            }
            return;
        }

        if (quantity <= 0) {
            if (typeof window.showNotification === 'function') {
                window.showNotification('Please enter a valid quantity.', 'warning');
            } else {
                alert('Please enter a valid quantity.');
            }
            return;
        }

        // Handle different property naming conventions
        const assetPrices = window.gameState?.assetPrices || window.gameState?.asset_prices ||
                           gameState?.assetPrices || gameState?.asset_prices || {};
        const price = assetPrices[assetName] || 0;
        const total = price * quantity;

    console.log(`Executing trade: ${action} ${quantity} ${assetName} @ $${price} = $${total}`);

    if (action === 'buy') {
        // Check if player has enough cash
        if (total > playerState.cash) {
            window.showNotification('Not enough cash for this purchase.', 'danger');
            return;
        }

        // Update player state
        playerState.cash -= total;
        playerState.portfolio[assetName] = (playerState.portfolio[assetName] || 0) + quantity;

        // Add to trade history
        if (!playerState.tradeHistory && !playerState.trade_history) {
            playerState.trade_history = [];
        }

        const tradeRecord = {
            round: window.currentRound || 0,
            asset: assetName,
            action: 'buy',
            quantity: quantity,
            price: price,
            total: total,
            timestamp: new Date().toISOString()
        };

        if (Array.isArray(playerState.tradeHistory)) {
            playerState.tradeHistory.push(tradeRecord);
        } else if (Array.isArray(playerState.trade_history)) {
            playerState.trade_history.push(tradeRecord);
        }

        window.showNotification(`Bought ${quantity} ${assetName} for $${total.toFixed(2)}.`, 'success');
    } else if (action === 'sell') {
        // Check if player has enough of the asset
        const playerQuantity = playerState.portfolio[assetName] || 0;
        if (quantity > playerQuantity) {
            window.showNotification(`You don't have enough ${assetName} to sell.`, 'danger');
            return;
        }

        // Update player state
        playerState.cash += total;
        playerState.portfolio[assetName] -= quantity;

        // Remove asset from portfolio if quantity is 0
        if (playerState.portfolio[assetName] <= 0) {
            delete playerState.portfolio[assetName];
        }

        // Add to trade history
        if (!playerState.tradeHistory && !playerState.trade_history) {
            playerState.trade_history = [];
        }

        const tradeRecord = {
            round: window.currentRound || 0,
            asset: assetName,
            action: 'sell',
            quantity: quantity,
            price: price,
            total: total,
            timestamp: new Date().toISOString()
        };

        if (Array.isArray(playerState.tradeHistory)) {
            playerState.tradeHistory.push(tradeRecord);
        } else if (Array.isArray(playerState.trade_history)) {
            playerState.trade_history.push(tradeRecord);
        }

        window.showNotification(`Sold ${quantity} ${assetName} for $${total.toFixed(2)}.`, 'success');
    }

    // Hide trade panel
    const tradePanel = document.querySelector('.trade-panel');
    if (tradePanel) {
        tradePanel.style.display = 'none';
    }

    // Save player state to Supabase
    if (window.gameSupabase && typeof window.gameSupabase.updatePlayerState === 'function' && window.gameSession) {
        console.log('Saving player state to Supabase after trade');
        window.gameSupabase.updatePlayerState(window.gameSession.id, playerState)
            .then(success => {
                if (success) {
                    console.log('Player state saved successfully');
                } else {
                    console.error('Failed to save player state');
                }
                // Update UI
                updateUI();
            })
            .catch(error => {
                console.error('Error saving player state:', error);
                // Update UI anyway
                updateUI();
            });
    } else {
        console.warn('Unable to save player state to Supabase - missing required objects');
        // Update UI
        updateUI();
    }
    } catch (error) {
        console.error('Error executing trade:', error);
        if (typeof window.showNotification === 'function') {
            window.showNotification('An error occurred while executing the trade', 'danger');
        } else {
            alert('An error occurred while executing the trade');
        }
    }
}

// Advance to next round function - simplified version based on templates
window.nextRound = function() {
    try {
        console.log('Starting nextRound function');

        // Check if we've already reached the maximum number of rounds
        if (gameState.roundNumber >= gameState.maxRounds) {
            console.log('Maximum rounds reached, ending game');
            if (typeof window.endGame === 'function') {
                window.endGame();
            }
            return;
        }

        // Increment round number
        gameState.roundNumber++;
        window.currentRound = gameState.roundNumber;
        console.log('Round number incremented to:', gameState.roundNumber);

        // Generate new prices
        console.log('Generating new prices...');
        for (const asset in gameState.assetPrices) {
            // Simple random price change between -10% and +15%
            const changePercent = -0.1 + Math.random() * 0.25;
            const newPrice = gameState.assetPrices[asset] * (1 + changePercent);
            gameState.assetPrices[asset] = newPrice;

            // Add to price history
            if (!gameState.priceHistory[asset]) {
                gameState.priceHistory[asset] = [];
            }
            gameState.priceHistory[asset].push(newPrice);
        }

        // Update CPI
        const cpiChange = -0.01 + Math.random() * 0.04; // Between -1% and 3%
        gameState.CPI = gameState.CPI * (1 + cpiChange);
        gameState.CPIHistory.push(gameState.CPI);

        // Calculate portfolio value
        const portfolioValue = calculatePortfolioValue();
        console.log('Portfolio value calculated:', portfolioValue);

        // Add to portfolio value history
        if (!playerState.portfolioValueHistory) {
            playerState.portfolioValueHistory = [];
        }
        playerState.portfolioValueHistory[gameState.roundNumber] = portfolioValue + playerState.cash;

        // Update UI
        console.log('Updating UI...');
        updateUI();

        // Check if game is over
        if (gameState.roundNumber >= gameState.maxRounds) {
            console.log('Game is over, calling endGame()');
            if (typeof window.endGame === 'function') {
                window.endGame();
            }
        }

        // Save game state
        console.log('Saving game state...');
        if (window.gameSession && window.gameSupabase) {
            // Save to Supabase
            window.gameSupabase.updatePlayerState(window.gameSession.id, playerState);

            // Create next round state in Supabase
            window.gameSupabase.createNextRoundState(window.gameSession.id, gameState);
        } else {
            // Save to local storage
            saveGameState();
        }

        // Show notification
        window.showNotification(`Advanced to round ${gameState.roundNumber}`, 'success');

        console.log('nextRound function completed successfully');
    } catch (error) {
        console.error('Error in nextRound function:', error);
        window.showNotification('Error advancing to next round', 'danger');
    }
};

// Alias for nextRound
window.advanceToNextRound = window.nextRound;

// Initialize event listeners
window.initializeEventListeners = function() {
    console.log('Initializing event listeners');

    // Add event listener for the next round button
    const nextRoundBtn = document.getElementById('next-round-btn');
    if (nextRoundBtn) {
        console.log('Adding event listener to next-round-btn');
        nextRoundBtn.addEventListener('click', function() {
            console.log('Next round button clicked');
            if (typeof window.nextRound === 'function') {
                window.nextRound();
            } else if (typeof window.advanceToNextRound === 'function') {
                window.advanceToNextRound();
            } else if (typeof advanceToNextRound === 'function') {
                advanceToNextRound();
            } else {
                console.error('No next round function found');
                window.showNotification('Error: Could not advance to next round', 'danger');
            }
        });
    } else {
        console.warn('next-round-btn not found');
    }

    // Add event listener for the sticky next round button
    const stickyNextRoundBtn = document.getElementById('sticky-next-round');
    if (stickyNextRoundBtn) {
        console.log('Adding event listener to sticky-next-round');
        stickyNextRoundBtn.addEventListener('click', function() {
            console.log('Sticky next round button clicked');
            if (typeof window.nextRound === 'function') {
                window.nextRound();
            } else if (typeof window.advanceToNextRound === 'function') {
                window.advanceToNextRound();
            } else if (typeof advanceToNextRound === 'function') {
                advanceToNextRound();
            } else {
                console.error('No next round function found');
                window.showNotification('Error: Could not advance to next round', 'danger');
            }
        });
    } else {
        console.warn('sticky-next-round not found');
    }

    // Add event listeners for trade buttons
    document.querySelectorAll('.trade-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const asset = this.getAttribute('data-asset');
            const action = this.classList.contains('buy') ? 'buy' : 'sell';
            showTradePanel(asset, action);
        });
    });

    // Add event listeners for asset information
    document.querySelectorAll('.asset-name').forEach(element => {
        element.style.cursor = 'pointer';
        element.title = 'Click for asset information';
        element.addEventListener('click', function() {
            const asset = this.parentElement.getAttribute('data-asset');
            showAssetInfo(asset);
        });
    });

    // Add event listeners for closing modals
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });

    // Add event listener for the trade history button
    const viewHistoryBtn = document.getElementById('view-history-btn');
    if (viewHistoryBtn) {
        viewHistoryBtn.addEventListener('click', function() {
            document.getElementById('trade-history-modal').style.display = 'block';
        });
    }

    // Add event listener for the correlation matrix button
    const viewCorrelationBtn = document.getElementById('view-correlation-btn');
    if (viewCorrelationBtn) {
        viewCorrelationBtn.addEventListener('click', function() {
            document.getElementById('correlation-modal').style.display = 'block';
        });
    }

    // Add event listener for the debug trade panel button
    const debugTradeBtn = document.getElementById('debug-trade-btn');
    if (debugTradeBtn) {
        debugTradeBtn.addEventListener('click', function() {
            console.log('Debug trade panel button clicked');
            window.debugShowTradePanel();
            // Also set up the trade panel with some default values
            const assetNameElement = document.getElementById('trade-asset-name');
            if (assetNameElement) {
                assetNameElement.textContent = 'Gold';
            }
            window.updateTradeSummary();
        });
    }

    // Add event listener for the back button
    const backToWelcomeBtn = document.getElementById('back-to-welcome');
    if (backToWelcomeBtn) {
        backToWelcomeBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to exit the game?')) {
                document.getElementById('game-screen').style.display = 'none';
                document.getElementById('welcome-screen').style.display = 'block';

                // Hide sticky next round button
                const stickyNextRoundBtn = document.getElementById('sticky-next-round');
                if (stickyNextRoundBtn) {
                    stickyNextRoundBtn.style.display = 'none';
                }
            }
        });
    }

    // Add event listener for the start game button
    const startGameBtn = document.getElementById('start-game');
    if (startGameBtn) {
        startGameBtn.addEventListener('click', startGame);
    }

    // Add event listener for the restart game button
    const restartGameBtn = document.getElementById('restart-game');
    if (restartGameBtn) {
        restartGameBtn.addEventListener('click', restartGame);
    }

    // Add event listeners for trading form
    initializeTradeFormListeners();

    // Add event listeners for portfolio actions
    initializePortfolioActionListeners();
}

// Initialize trade form listeners
window.initializeTradeFormListeners = function() {
    console.log('Initializing trade form listeners');

    // Add event listeners for select asset buttons
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('select-asset-btn')) {
            console.log('Select asset button clicked:', event.target);
            const asset = event.target.getAttribute('data-asset');
            console.log(`Select asset button clicked for ${asset}`);

            // Set the asset in the dropdown
            const assetSelect = document.getElementById('trade-asset-select');
            if (assetSelect) {
                assetSelect.value = asset;
                assetSelect.dispatchEvent(new Event('change'));
            }

            // Scroll to the trading panel
            const tradingPanel = document.querySelector('.col-md-8.mb-3');
            if (tradingPanel) {
                tradingPanel.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });

    // Initialize trade form controls
    window.initializeTradeFormControls();

    // Initialize trade panel with advanced controls
    window.initializeTradePanel();

    // Add event listener for asset selection dropdown
    const assetSelect = document.getElementById('trade-asset-select');
    if (assetSelect) {
        assetSelect.addEventListener('change', function() {
            const asset = this.value;
            if (asset) {
                // Update current price display
                const price = gameState.assetPrices[asset] || 0;
                const currentPriceDisplay = document.getElementById('current-price-display');
                if (currentPriceDisplay) {
                    currentPriceDisplay.textContent = price.toFixed(2);
                }

                // Update trade summary
                if (typeof window.updateTradeSummary === 'function') {
                    window.updateTradeSummary();
                }
            }
        });
    }
};

// Initialize trade panel with advanced controls
window.initializeTradePanel = function() {
    try {
        console.log('Initializing trade panel with advanced controls...');

        // Reset the updating flag to prevent infinite loops
        window._updatingTradeFields = false;

        const tradePanel = document.querySelector('.trade-panel');
        const cancelTradeBtn = document.getElementById('cancel-trade-btn');
        const executeTradeBtn = document.getElementById('execute-trade-btn');
        const tradeQuantity = document.getElementById('trade-quantity');
        const tradeAmount = document.getElementById('trade-amount');
        const tradeAction = document.getElementById('trade-action');
        const assetSelect = document.getElementById('trade-asset-select');
        const quantitySlider = document.getElementById('quantity-slider');
        const amountSlider = document.getElementById('amount-slider');
        const quantityPercentage = document.getElementById('quantity-percentage');
        const amountPercentage = document.getElementById('amount-percentage');
        const quantityPercentButtons = document.querySelectorAll('.quantity-percent-btn');
        const amountPercentButtons = document.querySelectorAll('.amount-percent-btn');

        if (!tradePanel) {
            console.error('Trade panel not found');
            return;
        }

        console.log('Trade panel elements found, adding event listeners...');

        // Add event listener for asset selection dropdown
        if (assetSelect) {
            assetSelect.addEventListener('change', function() {
                const asset = this.value;
                if (asset) {
                    console.log(`Asset selected: ${asset}`);

                    // Update current price display
                    const price = gameState.assetPrices[asset] || 0;
                    const currentPriceDisplay = document.getElementById('current-price-display');
                    if (currentPriceDisplay) {
                        currentPriceDisplay.textContent = price.toFixed(2);
                    }

                    // Update trade summary
                    if (typeof window.updateTradeSummary === 'function') {
                        window.updateTradeSummary();
                    } else if (typeof updateTradeSummary === 'function') {
                        updateTradeSummary();
                    }
                }
            });
        }

        // Add event listener to cancel button
        if (cancelTradeBtn) {
            cancelTradeBtn.addEventListener('click', function() {
                tradePanel.style.display = 'none';
            });
        }

        // Add event listener to execute button
        if (executeTradeBtn) {
            executeTradeBtn.addEventListener('click', function() {
                if (typeof window.executeTrade === 'function') {
                    window.executeTrade();
                } else if (typeof executeTrade === 'function') {
                    executeTrade();
                }
            });
        }

        // Add event listeners for quantity input
        if (tradeQuantity) {
            tradeQuantity.addEventListener('input', function() {
                try {
                    const quantity = parseFloat(this.value) || 0;
                    const asset = assetSelect ? assetSelect.value : '';
                    if (!asset) {
                        console.log('No asset selected for quantity input');
                        return;
                    }

                    // Get the current price
                    const assetPrices = window.gameState?.assetPrices || window.gameState?.asset_prices ||
                                       gameState?.assetPrices || gameState?.asset_prices || {};
                    const price = assetPrices[asset] || 0;

                    if (price <= 0) {
                        console.log(`Invalid price (${price}) for ${asset}`);
                        return;
                    }

                    console.log(`Quantity input changed: ${quantity} for ${asset} at $${price}`);

                    // Update amount - IMPORTANT: This is the key bidirectional connection
                    if (tradeAmount && price > 0) {
                        // Set a flag to prevent infinite loop
                        if (!window._updatingTradeFields) {
                            window._updatingTradeFields = true;

                            // Calculate the amount based on quantity
                            const amount = quantity * price;
                            tradeAmount.value = amount.toFixed(2);
                            console.log(`Updated amount to: ${tradeAmount.value}`);

                            // Update sliders and percentage inputs
                            if (typeof window.updateTradeSliders === 'function') {
                                window.updateTradeSliders();
                            }

                            // Update trade summary
                            if (typeof window.updateTradeSummary === 'function') {
                                window.updateTradeSummary();
                            } else if (typeof updateTradeSummary === 'function') {
                                updateTradeSummary();
                            }

                            // Clear the flag after a short delay
                            setTimeout(() => {
                                window._updatingTradeFields = false;
                            }, 50);
                        }
                    }
                } catch (error) {
                    console.error('Error in quantity input handler:', error);
                    window._updatingTradeFields = false;
                }
            });
        }

        // Add event listeners for amount input
        if (tradeAmount) {
            tradeAmount.addEventListener('input', function() {
                try {
                    const amount = parseFloat(this.value) || 0;
                    const asset = assetSelect ? assetSelect.value : '';
                    if (!asset) {
                        console.log('No asset selected for amount input');
                        return;
                    }

                    // Get the current price
                    const assetPrices = window.gameState?.assetPrices || window.gameState?.asset_prices ||
                                       gameState?.assetPrices || gameState?.asset_prices || {};
                    const price = assetPrices[asset] || 0;

                    if (price <= 0) {
                        console.log(`Invalid price (${price}) for ${asset}`);
                        return;
                    }

                    console.log(`Amount input changed: $${amount} for ${asset} at $${price}`);

                    // Update quantity - IMPORTANT: This is the key bidirectional connection
                    if (tradeQuantity && price > 0) {
                        // Set a flag to prevent infinite loop
                        if (!window._updatingTradeFields) {
                            window._updatingTradeFields = true;

                            // Calculate the quantity based on amount
                            const quantity = amount / price;
                            tradeQuantity.value = quantity.toFixed(6);
                            console.log(`Updated quantity to: ${tradeQuantity.value}`);

                            // Update sliders and percentage inputs
                            if (typeof window.updateTradeSliders === 'function') {
                                window.updateTradeSliders();
                            }

                            // Update trade summary
                            if (typeof window.updateTradeSummary === 'function') {
                                window.updateTradeSummary();
                            } else if (typeof updateTradeSummary === 'function') {
                                updateTradeSummary();
                            }

                            // Clear the flag after a short delay
                            setTimeout(() => {
                                window._updatingTradeFields = false;
                            }, 50);
                        }
                    }
                } catch (error) {
                    console.error('Error in amount input handler:', error);
                    window._updatingTradeFields = false;
                }
            });
        }

        // Add event listeners for action change
        if (tradeAction) {
            tradeAction.addEventListener('change', function() {
                // Reset inputs
                if (tradeQuantity) tradeQuantity.value = '';
                if (tradeAmount) tradeAmount.value = '';
                if (quantitySlider) quantitySlider.value = 0;
                if (amountSlider) amountSlider.value = 0;
                if (quantityPercentage) quantityPercentage.value = 0;
                if (amountPercentage) amountPercentage.value = 0;

                // Update trade summary
                if (typeof window.updateTradeSummary === 'function') {
                    window.updateTradeSummary();
                } else if (typeof updateTradeSummary === 'function') {
                    updateTradeSummary();
                }
            });
        }

        // Add event listeners for quantity slider
        if (quantitySlider) {
            quantitySlider.addEventListener('input', function() {
                const percent = parseInt(this.value);
                if (quantityPercentage) quantityPercentage.value = percent;

                const action = tradeAction.value;
                const asset = assetSelect ? assetSelect.value : '';

                if (!asset) {
                    console.log('No asset selected for quantity slider');
                    return;
                }

                if (action === 'sell') {
                    // Set percentage of available asset
                    const availableQuantity = playerState?.portfolio?.[asset] || 0;
                    if (tradeQuantity) {
                        tradeQuantity.value = (availableQuantity * (percent / 100)).toFixed(6);
                        console.log(`Set quantity to ${percent}% of ${availableQuantity}: ${tradeQuantity.value}`);
                    }

                    // Trigger input event to update other fields
                    if (tradeQuantity) {
                        tradeQuantity.dispatchEvent(new Event('input'));
                    }
                }
            });
        }

        // Add event listeners for amount slider
        if (amountSlider) {
            amountSlider.addEventListener('input', function() {
                const percent = parseInt(this.value);
                if (amountPercentage) amountPercentage.value = percent;

                const action = tradeAction.value;
                const asset = assetSelect ? assetSelect.value : '';

                if (!asset) {
                    console.log('No asset selected for amount slider');
                    return;
                }

                if (action === 'buy') {
                    // Set percentage of available cash
                    const availableCash = playerState?.cash || 0;
                    if (tradeAmount) {
                        tradeAmount.value = (availableCash * (percent / 100)).toFixed(2);
                        console.log(`Set amount to ${percent}% of $${availableCash}: $${tradeAmount.value}`);
                    }

                    // Trigger input event to update other fields
                    if (tradeAmount) {
                        tradeAmount.dispatchEvent(new Event('input'));
                    }
                }
            });
        }

        // Add event listeners for quantity percentage input
        if (quantityPercentage) {
            quantityPercentage.addEventListener('input', function() {
                const percent = parseInt(this.value) || 0;
                if (quantitySlider) quantitySlider.value = percent;

                const action = tradeAction.value;
                const asset = assetSelect ? assetSelect.value : '';

                if (!asset) {
                    console.log('No asset selected for quantity percentage');
                    return;
                }

                if (action === 'sell') {
                    // Set percentage of available asset
                    const availableQuantity = playerState?.portfolio?.[asset] || 0;
                    if (tradeQuantity) {
                        tradeQuantity.value = (availableQuantity * (percent / 100)).toFixed(6);
                        console.log(`Set quantity to ${percent}% of ${availableQuantity}: ${tradeQuantity.value}`);
                    }

                    // Trigger input event to update other fields
                    if (tradeQuantity) {
                        tradeQuantity.dispatchEvent(new Event('input'));
                    }
                }
            });
        }

        // Add event listeners for amount percentage input
        if (amountPercentage) {
            amountPercentage.addEventListener('input', function() {
                const percent = parseInt(this.value) || 0;
                if (amountSlider) amountSlider.value = percent;

                const action = tradeAction.value;
                const asset = assetSelect ? assetSelect.value : '';

                if (!asset) {
                    console.log('No asset selected for amount percentage');
                    return;
                }

                if (action === 'buy') {
                    // Set percentage of available cash
                    const availableCash = playerState?.cash || 0;
                    if (tradeAmount) {
                        tradeAmount.value = (availableCash * (percent / 100)).toFixed(2);
                        console.log(`Set amount to ${percent}% of $${availableCash}: $${tradeAmount.value}`);
                    }

                    // Trigger input event to update other fields
                    if (tradeAmount) {
                        tradeAmount.dispatchEvent(new Event('input'));
                    }
                }
            });
        }

        // Add event listeners for quantity percentage buttons
        quantityPercentButtons.forEach(button => {
            button.addEventListener('click', function() {
                const percent = parseInt(this.getAttribute('data-percent'));
                if (quantityPercentage) {
                    quantityPercentage.value = percent;
                    quantityPercentage.dispatchEvent(new Event('input'));
                }
            });
        });

        // Add event listeners for amount percentage buttons
        amountPercentButtons.forEach(button => {
            button.addEventListener('click', function() {
                const percent = parseInt(this.getAttribute('data-percent'));
                if (amountPercentage) {
                    amountPercentage.value = percent;
                    amountPercentage.dispatchEvent(new Event('input'));
                }
            });
        });

        console.log('Trade panel initialized successfully');
    } catch (error) {
        console.error('Error initializing trade panel:', error);
    }
}

// Update trade sliders based on current inputs
window.updateTradeSliders = function() {
    try {
        const tradeQuantity = document.getElementById('trade-quantity');
        const tradeAmount = document.getElementById('trade-amount');
        const tradeAction = document.getElementById('trade-action');
        const assetSelect = document.getElementById('trade-asset-select');
        const quantitySlider = document.getElementById('quantity-slider');
        const amountSlider = document.getElementById('amount-slider');
        const quantityPercentage = document.getElementById('quantity-percentage');
        const amountPercentage = document.getElementById('amount-percentage');

        if (!tradeAction || !assetSelect) {
            console.log('Missing required elements for updateTradeSliders');
            return;
        }

        const action = tradeAction.value;
        const asset = assetSelect.value;

        if (!asset) {
            console.log('No asset selected');
            return;
        }

        console.log(`Updating trade sliders for ${asset}, action: ${action}`);

        // Update quantity slider and percentage for sell action
        if (action === 'sell' && tradeQuantity && quantitySlider && quantityPercentage) {
            const quantity = parseFloat(tradeQuantity.value) || 0;
            const availableQuantity = playerState.portfolio[asset] || 0;

            if (availableQuantity > 0) {
                const percent = Math.min(100, Math.round((quantity / availableQuantity) * 100));
                quantitySlider.value = percent;
                quantityPercentage.value = percent;
                console.log(`Sell: ${quantity}/${availableQuantity} = ${percent}%`);
            } else {
                console.log(`No ${asset} available to sell`);
            }
        }

        // Update amount slider and percentage for buy action
        if (action === 'buy' && tradeAmount && amountSlider && amountPercentage) {
            const amount = parseFloat(tradeAmount.value) || 0;
            const availableCash = playerState.cash;

            if (availableCash > 0) {
                const percent = Math.min(100, Math.round((amount / availableCash) * 100));
                amountSlider.value = percent;
                amountPercentage.value = percent;
                console.log(`Buy: $${amount}/$${availableCash} = ${percent}%`);
            } else {
                console.log('No cash available to buy');
            }
        }
    } catch (error) {
        console.error('Error updating trade sliders:', error);
    }
}

// Add direct event listeners to all trade buttons
window.addTradeButtonListeners = function() {
    console.log('Adding direct event listeners to trade buttons');
    const tradeButtons = document.querySelectorAll('.trade-btn');
    console.log(`Found ${tradeButtons.length} trade buttons`);

    tradeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const asset = this.getAttribute('data-asset');
            const action = this.classList.contains('buy') ? 'buy' : 'sell';
            console.log(`Direct listener: Trade button clicked for ${asset}, action: ${action}`);
            window.showTradePanel(asset, action);

            // Debug: Check if trade panel is visible after a short delay
            setTimeout(() => {
                const tradePanel = document.querySelector('.trade-panel');
                console.log('Trade panel visibility check:', {
                    display: tradePanel.style.display,
                    zIndex: tradePanel.style.zIndex,
                    visible: tradePanel.style.display !== 'none',
                    computedStyle: window.getComputedStyle(tradePanel).display
                });
            }, 100);
        });
    });
};

// Debug function to show the trade panel directly
window.debugShowTradePanel = function() {
    const tradePanel = document.querySelector('.trade-panel');
    if (tradePanel) {
        tradePanel.style.display = 'block';
        tradePanel.style.zIndex = '9999';
        console.log('Trade panel forced visible');
    } else {
        console.error('Trade panel not found');
    }
};

// Initialize trade form controls
window.initializeTradeFormControls = function() {
    console.log('Initializing trade form controls');

    // Add event listener for trade action change
    const tradeAction = document.getElementById('trade-action');
    if (tradeAction) {
        tradeAction.addEventListener('change', function() {
            window.updateTradeSummary();
        });
    }

    // Add event listener for trade quantity change
    const tradeQuantity = document.getElementById('trade-quantity');
    if (tradeQuantity) {
        tradeQuantity.addEventListener('input', function() {
            window.updateTradeSummary();
        });
    }

    // Add event listeners for quantity shortcuts
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('quantity-btn')) {
            const percent = parseInt(event.target.getAttribute('data-percent'));
            if (!isNaN(percent)) {
                window.setAmountPercentage(percent);
            }
        }
    });

    // Add event listener for execute trade button
    const executeTradeBtn = document.getElementById('execute-trade-btn');
    if (executeTradeBtn) {
        executeTradeBtn.addEventListener('click', function() {
            window.executeTrade();
        });
    }

    // Add event listener for cancel trade button
    const cancelTradeBtn = document.getElementById('cancel-trade-btn');
    if (cancelTradeBtn) {
        cancelTradeBtn.addEventListener('click', function() {
            const tradePanel = document.querySelector('.trade-panel');
            if (tradePanel) {
                tradePanel.style.display = 'none';
            }
        });
    }
};



// Set amount percentage for trade
window.setAmountPercentage = function(percentage) {
    try {
        console.log(`Setting amount percentage to ${percentage}%`);

        // Get the trade panel elements
        const assetSelect = document.getElementById('trade-asset-select');
        const action = document.getElementById('trade-action').value;
        const quantityInput = document.getElementById('trade-quantity');
        const amountInput = document.getElementById('trade-amount');
        const amountSlider = document.getElementById('amount-slider');
        const amountPercentage = document.getElementById('amount-percentage');

        if (!assetSelect || !quantityInput) {
            console.error('Missing required elements for setAmountPercentage');
            return;
        }

        const assetName = assetSelect.value;
        if (!assetName) {
            console.error('No asset selected');
            return;
        }

        // Only apply to buy actions
        if (action !== 'buy') {
            console.log('setAmountPercentage only applies to buy actions');
            return;
        }

        // Get asset price
        const assetPrices = window.gameState?.assetPrices || window.gameState?.asset_prices ||
                           gameState?.assetPrices || gameState?.asset_prices || {};
        const price = assetPrices[assetName] || 0;

        if (price <= 0) {
            console.error('Invalid asset price');
            return;
        }

        // Calculate amount based on percentage of cash
        const cash = playerState?.cash || 0;
        const amount = cash * (percentage / 100);

        // Update amount input
        if (amountInput) {
            amountInput.value = amount.toFixed(2);
        }

        // Update amount slider and percentage
        if (amountSlider) {
            amountSlider.value = percentage;
        }

        if (amountPercentage) {
            amountPercentage.value = percentage;
        }

        // Calculate quantity based on amount
        const quantity = amount / price;

        // Update quantity input
        if (quantityInput) {
            quantityInput.value = quantity.toFixed(6);
        }

        // Update trade summary
        if (typeof window.updateTradeSummary === 'function') {
            window.updateTradeSummary();
        } else if (typeof updateTradeSummary === 'function') {
            updateTradeSummary();
        }

        console.log(`Set amount to ${percentage}% of $${cash}: $${amount.toFixed(2)} (${quantity.toFixed(6)} units)`);
    } catch (error) {
        console.error('Error in setAmountPercentage:', error);
    }
};


// Show notification message
window.showNotification = function(message, type = 'info', duration = 5000) {
    console.log(`Showing notification: ${message} (${type})`);

    // Create notification container if it doesn't exist
    let notificationContainer = document.getElementById('notification-container');

    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.top = '20px';
        notificationContainer.style.right = '20px';
        notificationContainer.style.zIndex = '9999';
        notificationContainer.style.maxWidth = '350px';
        document.body.appendChild(notificationContainer);
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show`;
    notification.role = 'alert';
    notification.style.marginBottom = '10px';
    notification.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';

    // Add notification content
    notification.innerHTML = `
        <div>${message}</div>
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    `;

    // Add notification to container
    notificationContainer.appendChild(notification);

    // Auto-remove notification after duration
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, duration);

    // Add click event to close button
    const closeButton = notification.querySelector('.close');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
    }
};

// Update trade history display
window.updateTradeHistory = function() {
    try {
        console.log('Updating trade history display...');

        // Get the trade history container
        const tradeHistoryContainer = document.getElementById('trade-history-container');
        if (!tradeHistoryContainer) {
            console.error('Trade history container not found');
            return;
        }

        // Clear existing content
        tradeHistoryContainer.innerHTML = '';

        // Get trade history from player state
        let tradeHistory = [];

        // Check both possible property names
        if (playerState?.tradeHistory && Array.isArray(playerState.tradeHistory)) {
            tradeHistory = playerState.tradeHistory;
        } else if (playerState?.trade_history && Array.isArray(playerState.trade_history)) {
            tradeHistory = playerState.trade_history;
        }

        if (tradeHistory.length === 0) {
            tradeHistoryContainer.innerHTML = '<p class="text-center">No trades yet.</p>';
            return;
        }

        // Sort trade history by timestamp (newest first)
        tradeHistory.sort((a, b) => {
            const timeA = new Date(a.timestamp);
            const timeB = new Date(b.timestamp);
            return timeB - timeA;
        });

        // Create table
        const table = document.createElement('table');
        table.className = 'table table-striped table-sm';

        // Create table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Round</th>
                <th>Asset</th>
                <th>Action</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
            </tr>
        `;
        table.appendChild(thead);

        // Create table body
        const tbody = document.createElement('tbody');

        // Add rows for each trade
        tradeHistory.forEach(trade => {
            const row = document.createElement('tr');

            // Get the round number
            const round = trade.round || 0;

            // Get the action and set the appropriate class
            const action = trade.action || '';
            const actionClass = action === 'buy' ? 'text-success' : 'text-danger';

            // Get the total value
            const total = trade.cost || trade.value || (trade.price * trade.quantity) || 0;

            // Format the row
            row.innerHTML = `
                <td>${round}</td>
                <td>${trade.asset || ''}</td>
                <td class="${actionClass}">${action.toUpperCase()}</td>
                <td>${parseFloat(trade.quantity).toFixed(6)}</td>
                <td>$${parseFloat(trade.price).toFixed(2)}</td>
                <td>$${parseFloat(total).toFixed(2)}</td>
            `;

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        tradeHistoryContainer.appendChild(table);

        console.log(`Trade history updated with ${tradeHistory.length} trades`);
    } catch (error) {
        console.error('Error updating trade history:', error);
    }
};

// Initialize portfolio action listeners
window.initializePortfolioActionListeners = function() {
    console.log('Initializing portfolio action listeners');

    // Buy all assets button
    const buyAllBtn = document.getElementById('buy-all-btn');
    if (buyAllBtn) {
        buyAllBtn.addEventListener('click', function() {
            console.log('Buy all assets button clicked');
            if (typeof window.buyAllAssets === 'function') {
                window.buyAllAssets();
            } else if (typeof buyAllAssets === 'function') {
                buyAllAssets();
            }
        });
    }

    // Buy selected assets button
    const buySelectedBtn = document.getElementById('buy-selected-btn');
    if (buySelectedBtn) {
        buySelectedBtn.addEventListener('click', function() {
            console.log('Buy selected assets button clicked');
            if (typeof window.buySelectedAssets === 'function') {
                window.buySelectedAssets();
            } else if (typeof buySelectedAssets === 'function') {
                buySelectedAssets();
            }
        });
    }

    // Sell all assets button
    const sellAllBtn = document.getElementById('sell-all-btn');
    if (sellAllBtn) {
        sellAllBtn.addEventListener('click', function() {
            console.log('Sell all assets button clicked');
            if (typeof window.sellAllAssets === 'function') {
                window.sellAllAssets();
            } else if (typeof sellAllAssets === 'function') {
                sellAllAssets();
            }
        });
    }

    // Select all assets button
    const selectAllBtn = document.getElementById('select-all-assets-btn');
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', function() {
            console.log('Select all assets button clicked');
            document.querySelectorAll('.diversify-asset').forEach(checkbox => {
                checkbox.checked = true;
            });
        });
    }

    // Deselect all assets button
    const deselectAllBtn = document.getElementById('deselect-all-assets-btn');
    if (deselectAllBtn) {
        deselectAllBtn.addEventListener('click', function() {
            console.log('Deselect all assets button clicked');
            document.querySelectorAll('.diversify-asset').forEach(checkbox => {
                checkbox.checked = false;
            });
        });
    }

    // Add event listeners for portfolio action buttons
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('portfolio-action-btn')) {
            const asset = event.target.getAttribute('data-asset');
            const action = event.target.getAttribute('data-action');
            window.showTradePanel(asset, action);
        }
    });
}


