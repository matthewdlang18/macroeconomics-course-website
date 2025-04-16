// Header Authentication Script for Investment Odyssey
// This script handles displaying the user's name and sign-out functionality

document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const userInfoContainer = document.getElementById('user-info-container');
    const userNameDisplay = document.getElementById('user-name-display');
    const signOutBtn = document.getElementById('sign-out-btn');
    const signInLink = document.getElementById('sign-in-link');
    const guestLink = document.getElementById('guest-link');

    // Wait for Auth to be initialized
    const initHeaderAuth = () => {
        // Check if Auth is available (from auth.js)
        if (typeof window.Auth !== 'undefined') {
            console.log('Auth is available, using Auth system');
            updateUserDisplay();
            setupEventListeners();
        } else {
            console.log('Auth not available, using localStorage directly');
            // Fallback to direct localStorage access
            updateUserDisplayFallback();
            setupEventListenersFallback();
        }
    };

    // Function to update the user display using Auth
    function updateUserDisplay() {
        if (Auth.isLoggedIn()) {
            // User is logged in
            const user = Auth.getCurrentUser();
            if (userNameDisplay) {
                // Make the username a link to statistics page
                if (userNameDisplay.tagName.toLowerCase() === 'a') {
                    userNameDisplay.textContent = user.name;
                    userNameDisplay.href = 'statistics.html';
                } else {
                    // If it's not already a link, create one
                    const nameLink = document.createElement('a');
                    nameLink.href = 'statistics.html';
                    nameLink.className = 'user-name';
                    nameLink.id = 'user-name-display';
                    nameLink.textContent = user.name;

                    // Replace the span with the link
                    if (userNameDisplay.parentNode) {
                        userNameDisplay.parentNode.replaceChild(nameLink, userNameDisplay);
                        // Don't try to reassign userNameDisplay as it might be readonly
                        // userNameDisplay = nameLink;
                    }
                }
            }

            if (userInfoContainer) userInfoContainer.classList.remove('d-none');

            // Hide sign-in and guest links
            if (signInLink) signInLink.classList.add('d-none');
            if (guestLink) guestLink.classList.add('d-none');
        } else if (Auth.isGuest()) {
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
                        // Don't try to reassign userNameDisplay as it might be readonly
                        // userNameDisplay = nameLink;
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

    // Fallback function to update the user display using localStorage directly
    function updateUserDisplayFallback() {
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
                        // Don't try to reassign userNameDisplay as it might be readonly
                        // userNameDisplay = nameLink;
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
                        // Don't try to reassign userNameDisplay as it might be readonly
                        // userNameDisplay = nameLink;
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

    // Set up event listeners using Auth
    function setupEventListeners() {
        // Handle sign out
        if (signOutBtn) {
            signOutBtn.addEventListener('click', function() {
                // Log out using Auth
                Auth.logout();

                // Redirect to games page
                window.location.href = '../../games.html';
            });
        }

        // Handle guest access
        if (guestLink) {
            guestLink.addEventListener('click', function(e) {
                e.preventDefault();

                // Set guest mode using Auth
                Auth.setGuestMode();

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
    }

    // Fallback event listeners using localStorage directly
    function setupEventListenersFallback() {
        // Handle sign out
        if (signOutBtn) {
            signOutBtn.addEventListener('click', function() {
                // Clear user data from localStorage
                localStorage.removeItem('student_id');
                localStorage.removeItem('student_name');
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
    }

    // Check if Auth is already available
    if (typeof window.Auth !== 'undefined') {
        initHeaderAuth();
    } else {
        // Wait for Auth to be available
        const authCheckInterval = setInterval(() => {
            if (typeof window.Auth !== 'undefined') {
                clearInterval(authCheckInterval);
                initHeaderAuth();
            }
        }, 100);

        // Fallback after timeout
        setTimeout(() => {
            if (typeof window.Auth === 'undefined') {
                clearInterval(authCheckInterval);
                console.warn('Auth not available after timeout, using fallback');
                updateUserDisplayFallback();
                setupEventListenersFallback();
            }
        }, 2000);
    }
});
