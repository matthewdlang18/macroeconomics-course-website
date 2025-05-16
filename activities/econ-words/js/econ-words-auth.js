/**
 * Econ Words Authentication Service
 * This file provides a unified authentication approach for the Econ Words game
 * =============================================================================
 * 
 * CUSTOM EVENTS
 * =============================================================================
 * The service dispatches the following custom events that components can listen for:
 * 
 * 1. 'econwords-auth-ready'
 *    Description: Fired when authentication state is established or changes
 *    Timing: Dispatched after:
 *      - Initial authentication check completes during init()
 *      - User signs in successfully via signIn()
 *      - User signs out via signOut()
 *      - Local session is established from localStorage
 *      - Guest mode is set up when no authentication exists
 *    Payload: 
 *    {
 *      detail: { 
 *        authenticated: boolean,  // Whether user is authenticated (true) or guest (false)
 *        user: {                  // User object (null if not authenticated)
 *          id: string,            // User ID (auth ID or generated guest ID)
 *          name: string,          // Display name (from metadata or default)
 *          isGuest: boolean,      // Whether this is a guest user
 *          sectionId?: string     // Optional section ID if available
 *        } | null
 *      }
 *    }
 *    Usage: Listen for this event to initialize UI components that depend on auth state
 * 
 * 2. 'econwords-signout-complete'
 *    Description: Fired specifically when the sign-out process completes
 *    Timing: Dispatched after:
 *      - User signs out via signOut()
 *      - All cleanup (localStorage, timeouts) is complete
 *    Payload:
 *    {
 *      detail: {
 *        success: boolean,        // Whether sign-out was successful
 *        error: string | null,    // Error message if sign-out failed
 *        previousUser: {          // User data before sign-out
 *          id: string,
 *          name: string,
 *          isGuest: boolean,
 *          sectionId?: string
 *        } | null
 *      }
 *    }
 *    Usage: Use this for cleanup operations or redirects after sign-out
 * 
 * 3. 'econwords-session-expired'
 *    Description: Fired when the user's session has expired
 *    Timing: Dispatched when:
 *      - Token refresh fails during init() or periodic checks
 *      - Session is found to be expired during validation
 *    Payload:
 *    {
 *      detail: {
 *        message: string          // User-friendly message about expiration
 *      }
 *    }
 *    Usage: Display notification to user that their session expired
 * 
 * LISTENING FOR EVENTS
 * =============================================================================
 * Example of listening for authentication state:
 * 
 * window.addEventListener('econwords-auth-ready', function(event) {
 *   const { authenticated, user } = event.detail;
 *   if (authenticated) {
 *     console.log(`User ${user.name} is logged in`);
 *     initializeUserDependentFeatures(user);
 *   } else {
 *     console.log('User is not authenticated or is a guest');
 *     showLoginPrompt();
 *   }
 * });
 * 
 * TOKEN EXPIRATION HANDLING
 * =============================================================================
 * - The service automatically checks for token expiration during initialization
 * - It attempts to refresh tokens that are expired or about to expire
 * - Session validity is checked periodically to prevent unexpected expirations
 * - If a token refresh fails, the user is notified and signed out gracefully
 */

