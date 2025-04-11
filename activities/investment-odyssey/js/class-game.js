// Class Game JavaScript for Investment Odyssey

// Global variables
let classGameSession = null;
let classGameUnsubscribe = null;
let leaderboardUnsubscribe = null;
let currentStudentId = null;
let currentStudentName = null;
let currentSectionId = null;
let currentSection = null;
let currentTA = null;

// DOM elements
const authCheck = document.getElementById('auth-check');
const classGameContainer = document.getElementById('class-game-container');
const waitingScreen = document.getElementById('waiting-screen');
const gameContent = document.getElementById('game-content');
const sectionInfo = document.getElementById('section-info');
const taName = document.getElementById('ta-name');
const roundNumber = document.getElementById('round-number');
const maxRounds = document.getElementById('max-rounds');
const playerCount = document.getElementById('player-count');
const classLeaderboardBody = document.getElementById('class-leaderboard-body');

// Initialize the class game
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Check if user is logged in
        const studentId = localStorage.getItem('student_id');
        const studentName = localStorage.getItem('student_name');
        const isGuest = localStorage.getItem('is_guest') === 'true';

        if (!studentId || !studentName || isGuest) {
            // User is not logged in or is a guest
            authCheck.classList.remove('d-none');
            classGameContainer.classList.add('d-none');
            return;
        }

        // Set current student info
        currentStudentId = studentId;
        currentStudentName = studentName;

        // Check if student has a section
        const studentResult = await Service.getStudent(studentId);

        if (!studentResult.success || !studentResult.data.sectionId) {
            // Student doesn't have a section
            authCheck.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="mr-3">
                        <i class="fas fa-users fa-2x"></i>
                    </div>
                    <div>
                        <h5 class="mb-1">TA Section Required</h5>
                        <p class="mb-0">You need to select a TA section to join class games. <a href="../../select-section.html" class="font-weight-bold">Select a section here</a>.</p>
                    </div>
                </div>
            `;
            authCheck.classList.remove('d-none');
            classGameContainer.classList.add('d-none');
            return;
        }

        // Get student's section
        currentSectionId = studentResult.data.sectionId;
        const sectionResult = await Service.getSection(currentSectionId);

        if (!sectionResult.success) {
            // Section not found
            authCheck.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="mr-3">
                        <i class="fas fa-exclamation-circle fa-2x"></i>
                    </div>
                    <div>
                        <h5 class="mb-1">Section Not Found</h5>
                        <p class="mb-0">Your section could not be found. Please <a href="../../select-section.html" class="font-weight-bold">select a different section</a>.</p>
                    </div>
                </div>
            `;
            authCheck.classList.remove('d-none');
            classGameContainer.classList.add('d-none');
            return;
        }

        // Set current section info
        currentSection = sectionResult.data;
        currentTA = currentSection.ta;

        // Check if there's an active game for this section
        const gameResult = await Service.getActiveClassGame(currentSectionId);

        if (!gameResult.success || !gameResult.data) {
            // No active game
            authCheck.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="mr-3">
                        <i class="fas fa-hourglass-start fa-2x"></i>
                    </div>
                    <div>
                        <h5 class="mb-1">No Active Game</h5>
                        <p class="mb-0">There is no active class game for your section at this time. Please check back later or ask your TA to start a game.</p>
                        <a href="game-modes.html" class="btn btn-primary mt-2">Return to Game Modes</a>
                    </div>
                </div>
            `;
            authCheck.classList.remove('d-none');
            classGameContainer.classList.add('d-none');
            return;
        }

        // Hide auth check, show class game container
        authCheck.classList.add('d-none');
        classGameContainer.classList.remove('d-none');

        // Set class game session
        classGameSession = gameResult.data;

        // Update UI with section info
        updateSectionInfo();

        // Join the game session
        await joinGameSession();

        // Set up real-time listeners
        setupRealTimeListeners();

        // Set up event listeners for trading
        setupTradingEventListeners();

        // Initialize charts
        initializeCharts();
    } catch (error) {
        console.error('Error initializing class game:', error);
        authCheck.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="mr-3">
                    <i class="fas fa-exclamation-triangle fa-2x"></i>
                </div>
                <div>
                    <h5 class="mb-1">Error</h5>
                    <p class="mb-0">An error occurred while initializing the class game. Please try again later.</p>
                    <a href="game-modes.html" class="btn btn-primary mt-2">Return to Game Modes</a>
                </div>
            </div>
        `;
        authCheck.classList.remove('d-none');
        classGameContainer.classList.add('d-none');
    }
});

// Update section info in the UI
function updateSectionInfo() {
    // Format day name
    const dayNames = {
        'M': 'Monday',
        'T': 'Tuesday',
        'W': 'Wednesday',
        'R': 'Thursday',
        'F': 'Friday'
    };

    const dayName = dayNames[currentSection.day] || currentSection.day;

    // Update UI
    sectionInfo.textContent = `${dayName} ${currentSection.time}`;
    taName.textContent = currentSection.ta;
    roundNumber.textContent = classGameSession.currentRound;
    maxRounds.textContent = classGameSession.maxRounds;
    playerCount.textContent = classGameSession.playerCount || 0;
}

// Join the game session
async function joinGameSession() {
    try {
        // Check if already joined
        const participantResult = await Service.getGameParticipant(classGameSession.id, currentStudentId);

        if (!participantResult.success || !participantResult.data) {
            // Not joined yet, join the game
            await Service.joinClassGame(classGameSession.id, currentStudentId, currentStudentName);
        }

        // Initialize game state based on current round
        if (classGameSession.currentRound > 0) {
            // First, try to get the TA's game state to get the official asset prices
            const taGameStateResult = await firebase.firestore()
                .collection('game_states')
                .where('gameId', '==', classGameSession.id)
                .where('roundNumber', '==', classGameSession.currentRound)
                .where('studentId', '==', 'TA_DEFAULT')
                .limit(1)
                .get();

            let taGameState = null;
            if (!taGameStateResult.empty) {
                console.log('Found TA game state with official asset prices');
                taGameState = taGameStateResult.docs[0].data().gameState;
            }

            // Load game state for this round
            const gameStateResult = await Service.getGameState(classGameSession.id, currentStudentId);

            if (gameStateResult.success && gameStateResult.data) {
                // Set game state
                gameState = gameStateResult.data.gameState;
                playerState = gameStateResult.data.playerState;

                // If we have TA game state, use those asset prices instead
                if (taGameState) {
                    console.log('Using TA asset prices:', taGameState.assetPrices);
                    gameState.assetPrices = taGameState.assetPrices;
                    gameState.priceHistory = taGameState.priceHistory;
                    gameState.cpi = taGameState.cpi;
                    gameState.cpiHistory = taGameState.cpiHistory;
                }

                // Update UI
                updateUI();
            } else {
                // Initialize new game state
                await initializeGame();

                // Save game state
                await saveGameStateToFirebase();
            }
        } else {
            // Game hasn't started yet, initialize new game
            await initializeGame();
        }

        // Show/hide appropriate screens based on game state
        updateGameDisplay();
    } catch (error) {
        console.error('Error joining game session:', error);
        throw error;
    }
}

