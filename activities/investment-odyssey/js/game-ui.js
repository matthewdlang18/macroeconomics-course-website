// UI Functions for Investment Odyssey

// Update UI
function updateUI() {
    try {
        console.log('Starting updateUI function');

        // Update asset prices table
        console.log('Updating asset prices table...');
        updateAssetPricesTable();

        // Update portfolio table
        console.log('Updating portfolio table...');
        updatePortfolioTable();

        // Update price ticker
        console.log('Updating price ticker...');
        updatePriceTicker();

        // Update charts
        console.log('Updating charts...');
        updatePortfolioChart();
        updatePortfolioAllocationChart();
        updateAssetPriceCharts();
        updateCPIChart();
        updateComparativeReturnsChart();

        // Update asset price in trade form
        console.log('Updating asset price in trade form...');
        updateAssetPrice();

        // Helper function to safely update element text
        const updateElementText = (id, text) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = text;
                console.log(`Updated ${id} to ${text}`);
            } else {
                console.log(`Element ${id} not found`);
            }
        };

        // Update cash display
        updateElementText('cash-display', playerState.cash.toFixed(2));

        // Update portfolio value display
        const portfolioValue = calculatePortfolioValue();
        updateElementText('portfolio-value-display', portfolioValue.toFixed(2));
        updateElementText('portfolio-value-badge', portfolioValue.toFixed(2));

        // Update total value display
        updateElementText('total-value-display', (playerState.cash + portfolioValue).toFixed(2));

        // Update CPI display
        updateElementText('cpi-display', gameState.CPI.toFixed(2));

        // Market statistics removed

        console.log('updateUI function completed successfully');
    } catch (error) {
        console.error('Error in updateUI function:', error);
    }
}

// Previous asset prices for animation
let previousAssetPrices = {};

// Store the last round's prices to calculate round-to-round changes
let lastRoundPrices = {};

// Flag to track if we're updating after a round change
let isRoundUpdate = false;

// Store the round number when lastRoundPrices was last updated
let lastPricesRoundNumber = 0;

