// TA Controls JavaScript for Investment Odyssey

// Global variables
let currentTAName = null;
let currentSections = [];
let activeGameSession = null;
let gameSessionUnsubscribe = null;
let participantsUnsubscribe = null;

// DOM elements
const authCheck = document.getElementById('auth-check');
const taControlsContainer = document.getElementById('ta-controls-container');
const taNameElement = document.getElementById('ta-name');
const sectionsContainer = document.getElementById('sections-container');
const activeGameControls = document.getElementById('active-game-controls');
const currentRoundElement = document.getElementById('current-round');
const maxRoundsElement = document.getElementById('max-rounds');
const participantCountElement = document.getElementById('participant-count');
const nextRoundBtn = document.getElementById('next-round-btn');
const endGameBtn = document.getElementById('end-game-btn');
const participantsTableBody = document.getElementById('participants-table-body');

// Initialize the TA controls
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Check if user is logged in as a TA
        const isTAAuthenticated = localStorage.getItem('ta_authenticated') === 'true';
        const taName = localStorage.getItem('ta_name');

        if (!isTAAuthenticated || !taName) {
            // User is not logged in as a TA
            authCheck.classList.remove('d-none');
            taControlsContainer.classList.add('d-none');
            return;
        }

        // Set current TA name
        currentTAName = taName;
        taNameElement.textContent = taName;

        // Hide auth check, show TA controls
        authCheck.classList.add('d-none');
        taControlsContainer.classList.remove('d-none');

        // Load TA's sections
        await loadTASections();

        // Check for active game sessions
        await checkActiveGameSessions();

        // Set up event listeners
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing TA controls:', error);
        showErrorMessage('An error occurred while loading the TA controls. Please try again later.');
    }
});