// Set up real-time listeners
function setupRealTimeListeners() {
    // Listen for changes to the game session
    classGameUnsubscribe = firebase.firestore()
        .collection('game_sessions')
        .doc(classGameSession.id)
        .onSnapshot(async (doc) => {
            if (doc.exists) {
                const updatedSession = doc.data();

                // Check if round has changed
                const roundChanged = classGameSession.currentRound !== updatedSession.currentRound;

                // Update session data
                classGameSession = updatedSession;

                // Update UI
                updateSectionInfo();

                // Handle round change
                if (roundChanged) {
                    await handleRoundChange();
                }

                // Update game display
                updateGameDisplay();
            }
        });

    // Listen for changes to the leaderboard
    leaderboardUnsubscribe = firebase.firestore()
        .collection('game_participants')
        .where('gameId', '==', classGameSession.id)
        .onSnapshot((snapshot) => {
            const participants = [];

            snapshot.forEach((doc) => {
                participants.push(doc.data());
            });

            // Update leaderboard
            updateClassLeaderboard(participants);
        });
}

// Handle round change
async function handleRoundChange() {
    try {
        console.log('Handling round change to round:', classGameSession.currentRound);

        if (classGameSession.currentRound > 0) {
            // First, try to get the TA's game state to get the official asset prices
            const taGameStateResult = await firebase.firestore()
                .collection('game_states')
                .where('gameId', '==', classGameSession.id)
                .where('roundNumber', '==', classGameSession.currentRound)
                .where('studentId', '==', 'TA_DEFAULT')
                .limit(1)
                .get();

            let taGameState = null;
            if (!taGameStateResult.empty) {
                console.log('Found TA game state with official asset prices');
                taGameState = taGameStateResult.docs[0].data().gameState;
            }

            // Then, load the player's game state for this round
            const gameStateResult = await Service.getGameState(classGameSession.id, currentStudentId);

            if (gameStateResult.success && gameStateResult.data) {
                console.log('Found existing player game state for this round');
                // Set game state and player state
                gameState = gameStateResult.data.gameState;
                playerState = gameStateResult.data.playerState;

                // If we have TA game state, use those asset prices instead
                if (taGameState) {
                    console.log('Using TA asset prices:', taGameState.assetPrices);
                    gameState.assetPrices = taGameState.assetPrices;
                    gameState.priceHistory = taGameState.priceHistory;
                    gameState.cpi = taGameState.cpi;
                    gameState.cpiHistory = taGameState.cpiHistory;

                    // Apply cash injection
                    const cashInjection = calculateCashInjection();
                    if (cashInjection > 0) {
                        console.log(`Applying cash injection of ${formatCurrency(cashInjection)}`);
                        playerState.cash += cashInjection;
                        gameState.lastCashInjection = cashInjection;
                        gameState.totalCashInjected += cashInjection;

                        // Show cash injection alert
                        const cashInjectionAlert = document.getElementById('cash-injection-alert');
                        const cashInjectionAmount = document.getElementById('cash-injection-amount');

                        if (cashInjectionAlert && cashInjectionAmount) {
                            cashInjectionAlert.style.display = 'block';
                            cashInjectionAmount.textContent = cashInjection.toFixed(2);
                            cashInjectionAlert.className = 'alert alert-success py-1 px-2 mb-2';

                            // Hide alert after 5 seconds
                            setTimeout(() => {
                                cashInjectionAlert.style.display = 'none';
                            }, 5000);
                        }
                    }
                }
            } else {
                console.log('No existing game state found, creating new state');

                // If we have TA game state, use it to initialize the player's game state
                if (taGameState) {
                    console.log('Initializing with TA asset prices');
                    gameState = {
                        assetPrices: taGameState.assetPrices,
                        priceHistory: taGameState.priceHistory,
                        cpi: taGameState.cpi,
                        cpiHistory: taGameState.cpiHistory,
                        lastCashInjection: 0,
                        totalCashInjected: 0
                    };

                    // Apply cash injection
                    const cashInjection = calculateCashInjection();
                    if (cashInjection > 0) {
                        console.log(`Applying cash injection of ${formatCurrency(cashInjection)}`);
                        playerState.cash += cashInjection;
                        gameState.lastCashInjection = cashInjection;
                        gameState.totalCashInjected += cashInjection;

                        // Show cash injection alert
                        const cashInjectionAlert = document.getElementById('cash-injection-alert');
                        const cashInjectionAmount = document.getElementById('cash-injection-amount');

                        if (cashInjectionAlert && cashInjectionAmount) {
                            cashInjectionAlert.style.display = 'block';
                            cashInjectionAmount.textContent = cashInjection.toFixed(2);
                            cashInjectionAlert.className = 'alert alert-success py-1 px-2 mb-2';

                            // Hide alert after 5 seconds
                            setTimeout(() => {
                                cashInjectionAlert.style.display = 'none';
                            }, 5000);
                        }
                    }
                } else {
                    // Fallback to advancing to next round with local price generation
                    console.log('No TA game state found, using local price generation');
                    nextRound();
                }
            }

            // Update UI
            console.log('Updating UI after round change');
            updateUI();

            // Save game state
            console.log('Saving game state to Firebase');
            await saveGameStateToFirebase();
        }
    } catch (error) {
        console.error('Error handling round change:', error);
    }
}

// Initialize charts
let portfolioChart = null;
let portfolioAllocationChart = null;
let comparativeReturnsChart = null;

