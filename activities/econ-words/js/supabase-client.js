/**
 * Supabase Client for Econ Words Game
 * This file initializes the Supabase client and provides connection utilities
 */

// Initialize Supabase client with environment variables
const initSupabaseClient = () => {
  // Check if supabase is available
  if (typeof supabase === 'undefined') {
    console.error('CRITICAL: Supabase JS library not loaded - Make sure the library is included before this script');
    return null;
  }

  // Check if environment variables are available
  if (!supabaseUrl || !supabaseKey) {
    console.error('CRITICAL: Supabase URL or key not available - Check that env.js is loaded before this script');
    console.log('supabaseUrl available:', !!supabaseUrl);
    console.log('supabaseKey available:', !!supabaseKey);
    return null;
  }

  try {
    console.log('Initializing Supabase client...');
    console.log('Using Supabase URL:', supabaseUrl);
    
    // Create client with auto-refresh sessions and persisted auth
    const options = {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        // Local storage persistence (default)
        storage: {
          getItem: (key) => {
            const item = localStorage.getItem(key);
            console.log(`Retrieving auth storage key: ${key}`);
            return item;
          },
          setItem: (key, value) => {
            console.log(`Setting auth storage key: ${key}`);
            localStorage.setItem(key, value);
          },
          removeItem: (key) => {
            console.log(`Removing auth storage key: ${key}`);
            localStorage.removeItem(key);
          }
        }
      },
      // Global error handling
      global: {
        headers: {
          'X-Client-Info': 'econ-words-app'
        }
      },
      // Debug mode in non-production
      debug: true
    };
    
    // Create and return the client with options
    const client = supabase.createClient(supabaseUrl, supabaseKey, options);
    console.log('Supabase client initialized successfully');
    
    // Extra debug check for proper client setup
    if (client && client.auth) {
      console.log('Supabase auth API available');
      
      // Check available auth methods - helpful for debugging
      const authMethods = {};
      ['signInWithPassword', 'signUp', 'signOut', 'getSession'].forEach(method => {
        authMethods[method] = typeof client.auth[method] === 'function';
      });
      console.log('Available auth methods:', authMethods);
      
      // Verify that signInWithPassword is available (required for our auth flow)
      if (!authMethods.signInWithPassword) {
        console.warn('signInWithPassword method not available - might be using an incompatible Supabase JS version');
      }
    } else {
      console.warn('Supabase auth API NOT properly initialized');
    }
    
    return client;
  } catch (error) {
    console.error('CRITICAL: Error initializing Supabase client:', error);
    return null;
  }
};

// Initialize the client when the script loads
const supabaseClient = initSupabaseClient();

// Utility function to check if the client is connected
const isSupabaseConnected = () => {
  return supabaseClient !== null;
};

// Export the client and utilities as global variables
window.supabaseClient = supabaseClient;
window.isSupabaseConnected = isSupabaseConnected;

// Debug helper function to check auth status
const checkSupabaseAuthStatus = async () => {
  if (!supabaseClient) {
    console.error('Supabase client not initialized');
    return { authenticated: false, error: 'Client not available' };
  }
  
  try {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) {
      console.error('Error checking auth status:', error);
      return { authenticated: false, error: error.message };
    }
    
    if (!data || !data.session) {
      return { authenticated: false, reason: 'No session found' };
    }
    
    return {
      authenticated: true,
      user: data.session.user,
      expiresAt: new Date(data.session.expires_at * 1000).toISOString()
    };
  } catch (error) {
    console.error('Exception checking auth status:', error);
    return { authenticated: false, error: error.message };
  }
};

// Test database access to verify RLS policies work
const testSupabaseDatabaseAccess = async () => {
  if (!supabaseClient) {
    return { success: false, error: 'Supabase client not available' };
  }
  
  try {
    // First check auth status
    const authStatus = await checkSupabaseAuthStatus();
    if (!authStatus.authenticated) {
      return { success: false, error: 'Not authenticated', authStatus };
    }
    
    // Test leaderboard table access
    const { data, error } = await supabaseClient
      .from('econ_terms_leaderboard')
      .select('*', { count: 'exact', head: true })
      .limit(1);
      
    if (error) {
      return {
        success: false,
        error: error.message,
        code: error.code,
        isRLSError: error.code === '42501' || error.message.includes('policy'),
        authStatus
      };
    }
    
    return { 
      success: true,
      authStatus,
      canAccessLeaderboard: true
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Export debug helpers as global functions
window.checkSupabaseAuthStatus = checkSupabaseAuthStatus;
window.testSupabaseDatabaseAccess = testSupabaseDatabaseAccess;

console.log(`Supabase client ${supabaseClient ? 'successfully' : 'FAILED to be'} initialized. Check console for details.`);
