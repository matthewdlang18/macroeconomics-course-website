/**
 * Logout functionality for Investment Odyssey
 * This script handles proper logout to prevent session conflicts
 */

// Function to clear all Investment Odyssey related data from localStorage
function clearInvestmentOdysseyData() {
    console.log('Clearing Investment Odyssey data from localStorage');
    
    // Get all keys in localStorage
    const keys = Object.keys(localStorage);
    
    // Filter keys related to Investment Odyssey
    const ioKeys = keys.filter(key => 
        key.startsWith('player_state_') || 
        key.startsWith('game_state_') || 
        key.startsWith('total_cash_injected_') ||
        key === 'student_id' ||
        key === 'student_name' ||
        key === 'section_id' ||
        key === 'section_name' ||
        key === 'section_data' ||
        key === 'investmentOdysseyAuth' ||
        key === 'investmentOdysseySectionData' ||
        key === 'temp_player_state' ||
        key === 'current_game_participant'
    );
    
    // Remove each key
    ioKeys.forEach(key => {
        console.log(`Removing localStorage key: ${key}`);
        localStorage.removeItem(key);
    });
    
    console.log(`Cleared ${ioKeys.length} Investment Odyssey related items from localStorage`);
}

// Function to handle logout
async function logoutUser() {
    try {
        console.log('Logging out user');
        
        // Clear localStorage first
        clearInvestmentOdysseyData();
        
        // If Supabase is available, sign out
        if (window.supabase) {
            console.log('Signing out from Supabase');
            await window.supabase.auth.signOut();
        }
        
        // Redirect to the login page
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error during logout:', error);
        alert('There was an error logging out. Please try again.');
    }
}

// Add event listeners to logout buttons when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const logoutButtons = document.querySelectorAll('.logout-button');
    
    logoutButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            logoutUser();
        });
    });
    
    console.log('Logout functionality initialized');
});