// Initialize charts
function initializeCharts() {
    console.log('Initializing charts');

    try {
        // Portfolio chart
        const portfolioChartCtx = document.getElementById('portfolio-chart');
        if (portfolioChartCtx) {
            portfolioChart = new Chart(portfolioChartCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Portfolio Value',
                        data: [],
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: false,
                            title: {
                                display: true,
                                text: 'Portfolio Value ($)'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Round'
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Value: $${context.raw.toFixed(2)}`;
                                }
                            }
                        }
                    }
                }
            });
        }

        // Portfolio allocation chart
        const portfolioAllocationChartCtx = document.getElementById('portfolio-allocation-chart');
        if (portfolioAllocationChartCtx) {
            portfolioAllocationChart = new Chart(portfolioAllocationChartCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Cash'],
                    datasets: [{
                        data: [100],
                        backgroundColor: ['rgba(54, 162, 235, 0.8)'],
                        borderColor: ['rgba(54, 162, 235, 1)'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.label}: ${context.raw.toFixed(1)}%`;
                                }
                            }
                        }
                    }
                }
            });
        }

        // Comparative returns chart
        const comparativeReturnsChartCtx = document.getElementById('comparative-returns-chart');
        if (comparativeReturnsChartCtx) {
            comparativeReturnsChart = new Chart(comparativeReturnsChartCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'S&P 500',
                            data: [],
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.1)',
                            borderWidth: 2,
                            hidden: false
                        },
                        {
                            label: 'Bonds',
                            data: [],
                            borderColor: 'rgba(153, 102, 255, 1)',
                            backgroundColor: 'rgba(153, 102, 255, 0.1)',
                            borderWidth: 2,
                            hidden: false
                        },
                        {
                            label: 'Real Estate',
                            data: [],
                            borderColor: 'rgba(255, 159, 64, 1)',
                            backgroundColor: 'rgba(255, 159, 64, 0.1)',
                            borderWidth: 2,
                            hidden: false
                        },
                        {
                            label: 'Gold',
                            data: [],
                            borderColor: 'rgba(255, 206, 86, 1)',
                            backgroundColor: 'rgba(255, 206, 86, 0.1)',
                            borderWidth: 2,
                            hidden: false
                        },
                        {
                            label: 'Commodities',
                            data: [],
                            borderColor: 'rgba(54, 162, 235, 1)',
                            backgroundColor: 'rgba(54, 162, 235, 0.1)',
                            borderWidth: 2,
                            hidden: false
                        },
                        {
                            label: 'Bitcoin',
                            data: [],
                            borderColor: 'rgba(255, 99, 132, 1)',
                            backgroundColor: 'rgba(255, 99, 132, 0.1)',
                            borderWidth: 2,
                            hidden: false
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                                display: true,
                                text: 'Return (%)'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Round'
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
                                    enabled: true
                                },
                                pinch: {
                                    enabled: true
                                },
                                mode: 'xy'
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${context.raw.toFixed(2)}%`;
                                }
                            }
                        }
                    }
                }
            });

            // Reset zoom button
            const resetZoomButton = document.getElementById('reset-comparative-zoom');
            if (resetZoomButton) {
                resetZoomButton.addEventListener('click', function() {
                    comparativeReturnsChart.resetZoom();
                });
            }

            // Asset toggle checkboxes
            const assetToggles = {
                'S&P 500': document.getElementById('show-sp500'),
                'Bonds': document.getElementById('show-bonds'),
                'Real Estate': document.getElementById('show-real-estate'),
                'Gold': document.getElementById('show-gold'),
                'Commodities': document.getElementById('show-commodities'),
                'Bitcoin': document.getElementById('show-bitcoin')
            };

            // Add event listeners to toggle visibility
            for (const [asset, toggle] of Object.entries(assetToggles)) {
                if (toggle) {
                    toggle.addEventListener('change', function() {
                        const index = comparativeReturnsChart.data.datasets.findIndex(dataset => dataset.label === asset);
                        if (index !== -1) {
                            comparativeReturnsChart.data.datasets[index].hidden = !this.checked;
                            comparativeReturnsChart.update();
                        }
                    });
                }
            }
        }

        console.log('Charts initialized successfully');
    } catch (error) {
        console.error('Error initializing charts:', error);
    }
}

// Update UI with current game state
function updateUI() {
    console.log('Updating UI with current game state');
    console.log('Current asset prices:', gameState.assetPrices);

    try {
        // Update cash and portfolio values
        const cashDisplay = document.getElementById('cash-display');
        const portfolioValueDisplay = document.getElementById('portfolio-value-display');
        const totalValueDisplay = document.getElementById('total-value-display');
        const cpiDisplay = document.getElementById('cpi-display');
        const portfolioValueBadge = document.getElementById('portfolio-value-badge');

        // Calculate portfolio value using calculateTotalValue function
        const totalValue = calculateTotalValue();
        const portfolioValue = totalValue - playerState.cash;

        // Update displays
        if (cashDisplay) cashDisplay.textContent = playerState.cash.toFixed(2);
        if (portfolioValueDisplay) portfolioValueDisplay.textContent = portfolioValue.toFixed(2);
        if (totalValueDisplay) totalValueDisplay.textContent = totalValue.toFixed(2);
        if (portfolioValueBadge) portfolioValueBadge.textContent = totalValue.toFixed(2);
        if (cpiDisplay) cpiDisplay.textContent = gameState.cpi.toFixed(2);

        // Update portfolio table
        updatePortfolioTable(portfolioValue);

        // Update asset prices table
        updateAssetPricesTable();

        // Update available cash display
        updateAvailableCash();

        // Update price ticker
        updatePriceTicker();

        // Update charts
        updateCharts(totalValue);

        console.log('UI updated successfully');
        console.log('Portfolio value:', portfolioValue);
        console.log('Total value:', totalValue);
    } catch (error) {
        console.error('Error updating UI:', error);
    }
}

// Update charts with current data
function updateCharts(totalValue) {
    try {
        // Update portfolio chart
        if (portfolioChart) {
            // Add current round and value to chart
            const currentRound = classGameSession.currentRound;

            // Update labels if needed
            if (portfolioChart.data.labels.length <= currentRound) {
                for (let i = portfolioChart.data.labels.length; i <= currentRound; i++) {
                    portfolioChart.data.labels.push(i);
                }
            }

            // Update data
            if (portfolioChart.data.datasets[0].data.length <= currentRound) {
                // Add missing data points
                for (let i = portfolioChart.data.datasets[0].data.length; i < currentRound; i++) {
                    portfolioChart.data.datasets[0].data.push(null);
                }
                portfolioChart.data.datasets[0].data.push(totalValue);
            } else {
                // Update existing data point
                portfolioChart.data.datasets[0].data[currentRound] = totalValue;
            }

            portfolioChart.update();
        }

        // Update portfolio allocation chart
        if (portfolioAllocationChart) {
            const labels = ['Cash'];
            const data = [playerState.cash];
            const colors = ['rgba(54, 162, 235, 0.8)'];
            const borderColors = ['rgba(54, 162, 235, 1)'];

            // Add each asset to the chart
            const assetColors = {
                'S&P 500': ['rgba(75, 192, 192, 0.8)', 'rgba(75, 192, 192, 1)'],
                'Bonds': ['rgba(153, 102, 255, 0.8)', 'rgba(153, 102, 255, 1)'],
                'Real Estate': ['rgba(255, 159, 64, 0.8)', 'rgba(255, 159, 64, 1)'],
                'Gold': ['rgba(255, 206, 86, 0.8)', 'rgba(255, 206, 86, 1)'],
                'Commodities': ['rgba(54, 162, 235, 0.8)', 'rgba(54, 162, 235, 1)'],
                'Bitcoin': ['rgba(255, 99, 132, 0.8)', 'rgba(255, 99, 132, 1)']
            };

            for (const asset in playerState.portfolio) {
                const quantity = playerState.portfolio[asset];
                if (quantity > 0) {
                    const price = gameState.assetPrices[asset];
                    const value = quantity * price;

                    labels.push(asset);
                    data.push(value);

                    // Add color
                    if (assetColors[asset]) {
                        colors.push(assetColors[asset][0]);
                        borderColors.push(assetColors[asset][1]);
                    } else {
                        // Default color if asset not in predefined colors
                        colors.push('rgba(128, 128, 128, 0.8)');
                        borderColors.push('rgba(128, 128, 128, 1)');
                    }
                }
            }

            // Convert to percentages
            const totalPortfolioValue = data.reduce((sum, value) => sum + value, 0);
            const percentages = data.map(value => (value / totalPortfolioValue) * 100);

            // Update chart
            portfolioAllocationChart.data.labels = labels;
            portfolioAllocationChart.data.datasets[0].data = percentages;
            portfolioAllocationChart.data.datasets[0].backgroundColor = colors;
            portfolioAllocationChart.data.datasets[0].borderColor = borderColors;
            portfolioAllocationChart.update();
        }

        // Update comparative returns chart
        if (comparativeReturnsChart) {
            // Always update the chart, even in round 0
            const currentRound = classGameSession.currentRound;

            // Make sure we have labels for all rounds including round 0
            if (comparativeReturnsChart.data.labels.length <= currentRound) {
                for (let i = comparativeReturnsChart.data.labels.length; i <= currentRound; i++) {
                    comparativeReturnsChart.data.labels.push(i);
                }
            }

            // Calculate returns for each asset
            const assets = ['S&P 500', 'Bonds', 'Real Estate', 'Gold', 'Commodities', 'Bitcoin'];
            const initialPrices = {
                'S&P 500': 100,
                'Bonds': 100,
                'Real Estate': 5000,
                'Gold': 3000,
                'Commodities': 100,
                'Bitcoin': 50000
            };

            assets.forEach((asset, index) => {
                if (gameState.assetPrices[asset] && gameState.priceHistory[asset]) {
                    const currentPrice = gameState.assetPrices[asset];
                    const initialPrice = initialPrices[asset];
                    const returnPercent = ((currentPrice / initialPrice) - 1) * 100;

                    // Update data
                    if (comparativeReturnsChart.data.datasets[index].data.length <= currentRound) {
                        // Add missing data points
                        for (let i = comparativeReturnsChart.data.datasets[index].data.length; i < currentRound; i++) {
                            comparativeReturnsChart.data.datasets[index].data.push(null);
                        }
                        comparativeReturnsChart.data.datasets[index].data.push(returnPercent);
                    } else {
                        // Update existing data point
                        comparativeReturnsChart.data.datasets[index].data[currentRound] = returnPercent;
                    }
                }
            });

            comparativeReturnsChart.update();
        }
    } catch (error) {
        console.error('Error updating charts:', error);
    }
}

// Update game display based on current state
function updateGameDisplay() {
    console.log('Updating game display, current round:', classGameSession.currentRound);

    // Update round displays
    const currentRoundDisplay = document.getElementById('current-round-display');
    const marketRoundDisplay = document.getElementById('market-round-display');
    const portfolioRoundDisplay = document.getElementById('portfolio-round-display');

    if (currentRoundDisplay) currentRoundDisplay.textContent = classGameSession.currentRound;
    if (marketRoundDisplay) marketRoundDisplay.textContent = classGameSession.currentRound;
    if (portfolioRoundDisplay) portfolioRoundDisplay.textContent = classGameSession.currentRound;

    // Update progress bar
    const progressBar = document.getElementById('round-progress');
    if (progressBar) {
        const progress = (classGameSession.currentRound / classGameSession.maxRounds) * 100;
        progressBar.style.width = progress + '%';
        progressBar.setAttribute('aria-valuenow', progress);
        progressBar.textContent = progress.toFixed(0) + '%';
    }

    if (classGameSession.currentRound > classGameSession.maxRounds) {
        // Game is over
        waitingScreen.innerHTML = `
            <i class="fas fa-trophy waiting-icon text-warning"></i>
            <h3 class="mb-3">Game Complete!</h3>
            <p class="text-muted mb-4">The class game has ended. Your final portfolio value: ${formatCurrency(calculateTotalValue())}</p>
            <a href="leaderboard.html" class="btn btn-primary">View Full Leaderboard</a>
        `;
        waitingScreen.classList.remove('d-none');
        gameContent.classList.add('d-none');
    } else {
        // Game is in progress or waiting to start (round 0)
        // Always show game content to allow trading in round 0
        waitingScreen.classList.add('d-none');
        gameContent.classList.remove('d-none');

        // If in round 0, show a notification that TA will advance the game
        const cashInjectionAlert = document.getElementById('cash-injection-alert');
        if (classGameSession.currentRound === 0) {
            if (cashInjectionAlert) {
                cashInjectionAlert.className = 'alert alert-info py-1 px-2 mb-2';
                cashInjectionAlert.style.display = 'block';
                cashInjectionAlert.innerHTML = '<strong>Waiting for TA</strong> You can start trading now. The TA will advance to round 1 when ready.';
            }
        } else {
            // Hide the notification in other rounds
            if (cashInjectionAlert && cashInjectionAlert.innerHTML.includes('Waiting for TA')) {
                cashInjectionAlert.style.display = 'none';
            }
        }

        // Update price ticker
        updatePriceTicker();
    }
}

// Update class leaderboard
function updateClassLeaderboard(participants) {
    console.log('Updating class leaderboard with participants:', participants);

    // Sort participants by portfolio value
    participants.sort((a, b) => b.portfolioValue - a.portfolioValue);

    // Clear leaderboard
    classLeaderboardBody.innerHTML = '';

    if (participants.length === 0) {
        classLeaderboardBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-3">
                    No participants have joined the game yet.
                </td>
            </tr>
        `;
        return;
    }

    // Add each participant to the leaderboard
    participants.forEach((participant, index) => {
        const rank = index + 1;
        const row = document.createElement('tr');

        // Highlight current user
        if (participant.studentId === currentStudentId) {
            row.classList.add('table-primary');
        }

        // Create rank cell with badge for top 3
        let rankCell = '';
        if (rank <= 3) {
            rankCell = `
                <td>
                    <div class="rank-badge rank-${rank}">
                        ${rank}
                    </div>
                </td>
            `;
        } else {
            rankCell = `<td>${rank}</td>`;
        }

        // Get the portfolio value, ensure it's a number
        const portfolioValue = typeof participant.portfolioValue === 'number' ?
            participant.portfolioValue : 10000;

        console.log(`Participant ${participant.studentName} portfolio value: ${portfolioValue}`);

        // Calculate return percentage
        const returnPct = ((portfolioValue - 10000) / 10000) * 100;
        const returnClass = returnPct >= 0 ? 'text-success' : 'text-danger';

        // Create the row HTML
        row.innerHTML = `
            ${rankCell}
            <td>${participant.studentName}${participant.studentId === currentStudentId ? ' <span class="badge badge-info">You</span>' : ''}</td>
            <td>${formatCurrency(portfolioValue)}</td>
            <td class="${returnClass}">${returnPct >= 0 ? '+' : ''}${returnPct.toFixed(2)}%</td>
        `;

        classLeaderboardBody.appendChild(row);
    });

    // Update player count
    playerCount.textContent = participants.length;
}

