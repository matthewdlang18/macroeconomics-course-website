// Main entry point for Investment Odyssey game

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Investment Odyssey game initializing...');

    // Initialize event listeners for welcome screen
    initializeWelcomeScreen();

    // Check for existing game in local storage
    checkExistingGame();

    // Check if we have user data passed from the parent window
    window.addEventListener('message', (event) => {
        // Verify the origin of the message
        if (event.origin !== window.location.origin) return;

        if (event.data && event.data.type === 'USER_DATA') {
            window.gameSupabase.initializeUser(event.data.userData);
        }
    });

    // If this page is loaded directly (not in an iframe)
    // Try to get user data from localStorage or redirect to login
    if (window.self === window.top) {
        const userData = localStorage.getItem('userData');
        if (userData) {
            try {
                const parsedUserData = JSON.parse(userData);
                // Initialize user data
                window.gameSupabase.initializeUser(parsedUserData);
            } catch (e) {
                console.error('Error parsing user data from localStorage', e);
                redirectToLogin();
            }
        } else {
            redirectToLogin();
        }
    }
});

// Initialize welcome screen event listeners
function initializeWelcomeScreen() {
    const singlePlayerBtn = document.getElementById('single-player-btn');
    const classModeBtn = document.getElementById('class-mode-btn');

    if (singlePlayerBtn) {
        singlePlayerBtn.addEventListener('click', startSinglePlayerGame);
    }

    if (classModeBtn) {
        classModeBtn.addEventListener('click', joinClassGame);
    }
}

// Check for existing game in local storage - now just clears any existing game
function checkExistingGame() {
    try {
        // Clear any existing game data
        localStorage.removeItem('investmentOdysseyGameData');
        return false;
    } catch (error) {
        console.error('Error clearing existing game data:', error);
        return false;
    }
}

// Redirect to login page if no user data is available
function redirectToLogin() {
    window.location.href = '../index.html';
}

