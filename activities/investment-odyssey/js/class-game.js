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
            // Load game state for this round
            const gameStateResult = await Service.getGameState(classGameSession.id, currentStudentId);

            if (gameStateResult.success && gameStateResult.data) {
                // Set game state
                gameState = gameStateResult.data.gameState;
                playerState = gameStateResult.data.playerState;

                // Update UI
                updateUI();
            } else {
                // Initialize new game state
                initializeGame();

                // Save game state
                await saveGameStateToFirebase();
            }
        } else {
            // Game hasn't started yet, initialize new game
            initializeGame();
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
            // Load game state for this round
            const gameStateResult = await Service.getGameState(classGameSession.id, currentStudentId);

            if (gameStateResult.success && gameStateResult.data) {
                console.log('Found existing game state for this round');
                // Set game state
                gameState = gameStateResult.data.gameState;
                playerState = gameStateResult.data.playerState;
            } else {
                console.log('No existing game state found, advancing to next round');
                // Advance to next round
                nextRound();
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

        // Update price ticker
        updatePriceTicker();

        // If it's round 0, show a message that we're waiting for TA to start
        if (classGameSession.currentRound === 0) {
            // Show a notification that we're waiting for the TA to start the game
            const cashInjectionAlert = document.getElementById('cash-injection-alert');
            if (cashInjectionAlert) {
                cashInjectionAlert.className = 'alert alert-info py-1 px-2 mb-2';
                cashInjectionAlert.style.display = 'block';
                cashInjectionAlert.innerHTML = '<strong>Waiting for TA</strong> You can start trading now. The TA will advance to round 1 when ready.';
            }
        }
    }
}