// Set up event listeners for trading
function setupTradingEventListeners() {
    console.log('Setting up trading event listeners');

    // Trade form submission
    const tradeForm = document.getElementById('trade-form');
    if (tradeForm) {
        tradeForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            await executeTrade();
            await saveGameStateToFirebase();
        });
    }

    // Asset select change
    const assetSelect = document.getElementById('asset-select');
    if (assetSelect) {
        assetSelect.addEventListener('change', updateAssetPrice);
    }

    // Amount input change
    const amountInput = document.getElementById('amount-input');
    if (amountInput) {
        amountInput.addEventListener('input', updateTotalCost);
    }

    // Action select change
    const actionSelect = document.getElementById('action-select');
    if (actionSelect) {
        actionSelect.addEventListener('change', updateTotalCost);
    }

    // Buy amount input
    const buyAmount = document.getElementById('buy-amount');
    if (buyAmount) {
        console.log('Setting up buy amount input');
        // Initialize with available cash
        document.getElementById('available-cash-display').textContent = playerState.cash.toFixed(2);
    } else {
        console.error('Buy amount input not found');
    }

    // Quick buy button
    const quickBuyBtn = document.getElementById('quick-buy-btn');
    if (quickBuyBtn) {
        quickBuyBtn.addEventListener('click', async function() {
            console.log('Quick buy button clicked');
            const result = await quickBuySelectedAsset();
            if (result) {
                console.log('Quick buy successful, saving game state');
                await saveGameStateToFirebase();
            } else {
                console.log('Quick buy failed, not saving game state');
            }
        });
    }

    // Buy all button
    const buyAllBtn = document.getElementById('buy-all-btn');
    if (buyAllBtn) {
        buyAllBtn.addEventListener('click', async function() {
            await buyAllAssets();
            await saveGameStateToFirebase();
        });
    }

    // Sell all button
    const sellAllBtn = document.getElementById('sell-all-btn');
    if (sellAllBtn) {
        sellAllBtn.addEventListener('click', async function() {
            await sellAllAssets();
            await saveGameStateToFirebase();
        });
    }
}

