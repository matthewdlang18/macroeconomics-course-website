// Header Authentication Script for Investment Odyssey
// This script handles displaying the user's name and sign-out functionality

document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const userInfoContainer = document.getElementById('user-info-container');
    const userNameDisplay = document.getElementById('user-name-display');
    const signOutBtn = document.getElementById('sign-out-btn');
    const signInLink = document.getElementById('sign-in-link');
    const guestLink = document.getElementById('guest-link');

    // Check if Service is available (from firebase-auth-config.js)
    const serviceAvailable = typeof window.Service !== 'undefined';

    // Function to update the user display
    function updateUserDisplay() {
        // Check if user is logged in
        const studentName = localStorage.getItem('student_name');
        const studentId = localStorage.getItem('student_id');
        const isGuest = localStorage.getItem('is_guest');

        if (studentName && studentId) {
            // User is logged in
            if (userNameDisplay) {
                // Make the username a link to statistics page
                if (userNameDisplay.tagName.toLowerCase() === 'a') {
                    userNameDisplay.textContent = studentName;
                    userNameDisplay.href = 'statistics.html';
                } else {
                    // If it's not already a link, create one
                    const nameLink = document.createElement('a');
                    nameLink.href = 'statistics.html';
                    nameLink.className = 'user-name';
                    nameLink.id = 'user-name-display';
                    nameLink.textContent = studentName;

                    // Replace the span with the link
                    if (userNameDisplay.parentNode) {
                        userNameDisplay.parentNode.replaceChild(nameLink, userNameDisplay);
                        userNameDisplay = nameLink;
                    }
                }
            }

            if (userInfoContainer) userInfoContainer.classList.remove('d-none');

            // Hide sign-in and guest links
            if (signInLink) signInLink.classList.add('d-none');
            if (guestLink) guestLink.classList.add('d-none');
        } else if (isGuest === 'true') {
            // Guest user
            if (userNameDisplay) {
                if (userNameDisplay.tagName.toLowerCase() === 'a') {
                    userNameDisplay.textContent = 'Guest';
                    userNameDisplay.href = 'statistics.html';
                } else {
                    // If it's not already a link, create one
                    const nameLink = document.createElement('a');
                    nameLink.href = 'statistics.html';
                    nameLink.className = 'user-name';
                    nameLink.id = 'user-name-display';
                    nameLink.textContent = 'Guest';

                    // Replace the span with the link
                    if (userNameDisplay.parentNode) {
                        userNameDisplay.parentNode.replaceChild(nameLink, userNameDisplay);
                        userNameDisplay = nameLink;
                    }
                }
            }

            if (userInfoContainer) userInfoContainer.classList.remove('d-none');

            // Hide sign-in and guest links
            if (signInLink) signInLink.classList.add('d-none');
            if (guestLink) guestLink.classList.add('d-none');
        } else {
            // Not logged in
            if (userInfoContainer) userInfoContainer.classList.add('d-none');

            // Show sign-in and guest links
            if (signInLink) signInLink.classList.remove('d-none');
            if (guestLink) guestLink.classList.remove('d-none');
        }
    }

    // Handle sign out
    if (signOutBtn) {
        signOutBtn.addEventListener('click', function() {
            // Clear user data from localStorage
            localStorage.removeItem('student_name');
            localStorage.removeItem('student_id');
            localStorage.removeItem('section_id');
            localStorage.removeItem('section_name');
            localStorage.removeItem('is_guest');

            // Redirect to games page
            window.location.href = '../../games.html';
        });
    }

    // Handle guest access
    if (guestLink) {
        guestLink.addEventListener('click', function(e) {
            e.preventDefault();

            // Store guest status in localStorage
            localStorage.setItem('is_guest', 'true');

            // If we're on the game page, reload to update UI
            if (window.location.pathname.includes('index.html') ||
                window.location.pathname.includes('class-game.html') ||
                window.location.pathname.includes('leaderboard.html') ||
                window.location.pathname.includes('about.html')) {
                window.location.reload();
            } else {
                // Otherwise redirect to the game page
                window.location.href = 'index.html';
            }
        });
    }

    // Initialize user display
    updateUserDisplay();
});
