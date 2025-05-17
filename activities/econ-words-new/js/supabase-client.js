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
    // Create and return the client
    return supabase.createClient(supabaseUrl, supabaseKey);
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

console.log('Supabase client initialization ' + (isSupabaseConnected() ? 'successful' : 'failed'));