// Load TA's sections
async function loadTASections() {
    try {
        // Get sections for this TA
        const result = await Service.getSectionsByTA(currentTAName);

        if (!result.success || result.data.length === 0) {
            // No sections found
            sectionsContainer.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-warning">
                        <p class="mb-0">You don't have any sections assigned. Please contact the administrator.</p>
                    </div>
                </div>
            `;
            return;
        }

        // Store sections
        currentSections = result.data;

        // Define day order for sorting (Monday first)
        const dayOrder = {
            'M': 1, // Monday
            'T': 2, // Tuesday
            'W': 3, // Wednesday
            'R': 4, // Thursday
            'F': 5  // Friday
        };

        // Sort sections by day of week
        currentSections.sort((a, b) => {
            // First sort by day of week
            const dayDiff = (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99);
            if (dayDiff !== 0) return dayDiff;

            // If same day, sort by time
            return a.time.localeCompare(b.time);
        });

        // Clear sections container
        sectionsContainer.innerHTML = '';

        // Add each section
        currentSections.forEach(section => {
            // Format day name
            const dayNames = {
                'M': 'Monday',
                'T': 'Tuesday',
                'W': 'Wednesday',
                'R': 'Thursday',
                'F': 'Friday'
            };

            const dayName = dayNames[section.day] || section.day;

            // Create section card
            const sectionCard = document.createElement('div');
            sectionCard.className = 'col-md-6 col-lg-4 mb-4';
            sectionCard.innerHTML = `
                <div class="card control-card h-100">
                    <div class="card-header bg-primary text-white">
                        <h5 class="mb-0">${dayName} ${section.time}</h5>
                    </div>
                    <div class="card-body">
                        <p><strong>Location:</strong> ${section.location}</p>
                        <div class="game-status mb-3">
                            <span class="status-badge bg-secondary text-white" id="status-${section.id}">Checking status...</span>
                        </div>
                        <div class="text-center">
                            <button class="btn btn-success start-game-btn" data-section-id="${section.id}">
                                <i class="fas fa-play mr-2"></i> Start New Game
                            </button>
                        </div>
                    </div>
                </div>
            `;

            sectionsContainer.appendChild(sectionCard);

            // Check game status for this section
            checkGameStatus(section.id);
        });
    } catch (error) {
        console.error('Error loading TA sections:', error);
        sectionsContainer.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    <p class="mb-0">Error loading sections. Please try again later.</p>
                </div>
            </div>
        `;
    }
}

// Check game status for a section
async function checkGameStatus(sectionId) {
    try {
        const statusBadge = document.getElementById(`status-${sectionId}`);
        const result = await Service.getActiveClassGame(sectionId);

        if (result.success && result.data) {
            // Active game found
            statusBadge.className = 'status-badge bg-success text-white';
            statusBadge.textContent = `Active Game (Round ${result.data.currentRound}/${result.data.maxRounds})`;

            // Update start game button to manage game
            const startGameBtn = document.querySelector(`.start-game-btn[data-section-id="${sectionId}"]`);
            startGameBtn.className = 'btn btn-primary manage-game-btn';
            startGameBtn.innerHTML = '<i class="fas fa-cog mr-2"></i> Manage Game';
            startGameBtn.setAttribute('data-game-id', result.data.id);
        } else {
            // No active game
            statusBadge.className = 'status-badge bg-secondary text-white';
            statusBadge.textContent = 'No Active Game';
        }
    } catch (error) {
        console.error(`Error checking game status for section ${sectionId}:`, error);
        const statusBadge = document.getElementById(`status-${sectionId}`);
        statusBadge.className = 'status-badge bg-danger text-white';
        statusBadge.textContent = 'Error';
    }
}

// Check for active game sessions
async function checkActiveGameSessions() {
    try {
        // Get all active games for this TA
        const result = await Service.getActiveClassGamesByTA(currentTAName);

        if (result.success && result.data.length > 0) {
            // Active game found, use the first one
            activeGameSession = result.data[0];

            // Show active game controls
            showActiveGameControls();

            // Set up real-time listeners
            setupRealTimeListeners();
        }
    } catch (error) {
        console.error('Error checking active game sessions:', error);
    }
}

// Show active game controls
function showActiveGameControls() {
    // Show controls
    activeGameControls.classList.remove('d-none');

    // Update UI
    currentRoundElement.textContent = activeGameSession.currentRound;
    maxRoundsElement.textContent = activeGameSession.maxRounds;
    participantCountElement.textContent = activeGameSession.playerCount || 0;

    // Update market round display
    const marketRoundDisplay = document.getElementById('market-round-display');
    if (marketRoundDisplay) {
        marketRoundDisplay.textContent = activeGameSession.currentRound;
    }

    // Update progress text
    const progressText = document.getElementById('progress-text');
    if (progressText) {
        progressText.textContent = `${activeGameSession.currentRound} / ${activeGameSession.maxRounds}`;
    }

    // Update progress bar
    const progressBar = document.getElementById('round-progress');
    if (progressBar) {
        const progress = (activeGameSession.currentRound / activeGameSession.maxRounds) * 100;
        progressBar.style.width = `${progress}%`;
        progressBar.setAttribute('aria-valuenow', progress);
    }

    // Update game status badge
    const gameStatusBadge = document.getElementById('game-status-badge');
    if (gameStatusBadge) {
        if (activeGameSession.currentRound >= activeGameSession.maxRounds) {
            gameStatusBadge.textContent = 'Completed';
            gameStatusBadge.className = 'badge badge-success';
        } else if (activeGameSession.currentRound === 0) {
            gameStatusBadge.textContent = 'Not Started';
            gameStatusBadge.className = 'badge badge-warning';
        } else {
            gameStatusBadge.textContent = 'In Progress';
            gameStatusBadge.className = 'badge badge-primary';
        }
    }

    // Update asset prices table if it exists
    updateTAAssetPricesTable();

    // Update price ticker
    updatePriceTicker();

    // Disable next round button if game is over
    if (activeGameSession.currentRound >= activeGameSession.maxRounds) {
        nextRoundBtn.disabled = true;
        nextRoundBtn.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Game Complete';
        nextRoundBtn.classList.remove('pulse-button');
    } else {
        nextRoundBtn.classList.add('pulse-button');
    }
}

// Set up real-time listeners
function setupRealTimeListeners() {
    // Listen for changes to the game session
    gameSessionUnsubscribe = firebase.firestore()
        .collection('game_sessions')
        .doc(activeGameSession.id)
        .onSnapshot((doc) => {
            if (doc.exists) {
                const updatedSession = doc.data();

                // Check if round has changed
                const roundChanged = activeGameSession.currentRound !== updatedSession.currentRound;

                // Update session data
                activeGameSession = updatedSession;

                // Update UI
                currentRoundElement.textContent = activeGameSession.currentRound;
                participantCountElement.textContent = activeGameSession.playerCount || 0;

                // Update market round display
                const marketRoundDisplay = document.getElementById('market-round-display');
                if (marketRoundDisplay) {
                    marketRoundDisplay.textContent = activeGameSession.currentRound;
                }

                // Update progress text
                const progressText = document.getElementById('progress-text');
                if (progressText) {
                    progressText.textContent = `${activeGameSession.currentRound} / ${activeGameSession.maxRounds}`;
                }

                // Update progress bar
                const progressBar = document.getElementById('round-progress');
                if (progressBar) {
                    const progress = (activeGameSession.currentRound / activeGameSession.maxRounds) * 100;
                    progressBar.style.width = `${progress}%`;
                    progressBar.setAttribute('aria-valuenow', progress);
                }

                // Update game status badge
                const gameStatusBadge = document.getElementById('game-status-badge');
                if (gameStatusBadge) {
                    if (activeGameSession.currentRound >= activeGameSession.maxRounds) {
                        gameStatusBadge.textContent = 'Completed';
                        gameStatusBadge.className = 'badge badge-success';
                    } else if (activeGameSession.currentRound === 0) {
                        gameStatusBadge.textContent = 'Not Started';
                        gameStatusBadge.className = 'badge badge-warning';
                    } else {
                        gameStatusBadge.textContent = 'In Progress';
                        gameStatusBadge.className = 'badge badge-primary';
                    }
                }

                // If round changed, update asset prices with animation
                if (roundChanged) {
                    // Add animation to round badge
                    currentRoundElement.classList.add('round-change');
                    setTimeout(() => {
                        currentRoundElement.classList.remove('round-change');
                    }, 1000);

                    // Add a small delay to allow game state to update
                    setTimeout(() => {
                        updateTAAssetPricesTable();
                        updatePriceTicker();

                        // Show confetti for round changes after round 0
                        if (activeGameSession.currentRound > 1) {
                            showConfetti();
                        }
                    }, 1000);
                }

                // Disable next round button if game is over
                if (activeGameSession.currentRound >= activeGameSession.maxRounds) {
                    nextRoundBtn.disabled = true;
                    nextRoundBtn.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Game Complete';
                    nextRoundBtn.classList.remove('pulse-button');

                    // Show lots of confetti for game completion
                    showConfetti(100);
                } else {
                    nextRoundBtn.classList.add('pulse-button');
                }
            }
        });

    // Listen for changes to the participants
    participantsUnsubscribe = firebase.firestore()
        .collection('game_participants')
        .where('gameId', '==', activeGameSession.id)
        .onSnapshot((snapshot) => {
            const participants = [];

            snapshot.forEach((doc) => {
                participants.push(doc.data());
            });

            // Update participants table
            updateParticipantsTable(participants);
        });
}

// Update participants table
function updateParticipantsTable(participants) {
    // Sort participants by portfolio value
    participants.sort((a, b) => b.portfolioValue - a.portfolioValue);

    // Clear table
    participantsTableBody.innerHTML = '';

    if (participants.length === 0) {
        participantsTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-3">
                    No participants have joined the game yet.
                </td>
            </tr>
        `;
        return;
    }

    // Add each participant to the table
    participants.forEach((participant, index) => {
        const rank = index + 1;
        const row = document.createElement('tr');

        // Calculate return percentage
        const returnPct = ((participant.portfolioValue - 10000) / 10000) * 100;
        const returnClass = returnPct >= 0 ? 'text-success' : 'text-danger';

        // Format last updated time
        const lastUpdated = new Date(participant.lastUpdated.seconds * 1000);
        const formattedTime = lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Create the row HTML
        row.innerHTML = `
            <td>${rank}</td>
            <td>${participant.studentName}</td>
            <td>${formatCurrency(participant.portfolioValue)}</td>
            <td class="${returnClass}">${returnPct >= 0 ? '+' : ''}${returnPct.toFixed(2)}%</td>
            <td>${formattedTime}</td>
        `;

        participantsTableBody.appendChild(row);
    });
}

// Set up event listeners
function setupEventListeners() {
    // Start game buttons
    document.addEventListener('click', async function(e) {
        if (e.target.classList.contains('start-game-btn') || e.target.closest('.start-game-btn')) {
            const button = e.target.classList.contains('start-game-btn') ? e.target : e.target.closest('.start-game-btn');
            const sectionId = button.getAttribute('data-section-id');

            await handleStartGame(sectionId);
        }
    });

    // Manage game buttons
    document.addEventListener('click', async function(e) {
        if (e.target.classList.contains('manage-game-btn') || e.target.closest('.manage-game-btn')) {
            const button = e.target.classList.contains('manage-game-btn') ? e.target : e.target.closest('.manage-game-btn');
            const gameId = button.getAttribute('data-game-id');

            await handleManageGame(gameId);
        }
    });

    // Next round button
    nextRoundBtn.addEventListener('click', async function() {
        await handleNextRound();
    });

    // End game button
    endGameBtn.addEventListener('click', async function() {
        await handleEndGame();
    });
}

// Handle start game
async function handleStartGame(sectionId) {
    try {
        // Check if there's already an active game for this section
        const existingGame = await Service.getActiveClassGame(sectionId);

        if (existingGame.success && existingGame.data) {
            // Game already exists, manage it
            await handleManageGame(existingGame.data.id);
            return;
        }

        // Confirm start
        if (!confirm('Are you sure you want to start a new class game for this section?')) {
            return;
        }

        // Get section info
        const sectionResult = await Service.getSection(sectionId);

        if (!sectionResult.success) {
            alert('Error: Section not found.');
            return;
        }

        const section = sectionResult.data;

        // Create new game session
        const result = await Service.createClassGame(sectionId, currentTAName, section.day, section.time);

        if (result.success) {
            // Game created successfully
            activeGameSession = result.data;

            // Show active game controls
            showActiveGameControls();

            // Set up real-time listeners
            setupRealTimeListeners();

            // Update section status
            await checkGameStatus(sectionId);

            alert('Class game started successfully! Students can now join the game.');
        } else {
            alert(`Error starting game: ${result.error}`);
        }
    } catch (error) {
        console.error('Error starting game:', error);
        alert('An error occurred while starting the game. Please try again.');
    }
}

// Handle manage game
async function handleManageGame(gameId) {
    try {
        // Get game session
        const result = await Service.getClassGame(gameId);

        if (result.success) {
            // Set active game session
            activeGameSession = result.data;

            // Show active game controls
            showActiveGameControls();

            // Set up real-time listeners
            setupRealTimeListeners();
        } else {
            alert(`Error loading game: ${result.error}`);
        }
    } catch (error) {
        console.error('Error managing game:', error);
        alert('An error occurred while loading the game. Please try again.');
    }
}

// Handle next round
async function handleNextRound() {
    try {
        // Confirm next round
        if (!confirm(`Are you sure you want to advance to round ${activeGameSession.currentRound + 1}?`)) {
            return;
        }

        // Disable button during processing
        nextRoundBtn.disabled = true;
        nextRoundBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Processing...';

        // Advance to next round
        const result = await Service.advanceClassGameRound(activeGameSession.id);

        if (result.success) {
            // Round advanced successfully
            activeGameSession = result.data;

            // Add animation to round badge
            currentRoundElement.classList.add('round-change');
            setTimeout(() => {
                currentRoundElement.classList.remove('round-change');
            }, 1000);

            // Update UI elements
            currentRoundElement.textContent = activeGameSession.currentRound;

            // Update market round display
            const marketRoundDisplay = document.getElementById('market-round-display');
            if (marketRoundDisplay) {
                marketRoundDisplay.textContent = activeGameSession.currentRound;
            }

            // Update progress text
            const progressText = document.getElementById('progress-text');
            if (progressText) {
                progressText.textContent = `${activeGameSession.currentRound} / ${activeGameSession.maxRounds}`;
            }

            // Update progress bar
            const progressBar = document.getElementById('round-progress');
            if (progressBar) {
                const progress = (activeGameSession.currentRound / activeGameSession.maxRounds) * 100;
                progressBar.style.width = `${progress}%`;
                progressBar.setAttribute('aria-valuenow', progress);
            }

            // Update game status badge
            const gameStatusBadge = document.getElementById('game-status-badge');
            if (gameStatusBadge) {
                if (activeGameSession.currentRound >= activeGameSession.maxRounds) {
                    gameStatusBadge.textContent = 'Completed';
                    gameStatusBadge.className = 'badge badge-success';
                } else {
                    gameStatusBadge.textContent = 'In Progress';
                    gameStatusBadge.className = 'badge badge-primary';
                }
            }

            // Wait a moment to allow game states to be created
            setTimeout(() => {
                // Update asset prices table
                updateTAAssetPricesTable();

                // Update price ticker
                updatePriceTicker();

                // Show confetti for round changes after round 0
                if (activeGameSession.currentRound > 1) {
                    showConfetti();
                }
            }, 2000);

            // Check if game is over
            if (activeGameSession.currentRound >= activeGameSession.maxRounds) {
                nextRoundBtn.disabled = true;
                nextRoundBtn.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Game Complete';
                nextRoundBtn.classList.remove('pulse-button');

                // Show lots of confetti for game completion
                showConfetti(100);

                alert('The game is now complete! Students can view their final results.');
            } else {
                // Re-enable button after a delay to allow for animations
                setTimeout(() => {
                    nextRoundBtn.disabled = false;
                    nextRoundBtn.innerHTML = '<i class="fas fa-arrow-right mr-2"></i> Next Round';
                    nextRoundBtn.classList.add('pulse-button');

                    alert(`Advanced to round ${activeGameSession.currentRound} successfully!`);
                }, 2000);
            }
        } else {
            alert(`Error advancing round: ${result.error}`);

            // Re-enable button
            nextRoundBtn.disabled = false;
            nextRoundBtn.innerHTML = '<i class="fas fa-arrow-right mr-2"></i> Next Round';
            nextRoundBtn.classList.add('pulse-button');
        }
    } catch (error) {
        console.error('Error advancing round:', error);
        alert('An error occurred while advancing the round. Please try again.');

        // Re-enable button
        nextRoundBtn.disabled = false;
        nextRoundBtn.innerHTML = '<i class="fas fa-arrow-right mr-2"></i> Next Round';
        nextRoundBtn.classList.add('pulse-button');
    }
}

// Handle end game
async function handleEndGame() {
    try {
        // Confirm end game
        if (!confirm('Are you sure you want to end the game? This will complete the game immediately.')) {
            return;
        }

        // Disable button during processing
        endGameBtn.disabled = true;
        endGameBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Processing...';

        // End game
        const result = await Service.endClassGame(activeGameSession.id);

        if (result.success) {
            // Game ended successfully
            alert('Game ended successfully! Students can view their final results.');

            // Reload the page
            window.location.reload();
        } else {
            alert(`Error ending game: ${result.error}`);

            // Re-enable button
            endGameBtn.disabled = false;
            endGameBtn.innerHTML = '<i class="fas fa-stop-circle mr-2"></i> End Game';
        }
    } catch (error) {
        console.error('Error ending game:', error);
        alert('An error occurred while ending the game. Please try again.');

        // Re-enable button
        endGameBtn.disabled = false;
        endGameBtn.innerHTML = '<i class="fas fa-stop-circle mr-2"></i> End Game';
    }
}

// Format currency
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(value);
}

// Update TA asset prices table
function updateTAAssetPricesTable() {
    console.log('Updating TA asset prices table for round:', activeGameSession.currentRound);

    const tableBody = document.getElementById('ta-asset-prices-table');
    if (!tableBody) return;

    // Get game state from Firebase
    if (!activeGameSession || !activeGameSession.id) return;

    // Clear table
    tableBody.innerHTML = '';

    // Define initial prices for comparison
    const initialPrices = {
        'S&P 500': 100,
        'Bonds': 100,
        'Real Estate': 5000,
        'Gold': 3000,
        'Commodities': 100,
        'Bitcoin': 50000
    };

    // Show loading animation
    tableBody.innerHTML = `
        <tr>
            <td colspan="4" class="text-center py-3">
                <div class="spinner-border text-primary" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
                <p class="mt-2 mb-0">Loading market data for round ${activeGameSession.currentRound}...</p>
            </td>
        </tr>
    `;

    // Get the latest game state for any participant
    firebase.firestore()
        .collection('game_states')
        .where('gameId', '==', activeGameSession.id)
        .where('roundNumber', '==', activeGameSession.currentRound)
        .limit(1)
        .get()
        .then((snapshot) => {
            if (snapshot.empty) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center py-3">
                            <div class="alert alert-info mb-0">
                                <i class="fas fa-info-circle mr-2"></i>
                                No market data available for round ${activeGameSession.currentRound} yet.
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }

            // Get the first game state
            const gameState = snapshot.docs[0].data().gameState;
            console.log('Game state for round', activeGameSession.currentRound, ':', gameState);

            // Clear table again before adding new rows
            tableBody.innerHTML = '';

            // Add rows for each asset
            const assets = Object.keys(gameState.assetPrices || {});

            if (assets.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center py-3">
                            <div class="alert alert-warning mb-0">
                                <i class="fas fa-exclamation-triangle mr-2"></i>
                                No asset prices found in game state.
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }

            assets.forEach(asset => {
                try {
                    const currentPrice = gameState.assetPrices[asset];
                    if (currentPrice === undefined || isNaN(currentPrice)) {
                        console.error(`Invalid price for ${asset}:`, currentPrice);
                        return; // Skip this asset
                    }

                    // Get price history safely
                    const priceHistory = Array.isArray(gameState.priceHistory?.[asset])
                        ? gameState.priceHistory[asset]
                        : [currentPrice];

                    // Calculate price change
                    let priceChange = 0;
                    let changePercent = 0;
                    let previousPrice = currentPrice;

                    if (activeGameSession.currentRound === 1) {
                        // For round 1, compare with initial values
                        previousPrice = initialPrices[asset] || currentPrice;
                    } else if (priceHistory.length > 1) {
                        // For other rounds, compare with previous round
                        previousPrice = priceHistory[priceHistory.length - 2];
                    }

                    // Ensure previousPrice is valid
                    if (previousPrice === undefined || isNaN(previousPrice) || previousPrice === 0) {
                        previousPrice = currentPrice;
                    }

                    priceChange = currentPrice - previousPrice;
                    changePercent = (priceChange / previousPrice) * 100;

                    // Ensure changePercent is valid
                    if (isNaN(changePercent)) {
                        changePercent = 0;
                    }

                    // Determine change class
                    const changeClass = priceChange >= 0 ? 'text-success' : 'text-danger';
                    const changeIcon = priceChange >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';

                    // Create mini chart data - ensure all values are valid
                    const validPriceHistory = priceHistory.filter(price => !isNaN(price) && price !== undefined);
                    const chartData = validPriceHistory.length > 0 ? validPriceHistory.slice(-10) : [currentPrice];
                    const maxChartValue = Math.max(...chartData) || currentPrice;

                    // Create row with animation class for new round
                    const row = document.createElement('tr');
                    row.className = 'price-reveal'; // Add animation class
                    row.style.animationDelay = `${assets.indexOf(asset) * 0.1}s`; // Stagger animation

                    // Format the percentage with the correct number of decimal places
                    const formattedPercent = isFinite(changePercent) ? changePercent.toFixed(2) : '0.00';

                    row.innerHTML = `
                        <td>
                            <strong>${asset}</strong>
                        </td>
                        <td class="price-value">${formatCurrency(currentPrice)}</td>
                        <td class="${changeClass}">
                            <i class="fas ${changeIcon} mr-1"></i>
                            ${formattedPercent}%
                        </td>
                        <td>
                            <div class="sparkline" style="width: 100px; height: 30px;">
                                ${chartData.map(price => {
                                    const heightPercent = maxChartValue > 0 ? (price / maxChartValue * 100) : 0;
                                    return `<span style="height: ${heightPercent}%"></span>`;
                                }).join('')}
                            </div>
                        </td>
                    `;

                    tableBody.appendChild(row);
                } catch (error) {
                    console.error(`Error processing asset ${asset}:`, error);
                }
            });

            // Add dramatic reveal effect for the whole table
            tableBody.classList.add('table-reveal');
            setTimeout(() => {
                tableBody.classList.remove('table-reveal');
            }, 2000);
        })
        .catch((error) => {
            console.error('Error getting game state:', error);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-3">
                        <div class="alert alert-danger mb-0">
                            <i class="fas fa-exclamation-circle mr-2"></i>
                            Error loading market data: ${error.message}
                        </div>
                    </td>
                </tr>
            `;
        });
}

