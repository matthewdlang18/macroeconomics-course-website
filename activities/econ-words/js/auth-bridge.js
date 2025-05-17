/**
 * Auth Bridge - Connects the main site Auth system with EconWordsAuth
 * This script ensures that authentication state is synchronized between
 * the main site's Auth system and the Econ Words Auth system.
 */

(function() {
    // Wait for both Auth systems to be initialized
    document.addEventListener('DOMContentLoaded', function() {
        // Check if both Auth systems are available
        if (window.Auth && window.EconWordsAuth) {
            console.log('Auth Bridge: Both Auth systems detected, setting up bridge...');
            
            // Set up listener for main site Auth changes
            if (typeof window.Auth.onAuthStateChange === 'function') {
                window.Auth.onAuthStateChange(function(user) {
                    console.log('Auth Bridge: Main site auth state changed:', user ? 'User authenticated' : 'User signed out');
                    
                    if (user) {
                        // User is authenticated in main site Auth, update EconWordsAuth
                        if (typeof window.EconWordsAuth._setupAuthenticatedUser === 'function') {
                            console.log('Auth Bridge: Syncing authenticated user to EconWordsAuth:', user.name);
                            window.EconWordsAuth._setupAuthenticatedUser({
                                id: user.id,
                                email: user.email,
                                user_metadata: {
                                    name: user.name,
                                    section_id: user.sectionId
                                }
                            });
                        }
                    } else {
                        // User is signed out in main site Auth, update EconWordsAuth
                        if (typeof window.EconWordsAuth._setupGuestMode === 'function') {
                            console.log('Auth Bridge: Setting up guest mode in EconWordsAuth');
                            window.EconWordsAuth._setupGuestMode();
                        }
                    }
                });
            }
            
            // Initial sync if user is already authenticated in main site Auth
            if (typeof window.Auth.isLoggedIn === 'function' && window.Auth.isLoggedIn()) {
                const mainSiteUser = window.Auth.getCurrentUser();
                if (mainSiteUser && mainSiteUser.id) {
                    console.log('Auth Bridge: Initial sync - User already authenticated in main site Auth:', mainSiteUser.name);
                    
                    if (typeof window.EconWordsAuth._setupAuthenticatedUser === 'function') {
                        window.EconWordsAuth._setupAuthenticatedUser({
                            id: mainSiteUser.id,
                            email: mainSiteUser.email,
                            user_metadata: {
                                name: mainSiteUser.name,
                                section_id: mainSiteUser.sectionId
                            }
                        });
                    }
                }
            }
            
            console.log('Auth Bridge: Setup complete');
        } else {
            console.log('Auth Bridge: One or both Auth systems not detected, bridge not set up');
            if (!window.Auth) {
                console.log('Auth Bridge: Main site Auth system not detected');
            }
            if (!window.EconWordsAuth) {
                console.log('Auth Bridge: EconWordsAuth system not detected');
            }
        }
    });
})();
