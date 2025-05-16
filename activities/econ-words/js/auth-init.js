/**
 * Authentication Initialization for Econ Words
 * This file ensures proper authentication setup before interacting with Supabase
 * Enhanced with offline fallback support
 */

// Constants
const AUTH_TIMEOUT_MS = 3000; // Authentication timeout in milliseconds

// Function to initialize authentication
function initializeAuthentication() {
    console.log('Initializing authentication for Econ Words...');
    
    // Check if we're already in offline mode
    if (localStorage.getItem('econ_words_offline_mode') === 'true') {
        console.log('⚠️ Running in offline mode, skipping standard authentication');
        triggerAuthReadyEvent({ offlineMode: true });
        return;
    }
    
    try {
        // Check if EconWordsAuth service is available
        if (typeof window.EconWordsAuth !== 'undefined') {
            console.log('EconWordsAuth service found');
            
            // Verify that init exists AND is actually a function
            if (window.EconWordsAuth.init && typeof window.EconWordsAuth.init === 'function') {
                try {
                    console.log('Initializing EconWordsAuth...');
                    
                    // Make sure the returned value is a Promise
                    const initResult = window.EconWordsAuth.init();
                    
                    if (initResult && typeof initResult.then === 'function') {
                        initResult.then(() => {
                            console.log('EconWordsAuth initialized successfully');
                            // Flag that auth is initialized
                            window.authInitialized = true;
                            
                            // Dispatch auth ready event
                            window.dispatchEvent(new CustomEvent('econwords-auth-ready', {
                                detail: {
                                    authenticated: true,
                                    service: 'EconWordsAuth'
                                }
                            }));
                        })
                        .catch(error => {
                            console.error('Error initializing EconWordsAuth:', error);
                            setupGuestMode();
                        });
                    } else {
                        console.warn('EconWordsAuth.init did not return a Promise, falling back to guest mode');
                        setupGuestMode();
                    }
                } catch (error) {
                    console.error('Exception while calling EconWordsAuth.init():', error);
                    setupGuestMode();
                }
            } else {
                console.warn('EconWordsAuth.init is not a function, assuming already initialized');
                window.authInitialized = true;
            }
        } else if (typeof window.Auth !== 'undefined') {
            // Fall back to old Auth service
            console.log('Using fallback Auth service...');
            if (typeof window.Auth.init === 'function') {
                window.Auth.init()
                    .then(() => {
                        console.log('Auth service initialized successfully');
                        window.authInitialized = true;
                    })
                    .catch(error => {
                        console.error('Error initializing Auth service:', error);
                        setupGuestMode();
                    });
            } else {
                console.log('Auth service does not have init function, assuming already initialized');
                window.authInitialized = true;
            }
        } else {
            console.warn('No authentication service found, setting up guest mode');
            setupGuestMode();
        }
    } catch (error) {
        console.error('Unexpected error during authentication initialization:', error);
        setupGuestMode();
    }
}

// Set up guest mode with localStorage
function setupGuestMode() {
    console.log('Setting up guest mode...');
    
    // Check if we already have a guest ID in localStorage
    let guestId = localStorage.getItem('student_id');
    let guestName = localStorage.getItem('student_name');
    
    if (!guestId) {
        // Generate a random guest ID
        guestId = 'guest_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('student_id', guestId);
    }
    
    if (!guestName) {
        guestName = 'Guest Player';
        localStorage.setItem('student_name', guestName);
    }
    
    // Set the guest flag
    localStorage.setItem('is_guest', 'true');
    
    // Use the helper function to trigger auth ready event
    triggerAuthReadyEvent({
        authenticated: false,
        offlineMode: localStorage.getItem('econ_words_offline_mode') === 'true',
        user: {
            id: guestId,
            name: guestName,
            isGuest: true
        }
    });
}

// Helper function to trigger auth ready event
function triggerAuthReadyEvent(details) {
    const eventDetails = {
        authenticated: details?.authenticated || false,
        user: details?.user || null,
        offlineMode: details?.offlineMode || false
    };
    
    // Flag that auth is initialized
    window.authInitialized = true;
    
    // Dispatch event for components waiting for authentication
    window.dispatchEvent(new CustomEvent('econwords-auth-ready', {
        detail: eventDetails
    }));
    
    console.log('Authentication ready event triggered:', eventDetails);
}

// Initialize authentication when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Start authentication initialization
    initializeAuthentication();
    
    // Ensure game initializes even if auth fails
    setTimeout(function() {
        if (!window.authInitialized) {
            console.warn(`Authentication did not complete in time (${AUTH_TIMEOUT_MS}ms), falling back to offline mode`);
            
            // Enable offline mode
            localStorage.setItem('econ_words_offline_mode', 'true');
            
            // Set up guest mode
            setupGuestMode();
            
            // Show notification to user
            setTimeout(() => {
                const notificationContainer = document.createElement('div');
                notificationContainer.style.position = 'fixed';
                notificationContainer.style.top = '10px';
                notificationContainer.style.left = '50%';
                notificationContainer.style.transform = 'translateX(-50%)';
                notificationContainer.style.backgroundColor = '#f9a825';
                notificationContainer.style.color = '#333';
                notificationContainer.style.padding = '10px 20px';
                notificationContainer.style.borderRadius = '4px';
                notificationContainer.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                notificationContainer.style.zIndex = '9999';
                notificationContainer.innerHTML = '⚠️ Authentication timed out. Running in offline mode.';
                
                document.body.appendChild(notificationContainer);
                
                // Remove after 6 seconds
                setTimeout(() => {
                    if (notificationContainer.parentNode) {
                        notificationContainer.parentNode.removeChild(notificationContainer);
                    }
                }, 6000);
            }, 500);
        }
    }, AUTH_TIMEOUT_MS); // Wait for authentication timeout before fallback
});