// Save game state to Firebase
async function saveGameStateToFirebase() {
    try {
        console.log('Saving game state to Firebase');

        // Calculate total portfolio value
        const totalValue = calculateTotalValue();
        console.log('Total value to save:', totalValue);
        console.log('Current asset prices for saving:', gameState.assetPrices);
        console.log('Current portfolio:', playerState.portfolio);
        console.log('Current cash:', playerState.cash);

        // Make sure gameState has the current round number
        gameState.roundNumber = classGameSession.currentRound;

        // Save game state
        const result = await Service.saveGameState(
            classGameSession.id,
            currentStudentId,
            currentStudentName,
            gameState,
            playerState,
            totalValue
        );

        if (!result.success) {
            console.error('Error from Service.saveGameState:', result.error);
            return false;
        }

        // Also update the participant record directly to ensure it has the latest portfolio value
        // This is a workaround in case the saveGameState function isn't updating the participant record correctly
        try {
            const participantId = `${classGameSession.id}_${currentStudentId}`;
            await firebase.firestore()
                .collection('game_participants')
                .doc(participantId)
                .update({
                    portfolioValue: totalValue,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                });
            console.log('Participant record updated directly with portfolio value:', totalValue);

            // Force a refresh of the leaderboard
            const participantsSnapshot = await firebase.firestore()
                .collection('game_participants')
                .where('gameId', '==', classGameSession.id)
                .get();

            const participants = [];
            participantsSnapshot.forEach(doc => {
                participants.push(doc.data());
            });

            updateClassLeaderboard(participants);
        } catch (participantError) {
            console.error('Error updating participant record directly:', participantError);
            // Continue even if this fails, as the main saveGameState should have worked
        }

        console.log('Game state saved successfully');
        return true;
    } catch (error) {
        console.error('Error saving game state to Firebase:', error);
        return false;
    }
}

// Calculate total portfolio value
function calculateTotalValue() {
    let portfolioValue = 0;

    // Calculate value of all assets
    for (const asset in playerState.portfolio) {
        const quantity = playerState.portfolio[asset];
        const price = gameState.assetPrices[asset];
        if (quantity > 0 && price > 0) {
            portfolioValue += quantity * price;
        }
    }

    // Add cash
    const totalValue = portfolioValue + playerState.cash;
    console.log(`Calculated total value: ${totalValue} (Portfolio: ${portfolioValue}, Cash: ${playerState.cash})`);
    return totalValue;
}

// Format currency
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(value);
}

// Show trade notification
function showTradeNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('trade-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'trade-notification';
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.padding = '10px 15px';
        notification.style.borderRadius = '5px';
        notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        notification.style.zIndex = '1000';
        notification.style.transition = 'opacity 0.3s ease-in-out';
        notification.style.opacity = '0';
        document.body.appendChild(notification);
    }

    // Set notification type
    if (type === 'success') {
        notification.style.backgroundColor = '#28a745';
        notification.style.color = 'white';
    } else if (type === 'danger') {
        notification.style.backgroundColor = '#dc3545';
        notification.style.color = 'white';
    } else if (type === 'warning') {
        notification.style.backgroundColor = '#ffc107';
        notification.style.color = 'black';
    } else {
        notification.style.backgroundColor = '#17a2b8';
        notification.style.color = 'white';
    }

    // Set message
    notification.textContent = message;

    // Show notification
    notification.style.opacity = '1';

    // Hide after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
    }, 3000);
}

// Update asset price in trade form
function updateAssetPrice() {
    const assetSelect = document.getElementById('asset-select');
    const currentPriceDisplay = document.getElementById('current-price-display');

    if (!assetSelect || !currentPriceDisplay) return;

    const selectedAsset = assetSelect.value;

    if (selectedAsset && gameState.assetPrices[selectedAsset]) {
        currentPriceDisplay.textContent = gameState.assetPrices[selectedAsset].toFixed(2);
        updateTotalCost();
    } else {
        currentPriceDisplay.textContent = '0.00';
    }
}

// Update total cost in trade form
function updateTotalCost() {
    const assetSelect = document.getElementById('asset-select');
    const actionSelect = document.getElementById('action-select');
    const amountInput = document.getElementById('amount-input');
    const quantityDisplay = document.getElementById('quantity-display');
    const totalCostDisplay = document.getElementById('total-cost-display');

    if (!assetSelect || !actionSelect || !amountInput || !quantityDisplay || !totalCostDisplay) return;

    const selectedAsset = assetSelect.value;
    const action = actionSelect.value;
    const amount = parseFloat(amountInput.value) || 0;

    if (selectedAsset && gameState.assetPrices[selectedAsset]) {
        const price = gameState.assetPrices[selectedAsset];

        // Calculate quantity based on amount
        const quantity = amount / price;

        // Update displays
        quantityDisplay.textContent = quantity.toFixed(6);
        totalCostDisplay.textContent = amount.toFixed(2);

        // Validate amount based on action
        if (action === 'buy' && amount > playerState.cash) {
            amountInput.classList.add('is-invalid');
            totalCostDisplay.classList.add('text-danger');
        } else if (action === 'sell') {
            const currentQuantity = playerState.portfolio[selectedAsset] || 0;
            const maxSellAmount = currentQuantity * price;

            if (amount > maxSellAmount) {
                amountInput.classList.add('is-invalid');
                totalCostDisplay.classList.add('text-danger');
            } else {
                amountInput.classList.remove('is-invalid');
                totalCostDisplay.classList.remove('text-danger');
            }
        } else {
            amountInput.classList.remove('is-invalid');
            totalCostDisplay.classList.remove('text-danger');
        }
    } else {
        quantityDisplay.textContent = '0.00';
        totalCostDisplay.textContent = '0.00';
    }
}

