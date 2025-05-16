/**
 * Local Environment Configuration for Econ Words Game
 * 
 * This is a local fallback configuration for when the main env.js file isn't found
 * or isn't accessible.
 */

// Create a proxy handler to intercept calls to Supabase
window.SUPABASE_CONFIG = {
    url: 'https://placeholder.supabase.co',
    key: 'placeholder-key',
    isDevelopment: true,
    fallbackMode: true
};

// Log a warning that we're using the placeholder config
console.warn('Using local placeholder configuration for Econ Words game');

// Set offline mode flag
localStorage.setItem('econ_words_offline_mode', 'true');