// Update asset prices table
function updateAssetPricesTable() {
    const tableBody = document.getElementById('asset-prices-table');
    if (!tableBody) return;

    // Store current prices for animation if this is not the first update
    if (Object.keys(previousAssetPrices).length === 0) {
        // First time - initialize previous prices
        for (const [asset, price] of Object.entries(gameState.assetPrices)) {
            previousAssetPrices[asset] = price;
        }
    }

    // Check if table is empty (first render)
    const isFirstRender = tableBody.children.length === 0;

    if (isFirstRender) {
        // Clear and create rows for first render
        tableBody.innerHTML = '';

        // Add rows for each asset
        for (const [asset, price] of Object.entries(gameState.assetPrices)) {
            const row = document.createElement('tr');
            row.id = `asset-row-${asset.replace(/[^a-zA-Z0-9]/g, '-')}`;

            // Check if we need to update lastRoundPrices
            if (gameState.roundNumber > lastPricesRoundNumber) {
                // We've moved to a new round, update lastRoundPrices
                lastRoundPrices = {...gameState.assetPrices};
                lastPricesRoundNumber = gameState.roundNumber;
            }

            // Get previous price from lastRoundPrices to maintain consistent change display
            const prevPrice = lastRoundPrices[asset] || price;

            // Calculate change based on last round's price
            const change = price - prevPrice;
            const percentChange = (change / prevPrice) * 100;

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
                <td class="price-cell" id="price-${asset.replace(/[^a-zA-Z0-9]/g, '-')}">$${price.toFixed(2)}</td>
                <td class="${changeClass}" id="change-${asset.replace(/[^a-zA-Z0-9]/g, '-')}">${changeIcon}${change.toFixed(2)} (${percentChange.toFixed(2)}%)</td>
                <td><canvas id="${chartId}" width="100" height="30"></canvas></td>
            `;

            tableBody.appendChild(row);

            // Create mini chart
            createMiniChart(chartId, asset);
        }
    } else {
        // Update existing rows with animation
        for (const [asset, price] of Object.entries(gameState.assetPrices)) {
            const assetId = asset.replace(/[^a-zA-Z0-9]/g, '-');
            const priceCell = document.getElementById(`price-${assetId}`);
            const changeCell = document.getElementById(`change-${assetId}`);

            if (!priceCell || !changeCell) continue;

            // Check if we need to update lastRoundPrices
            if (gameState.roundNumber > lastPricesRoundNumber) {
                // We've moved to a new round, update lastRoundPrices
                lastRoundPrices = {...gameState.assetPrices};
                lastPricesRoundNumber = gameState.roundNumber;
            }

            // Get previous price from lastRoundPrices to maintain consistent change display
            const prevPrice = lastRoundPrices[asset] || price;

            // Calculate change based on last round's price
            const change = price - prevPrice;
            const percentChange = (change / prevPrice) * 100;

            // Create change class and animation
            let changeClass = 'text-secondary';
            let changeIcon = '';
            let animationClass = '';

            if (change > 0) {
                changeClass = 'text-success';
                changeIcon = '<i class="fas fa-arrow-up mr-1"></i>';
                animationClass = 'price-up';
            } else if (change < 0) {
                changeClass = 'text-danger';
                changeIcon = '<i class="fas fa-arrow-down mr-1"></i>';
                animationClass = 'price-down';
            }

            // Update price with animation
            // We still use the previousAssetPrices for animation purposes
            const animationChange = price - previousAssetPrices[asset];
            let animClass = '';

            // Determine animation class based on magnitude of change
            if (animationChange > 0) {
                // Positive change - green animation
                const magnitude = Math.min(Math.abs(animationChange) / previousAssetPrices[asset], 0.1);
                const intensity = Math.floor(magnitude * 10);
                animClass = `price-up price-up-${intensity}`;
            } else if (animationChange < 0) {
                // Negative change - red animation
                const magnitude = Math.min(Math.abs(animationChange) / previousAssetPrices[asset], 0.1);
                const intensity = Math.floor(magnitude * 10);
                animClass = `price-down price-down-${intensity}`;
            }

            // Apply animation with a slight delay to make it more noticeable
            setTimeout(() => {
                priceCell.innerHTML = `$${price.toFixed(2)}`;
                priceCell.className = `price-cell ${animClass}`;
            }, 50);

            // Update change cell
            changeCell.innerHTML = `${changeIcon}${change.toFixed(2)} (${percentChange.toFixed(2)}%)`;
            changeCell.className = changeClass;

            // Update mini chart
            const chartId = `mini-chart-${assetId}`;
            createMiniChart(chartId, asset);
        }
    }

    // Update previous prices for next animation
    previousAssetPrices = {...gameState.assetPrices};
}

// Create mini chart
function createMiniChart(chartId, asset) {
    const canvas = document.getElementById(chartId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const priceHistory = gameState.priceHistory[asset] || [];

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (priceHistory.length < 2) return;

    // Find min and max values
    const min = Math.min(...priceHistory);
    const max = Math.max(...priceHistory);
    const range = max - min;

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 2;

    for (let i = 0; i < priceHistory.length; i++) {
        const x = (i / (priceHistory.length - 1)) * canvas.width;
        const normalizedPrice = range === 0 ? 0.5 : (priceHistory[i] - min) / range;
        const y = canvas.height - (normalizedPrice * canvas.height);

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }

    ctx.stroke();
}

// Update portfolio table
function updatePortfolioTable() {
    const tableBody = document.getElementById('portfolio-table-body');
    if (!tableBody) return;

    // Clear existing rows
    tableBody.innerHTML = '';

    // Calculate portfolio value
    const portfolioValue = calculatePortfolioValue();

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
            <td>$${value.toFixed(2)}</td>
            <td>${percentage.toFixed(1)}%</td>
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
        <td>$${playerState.cash.toFixed(2)}</td>
        <td>${cashPercentage.toFixed(1)}%</td>
    `;

    tableBody.appendChild(cashRow);

    // Add total row
    const totalRow = document.createElement('tr');
    totalRow.className = 'table-active font-weight-bold';

    totalRow.innerHTML = `
        <td>Total</td>
        <td>-</td>
        <td>$${totalValue.toFixed(2)}</td>
        <td>100%</td>
    `;

    tableBody.appendChild(totalRow);

    // Update cash allocation slider
    updateCashAllocationSlider();
}

// Update price ticker
function updatePriceTicker() {
    const ticker = document.getElementById('price-ticker');
    if (!ticker) return;

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
            changeClass = 'change-positive';
            changeIcon = '▲';
        } else if (change < 0) {
            changeClass = 'change-negative';
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
}

// Update portfolio chart
function updatePortfolioChart() {
    const canvas = document.getElementById('portfolio-chart');
    if (!canvas) return;

    // Get portfolio value history
    const portfolioValueHistory = playerState.portfolioValueHistory;

    // Create labels
    const labels = Object.keys(portfolioValueHistory).map(round => `Round ${round}`);

    // Create data
    const data = Object.values(portfolioValueHistory);

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
                    pointBackgroundColor: 'rgba(0, 123, 255, 1)',
                    pointBorderColor: '#fff',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        },
                        // Set a reasonable min and max for portfolio value
                        suggestedMin: 0,
                        suggestedMax: function() {
                            const maxValue = Math.max(...Object.values(playerState.portfolioValueHistory)) * 1.1;
                            return Math.max(maxValue, 15000); // At least 15000 to start
                        }()
                    }
                },
                plugins: {
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: 'xy'
                        },
                        zoom: {
                            wheel: {
                                enabled: true,
                            },
                            pinch: {
                                enabled: true
                            },
                            mode: 'xy',
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Portfolio Value: $' + context.raw.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }
}

