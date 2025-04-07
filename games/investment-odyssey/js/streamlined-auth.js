// Streamlined Authentication for Investment Odyssey Game
// This file provides simplified authentication checks for game pages

// Check authentication and redirect if needed
function checkGameAuth() {
    // Check if user is logged in or in guest mode
    if (EconGames.Auth.isLoggedIn() || localStorage.getItem('guestMode') === 'true') {
        // User is authenticated, allow access
        return true;
    } else {
        // Not authenticated, redirect to games hub
        window.location.href = '../index.html';
        return false;
    }
}

// Check class game authentication and redirect if needed
function checkClassGameAuth() {
    // Check if user is logged in
    if (!EconGames.Auth.isLoggedIn()) {
        // Not logged in, redirect to games hub
        window.location.href = '../index.html';
        return false;
    }

    // Get user session
    const session = EconGames.Auth.getSession();

    // Check if user has joined a game session
    if (!session.gameSession) {
        // No session joined, redirect to games hub
        window.location.href = '../index-streamlined.html';
        return false;
    }

    // User is authenticated and in a game session, allow access
    return true;
}

// Update user info in game header
function updateGameHeader() {
    const userNameElement = document.getElementById('user-name');
    if (!userNameElement) return;

    if (EconGames.Auth.isLoggedIn()) {
        // User is logged in
        const session = EconGames.Auth.getSession();
        userNameElement.textContent = session.name || 'Player';
    } else if (localStorage.getItem('guestMode') === 'true') {
        // Guest mode
        const guestName = localStorage.getItem('guestName') || 'Guest';
        userNameElement.textContent = guestName;
    } else {
        // Default
        userNameElement.textContent = 'Player';
    }
}

// Handle game exit
function handleGameExit() {
    window.location.href = '../index.html';
}

// Initialize game authentication
document.addEventListener('DOMContentLoaded', function() {
    // Add event listener to exit button if it exists
    const exitBtn = document.querySelector('.exit-game-btn');
    if (exitBtn) {
        exitBtn.addEventListener('click', handleGameExit);
    }

    // Update header
    updateGameHeader();
});
