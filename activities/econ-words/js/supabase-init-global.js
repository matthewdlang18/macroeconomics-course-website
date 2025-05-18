// js/supabase-init-global.js
// Initializes the global Supabase client for all modules (shared and legacy)

(function() {
  // Wait for env.js to set supabaseUrl and supabaseKey
  function initSupabaseGlobal() {
    if (typeof supabase === 'undefined') {
      console.error('Supabase library not loaded');
      return;
    }
    const supabaseUrl = window.supabaseUrl;
    const supabaseKey = window.supabaseKey;
    if (supabaseUrl && supabaseKey) {
      const client = supabase.createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          storageKey: 'sb-bvvkevmqnnlecghyraao-auth-token'
        }
      });
      window.supabase = client;
      window.supabaseClient = client;
      console.log('Global Supabase client initialized for shared and legacy code');
    } else {
      console.error('Supabase URL or Key missing for global client initialization');
    }
  }

  // Utility: Sync session from window.Auth/Service to window.supabase
  async function syncSupabaseSessionFromAuth() {
    if (!window.supabase) return;
    // Try window.Auth first, then window.Service
    let tokens = null;
    if (window.Auth && typeof window.Auth.getSupabaseSessionTokens === 'function') {
      tokens = window.Auth.getSupabaseSessionTokens();
    } else if (window.Service && typeof window.Service.getSupabaseSessionTokens === 'function') {
      tokens = window.Service.getSupabaseSessionTokens();
    }
    if (tokens && tokens.access_token && tokens.refresh_token && window.supabase.auth && typeof window.supabase.auth.setSession === 'function') {
      try {
        await window.supabase.auth.setSession(tokens);
        console.log('[supabase-init-global] Synced Supabase session from Auth/Service tokens');
      } catch (e) {
        console.warn('[supabase-init-global] Failed to sync Supabase session from Auth/Service:', e);
      }
    } else {
      console.warn('[supabase-init-global] No Supabase tokens available to sync');
    }
  }
  window.syncSupabaseSessionFromAuth = syncSupabaseSessionFromAuth;

  if (window.supabaseUrl && window.supabaseKey) {
    initSupabaseGlobal();
  } else {
    // Wait for env.js to load
    document.addEventListener('DOMContentLoaded', initSupabaseGlobal);
  }
})();