// Update portfolio allocation chart
function updatePortfolioAllocationChart() {
    const canvas = document.getElementById('portfolio-allocation-chart');
    if (!canvas) return;

    // Calculate portfolio value
    const portfolioValue = calculatePortfolioValue();

    // Create labels and data
    const labels = [];
    const data = [];
    const backgroundColor = [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(255, 159, 64, 0.8)',
        'rgba(100, 100, 100, 0.8)'
    ];

    // Add assets
    let index = 0;
    for (const [asset, quantity] of Object.entries(playerState.portfolio)) {
        if (quantity <= 0) continue;

        const price = gameState.assetPrices[asset] || 0;
        const value = price * quantity;

        labels.push(asset);
        data.push(value);
        index++;
    }

    // Add cash
    labels.push('Cash');
    data.push(playerState.cash);

    // Create chart
    if (window.portfolioAllocationChart) {
        window.portfolioAllocationChart.data.labels = labels;
        window.portfolioAllocationChart.data.datasets[0].data = data;
        window.portfolioAllocationChart.update();
    } else {
        const ctx = canvas.getContext('2d');

        window.portfolioAllocationChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColor
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1,
                layout: {
                    padding: {
                        top: 10,
                        bottom: 10,
                        left: 10,
                        right: 10
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            padding: 10,
                            font: {
                                size: 11
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(2) + '%';
                                return context.label + ': $' + value.toLocaleString() + ' (' + percentage + ')';
                            }
                        }
                    }
                }
            }
        });
    }
}

// Update asset price charts
function updateAssetPriceCharts() {
    // Update Real Estate & Gold chart
    updateRealEstateGoldChart();

    // Update Bonds, Commodities & S&P chart
    updateBondsCommoditiesSPChart();

    // Update Bitcoin chart
    updateBitcoinChart();
}