// Create a global Auth service for Econ Words
const EconWordsAuth = {
    // Property to store token expiration check timeout
    _tokenCheckTimeout: null,
    
    // Initialize authentication
    init: async function() {
        console.log('Initializing Econ Words Auth Service...');
        
        // Check if Supabase is available
        if (typeof window.supabase === 'undefined') {
            console.error('Supabase client not available.');
            return this._setupGuestMode();
        }
        
        try {
            // Check if user is already authenticated with Supabase
            const { data, error } = await window.supabase.auth.getSession();
            
            if (error) {
                console.warn('Error checking Supabase session:', error);
                return this._setupGuestMode();
            }
            
            if (data && data.session) {
                // User is authenticated with Supabase
                console.log('User authenticated with Supabase:', data.session.user.id);
                
                // Check session expiration
                const isSessionValid = this._validateSessionExpiration(data.session);
                
                if (!isSessionValid) {
                    console.warn('Session is expired or will expire soon, attempting to refresh');
                    // Try to refresh the session
                    const refreshResult = await this._refreshSession();
                    
                    if (!refreshResult.success) {
                        console.error('Failed to refresh session:', refreshResult.error);
                        // Session refresh failed, notify user and set up guest mode
                        this._showSessionExpiredNotification();
                        return this._setupGuestMode();
                    }
                    
                    // Use the refreshed session data
                    data.session = refreshResult.session;
                    console.log('Session refreshed successfully');
                }
                
                // Store user info in localStorage for consistency
                localStorage.setItem('student_id', data.session.user.id);
                localStorage.setItem('student_name', data.session.user.user_metadata?.name || 'Player');
                localStorage.setItem('is_guest', 'false');
                
                // Store the session expiration time for future reference
                if (data.session.expires_at) {
                    localStorage.setItem('session_expires_at', data.session.expires_at.toString());
                } else if (data.session.expires_in) {
                    const expiresAt = Math.floor(Date.now() / 1000) + data.session.expires_in;
                    localStorage.setItem('session_expires_at', expiresAt.toString());
                }
                
                // Dispatch event for other components to know auth is ready
                window.dispatchEvent(new CustomEvent('econwords-auth-ready', { 
                    detail: { 
                        authenticated: true,
                        user: {
                            id: data.session.user.id,
                            name: data.session.user.user_metadata?.name || 'Player',
                            isGuest: false
                        }
                    } 
                }));
                
                // Set up periodic token check if session has an expiration
                this._setupTokenExpirationCheck();
                
                return true;
            } else {
                // No active session, check if we have a local session
                return this._setupLocalSession();
            }
        } catch (error) {
            console.error('Error initializing auth:', error);
            return this._setupGuestMode();
        }
    },
    
    // Set up a local session from localStorage
    _setupLocalSession: function() {
        const studentId = localStorage.getItem('student_id');
        const studentName = localStorage.getItem('student_name');
        
        if (studentId && studentName) {
            console.log('Using local session:', studentId, studentName);
            
            // Dispatch event for other components
            window.dispatchEvent(new CustomEvent('econwords-auth-ready', { 
                detail: { 
                    authenticated: true,
                    user: {
                        id: studentId,
                        name: studentName,
                        isGuest: localStorage.getItem('is_guest') === 'true'
                    }
                } 
            }));
            
            return true;
        } else {
            return this._setupGuestMode();
        }
    },
    
    // Set up guest mode when no authentication is available
    _setupGuestMode: function() {
        console.log('Setting up guest mode');
        
        // Generate a cryptographically secure random guest ID
        const guestId = 'guest-' + this._generateSecureId(16);
        
        // Store in localStorage
        localStorage.setItem('student_id', guestId);
        localStorage.setItem('student_name', 'Guest Player');
        localStorage.setItem('is_guest', 'true');
        
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('econwords-auth-ready', { 
            detail: { 
                authenticated: false,
                user: {
                    id: guestId,
                    name: 'Guest Player',
                    isGuest: true
                }
            } 
        }));
        
        return false;
    },
    
    // Get current authenticated user
    getCurrentUser: function() {
        const studentId = localStorage.getItem('student_id');
        const studentName = localStorage.getItem('student_name');
        const isGuest = localStorage.getItem('is_guest') === 'true';
        
        if (studentId) {
            return {
                id: studentId,
                name: studentName || 'Player',
                isGuest: isGuest,
                sectionId: localStorage.getItem('section_id')
            };
        }
        
        return null;
    },
    
    // Sign in with email and password
    signIn: async function(email, password) {
        if (typeof window.supabase === 'undefined') {
            console.error('Supabase client not available.');
            return { error: 'Supabase client not available' };
        }
        
        try {
            const { data, error } = await window.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) {
                console.error('Error signing in:', error);
                return { error: error.message };
            }
            
            if (data && data.user && data.user.id) {
                console.log('User authenticated successfully:', data.user.id);
                localStorage.setItem('student_id', data.user.id);
                // Safely access user_metadata using optional chaining
                const userName = data.user.user_metadata?.name || email.split('@')[0];
                if (!data.user.user_metadata) {
                    console.warn('User metadata is missing, using email prefix for name');
                } else if (!data.user.user_metadata.name) {
                    console.warn('User name is missing in metadata, using email prefix instead');
                }
                localStorage.setItem('student_name', userName);
                localStorage.setItem('is_guest', 'false');
                
                // Dispatch event for other components
                window.dispatchEvent(new CustomEvent('econwords-auth-ready', { 
                    detail: { 
                        authenticated: true,
                        user: {
                            id: data.user.id,
                            name: userName,
                            isGuest: false
                        }
                    } 
                }));
                
                return { success: true, user: data.user };
            }
            
            console.warn('Unexpected response format from Supabase auth:', data);
            return { error: 'Invalid authentication response' };
        } catch (error) {
            console.error('Exception signing in:', error);
            return { error: error.message || 'An unexpected error occurred during sign in' };
        }
    },
    
    // Sign out the current user
    signOut: async function() {
        let signOutSuccess = true;
        let signOutError = null;
        
        // Get current user info before signing out (for the event)
        const previousUser = this.getCurrentUser();
        
        if (typeof window.supabase !== 'undefined') {
            try {
                const { error } = await window.supabase.auth.signOut();
                if (error) {
                    console.error('Error signing out:', error);
                    signOutSuccess = false;
                    signOutError = error.message || 'Error during sign out';
                }
            } catch (error) {
                console.error('Exception signing out:', error);
                signOutSuccess = false;
                signOutError = error.message || 'Exception during sign out';
            }
        }
        
        // Clear localStorage
        localStorage.removeItem('student_id');
        localStorage.removeItem('student_name');
        localStorage.removeItem('is_guest');
        localStorage.removeItem('section_id');
        localStorage.removeItem('session_expires_at');
        
        // Clear any token expiration check timeout
        if (this._tokenCheckTimeout) {
            clearTimeout(this._tokenCheckTimeout);
            this._tokenCheckTimeout = null;
        }
        
        // Dispatch general auth state change event
        window.dispatchEvent(new CustomEvent('econwords-auth-ready', { 
            detail: { 
                authenticated: false,
                user: null
            } 
        }));
        
        // Dispatch specific sign-out completion event
        window.dispatchEvent(new CustomEvent('econwords-signout-complete', {
            detail: {
                success: signOutSuccess,
                error: signOutError,
                previousUser: previousUser
            }
        }));
        
        // Return result as an object for more detailed status
        return {
            success: signOutSuccess,
            error: signOutError
        };
    },
    
    // Check if a user is logged in
    isLoggedIn: function() {
        return !!localStorage.getItem('student_id');
    },
    
    // Check if the current user is a guest
    isGuest: function() {
        return localStorage.getItem('is_guest') === 'true';
    },
    
    // Validate session expiration
    _validateSessionExpiration: function(session) {
        if (!session) return false;
        
        // Check if session has explicit expiration time
        if (session.expires_at) {
            const expiresAt = typeof session.expires_at === 'number' 
                ? session.expires_at 
                : parseInt(session.expires_at, 10);
                
            const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
            const timeToExpire = expiresAt - currentTime;
            
            console.log(`Session expires in ${timeToExpire} seconds`);
            
            // Consider session near expiration if less than 5 minutes remaining (300 seconds)
            return timeToExpire > 300;
        } 
        // Check if session has expires_in attribute
        else if (session.expires_in) {
            // expires_in is usually in seconds from current time
            return session.expires_in > 300; // More than 5 minutes
        }
        
        // If no expiration info available, assume valid but log a warning
        console.warn('Session has no expiration information, assuming valid');
        return true;
    },
    
    // Refresh the session token
    _refreshSession: async function() {
        try {
            console.log('Attempting to refresh auth session');
            
            // Try to refresh the session
            const { data, error } = await window.supabase.auth.refreshSession();
            
            if (error) {
                console.error('Error refreshing session:', error);
                return { 
                    success: false, 
                    error: error.message || 'Failed to refresh session' 
                };
            }
            
            if (data && data.session) {
                console.log('Session refresh successful');
                return { 
                    success: true, 
                    session: data.session 
                };
            }
            
            return { 
                success: false, 
                error: 'No session returned after refresh' 
            };
        } catch (error) {
            console.error('Exception refreshing session:', error);
            return { 
                success: false, 
                error: error.message || 'Exception during session refresh' 
            };
        }
    },
    
    // Show a notification that the session has expired
    _showSessionExpiredNotification: function() {
        console.log('Showing session expired notification');
        
        // Create and dispatch a custom event for session expiration
        window.dispatchEvent(new CustomEvent('econwords-session-expired', {
            detail: {
                message: 'Your session has expired. Please sign in again.'
            }
        }));
        
        // If the app has a UI notification system, use it
        if (typeof showNotification === 'function') {
            showNotification('Your session has expired. Please sign in again.', 'warning');
        } else {
            // Fallback to alert only if necessary and in a user-friendly context
            // Don't use alert in automatic refresh scenarios
            // alert('Your session has expired. Please sign in again.');
        }
    },
    
    // Set up periodic check for token expiration
    _setupTokenExpirationCheck: function() {
        const expiresAtStr = localStorage.getItem('session_expires_at');
        if (!expiresAtStr) return;
        
        const expiresAt = parseInt(expiresAtStr, 10);
        const currentTime = Math.floor(Date.now() / 1000);
        const timeToExpire = expiresAt - currentTime;
        
        if (timeToExpire <= 0) {
            // Already expired
            this._showSessionExpiredNotification();
            this.signOut();
            return;
        }
        
        // Set timeout for 5 minutes before expiration or half the remaining time,
        // whichever is less
        const checkTime = Math.min(timeToExpire - 300, Math.floor(timeToExpire / 2)) * 1000;
        
        if (checkTime > 0) {
            console.log(`Setting up token check in ${checkTime/1000} seconds`);
            
            // Clear any existing timeout
            if (this._tokenCheckTimeout) {
                clearTimeout(this._tokenCheckTimeout);
            }
            
            // Set new timeout
            this._tokenCheckTimeout = setTimeout(async () => {
                console.log('Performing scheduled token check');
                
                // Try to refresh the session
                const refreshResult = await this._refreshSession();
                
                if (!refreshResult.success) {
                    // Failed to refresh, show notification and sign out
                    this._showSessionExpiredNotification();
                    this.signOut();
                }
            }, checkTime);
        }
    },

    /**
     * Generates a cryptographically secure random ID using the Web Crypto API
     * This is more secure than Math.random() which is not cryptographically secure
     * and can lead to predictable IDs or collisions in high-volume applications
     * 
     * @param {number} length - The desired length of the random ID (default: 16)
     * @return {string} A secure random string using characters 0-9 and a-z
     */
    _generateSecureId: function(length = 16) {
        // Check if Web Crypto API is available
        if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
            console.warn('Web Crypto API not available, falling back to less secure method');
            return Math.random().toString(36).substring(2, 2 + length);
        }
        
        try {
            // Create a typed array to hold the random values
            const randomValues = new Uint8Array(length);
            
            // Fill the array with cryptographically secure random values
            crypto.getRandomValues(randomValues);
            
            // Convert to a string with letters and numbers
            return Array.from(randomValues)
                .map(val => (val % 36).toString(36)) // Convert to base 36 (0-9, a-z)
                .join('');
        } catch (error) {
            console.error('Error generating secure ID:', error);
            // Fallback to less secure method if crypto API fails
            return Math.random().toString(36).substring(2, 2 + length);
        }
    },
};

// Initialize auth service when the script loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the auth service
    EconWordsAuth.init();
    
    // Make it available globally
    window.EconWordsAuth = EconWordsAuth;
    
    // Also update window.Auth for backward compatibility
    window.Auth = {
        getCurrentUser: EconWordsAuth.getCurrentUser,
        isLoggedIn: EconWordsAuth.isLoggedIn
    };
    
    console.log('Econ Words Auth Service initialized');
});
