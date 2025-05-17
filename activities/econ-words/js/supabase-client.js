/**
 * Supabase Client for Econ Words Game
 * This file initializes the Supabase client and provides connection utilities
 */

// Initialize Supabase client with environment variables
const initSupabaseClient = () => {
  // Check if supabase is available
  if (typeof supabase === 'undefined') {
    console.error('Supabase JS library not loaded');
    return null;
  }

  // Check if environment variables are available
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or key not available');
    return null;
  }

  try {
    // Create client with auto-refresh sessions and persisted auth
    const options = {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    };
    
    // Create and return the client with options
    return supabase.createClient(supabaseUrl, supabaseKey, options);
  } catch (error) {
    console.error('Error initializing Supabase client:', error);
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
    
    if (data && data.session) {
      console.log('User is authenticated:', data.session.user.id);
      return { 
        authenticated: true, 
        userId: data.session.user.id,
        email: data.session.user.email,
        expiresAt: new Date(data.session.expires_at * 1000).toISOString()
      };
    } else {
      console.log('User is not authenticated');
      return { authenticated: false, reason: 'No session' };
    }
  } catch (error) {
    console.error('Exception checking auth status:', error);
    return { authenticated: false, error: error.message };
  }
};

// Debug helper function to test database access
const testSupabaseDatabaseAccess = async () => {
  if (!supabaseClient) {
    console.error('Supabase client not initialized');
    return { success: false, error: 'Client not available' };
  }
  
  try {
    console.log('Testing access to econ_terms_leaderboard table...');
    const { data: leaderboardData, error: leaderboardError } = await supabaseClient
      .from('econ_terms_leaderboard')
      .select('*', { count: 'exact', head: true })
      .limit(0);
      
    if (leaderboardError) {
      console.error('Error accessing econ_terms_leaderboard table:', leaderboardError);
      return { success: false, error: leaderboardError };
    }
    
    console.log('Testing access to econ_terms_user_stats table...');
    const { data: statsData, error: statsError } = await supabaseClient
      .from('econ_terms_user_stats')
      .select('*', { count: 'exact', head: true })
      .limit(0);
      
    if (statsError) {
      console.error('Error accessing econ_terms_user_stats table:', statsError);
      return { success: false, error: statsError };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Exception testing database access:', error);
    return { success: false, error: error.message };
  }
};

// Additional debug helper to check for RLS policy issues
const testRLSPolicyAccess = async () => {
  if (!supabaseClient) {
    console.error('Supabase client not initialized');
    return { success: false, error: 'Client not available' };
  }
  
  try {
    console.log('Testing RLS policy with insert operation...');
    
    // Try a test insert with minimal data
    const testData = {
      user_id: 'test-user-' + Date.now(),
      user_name: 'Test User',
      score: 1,
      term: 'TEST',
      attempts: 1,
      won: true,
      time_taken: 1000
    };
    
    const { data, error } = await supabaseClient
      .from('econ_terms_leaderboard')
      .insert(testData)
      .select();
      
    if (error) {
      console.error('RLS policy test failed:', error);
      
      if (error.code === '42501' || error.message.includes('policy')) {
        return { 
          success: false, 
          error: error,
          isRLSError: true,
          message: 'Row-level security policy preventing insert. This is likely an authentication issue.'
        };
      }
      
      return { success: false, error: error };
    }
    
    console.log('RLS policy test succeeded:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Exception testing RLS policy access:', error);
    return { success: false, error: error.message };
  }
};

// Helper to attempt to fix auth issues
const attemptAuthRepair = async () => {
  if (!supabaseClient) {
    console.error('Supabase client not initialized');
    return { success: false, error: 'Client not available' };
  }
  
  try {
    console.log('Attempting to repair authentication...');
    
    // First check if we have a session
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session during repair attempt:', sessionError);
      return { success: false, error: sessionError };
    }
    
    if (!sessionData || !sessionData.session) {
      console.log('No session found during repair attempt');
      return { success: false, error: 'No session to repair' };
    }
    
    // Try to refresh the session
    console.log('Attempting to refresh existing session...');
    const { data: refreshData, error: refreshError } = await supabaseClient.auth.refreshSession();
    
    if (refreshError) {
      console.error('Error refreshing session during repair attempt:', refreshError);
      return { success: false, error: refreshError };
    }
    
    if (refreshData && refreshData.session) {
      console.log('Session successfully refreshed during repair');
      return { success: true };
    } else {
      console.warn('Session refresh did not return a new session');
      return { success: false, error: 'Refresh did not yield new session' };
    }
  } catch (error) {
    console.error('Exception during auth repair attempt:', error);
    return { success: false, error: error.message };
  }
};

// Export debug helpers
window.checkSupabaseAuthStatus = checkSupabaseAuthStatus;
window.testSupabaseDatabaseAccess = testSupabaseDatabaseAccess;

// Export additional debug helpers
window.testRLSPolicyAccess = testRLSPolicyAccess;
window.attemptAuthRepair = attemptAuthRepair;

console.log('Supabase client initialization ' + (isSupabaseConnected() ? 'successful' : 'failed'));
