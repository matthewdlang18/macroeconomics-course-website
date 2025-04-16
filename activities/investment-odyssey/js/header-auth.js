// Header Authentication Script for Investment Odyssey
// This script handles displaying the user's name and sign-out functionality

document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const userInfoContainer = document.getElementById('user-info-container');
    const userNameDisplay = document.getElementById('user-name-display');
    const signOutBtn = document.getElementById('sign-out-btn');
    const signInLink = document.getElementById('sign-in-link');
    const guestLink = document.getElementById('guest-link');

    // Function to update the user display
    function updateUserDisplay() {
        // Check if user is logged in
        const studentName = localStorage.getItem('student_name');
        const studentId = localStorage.getItem('student_id');
        const isGuest = localStorage.getItem('is_guest');

        if (studentName && studentId) {
            // User is logged in
            userNameDisplay.textContent = studentName;
            userInfoContainer.classList.remove('d-none');

            // Hide sign-in and guest links
            if (signInLink) signInLink.classList.add('d-none');
            if (guestLink) guestLink.classList.add('d-none');
        } else if (isGuest === 'true') {
            // Guest user
            userNameDisplay.textContent = 'Guest';
            userInfoContainer.classList.remove('d-none');

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
            // Refresh the page to update the UI
            window.location.reload();
        });
    }

    // Initialize user display
    updateUserDisplay();
});