// Update class leaderboard
function updateClassLeaderboard(participants) {
    // Sort participants by portfolio value
    participants.sort((a, b) => b.portfolioValue - a.portfolioValue);

    // Clear leaderboard
    classLeaderboardBody.innerHTML = '';

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

        // Calculate return percentage
        const returnPct = ((participant.portfolioValue - 10000) / 10000) * 100;
        const returnClass = returnPct >= 0 ? 'text-success' : 'text-danger';

        // Create the row HTML
        row.innerHTML = `
            ${rankCell}
            <td>${participant.studentName}${participant.studentId === currentStudentId ? ' <span class="badge badge-info">You</span>' : ''}</td>
            <td>${formatCurrency(participant.portfolioValue)}</td>
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

    // Quantity input change
    const quantityInput = document.getElementById('quantity-input');
    if (quantityInput) {
        quantityInput.addEventListener('input', updateTotalCost);
    }

    // Action select change
    const actionSelect = document.getElementById('action-select');
    if (actionSelect) {
        actionSelect.addEventListener('change', updateTotalCost);
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
        // Calculate total portfolio value
        const totalValue = calculateTotalValue();

        // Save game state
        await Service.saveGameState(
            classGameSession.id,
            currentStudentId,
            currentStudentName,
            gameState,
            playerState,
            totalValue
        );

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
        portfolioValue += quantity * price;
    }

    // Add cash
    return portfolioValue + playerState.cash;
}

// Format currency
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(value);
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
    const quantityInput = document.getElementById('quantity-input');
    const totalCostDisplay = document.getElementById('total-cost-display');

    if (!assetSelect || !actionSelect || !quantityInput || !totalCostDisplay) return;

    const selectedAsset = assetSelect.value;
    const action = actionSelect.value;
    const quantity = parseFloat(quantityInput.value) || 0;

    if (selectedAsset && gameState.assetPrices[selectedAsset]) {
        const price = gameState.assetPrices[selectedAsset];
        const totalCost = price * quantity;
        totalCostDisplay.textContent = totalCost.toFixed(2);
    } else {
        totalCostDisplay.textContent = '0.00';
    }
}

// Execute trade
async function executeTrade() {
    try {
        console.log('Executing trade...');
        const assetSelect = document.getElementById('asset-select');
        const actionSelect = document.getElementById('action-select');
        const quantityInput = document.getElementById('quantity-input');

        if (!assetSelect || !actionSelect || !quantityInput) {
            console.error('Missing form elements');
            return false;
        }

        const selectedAsset = assetSelect.value;
        const action = actionSelect.value;
        const quantity = parseFloat(quantityInput.value) || 0;

        console.log(`Trade details: Asset=${selectedAsset}, Action=${action}, Quantity=${quantity}`);
        console.log(`Current cash: ${playerState.cash}`);
        console.log(`Current portfolio:`, playerState.portfolio);

        if (!selectedAsset || quantity <= 0) {
            alert('Please select an asset and enter a valid quantity.');
            return false;
        }

        if (action === 'buy') {
            // Buy asset
            const price = gameState.assetPrices[selectedAsset];
            const totalCost = price * quantity;

            console.log(`Buy: Price=${price}, Total Cost=${totalCost}`);

            if (totalCost > playerState.cash) {
                alert('Not enough cash to complete this purchase.');
                return false;
            }

            // Update player state
            playerState.cash -= totalCost;
            playerState.portfolio[selectedAsset] = (playerState.portfolio[selectedAsset] || 0) + quantity;

            // Add to trade history
            playerState.tradeHistory.push({
                asset: selectedAsset,
                action: 'buy',
                quantity: quantity,
                price: price,
                totalCost: totalCost,
                timestamp: new Date().toISOString()
            });

            // Update UI
            updateUI();

            // Reset form
            quantityInput.value = '';
            updateTotalCost();

            console.log(`Bought ${quantity} ${selectedAsset} for $${totalCost.toFixed(2)}`);
            console.log(`Updated cash: ${playerState.cash}`);
            console.log(`Updated portfolio:`, playerState.portfolio);

            return true;
        } else if (action === 'sell') {
            // Sell asset
            const currentQuantity = playerState.portfolio[selectedAsset] || 0;

            console.log(`Sell: Current quantity of ${selectedAsset}: ${currentQuantity}`);

            if (quantity > currentQuantity) {
                alert(`You only have ${currentQuantity} ${selectedAsset} to sell.`);
                return false;
            }

            const price = gameState.assetPrices[selectedAsset];
            const totalValue = price * quantity;

            // Update player state
            playerState.cash += totalValue;
            playerState.portfolio[selectedAsset] -= quantity;

            // Remove asset from portfolio if quantity is 0
            if (playerState.portfolio[selectedAsset] === 0) {
                delete playerState.portfolio[selectedAsset];
            }

            // Add to trade history
            playerState.tradeHistory.push({
                asset: selectedAsset,
                action: 'sell',
                quantity: quantity,
                price: price,
                totalValue: totalValue,
                timestamp: new Date().toISOString()
            });

            // Update UI
            updateUI();

            // Reset form
            quantityInput.value = '';
            updateTotalCost();

            console.log(`Sold ${quantity} ${selectedAsset} for $${totalValue.toFixed(2)}`);
            console.log(`Updated cash: ${playerState.cash}`);
            console.log(`Updated portfolio:`, playerState.portfolio);

            return true;
        }
    } catch (error) {
        console.error('Error executing trade:', error);
        alert('An error occurred while executing the trade. Please try again.');
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
            alert('No assets available to buy.');
            return false;
        }

        // Calculate cash per asset
        const cashPerAsset = playerState.cash / assets.length;

        if (cashPerAsset <= 0) {
            alert('Not enough cash to distribute.');
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
            alert('No assets to sell.');
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
function initializeGame() {
    console.log('Initializing new game state for class game');

    // Initialize game state with starting values
    gameState = {
        assetPrices: {
            'S&P 500': 100,
            'Bonds': 100,
            'Real Estate': 5000,
            'Gold': 3000,
            'Commodities': 100,
            'Bitcoin': 50000
        },
        priceHistory: {
            'S&P 500': [100],
            'Bonds': [100],
            'Real Estate': [5000],
            'Gold': [3000],
            'Commodities': [100],
            'Bitcoin': [50000]
        },
        cpi: 100,
        cpiHistory: [100],
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

// Clean up listeners when leaving the page
window.addEventListener('beforeunload', function() {
    if (classGameUnsubscribe) {
        classGameUnsubscribe();
    }

    if (leaderboardUnsubscribe) {
        leaderboardUnsubscribe();
    }
});