// Update Real Estate & Gold chart
function updateRealEstateGoldChart() {
    const canvas = document.getElementById('real-estate-gold-chart');
    if (!canvas) return;

    // Get price history
    const realEstateHistory = gameState.priceHistory['Real Estate'] || [];
    const goldHistory = gameState.priceHistory['Gold'] || [];

    // Create labels
    const labels = Array.from({ length: Math.max(realEstateHistory.length, goldHistory.length) }, (_, i) => `Round ${i}`);

    // Create chart
    if (window.realEstateGoldChart) {
        window.realEstateGoldChart.data.labels = labels;
        window.realEstateGoldChart.data.datasets[0].data = realEstateHistory;
        window.realEstateGoldChart.data.datasets[1].data = goldHistory;
        window.realEstateGoldChart.update();
    } else {
        const ctx = canvas.getContext('2d');

        window.realEstateGoldChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Real Estate',
                        data: realEstateHistory,
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        borderWidth: 2,
                        fill: false
                    },
                    {
                        label: 'Gold',
                        data: goldHistory,
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
                aspectRatio: 2,
                scales: {
                    y: {
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        },
                        // Set a reasonable min and max for Real Estate & Gold
                        suggestedMin: 0,
                        suggestedMax: function() {
                            const realEstateMax = Math.max(...(gameState.priceHistory['Real Estate'] || [10000])) * 1.1;
                            const goldMax = Math.max(...(gameState.priceHistory['Gold'] || [2000])) * 1.1;
                            return Math.max(realEstateMax, goldMax);
                        }()
                    }
                },
                plugins: {
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: 'xy'
                        },
                        zoom: {
                            wheel: {
                                enabled: true,
                            },
                            pinch: {
                                enabled: true
                            },
                            mode: 'xy',
                        }
                    },
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
}

