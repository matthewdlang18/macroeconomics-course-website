// TA Dashboard JavaScript
// This file provides functionality for the TA Dashboard

// Global variables
let currentSectionId = null;
let currentSessionId = null;

// Document ready
document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    await checkAuthentication();
    
    // Set up event listeners
    setupEventListeners();
});

// Check authentication
async function checkAuthentication() {
    const authCheck = document.getElementById('auth-check');
    const dashboardContent = document.getElementById('dashboard-content');
    
    try {
        // Check if user is logged in
        if (!EconGames.Auth.isLoggedIn()) {
            // Not logged in, show error and redirect
            authCheck.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle mr-2"></i> You must be logged in as a TA to access this page.
                        <div class="mt-3">
                            <a href="index.html" class="btn btn-primary">Go to Login Page</a>
                        </div>
                    </div>
                </div>
            `;
            return;
        }
        
        // Get user session
        const session = EconGames.Auth.getSession();
        
        // Check if user is a TA
        if (session.role !== 'ta') {
            // Not a TA, show error and redirect
            authCheck.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle mr-2"></i> Only TAs can access this page.
                        <div class="mt-3">
                            <a href="selection.html" class="btn btn-primary">Go to Game Selection</a>
                        </div>
                    </div>
                </div>
            `;
            return;
        }
        
        // Update TA name in header
        document.getElementById('ta-name').textContent = session.name;
        
        // Hide auth check and show dashboard content
        authCheck.style.display = 'none';
        dashboardContent.classList.remove('d-none');
        
        // Load sections
        await loadSections();
    } catch (error) {
        console.error('Error checking authentication:', error);
        
        // Show error
        authCheck.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle mr-2"></i> Error: ${error.message}
                    <div class="mt-3">
                        <a href="index.html" class="btn btn-primary">Go to Login Page</a>
                    </div>
                </div>
            </div>
        `;
    }
}

// Set up event listeners
function setupEventListeners() {
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', function() {
        EconGames.Auth.logout();
        window.location.href = 'index.html';
    });
    
    // Create session button
    document.getElementById('create-session-submit').addEventListener('click', handleCreateSession);
    
    // Initialize game button
    document.getElementById('initialize-game-btn').addEventListener('click', handleInitializeGame);
    
    // Next round button
    document.getElementById('next-round-btn').addEventListener('click', handleNextRound);
    
    // End game button
    document.getElementById('end-game-btn').addEventListener('click', handleEndGame);
    
    // Back to section button
    document.getElementById('back-to-section-btn').addEventListener('click', function() {
        showSectionDetails(currentSectionId);
    });
    
    // Copy join code button
    document.getElementById('copy-join-code').addEventListener('click', function() {
        const joinCode = document.getElementById('join-code').textContent;
        navigator.clipboard.writeText(joinCode).then(function() {
            alert('Join code copied to clipboard: ' + joinCode);
        });
    });
}

// Load sections
async function loadSections() {
    try {
        // Get TA sections
        const session = EconGames.Auth.getSession();
        const result = await EconGames.Game.getTASections(session.userId);
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        const sections = result.data;
        const sectionsList = document.getElementById('sections-list');
        const noSectionsMessage = document.getElementById('no-sections-message');
        
        // Clear existing sections
        sectionsList.innerHTML = '';
        
        if (sections.length === 0) {
            // No sections found
            noSectionsMessage.style.display = 'block';
            return;
        }
        
        // Hide no sections message
        noSectionsMessage.style.display = 'none';
        
        // Add sections to list
        sections.forEach(section => {
            const sectionCard = document.createElement('div');
            sectionCard.className = 'section-card card';
            sectionCard.dataset.sectionId = section.id;
            
            sectionCard.innerHTML = `
                <div class="card-header bg-info text-white">
                    ${section.day} ${section.time}
                </div>
                <div class="card-body">
                    <p><strong>Location:</strong> ${section.location}</p>
                    <button class="btn btn-primary btn-sm btn-block">Manage Section</button>
                </div>
            `;
            
            // Add click event
            sectionCard.querySelector('button').addEventListener('click', () => {
                showSectionDetails(section.id);
            });
            
            sectionsList.appendChild(sectionCard);
        });
    } catch (error) {
        console.error('Error loading sections:', error);
        
        const sectionsList = document.getElementById('sections-list');
        sectionsList.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle mr-2"></i> Error loading sections: ${error.message}
            </div>
        `;
    }
}