// Full loadGameInterface function with dashboard layout
function loadGameInterface() {
    console.log('Loading game interface...');

    // Get the game screen element
    const gameScreen = document.getElementById('game-screen');
    if (!gameScreen) {
        console.error('Game screen element not found');
        return;
    }

    // Calculate portfolio value
    const portfolioValue = calculatePortfolioValue();
    const totalValue = playerState ? playerState.cash + portfolioValue : 10000;

    // Calculate performance metrics
    const initialValue = 10000; // Starting cash
    const totalReturn = totalValue - initialValue;
    const percentReturn = (totalReturn / initialValue) * 100;

    // Create asset rows for the market data table
    let assetRows = '';
    if (gameState && gameState.assetPrices) {
        for (const asset in gameState.assetPrices) {
            const price = gameState.assetPrices[asset];
            const quantity = playerState && playerState.portfolio ? (playerState.portfolio[asset] || 0) : 0;
            const value = price * quantity;
            const percentOfPortfolio = totalValue > 0 ? (value / totalValue * 100) : 0;

            // Get price history for this asset
            const priceHistory = gameState.priceHistory && gameState.priceHistory[asset] ? gameState.priceHistory[asset] : [];
            let priceChange = 0;
            let priceChangePercent = 0;

            if (priceHistory.length > 1) {
                const previousPrice = priceHistory[priceHistory.length - 2];
                priceChange = price - previousPrice;
                priceChangePercent = (priceChange / previousPrice) * 100;
            }

            // Determine if price went up or down
            const changeClass = priceChange >= 0 ? 'positive' : 'negative';
            const changeSymbol = priceChange >= 0 ? '+' : '';

            assetRows += `
                <tr data-asset="${asset}">
                    <td class="asset-name">${asset}</td>
                    <td class="price">$${price.toFixed(2)}</td>
                    <td class="change ${changeClass}">${changeSymbol}${priceChangePercent.toFixed(2)}%</td>
                    <td class="quantity">${quantity.toFixed(2)}</td>
                    <td class="value">$${value.toFixed(2)}</td>
                    <td class="percentage">${percentOfPortfolio.toFixed(2)}%</td>
                    <td>
                        <button class="trade-btn buy" data-asset="${asset}">Buy</button>
                        <button class="trade-btn sell" data-asset="${asset}" ${quantity <= 0 ? 'disabled' : ''}>Sell</button>
                    </td>
                </tr>
            `;
        }
    }

    // Create the asset ticker
    let tickerItems = '';
    if (gameState && gameState.assetPrices) {
        for (const asset in gameState.assetPrices) {
            const price = gameState.assetPrices[asset];
            const priceHistory = gameState.priceHistory && gameState.priceHistory[asset] ? gameState.priceHistory[asset] : [];
            let priceChange = 0;
            let priceChangePercent = 0;

            if (priceHistory.length > 1) {
                const previousPrice = priceHistory[priceHistory.length - 2];
                priceChange = price - previousPrice;
                priceChangePercent = (priceChange / previousPrice) * 100;
            }

            const changeClass = priceChange >= 0 ? 'positive' : 'negative';
            const changeSymbol = priceChange >= 0 ? '+' : '';

            tickerItems += `
                <div class="ticker-item">
                    <span class="ticker-name">${asset}</span>
                    <span class="ticker-price">$${price.toFixed(2)}</span>
                    <span class="ticker-change ${changeClass}">${changeSymbol}${priceChangePercent.toFixed(2)}%</span>
                </div>
            `;
        }
    }

    // Create the full game interface HTML
    gameScreen.innerHTML = `
        <div id="cash-injection-alert" class="alert alert-success" style="display:none; margin-bottom:10px;">
            Cash injection: $<span id="cash-injection-amount"></span>
        </div>
        <!-- Asset Price Ticker -->
        <div class="row mb-3">
            <div class="col-12">
                <div class="ticker-container">
                    <div class="ticker-wrap">
                        <div class="ticker" id="price-ticker">
                            ${tickerItems}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Game Progress -->
        <div class="row mb-3">
            <div class="col-12">
                <div class="card bg-light">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h5 class="mb-0">Game Progress: Round <span id="current-round">${typeof currentRound !== 'undefined' ? currentRound : 0}</span> of ${gameState ? gameState.maxRounds : 20}</h5>
                            </div>
                            <div>
                                <button id="next-round-btn" class="btn btn-success">Next Round</button>
                                <button id="restart-game" class="btn btn-danger ml-2">Start Over <i class="fas fa-redo"></i></button>
                            </div>
                        </div>
                        <div class="progress mt-2">
                            <div id="round-progress" class="progress-bar bg-success" role="progressbar"
                                style="width: ${gameState ? ((typeof currentRound !== 'undefined' ? currentRound : 0) / gameState.maxRounds * 100) : 0}%;"
                                aria-valuenow="${gameState ? ((typeof currentRound !== 'undefined' ? currentRound : 0) / gameState.maxRounds * 100) : 0}"
                                aria-valuemin="0" aria-valuemax="100">
                                ${gameState ? Math.round((typeof currentRound !== 'undefined' ? currentRound : 0) / gameState.maxRounds * 100) : 0}%
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Portfolio Diversification -->
        <div class="row mb-3">
            <div class="col-12">
                <div class="card">
                    <div class="card-header bg-info text-white">
                        <h5 class="mb-0">Portfolio Diversification</h5>
                    </div>
                    <div class="card-body">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <h6 class="mb-2">Select Assets for Diversification</h6>
                                <div class="row">
                                    <div class="col-6">
                                        <div class="custom-control custom-checkbox mb-2">
                                            <input type="checkbox" class="custom-control-input diversify-asset" id="diversify-bitcoin" value="Bitcoin" checked>
                                            <label class="custom-control-label" for="diversify-bitcoin">Bitcoin</label>
                                        </div>
                                        <div class="custom-control custom-checkbox mb-2">
                                            <input type="checkbox" class="custom-control-input diversify-asset" id="diversify-bonds" value="Bonds" checked>
                                            <label class="custom-control-label" for="diversify-bonds">Bonds</label>
                                        </div>
                                        <div class="custom-control custom-checkbox mb-2">
                                            <input type="checkbox" class="custom-control-input diversify-asset" id="diversify-commodities" value="Commodities" checked>
                                            <label class="custom-control-label" for="diversify-commodities">Commodities</label>
                                        </div>
                                    </div>
                                    <div class="col-6">
                                        <div class="custom-control custom-checkbox mb-2">
                                            <input type="checkbox" class="custom-control-input diversify-asset" id="diversify-gold" value="Gold" checked>
                                            <label class="custom-control-label" for="diversify-gold">Gold</label>
                                        </div>
                                        <div class="custom-control custom-checkbox mb-2">
                                            <input type="checkbox" class="custom-control-input diversify-asset" id="diversify-real-estate" value="Real Estate" checked>
                                            <label class="custom-control-label" for="diversify-real-estate">Real Estate</label>
                                        </div>
                                        <div class="custom-control custom-checkbox mb-2">
                                            <input type="checkbox" class="custom-control-input diversify-asset" id="diversify-sp500" value="S&P 500" checked>
                                            <label class="custom-control-label" for="diversify-sp500">S&P 500</label>
                                        </div>
                                    </div>
                                </div>
                                <div class="d-flex justify-content-between mt-2">
                                    <button id="select-all-assets-btn" class="btn btn-outline-secondary btn-sm">Select All</button>
                                    <button id="deselect-all-assets-btn" class="btn btn-outline-secondary btn-sm">Deselect All</button>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <h6 class="mb-2">Diversification Actions</h6>
                                <p class="small text-muted mb-3">Distribute your cash across multiple assets to reduce risk.</p>
                                <div class="d-flex justify-content-between">
                                    <button id="buy-all-btn" class="btn btn-success btn-sm">Distribute Cash Evenly</button>
                                    <button id="buy-selected-btn" class="btn btn-success btn-sm">Distribute to Selected</button>
                                    <button id="sell-all-btn" class="btn btn-danger btn-sm">Sell All Assets</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Market Data Panel -->
        <div class="row mb-3">
            <div class="col-12">
                <div class="card">
                    <div class="card-header bg-dark text-white d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Market Data</h5>
                        <span class="badge badge-danger">Round ${typeof currentRound !== 'undefined' ? currentRound : 0}</span>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-sm table-hover mb-0" id="market-data-table">
                                <thead>
                                    <tr>
                                        <th>Asset</th>
                                        <th>Price</th>
                                        <th>Change</th>
                                        <th>Quantity</th>
                                        <th>Value</th>
                                        <th>% of Portfolio</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${assetRows}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Simple Portfolio Summary (Minimal Version) -->
        <div class="row mb-3">
            <div class="col-12">
                <div class="card">
                    <div class="card-header bg-primary text-white">
                        <h5 class="mb-0">Portfolio Summary</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-3 mb-2">
                                <div class="card bg-light">
                                    <div class="card-body p-2 text-center">
                                        <h6 class="card-title mb-1">Total Value</h6>
                                        <h4 class="mb-0" id="total-value-display">$${totalValue.toFixed(2)}</h4>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3 mb-2">
                                <div class="card bg-light">
                                    <div class="card-body p-2 text-center">
                                        <h6 class="card-title mb-1">Cash</h6>
                                        <h4 class="mb-0" id="cash-display">$${playerState ? playerState.cash.toFixed(2) : '10000.00'}</h4>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3 mb-2">
                                <div class="card bg-light">
                                    <div class="card-body p-2 text-center">
                                        <h6 class="card-title mb-1">Invested</h6>
                                        <h4 class="mb-0" id="portfolio-value-display">$${portfolioValue.toFixed(2)}</h4>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3 mb-2">
                                <div class="card bg-light">
                                    <div class="card-body p-2 text-center">
                                        <h6 class="card-title mb-1">Return</h6>
                                        <h4 class="mb-0 ${totalReturn >= 0 ? 'text-success' : 'text-danger'}" id="return-display">
                                            $${totalReturn.toFixed(2)} (${percentReturn.toFixed(2)}%)
                                        </h4>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Asset Price Charts -->
        <div class="row mb-3">
            <div class="col-md-6 mb-3">
                <div class="card">
                    <div class="card-header bg-info text-white">
                        <h5 class="mb-0">Real Estate & Gold</h5>
                    </div>
                    <div class="card-body">
                        <canvas id="real-estate-gold-chart"></canvas>
                    </div>
                </div>
            </div>
            <div class="col-md-6 mb-3">
                <div class="card">
                    <div class="card-header bg-info text-white">
                        <h5 class="mb-0">Bonds, Commodities & S&P 500</h5>
                    </div>
                    <div class="card-body">
                        <canvas id="bonds-commodities-sp-chart"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <div class="row mb-3">
            <div class="col-md-6 mb-3">
                <div class="card">
                    <div class="card-header bg-warning text-dark">
                        <h5 class="mb-0">Bitcoin</h5>
                    </div>
                    <div class="card-body">
                        <canvas id="bitcoin-chart"></canvas>
                    </div>
                </div>
            </div>
            <div class="col-md-6 mb-3">
                <div class="card">
                    <div class="card-header bg-success text-white">
                        <h5 class="mb-0">CPI (Inflation)</h5>
                    </div>
                    <div class="card-body">
                        <canvas id="cpi-chart"></canvas>
                    </div>
                </div>
            </div>
        </div>



        <!-- Game Controls -->
        <div class="row mb-3">
            <div class="col-12">
                <div class="card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <button id="view-history-btn" class="btn btn-outline-primary mr-2">
                                    <i class="fas fa-history"></i> Trade History
                                </button>
                                <button id="view-correlation-btn" class="btn btn-outline-info mr-2">
                                    <i class="fas fa-table"></i> Correlation Matrix
                                </button>
                                <button id="debug-trade-btn" class="btn btn-outline-danger mr-2">
                                    <i class="fas fa-bug"></i> Debug Trade Panel
                                </button>
                            </div>
                            <div>
                                <button id="back-to-welcome" class="btn btn-outline-secondary">
                                    <i class="fas fa-arrow-left"></i> Exit Game
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Trade Panel (hidden by default) -->
        <div class="trade-panel" style="display: none;">
            <div class="card">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0">Trade <span id="trade-asset-name"></span></h5>
                </div>
                <div class="card-body">
                    <div class="trade-form">
                        <div class="row mb-3">
                            <!-- Asset Selection and Action -->
                            <div class="col-md-6">
                                <div class="form-group mb-2">
                                    <label for="trade-action" style="font-size: 0.85rem; margin-bottom: 0.25rem;">Action</label>
                                    <select class="form-control form-control-sm" id="trade-action" required>
                                        <option value="buy">Buy</option>
                                        <option value="sell">Sell</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label style="font-size: 0.85rem;">Current Price: $<span id="current-price-display">0.00</span></label>
                                </div>
                            </div>

                            <!-- Trade Summary -->
                            <div class="col-md-6">
                                <div class="card bg-light mb-2">
                                    <div class="card-body p-2">
                                        <h6 class="card-title mb-2" style="font-size: 0.85rem;">Trade Summary</h6>
                                        <div class="d-flex justify-content-between mb-1">
                                            <span style="font-size: 0.85rem;">Quantity:</span>
                                            <span style="font-size: 0.85rem;" id="summary-quantity">0.00</span>
                                        </div>
                                        <div class="d-flex justify-content-between mb-1">
                                            <span style="font-size: 0.85rem;">Total Cost:</span>
                                            <span style="font-size: 0.85rem;">$<span id="summary-cost">0.00</span></span>
                                        </div>
                                        <div class="d-flex justify-content-between">
                                            <span style="font-size: 0.85rem;">Available Cash:</span>
                                            <span style="font-size: 0.85rem;">$<span id="summary-cash">0.00</span></span>
                                        </div>
                                    </div>
                                </div>
                                <button id="execute-trade-btn" class="btn btn-primary btn-sm btn-block">Execute Trade</button>
                            </div>
                        </div>

                        <!-- Amount and Quantity Inputs (Both Visible) -->
                        <div class="row">
                            <!-- Dollar Amount Input -->
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-body p-2">
                                        <h6 class="card-title" style="font-size: 0.85rem;">Amount ($)</h6>
                                        <div class="form-group mb-2">
                                            <div class="input-group input-group-sm">
                                                <div class="input-group-prepend">
                                                    <span class="input-group-text">$</span>
                                                </div>
                                                <input type="number" class="form-control form-control-sm" id="trade-amount" min="0.01" step="0.01" required>
                                            </div>
                                        </div>
                                        <div class="form-group mb-2">
                                            <input type="range" class="form-control-range" id="amount-slider" min="0" max="100" value="0" step="1">
                                            <div class="d-flex justify-content-between" style="font-size: 0.7rem;">
                                                <span>0%</span>
                                                <span>25%</span>
                                                <span>50%</span>
                                                <span>75%</span>
                                                <span>100%</span>
                                            </div>
                                        </div>
                                        <div class="form-group mb-0">
                                            <label for="amount-percentage" style="font-size: 0.8rem;">Percentage:</label>
                                            <div class="input-group input-group-sm">
                                                <input type="number" class="form-control form-control-sm" id="amount-percentage" min="0" max="100" value="0" step="1">
                                                <div class="input-group-append">
                                                    <span class="input-group-text">%</span>
                                                </div>
                                            </div>
                                            <div class="btn-group btn-group-sm w-100 mt-1">
                                                <button type="button" class="btn btn-outline-secondary amount-percent-btn" data-percent="25">25%</button>
                                                <button type="button" class="btn btn-outline-secondary amount-percent-btn" data-percent="50">50%</button>
                                                <button type="button" class="btn btn-outline-secondary amount-percent-btn" data-percent="75">75%</button>
                                                <button type="button" class="btn btn-outline-secondary amount-percent-btn" data-percent="100">100%</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Quantity Input -->
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-body p-2">
                                        <h6 class="card-title" style="font-size: 0.85rem;">Quantity (<span id="quantity-unit">units</span>)</h6>
                                        <div class="form-group mb-2">
                                            <div class="input-group input-group-sm">
                                                <input type="number" class="form-control form-control-sm" id="trade-quantity" min="0.000001" step="0.000001" required>
                                            </div>
                                        </div>
                                        <div class="form-group mb-2">
                                            <input type="range" class="form-control-range" id="quantity-slider" min="0" max="100" value="0" step="1">
                                            <div class="d-flex justify-content-between" style="font-size: 0.7rem;">
                                                <span>0%</span>
                                                <span>25%</span>
                                                <span>50%</span>
                                                <span>75%</span>
                                                <span>100%</span>
                                            </div>
                                        </div>
                                        <div class="form-group mb-0">
                                            <label for="quantity-percentage" style="font-size: 0.8rem;">Percentage:</label>
                                            <div class="input-group input-group-sm">
                                                <input type="number" class="form-control form-control-sm" id="quantity-percentage" min="0" max="100" value="0" step="1">
                                                <div class="input-group-append">
                                                    <span class="input-group-text">%</span>
                                                </div>
                                            </div>
                                            <div class="btn-group btn-group-sm w-100 mt-1">
                                                <button type="button" class="btn btn-outline-secondary quantity-percent-btn" data-percent="25">25%</button>
                                                <button type="button" class="btn btn-outline-secondary quantity-percent-btn" data-percent="50">50%</button>
                                                <button type="button" class="btn btn-outline-secondary quantity-percent-btn" data-percent="75">75%</button>
                                                <button type="button" class="btn btn-outline-secondary quantity-percent-btn" data-percent="100">100%</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="mt-3 text-right">
                            <button id="cancel-trade-btn" class="btn btn-secondary btn-sm">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Trade History Modal (hidden by default) -->
        <div id="trade-history-modal" class="modal" style="display: none;">
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h3>Trade History</h3>
                <div id="trade-history-container" class="trade-history-container">
                    <table class="table table-sm table-hover trade-history-table">
                        <thead>
                            <tr>
                                <th>Round</th>
                                <th>Asset</th>
                                <th>Action</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody id="trade-history-body">
                            <!-- Trade history will be populated here -->
                            <tr><td colspan="6">No trades yet</td></tr>
                        </tbody>
                    </table>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary close-history-btn">Close</button>
                </div>
            </div>
        </div>

        <!-- Asset Information Modal (hidden by default) -->
        <div id="asset-info-modal" class="modal" style="display: none;">
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h3>Asset Information</h3>
                <div id="asset-info-content">
                    <!-- Asset information will be loaded here -->
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary close-asset-info-btn">Close</button>
                </div>
            </div>
        </div>

        <!-- Correlation Matrix Modal (hidden by default) -->
        <div id="correlation-modal" class="modal" style="display: none;">
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h3>Asset Correlation Matrix</h3>
                <p class="modal-description">
                    This matrix shows how different assets move in relation to each other.
                    Values close to 1 indicate assets that tend to move together,
                    values close to -1 indicate assets that tend to move in opposite directions,
                    and values close to 0 indicate little relationship.
                </p>
                <div class="correlation-container">
                    <table class="table table-bordered correlation-table">
                        <thead>
                            <tr>
                                <th>Asset</th>
                                <th>S&P 500</th>
                                <th>Bonds</th>
                                <th>Real Estate</th>
                                <th>Gold</th>
                                <th>Commodities</th>
                                <th>Bitcoin</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>S&P 500</strong></td>
                                <td class="corr-1">1.00</td>
                                <td class="corr-neg">-0.52</td>
                                <td class="corr-pos">0.34</td>
                                <td class="corr-neutral">0.02</td>
                                <td class="corr-neutral">0.12</td>
                                <td class="corr-pos">0.41</td>
                            </tr>
                            <tr>
                                <td><strong>Bonds</strong></td>
                                <td class="corr-neg">-0.52</td>
                                <td class="corr-1">1.00</td>
                                <td class="corr-neutral">0.02</td>
                                <td class="corr-neutral">0.03</td>
                                <td class="corr-neutral">-0.02</td>
                                <td class="corr-neg">-0.23</td>
                            </tr>
                            <tr>
                                <td><strong>Real Estate</strong></td>
                                <td class="corr-pos">0.34</td>
                                <td class="corr-neutral">0.02</td>
                                <td class="corr-1">1.00</td>
                                <td class="corr-neg">-0.50</td>
                                <td class="corr-neutral">-0.03</td>
                                <td class="corr-neutral">0.16</td>
                            </tr>
                            <tr>
                                <td><strong>Gold</strong></td>
                                <td class="corr-neutral">0.02</td>
                                <td class="corr-neutral">0.03</td>
                                <td class="corr-neg">-0.50</td>
                                <td class="corr-1">1.00</td>
                                <td class="corr-neutral">0.10</td>
                                <td class="corr-neg">-0.53</td>
                            </tr>
                            <tr>
                                <td><strong>Commodities</strong></td>
                                <td class="corr-neutral">0.12</td>
                                <td class="corr-neutral">-0.02</td>
                                <td class="corr-neutral">-0.03</td>
                                <td class="corr-neutral">0.10</td>
                                <td class="corr-1">1.00</td>
                                <td class="corr-neutral">0.04</td>
                            </tr>
                            <tr>
                                <td><strong>Bitcoin</strong></td>
                                <td class="corr-pos">0.41</td>
                                <td class="corr-neg">-0.23</td>
                                <td class="corr-neutral">0.16</td>
                                <td class="corr-neg">-0.53</td>
                                <td class="corr-neutral">0.04</td>
                                <td class="corr-1">1.00</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="correlation-legend">
                    <div class="legend-item"><span class="legend-color corr-pos"></span> Positive Correlation</div>
                    <div class="legend-item"><span class="legend-color corr-neutral"></span> Low/No Correlation</div>
                    <div class="legend-item"><span class="legend-color corr-neg"></span> Negative Correlation</div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary close-correlation-btn">Close</button>
                </div>
            </div>
        </div>
    `;

    // Show the sticky next round button
    const stickyNextRoundBtn = document.querySelector('.sticky-button-container');
    if (stickyNextRoundBtn) {
        stickyNextRoundBtn.style.display = 'flex';
    }

    // Initialize event listeners - using the function from game-ui.js
    if (typeof window.initializeEventListeners === 'function') {
        window.initializeEventListeners();
    } else {
        console.error('initializeEventListeners function not found');
        // Try to add event listeners directly
        const tradeButtons = document.querySelectorAll('.trade-btn');
        console.log(`Found ${tradeButtons.length} trade buttons directly`);

        tradeButtons.forEach(button => {
            button.addEventListener('click', function() {
                const asset = this.getAttribute('data-asset');
                const action = this.classList.contains('buy') ? 'buy' : 'sell';
                console.log(`Direct listener added: Trade button clicked for ${asset}, action: ${action}`);
                if (typeof window.showTradePanel === 'function') {
                    window.showTradePanel(asset, action);
                } else {
                    console.error('showTradePanel function not found');
                }
            });
        });

        // Add debug button listener
        const debugTradeBtn = document.getElementById('debug-trade-btn');
        if (debugTradeBtn) {
            debugTradeBtn.addEventListener('click', function() {
                console.log('Debug trade panel button clicked directly');
                const tradePanel = document.querySelector('.trade-panel');
                if (tradePanel) {
                    tradePanel.style.display = 'block';
                    tradePanel.style.zIndex = '9999';
                    console.log('Trade panel forced visible directly');
                } else {
                    console.error('Trade panel not found directly');
                }
            });
        }
    }

    // Initialize charts - using the function from game-ui.js
    if (typeof window.initializeCharts === 'function') {
        window.initializeCharts();
    } else {
        console.error('initializeCharts function not found');
    }

    // Show notification
    if (typeof window.showNotification === 'function') {
        window.showNotification('Game interface loaded successfully!', 'success');
    } else {
        console.log('Game interface loaded successfully!');
    }
}

