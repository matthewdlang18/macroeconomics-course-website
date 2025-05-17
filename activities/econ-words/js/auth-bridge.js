/**
 * Auth Bridge - Connects the main site Auth system with EconWordsAuth
 * This script ensures that authentication state is synchronized between
 * the main site's Auth system and the Econ Words Auth system.
 */

(function() {
    // Function to sync auth state from main site to Econ Words
    function syncAuthState() {
        if (window.Auth && window.EconWordsAuth) {
            console.log('Auth Bridge: Syncing auth state from main site to Econ Words...');

            // Check if user is logged in through main site Auth
            if (typeof window.Auth.isLoggedIn === 'function' && window.Auth.isLoggedIn()) {
                const mainSiteUser = window.Auth.getCurrentUser();
                if (mainSiteUser && mainSiteUser.id) {
                    console.log('Auth Bridge: User authenticated in main site Auth:', mainSiteUser.name);

                    // Force update EconWordsAuth with main site user info
                    if (typeof window.EconWordsAuth._setupAuthenticatedUser === 'function') {
                        console.log('Auth Bridge: Syncing authenticated user to EconWordsAuth:', mainSiteUser.name);

                        // Create a user object that matches what EconWordsAuth expects
                        const userObj = {
                            id: mainSiteUser.id,
                            email: mainSiteUser.email || null,
                            user_metadata: {
                                full_name: mainSiteUser.name,
                                name: mainSiteUser.name
                            }
                        };

                        // Update EconWordsAuth with this user
                        window.EconWordsAuth._setupAuthenticatedUser(userObj);

                        // Also update localStorage for compatibility
                        localStorage.setItem('econWordsLastAuthTime', new Date().toISOString());

                        return true;
                    }
                }
            } else {
                console.log('Auth Bridge: No authenticated user in main site Auth');
            }
        }
        return false;
    }

    // Try to sync immediately if both Auth systems are already available
    if (window.Auth && window.EconWordsAuth) {
        console.log('Auth Bridge: Both Auth systems already available, syncing immediately...');
        syncAuthState();
    }

    // Set up a listener for when the DOM is fully loaded
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Auth Bridge: DOM loaded, checking Auth systems...');

        // Check if both Auth systems are available
        if (window.Auth && window.EconWordsAuth) {
            console.log('Auth Bridge: Both Auth systems detected on DOM load');
            syncAuthState();
        } else {
            console.log('Auth Bridge: One or both Auth systems not detected on DOM load');

            // Set up a polling mechanism to check for Auth systems
            let checkCount = 0;
            const maxChecks = 10;
            const checkInterval = setInterval(function() {
                checkCount++;
                console.log(`Auth Bridge: Checking for Auth systems (attempt ${checkCount}/${maxChecks})...`);

                if (window.Auth && window.EconWordsAuth) {
                    console.log('Auth Bridge: Both Auth systems now available');
                    clearInterval(checkInterval);
                    syncAuthState();
                } else if (checkCount >= maxChecks) {
                    console.log('Auth Bridge: Giving up after maximum check attempts');
                    clearInterval(checkInterval);

                    // Log which system is missing
                    if (!window.Auth) {
                        console.log('Auth Bridge: Main site Auth system not detected');
                    }
                    if (!window.EconWordsAuth) {
                        console.log('Auth Bridge: EconWordsAuth system not detected');
                    }
                }
            }, 500); // Check every 500ms
        }
    });

    // Also listen for the econwords-auth-ready event
    window.addEventListener('econwords-auth-ready', function(event) {
        console.log('Auth Bridge: Detected econwords-auth-ready event');

        // If EconWordsAuth is in guest mode but main site Auth is authenticated, sync again
        if (window.EconWordsAuth && window.EconWordsAuth.isGuest &&
            window.Auth && typeof window.Auth.isLoggedIn === 'function' && window.Auth.isLoggedIn()) {
            console.log('Auth Bridge: EconWordsAuth is in guest mode but main site Auth is authenticated, syncing...');
            syncAuthState();
        }
    });
})();