// Execute trade
async function executeTrade() {
    try {
        console.log('Executing trade...');
        const assetSelect = document.getElementById('asset-select');
        const actionSelect = document.getElementById('action-select');
        const amountInput = document.getElementById('amount-input');
        const quantityDisplay = document.getElementById('quantity-display');

        if (!assetSelect || !actionSelect || !amountInput || !quantityDisplay) {
            console.error('Missing form elements');
            return false;
        }

        const selectedAsset = assetSelect.value;
        const action = actionSelect.value;
        const amount = parseFloat(amountInput.value) || 0;
        const price = gameState.assetPrices[selectedAsset];
        const quantity = amount / price;

        console.log(`Trade details: Asset=${selectedAsset}, Action=${action}, Amount=$${amount}, Quantity=${quantity}`);
        console.log(`Current cash: ${playerState.cash}`);
        console.log(`Current portfolio:`, playerState.portfolio);

        if (!selectedAsset || amount <= 0) {
            console.log('Invalid asset or amount');
            return false;
        }

        if (action === 'buy') {
            // Buy asset
            console.log(`Buy: Price=${price}, Amount=${amount}, Quantity=${quantity}`);

            if (amount > playerState.cash) {
                console.log('Not enough cash to complete this purchase');
                return false;
            }

            // Update player state
            playerState.cash -= amount;
            playerState.portfolio[selectedAsset] = (playerState.portfolio[selectedAsset] || 0) + quantity;

            // Add to trade history
            playerState.tradeHistory.push({
                asset: selectedAsset,
                action: 'buy',
                quantity: quantity,
                price: price,
                totalCost: amount,
                timestamp: new Date().toISOString()
            });

            // Update UI
            updateUI();

            // Reset form
            amountInput.value = '';
            updateTotalCost();

            // Show success message
            showTradeNotification(`Bought ${quantity.toFixed(6)} ${selectedAsset} for $${amount.toFixed(2)}`, 'success');

            console.log(`Bought ${quantity} ${selectedAsset} for $${amount.toFixed(2)}`);
            console.log(`Updated cash: ${playerState.cash}`);
            console.log(`Updated portfolio:`, playerState.portfolio);

            // Save game state
            await saveGameStateToFirebase();

            return true;
        } else if (action === 'sell') {
            // Sell asset
            const currentQuantity = playerState.portfolio[selectedAsset] || 0;
            const maxSellAmount = currentQuantity * price;

            console.log(`Sell: Current quantity of ${selectedAsset}: ${currentQuantity}, Max sell amount: $${maxSellAmount.toFixed(2)}`);

            if (amount > maxSellAmount) {
                console.log(`Not enough ${selectedAsset} to sell. Max sell amount: $${maxSellAmount.toFixed(2)}`);
                return false;
            }

            // Calculate exact quantity to sell based on amount
            const sellQuantity = amount / price;

            console.log(`Sell: Price=${price}, Amount=${amount}, Quantity=${sellQuantity}`);

            // Update player state
            playerState.cash += amount;
            playerState.portfolio[selectedAsset] -= sellQuantity;

            // Remove asset from portfolio if quantity is 0 or very close to 0 (floating point precision)
            if (playerState.portfolio[selectedAsset] < 0.000001) {
                delete playerState.portfolio[selectedAsset];
            }

            // Add to trade history
            playerState.tradeHistory.push({
                asset: selectedAsset,
                action: 'sell',
                quantity: sellQuantity,
                price: price,
                totalValue: amount,
                timestamp: new Date().toISOString()
            });

            // Update UI
            updateUI();

            // Reset form
            amountInput.value = '';
            updateTotalCost();

            // Show success message
            showTradeNotification(`Sold ${sellQuantity.toFixed(6)} ${selectedAsset} for $${amount.toFixed(2)}`, 'success');

            console.log(`Sold ${sellQuantity} ${selectedAsset} for $${amount.toFixed(2)}`);
            console.log(`Updated cash: ${playerState.cash}`);
            console.log(`Updated portfolio:`, playerState.portfolio);

            // Save game state
            await saveGameStateToFirebase();

            return true;
        }
    } catch (error) {
        console.error('Error executing trade:', error);
        showTradeNotification('Error executing trade. Please try again.', 'danger');
        return false;
    }

    return false;
}

// Buy all assets evenly
async function buyAllAssets() {
    try {
        console.log('Buying all assets evenly...');
        console.log(`Current cash: ${playerState.cash}`);
        console.log(`Current portfolio:`, playerState.portfolio);

        // Get all available assets
        const assets = Object.keys(gameState.assetPrices);

        if (assets.length === 0) {
            console.log('No assets available to buy.');
            return false;
        }

        // Check if we have cash first
        if (playerState.cash <= 0) {
            console.log('No cash to distribute.');
            return false;
        }

        // Calculate cash per asset
        const cashPerAsset = playerState.cash / assets.length;

        if (cashPerAsset <= 0) {
            console.log('Not enough cash to distribute.');
            return false;
        }

        console.log(`Distributing ${formatCurrency(playerState.cash)} across ${assets.length} assets (${formatCurrency(cashPerAsset)} per asset)`);

        // Buy each asset
        for (const asset of assets) {
            const price = gameState.assetPrices[asset];
            const quantity = cashPerAsset / price;

            console.log(`Buying ${asset}: Price=${price}, Quantity=${quantity.toFixed(4)}, Cost=${cashPerAsset.toFixed(2)}`);

            if (quantity > 0) {
                // Update player state
                playerState.portfolio[asset] = (playerState.portfolio[asset] || 0) + quantity;

                // Add to trade history
                playerState.tradeHistory.push({
                    asset: asset,
                    action: 'buy',
                    quantity: quantity,
                    price: price,
                    totalCost: cashPerAsset,
                    timestamp: new Date().toISOString()
                });
            }
        }

        // Set cash to 0
        playerState.cash = 0;

        // Update UI
        updateUI();

        console.log('Distributed cash evenly across all assets');
        console.log(`Updated cash: ${playerState.cash}`);
        console.log(`Updated portfolio:`, playerState.portfolio);

        return true;
    } catch (error) {
        console.error('Error buying all assets:', error);
        alert('An error occurred while buying assets. Please try again.');
        return false;
    }
}

// Sell all assets
async function sellAllAssets() {
    try {
        console.log('Selling all assets...');
        console.log(`Current cash: ${playerState.cash}`);
        console.log(`Current portfolio:`, playerState.portfolio);

        // Check if there are assets to sell
        if (Object.keys(playerState.portfolio).length === 0) {
            console.log('No assets to sell');
            return false;
        }

        // Check if there are any assets with quantity > 0
        let hasAssets = false;
        for (const [asset, quantity] of Object.entries(playerState.portfolio)) {
            if (quantity > 0) {
                hasAssets = true;
                break;
            }
        }

        if (!hasAssets) {
            console.log('No assets with positive quantity');
            console.log('No assets with positive quantity to sell.');
            return false;
        }

        let totalSaleValue = 0;

        // Sell each asset
        for (const [asset, quantity] of Object.entries(playerState.portfolio)) {
            if (quantity > 0) {
                const price = gameState.assetPrices[asset];
                const totalValue = price * quantity;

                console.log(`Selling ${asset}: Quantity=${quantity}, Price=${price}, Value=${totalValue.toFixed(2)}`);

                // Update player cash
                playerState.cash += totalValue;
                totalSaleValue += totalValue;

                // Add to trade history
                playerState.tradeHistory.push({
                    asset: asset,
                    action: 'sell',
                    quantity: quantity,
                    price: price,
                    totalValue: totalValue,
                    timestamp: new Date().toISOString()
                });
            }
        }

        // Clear portfolio
        playerState.portfolio = {};

        // Update UI
        updateUI();

        console.log(`Sold all assets for a total of ${formatCurrency(totalSaleValue)}`);
        console.log(`Updated cash: ${playerState.cash}`);
        console.log(`Updated portfolio:`, playerState.portfolio);

        return true;
    } catch (error) {
        console.error('Error selling all assets:', error);
        alert('An error occurred while selling assets. Please try again.');
        return false;
    }
}

