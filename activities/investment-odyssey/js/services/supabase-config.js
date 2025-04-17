/**
 * Supabase Configuration for Investment Odyssey
 *
 * This file initializes Supabase and exports the client.
 */

// Import the Supabase client
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.4/+esm';
import { supabaseUrl, supabaseKey } from './env.js';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Export the client
export default supabase;