// Update Bonds, Commodities & S&P chart
function updateBondsCommoditiesSPChart() {
    const canvas = document.getElementById('bonds-commodities-sp-chart');
    if (!canvas) return;

    // Get price history
    const bondsHistory = gameState.priceHistory['Bonds'] || [];
    const commoditiesHistory = gameState.priceHistory['Commodities'] || [];
    const spHistory = gameState.priceHistory['S&P 500'] || [];

    // Create labels
    const labels = Array.from({ length: Math.max(bondsHistory.length, commoditiesHistory.length, spHistory.length) }, (_, i) => `Round ${i}`);

    // Create chart
    if (window.bondsCommoditiesSPChart) {
        window.bondsCommoditiesSPChart.data.labels = labels;
        window.bondsCommoditiesSPChart.data.datasets[0].data = bondsHistory;
        window.bondsCommoditiesSPChart.data.datasets[1].data = commoditiesHistory;
        window.bondsCommoditiesSPChart.data.datasets[2].data = spHistory;
        window.bondsCommoditiesSPChart.update();
    } else {
        const ctx = canvas.getContext('2d');

        window.bondsCommoditiesSPChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Bonds',
                        data: bondsHistory,
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        borderWidth: 2,
                        fill: false
                    },
                    {
                        label: 'Commodities',
                        data: commoditiesHistory,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.1)',
                        borderWidth: 2,
                        fill: false
                    },
                    {
                        label: 'S&P 500',
                        data: spHistory,
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
                aspectRatio: 2,
                scales: {
                    y: {
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        },
                        // Set a reasonable min and max for Bonds, Commodities & S&P
                        suggestedMin: 0,
                        suggestedMax: function() {
                            const bondsMax = Math.max(...(gameState.priceHistory['Bonds'] || [100])) * 1.1;
                            const commoditiesMax = Math.max(...(gameState.priceHistory['Commodities'] || [100])) * 1.1;
                            const spMax = Math.max(...(gameState.priceHistory['S&P 500'] || [100])) * 1.1;
                            return Math.max(bondsMax, commoditiesMax, spMax);
                        }()
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
}

// Update Bitcoin chart
function updateBitcoinChart() {
    const canvas = document.getElementById('bitcoin-chart');
    if (!canvas) return;

    // Get price history
    const bitcoinHistory = gameState.priceHistory['Bitcoin'] || [];

    // Create labels
    const labels = Array.from({ length: bitcoinHistory.length }, (_, i) => `Round ${i}`);

    // Create chart
    if (window.bitcoinChart) {
        window.bitcoinChart.data.labels = labels;
        window.bitcoinChart.data.datasets[0].data = bitcoinHistory;
        window.bitcoinChart.update();
    } else {
        const ctx = canvas.getContext('2d');

        window.bitcoinChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Bitcoin',
                        data: bitcoinHistory,
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
                aspectRatio: 2,
                scales: {
                    y: {
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        },
                        // Set a reasonable min and max for Bitcoin
                        suggestedMin: 0,
                        suggestedMax: function() {
                            const bitcoinMax = Math.max(...(gameState.priceHistory['Bitcoin'] || [50000])) * 1.1;
                            return bitcoinMax;
                        }()
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
}

// Update CPI chart
function updateCPIChart() {
    const canvas = document.getElementById('cpi-chart');
    if (!canvas) return;

    // Get CPI history
    const cpiHistory = gameState.CPIHistory || [];

    // Create labels
    const labels = Array.from({ length: cpiHistory.length }, (_, i) => `Round ${i}`);

    // Create chart
    if (window.cpiChart) {
        window.cpiChart.data.labels = labels;
        window.cpiChart.data.datasets[0].data = cpiHistory;
        window.cpiChart.update();
    } else {
        const ctx = canvas.getContext('2d');

        window.cpiChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'CPI',
                        data: cpiHistory,
                        borderColor: 'rgba(220, 53, 69, 1)',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        borderWidth: 2,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(2);
                            }
                        },
                        // Set a reasonable min and max for CPI
                        suggestedMin: 95,
                        suggestedMax: function() {
                            const maxCPI = Math.max(...(gameState.CPIHistory || [100])) * 1.05;
                            return Math.max(maxCPI, 105); // At least 105 to start
                        }()
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
}

// Market Pulse chart removed

// Update Comparative Returns Chart
function updateComparativeReturnsChart() {
    const canvas = document.getElementById('comparative-returns-chart');
    if (!canvas) return;

    // Create labels for all rounds
    const labels = Array.from({ length: gameState.roundNumber + 1 }, (_, i) => `Round ${i}`);

    // Calculate normalized returns (relative to starting value) for each asset
    const datasets = [];
    const assetNames = Object.keys(gameState.assetPrices);

    // Add CPI to the assets
    assetNames.push('CPI');

    // Create datasets for each asset's performance relative to starting value
    assetNames.forEach((asset, index) => {
        let priceHistory;
        let color;

        if (asset === 'CPI') {
            priceHistory = gameState.CPIHistory || [];
            color = 'rgba(220, 53, 69, 1)';
        } else {
            priceHistory = gameState.priceHistory[asset] || [];
            // Assign colors based on asset
            switch(asset) {
                case 'S&P 500': color = 'rgba(54, 162, 235, 1)'; break;
                case 'Bonds': color = 'rgba(75, 192, 192, 1)'; break;
                case 'Real Estate': color = 'rgba(255, 99, 132, 1)'; break;
                case 'Gold': color = 'rgba(255, 206, 86, 1)'; break;
                case 'Commodities': color = 'rgba(153, 102, 255, 1)'; break;
                case 'Bitcoin': color = 'rgba(255, 159, 64, 1)'; break;
                default: color = `hsl(${index * 30}, 70%, 50%)`;
            }
        }

        if (priceHistory.length === 0) return;

        // Get the starting value
        const startingValue = priceHistory[0];

        // Calculate normalized values (percentage of starting value)
        const normalizedValues = priceHistory.map(price => ((price / startingValue) - 1) * 100);

        datasets.push({
            label: asset,
            data: normalizedValues,
            borderColor: color,
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 2,
            pointHoverRadius: 4,
            hidden: false // All visible by default
        });
    });

    // Create chart
    if (window.comparativeReturnsChart) {
        window.comparativeReturnsChart.data.labels = labels;
        window.comparativeReturnsChart.data.datasets = datasets;
        window.comparativeReturnsChart.update();
    } else {
        const ctx = canvas.getContext('2d');

        window.comparativeReturnsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2.0,
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Return % (from start)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(1) + '%';
                            }
                        }
                    }
                },
                plugins: {
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: 'xy'
                        },
                        zoom: {
                            wheel: {
                                enabled: true,
                            },
                            pinch: {
                                enabled: true
                            },
                            mode: 'xy',
                        }
                    },
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            boxWidth: 15,
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: {
                                size: 11
                            }
                        },
                        maxHeight: 80,
                        align: 'center'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.raw.toFixed(2) + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    // Set up checkbox event listeners
    setupComparativeChartCheckboxes();
}

