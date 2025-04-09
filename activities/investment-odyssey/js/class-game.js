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
        if (classGameSession.currentRound > 0) {
            // Load game state for this round
            const gameStateResult = await Service.getGameState(classGameSession.id, currentStudentId);
            
            if (gameStateResult.success && gameStateResult.data) {
                // Set game state
                gameState = gameStateResult.data.gameState;
                playerState = gameStateResult.data.playerState;
            } else {
                // Advance to next round
                nextRound();
            }
            
            // Update UI
            updateUI();
            
            // Save game state
            await saveGameStateToFirebase();
        }
    } catch (error) {
        console.error('Error handling round change:', error);
    }
}

// Update game display based on current state
function updateGameDisplay() {
    if (classGameSession.currentRound === 0) {
        // Game hasn't started yet
        waitingScreen.classList.remove('d-none');
        gameContent.classList.add('d-none');
    } else if (classGameSession.currentRound > classGameSession.maxRounds) {
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
        // Game is in progress
        waitingScreen.classList.add('d-none');
        gameContent.classList.remove('d-none');
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
    // Asset select change
    document.getElementById('asset-select').addEventListener('change', updateTotalCost);
    
    // Quantity input change
    document.getElementById('quantity').addEventListener('input', updateTotalCost);
    
    // Buy button
    document.getElementById('buy-btn').addEventListener('click', async function() {
        await handleBuy();
        await saveGameStateToFirebase();
    });
    
    // Sell button
    document.getElementById('sell-btn').addEventListener('click', async function() {
        await handleSell();
        await saveGameStateToFirebase();
    });
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

// Clean up listeners when leaving the page
window.addEventListener('beforeunload', function() {
    if (classGameUnsubscribe) {
        classGameUnsubscribe();
    }
    
    if (leaderboardUnsubscribe) {
        leaderboardUnsubscribe();
    }
});
