// UI Functions for Investment Odyssey

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
    updateAssetPriceCharts();
    updateCPIChart();

    // Update asset price in trade form
    updateAssetPrice();

    // Update cash display
    document.getElementById('cash-display').textContent = playerState.cash.toFixed(2);

    // Update portfolio value display
    const portfolioValue = calculatePortfolioValue();
    document.getElementById('portfolio-value-display').textContent = portfolioValue.toFixed(2);
    document.getElementById('portfolio-value-badge').textContent = portfolioValue.toFixed(2);

    // Update total value display
    document.getElementById('total-value-display').textContent = (playerState.cash + portfolioValue).toFixed(2);

    // Update CPI display
    const cpiDisplay = document.getElementById('cpi-display');
    if (cpiDisplay) {
        cpiDisplay.textContent = gameState.CPI.toFixed(2);
    }
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
        const priceHistory = gameState.priceHistory[asset] || [];
        const previousPrice = priceHistory.length > 1 ? priceHistory[priceHistory.length - 2] : price;

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

    // Add total row
    const totalRow = document.createElement('tr');
    totalRow.className = 'table-active font-weight-bold';

    totalRow.innerHTML = `
        <td>Total</td>
        <td>-</td>
        <td>-</td>
        <td>$${totalValue.toFixed(2)}</td>
        <td>100.00%</td>
    `;

    tableBody.appendChild(totalRow);
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
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
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
                maintainAspectRatio: false,
                plugins: {
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
                maintainAspectRatio: false,
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
                maintainAspectRatio: false,
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
                maintainAspectRatio: false,
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
                maintainAspectRatio: false,
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
}

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
