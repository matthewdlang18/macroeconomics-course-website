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
        const db = firebase.firestore();
        const sessionsCollection = db.collection('sessions');

        const snapshot = await sessionsCollection
            .where('gameId', '==', 'investment-odyssey')
            .where('active', '==', true)
            .get();

        const sessions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

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
    } catch (error) {
        console.error('Error loading sessions:', error);
        throw error;
    }
}

// Select a session to manage
async function selectSession(sessionId) {
    try {
        currentSessionId = sessionId;

        // Get session details directly from Firestore
        const db = firebase.firestore();
        const sessionDoc = await db.collection('sessions').doc(sessionId).get();

        if (!sessionDoc.exists) {
            throw new Error('Session not found');
        }

        const sessionData = {
            id: sessionDoc.id,
            ...sessionDoc.data()
        };

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
        const participantsSnapshot = await db.collection('participants')
            .where('sessionId', '==', sessionId)
            .get();

        document.getElementById('students-count').textContent = participantsSnapshot.size;

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
        // Create session directly using Firestore
        const db = firebase.firestore();
        const sessionsCollection = db.collection('sessions');

        // Generate join code (6-digit number)
        const joinCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Get current user ID
        const userId = EconGames.SimpleAuth.getSession().userId;

        // Create session document
        const sessionRef = sessionsCollection.doc();
        const sessionData = {
            id: sessionRef.id,
            gameId: 'investment-odyssey',
            name: sessionName,
            joinCode: joinCode,
            createdBy: userId,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            active: true,
            participants: [],
            roundNumber: 0,
            assetPrices: {
                'S&P 500': 5000,
                'Bonds': 1000,
                'Real Estate': 2000,
                'Gold': 1800,
                'Commodities': 1000,
                'Bitcoin': 50000
            },
            priceHistory: {},
            totalCashInjected: 0
        };

        await sessionRef.set(sessionData);

        alert(`Session "${sessionName}" created successfully.`);

        // Clear form
        classNumberInput.value = '';
        descriptionInput.value = '';

        // Reload sessions
        await loadSessions();

        // Select the new session
        selectSession(sessionRef.id);
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
        const db = firebase.firestore();

        // Reset session to round 0
        await db.collection('sessions').doc(currentSessionId).update({
            roundNumber: 0,
            assetPrices: {
                'S&P 500': 5000,
                'Bonds': 1000,
                'Real Estate': 2000,
                'Gold': 1800,
                'Commodities': 1000,
                'Bitcoin': 50000
            },
            priceHistory: {},
            totalCashInjected: 0,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Reset all participants
        const participantsSnapshot = await db.collection('participants')
            .where('sessionId', '==', currentSessionId)
            .get();

        const batch = db.batch();

        participantsSnapshot.forEach(doc => {
            batch.update(doc.ref, {
                cash: 10000,
                portfolio: {},
                tradeHistory: [],
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });

        await batch.commit();

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
        const db = firebase.firestore();

        // Get current session data
        const sessionDoc = await db.collection('sessions').doc(currentSessionId).get();
        if (!sessionDoc.exists) {
            throw new Error('Session not found');
        }

        const sessionData = sessionDoc.data();
        const currentRound = sessionData.roundNumber || 0;
        const nextRound = currentRound + 1;

        // Check if we've reached the maximum number of rounds
        if (nextRound > 20) {
            alert('Game has reached the maximum number of rounds.');
            return;
        }

        // Generate new asset prices
        const previousPrices = sessionData.assetPrices || {
            'S&P 500': 5000,
            'Bonds': 1000,
            'Real Estate': 2000,
            'Gold': 1800,
            'Commodities': 1000,
            'Bitcoin': 50000
        };

        // Asset returns configuration
        const assetReturns = {
            'S&P 500': { mean: 0.1151, stdDev: 0.1949, min: -0.43, max: 0.50 },
            'Bonds': { mean: 0.0334, stdDev: 0.0301, min: 0.0003, max: 0.14 },
            'Real Estate': { mean: 0.0439, stdDev: 0.062, min: -0.12, max: 0.24 },
            'Gold': { mean: 0.0648, stdDev: 0.2076, min: -0.32, max: 1.25 },
            'Commodities': { mean: 0.0815, stdDev: 0.1522, min: -0.25, max: 2.00 },
            'Bitcoin': { mean: 0.50, stdDev: 1.00, min: -0.73, max: 4.50 }
        };

        // Generate new prices
        const newPrices = {};
        for (const [asset, price] of Object.entries(previousPrices)) {
            const returns = assetReturns[asset];

            if (!returns) {
                newPrices[asset] = price;
                continue;
            }

            // Generate random return using normal distribution
            let randomReturn;
            do {
                // Box-Muller transform for normal distribution
                const u1 = Math.random();
                const u2 = Math.random();
                const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

                // Apply mean and standard deviation
                randomReturn = returns.mean + returns.stdDev * z;

                // Ensure return is within bounds
            } while (randomReturn < returns.min || randomReturn > returns.max);

            // Apply return to price
            newPrices[asset] = price * (1 + randomReturn);
        }

        // Generate cash injection
        const baseAmount = 2500;
        const variability = 500;
        const cashInjection = baseAmount + (Math.random() * 2 - 1) * variability;

        // Update price history
        const priceHistory = sessionData.priceHistory || {};
        for (const [asset, price] of Object.entries(previousPrices)) {
            if (!priceHistory[asset]) {
                priceHistory[asset] = [];
            }
            priceHistory[asset].push(price);
        }

        // Update session data
        await db.collection('sessions').doc(currentSessionId).update({
            roundNumber: nextRound,
            assetPrices: newPrices,
            priceHistory: priceHistory,
            totalCashInjected: (sessionData.totalCashInjected || 0) + cashInjection,
            lastCashInjection: cashInjection,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Update all participants with cash injection
        const participantsSnapshot = await db.collection('participants')
            .where('sessionId', '==', currentSessionId)
            .get();

        const batch = db.batch();

        participantsSnapshot.forEach(doc => {
            const participant = doc.data();
            const newCash = (participant.cash || 0) + cashInjection;

            batch.update(doc.ref, {
                cash: newCash,
                cashInjectionHistory: firebase.firestore.FieldValue.arrayUnion(cashInjection),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });

        await batch.commit();

        alert(`Advanced to round ${nextRound} successfully.`);

        // Refresh session data
        await selectSession(currentSessionId);

        // Update leaderboard
        await updateLeaderboard();
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
        const db = firebase.firestore();

        // Update session to inactive
        await db.collection('sessions').doc(currentSessionId).update({
            active: false,
            endedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Final leaderboard update
        await updateLeaderboard();

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
        // Get participants directly from Firestore
        const db = firebase.firestore();
        const participantsSnapshot = await db.collection('participants')
            .where('sessionId', '==', currentSessionId)
            .get();

        // Get session data for asset prices
        const sessionDoc = await db.collection('sessions').doc(currentSessionId).get();
        if (!sessionDoc.exists) {
            throw new Error('Session not found');
        }

        const sessionData = sessionDoc.data();
        const assetPrices = sessionData.assetPrices || {};

        // Calculate leaderboard entries
        const leaderboard = [];

        participantsSnapshot.forEach(doc => {
            const participant = doc.data();

            // Calculate portfolio value
            let portfolioValue = 0;
            if (participant.portfolio) {
                for (const [asset, quantity] of Object.entries(participant.portfolio)) {
                    if (assetPrices[asset]) {
                        portfolioValue += assetPrices[asset] * quantity;
                    }
                }
            }

            // Calculate total value
            const totalValue = portfolioValue + (participant.cash || 0);

            // Add to leaderboard
            leaderboard.push({
                name: participant.name || 'Anonymous',
                totalValue: totalValue
            });
        });

        // Sort by total value (descending)
        leaderboard.sort((a, b) => b.totalValue - a.totalValue);

        // Update UI
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