// Setup checkboxes for the comparative chart
function setupComparativeChartCheckboxes() {
    const checkboxes = [
        document.getElementById('show-sp500'),
        document.getElementById('show-bonds'),
        document.getElementById('show-real-estate'),
        document.getElementById('show-gold'),
        document.getElementById('show-commodities'),
        document.getElementById('show-bitcoin'),
        document.getElementById('show-cpi')
    ];

    // Only set up listeners if they haven't been set up before
    if (!window.checkboxListenersSet) {
        checkboxes.forEach((checkbox, index) => {
            if (!checkbox) return;

            checkbox.addEventListener('change', function() {
                if (window.comparativeReturnsChart && window.comparativeReturnsChart.data.datasets[index]) {
                    window.comparativeReturnsChart.data.datasets[index].hidden = !this.checked;
                    window.comparativeReturnsChart.update();
                }
            });
        });

        window.checkboxListenersSet = true;
    }
}

// Market statistics removed

// Update asset price in trade form
function updateAssetPrice() {
    const assetSelect = document.getElementById('asset-select');
    const currentPriceDisplay = document.getElementById('current-price-display');

    if (!assetSelect || !currentPriceDisplay) return;

    const selectedAsset = assetSelect.value;

    if (selectedAsset) {
        const price = gameState.assetPrices[selectedAsset] || 0;
        currentPriceDisplay.textContent = price.toFixed(2);

        // Update total cost
        updateTotalCost();
    } else {
        currentPriceDisplay.textContent = '0.00';
    }
}

// Update total cost in trade form
function updateTotalCost() {
    const assetSelect = document.getElementById('asset-select');
    const actionSelect = document.getElementById('action-select');
    const quantityInput = document.getElementById('quantity-input');
    const totalCostDisplay = document.getElementById('total-cost-display');

    if (!assetSelect || !actionSelect || !quantityInput || !totalCostDisplay) return;

    const selectedAsset = assetSelect.value;
    const action = actionSelect.value;
    const quantity = parseFloat(quantityInput.value) || 0;

    if (selectedAsset && quantity > 0) {
        const price = gameState.assetPrices[selectedAsset] || 0;
        const totalCost = price * quantity;

        totalCostDisplay.textContent = totalCost.toFixed(2);
    } else {
        totalCostDisplay.textContent = '0.00';
    }
}