// Update portfolio table
function updatePortfolioTable(totalPortfolioValue) {
    const portfolioTableBody = document.getElementById('portfolio-table-body');
    if (!portfolioTableBody) return;

    // Clear table
    portfolioTableBody.innerHTML = '';

    // If no assets, show message
    if (Object.keys(playerState.portfolio).length === 0) {
        portfolioTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-3">
                    <div class="alert alert-info mb-0">
                        <i class="fas fa-info-circle mr-2"></i>
                        You don't own any assets yet. Use the trading panel to buy assets.
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    // Add cash row
    const cashRow = document.createElement('tr');
    const cashPercentage = (playerState.cash / (totalPortfolioValue + playerState.cash)) * 100;

    cashRow.innerHTML = `
        <td><strong>Cash</strong></td>
        <td>-</td>
        <td>${formatCurrency(playerState.cash)}</td>
        <td>${cashPercentage.toFixed(1)}%</td>
    `;

    portfolioTableBody.appendChild(cashRow);

    // Add each asset to table
    for (const [asset, quantity] of Object.entries(playerState.portfolio)) {
        if (quantity <= 0) continue;

        const price = gameState.assetPrices[asset];
        const value = quantity * price;
        const percentage = (value / (totalPortfolioValue + playerState.cash)) * 100;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${asset}</strong></td>
            <td>${quantity.toFixed(4)}</td>
            <td>${formatCurrency(value)}</td>
            <td>${percentage.toFixed(1)}%</td>
        `;

        portfolioTableBody.appendChild(row);
    }
}

// Update asset prices table
function updateAssetPricesTable() {
    const assetPricesTable = document.getElementById('asset-prices-table');
    if (!assetPricesTable) return;

    // Clear table
    assetPricesTable.innerHTML = '';

    // Add each asset to table
    for (const [asset, price] of Object.entries(gameState.assetPrices)) {
        // Calculate price change
        let priceChange = 0;
        let changePercent = 0;

        const priceHistory = gameState.priceHistory[asset];
        if (priceHistory && priceHistory.length > 1) {
            const previousPrice = priceHistory[priceHistory.length - 2] || price;
            priceChange = price - previousPrice;
            changePercent = (priceChange / previousPrice) * 100;
        }

        // Determine change class and icon
        const changeClass = priceChange >= 0 ? 'text-success' : 'text-danger';
        const changeIcon = priceChange >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';

        // Create mini chart data
        const chartData = priceHistory && priceHistory.length > 0 ?
            priceHistory.slice(-10) : [price];
        const maxChartValue = Math.max(...chartData);

        // Create row
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <strong>${asset}</strong>
            </td>
            <td>${formatCurrency(price)}</td>
            <td class="${changeClass}">
                <i class="fas ${changeIcon} mr-1"></i>
                ${changePercent.toFixed(2)}%
            </td>
            <td>
                <div class="sparkline" style="width: 100px; height: 30px;">
                    ${chartData.map(p => `<span style="height: ${(p / maxChartValue * 100)}%"></span>`).join('')}
                </div>
            </td>
        `;

        assetPricesTable.appendChild(row);
    }
}

// Update price ticker
function updatePriceTicker() {
    const tickerElement = document.getElementById('price-ticker');
    if (!tickerElement) return;

    // Clear ticker
    tickerElement.innerHTML = '';

    // Add each asset to ticker
    for (const [asset, price] of Object.entries(gameState.assetPrices)) {
        // Calculate price change
        let priceChange = 0;
        let changePercent = 0;

        const priceHistory = gameState.priceHistory[asset];
        if (priceHistory && priceHistory.length > 1) {
            const previousPrice = priceHistory[priceHistory.length - 2] || price;
            priceChange = price - previousPrice;
            changePercent = (priceChange / previousPrice) * 100;
        }

        // Determine change class and icon
        const changeClass = priceChange >= 0 ? 'up' : 'down';
        const changeIcon = priceChange >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';

        // Create ticker item
        const tickerItem = document.createElement('div');
        tickerItem.className = `ticker-item ${changeClass}`;
        tickerItem.innerHTML = `
            <strong>${asset}:</strong> ${formatCurrency(price)}
            <i class="fas ${changeIcon} ml-1"></i>
            ${changePercent.toFixed(2)}%
        `;

        tickerElement.appendChild(tickerItem);
    }
}

// Initialize game state for class game
async function initializeGame() {
    console.log('Initializing new game state for class game');

    // Default game state values
    let defaultAssetPrices = {
        'S&P 500': 100,
        'Bonds': 100,
        'Real Estate': 5000,
        'Gold': 3000,
        'Commodities': 100,
        'Bitcoin': 50000
    };

    let defaultPriceHistory = {
        'S&P 500': [100],
        'Bonds': [100],
        'Real Estate': [5000],
        'Gold': [3000],
        'Commodities': [100],
        'Bitcoin': [50000]
    };

    let defaultCpi = 100;
    let defaultCpiHistory = [100];

    // Try to get the TA's game state for round 0 to get the official starting prices
    try {
        if (classGameSession && classGameSession.id) {
            const taGameStateResult = await firebase.firestore()
                .collection('game_states')
                .where('gameId', '==', classGameSession.id)
                .where('roundNumber', '==', 0)
                .where('studentId', '==', 'TA_DEFAULT')
                .limit(1)
                .get();

            if (!taGameStateResult.empty) {
                console.log('Found TA game state with official starting prices');
                const taGameState = taGameStateResult.docs[0].data().gameState;

                // Use TA's asset prices if available
                if (taGameState.assetPrices) {
                    defaultAssetPrices = taGameState.assetPrices;
                    console.log('Using TA asset prices:', defaultAssetPrices);
                }

                // Use TA's price history if available
                if (taGameState.priceHistory) {
                    defaultPriceHistory = taGameState.priceHistory;
                    console.log('Using TA price history');
                }

                // Use TA's CPI if available
                if (taGameState.cpi) {
                    defaultCpi = taGameState.cpi;
                    console.log('Using TA CPI:', defaultCpi);
                }

                // Use TA's CPI history if available
                if (taGameState.cpiHistory) {
                    defaultCpiHistory = taGameState.cpiHistory;
                    console.log('Using TA CPI history');
                }
            } else {
                console.log('No TA game state found for round 0, using default values');
            }
        }
    } catch (error) {
        console.error('Error fetching TA game state:', error);
        console.log('Using default values due to error');
    }

    // Initialize game state with values (either default or from TA)
    gameState = {
        assetPrices: defaultAssetPrices,
        priceHistory: defaultPriceHistory,
        cpi: defaultCpi,
        cpiHistory: defaultCpiHistory,
        lastCashInjection: 0,
        totalCashInjected: 0
    };

    // Initialize player state
    playerState = {
        cash: 10000,
        portfolio: {},
        tradeHistory: [],
        portfolioValueHistory: [10000]
    };

    // Update UI
    updateUI();

    console.log('Game state initialized:', gameState);
    console.log('Player state initialized:', playerState);
}

// Advance to next round
async function nextRound() {
    try {
        console.log('Starting nextRound function in class game');

        // Try to get the TA's game state for the current round to get the official asset prices
        let taGameState = null;
        if (classGameSession && classGameSession.id && classGameSession.currentRound > 0) {
            try {
                const taGameStateResult = await firebase.firestore()
                    .collection('game_states')
                    .where('gameId', '==', classGameSession.id)
                    .where('roundNumber', '==', classGameSession.currentRound)
                    .where('studentId', '==', 'TA_DEFAULT')
                    .limit(1)
                    .get();

                if (!taGameStateResult.empty) {
                    console.log('Found TA game state with official asset prices for current round');
                    taGameState = taGameStateResult.docs[0].data().gameState;
                }
            } catch (error) {
                console.error('Error fetching TA game state:', error);
            }
        }

        if (taGameState) {
            // Use TA's asset prices and other data
            console.log('Using TA asset prices and data');
            gameState.assetPrices = taGameState.assetPrices;
            gameState.priceHistory = taGameState.priceHistory;
            gameState.cpi = taGameState.cpi;
            gameState.cpiHistory = taGameState.cpiHistory;
        } else {
            // No TA game state found, generate prices locally
            console.log('No TA game state found, generating prices locally');

            // Store previous prices in price history
            for (const asset in gameState.assetPrices) {
                if (!Array.isArray(gameState.priceHistory[asset])) {
                    gameState.priceHistory[asset] = [];
                }
                gameState.priceHistory[asset].push(gameState.assetPrices[asset]);
            }

            // Generate new prices
            console.log('Generating new prices...');
            generateNewPrices();
            console.log('New prices generated:', gameState.assetPrices);

            // Update CPI
            console.log('Updating CPI...');
            updateCPI();
            console.log('New CPI:', gameState.cpi);
        }

        // Add cash injection if needed
        const cashInjection = calculateCashInjection();
        if (cashInjection > 0) {
            playerState.cash += cashInjection;
            gameState.lastCashInjection = cashInjection;
            gameState.totalCashInjected += cashInjection;

            // Show cash injection alert
            const cashInjectionAlert = document.getElementById('cash-injection-alert');
            const cashInjectionAmount = document.getElementById('cash-injection-amount');

            if (cashInjectionAlert && cashInjectionAmount) {
                cashInjectionAlert.style.display = 'block';
                cashInjectionAmount.textContent = cashInjection.toFixed(2);
            }

            console.log(`Cash injection: $${cashInjection}`);
        } else {
            gameState.lastCashInjection = 0;

            // Hide cash injection alert
            const cashInjectionAlert = document.getElementById('cash-injection-alert');
            if (cashInjectionAlert) {
                cashInjectionAlert.style.display = 'none';
            }
        }

        // Update portfolio value history
        const totalValue = calculateTotalValue();
        playerState.portfolioValueHistory.push(totalValue);

        // Update UI
        updateUI();

        console.log('Round advanced successfully');
    } catch (error) {
        console.error('Error in nextRound function:', error);
    }
}

// Generate new prices
function generateNewPrices() {
    // Define price change ranges for each asset
    const priceChangeRanges = {
        'S&P 500': [-0.05, 0.08],
        'Bonds': [-0.03, 0.04],
        'Real Estate': [-0.07, 0.09],
        'Gold': [-0.06, 0.07],
        'Commodities': [-0.08, 0.10],
        'Bitcoin': [-0.15, 0.20]
    };

    // Generate new prices for each asset
    for (const asset in gameState.assetPrices) {
        const currentPrice = gameState.assetPrices[asset];
        const [minChange, maxChange] = priceChangeRanges[asset] || [-0.05, 0.05];

        // Generate random percentage change
        const percentChange = minChange + Math.random() * (maxChange - minChange);

        // Calculate new price
        let newPrice = currentPrice * (1 + percentChange);

        // Ensure price doesn't go below minimum value
        const minPrice = asset === 'Bitcoin' ? 1000 : 10;
        newPrice = Math.max(newPrice, minPrice);

        // Update price
        gameState.assetPrices[asset] = newPrice;
    }
}

// Update CPI
function updateCPI() {
    // Store current CPI in history
    gameState.cpiHistory.push(gameState.cpi);

    // Generate random CPI change (between -1% and 3%)
    const cpiChange = -0.01 + Math.random() * 0.04;

    // Update CPI
    gameState.cpi = gameState.cpi * (1 + cpiChange);
}

// Calculate cash injection
function calculateCashInjection() {
    // Only inject cash in rounds >= 1
    if (classGameSession.currentRound < 1) {
        console.log('No cash injection for round 0');
        return 0;
    }

    // Base amount increases each round to simulate growing economy but needs to be random
    const baseAmount = 5000 + (classGameSession.currentRound * 500); // Starts at 5000, increases by 500 each round
    const variability = 1000; // Higher variability for more dynamic gameplay

    // Generate random cash injection with increasing trend
    const cashInjection = baseAmount + (Math.random() * 2 - 1) * variability;

    console.log(`Generated cash injection for round ${classGameSession.currentRound}: $${cashInjection.toFixed(2)}`);

    return Math.max(0, cashInjection); // Ensure it's not negative
}

// Update available cash display
function updateAvailableCash() {
    const availableCashDisplay = document.getElementById('available-cash-display');
    if (availableCashDisplay) {
        availableCashDisplay.textContent = playerState.cash.toFixed(2);
    }
}

// Quick buy selected asset - completely rewritten for simplicity
async function quickBuySelectedAsset() {
    try {
        // Get selected asset
        const assetSelect = document.getElementById('asset-select');
        if (!assetSelect || !assetSelect.value) {
            showTradeNotification('Please select an asset first', 'warning');
            return false;
        }
        const selectedAsset = assetSelect.value;

        // Get the amount to spend from the buy amount input
        const buyAmountInput = document.getElementById('buy-amount');
        if (!buyAmountInput) {
            showTradeNotification('Buy amount input not found', 'danger');
            return false;
        }

        // Get the amount to spend
        const amountToSpend = parseFloat(buyAmountInput.value) || 0;
        if (amountToSpend <= 0) {
            showTradeNotification('Please enter an amount to spend', 'warning');
            return false;
        }

        // Check if we have enough cash
        if (playerState.cash <= 0) {
            showTradeNotification('You have no cash available to buy assets', 'warning');
            return false;
        }

        // Ensure amount doesn't exceed available cash
        const validAmount = Math.min(amountToSpend, playerState.cash);
        if (validAmount <= 0) {
            showTradeNotification('Not enough cash available', 'warning');
            return false;
        }

        // Get asset price
        const price = gameState.assetPrices[selectedAsset];
        if (!price || price <= 0) {
            showTradeNotification('Asset price not available', 'danger');
            return false;
        }

        // Calculate quantity
        const quantity = validAmount / price;
        if (quantity <= 0) {
            showTradeNotification('Cannot buy less than 0.01 units of the asset', 'warning');
            return false;
        }

        // Store original cash for verification
        const originalCash = playerState.cash;

        // Update player state
        playerState.cash = originalCash - validAmount;
        playerState.portfolio[selectedAsset] = (playerState.portfolio[selectedAsset] || 0) + quantity;

        // Add to trade history
        playerState.tradeHistory.push({
            asset: selectedAsset,
            action: 'buy',
            quantity: quantity,
            price: price,
            totalCost: validAmount,
            timestamp: new Date().toISOString()
        });

        // Clear the buy amount input
        buyAmountInput.value = '';

        // Update UI
        updateUI();

        // Show success message
        showTradeNotification(
            `Bought ${quantity.toFixed(6)} ${selectedAsset} for $${validAmount.toFixed(2)}`,
            'success'
        );

        return true;
    } catch (error) {
        console.error('Error in quickBuySelectedAsset:', error);
        showTradeNotification('Error executing trade. Please try again.', 'danger');
        return false;
    }
}

// Clean up listeners when leaving the page
window.addEventListener('beforeunload', function() {
    if (classGameUnsubscribe) {
        classGameUnsubscribe();
    }

    if (leaderboardUnsubscribe) {
        leaderboardUnsubscribe();
    }
});