// Start a single player game
async function startSinglePlayerGame() {
    try {
        // Create a new game session
        gameSession = await window.gameSupabase.createSinglePlayerGame();
        if (!gameSession) {
            alert('Failed to create a new game. Please try again.');
            return;
        }

        // Join the game session
        const joined = await window.gameSupabase.joinGameSession(gameSession.id);
        if (!joined) {
            alert('Failed to join the game. Please try again.');
            return;
        }

        // Get initial player state
        playerState = await window.gameSupabase.getPlayerState(gameSession.id);
        if (!playerState) {
            alert('Failed to initialize player state. Please try again.');
            return;
        }

        // Get initial game state
        gameState = await window.gameSupabase.getGameState(gameSession.id, 0);
        if (!gameState) {
            alert('Failed to initialize game state. Please try again.');
            return;
        }

        // Show the game screen
        document.getElementById('welcome-screen').style.display = 'none';
        document.getElementById('game-screen').style.display = 'block';

        // Load the game interface
        loadGameInterface();

        // Initialize the game
        initializeGame();

        // Add initial prices to price history
        for (const [asset, price] of Object.entries(gameState.assetPrices)) {
            gameState.priceHistory[asset].push(price);
        }

        // Add initial CPI to CPI history
        gameState.CPIHistory.push(gameState.CPI);

        // Update UI to show initial state
        try {
            if (typeof window.updateUI === 'function') {
                window.updateUI();
            } else if (typeof updateUI === 'function') {
                updateUI();
            } else {
                console.error('updateUI function not found');
            }
        } catch (error) {
            console.error('Error updating UI:', error);
        }

        // Show notification
        if (typeof window.showNotification === 'function') {
            window.showNotification('Game started! You have $10,000 to invest. Click "Next Round" to advance the game.', 'success');
        } else {
            console.log('Game started! You have $10,000 to invest. Click "Next Round" to advance the game.');
        }
    } catch (error) {
        console.error('Error starting single player game:', error);
        alert('An error occurred while starting the game. Please try again.');
    }
}

