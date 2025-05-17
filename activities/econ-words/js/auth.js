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

      // No session found or error getting session - fall back to guest mode
      if (!data?.session || error) {
        if (error) {
          console.error('Error getting auth session:', error);
        } else {
          console.log('No active session found');
        }
        
        console.log('No authenticated session available - using guest mode');
        return this._setupGuestMode();
      } else if (data.session) {
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
        } else if (profileError && profileError.code !== 'PGRST116') {
          // PGRST116 means no rows returned - not an error for us
          console.warn('Error fetching user profile:', profileError);
          
          // Check if we should create a profile
          if (profileError.code !== '42501' && profileError.code !== '42P01') { // Not a permissions or table doesn't exist error
            console.log('Creating new user profile...');
            await this._createOrUpdateProfile(user.id, userName);
          }
        } else if (!profile) {
          // No profile found, create one
          console.log('No profile found, creating new user profile...');
          await this._createOrUpdateProfile(user.id, userName);
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

  // Create or update user profile
  _createOrUpdateProfile: async function(userId, fullName) {
    if (!window.supabaseClient) {
      console.error('Supabase client not available for profile creation');
      return { success: false, error: 'Client not available' };
    }
    
    try {
      const profile = {
        id: userId,
        full_name: fullName || 'User',
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabaseClient
        .from('profiles')
        .upsert(profile)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating/updating profile:', error);
        return { success: false, error: error.message };
      }
      
      console.log('Profile created/updated successfully:', data);
      return { success: true, profile: data };
    } catch (error) {
      console.error('Exception creating/updating profile:', error);
      return { success: false, error: error.message };
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

  // Sign in with email/password
  signInWithEmail: async function(email, password) {
    console.log('Attempting to sign in with email...');
    
    if (!window.supabaseClient) {
      console.error('Supabase client not available for sign-in');
      return { success: false, error: 'Client not available' };
    }
    
    try {
      // Check if the signInWithPassword method is available
      if (typeof supabaseClient.auth.signInWithPassword !== 'function') {
        console.error('signInWithPassword method not available - check Supabase client version');
        return { success: false, error: 'signInWithPassword method not available' };
      }
      
      // Sign in with email/password
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Error signing in with email:', error);
        return { success: false, error: error.message };
      }
      
      if (data?.user) {
        console.log('Signed in successfully with ID:', data.user.id);
        await this._setupAuthenticatedUser(data.user);
        return { success: true, user: data.user };
      } else {
        console.error('Sign-in did not return user data');
        return { success: false, error: 'No user data returned' };
      }
    } catch (error) {
      console.error('Sign-in error:', error);
      return { success: false, error: error.message };
    }
  },

  // Sign up with email/password
  signUp: async function(email, password, fullName = '') {
    console.log('Attempting to sign up with email...');
    
    if (!window.supabaseClient) {
      console.error('Supabase client not available for sign-up');
      return { success: false, error: 'Client not available' };
    }
    
    try {
      // Check if signUp method is available
      if (typeof supabaseClient.auth.signUp !== 'function') {
        console.error('signUp method not available - check Supabase client version');
        return { success: false, error: 'signUp method not available' };
      }
      
      // Sign up with email/password and metadata
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || email.split('@')[0]
          }
        }
      });
      
      if (error) {
        console.error('Error signing up:', error);
        return { success: false, error: error.message };
      }
      
      if (data?.user) {
        console.log('Signed up successfully with ID:', data.user.id);
        
        // If email confirmation is required, we might not have a session
        if (data.session) {
          await this._setupAuthenticatedUser(data.user);
          return { success: true, user: data.user, emailConfirmation: false };
        } else {
          // Email confirmation is required
          console.log('Email confirmation required before sign-in');
          return { 
            success: true, 
            user: data.user, 
            emailConfirmation: true,
            message: 'Please check your email to confirm your account' 
          };
        }
      } else {
        console.error('Sign-up did not return user data');
        return { success: false, error: 'No user data returned' };
      }
    } catch (error) {
      console.error('Sign-up error:', error);
      return { success: false, error: error.message };
    }
  },

  // Dispatch auth ready event to notify other components
  _dispatchAuthReadyEvent: function() {
    console.log('Dispatching auth ready event');
    
    const event = new CustomEvent('econWordsAuthReady', {
      detail: {
        isAuthenticated: this.isAuthenticated,
        isGuest: this.isGuest,
        user: this.isAuthenticated ? {
          id: this.currentUser.id,
          name: this.currentUser.name,
          email: this.currentUser.email,
          sectionId: this.currentUser.sectionId
        } : null
      }
    });
    
    document.dispatchEvent(event);
  },
  
  // Get current user info - safe to call from anywhere
  getCurrentUser: function() {
    if (!this.currentUser) {
      return null;
    }
    
    // Return a copy to prevent modification
    return {
      id: this.currentUser.id,
      name: this.currentUser.name,
      email: this.currentUser.email,
      isGuest: this.currentUser.isGuest,
      sectionId: this.currentUser.sectionId
    };
  }
};

// Export as global object
window.EconWordsAuth = EconWordsAuth;

// For testing in the console
console.log('Econ Words Auth module loaded. Use window.EconWordsAuth to access functions.');

// Initialize auth when document is ready if autoInit flag is set
document.addEventListener('DOMContentLoaded', function() {
  const autoInit = true; // Set to false to disable auto init
  if (autoInit) {
    console.log('Auto-initializing Econ Words Auth...');
    window.EconWordsAuth.init();
  }
});
