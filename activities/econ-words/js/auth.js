/**
 * Authentication module for Econ Words Game
 * This file handles user authentication and session management
 */

const EconWordsAuth = {
  // Current user information
  currentUser: null,
  isAuthenticated: false,
  isGuest: false,

  // Initialize authentication
  init: async function() {
    console.log('Initializing Econ Words Auth...');

    // Check if Supabase client is initialized
    if (!window.supabaseClient) {
      console.error('CRITICAL: Supabase client not available, setting up guest mode');
      // Try to diagnose why supabase client isn't available
      if (typeof supabase === 'undefined') {
        console.error('  - Supabase JS library not loaded');
      }
      if (!window.supabaseUrl) {
        console.error('  - supabaseUrl not defined in window object');
      }
      if (!window.supabaseKey) {
        console.error('  - supabaseKey not defined in window object');
      }
      return this._setupGuestMode();
    }

    try {
      console.log('Checking for existing auth session...');
      // Get the current session and set up auth state listener
      const { data, error } = await supabaseClient.auth.getSession();
      
      if (error) {
        console.error('Error getting auth session:', error);
        console.log('Auth session error details:', JSON.stringify(error));
      }

      // Set up auth change listener for future changes
      supabaseClient.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session ? 'session exists' : 'no session');
        
        if (event === 'SIGNED_IN' && session) {
          console.log('User signed in with ID:', session.user.id);
          this._setupAuthenticatedUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          this._setupGuestMode();
        } else if (event === 'TOKEN_REFRESHED' && session) {
          console.log('Auth token refreshed automatically');
          // Update user data without full reset
          this._updateUserData(session.user);
        } else if (event === 'USER_UPDATED' && session) {
          console.log('User data updated');
          this._updateUserData(session.user);
        }
      });

      if (error) {
        console.error('Error getting auth session:', error);
        // Try to refresh the session before giving up
        try {
          console.log('Attempting to refresh session after error...');
          const { data: refreshData, error: refreshError } = await supabaseClient.auth.refreshSession();
          if (!refreshError && refreshData.session) {
            console.log('Successfully refreshed expired session');
            await this._setupAuthenticatedUser(refreshData.session.user);
            return;
          } else if (refreshError) {
            console.error('Failed to refresh session:', refreshError);
          }
        } catch (refreshError) {
          console.error('Exception refreshing session:', refreshError);
        }
        return this._setupGuestMode();
      }

      if (data && data.session) {
        // User is authenticated
        const { user } = data.session;
        console.log('Found existing session for user:', user.id);
        
        // Check if token is close to expiry
        const expiresAt = new Date(data.session.expires_at * 1000);
        const now = new Date();
        const tenMinutes = 10 * 60 * 1000; // 10 minutes in milliseconds
        
        if (expiresAt.getTime() - now.getTime() < tenMinutes) {
          console.log('Session close to expiry, refreshing token during init...');
          try {
            const { data: refreshData, error: refreshError } = await supabaseClient.auth.refreshSession();
            if (!refreshError && refreshData.session) {
              console.log('Successfully refreshed token during init');
              await this._setupAuthenticatedUser(refreshData.session.user);
              return;
            } else {
              console.error('Error refreshing token during init:', refreshError);
            }
          } catch (refreshError) {
            console.error('Exception refreshing token during init:', refreshError);
          }
        }
        
        await this._setupAuthenticatedUser(user);
      } else {
        // No session found
        console.log('No active session found, using guest mode');
        this._setupGuestMode();
      }
    } catch (error) {
      console.error('Authentication initialization error:', error);
      this._setupGuestMode();
    }
    
    // Dispatch auth ready event
    this._dispatchAuthReadyEvent();
  },
  
  // Update user data without full reset (for token refresh)
  _updateUserData: function(user) {
    if (!user || !user.id) {
      console.warn('Invalid user object provided to _updateUserData');
      return;
    }
    
    // Only update if we already have user data and IDs match
    if (this.currentUser && this.currentUser.id === user.id) {
      console.log('Updating existing user data for:', user.id);
      // Update any user metadata if needed
      if (user.user_metadata) {
        this.currentUser.name = user.user_metadata.full_name || this.currentUser.name;
      }
      // Email shouldn't change but update it anyway
      this.currentUser.email = user.email || this.currentUser.email;
      
      console.log('User data updated');
      
      // No need to dispatch another auth event here as this is just refreshing data
    } else {
      console.log('User ID changed or no current user, doing full setup');
      this._setupAuthenticatedUser(user);
    }
  },

  // Set up authenticated user
  _setupAuthenticatedUser: async function(user) {
    if (!user || !user.id) {
      console.error('Invalid user object provided to _setupAuthenticatedUser');
      return this._setupGuestMode();
    }
    
    try {
      // Log authentication success
      console.log('Setting up authenticated user with ID:', user.id);
      
      // Get user profile from profiles table if available
      let userName = user.user_metadata?.full_name || user.email || 'User';
      let sectionId = null;

      try {
        // Try to get profile data
        const { data: profile, error: profileError } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!profileError && profile) {
          userName = profile.full_name || userName;
          sectionId = profile.section_id || null;
        }
      } catch (profileError) {
        console.warn('Error fetching user profile:', profileError);
      }

      // Set current user data
      this.currentUser = {
        id: user.id,
        name: userName,
        email: user.email,
        isGuest: false,
        sectionId: sectionId
      };
      
      this.isAuthenticated = true;
      this.isGuest = false;

      console.log('User authenticated successfully:', this.currentUser.name);
      
      // Store last successful auth time in localStorage
      localStorage.setItem('econWordsLastAuthTime', new Date().toISOString());
      
      // Dispatch auth state change event
      this._dispatchAuthReadyEvent();
      
      // Test database access to verify everything is working
      if (typeof window.testSupabaseDatabaseAccess === 'function') {
        window.testSupabaseDatabaseAccess().then(result => {
          if (!result.success) {
            console.warn('Database access test failed after authentication setup:', result.error);
          } else {
            console.log('Database access verified after authentication setup');
          }
        });
      }
    } catch (error) {
      console.error('Error setting up authenticated user:', error);
      this._setupGuestMode();
    }
  },

  // Set up guest mode
  _setupGuestMode: function() {
    // Generate UUID for guest - not using prefix to ensure UUID compatibility
    const guestId = this._generateUUID();
    
    this.currentUser = {
      id: guestId,
      name: 'Guest User',
      isGuest: true,
      sectionId: null
    };
    
    // Store guest ID in localStorage for persistence
    localStorage.setItem('econWordsGuestId', guestId);
    
    this.isAuthenticated = false;
    this.isGuest = true;

    console.log('Guest mode activated with ID:', guestId);
  },
  
  // Generate a valid UUID v4
  _generateUUID: function() {
    // Check if we already have a guest ID in localStorage
    const storedGuestId = localStorage.getItem('econWordsGuestId');
    if (storedGuestId) {
      return storedGuestId;
    }
    
    // Implementation of UUID v4
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  // Sign out the current user
  signOut: async function() {
    console.log('Signing out...');
    
    if (!window.supabaseClient) {
      console.warn('Supabase client not available for sign-out');
      this._setupGuestMode();
      this._dispatchAuthReadyEvent();
      return;
    }

    try {
      const { error } = await supabaseClient.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
      }
      
      // Reset to guest mode regardless of error
      this._setupGuestMode();
      this._dispatchAuthReadyEvent();
      
      console.log('Sign-out complete');
    } catch (error) {
      console.error('Sign-out error:', error);
      this._setupGuestMode();
      this._dispatchAuthReadyEvent();
    }
  },

  // Get the current authenticated user (or guest)
  getCurrentUser: function() {
    return this.currentUser;
  },

  // Check if the user is authenticated (not guest)
  isUserAuthenticated: function() {
    return this.isAuthenticated && !this.isGuest;
  },

  // Custom event for auth state changes
  _dispatchAuthReadyEvent: function() {
    if (typeof CustomEvent === 'function') {
      const authEvent = new CustomEvent('econwords-auth-ready', {
        detail: {
          authenticated: this.isAuthenticated,
          user: this.currentUser
        }
      });
      window.dispatchEvent(authEvent);
    }
  }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  EconWordsAuth.init();
});

// Export as global object
window.EconWordsAuth = EconWordsAuth;