// Update price ticker
function updatePriceTicker() {
    console.log('Updating price ticker');
    const tickerElement = document.getElementById('price-ticker');
    if (!tickerElement) return;

    // Clear ticker
    tickerElement.innerHTML = '';

    // Get game state from Firebase
    if (!activeGameSession || !activeGameSession.id) return;

    firebase.firestore()
        .collection('game_states')
        .where('gameId', '==', activeGameSession.id)
        .where('roundNumber', '==', activeGameSession.currentRound)
        .limit(1)
        .get()
        .then((snapshot) => {
            if (snapshot.empty) return;

            // Get the first game state
            const gameState = snapshot.docs[0].data().gameState;
            if (!gameState || !gameState.assetPrices) return;

            // Define initial prices for comparison
            const initialPrices = {
                'S&P 500': 100,
                'Bonds': 100,
                'Real Estate': 5000,
                'Gold': 3000,
                'Commodities': 100,
                'Bitcoin': 50000
            };

            // Add each asset to ticker
            for (const [asset, price] of Object.entries(gameState.assetPrices)) {
                try {
                    if (price === undefined || isNaN(price)) continue;

                    // Get price history safely
                    const priceHistory = Array.isArray(gameState.priceHistory?.[asset])
                        ? gameState.priceHistory[asset]
                        : [price];

                    // Calculate price change
                    let priceChange = 0;
                    let changePercent = 0;
                    let previousPrice = price;

                    if (activeGameSession.currentRound === 1) {
                        // For round 1, compare with initial values
                        previousPrice = initialPrices[asset] || price;
                    } else if (priceHistory.length > 1) {
                        // For other rounds, compare with previous round
                        previousPrice = priceHistory[priceHistory.length - 2];
                    }

                    // Ensure previousPrice is valid
                    if (previousPrice === undefined || isNaN(previousPrice) || previousPrice === 0) {
                        previousPrice = price;
                    }

                    priceChange = price - previousPrice;
                    changePercent = (priceChange / previousPrice) * 100;

                    // Ensure changePercent is valid
                    if (isNaN(changePercent)) {
                        changePercent = 0;
                    }

                    // Determine change class and icon
                    const changeClass = priceChange >= 0 ? 'up' : 'down';
                    const changeIcon = priceChange >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';

                    // Format the percentage with the correct number of decimal places
                    const formattedPercent = isFinite(changePercent) ? changePercent.toFixed(2) : '0.00';

                    // Create ticker item
                    const tickerItem = document.createElement('div');
                    tickerItem.className = `ticker-item ${changeClass}`;
                    tickerItem.innerHTML = `
                        <strong>${asset}:</strong> ${formatCurrency(price)}
                        <i class="fas ${changeIcon} ml-1"></i>
                        ${formattedPercent}%
                    `;

                    tickerElement.appendChild(tickerItem);
                } catch (error) {
                    console.error(`Error processing ticker item for ${asset}:`, error);
                }
            }
        })
        .catch((error) => {
            console.error('Error updating price ticker:', error);
        });
}

