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
    
    // Initialize the Supabase connection
    init: function() {
        console.log('Initializing Supabase integration for Econ Words game...');

        // Check if Supabase is available
        if (typeof window.supabase !== 'undefined' && typeof window.supabase.from === 'function') {
            console.log('Supabase client already initialized');

            // Debug: Test the connection by checking if we can access the tables
            this.debugConnection();

            return this;
        } else {
            console.error('Supabase client not available. Game data will be stored locally only.');
            return this;
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
                const { data: statsData, error: statsError } = await window.supabase
                    .from(this.tables.userStats)
                    .select('id')
                    .limit(1);

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
                    .select('id')
                    .limit(1);

                if (leaderboardError) {
                    console.error('Error accessing econ_terms_leaderboard table:', leaderboardError);
                    this.tableExists.leaderboard = false;
                    console.warn('Will attempt to use fallback leaderboard table');
                    
                    // Check if we can access the fallback leaderboard table
                    try {
                        const { data: fallbackData, error: fallbackError } = await window.supabase
                            .from(this.tables.fallbackLeaderboard)
                            .select('id')
                            .limit(1);
                            
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
        if (typeof window.Auth !== 'undefined' && typeof window.Auth.getCurrentUser === 'function') {
            return window.Auth.getCurrentUser();
        }

        // Fallback to localStorage if Auth service is not available
        if (localStorage.getItem('student_id')) {
            return {
                id: localStorage.getItem('student_id'),
                name: localStorage.getItem('student_name') || 'Guest',
                isGuest: localStorage.getItem('is_guest') === 'true',
                sectionId: localStorage.getItem('section_id')
            };
        }

        return null;
    },

    // Save game score to Supabase using the dedicated econ_terms_leaderboard table
    saveScore: async function(score, gameData) {
        const user = this.getCurrentUser();

        console.log('Saving score to Supabase with user:', user, 'score:', score, 'term:', gameData ? gameData.term : 'unknown');

        // If user is not logged in or is a guest, we can't save the score
        if (!user || user.isGuest) {
            console.log('User is not logged in or is a guest. Cannot save score.');
            return { success: false, error: 'User not logged in', local: false };
        }

        try {
            // Check if Supabase is available
            if (typeof window.supabase === 'undefined') {
                console.warn('Supabase not available, cannot save score');
                return { success: false, error: 'Supabase not available', local: false };
            }

            // Prepare data for the econ_terms_leaderboard table
            const leaderboardData = {
                user_id: user.id,
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
                        return { success: false, error: error.message, local: false };
                    }
                    
                    console.log('Score saved to fallback leaderboard successfully:', fallbackData);
                    return { success: true, data: fallbackData, fallback: true };
                } catch (fallbackException) {
                    console.error('Exception saving to fallback leaderboard:', fallbackException);
                    return { success: false, error: error.message, local: false };
                }
            }

            console.log('Score saved to leaderboard table successfully:', data);
            return { success: true, data };
        } catch (error) {
            console.error('Exception saving score to Supabase:', error);
            return { success: false, error: error.message, local: false };
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
                // Query the dedicated econ_terms_leaderboard table
                const { data: dedicatedData, error: dedicatedError } = await window.supabase
                    .from('econ_terms_leaderboard')
                    .select(`
                        id,
                        user_id,
                        user_name,
                        score,
                        created_at
                    `)
                    .order('score', { ascending: false })
                    .limit(limit);

                if (!dedicatedError && dedicatedData) {
                    console.log('Retrieved high scores from econ_terms_leaderboard:', dedicatedData);

                    // Format the data from the dedicated table
                    const highScores = dedicatedData.map(item => {
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
            const { data, error } = await window.supabase
                .from('leaderboard')
                .select(`
                    id,
                    user_id,
                    user_name,
                    final_value,
                    created_at
                `)
                .eq('game_mode', 'econ_terms')
                .order('final_value', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('Error getting high scores from leaderboard:', error);
                return this.getHighScoresLocally();
            }

            console.log('Retrieved high scores from fallback leaderboard:', data);

            // Format the data from the regular leaderboard table
            const highScores = data.map(item => {
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
            
            // Try querying the econ_terms_user_stats table
            try {
                const { data, error } = await window.supabase
                    .from('econ_terms_user_stats')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();
                    
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
            } catch (queryError) {
                console.warn('Exception querying user stats:', queryError);
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
    createUserStats: async function() {
        console.log('Creating new user stats record');
        
        const user = this.getCurrentUser();
        
        // If user is not logged in or is a guest, we can't create stats
        if (!user || user.isGuest) {
            console.log('User is not logged in or is a guest. Cannot create stats.');
            return { success: false, error: 'User not logged in' };
        }
        
        try {
            // Check if Supabase is available
            if (typeof window.supabase === 'undefined') {
                console.warn('Supabase not available, cannot create stats');
                return { success: false, error: 'Supabase not available' };
            }
            
            // Create a new stats record
            const { data, error } = await window.supabase
                .from('econ_terms_user_stats')
                .insert({
                    user_id: user.id,
                    streak: 0,
                    high_score: 0,
                    games_played: 0
                });
                
            if (error) {
                console.error('Error creating user stats:', error);
                
                // Since we couldn't create user stats, just return success anyway
                // to prevent disrupting the game experience
                console.warn('Will proceed without user stats');
                return { success: true, error: error.message, warning: 'Stats not saved' };
            }
            
            console.log('User stats created successfully:', data);
            return { success: true, data };
        } catch (error) {
            console.error('Exception creating user stats in Supabase:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Update user stats after a game
    updateUserStats: async function(score, gameData) {
        console.log('Updating user stats with score:', score, 'gameData:', gameData);
        
        const user = this.getCurrentUser();
        
        // If user is not logged in or is a guest, we can't update stats
        if (!user || user.isGuest) {
            console.log('User is not logged in or is a guest. Cannot update stats.');
            return { success: false, error: 'User not logged in' };
        }
        
        try {
            // Check if Supabase is available
            if (typeof window.supabase === 'undefined') {
                console.warn('Supabase not available, cannot update stats');
                return { success: false, error: 'Supabase not available' };
            }
            
            // Get current user stats
            const { data, error } = await window.supabase
                .from('econ_terms_user_stats')
                .select('*')
                .eq('user_id', user.id)
                .single();
                
            if (error || !data) {
                console.warn('Error getting user stats or no data found, creating new record:', error);
                
                // Create a new stats record with the current game data
                const { data: newData, error: newError } = await window.supabase
                    .from('econ_terms_user_stats')
                    .insert({
                        user_id: user.id,
                        streak: gameData && gameData.won ? 1 : 0,
                        high_score: score,
                        games_played: 1
                    });
                    
                if (newError) {
                    console.error('Error creating user stats:', newError);
                    return { success: false, error: newError.message };
                }
                
                console.log('New user stats created successfully:', newData);
                return { success: true, data: newData };
            }
            
            // Calculate updated stats
            const streak = gameData && gameData.won ? 
                (data.streak + 1) : 0; // Reset streak if game was lost
                
            const highScore = Math.max(data.high_score || 0, score);
            const gamesPlayed = (data.games_played || 0) + 1;
            
            // Update the stats record
            const { data: updatedData, error: updateError } = await window.supabase
                .from('econ_terms_user_stats')
                .update({
                    streak: streak,
                    high_score: highScore,
                    games_played: gamesPlayed,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', user.id);
                
            if (updateError) {
                console.error('Error updating user stats:', updateError);
                return { success: false, error: updateError.message };
            }
            
            console.log('User stats updated successfully:', updatedData);
            return { success: true, data: updatedData };
        } catch (error) {
            console.error('Exception updating user stats in Supabase:', error);
            return { success: false, error: error.message };
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
            
            // Update the user's streak
            const { data, error } = await window.supabase
                .from('econ_terms_user_stats')
                .update({
                    streak: streak,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', user.id);
                
            if (error) {
                console.error('Error updating user streak:', error);
                return { success: false, error: error.message };
            }
            
            console.log('User streak updated successfully:', data);
            return { success: true, data };
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
            
            // Update the user's games played count
            const { data, error } = await window.supabase
                .from('econ_terms_user_stats')
                .update({
                    games_played: gameCount,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', user.id);
                
            if (error) {
                console.error('Error updating games played count:', error);
                return { success: false, error: error.message };
            }
            
            console.log('Games played count updated successfully:', data);
            return { success: true, data };
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

    console.log('Supabase integration initialized for Economics Terms game');
});
