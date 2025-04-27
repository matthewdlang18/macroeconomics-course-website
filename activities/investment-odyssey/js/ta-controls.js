// TA Controls JavaScript for Investment Odyssey

// Global variables
let currentTA = null;
let taSections = [];
let activeGameId = null;
let activeSection = null;
let currentRound = 0;
let maxRounds = 20;
let participants = [];
let gameState = null;
let marketData = {};
let updateInterval = null;

// DOM elements
const authCheck = document.getElementById('auth-check');
const taControlsContainer = document.getElementById('ta-controls-container');
const taNameDisplay = document.getElementById('ta-name-display');
const sectionsContainer = document.getElementById('sections-container');
const sectionsList = document.getElementById('sections-list');
const gameControls = document.getElementById('game-controls');
const activeSectionName = document.getElementById('active-section-name');
const currentRoundDisplay = document.getElementById('current-round');
const maxRoundsDisplay = document.getElementById('max-rounds');
const roundProgress = document.getElementById('round-progress');
const marketDataBody = document.getElementById('market-data-body');
const participantsBody = document.getElementById('participants-body');
const participantCount = document.getElementById('participant-count');
const advanceRoundBtn = document.getElementById('advance-round-btn');
const endGameBtn = document.getElementById('end-game-btn');
const refreshSectionsBtn = document.getElementById('refresh-sections-btn');
const refreshParticipantsBtn = document.getElementById('refresh-participants-btn');
const searchFilter = document.getElementById('search-filter');

// Initialize the TA controls
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Check if user is logged in as a TA
        const isTA = Service.isTALoggedIn ? Service.isTALoggedIn() : (localStorage.getItem('is_ta') === 'true');
        const taName = localStorage.getItem('ta_name');

        if (!isTA || !taName) {
            // User is not logged in as a TA
            authCheck.classList.remove('d-none');
            taControlsContainer.classList.add('d-none');
            return;
        }

        // Set current TA
        currentTA = taName;
        taNameDisplay.textContent = currentTA;

        // Hide auth check, show TA controls
        authCheck.classList.add('d-none');
        taControlsContainer.classList.remove('d-none');

        // Load TA's sections
        await loadTASections();

        // Set up event listeners
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing TA controls:', error);
        showError('An error occurred while initializing the TA controls. Please try again later.');
    }
});

// Load TA's sections
async function loadTASections() {
    try {
        // Show loading state
        sectionsList.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
                <p class="mt-3">Loading your sections...</p>
            </div>
        `;

        // Get sections for the current TA
        const result = await Service.getSectionsByTA(currentTA);

        if (!result.success) {
            throw new Error(result.error || 'Failed to load sections');
        }

        // Store sections
        taSections = result.data || [];

        // Display sections
        displaySections();
    } catch (error) {
        console.error('Error loading TA sections:', error);
        sectionsList.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle mr-2"></i>
                    Error loading sections: ${error.message || 'Unknown error'}
                    <button id="retry-sections-btn" class="btn btn-outline-danger btn-sm ml-3">Retry</button>
                </div>
            </div>
        `;

        // Add event listener to retry button
        const retryBtn = document.getElementById('retry-sections-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', loadTASections);
        }
    }
}

