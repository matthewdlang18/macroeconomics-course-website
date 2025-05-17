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
      console.error('Supabase client not available, setting up guest mode');
      return this._setupGuestMode();
    }

    try {
      // Get the current session
      const { data: { session }, error } = await supabaseClient.auth.getSession();

      if (error) {
        console.error('Error getting auth session:', error);
        return this._setupGuestMode();
      }

      if (session) {
        // User is authenticated
        const { user } = session;
        await this._setupAuthenticatedUser(user);
      } else {
        // No session found
        console.log('No active session found');
        this._setupGuestMode();
      }
    } catch (error) {
      console.error('Authentication initialization error:', error);
      this._setupGuestMode();
    }
    
    // Dispatch auth ready event
    this._dispatchAuthReadyEvent();
  },

  // Set up authenticated user
  _setupAuthenticatedUser: async function(user) {
    try {
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

      console.log('User authenticated:', this.currentUser.name);
    } catch (error) {
      console.error('Error setting up authenticated user:', error);
      this._setupGuestMode();
    }
  },

  // Set up guest mode
  _setupGuestMode: function() {
    // Generate unique ID for guest
    const guestId = 'guest_' + Math.random().toString(36).substring(2, 15);
    
    this.currentUser = {
      id: guestId,
      name: 'Guest User',
      isGuest: true,
      sectionId: null
    };
    
    this.isAuthenticated = false;
    this.isGuest = true;

    console.log('Guest mode activated with ID:', guestId);
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
