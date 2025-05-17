// js/supabase-init-global.js
// Initializes the global Supabase client for all modules

if (typeof window.supabase === 'undefined' && typeof supabase !== 'undefined') {
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
    window.supabaseClient = client; // Ensure legacy and shared code both work
    console.log('Global Supabase client initialized for shared auth system');
  } else {
    console.error('Supabase URL or Key missing for global client initialization');
  }
}
