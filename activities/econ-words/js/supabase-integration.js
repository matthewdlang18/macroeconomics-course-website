/**
 * Supabase Integration for Economics Terms Game
 * This file provides functionality to connect the Economics Terms game with Supabase
 */

// Initialize the SupabaseEconTerms object
const SupabaseEconTerms = {
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
            // Check if we can access the econ_terms_user_stats table
            const { data: statsData, error: statsError } = await window.supabase
                .from('econ_terms_user_stats')
                .select('id')
                .limit(1);

            if (statsError) {
                console.error('Error accessing econ_terms_user_stats table:', statsError);
            } else {
                console.log('Successfully accessed econ_terms_user_stats table:', statsData);
            }

            // Check if we can access the econ_terms_leaderboard table
            const { data: leaderboardData, error: leaderboardError } = await window.supabase
                .from('econ_terms_leaderboard')
                .select('id')
                .limit(1);

            if (leaderboardError) {
                console.error('Error accessing econ_terms_leaderboard table:', leaderboardError);
            } else {
                console.log('Successfully accessed econ_terms_leaderboard table:', leaderboardData);
            }

            // Check if we can access the profiles table
            const { data: profilesData, error: profilesError } = await window.supabase
                .from('profiles')
                .select('id')
                .limit(1);

            if (profilesError) {
                console.error('Error accessing profiles table:', profilesError);
            } else {
                console.log('Successfully accessed profiles table:', profilesData);
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

    // Save game score to Supabase
    saveScore: async function(score, gameData) {
        const user = this.getCurrentUser();

        console.log('Saving score to Supabase with user:', user);

        // Check if Auth service is available and if user is authenticated
        if (typeof window.Auth !== 'undefined') {
            console.log('Auth service available, checking authentication...');
            console.log('Is logged in:', window.Auth.isLoggedIn());
            console.log('Current user from Auth:', window.Auth.getCurrentUser());
        } else {
            console.warn('Auth service not available');
        }

        // Check if we're authenticated with Supabase directly
        try {
            const { data: authData, error: authError } = await window.supabase.auth.getSession();

            if (authError) {
                console.error('Error checking authentication with Supabase:', authError);
            } else if (authData && authData.session) {
                console.log('User is authenticated with Supabase:', authData.session.user.id);
            } else {
                console.warn('User is not authenticated with Supabase');
            }
        } catch (e) {
            console.error('Exception checking authentication with Supabase:', e);
        }

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

            // Prepare data for saving to the econ_terms_leaderboard table
            const scoreData = {
                user_id: user.id,
                user_name: user.name || localStorage.getItem('display_name') || 'Player',
                score: score,
                term: gameData.term,
                attempts: gameData.attempts.length,
                won: gameData.won,
                time_taken: gameData.timeTaken,
                created_at: new Date().toISOString()
            };

            // Add section_id if available
            if (user.sectionId) {
                scoreData.section_id = user.sectionId;
            }

            console.log('Prepared score data for existing leaderboard structure:', scoreData);

            console.log('Attempting to save score to Supabase:', scoreData);

            try {
                // First check if the econ_terms_leaderboard table exists
                const { error: checkError } = await window.supabase
                    .from('econ_terms_leaderboard')
                    .select('id')
                    .limit(1);

                if (checkError) {
                    console.warn('econ_terms_leaderboard table may not exist:', checkError.message);

                    // Try using the regular leaderboard table as a fallback
                    console.log('Trying to use the regular leaderboard table as a fallback...');

                    // Prepare data for the regular leaderboard table
                    const regularLeaderboardData = {
                        user_id: user.id,
                        user_name: user.name || 'Player',
                        game_mode: 'econ_terms',
                        final_value: score,
                        created_at: new Date().toISOString(),
                        total_cash_injected: 0 // Not applicable for this game
                    };

                    // Add section_id if available
                    if (user.sectionId) {
                        regularLeaderboardData.section_id = user.sectionId;
                    }

                    // Try to save to the regular leaderboard table
                    const { data: regularData, error: regularError } = await window.supabase
                        .from('leaderboard')
                        .insert(regularLeaderboardData);

                    if (regularError) {
                        console.error('Error saving to regular leaderboard table:', regularError);
                        return { success: false, error: regularError.message, local: false };
                    }

                    console.log('Score saved to regular leaderboard table:', regularData);
                    return { success: true, data: regularData };
                }

                // Save to Supabase econ_terms_leaderboard table
                const { data, error } = await window.supabase
                    .from('econ_terms_leaderboard')
                    .insert(scoreData);

                if (error) {
                    console.error('Error saving score to econ_terms_leaderboard:', error);

                    // Try using the regular leaderboard table as a fallback
                    console.log('Trying to use the regular leaderboard table as a fallback...');

                    // Prepare data for the regular leaderboard table
                    const regularLeaderboardData = {
                        user_id: user.id,
                        user_name: user.name || 'Player',
                        game_mode: 'econ_terms',
                        final_value: score,
                        created_at: new Date().toISOString(),
                        total_cash_injected: 0 // Not applicable for this game
                    };

                    // Add section_id if available
                    if (user.sectionId) {
                        regularLeaderboardData.section_id = user.sectionId;
                    }

                    // Try to save to the regular leaderboard table
                    const { data: regularData, error: regularError } = await window.supabase
                        .from('leaderboard')
                        .insert(regularLeaderboardData);

                    if (regularError) {
                        console.error('Error saving to regular leaderboard table:', regularError);
                        return { success: false, error: regularError.message, local: false };
                    }

                    console.log('Score saved to regular leaderboard table:', regularData);
                    return { success: true, data: regularData };
                }

                console.log('Score saved to Supabase successfully:', data);
                return { success: true, data };
            } catch (innerError) {
                console.error('Inner exception saving score to Supabase:', innerError);
                return { success: false, error: innerError.message, local: false };
            }
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

    // Get high scores from Supabase
    getHighScores: async function(limit = 10) {
        try {
            // Check if Supabase is available
            if (typeof window.supabase === 'undefined') {
                console.warn('Supabase not available, getting high scores from localStorage');
                return this.getHighScoresLocally();
            }

            try {
                // First check if the econ_terms_leaderboard table exists
                const { error: checkError } = await window.supabase
                    .from('econ_terms_leaderboard')
                    .select('id')
                    .limit(1);

                if (checkError) {
                    console.warn('econ_terms_leaderboard table may not exist:', checkError.message);

                    // Try using the regular leaderboard table as a fallback
                    console.log('Trying to get high scores from regular leaderboard table...');

                    // Query the regular leaderboard table
                    const { data: regularData, error: regularError } = await window.supabase
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

                    if (regularError) {
                        console.error('Error getting high scores from regular leaderboard:', regularError);
                        return this.getHighScoresLocally();
                    }

                    console.log('Retrieved high scores from regular leaderboard:', regularData);

                    // Format the data from the regular leaderboard table
                    const highScores = regularData.map(item => {
                        return {
                            id: item.id || 'unknown',
                            name: item.user_name || 'Unknown Player',
                            score: item.final_value || 0,
                            date: item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'
                        };
                    });

                    return highScores;
                }

                // Query the econ_terms_leaderboard table
                const { data, error } = await window.supabase
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

                if (error) {
                    console.error('Error getting high scores from econ_terms_leaderboard:', error);

                    // Try using the regular leaderboard table as a fallback
                    console.log('Trying to get high scores from regular leaderboard table...');

                    // Query the regular leaderboard table
                    const { data: regularData, error: regularError } = await window.supabase
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

                    if (regularError) {
                        console.error('Error getting high scores from regular leaderboard:', regularError);
                        return this.getHighScoresLocally();
                    }

                    console.log('Retrieved high scores from regular leaderboard:', regularData);

                    // Format the data from the regular leaderboard table
                    const highScores = regularData.map(item => {
                        return {
                            id: item.id || 'unknown',
                            name: item.user_name || 'Unknown Player',
                            score: item.final_value || 0,
                            date: item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'
                        };
                    });

                    return highScores;
                }

                console.log('Retrieved high scores from Supabase:', data);

                // Format the data from the econ_terms_leaderboard table
                const highScores = data.map(item => {
                    return {
                        id: item.id || 'unknown',
                        name: item.user_name || 'Unknown Player',
                        score: item.score || 0,
                        date: item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'
                    };
                });

                return highScores;
            } catch (innerError) {
                console.error('Inner exception getting high scores from Supabase:', innerError);
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

    // Get user stats from Supabase
    getUserStats: async function() {
        const user = this.getCurrentUser();

        // If user is not logged in or is a guest, return default values
        if (!user || user.isGuest) {
            console.log('User is not logged in or is a guest. Using default stats.');
            return {
                streak: 0,
                highScore: 0,
                gamesPlayed: 0
            };
        }

        try {
            // Check if Supabase is available
            if (typeof window.supabase === 'undefined') {
                console.warn('Supabase not available, using default stats');
                return {
                    streak: 0,
                    highScore: 0,
                    gamesPlayed: 0
                };
            }

            try {
                // First check if the user_stats table exists
                const { error: checkError } = await window.supabase
                    .from('econ_terms_user_stats')
                    .select('id')
                    .limit(1);

                if (checkError) {
                    console.warn('econ_terms_user_stats table may not exist:', checkError.message);

                    // Since we're having issues with the table, return default values
                    console.log('Using default stats since table access failed');
                    return {
                        streak: 0,
                        highScore: 0,
                        gamesPlayed: 0
                    };
                }
            } catch (tableCheckError) {
                console.error('Error checking if econ_terms_user_stats table exists:', tableCheckError);
                return {
                    streak: 0,
                    highScore: 0,
                    gamesPlayed: 0
                };
            }

            // Get user stats from Supabase
            const { data, error } = await window.supabase
                .from('econ_terms_user_stats')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error) {
                console.warn('Error getting user stats from Supabase:', error);

                // If the error is that no rows were returned, create a new stats record
                if (error.code === 'PGRST116') {
                    const newStats = {
                        user_id: user.id,
                        streak: 0,
                        high_score: 0,
                        games_played: 0,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };

                    const { data: newData, error: insertError } = await window.supabase
                        .from('econ_terms_user_stats')
                        .insert(newStats)
                        .select()
                        .single();

                    if (insertError) {
                        console.error('Error creating user stats in Supabase:', insertError);

                        // Return default values
                        return {
                            streak: 0,
                            highScore: 0,
                            gamesPlayed: 0
                        };
                    }

                    return {
                        streak: newData.streak,
                        highScore: newData.high_score,
                        gamesPlayed: newData.games_played
                    };
                }

                return {
                    streak: 0,
                    highScore: 0,
                    gamesPlayed: 0
                };
            }

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

    // Update user streak in Supabase
    updateUserStreak: async function(streak) {
        const user = this.getCurrentUser();

        // If user is not logged in or is a guest, we can't update the streak
        if (!user || user.isGuest) {
            console.log('User is not logged in or is a guest. Cannot save streak.');
            return { success: false, error: 'User not logged in', local: false };
        }

        try {
            // Check if Supabase is available
            if (typeof window.supabase === 'undefined') {
                console.warn('Supabase not available, cannot save streak');
                return { success: false, error: 'Supabase not available', local: false };
            }

            try {
                // Make sure user stats exist by calling getUserStats
                await this.getUserStats();

                // Update streak in Supabase
                const { error } = await window.supabase
                    .from('econ_terms_user_stats')
                    .update({
                        streak: streak,
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_id', user.id);

                if (error) {
                    console.error('Error updating streak in Supabase:', error);
                    return { success: false, error: error.message, local: false };
                }
            } catch (innerError) {
                console.error('Error in updateUserStreak when trying to update Supabase:', innerError);
                return { success: false, error: innerError.message, local: false };
            }

            console.log('Streak updated in Supabase:', streak);
            return { success: true, local: false };
        } catch (error) {
            console.error('Exception updating streak in Supabase:', error);
            return { success: false, error: error.message, local: false };
        }
    },

    // Update game count in Supabase
    updateGameCount: async function(gameCount) {
        const user = this.getCurrentUser();

        // If user is not logged in or is a guest, we can't update the game count
        if (!user || user.isGuest) {
            console.log('User is not logged in or is a guest. Cannot save game count.');
            return { success: false, error: 'User not logged in', local: false };
        }

        try {
            // Check if Supabase is available
            if (typeof window.supabase === 'undefined') {
                console.warn('Supabase not available, cannot save game count');
                return { success: false, error: 'Supabase not available', local: false };
            }

            try {
                // Make sure user stats exist by calling getUserStats
                await this.getUserStats();

                // Update game count in Supabase
                const { error } = await window.supabase
                    .from('econ_terms_user_stats')
                    .update({
                        games_played: gameCount,
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_id', user.id);

                if (error) {
                    console.error('Error updating game count in Supabase:', error);
                    return { success: false, error: error.message, local: false };
                }
            } catch (innerError) {
                console.error('Error in updateGameCount when trying to update Supabase:', innerError);
                return { success: false, error: innerError.message, local: false };
            }

            console.log('Game count updated in Supabase:', gameCount);
            return { success: true, local: false };
        } catch (error) {
            console.error('Exception updating game count in Supabase:', error);
            return { success: false, error: error.message, local: false };
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