// Join a class game
async function joinClassGame() {
    try {
        // Check if user has selected a section
        const sectionId = localStorage.getItem('section_id');
        if (!sectionId) {
            // Show section selector modal
            const modal = new bootstrap.Modal(document.getElementById('section-selector-modal'));
            if (modal) {
                modal.show();
                alert('Please select your TA section first to join a class game.');
            } else {
                alert('Please select your TA section first to join a class game. Go to your profile to select a section.');
            }
            return;
        }

        // Check if there's an active game session for the user's section
        const existingSession = await window.gameSupabase.checkExistingGameSession(sectionId);
        if (!existingSession) {
            alert('No active class game found for your section. Please ask your TA to start a game.');
            return;
        }

        // Join the existing game session
        gameSession = existingSession;
        const joined = await window.gameSupabase.joinGameSession(gameSession.id);
        if (!joined) {
            alert('Failed to join the class game. Please try again.');
            return;
        }

        // Get player state
        playerState = await window.gameSupabase.getPlayerState(gameSession.id);
        if (!playerState) {
            alert('Failed to initialize player state. Please try again.');
            return;
        }

        // Get current game state
        currentRound = gameSession.current_round;
        gameState = await window.gameSupabase.getGameState(gameSession.id, currentRound);

        // Show the game screen
        document.getElementById('welcome-screen').style.display = 'none';
        document.getElementById('game-screen').style.display = 'block';

        // Load the game interface
        loadGameInterface();
    } catch (error) {
        console.error('Error joining class game:', error);
        alert('An error occurred while joining the class game. Please try again.');
    }
}
