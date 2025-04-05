// TA Dashboard JavaScript for Investment Odyssey

// Variables
let currentSessionId = null;

// Initialize dashboard
function initializeDashboard() {
    // Set up event listeners
    setupEventListeners();

    // Load dashboard data
    loadDashboard();
}

// Set up event listeners
function setupEventListeners() {
    // Create class form
    const createClassForm = document.getElementById('create-class-form');
    if (createClassForm) {
        createClassForm.addEventListener('submit', handleCreateClass);
    }

    // Game controls
    document.getElementById('initialize-game').addEventListener('click', handleInitializeGame);
    document.getElementById('next-round').addEventListener('click', handleNextRound);
    document.getElementById('end-game').addEventListener('click', handleEndGame);
}

// Load dashboard data
async function loadDashboard() {
    try {
        // Load sessions
        await loadSessions();
    } catch (error) {
        console.error('Error loading dashboard:', error);
        alert('An error occurred while loading the dashboard. Please try again.');
    }
}

// Load sessions
async function loadSessions() {
    try {
        // Get active sessions for the Investment Odyssey game
        const result = await EconGames.DataService.getActiveSessions('investment-odyssey');

        if (result.success) {
            const sessions = result.data;
            const classesList = document.getElementById('classes-list');
            const noClassesMessage = document.getElementById('no-classes-message');

            if (sessions.length === 0) {
                // No sessions found
                if (noClassesMessage) {
                    noClassesMessage.style.display = 'block';
                }
                return;
            }

            // Hide no classes message
            if (noClassesMessage) {
                noClassesMessage.style.display = 'none';
            }

            // Clear existing list
            classesList.innerHTML = '';

            // Add sessions to list
            sessions.forEach(session => {
                const sessionItem = document.createElement('a');
                sessionItem.href = '#';
                sessionItem.className = 'list-group-item list-group-item-action';
                sessionItem.dataset.sessionId = session.id;

                sessionItem.innerHTML = `
                    <div class="d-flex w-100 justify-content-between">
                        <h5 class="mb-1">${session.name}</h5>
                        <small>Created: ${formatDate(session.createdAt?.toDate())}</small>
                    </div>
                    <p class="mb-1">Join Code: ${session.joinCode} | Click to manage this session</p>
                `;

                // Add click event
                sessionItem.addEventListener('click', () => selectSession(session.id));

                classesList.appendChild(sessionItem);
            });
        } else {
            console.error('Error loading sessions:', result.error);
        }
    } catch (error) {
        console.error('Error loading sessions:', error);
        throw error;
    }
}

// Select a session to manage
async function selectSession(sessionId) {
    try {
        currentSessionId = sessionId;

        // Get session details
        const sessionResult = await EconGames.InvestmentGame.getSession(sessionId);
        if (!sessionResult.success) {
            throw new Error(sessionResult.error);
        }

        const sessionData = sessionResult.data;

        // Update UI
        document.getElementById('current-class-number').textContent = sessionData.name;
        document.getElementById('current-class-description').textContent = `Join Code: ${sessionData.joinCode}`;
        document.getElementById('current-round').textContent = sessionData.roundNumber || 0;

        // Update total cash injected
        document.getElementById('total-cash-injected').textContent = (sessionData.totalCashInjected || 0).toFixed(2);

        // Update asset prices table
        if (sessionData.assetPrices) {
            updateAssetPricesTable(sessionData.assetPrices);
        }

        // Get participants count
        const participantsResult = await EconGames.InvestmentGame.getSessionParticipants(sessionId);
        if (participantsResult.success) {
            document.getElementById('students-count').textContent = participantsResult.data.length;
        }

        // Get leaderboard
        await updateLeaderboard();

        // Show class management section
        document.getElementById('class-management').style.display = 'block';
    } catch (error) {
        console.error('Error selecting session:', error);
        alert('An error occurred while loading session data. Please try again.');
    }
}