// Display sections
function displaySections() {
    // Clear sections list
    sectionsList.innerHTML = '';

    // Filter sections based on search filter only
    const searchFilterValue = searchFilter.value.toLowerCase();

    const filteredSections = taSections.filter(section => {
        // Apply search filter
        if (searchFilterValue) {
            const sectionText = `${section.fullDay} ${section.time} ${section.location}`.toLowerCase();
            if (!sectionText.includes(searchFilterValue)) {
                return false;
            }
        }

        return true;
    });

    // Check if there are any sections after filtering
    if (filteredSections.length === 0) {
        sectionsList.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle mr-2"></i>
                    No sections found with the current filters.
                </div>
            </div>
        `;
        return;
    }

    // Display each section
    filteredSections.forEach(async (section) => {
        // Check if there's an active game for this section
        let gameStatus = 'no-game';
        let gameStatusText = 'No Active Game';
        let buttonText = 'Start New Game';
        let buttonClass = 'btn-success';
        let buttonIcon = 'play-circle';
        let gameId = null;
        let currentRound = 0;

        try {
            const gameResult = await Service.getActiveClassGame(section.id);

            if (gameResult.success && gameResult.data) {
                gameId = gameResult.data.id;
                currentRound = gameResult.data.currentRound;
                maxRounds = gameResult.data.maxRounds;

                // Check both active boolean and status text fields for compatibility
                if (gameResult.data.active === true || gameResult.data.status === 'active') {
                    gameStatus = 'active-game';
                    gameStatusText = `Active Game - Round ${currentRound}/${maxRounds}`;
                    buttonText = 'Manage Game';
                    buttonClass = 'btn-primary';
                    buttonIcon = 'cogs';
                } else if (gameResult.data.active === false || gameResult.data.status === 'completed') {
                    gameStatus = 'completed-game';
                    gameStatusText = 'Game Completed';
                    buttonText = 'Start New Game';
                    buttonClass = 'btn-success';
                    buttonIcon = 'play-circle';
                }
            }
        } catch (error) {
            console.error(`Error checking game status for section ${section.id}:`, error);
        }

        // Create section card
        const sectionCard = document.createElement('div');
        sectionCard.className = 'col-md-6 col-lg-4 mb-4';
        sectionCard.innerHTML = `
            <div class="card section-card ${gameStatus}">
                <div class="card-body">
                    <h5 class="card-title">${section.fullDay}</h5>
                    <h6 class="card-subtitle mb-2 text-muted">${section.time}</h6>
                    <p class="card-text">Location: ${section.location || 'N/A'}</p>
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <span class="badge ${gameStatus === 'active-game' ? 'badge-success' : gameStatus === 'completed-game' ? 'badge-danger' : 'badge-secondary'} p-2">
                            ${gameStatusText}
                        </span>
                        <button class="btn ${buttonClass} btn-sm section-action-btn" id="action-btn-${section.id}"
                                data-section-id="${section.id}"
                                data-game-id="${gameId || ''}"
                                data-action="${gameStatus === 'active-game' ? 'manage' : 'start'}"
                                data-section-name="${section.fullDay} ${section.time}">
                            <i class="fas fa-${buttonIcon} mr-1"></i> ${buttonText}
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add to sections list
        sectionsList.appendChild(sectionCard);

        // Add direct click handler to this specific button
        const actionBtn = document.getElementById(`action-btn-${section.id}`);
        if (actionBtn) {
            console.log(`Adding direct click handler to button for section ${section.id}`);

            // Remove any existing click handlers
            actionBtn.removeEventListener('click', handleSectionAction);

            // Add the click handler
            actionBtn.addEventListener('click', function(event) {
                console.log(`Direct click on button for section ${section.id}`);
                handleSectionAction(event);
            });
        } else {
            console.error(`Button for section ${section.id} not found in DOM`);
        }
    });

    // Add event listeners to all section action buttons as a backup
    const actionButtons = document.querySelectorAll('.section-action-btn');
    console.log(`Found ${actionButtons.length} action buttons`);
    actionButtons.forEach(button => {
        button.addEventListener('click', handleSectionAction);
    });
}