// Show confetti animation
function showConfetti(count = 50) {
    const confettiContainer = document.getElementById('confetti-container');
    if (!confettiContainer) return;

    // Clear existing confetti
    confettiContainer.innerHTML = '';

    // Define confetti colors
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'];

    // Create confetti pieces
    for (let i = 0; i < count; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';

        // Random position
        const left = Math.random() * 100;
        confetti.style.left = `${left}%`;

        // Random delay
        const delay = Math.random() * 3;
        confetti.style.animationDelay = `${delay}s`;

        // Random color
        const colorIndex = Math.floor(Math.random() * colors.length);
        confetti.style.backgroundColor = colors[colorIndex];

        // Random size
        const size = 5 + Math.random() * 10;
        confetti.style.width = `${size}px`;
        confetti.style.height = `${size}px`;

        // Random rotation
        const rotation = Math.random() * 360;
        confetti.style.transform = `rotate(${rotation}deg)`;

        // Add to container
        confettiContainer.appendChild(confetti);

        // Remove after animation completes
        setTimeout(() => {
            if (confetti.parentNode === confettiContainer) {
                confettiContainer.removeChild(confetti);
            }
        }, 5000);
    }
}

// Show error message
function showErrorMessage(message) {
    taControlsContainer.innerHTML = `
        <div class="alert alert-danger">
            <i class="fas fa-exclamation-circle mr-2"></i> ${message}
        </div>
    `;
}

// Clean up listeners when leaving the page
window.addEventListener('beforeunload', function() {
    if (gameSessionUnsubscribe) {
        gameSessionUnsubscribe();
    }

    if (participantsUnsubscribe) {
        participantsUnsubscribe();
    }
});
