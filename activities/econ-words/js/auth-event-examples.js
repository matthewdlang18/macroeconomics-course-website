/**
 * Event Listener Examples for EconWords Auth Service
 * 
 * This file demonstrates how to effectively listen for and handle the custom events
 * dispatched by the EconWords Auth Service.
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Setting up event listeners for auth events...');
    
    /**
     * Example 1: Listening for authentication state
     * This is the main event you'll want to listen for in most components
     */
    window.addEventListener('econwords-auth-ready', function(event) {
        const { authenticated, user } = event.detail;
        
        console.log('Auth state changed:', authenticated ? 'Authenticated' : 'Not authenticated');
        
        if (authenticated && !user.isGuest) {
            // User is fully authenticated (not a guest)
            console.log(`Welcome, ${user.name}! (ID: ${user.id})`);
            
            // Example: Update UI for authenticated user
            document.querySelectorAll('.auth-only').forEach(el => el.style.display = 'block');
            document.querySelectorAll('.guest-only').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.user-name').forEach(el => el.textContent = user.name);
            
            // Example: Load user-specific data
            loadUserGameHistory(user.id);
        } 
        else if (authenticated && user.isGuest) {
            // User is in guest mode
            console.log(`Welcome, Guest! (ID: ${user.id})`);
            
            // Example: Update UI for guest users
            document.querySelectorAll('.auth-only').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.guest-only').forEach(el => el.style.display = 'block');
            
            // Example: Show login prompt after a delay
            setTimeout(showLoginPrompt, 60000); // After 1 minute of play
        }
        else {
            // No authentication at all (null user)
            console.log('No user authenticated');
            
            // Example: Redirect to login page
            // window.location.href = 'login.html';
        }
    });
    
    /**
     * Example 2: Handling sign-out completion
     * Use this event for cleanup operations after sign-out
     */
    window.addEventListener('econwords-signout-complete', function(event) {
        const { success, error, previousUser } = event.detail;
        
        if (success) {
            console.log('Sign-out successful');
            
            if (previousUser && !previousUser.isGuest) {
                // Example: Show goodbye message
                showNotification(`Goodbye, ${previousUser.name}!`, 'info');
                
                // Example: Clear cached game data
                clearCachedGameData();
                
                // Example: Redirect to landing page
                // window.location.href = 'index.html';
            }
        } else {
            console.error('Sign-out failed:', error);
            
            // Example: Show error notification
            showNotification('Sign-out failed: ' + (error || 'Unknown error'), 'error');
        }
    });
    
    /**
     * Example 3: Handling session expiration
     * Use this to show user-friendly messages when sessions expire
     */
    window.addEventListener('econwords-session-expired', function(event) {
        const { message } = event.detail;
        
        console.log('Session expired:', message);
        
        // Example: Show a modal dialog
        showExpirationDialog(message);
        
        // Example: After user acknowledges, redirect to login page
        function showExpirationDialog(msg) {
            // Implementation would depend on your UI framework
            // Here's a simple example:
            const dialog = document.createElement('div');
            dialog.className = 'expiration-dialog';
            dialog.innerHTML = `
                <div class="dialog-content">
                    <h3>Session Expired</h3>
                    <p>${msg}</p>
                    <button id="login-btn">Log In Again</button>
                </div>
            `;
            
            document.body.appendChild(dialog);
            
            document.getElementById('login-btn').addEventListener('click', function() {
                window.location.href = 'login.html?expired=true';
            });
        }
    });
});

// Example helper functions (implementation would depend on your app)
function loadUserGameHistory(userId) {
    console.log('Loading game history for user:', userId);
    // Implementation code here
}

function showLoginPrompt() {
    console.log('Showing login prompt to guest user');
    // Implementation code here
}

function showNotification(message, type) {
    console.log(`Notification (${type}):`, message);
    // Implementation code here
}

function clearCachedGameData() {
    console.log('Clearing cached game data');
    // Implementation code here
}
