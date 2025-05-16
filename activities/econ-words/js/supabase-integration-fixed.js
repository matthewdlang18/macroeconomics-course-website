/**
 * Supabase Integration for Economics Terms Game
 * This file provides functionality to connect the Economics Terms game with Supabase
 */

// Initialize the SupabaseEconTerms object
const SupabaseEconTerms = {
    // Tables configuration
    tables: {
        leaderboard: 'econ_terms_leaderboard',
        userStats: 'econ_terms_user_stats',
        fallbackLeaderboard: 'leaderboard' // Fallback to the general leaderboard table
    },
    
    // Table existence flags
    tableExists: {
        leaderboard: null, // null means unknown, will be tested
        userStats: null  // null means unknown, will be tested
    },
    
    // Helper method to get authenticated user ID in a Supabase v2 compatible way
    getAuthUserId: async function() {
        console.log('getAuthUserId called');
        try {
            // Verify Supabase is available first
            if (typeof window.supabase === 'undefined') {
                console.warn('Supabase not available for authentication');
                // Skip to direct fallbacks below
            } else {
                // First and most reliable method: check if we have an active session
                try {
                    const { data, error } = await window.supabase.auth.getSession();
                    console.log('auth.getSession result:', data, error);
                    if (!error && data && data.session && data.session.user) {
                        // Verify the token isn't expired
                        const currentTime = Math.floor(Date.now() / 1000);
                        if (data.session.expires_at && data.session.expires_at > currentTime) {
                            console.log('Successfully got valid user ID from session:', data.session.user.id);
                            return data.session.user.id;
                        } else if (!data.session.expires_at) {
                            // If no expiration, assume it's valid
                            console.log('Successfully got user ID from session (no expiration):', data.session.user.id);
                            return data.session.user.id;
                        } else {
                            console.warn('Session token expired, trying refresh');
                            try {
                                const { data: refreshData, error: refreshError } = await window.supabase.auth.refreshSession();
                                if (!refreshError && refreshData && refreshData.session && refreshData.session.user) {
                                    console.log('Successfully refreshed session and got user ID:', refreshData.session.user.id);
                                    return refreshData.session.user.id;
                                }
                            } catch (refreshError) {
                                console.warn('Error refreshing session:', refreshError);
                            }
                        }
                    }
                } catch (sessionError) {
                    console.warn('Error getting auth session:', sessionError);
                    // Continue to next fallback
                }
                
                // Try the getUser API next
                try {
                    const { data: userData, error: userError } = await window.supabase.auth.getUser();
                    console.log('auth.getUser result:', userData, userError);
                    if (!userError && userData && userData.user) {
                        console.log('Successfully got user ID from getUser API:', userData.user.id);
                        return userData.user.id;
                    }
                } catch (userError) {
                    console.warn('Error getting user data:', userError);
                    // Continue to next fallback
                }
            }
            
            // Fallback: try EconWordsAuth service
            if (typeof window.EconWordsAuth !== 'undefined') {
                try {
                    if (typeof window.EconWordsAuth.getCurrentUser === 'function') {
                        const authUser = window.EconWordsAuth.getCurrentUser();
                        if (authUser && authUser.id && !authUser.isGuest) {
                            console.log('Successfully got user ID from EconWordsAuth service:', authUser.id);
                            return authUser.id;
                        }
                    }
                } catch (authError) {
                    console.warn('Error using EconWordsAuth service:', authError);
                }
            }
            
            // Fallback: try Auth service
            if (typeof window.Auth !== 'undefined') {
                try {
                    if (typeof window.Auth.getCurrentUser === 'function') {
                        const authUser = window.Auth.getCurrentUser();
                        if (authUser && authUser.id && !authUser.isGuest) {
                            console.log('Successfully got user ID from Auth service:', authUser.id);
                            return authUser.id;
                        }
                    }
                    
                    // Try Auth.getAuthUserId if it exists
                    if (typeof window.Auth.getAuthUserId === 'function') {
                        const authId = await window.Auth.getAuthUserId();
                        if (authId) {
                            console.log('Successfully got user ID from Auth.getAuthUserId:', authId);
                            return authId;
                        }
                    }
                } catch (authError) {
                    console.warn('Error using Auth service:', authError);
                    // Continue to next fallback
                }
            }
            
            // Final fallback: localStorage
            const localStorageId = localStorage.getItem('student_id');
            const isGuest = localStorage.getItem('is_guest') === 'true';
            if (localStorageId && !isGuest) {
                console.log('Using user ID from localStorage:', localStorageId);
                return localStorageId;
            }
            
            console.warn('Could not get authenticated user ID from any source');
            return null;
        } catch (error) {
            console.error('Unexpected error getting auth user ID:', error);
            return null;
        }
    },
    
    // Initialize the Supabase connection
    init: function() {
        console.log('Initializing Supabase integration for Econ Words game...');

        // Check if Supabase is available
        if (typeof window.supabase !== 'undefined' && typeof window.supabase.from === 'function') {
            console.log('Supabase client already initialized');

            // Set up auth state change listener
            this.setupAuthListener();
            
            // Debug: Test the connection by checking if we can access the tables
            this.debugConnection();

            return this;
        } else {
            console.error('Supabase client not available. Game data will be stored locally only.');
            return this;
        }
    },
    
    // Setup auth state change listener
    setupAuthListener: function() {
        if (typeof window.supabase === 'undefined') return;
        
        try {
            // Listen for auth state changes
            const { data: authListener } = window.supabase.auth.onAuthStateChange(async (event, session) => {
                console.log('Auth state changed:', event, session ? session.user.id : null);
                
                if (event === 'SIGNED_IN') {
                    console.log('User signed in:', session.user.id);
                    // Update localStorage for compatibility
                    localStorage.setItem('student_id', session.user.id);
                    localStorage.setItem('student_name', session.user.user_metadata?.name || 'Player');
                    localStorage.setItem('is_guest', 'false');
                } else if (event === 'SIGNED_OUT') {
                    console.log('User signed out');
                }
            });
            
            console.log('Auth state change listener set up');
        } catch (error) {
            console.error('Error setting up auth state change listener:', error);
        }
    },

    // Debug function to test Supabase connection
    debugConnection: async function() {
        console.log('Testing Supabase connection...');

        try {
            // Ensure we have a valid auth session first
            try {
                const { data: authData, error: authError } = await window.supabase.auth.getSession();

                if (authError) {
                    console.error('Error checking authentication:', authError);
                    console.warn('Will proceed with limited functionality');
                } else if (authData && authData.session) {
                    console.log('User is authenticated:', authData.session.user.id);
                } else {
                    console.warn('User is not authenticated');
                    console.log('Game will run in guest mode with limited functionality');
                }
            } catch (authCheckError) {
                console.error('Exception checking auth session:', authCheckError);
                console.warn('Will proceed assuming no authentication');
            }

            // Check if we can access the econ_terms_user_stats table
            try {
                // Use a more compatible approach that doesn't rely on chaining .limit
                const { data: statsData, error: statsError } = await window.supabase
                    .from(this.tables.userStats)
                    .select('id', { count: 'exact', head: true });

                if (statsError) {
                    console.error('Error accessing econ_terms_user_stats table:', statsError);
                    this.tableExists.userStats = false;
                    console.warn('Will use local storage for user stats');
                } else {
                    console.log('Successfully accessed econ_terms_user_stats table:', statsData);
                    this.tableExists.userStats = true;
                }
            } catch (statsCheckError) {
                console.error('Exception checking user stats table:', statsCheckError);
                this.tableExists.userStats = false;
            }

            // Check if we can access the econ_terms_leaderboard table
            try {
                const { data: leaderboardData, error: leaderboardError } = await window.supabase
                    .from(this.tables.leaderboard)
                    .select('id', { count: 'exact', head: true });

                if (leaderboardError) {
                    console.error('Error accessing econ_terms_leaderboard table:', leaderboardError);
                    this.tableExists.leaderboard = false;
                    console.warn('Will attempt to use fallback leaderboard table');
                    
                    // Check if we can access the fallback leaderboard table
                    try {
                        const { data: fallbackData, error: fallbackError } = await window.supabase
                            .from(this.tables.fallbackLeaderboard)
                            .select('id', { count: 'exact', head: true });
                            
                        if (fallbackError) {
                            console.error('Error accessing fallback leaderboard table:', fallbackError);
                            console.warn('Scores will be stored locally only');
                        } else {
                            console.log('Successfully accessed fallback leaderboard table:', fallbackData);
                        }
                    } catch (fallbackCheckError) {
                        console.error('Exception checking fallback leaderboard:', fallbackCheckError);
                        console.warn('Will store scores locally only');
                    }
                } else {
                    console.log('Successfully accessed econ_terms_leaderboard table:', leaderboardData);
                    this.tableExists.leaderboard = true;
                }
            } catch (leaderboardCheckError) {
                console.error('Exception checking leaderboard table:', leaderboardCheckError);
                this.tableExists.leaderboard = false;
            }

            // Check if we're authenticated
            const { data: authData, error: authError } = await window.supabase.auth.getSession();

            if (authError) {
                console.error('Error checking authentication:', authError);
            } else if (authData && authData.session) {
                console.log('User is authenticated:', authData.session.user.id);
            } else {
                console.warn('User is not authenticated');
            }

            // Check if Auth service is available
            if (typeof window.Auth !== 'undefined') {
                const user = window.Auth.getCurrentUser();
                console.log('Auth service user:', user);
            } else {
                console.warn('Auth service not available');
            }
        } catch (error) {
            console.error('Exception testing Supabase connection:', error);
        }
    },

    // Get current user info from Auth service
    getCurrentUser: function() {
        // Use the EconWordsAuth service if available
        if (typeof window.EconWordsAuth !== 'undefined' && typeof window.EconWordsAuth.getCurrentUser === 'function') {
            console.log('Getting user from EconWordsAuth');
            return window.EconWordsAuth.getCurrentUser();
        }
        
        // Fallback to the older Auth service if available
        if (typeof window.Auth !== 'undefined' && typeof window.Auth.getCurrentUser === 'function') {
            console.log('Getting user from Auth service');
            return window.Auth.getCurrentUser();
        }

        // Fallback to localStorage if no Auth service is available
        if (localStorage.getItem('student_id')) {
            console.log('Getting user from localStorage');
            return {
                id: localStorage.getItem('student_id'),
                name: localStorage.getItem('student_name') || 'Guest',
                isGuest: localStorage.getItem('is_guest') === 'true',
                sectionId: localStorage.getItem('section_id')
            };
        }

        console.warn('No user authentication found');
        return null;
    },

    // Save game score to Supabase using the dedicated econ_terms_leaderboard table
    saveScore: async function(score, gameData) {
        const user = this.getCurrentUser();

        console.log('Saving score to Supabase with user:', user, 'score:', score, 'term:', gameData ? gameData.term : 'unknown');

        // If user is not logged in or is a guest, store the score locally
        if (!user || user.isGuest) {
            console.log('User is not logged in or is a guest. Storing score locally.');
            
            // Store high score locally
            const currentHighScore = parseInt(localStorage.getItem('econ_terms_high_score') || '0');
            if (score > currentHighScore) {
                localStorage.setItem('econ_terms_high_score', score.toString());
            }
            
            // Store recent scores in local storage as JSON array
            try {
                let localScores = JSON.parse(localStorage.getItem('econ_terms_scores') || '[]');
                localScores.push({
                    score: score,
                    term: gameData && gameData.term ? gameData.term : 'unknown',
                    attempts: gameData && gameData.attempts ? gameData.attempts : 0,
                    won: gameData && gameData.won ? gameData.won : false,
                    time_taken: gameData && gameData.timeTaken ? gameData.timeTaken : 0,
                    date: new Date().toISOString()
                });
                
                // Keep only the 10 most recent scores
                if (localScores.length > 10) {
                    localScores = localScores.slice(-10);
                }
                
                localStorage.setItem('econ_terms_scores', JSON.stringify(localScores));
                return { success: true, local: true };
            } catch (e) {
                console.error('Error storing scores locally:', e);
                return { success: false, error: 'Error storing score locally', local: true };
            }
        }

        try {
            // Check if Supabase is available
            if (typeof window.supabase === 'undefined') {
                console.warn('Supabase not available, storing score locally');
                let localScores = JSON.parse(localStorage.getItem('econ_terms_scores') || '[]');
                localScores.push({
                    score: score,
                    term: gameData && gameData.term ? gameData.term : 'unknown',
                    attempts: gameData && gameData.attempts ? gameData.attempts : 0,
                    won: gameData && gameData.won ? gameData.won : false,
                    time_taken: gameData && gameData.timeTaken ? gameData.timeTaken : 0,
                    date: new Date().toISOString()
                });
                localStorage.setItem('econ_terms_scores', JSON.stringify(localScores));
                return { success: true, local: true };
            }

            // Check if user is authenticated with Supabase
            const { data: authData } = await window.supabase.auth.getSession();
            
            if (!authData || !authData.session) {
                console.warn('User not properly authenticated with Supabase, storing score locally');
                let localScores = JSON.parse(localStorage.getItem('econ_terms_scores') || '[]');
                localScores.push({
                    score: score,
                    term: gameData && gameData.term ? gameData.term : 'unknown',
                    date: new Date().toISOString()
                });
                localStorage.setItem('econ_terms_scores', JSON.stringify(localScores));
                return { success: true, local: true };
            }
            
            // Get authenticated user ID using our helper method
            const authUserId = await this.getAuthUserId();
            
            if (!authUserId) {
                console.warn('No authenticated user ID found, storing score locally');
                let localScores = JSON.parse(localStorage.getItem('econ_terms_scores') || '[]');
                localScores.push({
                    score: score,
                    term: gameData && gameData.term ? gameData.term : 'unknown',
                    date: new Date().toISOString()
                });
                localStorage.setItem('econ_terms_scores', JSON.stringify(localScores));
                return { success: true, local: true };
            }

            // Prepare data for the econ_terms_leaderboard table
            const leaderboardData = {
                user_id: authUserId, // Use the authenticated user ID from Supabase
                user_name: user.name || 'Player',
                score: score,
                term: gameData && gameData.term ? gameData.term : 'unknown',
                attempts: gameData && gameData.attempts ? gameData.attempts : 0,
                won: gameData && gameData.won ? gameData.won : false,
                time_taken: gameData && gameData.timeTaken ? gameData.timeTaken : 0
            };

            // Add section_id if available
            if (user.sectionId) {
                leaderboardData.section_id = user.sectionId;
            }

            console.log('Prepared leaderboard data for Supabase:', leaderboardData);

            // Try to save to econ_terms_leaderboard table
            const { data, error } = await window.supabase
                .from('econ_terms_leaderboard')
                .insert(leaderboardData);

            if (error) {
                console.error('Error saving to leaderboard table:', error);
                
                // For certain error types, try using a different approach
                if (error.code === '42501' || error.code === '23503' || error.message.includes('violates row-level security policy')) {
                    console.log('RLS policy violation, trying alternate approach with Supabase auth user');
                    
                    try {
                        // Get the current user directly from Supabase auth
                        const { data: userData } = await window.supabase.auth.getUser();
                        
                        if (userData && userData.user) {
                            // Try again with the user ID from Supabase auth
                            const retryData = {
                                ...leaderboardData,
                                user_id: userData.user.id
                            };
                            
                            const { data: retryResult, error: retryError } = await window.supabase
                                .from('econ_terms_leaderboard')
                                .insert(retryData);
                                
                            if (!retryError) {
                                console.log('Score saved successfully on retry:', retryResult);
                                return { success: true, data: retryResult };
                            }
                        }
                    } catch (retryError) {
                        console.error('Error on retry:', retryError);
                    }
                }
                
                // Try fallback to the general leaderboard table
                console.log('Attempting to save to general leaderboard table as fallback');
                try {
                    // Add game_mode to identify this as an Econ Words score
                    leaderboardData.game_mode = 'econ_terms';
                    leaderboardData.final_value = leaderboardData.score; // Map score to final_value for the general table
                    
                    const { data: fallbackData, error: fallbackError } = await window.supabase
                        .from('leaderboard')
                        .insert(leaderboardData);
                        
                    if (fallbackError) {
                        console.error('Error saving to fallback leaderboard:', fallbackError);
                        
                        // Store locally as a last resort
                        let localScores = JSON.parse(localStorage.getItem('econ_terms_scores') || '[]');
                        localScores.push({
                            score: score,
                            term: gameData && gameData.term ? gameData.term : 'unknown',
                            date: new Date().toISOString()
                        });
                        localStorage.setItem('econ_terms_scores', JSON.stringify(localScores));
                        return { success: true, local: true, error: fallbackError.message };
                    }
                    
                    console.log('Score saved to fallback leaderboard successfully:', fallbackData);
                    return { success: true, data: fallbackData, fallback: true };
                } catch (fallbackException) {
                    console.error('Exception saving to fallback leaderboard:', fallbackException);
                    // Store locally as a last resort
                    let localScores = JSON.parse(localStorage.getItem('econ_terms_scores') || '[]');
                    localScores.push({
                        score: score,
                        term: gameData && gameData.term ? gameData.term : 'unknown',
                        date: new Date().toISOString()
                    });
                    localStorage.setItem('econ_terms_scores', JSON.stringify(localScores));
                    return { success: true, local: true, error: fallbackException.message };
                }
            }

            console.log('Score saved to leaderboard table successfully:', data);
            return { success: true, data };
        } catch (error) {
            console.error('Exception saving score to Supabase:', error);
            
            // Store locally as a last resort
            try {
                let localScores = JSON.parse(localStorage.getItem('econ_terms_scores') || '[]');
                localScores.push({
                    score: score,
                    term: gameData && gameData.term ? gameData.term : 'unknown',
                    date: new Date().toISOString()
                });
                localStorage.setItem('econ_terms_scores', JSON.stringify(localScores));
                return { success: true, local: true, error: error.message };
            } catch (e) {
                return { success: false, error: 'Failed to save score', local: false };
            }
        }
    },

    // This function is now a no-op since we're not using localStorage
    saveScoreLocally: function(/* score, gameData */) {
        console.log('saveScoreLocally is now a no-op since we\'re not using localStorage');
        // Do nothing
    },

    // Get high scores from Supabase - using dedicated econ_terms_leaderboard table
    getHighScores: async function(limit = 10) {
        try {
            // Check if Supabase is available
            if (typeof window.supabase === 'undefined') {
                console.warn('Supabase not available, returning empty high scores');
                return this.getHighScoresLocally();
            }

            // Try to query the dedicated econ_terms_leaderboard table first
            try {
                // Use a more compatible query format for the dedicated table without chaining methods
                const { data: dedicatedData, error: dedicatedError } = await window.supabase
                    .from('econ_terms_leaderboard')
                    .select('id, user_id, user_name, score, created_at');

                if (!dedicatedError && dedicatedData) {
                    console.log('Retrieved high scores from econ_terms_leaderboard:', dedicatedData);

                    // Sort data manually on client side instead of using .order()
                    const sortedData = [...dedicatedData].sort((a, b) => {
                        return (b.score || 0) - (a.score || 0);
                    });
                    
                    // Apply limit manually
                    const limitedData = sortedData.slice(0, limit);

                    // Format the data from the dedicated table
                    const highScores = limitedData.map(item => {
                        return {
                            id: item.id || 'unknown',
                            userId: item.user_id,
                            name: item.user_name || 'Unknown Player',
                            score: item.score || 0,
                            date: item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'
                        };
                    });

                    return highScores;
                }
            } catch (dedicatedError) {
                console.warn('Error with dedicated leaderboard table, falling back:', dedicatedError);
            }

            // Fallback: Query the regular leaderboard table with game_mode filter
            try {
                // Don't use .order() method, just get all data first
                const { data, error } = await window.supabase
                    .from('leaderboard')
                    .select('id, user_id, user_name, final_value, created_at, game_mode');

                if (error) {
                    console.error('Error getting high scores from leaderboard:', error);
                    return this.getHighScoresLocally();
                }

                // Filter results manually for game_mode = 'econ_terms'
                const filteredData = data.filter(item => item.game_mode === 'econ_terms');
                
                // Sort manually by final_value
                filteredData.sort((a, b) => (b.final_value || 0) - (a.final_value || 0));
                
                // Apply limit manually
                const limitedData = filteredData.slice(0, limit);

                console.log('Retrieved high scores from fallback leaderboard (filtered):', limitedData);

                // Format the data from the regular leaderboard table
                const highScores = limitedData.map(item => {
                    return {
                        id: item.id || 'unknown',
                        userId: item.user_id,
                        name: item.user_name || 'Unknown Player',
                        score: item.final_value || 0,
                        date: item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'
                    };
                });

                return highScores;
            } catch (error) {
                console.error('Exception querying leaderboard table:', error);
                return this.getHighScoresLocally();
            }
        } catch (error) {
            console.error('Exception getting high scores from Supabase:', error);
            return this.getHighScoresLocally();
        }
    },

    // Get high scores locally - now returns empty data
    getHighScoresLocally: function() {
        console.log('getHighScoresLocally is now returning empty data since we\'re not using localStorage');
        return [{
            id: 'no-data',
            name: 'No Data Available',
            score: 0,
            date: new Date().toLocaleDateString()
        }];
    },

    // Get user stats from the econ_terms_user_stats table
    getUserStats: async function() {
        console.log('Getting user stats from econ_terms_user_stats table');
        
        const user = this.getCurrentUser();
        
        // If user is not logged in or is a guest, return default values
        if (!user || user.isGuest) {
            console.log('User is not logged in or is a guest. Returning default stats.');
            return {
                streak: 0,
                highScore: 0,
                gamesPlayed: 0
            };
        }
        
        try {
            // Check if Supabase is available
            if (typeof window.supabase === 'undefined') {
                console.warn('Supabase not available, returning default stats');
                return {
                    streak: 0,
                    highScore: 0,
                    gamesPlayed: 0
                };
            }
            
            // Get authenticated user ID using our helper method
            const authUserId = await this.getAuthUserId();
            
            // Try querying the econ_terms_user_stats table
            try {
                // Filter directly in the query to only get the current user's stats
                const { data, error } = await window.supabase
                    .from('econ_terms_user_stats')
                    .select('*')
                    .filter('user_id', 'eq', user.id)
                    .maybeSingle(); // maybeSingle returns null if no records found, or the single record if found
                    
                if (error || !data) {
                    console.warn('Error getting user stats or no data found:', error);
                    
                    // Try creating a new stats record for this user
                    try {
                        await this.createUserStats();
                    } catch (createError) {
                        console.warn('Error creating user stats, continuing with default values:', createError);
                    }
                    
                    // Return default values
                    return {
                        streak: 0,
                        highScore: 0,
                        gamesPlayed: 0
                    };
                }
                
                // No need to filter manually as we filtered in the query
                // If we get here, data is either null (handled above) or the user's record
                if (!data) {
                    console.warn('No stats found for current user, creating new record');
                    
                    try {
                        await this.createUserStats();
                    } catch (createError) {
                        console.warn('Error creating user stats, continuing with default values:', createError);
                    }
                    
                    return {
                        streak: 0,
                        highScore: 0,
                        gamesPlayed: 0
                    };
                }
                
                console.log('Retrieved user stats:', data);
                
                return {
                    streak: data.streak || 0,
                    highScore: data.high_score || 0,
                    gamesPlayed: data.games_played || 0
                };
            } catch (queryError) {
                console.warn('Exception querying user stats:', queryError);
                return {
                    streak: 0,
                    highScore: 0,
                    gamesPlayed: 0
                };
            }
        } catch (error) {
            console.error('Exception getting user stats from Supabase:', error);
            return {
                streak: 0,
                highScore: 0,
                gamesPlayed: 0
            };
        }
    },
    
    // Create a new user stats record
    createUserStats: async function(score = 0) {
        console.log('Creating user stats with initial score:', score);
        
        try {
            // Check if Supabase is available
            if (typeof window.supabase === 'undefined') {
                console.warn('Supabase not available, cannot create user stats');
                return { success: false, error: 'Supabase not available' };
            }
            
            // Get current user information
            const user = this.getCurrentUser();
            
            // If user is a guest, just store stats locally
            if (!user || user.isGuest) {
                console.log('User is a guest, storing stats locally');
                localStorage.setItem('econ_terms_high_score', score.toString());
                localStorage.setItem('econ_terms_streak', '0');
                localStorage.setItem('econ_terms_games_played', '0');
                return { success: true, data: { guest: true } };
            }
            
            // Get authenticated user ID using our helper method
            const authUserId = await this.getAuthUserId();
            
            if (!authUserId) {
                console.warn('No authenticated user ID found');
                return { success: false, error: 'No authenticated user ID' };
            }
            
            // Get user name
            let userName = '';
            try {
                // Try to get user name from auth metadata
                const { data: userData, error } = await window.supabase.auth.getUser();
                if (!error && userData && userData.user && userData.user.user_metadata && userData.user.user_metadata.name) {
                    userName = userData.user.user_metadata.name;
                } else {
                    // Try to get from profiles table
                    const { data: profileData, error: profileError } = await window.supabase
                        .from('profiles')
                        .select('name')
                        .eq('id', authUserId)
                        .single();
                    
                    if (!profileError && profileData && profileData.name) {
                        userName = profileData.name;
                    }
                }
            } catch (error) {
                console.warn('Error getting user details, using fallback name', error);
                // Fallback to localStorage or another default
                userName = localStorage.getItem('student_name') || 'Player';
            }
            
            // First check if user already has stats
            const { data: existingStats, error: checkError } = await window.supabase
                .from('econ_terms_user_stats')
                .select('*')
                .eq('user_id', authUserId);
                
            if (!checkError && existingStats && existingStats.length > 0) {
                console.log('User stats already exist:', existingStats);
                return { success: true, data: existingStats[0] };
            }
            
            // Create the stats record - with proper auth handling
            try {
                // First check if user is authenticated with Supabase
                const { data: authData } = await window.supabase.auth.getSession();
                
                if (!authData || !authData.session) {
                    console.warn('User not authenticated with Supabase, storing stats locally only');
                    localStorage.setItem('econ_terms_high_score', score.toString());
                    return { success: true, data: { guest: true } };
                }
                
                const { data, error } = await window.supabase
                    .from('econ_terms_user_stats')
                    .insert([
                        { 
                            high_score: score || 0,
                            streak: 0,
                            games_played: 0,
                            user_id: authUserId
                        }
                    ]);
                
                if (error) {
                    console.error('Error creating user stats:', error);
                    // Store locally as fallback
                    localStorage.setItem('econ_terms_high_score', score.toString());
                    return { success: false, error: error };
                }
                
                console.log('User stats created successfully:', data);
                return { success: true, data: data };
            } catch (insertError) {
                console.error('Exception creating user stats:', insertError);
                // Store locally as fallback
                localStorage.setItem('econ_terms_high_score', score.toString());
                return { success: false, error: insertError };
            }
        } catch (error) {
            console.error('Exception creating user stats:', error);
            return { success: false, error: error };
        }
    },
    
    // Update user stats after a game
    updateUserStats: async function(score, gameData) {
        console.log('Updating user stats with score:', score, 'gameData:', gameData);
        
        const user = this.getCurrentUser();
        
        // If user is not logged in or is a guest, store stats locally
        if (!user || user.isGuest) {
            console.log('User is not logged in or is a guest. Storing stats locally.');
            const currentHighScore = parseInt(localStorage.getItem('econ_terms_high_score') || '0');
            if (score > currentHighScore) {
                localStorage.setItem('econ_terms_high_score', score.toString());
            }
            const currentStreak = parseInt(localStorage.getItem('econ_terms_streak') || '0');
            if (gameData && gameData.won) {
                localStorage.setItem('econ_terms_streak', (currentStreak + 1).toString());
            } else if (gameData && !gameData.won) {
                localStorage.setItem('econ_terms_streak', '0');
            }
            const gamesPlayed = parseInt(localStorage.getItem('econ_terms_games_played') || '0');
            localStorage.setItem('econ_terms_games_played', (gamesPlayed + 1).toString());
            return { success: true, data: { guest: true } };
        }
        
        try {
            // Check if Supabase is available
            if (typeof window.supabase === 'undefined') {
                console.warn('Supabase not available, cannot update stats');
                return { success: false, error: 'Supabase not available' };
            }
            
            // Get authenticated user ID using our helper method
            const authUserId = await this.getAuthUserId();
            
            if (!authUserId) {
                console.warn('No authenticated user ID found');
                return { success: false, error: 'No authenticated user ID' };
            }

            // First check if user is authenticated with Supabase
            const { data: authData } = await window.supabase.auth.getSession();
            
            if (!authData || !authData.session) {
                console.warn('User not properly authenticated with Supabase, storing stats locally');
                const currentHighScore = parseInt(localStorage.getItem('econ_terms_high_score') || '0');
                if (score > currentHighScore) {
                    localStorage.setItem('econ_terms_high_score', score.toString());
                }
                return { success: true, data: { guest: true } };
            }
            
            // Check if stats exist
            const { data: existingStats, error: checkError } = await window.supabase
                .from('econ_terms_user_stats')
                .select('*')
                .eq('user_id', authUserId);
            
            if (checkError) {
                console.error('Error checking existing stats:', checkError);
                return { success: false, error: checkError };
            }
            
            // If stats don't exist, create them
            if (!existingStats || existingStats.length === 0) {
                return this.createUserStats(score);
            }
            
            // Update stats based on game result
            const userStats = existingStats[0];
            let newStreak = userStats.streak || 0;
            let highScore = userStats.high_score || 0;
            let gamesPlayed = userStats.games_played || 0;
            
            // Update streak based on game result
            if (gameData && gameData.won) {
                newStreak += 1;
            } else if (gameData && !gameData.won) {
                newStreak = 0;
            }
            
            // Update high score if current score is higher
            if (score > highScore) {
                highScore = score;
            }
            
            // Increment games played
            gamesPlayed += 1;
            
            // Update in Supabase
            const { data, error } = await window.supabase
                .from('econ_terms_user_stats')
                .update({
                    high_score: highScore,
                    streak: newStreak,
                    games_played: gamesPlayed,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userStats.id);
            
            if (error) {
                console.error('Error updating user stats:', error);
                return { success: false, error: error };
            }
            
            console.log('User stats updated successfully:', data);
            return { success: true, data: data };
        } catch (error) {
            console.error('Exception updating user stats:', error);
            return { success: false, error: error };
        }
    },

    // Update user streak
    updateUserStreak: async function(streak) {
        console.log('Updating user streak to:', streak);
        
        const user = this.getCurrentUser();
        
        // If user is not logged in or is a guest, we can't update streak
        if (!user || user.isGuest) {
            console.log('User is not logged in or is a guest. Cannot update streak.');
            return { success: false, error: 'User not logged in' };
        }
        
        try {
            // Check if Supabase is available
            if (typeof window.supabase === 'undefined') {
                console.warn('Supabase not available, cannot update streak');
                return { success: false, error: 'Supabase not available' };
            }
            
            // Get authenticated user ID using our helper method
            const authUserId = await this.getAuthUserId();
            
            // First, get the user's stats record to find the ID
            try {
                // Filter directly in the query for efficiency and security
                const { data, error } = await window.supabase
                    .from('econ_terms_user_stats')
                    .select('*')
                    .filter('user_id', 'eq', user.id)
                    .maybeSingle();
                    
                if (error) {
                    console.error('Error fetching user stats for streak update:', error);
                    return { success: false, error: error.message };
                }
                
                // userStats is either the user's record or null
                const userStats = data;
                
                if (!userStats) {
                    console.warn('No stats record found for streak update, creating new');
                    // Create a new record
                    const { data: newData, error: newError } = await window.supabase
                        .from('econ_terms_user_stats')
                        .insert({
                            user_id: user.id,
                            streak: streak,
                            high_score: 0,
                            games_played: 0
                            // user_id is already set above, no need for auth_user_id
                        });
                        
                    if (newError) {
                        console.error('Error creating new stats record for streak:', newError);
                        return { success: false, error: newError.message };
                    }
                    
                    return { success: true, data: newData };
                }
                
                // Use upsert to update the record without .eq
                const { data: updateData, error: updateError } = await window.supabase
                    .from('econ_terms_user_stats')
                    .upsert({
                        id: userStats.id,
                        user_id: user.id,
                        streak: streak,
                        high_score: userStats.high_score, 
                        games_played: userStats.games_played,
                        updated_at: new Date().toISOString()
                        // user_id is already set above, no need for auth_user_id
                    });
                    
                if (updateError) {
                    console.error('Error updating user streak:', updateError);
                    return { success: false, error: updateError.message };
                }
                
                console.log('User streak updated successfully:', updateData);
                return { success: true, data: updateData };
            } catch (error) {
                console.error('Exception updating streak:', error);
                return { success: false, error: error.message };
            }
        } catch (error) {
            console.error('Exception updating user streak in Supabase:', error);
            return { success: false, error: error.message };
        }
    },

    // Update games played count
    updateGameCount: async function(gameCount) {
        console.log('Updating games played count to:', gameCount);
        
        const user = this.getCurrentUser();
        
        // If user is not logged in or is a guest, we can't update games count
        if (!user || user.isGuest) {
            console.log('User is not logged in or is a guest. Cannot update games count.');
            return { success: false, error: 'User not logged in' };
        }
        
        try {
            // Check if Supabase is available
            if (typeof window.supabase === 'undefined') {
                console.warn('Supabase not available, cannot update games count');
                return { success: false, error: 'Supabase not available' };
            }
            
            // Get authenticated user ID using our helper method
            const authUserId = await this.getAuthUserId();
            
            // First, get the user's stats record to find the ID
            try {
                // Filter directly in the query for efficiency and security
                const { data, error } = await window.supabase
                    .from('econ_terms_user_stats')
                    .select('*')
                    .filter('user_id', 'eq', user.id)
                    .maybeSingle();
                    
                if (error) {
                    console.error('Error fetching user stats for game count update:', error);
                    return { success: false, error: error.message };
                }
                
                // userStats is either the user's record or null
                const userStats = data;
                
                if (!userStats) {
                    console.warn('No stats record found for game count update, creating new');
                    // Create a new record
                    const { data: newData, error: newError } = await window.supabase
                        .from('econ_terms_user_stats')
                        .insert({
                            user_id: user.id,
                            streak: 0,
                            high_score: 0,
                            games_played: gameCount
                            // user_id is already set above, no need for auth_user_id
                        });
                        
                    if (newError) {
                        console.error('Error creating new stats record for game count:', newError);
                        return { success: false, error: newError.message };
                    }
                    
                    return { success: true, data: newData };
                }
                
                // Use upsert to update the record without .eq
                const { data: updateData, error: updateError } = await window.supabase
                    .from('econ_terms_user_stats')
                    .upsert({
                        id: userStats.id,
                        user_id: user.id,
                        streak: userStats.streak,
                        high_score: userStats.high_score, 
                        games_played: gameCount,
                        updated_at: new Date().toISOString()
                        // user_id is already set above, no need for auth_user_id
                    });
                    
                if (updateError) {
                    console.error('Error updating games played count:', updateError);
                    return { success: false, error: updateError.message };
                }
                
                console.log('Games played count updated successfully:', updateData);
                return { success: true, data: updateData };
            } catch (error) {
                console.error('Exception updating game count:', error);
                return { success: false, error: error.message };
            }
        } catch (error) {
            console.error('Exception updating games played count in Supabase:', error);
            return { success: false, error: error.message };
        }
    }
};

// Initialize SupabaseEconTerms when the script loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Supabase integration
    SupabaseEconTerms.init();

    // Make it available globally
    window.SupabaseEconTerms = SupabaseEconTerms;