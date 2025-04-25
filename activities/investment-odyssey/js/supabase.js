// Supabase configuration for Investment Odyssey
// Using the same configuration as windsurf-project

// Replace with your actual Supabase URL and anon key
const SUPABASE_URL = 'https://bvvkevmqnnlecghyraao.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2dmtldm1xbm5sZWNnaHlyYWFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MDAzNDEsImV4cCI6MjA2MDQ3NjM0MX0.UY_H91jIbbZWq6A-l7XbdyF6s3rSoBVcJfawhZ2CyVg';

// Make these available as window variables
window.supabaseUrl = SUPABASE_URL;
window.supabaseKey = SUPABASE_ANON_KEY;

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Make supabase client available globally
window.supabase = supabase;

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

// Make helper functions available globally
window.fetchProfile = fetchProfile;
window.fetchSections = fetchSections;
window.fetchTASections = fetchTASections;
window.fetchStudentsBySection = fetchStudentsBySection;
window.updateUserSection = updateUserSection;

// Log initialization
console.log('Supabase initialized with URL:', SUPABASE_URL);
