/**
 * Supabase Client Initialization
 * This file initializes the Supabase client with the credentials from env.js
 */

// Initialize Supabase client
(function() {
    try {
        // Check if supabaseUrl and supabaseKey are defined
        if (typeof supabaseUrl === 'undefined' || typeof supabaseKey === 'undefined') {
            console.warn('Supabase credentials not found in env.js, using hardcoded values');
            window.supabaseUrl = 'https://clyyjcjwcbbmdlccmtaa.supabase.co';
            window.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNseXlqY2p3Y2JibWRsY2NtdGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NTk3NDQsImV4cCI6MjA2MDQzNTc0NH0.ADHB7McgJ29pMWmLgjMZYiU9Tnk2ZodKvf4PBndmxbQ';
        } else {
            window.supabaseUrl = supabaseUrl;
            window.supabaseKey = supabaseKey;
        }

        console.log('Initializing Supabase client with URL:', window.supabaseUrl);

        // Initialize Supabase client
        window.supabase = supabase.createClient(window.supabaseUrl, window.supabaseKey);
        console.log('Supabase client initialized successfully');
    } catch (error) {
        console.error('Error initializing Supabase client:', error);

        // Create a mock Supabase client for fallback
        window.supabase = {
            from: function(table) {
                return {
                    select: function() {
                        return {
                            eq: function() {
                                return {
                                    eq: function() {
                                        return {
                                            eq: function() {
                                                return { data: [], error: null };
                                            }
                                        };
                                    },
                                    single: function() {
                                        return { data: null, error: null };
                                    }
                                };
                            },
                            order: function() {
                                return { data: [], error: null };
                            }
                        };
                    },
                    insert: function() {
                        return {
                            select: function() {
                                return {
                                    single: function() {
                                        return { data: null, error: null };
                                    }
                                };
                            }
                        };
                    },
                    update: function() {
                        return {
                            eq: function() {
                                return { data: null, error: null };
                            }
                        };
                    }
                };
            }
        };
        console.warn('Using mock Supabase client');
    }
})();
