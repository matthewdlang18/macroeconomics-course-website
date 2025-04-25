// Supabase configuration for Investment Odyssey
// Using the same configuration as windsurf-project

// Replace with your actual Supabase URL and anon key
const SUPABASE_URL = 'https://bvvkevmqnnlecghyraao.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2dmtldm1xbm5sZWNnaHlyYWFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MDAzNDEsImV4cCI6MjA2MDQ3NjM0MX0.UY_H91jIbbZWq6A-l7XbdyF6s3rSoBVcJfawhZ2CyVg';

// Log initialization
console.log('Investment Odyssey supabase.js: Initializing with URL:', SUPABASE_URL);

// Make these available as window variables
window.supabaseUrl = SUPABASE_URL;
window.supabaseKey = SUPABASE_ANON_KEY;

// Initialize Supabase client
let supabase;

// Check if supabase is already available
if (window.supabase && typeof window.supabase.createClient === 'function') {
    console.log('Investment Odyssey supabase.js: Supabase library found, creating client');
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Make supabase client available globally
    window.supabase = supabase;
    console.log('Investment Odyssey supabase.js: Supabase client initialized');
} else {
    console.error('Investment Odyssey supabase.js: Supabase library not found');

    // Load Supabase library dynamically
    console.log('Investment Odyssey supabase.js: Attempting to load Supabase library dynamically');
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
    script.onload = function() {
        console.log('Investment Odyssey supabase.js: Supabase library loaded dynamically');
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.supabase = supabase;
        console.log('Investment Odyssey supabase.js: Supabase client initialized after dynamic load');
    };
    script.onerror = function() {
        console.error('Investment Odyssey supabase.js: Failed to load Supabase library dynamically');
    };
    document.head.appendChild(script);
}

// Helper: Fetch user profile by name and passcode
async function fetchProfile(name, passcode) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('name', name)
    .eq('passcode', passcode)
    .maybeSingle();
  return { data, error };
}

// Helper: Fetch all sections with TA name joined from profiles
async function fetchSections() {
  const { data, error } = await supabase
    .from('sections')
    .select('*, profiles:ta_id(name)');
  return { data, error };
}

// Helper: Fetch all sections for a TA by custom_id
async function fetchTASections(taCustomId) {
  const { data, error } = await supabase
    .from('sections')
    .select('*')
    .eq('ta_id', taCustomId);
  return { data, error };
}

// Helper: Fetch all students in a section
async function fetchStudentsBySection(sectionId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, custom_id')
    .eq('role', 'student')
    .eq('section_id', sectionId);
  return { data, error };
}

// Helper: Update user's section_id
async function updateUserSection(userId, sectionId) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ section_id: sectionId })
    .eq('id', userId)
    .select()
    .maybeSingle();
  return { data, error };
}

// Test Supabase connection
async function testSupabaseConnection() {
  console.log('Investment Odyssey supabase.js: Testing Supabase connection...');
  try {
    const { data, error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Investment Odyssey supabase.js: Connection test failed:', error);
      return { success: false, error };
    }

    console.log('Investment Odyssey supabase.js: Connection test successful, found', count, 'profiles');
    return { success: true, count };
  } catch (error) {
    console.error('Investment Odyssey supabase.js: Connection test exception:', error);
    return { success: false, error };
  }
}

// Make helper functions available globally
window.fetchProfile = fetchProfile;
window.fetchSections = fetchSections;
window.fetchTASections = fetchTASections;
window.fetchStudentsBySection = fetchStudentsBySection;
window.updateUserSection = updateUserSection;
window.testSupabaseConnection = testSupabaseConnection;

// Log initialization
console.log('Investment Odyssey supabase.js: Initialization complete');

// Test the connection when the page loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('Investment Odyssey supabase.js: DOM loaded, testing connection');
  testSupabaseConnection().then(result => {
    if (result.success) {
      console.log('Investment Odyssey supabase.js: Connection verified successfully');
    } else {
      console.error('Investment Odyssey supabase.js: Connection verification failed');
    }
  });
});