// Show section details
async function showSectionDetails(sectionId) {
    try {
        currentSectionId = sectionId;
        
        // Get section details
        const db = EconGames.Firebase.db;
        const sectionDoc = await db.collection('sections').doc(sectionId).get();
        
        if (!sectionDoc.exists) {
            throw new Error('Section not found');
        }
        
        const sectionData = sectionDoc.data();
        
        // Update UI
        document.getElementById('section-name').textContent = `${sectionData.day} ${sectionData.time}`;
        document.getElementById('section-day').textContent = sectionData.day;
        document.getElementById('section-time').textContent = sectionData.time;
        document.getElementById('section-location').textContent = sectionData.location;
        
        // Load sessions
        await loadSessions(sectionId);
        
        // Show section details
        document.getElementById('section-details').style.display = 'block';
        document.getElementById('session-management').style.display = 'none';
        document.getElementById('no-section-selected').style.display = 'none';
    } catch (error) {
        console.error('Error showing section details:', error);
        alert('Error showing section details: ' + error.message);
    }
}

// Load sessions
async function loadSessions(sectionId) {
    try {
        // Get section sessions
        const result = await EconGames.Game.getSectionSessions(sectionId);
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        const sessions = result.data;
        const sessionsList = document.getElementById('sessions-list');
        const noSessionsMessage = document.getElementById('no-sessions-message');
        
        // Clear existing sessions
        sessionsList.innerHTML = '';
        
        if (sessions.length === 0) {
            // No sessions found
            noSessionsMessage.style.display = 'block';
            return;
        }
        
        // Hide no sessions message
        noSessionsMessage.style.display = 'none';
        
        // Add sessions to list
        sessions.forEach(session => {
            const sessionItem = document.createElement('a');
            sessionItem.href = '#';
            sessionItem.className = 'list-group-item list-group-item-action session-item';
            sessionItem.dataset.sessionId = session.id;
            
            // Get game name
            let gameName = 'Unknown Game';
            if (session.gameId === 'investment-odyssey') {
                gameName = 'Investment Odyssey';
            }
            
            // Get round number
            const roundNumber = session.gameData?.roundNumber || 0;
            
            sessionItem.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <h5 class="mb-1">${session.name}</h5>
                    <small>${gameName}</small>
                </div>
                <p class="mb-1">Join Code: ${session.joinCode} | Round: ${roundNumber}</p>
                <small>Created: ${formatDate(session.createdAt?.toDate())}</small>
            `;
            
            // Add click event
            sessionItem.addEventListener('click', () => {
                showSessionManagement(session.id);
            });
            
            sessionsList.appendChild(sessionItem);
        });
    } catch (error) {
        console.error('Error loading sessions:', error);
        
        const sessionsList = document.getElementById('sessions-list');
        sessionsList.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle mr-2"></i> Error loading sessions: ${error.message}
            </div>
        `;
    }
}

// Show session management
async function showSessionManagement(sessionId) {
    try {
        currentSessionId = sessionId;
        
        // Get session details
        const result = await EconGames.Game.getGameSession(sessionId);
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        const sessionData = result.data;
        
        // Update UI
        document.getElementById('session-name').textContent = sessionData.name;
        document.getElementById('join-code').textContent = sessionData.joinCode;
        document.getElementById('current-round').textContent = sessionData.gameData?.roundNumber || 0;
        
        // Get participants count
        const participantsResult = await EconGames.Game.getSessionParticipants(sessionId);
        
        if (participantsResult.success) {
            document.getElementById('participants-count').textContent = participantsResult.data.length;
        }
        
        // Update leaderboard
        await updateLeaderboard();
        
        // Show session management
        document.getElementById('section-details').style.display = 'none';
        document.getElementById('session-management').style.display = 'block';
        document.getElementById('no-section-selected').style.display = 'none';
    } catch (error) {
        console.error('Error showing session management:', error);
        alert('Error showing session management: ' + error.message);
    }
}

// Handle create session
async function handleCreateSession() {
    try {
        // Get form values
        const gameId = document.getElementById('game-select').value;
        const sessionName = document.getElementById('session-name-input').value.trim();
        
        if (!sessionName) {
            document.getElementById('create-session-error').textContent = 'Please enter a session name.';
            document.getElementById('create-session-error').style.display = 'block';
            return;
        }
        
        // Create session
        const result = await EconGames.Game.createGameSession(gameId, currentSectionId, sessionName);
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        // Close modal
        $('#createSessionModal').modal('hide');
        
        // Clear form
        document.getElementById('session-name-input').value = '';
        document.getElementById('create-session-error').style.display = 'none';
        
        // Show success message
        alert(`Session "${sessionName}" created successfully. Join Code: ${result.data.joinCode}`);
        
        // Reload sessions
        await loadSessions(currentSectionId);
        
        // Show session management
        showSessionManagement(result.data.id);
    } catch (error) {
        console.error('Error creating session:', error);
        document.getElementById('create-session-error').textContent = 'Error creating session: ' + error.message;
        document.getElementById('create-session-error').style.display = 'block';
    }
}

// Handle initialize game
async function handleInitializeGame() {
    if (!currentSessionId) {
        alert('Please select a session first.');
        return;
    }
    
    if (!confirm('Are you sure you want to initialize the game? This will reset all participant portfolios.')) {
        return;
    }
    
    try {
        const result = await EconGames.Game.initializeGameSession(currentSessionId);
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        alert('Game initialized successfully.');
        
        // Refresh session management
        await showSessionManagement(currentSessionId);
    } catch (error) {
        console.error('Error initializing game:', error);
        alert('Error initializing game: ' + error.message);
    }
}

// Handle next round
async function handleNextRound() {
    if (!currentSessionId) {
        alert('Please select a session first.');
        return;
    }
    
    try {
        const result = await EconGames.Game.advanceGameSession(currentSessionId);
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        alert(`Advanced to round ${result.data.gameData.roundNumber} successfully.`);
        
        // Refresh session management
        await showSessionManagement(currentSessionId);
    } catch (error) {
        console.error('Error advancing to next round:', error);
        alert('Error advancing to next round: ' + error.message);
    }
}

// Handle end game
async function handleEndGame() {
    if (!currentSessionId) {
        alert('Please select a session first.');
        return;
    }
    
    if (!confirm('Are you sure you want to end the game? This will mark the session as inactive.')) {
        return;
    }
    
    try {
        const result = await EconGames.Game.endGameSession(currentSessionId);
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        alert('Game ended successfully.');
        
        // Go back to section details
        await showSectionDetails(currentSectionId);
    } catch (error) {
        console.error('Error ending game:', error);
        alert('Error ending game: ' + error.message);
    }
}

// Update leaderboard
async function updateLeaderboard() {
    if (!currentSessionId) {
        return;
    }
    
    try {
        const result = await EconGames.Game.getLeaderboard(currentSessionId);
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        const leaderboard = result.data;
        const tableBody = document.getElementById('leaderboard-table');
        
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
                <td>${entry.returnPercentage.toFixed(2)}%</td>
            `;
            
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error updating leaderboard:', error);
        
        const tableBody = document.getElementById('leaderboard-table');
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

// Format date
function formatDate(date) {
    if (!date) return 'Unknown';
    
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return date.toLocaleDateString(undefined, options);
}
