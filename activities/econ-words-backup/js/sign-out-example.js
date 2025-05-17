/**
 * Example of using the updated sign-out functionality
 * This demonstrates both the Promise-based approach and event-based approach
 */

// Example 1: Using the promise-based approach
document.getElementById('sign-out-button').addEventListener('click', async function() {
    try {
        // Show loading indicator
        showLoadingIndicator();
        
        // Call the sign-out method and await its completion
        const result = await EconWordsAuth.signOut();
        
        if (result.success) {
            console.log('Sign out successful');
            // Redirect to login page or show sign-out success message
            window.location.href = 'login.html';
        } else {
            console.error('Sign out failed:', result.error);
            // Show error message to user
            showError('Failed to sign out: ' + result.error);
        }
    } catch (error) {
        console.error('Exception during sign out:', error);
        showError('An unexpected error occurred');
    } finally {
        // Hide loading indicator
        hideLoadingIndicator();
    }
});

// Example 2: Using the event-based approach
// Listen for sign-out completion events
window.addEventListener('econwords-signout-complete', function(event) {
    const { success, error, previousUser } = event.detail;
    
    if (success) {
        console.log('User signed out successfully', previousUser);
        // Update UI to reflect signed-out state
        updateUIForSignedOutState();
    } else {
        console.error('Sign out failed:', error);
        // Show error to user
        showErrorNotification(error || 'Failed to sign out');
    }
});

// Helper functions (would be implemented elsewhere)
function showLoadingIndicator() {
    // Implementation to show loading indicator
}

function hideLoadingIndicator() {
    // Implementation to hide loading indicator
}

function showError(message) {
    // Implementation to show error message
}

function updateUIForSignedOutState() {
    // Implementation to update UI
}

function showErrorNotification(message) {
    // Implementation to show error notification
}
