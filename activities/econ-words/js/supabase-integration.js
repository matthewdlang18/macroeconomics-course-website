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

        // If user is not logged in or is a guest, only save locally
        if (!user || user.isGuest) {
            console.log('User is not logged in or is a guest. Score saved locally only.');
            this.saveScoreLocally(score, gameData);
            return { success: true, local: true };
        }

        try {
            // Check if Supabase is available
            if (typeof window.supabase === 'undefined') {
                console.warn('Supabase not available, saving score locally');
                this.saveScoreLocally(score, gameData);
                return { success: true, local: true };
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
                        user_name: user.name || localStorage.getItem('display_name') || 'Player',
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
                        this.saveScoreLocally(score, gameData);
                        return { success: false, error: regularError.message, local: true };
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
                        user_name: user.name || localStorage.getItem('display_name') || 'Player',
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
                        this.saveScoreLocally(score, gameData);
                        return { success: false, error: regularError.message, local: true };
                    }

                    console.log('Score saved to regular leaderboard table:', regularData);
                    return { success: true, data: regularData };
                }

                console.log('Score saved to Supabase successfully:', data);
                return { success: true, data };
            } catch (innerError) {
                console.error('Inner exception saving score to Supabase:', innerError);
                this.saveScoreLocally(score, gameData);
                return { success: false, error: innerError.message, local: true };
            }
        } catch (error) {
            console.error('Exception saving score to Supabase:', error);
            // Fallback to local storage
            this.saveScoreLocally(score, gameData);
            return { success: false, error: error.message, local: true };
        }
    },

    // Save score locally as fallback
    saveScoreLocally: function(score, gameData) {
        // Save high score to localStorage
        const highScoreKey = 'econWords_highScore_econ';
        const currentHighScore = parseInt(localStorage.getItem(highScoreKey) || '0', 10);

        if (score > currentHighScore) {
            localStorage.setItem(highScoreKey, score.toString());
        }

        // Save game history
        const historyKey = 'econWords_history';
        const history = JSON.parse(localStorage.getItem(historyKey) || '[]');

        history.push({
            score: score,
            term: gameData.term,
            attempts: gameData.attempts.length,
            won: gameData.won,
            timeTaken: gameData.timeTaken,
            date: new Date().toISOString()
        });

        // Keep only the last 20 games
        if (history.length > 20) {
            history.shift();
        }

        localStorage.setItem(historyKey, JSON.stringify(history));
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

    // Get high scores from localStorage as fallback
    getHighScoresLocally: function() {
        const highScore = parseInt(localStorage.getItem('econWords_highScore_econ') || '0', 10);
        const userName = localStorage.getItem('display_name') || localStorage.getItem('student_name') || 'You';

        return [{
            id: 'local',
            name: userName,
            score: highScore,
            date: new Date().toLocaleDateString()
        }];
    },

    // Get user stats from Supabase
    getUserStats: async function() {
        const user = this.getCurrentUser();

        // If user is not logged in or is a guest, only use localStorage
        if (!user || user.isGuest) {
            console.log('User is not logged in or is a guest. Using localStorage for stats.');
            return {
                streak: parseInt(localStorage.getItem('econWordsStreak') || '0', 10),
                highScore: parseInt(localStorage.getItem('econWords_highScore_econ') || '0', 10),
                gamesPlayed: parseInt(localStorage.getItem('econWordsGameCount') || '0', 10)
            };
        }

        try {
            // Check if Supabase is available
            if (typeof window.supabase === 'undefined') {
                console.warn('Supabase not available, using localStorage for stats');
                return {
                    streak: parseInt(localStorage.getItem('econWordsStreak') || '0', 10),
                    highScore: parseInt(localStorage.getItem('econWords_highScore_econ') || '0', 10),
                    gamesPlayed: parseInt(localStorage.getItem('econWordsGameCount') || '0', 10)
                };
            }

            // First check if the user_stats table exists
            const { error: checkError } = await window.supabase
                .from('econ_terms_user_stats')
                .select('id')
                .limit(1);

            if (checkError) {
                console.warn('econ_terms_user_stats table may not exist:', checkError.message);

                // Create the table if it doesn't exist
                try {
                    await window.supabase.rpc('create_econ_terms_user_stats_table');
                    console.log('Created econ_terms_user_stats table');
                } catch (e) {
                    console.warn('Could not create econ_terms_user_stats table:', e);
                    return {
                        streak: parseInt(localStorage.getItem('econWordsStreak') || '0', 10),
                        highScore: parseInt(localStorage.getItem('econWords_highScore_econ') || '0', 10),
                        gamesPlayed: parseInt(localStorage.getItem('econWordsGameCount') || '0', 10)
                    };
                }
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
                        streak: parseInt(localStorage.getItem('econWordsStreak') || '0', 10),
                        high_score: parseInt(localStorage.getItem('econWords_highScore_econ') || '0', 10),
                        games_played: parseInt(localStorage.getItem('econWordsGameCount') || '0', 10),
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
                        return {
                            streak: parseInt(localStorage.getItem('econWordsStreak') || '0', 10),
                            highScore: parseInt(localStorage.getItem('econWords_highScore_econ') || '0', 10),
                            gamesPlayed: parseInt(localStorage.getItem('econWordsGameCount') || '0', 10)
                        };
                    }

                    return {
                        streak: newData.streak,
                        highScore: newData.high_score,
                        gamesPlayed: newData.games_played
                    };
                }

                return {
                    streak: parseInt(localStorage.getItem('econWordsStreak') || '0', 10),
                    highScore: parseInt(localStorage.getItem('econWords_highScore_econ') || '0', 10),
                    gamesPlayed: parseInt(localStorage.getItem('econWordsGameCount') || '0', 10)
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
                streak: parseInt(localStorage.getItem('econWordsStreak') || '0', 10),
                highScore: parseInt(localStorage.getItem('econWords_highScore_econ') || '0', 10),
                gamesPlayed: parseInt(localStorage.getItem('econWordsGameCount') || '0', 10)
            };
        }
    },

    // Update user streak in Supabase
    updateUserStreak: async function(streak) {
        const user = this.getCurrentUser();

        // If user is not logged in or is a guest, only update localStorage
        if (!user || user.isGuest) {
            console.log('User is not logged in or is a guest. Streak saved locally only.');
            localStorage.setItem('econWordsStreak', streak.toString());
            return { success: true, local: true };
        }

        try {
            // Check if Supabase is available
            if (typeof window.supabase === 'undefined') {
                console.warn('Supabase not available, saving streak locally');
                localStorage.setItem('econWordsStreak', streak.toString());
                return { success: true, local: true };
            }

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
                localStorage.setItem('econWordsStreak', streak.toString());
                return { success: false, error: error.message, local: true };
            }

            console.log('Streak updated in Supabase:', streak);
            return { success: true };
        } catch (error) {
            console.error('Exception updating streak in Supabase:', error);
            localStorage.setItem('econWordsStreak', streak.toString());
            return { success: false, error: error.message, local: true };
        }
    },

    // Update game count in Supabase
    updateGameCount: async function(gameCount) {
        const user = this.getCurrentUser();

        // If user is not logged in or is a guest, only update localStorage
        if (!user || user.isGuest) {
            console.log('User is not logged in or is a guest. Game count saved locally only.');
            localStorage.setItem('econWordsGameCount', gameCount.toString());
            return { success: true, local: true };
        }

        try {
            // Check if Supabase is available
            if (typeof window.supabase === 'undefined') {
                console.warn('Supabase not available, saving game count locally');
                localStorage.setItem('econWordsGameCount', gameCount.toString());
                return { success: true, local: true };
            }

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
                localStorage.setItem('econWordsGameCount', gameCount.toString());
                return { success: false, error: error.message, local: true };
            }

            console.log('Game count updated in Supabase:', gameCount);
            return { success: true };
        } catch (error) {
            console.error('Exception updating game count in Supabase:', error);
            localStorage.setItem('econWordsGameCount', gameCount.toString());
            return { success: false, error: error.message, local: true };
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