// Update cash allocation slider
function updateCashAllocationSlider() {
    const cashPercentage = document.getElementById('cash-percentage');
    const cashPercentageDisplay = document.getElementById('cash-percentage-display');
    const cashAmountDisplay = document.getElementById('cash-amount-display');
    const remainingCashDisplay = document.getElementById('remaining-cash-display');

    if (!cashPercentage || !cashPercentageDisplay || !cashAmountDisplay || !remainingCashDisplay) return;

    // Update the percentage display
    const percentage = cashPercentage.value;
    cashPercentageDisplay.textContent = percentage;

    // Calculate amount to spend and remaining cash
    const amountToSpend = (playerState.cash * percentage / 100).toFixed(2);
    const remainingCash = (playerState.cash - amountToSpend).toFixed(2);

    // Update displays
    cashAmountDisplay.textContent = amountToSpend;
    remainingCashDisplay.textContent = remainingCash;
}

// Quick buy selected asset
function quickBuySelectedAsset() {
    const assetSelect = document.getElementById('asset-select');
    const cashPercentage = document.getElementById('cash-percentage');

    if (!assetSelect || !cashPercentage) return;

    const selectedAsset = assetSelect.value;
    if (!selectedAsset) {
        console.log('Please select an asset first');
        return;
    }

    const percentage = parseInt(cashPercentage.value);
    if (percentage <= 0) {
        console.log('Percentage must be greater than 0');
        return;
    }

    // Calculate amount to spend
    const amountToSpend = playerState.cash * percentage / 100;
    if (amountToSpend <= 0) {
        console.log('Not enough cash available');
        return;
    }

    // Get asset price
    const price = gameState.assetPrices[selectedAsset] || 0;
    if (price <= 0) {
        console.log('Invalid asset price');
        return;
    }

    // Calculate quantity to buy (rounded to 2 decimal places)
    const quantity = Math.floor((amountToSpend / price) * 100) / 100;

    if (quantity <= 0) {
        console.log('Cannot buy less than 0.01 units of the asset');
        return;
    }

    // Execute the trade
    const cost = price * quantity;

    // Update player state
    playerState.cash -= cost;

    if (!playerState.portfolio[selectedAsset]) {
        playerState.portfolio[selectedAsset] = 0;
    }

    playerState.portfolio[selectedAsset] += quantity;

    // Add to trade history
    playerState.tradeHistory.push({
        asset: selectedAsset,
        action: 'buy',
        quantity: quantity,
        price: price,
        cost: cost,
        timestamp: new Date()
    });

    // Update UI
    updateUI();

    // Update trade history list
    updateTradeHistoryList();

    // Save game state
    saveGameState();

    // Trade completed successfully
    console.log(`Successfully bought ${quantity.toFixed(2)} units of ${selectedAsset} for $${cost.toFixed(2)}.`);
}

// Initialize trading form with amount input
document.addEventListener('DOMContentLoaded', function() {
    const assetSelect = document.getElementById('asset-select');
    const actionSelect = document.getElementById('action-select');
    const quantityInput = document.getElementById('quantity-input');
    const amountInput = document.getElementById('amount-input');
    const availableCashDisplay = document.getElementById('available-cash-display');

    // Initialize available cash display
    if (availableCashDisplay && playerState) {
        availableCashDisplay.textContent = formatCurrency(playerState.cash);
    }

    // Add event listener for amount input if it exists
    if (amountInput && quantityInput && assetSelect) {
        amountInput.addEventListener('input', function() {
            const asset = assetSelect.value;
            const price = gameState.assetPrices[asset] || 0;

            if (price > 0) {
                const amount = parseFloat(amountInput.value) || 0;
                const calculatedQuantity = amount / price;
                quantityInput.value = calculatedQuantity.toFixed(6);
                updateTotalCost();
            }
        });

        // Also update amount when quantity changes
        quantityInput.addEventListener('input', function() {
            const asset = assetSelect.value;
            const price = gameState.assetPrices[asset] || 0;

            if (price > 0 && quantityInput === document.activeElement) {
                const quantity = parseFloat(quantityInput.value) || 0;
                const calculatedAmount = quantity * price;
                amountInput.value = calculatedAmount.toFixed(2);
            }
        });
    }
}
