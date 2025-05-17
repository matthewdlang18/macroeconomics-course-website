/**
 * Local Environment Configuration Override for Econ Words Game
 * 
 * This file provides a fallback when the main env.js file can't be loaded
 * or when Supabase authentication fails.
 */

// Function to initialize offline mode for Econ Words
function initializeEconWordsOfflineMode() {
    console.log('⚠️ Initializing Econ Words in OFFLINE MODE');
    
    // Create a mock Supabase client for offline use
    window.supabase = {
        // Flag to indicate this is a mock client
        isMockClient: true,
        
        // Provide a mock auth object that always returns guest mode
        auth: {
            getSession: async () => ({ data: null, error: { message: 'Offline mode active' } }),
            getUser: async () => ({ data: null, error: { message: 'Offline mode active' } }),
            onAuthStateChange: (callback) => ({ 
                data: { subscription: { unsubscribe: () => {} } } 
            })
        },
        
        // Provide a mock from method that always returns offline data
        from: (table) => {
            return {
                select: (...args) => {
                    return {
                        filter: () => ({
                            maybeSingle: async () => ({ data: null, error: { code: '403', message: 'Offline mode active' } })
                        }),
                        eq: () => ({
                            single: async () => ({ data: null, error: { message: 'Offline mode active' } })
                        }),
                        then: (resolve) => {
                            resolve({ data: null, error: { code: '403', message: 'Offline mode active' } });
                            return { catch: () => {} };
                        }
                    };
                },
                insert: async () => ({ data: null, error: { code: '403', message: 'Offline mode active' } }),
                update: async () => ({ data: null, error: { code: '403', message: 'Offline mode active' } })
            };
        }
    };
    
    // Set local storage flag to indicate we're in offline mode
    localStorage.setItem('econ_words_offline_mode', 'true');
    
    // Show a notification to the user
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
        notificationContainer.innerHTML = '⚠️ Game running in offline mode. Your progress will be saved locally.';
        
        document.body.appendChild(notificationContainer);
        
        // Remove after 8 seconds
        setTimeout(() => {
            if (notificationContainer.parentNode) {
                notificationContainer.parentNode.removeChild(notificationContainer);
            }
        }, 8000);
    }, 1000);
    
    return true;
}

// Check if main env.js and Supabase are properly loaded
document.addEventListener('DOMContentLoaded', function() {
    // Give a short delay to allow the main env.js to load if it exists
    setTimeout(() => {
        // Check if Supabase is properly initialized
        const isSupabaseAvailable = typeof window.supabase !== 'undefined' && 
                                   typeof window.supabase.from === 'function' && 
                                   !window.supabase.isMockClient;
        
        // If not available, initialize offline mode
        if (!isSupabaseAvailable) {
            initializeEconWordsOfflineMode();
        } else {
            console.log('✓ Supabase client detected, proceeding with online mode');
            
            // Test the connection
            window.supabase.auth.getSession().then(({ data, error }) => {
                if (error || !data || !data.session) {
                    console.warn('⚠️ Supabase session unavailable, switching to offline mode');
                    initializeEconWordsOfflineMode();
                }
            }).catch(err => {
                console.error('⚠️ Error checking Supabase session:', err);
                initializeEconWordsOfflineMode();
            });
        }
    }, 500);
});

// Try to initialize immediately as well in case the script loads after DOMContentLoaded
try {
    // Check if Supabase is properly initialized
    const isSupabaseAvailable = typeof window.supabase !== 'undefined' && 
                               typeof window.supabase.from === 'function' && 
                               !window.supabase.isMockClient;
    
    // Also check if env.js is missing or if we're using a placeholder configuration
    const isEnvConfigValid = typeof window.SUPABASE_CONFIG !== 'undefined' && 
                            !window.SUPABASE_CONFIG.fallbackMode &&
                            window.SUPABASE_CONFIG.url && 
                            window.SUPABASE_CONFIG.url.includes('.supabase.co') && 
                            window.SUPABASE_CONFIG.key.length > 20;
    
    // If configuration is invalid or Supabase is not available and the document is already loaded, initialize offline mode
    if ((!isSupabaseAvailable || !isEnvConfigValid) && document.readyState !== 'loading') {
        initializeEconWordsOfflineMode();
    }
} catch (error) {
    console.error('Error in early initialization check:', error);
    // If there's any error, activate offline mode as a precaution
    if (document.readyState !== 'loading') {
        initializeEconWordsOfflineMode();
    }
}
