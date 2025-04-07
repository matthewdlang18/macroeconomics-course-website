// Class Game UI Functions for Investment Odyssey

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
    if (playerState.portfolioValueHistory.length === 0 || 
        playerState.portfolioValueHistory[playerState.portfolioValueHistory.length - 1] !== totalValue) {
        playerState.portfolioValueHistory.push(totalValue);
    }
    
    // Create rounds array
    for (let i = 0; i < playerState.portfolioValueHistory.length; i++) {
        rounds.push(i);
    }
    
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
                data: playerState.portfolioValueHistory,
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
        const result = await EconGames.Game.getLeaderboard(sessionInfo.id);
        
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
            if (EconGames.Auth.isLoggedIn() && entry.userId === EconGames.Auth.getSession().userId) {
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
        
        const tableBody = document.getElementById('leaderboard-table');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">
                        <div class="alert alert-danger mb-0">
                            Error loading leaderboard: ${error.message}
                        </div>
                    </td>
                </tr>
            `;
        }
    }
}
