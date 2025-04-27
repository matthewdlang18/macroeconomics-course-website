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
const dayFilter = document.getElementById('day-filter');
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

    // Filter sections based on day filter
    const dayFilterValue = dayFilter.value;
    const searchFilterValue = searchFilter.value.toLowerCase();

    const filteredSections = taSections.filter(section => {
        // Apply day filter
        if (dayFilterValue !== 'all' && section.day !== dayFilterValue) {
            return false;
        }

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
                        <button class="btn ${buttonClass} btn-sm section-action-btn"
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
    });

    // Add event listeners to section action buttons
    const actionButtons = document.querySelectorAll('.section-action-btn');
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

    try {
        if (action === 'start') {
            // Start a new game
            const result = await Service.createClassGame(sectionId);

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
    }
}

// Show game controls
function showGameControls(game, sectionName) {
    // Set active game info
    activeSectionName.textContent = sectionName;
    currentRound = game.currentRound;
    maxRounds = game.maxRounds;
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

// Load market data
async function loadMarketData() {
    try {
        // Get game state for the current round
        const result = await Service.getGameState(activeGameId, 'TA_DEFAULT');

        if (!result.success) {
            throw new Error(result.error || 'Failed to load market data');
        }

        // Set game state
        gameState = result.data.gameState;

        // Update market data table
        updateMarketDataTable();
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
        // Get participants for the active game
        const result = await Service.getGameParticipants(activeGameId);

        if (!result.success) {
            throw new Error(result.error || 'Failed to load participants');
        }

        // Set participants
        participants = result.data || [];

        // Update participants count
        participantCount.textContent = participants.length;

        // Update participants table
        updateParticipantsTable();
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

        // Call service to advance round
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

        // Call service to end game
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

    // Day filter
    dayFilter.addEventListener('change', displaySections);

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
