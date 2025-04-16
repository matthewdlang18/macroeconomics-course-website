// Header Authentication Script for Investment Odyssey
// This script handles displaying the user's name and sign-out functionality

document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const userInfoContainer = document.getElementById('user-info-container');
    const userNameDisplay = document.getElementById('user-name-display');
    const signOutBtn = document.getElementById('sign-out-btn');

    // Function to update the user display
    function updateUserDisplay() {
        // Check if user is logged in
        const studentName = localStorage.getItem('student_name');
        const studentId = localStorage.getItem('student_id');

        if (studentName && studentId) {
            // User is logged in
            userNameDisplay.textContent = studentName;
            userInfoContainer.classList.remove('d-none');
        } else {
            // User is not logged in or is a guest
            userNameDisplay.textContent = 'Guest';
            // We'll still show the container, but with "Guest" displayed
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
            
            // Redirect to games page
            window.location.href = '../../games.html';
        });
    }

    // Initialize user display
    updateUserDisplay();
});
