/**
 * Supabase Configuration for Investment Odyssey
 *
 * This file initializes Supabase and exports the client.
 *
 * In production, the values are injected by GitHub Actions from GitHub Secrets.
 * For local development, create an env.js file with your development credentials.
 */

// Import the Supabase client
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.4/+esm';

// Import environment variables
import { supabaseUrl, supabaseKey } from './env.js';

// These values will be used in local development from env.js
// In production, GitHub Actions will replace the placeholders directly in this file
// const supabaseUrl = '__SUPABASE_URL__';
// const supabaseKey = '__SUPABASE_KEY__';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Export the client
export default supabase;