// Handle section action (start or manage game)
async function handleSectionAction(event) {
    const button = event.currentTarget;
    const sectionId = button.dataset.sectionId;
    const gameId = button.dataset.gameId;
    const action = button.dataset.action;
    const sectionName = button.dataset.sectionName;

    console.log('Section action triggered:', { action, sectionId, gameId, sectionName });

    try {
        if (action === 'start') {
            // Start a new game
            console.log('Starting new game for section:', sectionId);
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

            // Try direct Supabase approach first
            try {
                console.log('Trying direct Supabase approach to create game');
                const gameData = {
                    section_id: sectionId,
                    current_round: 0,
                    max_rounds: 20,
                    active: true,
                    status: 'active',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                const directResult = await window.supabase
                    .from('game_sessions')
                    .insert(gameData)
                    .select();

                console.log('Direct Supabase insert result:', directResult);

                if (directResult.error) {
                    console.error('Direct insert failed, falling back to service:', directResult.error);
                } else if (directResult.data && directResult.data.length > 0) {
                    console.log('Direct insert succeeded:', directResult.data[0]);

                    // Use this result
                    const directGameData = directResult.data[0];

                    // Set active game
                    activeGameId = directGameData.id;
                    activeSection = taSections.find(section => section.id === sectionId);

                    // Show game controls
                    showGameControls(directGameData, sectionName);

                    // Update button
                    button.dataset.action = 'manage';
                    button.dataset.gameId = activeGameId;
                    button.innerHTML = '<i class="fas fa-cogs mr-1"></i> Manage Game';
                    button.classList.remove('btn-success');
                    button.classList.add('btn-primary');

                    // Update card
                    const card = button.closest('.section-card');
                    card.classList.remove('no-game', 'completed-game');
                    card.classList.add('active-game');

                    // Update status badge
                    const badge = card.querySelector('.badge');
                    badge.className = 'badge badge-success p-2';
                    badge.textContent = `Active Game - Round 0/${maxRounds}`;

                    // Skip the service adapter call
                    return;
                }
            } catch (directError) {
                console.error('Exception in direct Supabase approach:', directError);
            }

            // Fall back to service adapter
            console.log('Falling back to service adapter');
            const result = await Service.createClassGame(sectionId);
            console.log('Create class game result:', result);

            if (!result.success) {
                throw new Error(result.error || 'Failed to create game');
            }

            // Set active game
            activeGameId = result.data.id;
            activeSection = taSections.find(section => section.id === sectionId);

            // Show game controls
            showGameControls(result.data, sectionName);

            // Update button
            button.dataset.action = 'manage';
            button.dataset.gameId = activeGameId;
            button.innerHTML = '<i class="fas fa-cogs mr-1"></i> Manage Game';
            button.classList.remove('btn-success');
            button.classList.add('btn-primary');

            // Update card
            const card = button.closest('.section-card');
            card.classList.remove('no-game', 'completed-game');
            card.classList.add('active-game');

            // Update status badge
            const badge = card.querySelector('.badge');
            badge.className = 'badge badge-success p-2';
            badge.textContent = `Active Game - Round 0/${maxRounds}`;
        } else if (action === 'manage') {
            // Manage existing game
            const result = await Service.getClassGame(gameId);

            if (!result.success) {
                throw new Error(result.error || 'Failed to load game');
            }

            // Set active game
            activeGameId = gameId;
            activeSection = taSections.find(section => section.id === sectionId);

            // Show game controls
            showGameControls(result.data, sectionName);
        }
    } catch (error) {
        console.error('Error handling section action:', error);
        showError(`Error: ${error.message || 'Unknown error'}`);
    } finally {
        // Re-enable the button if it was disabled and there was an error
        if (action === 'start' && !activeGameId) {
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-play-circle mr-1"></i> Start New Game';
        }
    }
}

// Show game controls
function showGameControls(game, sectionName) {
    console.log('Showing game controls for game:', game);

    // Set active game info
    activeSectionName.textContent = sectionName;

    // Handle different property naming conventions
    currentRound = game.currentRound || game.current_round || 0;
    maxRounds = game.maxRounds || game.max_rounds || 20;

    currentRoundDisplay.textContent = currentRound;
    maxRoundsDisplay.textContent = maxRounds;

    // Update progress bar
    const progress = (currentRound / maxRounds) * 100;
    roundProgress.style.width = `${progress}%`;
    roundProgress.textContent = `${progress.toFixed(0)}%`;
    roundProgress.setAttribute('aria-valuenow', progress);

    // Show game controls
    gameControls.style.display = 'block';

    // Scroll to game controls
    gameControls.scrollIntoView({ behavior: 'smooth' });

    // Load game data
    loadGameData();

    // Set up polling for updates
    if (updateInterval) {
        clearInterval(updateInterval);
    }

    updateInterval = setInterval(loadGameData, 5000); // Poll every 5 seconds
}

// Load game data (market data and participants)
async function loadGameData() {
    try {
        // Load market data
        await loadMarketData();

        // Load participants
        await loadParticipants();
    } catch (error) {
        console.error('Error loading game data:', error);
    }
}

// Asset returns configuration - from game-core.js
const assetReturns = {
    'S&P 500': {
        mean: 0.1151,
        stdDev: 0.1949,
        min: -0.43,
        max: 0.50
    },
    'Bonds': {
        mean: 0.0334,
        stdDev: 0.0301,
        min: 0.0003,
        max: 0.14
    },
    'Real Estate': {
        mean: 0.0439,
        stdDev: 0.0620,
        min: -0.12,
        max: 0.24
    },
    'Gold': {
        mean: 0.0648,
        stdDev: 0.2076,
        min: -0.32,
        max: 1.25
    },
    'Commodities': {
        mean: 0.0815,
        stdDev: 0.1522,
        min: -0.25,
        max: 2.00
    },
    'Bitcoin': {
        mean: 0.50,
        stdDev: 1.00,
        min: -0.73,
        max: 2.50
    }
};

// Correlation matrix for assets - from game-core.js
const correlationMatrix = [
    [1.0000, -0.5169, 0.3425, 0.0199, 0.1243, 0.4057],
    [-0.5169, 1.0000, 0.0176, 0.0289, -0.0235, -0.2259],
    [0.3425, 0.0176, 1.0000, -0.4967, -0.0334, 0.1559],
    [0.0199, 0.0289, -0.4967, 1.0000, 0.0995, -0.5343],
    [0.1243, -0.0235, -0.0334, 0.0995, 1.0000, 0.0436],
    [0.4057, -0.2259, 0.1559, -0.5343, 0.0436, 1.0000]
];

// Load market data
async function loadMarketData() {
    try {
        // For TA controls, we'll generate market data using the same logic as the single player game

        // If we don't have a game state yet, initialize it
        if (!gameState) {
            gameState = {
                assetPrices: {
                    'S&P 500': 100,
                    'Bonds': 100,
                    'Real Estate': 5000,
                    'Gold': 3000,
                    'Commodities': 100,
                    'Bitcoin': 50000,
                    'Cash': 1.00
                },
                priceHistory: {
                    'S&P 500': [],
                    'Bonds': [],
                    'Real Estate': [],
                    'Gold': [],
                    'Commodities': [],
                    'Bitcoin': [],
                    'Cash': []
                },
                cpi: 100,
                cpiHistory: [],
                lastBitcoinCrashRound: 0,
                bitcoinShockRange: [-0.5, -0.75],
                roundNumber: currentRound
            };
        }

        // Make sure the game state round number matches the current round
        gameState.roundNumber = currentRound;

        // Generate prices for all rounds up to the current round
        for (const asset in gameState.assetPrices) {
            // Initialize price history arrays if they don't exist
            if (!gameState.priceHistory[asset]) {
                gameState.priceHistory[asset] = [];
            }

            // Make sure we have prices for round 0
            if (gameState.priceHistory[asset].length === 0) {
                gameState.priceHistory[asset][0] = gameState.assetPrices[asset];
            }

            // Generate prices for all rounds up to the current round
            for (let i = 1; i <= currentRound; i++) {
                if (!gameState.priceHistory[asset][i] || i === currentRound) {
                    // Generate price for this round (always regenerate for current round)
                    const prevPrice = gameState.priceHistory[asset][i-1];
                    const return_rate = generateAssetReturn(asset, i);
                    const newPrice = prevPrice * (1 + return_rate);

                    // Update price history and current price
                    gameState.priceHistory[asset][i] = newPrice;
                    if (i === currentRound) {
                        gameState.assetPrices[asset] = newPrice;
                    }
                }
            }
        }

        // Generate CPI for all rounds up to the current round
        if (!gameState.cpiHistory) {
            gameState.cpiHistory = [];
        }

        // Make sure we have CPI for round 0
        if (gameState.cpiHistory.length === 0) {
            gameState.cpiHistory[0] = gameState.cpi;
        }

        // Generate CPI for all rounds up to the current round
        for (let i = 1; i <= currentRound; i++) {
            if (!gameState.cpiHistory[i] || i === currentRound) {
                // Generate CPI for this round (always regenerate for current round)
                const prevCPI = gameState.cpiHistory[i-1];
                const cpiIncrease = generateCPIIncrease();
                const newCPI = prevCPI * (1 + cpiIncrease);

                // Update CPI history and current CPI
                gameState.cpiHistory[i] = newCPI;
                if (i === currentRound) {
                    gameState.cpi = newCPI;
                }
            }
        }

        // Update market data table
        updateMarketDataTable();

        console.log('Generated market data for round', currentRound);
        console.log('Asset prices:', gameState.assetPrices);
        console.log('Price history:', gameState.priceHistory);
    } catch (error) {
        console.error('Error loading market data:', error);
        marketDataBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger">
                    <i class="fas fa-exclamation-circle mr-2"></i>
                    Error loading market data: ${error.message || 'Unknown error'}
                </td>
            </tr>
        `;
    }
}

// Generate asset return based on asset type and round
function generateAssetReturn(asset, round) {
    if (asset === 'Cash') return 0; // Cash always stays at 1.00

    // Generate uncorrelated standard normal random variables
    const assetNames = Object.keys(assetReturns);
    const uncorrelatedZ = [];
    for (let i = 0; i < assetNames.length; i++) {
        // Box-Muller transform for normal distribution
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        uncorrelatedZ.push(z);
    }

    // Special handling for Bitcoin
    if (asset === 'Bitcoin') {
        const bitcoinPrice = gameState.priceHistory[asset][round-1] || gameState.assetPrices[asset];
        let bitcoinReturn;

        // Bitcoin has special growth patterns based on its price
        if (bitcoinPrice < 10000) {
            // Low price: rapid growth
            bitcoinReturn = 2 + Math.random() * 2; // Return between 200% and 400%
        } else if (bitcoinPrice >= 1000000) {
            // Very high price: crash
            bitcoinReturn = -0.3 - Math.random() * 0.2; // Return between -30% and -50%
        } else {
            // Normal price range: correlated with other assets but with high volatility
            let weightedReturn = 0;
            for (let j = 0; j < assetNames.length; j++) {
                weightedReturn += correlationMatrix[5][j] * uncorrelatedZ[j];
            }
            bitcoinReturn = assetReturns['Bitcoin'].mean + assetReturns['Bitcoin'].stdDev * weightedReturn;

            // Adjust Bitcoin's return based on its current price
            const priceThreshold = 100000;
            if (bitcoinPrice > priceThreshold) {
                // Calculate how many increments above threshold
                const incrementsAboveThreshold = Math.max(0, (bitcoinPrice - priceThreshold) / 50000);

                // Reduce volatility as price grows (more mature asset)
                const volatilityReduction = Math.min(0.7, incrementsAboveThreshold * 0.05);
                const adjustedStdDev = assetReturns['Bitcoin'].stdDev * (1 - volatilityReduction);

                // Use a skewed distribution to avoid clustering around the mean
                const u1 = Math.random();
                const u2 = Math.random();
                const normalRandom = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

                // Adjust the mean based on price to create more varied returns
                const adjustedMean = assetReturns['Bitcoin'].mean * (0.5 + (Math.random() * 0.5));

                // Recalculate return with reduced volatility and varied mean
                bitcoinReturn = adjustedMean + (normalRandom * adjustedStdDev);
            }

            // Check for Bitcoin crash (4-year cycle)
            if (round - gameState.lastBitcoinCrashRound >= 4) {
                if (Math.random() < 0.5) { // 50% chance of crash after 4 rounds
                    // Apply shock based on current shock range
                    bitcoinReturn = gameState.bitcoinShockRange[0] + Math.random() * (gameState.bitcoinShockRange[1] - gameState.bitcoinShockRange[0]);

                    // Update last crash round
                    gameState.lastBitcoinCrashRound = round;

                    // Update shock range for next crash (less severe but still negative)
                    gameState.bitcoinShockRange = [
                        Math.min(Math.max(gameState.bitcoinShockRange[0] + 0.1, -0.5), -0.05),
                        Math.min(Math.max(gameState.bitcoinShockRange[1] + 0.1, -0.75), -0.15)
                    ];
                }
            }
        }

        // Ensure Bitcoin return is within bounds
        bitcoinReturn = Math.max(
            assetReturns['Bitcoin'].min,
            Math.min(assetReturns['Bitcoin'].max, bitcoinReturn)
        );

        return bitcoinReturn;
    }

    // Generate correlated returns for other assets
    const assetIndex = assetNames.indexOf(asset);
    if (assetIndex === -1) return 0; // Asset not found in correlation matrix

    let weightedReturn = 0;
    for (let j = 0; j < assetNames.length; j++) {
        weightedReturn += correlationMatrix[assetIndex][j] * uncorrelatedZ[j];
    }

    let assetReturn = assetReturns[asset].mean + assetReturns[asset].stdDev * weightedReturn;

    // Ensure return is within bounds
    assetReturn = Math.max(
        assetReturns[asset].min,
        Math.min(assetReturns[asset].max, assetReturn)
    );

    return assetReturn;
}

// Generate CPI increase
function generateCPIIncrease() {
    // Average CPI increase of 2.5% with standard deviation of 1.5%
    const avgCPIIncrease = 0.025;
    const stdDevCPIIncrease = 0.015;

    // Generate random CPI increase using normal distribution
    let cpiIncrease;
    // Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    cpiIncrease = avgCPIIncrease + stdDevCPIIncrease * z;

    // Ensure CPI increase is reasonable (between -1% and 6%)
    cpiIncrease = Math.max(-0.01, Math.min(0.06, cpiIncrease));

    return cpiIncrease;
}

// Update market data table
function updateMarketDataTable() {
    // Clear market data table
    marketDataBody.innerHTML = '';

    // Check if we have game state
    if (!gameState || !gameState.assetPrices) {
        marketDataBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">
                    <i class="fas fa-info-circle mr-2"></i>
                    No market data available for this round.
                </td>
            </tr>
        `;
        return;
    }

    // Get assets and prices
    const assets = Object.keys(gameState.assetPrices);

    // Add each asset to the table
    assets.forEach(asset => {
        const currentPrice = gameState.assetPrices[asset];
        const previousPrice = currentRound > 0 && gameState.priceHistory &&
                             gameState.priceHistory[asset] &&
                             gameState.priceHistory[asset][currentRound - 1] ?
                             gameState.priceHistory[asset][currentRound - 1] :
                             (asset === 'Cash' ? 1.00 : 0);

        const priceDiff = currentPrice - previousPrice;
        const percentChange = previousPrice > 0 ? (priceDiff / previousPrice) * 100 : 0;

        const row = document.createElement('tr');
        row.className = 'market-data-row';
        row.innerHTML = `
            <td>${asset}</td>
            <td>$${currentPrice.toFixed(2)}</td>
            <td>$${previousPrice.toFixed(2)}</td>
            <td class="${priceDiff >= 0 ? 'text-success' : 'text-danger'}">
                ${priceDiff >= 0 ? '+' : ''}$${priceDiff.toFixed(2)}
            </td>
            <td class="${priceDiff >= 0 ? 'text-success' : 'text-danger'}">
                ${priceDiff >= 0 ? '+' : ''}${percentChange.toFixed(2)}%
            </td>
        `;

        marketDataBody.appendChild(row);
    });

    // Add CPI to the table
    if (gameState.cpi) {
        const currentCPI = gameState.cpi;
        const previousCPI = currentRound > 0 && gameState.cpiHistory && gameState.cpiHistory[currentRound - 1] ?
                           gameState.cpiHistory[currentRound - 1] : 100;

        const cpiDiff = currentCPI - previousCPI;
        const cpiPercentChange = (cpiDiff / previousCPI) * 100;

        const row = document.createElement('tr');
        row.className = 'market-data-row';
        row.innerHTML = `
            <td>CPI</td>
            <td>${currentCPI.toFixed(2)}</td>
            <td>${previousCPI.toFixed(2)}</td>
            <td class="${cpiDiff >= 0 ? 'text-danger' : 'text-success'}">
                ${cpiDiff >= 0 ? '+' : ''}${cpiDiff.toFixed(2)}
            </td>
            <td class="${cpiDiff >= 0 ? 'text-danger' : 'text-success'}">
                ${cpiDiff >= 0 ? '+' : ''}${cpiPercentChange.toFixed(2)}%
            </td>
        `;

        marketDataBody.appendChild(row);
    }
}

// Load participants
async function loadParticipants() {
    try {
        // For TA controls, we'll use a simpler approach
        // Instead of using the game_participants table, we'll check player_states

        try {
            // Try to get player states for this game
            if (window.supabase) {
                const { data, error } = await window.supabase
                    .from('player_states')
                    .select('*')
                    .eq('game_id', activeGameId);

                if (error) {
                    console.error('Error getting player states:', error);
                    // Continue with empty participants
                    participants = [];
                } else if (data && data.length > 0) {
                    // Try to get user profiles to get display names
                    const userIds = data.map(player => player.user_id);
                    const { data: profiles, error: profilesError } = await window.supabase
                        .from('profiles')
                        .select('*')
                        .in('id', userIds);

                    // Create a map of user IDs to display names
                    const displayNames = {};
                    if (!profilesError && profiles && profiles.length > 0) {
                        profiles.forEach(profile => {
                            displayNames[profile.id] = profile.display_name || profile.email || profile.id;
                        });
                    }

                    // Format player states as participants
                    participants = data.map(player => ({
                        studentId: player.user_id,
                        studentName: displayNames[player.user_id] || player.user_id,
                        portfolioValue: calculatePortfolioValue(player.portfolio, gameState?.assetPrices || {}),
                        cash: player.cash || 10000,
                        totalValue: player.total_value || 10000
                    }));

                    console.log('Found participants:', participants);
                } else {
                    // No participants found
                    participants = [];
                }
            } else {
                // No Supabase, use empty participants
                participants = [];
            }
        } catch (innerError) {
            console.error('Error processing participants:', innerError);
            participants = [];
        }

        // Update participants count
        participantCount.textContent = participants.length;

        // Update participants table
        updateParticipantsTable();

        // Show message if no participants
        if (participants.length === 0) {
            participantsBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted">
                        <i class="fas fa-info-circle mr-2"></i>
                        No participants have joined this game yet.
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Error loading participants:', error);
        participantsBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger">
                    <i class="fas fa-exclamation-circle mr-2"></i>
                    Error loading participants: ${error.message || 'Unknown error'}
                </td>
            </tr>
        `;
    }
}

// Helper function to calculate portfolio value
function calculatePortfolioValue(portfolio, assetPrices) {
    if (!portfolio || !assetPrices) return 0;

    let totalValue = 0;
    for (const asset in portfolio) {
        if (assetPrices[asset]) {
            totalValue += portfolio[asset] * assetPrices[asset];
        }
    }

    return totalValue;
}

// Update participants table
function updateParticipantsTable() {
    // Clear participants table
    participantsBody.innerHTML = '';

    // Check if we have participants
    if (!participants || participants.length === 0) {
        participantsBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">
                    <i class="fas fa-info-circle mr-2"></i>
                    No participants have joined this game yet.
                </td>
            </tr>
        `;
        return;
    }

    // Sort participants by total value (descending)
    participants.sort((a, b) => b.totalValue - a.totalValue);

    // Add each participant to the table
    participants.forEach((participant, index) => {
        const row = document.createElement('tr');

        // Determine rank style
        let rankStyle = '';
        if (index === 0) {
            rankStyle = 'background-color: gold; color: #333;';
        } else if (index === 1) {
            rankStyle = 'background-color: silver; color: #333;';
        } else if (index === 2) {
            rankStyle = 'background-color: #cd7f32; color: white;';
        }

        row.innerHTML = `
            <td>
                <span class="badge badge-pill" style="width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; ${rankStyle}">
                    ${index + 1}
                </span>
            </td>
            <td>${participant.studentName}</td>
            <td>$${participant.portfolioValue.toFixed(2)}</td>
            <td>$${participant.cash.toFixed(2)}</td>
            <td>$${participant.totalValue.toFixed(2)}</td>
        `;

        participantsBody.appendChild(row);
    });
}

// Advance to next round
async function advanceRound() {
    try {
        // Disable button to prevent multiple clicks
        advanceRoundBtn.disabled = true;
        advanceRoundBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Advancing...';

        // Try direct Supabase approach first
        try {
            console.log('Trying direct Supabase approach to advance round');

            // Get current game data
            const { data: gameData, error: gameError } = await window.supabase
                .from('game_sessions')
                .select('*')
                .eq('id', activeGameId)
                .single();

            if (gameError) {
                console.error('Error getting game data:', gameError);
                throw new Error('Failed to get game data');
            }

            // Increment round
            const newRound = (gameData.current_round || 0) + 1;

            // Update game session
            const { data: updateData, error: updateError } = await window.supabase
                .from('game_sessions')
                .update({
                    current_round: newRound,
                    updated_at: new Date().toISOString()
                })
                .eq('id', activeGameId)
                .select()
                .single();

            if (updateError) {
                console.error('Error updating game round:', updateError);
                throw new Error('Failed to update game round');
            }

            console.log('Successfully advanced round to', newRound);

            // Update UI
            currentRound = newRound;
            currentRoundDisplay.textContent = currentRound;

            // Update progress bar
            const progress = (currentRound / maxRounds) * 100;
            roundProgress.style.width = `${progress}%`;
            roundProgress.textContent = `${progress.toFixed(0)}%`;
            roundProgress.setAttribute('aria-valuenow', progress);

            // Show success message
            showMessage('success', `Advanced to Round ${currentRound}`);

            // Reload game data
            await loadGameData();

            // Update section cards
            await loadTASections();

            return;
        } catch (directError) {
            console.error('Direct approach failed:', directError);
        }

        // Fall back to service adapter
        console.log('Falling back to service adapter');
        const result = await Service.advanceRound(activeGameId);

        if (!result.success) {
            throw new Error(result.error || 'Failed to advance round');
        }

        // Update UI
        currentRound = result.data.currentRound;
        currentRoundDisplay.textContent = currentRound;

        // Update progress bar
        const progress = (currentRound / maxRounds) * 100;
        roundProgress.style.width = `${progress}%`;
        roundProgress.textContent = `${progress.toFixed(0)}%`;
        roundProgress.setAttribute('aria-valuenow', progress);

        // Show success message
        showMessage('success', `Advanced to Round ${currentRound}`);

        // Reload game data
        await loadGameData();

        // Update section cards
        await loadTASections();
    } catch (error) {
        console.error('Error advancing round:', error);
        showError(`Error advancing round: ${error.message || 'Unknown error'}`);
    } finally {
        // Re-enable button
        advanceRoundBtn.disabled = false;
        advanceRoundBtn.innerHTML = '<i class="fas fa-forward mr-1"></i> Advance to Next Round';
    }
}

// End game
async function endGame() {
    try {
        // Confirm with user
        if (!confirm('Are you sure you want to end this game? This action cannot be undone.')) {
            return;
        }

        // Disable button to prevent multiple clicks
        endGameBtn.disabled = true;
        endGameBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Ending Game...';

        // Try direct Supabase approach first
        try {
            console.log('Trying direct Supabase approach to end game');

            // Update game session
            const { data: updateData, error: updateError } = await window.supabase
                .from('game_sessions')
                .update({
                    active: false,
                    status: 'completed',
                    updated_at: new Date().toISOString()
                })
                .eq('id', activeGameId)
                .select()
                .single();

            if (updateError) {
                console.error('Error ending game:', updateError);
                throw new Error('Failed to end game');
            }

            console.log('Successfully ended game');

            // Show success message
            showMessage('success', 'Game ended successfully');

            // Hide game controls
            gameControls.style.display = 'none';

            // Clear active game
            activeGameId = null;
            activeSection = null;

            // Clear update interval
            if (updateInterval) {
                clearInterval(updateInterval);
                updateInterval = null;
            }

            // Reload sections
            await loadTASections();

            return;
        } catch (directError) {
            console.error('Direct approach failed:', directError);
        }

        // Fall back to service adapter
        console.log('Falling back to service adapter');
        const result = await Service.endGame(activeGameId);

        if (!result.success) {
            throw new Error(result.error || 'Failed to end game');
        }

        // Show success message
        showMessage('success', 'Game ended successfully');

        // Hide game controls
        gameControls.style.display = 'none';

        // Clear active game
        activeGameId = null;
        activeSection = null;

        // Clear update interval
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }

        // Reload sections
        await loadTASections();
    } catch (error) {
        console.error('Error ending game:', error);
        showError(`Error ending game: ${error.message || 'Unknown error'}`);
    } finally {
        // Re-enable button
        endGameBtn.disabled = false;
        endGameBtn.innerHTML = '<i class="fas fa-stop-circle mr-1"></i> End Game';
    }
}

// Set up event listeners
function setupEventListeners() {
    // Refresh sections button
    refreshSectionsBtn.addEventListener('click', loadTASections);

    // Refresh participants button
    refreshParticipantsBtn.addEventListener('click', loadParticipants);

    // Advance round button
    advanceRoundBtn.addEventListener('click', advanceRound);

    // End game button
    endGameBtn.addEventListener('click', endGame);

    // Search filter
    searchFilter.addEventListener('input', displaySections);
}

// Show error message
function showError(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show';
    alertDiv.innerHTML = `
        <i class="fas fa-exclamation-circle mr-2"></i>
        ${message}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    `;

    // Add to container
    taControlsContainer.insertBefore(alertDiv, taControlsContainer.firstChild);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 500);
    }, 5000);
}

// Show message
function showMessage(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'} mr-2"></i>
        ${message}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    `;

    // Add to container
    taControlsContainer.insertBefore(alertDiv, taControlsContainer.firstChild);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 500);
    }, 5000);
}