// Handle create class (now creates a session)
async function handleCreateClass(event) {
    event.preventDefault();

    const classNumberInput = document.getElementById('new-class-number');
    const descriptionInput = document.getElementById('class-description');

    const sessionName = classNumberInput.value.trim();

    if (!sessionName) {
        alert('Please enter a session name.');
        return;
    }

    try {
        // Create session
        const result = await EconGames.InvestmentGame.createSession(sessionName);

        if (result.success) {
            alert(`Session "${sessionName}" created successfully.`);

            // Clear form
            classNumberInput.value = '';
            descriptionInput.value = '';

            // Reload sessions
            await loadSessions();

            // Select the new session
            selectSession(result.data.id);
        } else {
            alert(`Error creating session: ${result.error}`);
        }
    } catch (error) {
        console.error('Error creating session:', error);
        alert('An error occurred while creating the session. Please try again.');
    }
}

// Handle initialize game
async function handleInitializeGame() {
    if (!currentSessionId) {
        alert('Please select a session first.');
        return;
    }

    if (!confirm(`Are you sure you want to initialize the game for this session? This will reset all participant portfolios.`)) {
        return;
    }

    try {
        // Get session data
        const sessionResult = await EconGames.InvestmentGame.getSession(currentSessionId);
        if (!sessionResult.success) {
            throw new Error(sessionResult.error);
        }

        // Reset session to round 0
        const sessionData = sessionResult.data;
        sessionData.roundNumber = 0;
        sessionData.assetPrices = EconGames.InvestmentGame.config.baseAssetPrices;
        sessionData.priceHistory = {};
        sessionData.totalCashInjected = 0;

        // Update session
        await EconGames.DataService.updateSession(currentSessionId, sessionData);

        alert(`Game initialized successfully.`);

        // Refresh session data
        await selectSession(currentSessionId);
    } catch (error) {
        console.error('Error initializing game:', error);
        alert('An error occurred while initializing the game. Please try again.');
    }
}

// Handle next round
async function handleNextRound() {
    if (!currentSessionId) {
        alert('Please select a session first.');
        return;
    }

    try {
        const result = await EconGames.InvestmentGame.advanceToNextRound(currentSessionId);

        if (result.success) {
            alert(`Advanced to round ${result.data.roundNumber} successfully.`);

            // Refresh session data
            await selectSession(currentSessionId);

            // Update leaderboard
            await EconGames.InvestmentGame.updateLeaderboard(currentSessionId);
        } else {
            alert(`Error advancing to next round: ${result.error}`);
        }
    } catch (error) {
        console.error('Error advancing to next round:', error);
        alert('An error occurred while advancing to the next round. Please try again.');
    }
}

// Handle end game
async function handleEndGame() {
    if (!currentSessionId) {
        alert('Please select a session first.');
        return;
    }

    if (!confirm(`Are you sure you want to end the game for this session?`)) {
        return;
    }

    try {
        // Update session to inactive
        await EconGames.DataService.updateSession(currentSessionId, {
            active: false,
            endedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Final leaderboard update
        await EconGames.InvestmentGame.updateLeaderboard(currentSessionId);

        alert(`Game ended successfully.`);

        // Reload sessions
        await loadSessions();
    } catch (error) {
        console.error('Error ending game:', error);
        alert('An error occurred while ending the game. Please try again.');
    }
}

// Update asset prices table
function updateAssetPricesTable(assetPrices) {
    const tableBody = document.getElementById('asset-prices-body');

    if (!tableBody || !assetPrices) {
        return;
    }

    // Clear existing rows
    tableBody.innerHTML = '';

    // Add rows for each asset
    for (const [asset, price] of Object.entries(assetPrices)) {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${asset}</td>
            <td>$${price.toFixed(2)}</td>
            <td>-</td>
        `;

        tableBody.appendChild(row);
    }
}

// Update leaderboard
async function updateLeaderboard() {
    if (!currentSessionId) {
        return;
    }

    try {
        const result = await EconGames.InvestmentGame.getLeaderboard(currentSessionId);

        if (result.success) {
            const leaderboard = result.data;
            const tableBody = document.getElementById('leaderboard-body');

            if (!tableBody) {
                return;
            }

            // Clear existing rows
            tableBody.innerHTML = '';

            // Add rows for each participant
            leaderboard.forEach((entry, index) => {
                const row = document.createElement('tr');

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
                    <td>${entry.name}</td>
                    <td>$${entry.totalValue.toFixed(2)}</td>
                `;

                tableBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error updating leaderboard:', error);
    }
}

// Helper function to format date
function formatDate(date) {
    if (!date) {
        return 'Unknown';
    }

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
