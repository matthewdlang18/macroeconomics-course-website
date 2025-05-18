// js/supabase-init-global.js
// Initializes the global Supabase client for all modules

if (typeof window.supabase === 'undefined' && typeof supabase !== 'undefined') {
  // Use the UMD build from the CDN
  const supabaseUrl = window.supabaseUrl;
  const supabaseKey = window.supabaseKey;
  if (supabaseUrl && supabaseKey) {
    window.supabase = supabase.createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: 'sb-bvvkevmqnnlecghyraao-auth-token'
      }
    });
    console.log('Global Supabase client initialized for shared auth system');
  } else {
    console.error('Supabase URL or Key missing for global client initialization');
  }
}
