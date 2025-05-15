/**
 * Supabase Integration for Economics Terms Game
 * This file provides functionality to connect the Economics Terms game with Supabase
 */

// Initialize the SupabaseEconTerms object
const SupabaseEconTerms = {
    // Initialize the Supabase connection
    init: function() {
        console.log('Initializing Supabase integration for Economics Terms game...');

        // Check if Supabase is available
        if (typeof window.supabase !== 'undefined' && typeof window.supabase.from === 'function') {
            console.log('Supabase client already initialized');
            return this;
        } else {
            console.error('Supabase client not available. Game data will be stored locally only.');
            return this;
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

            // Prepare data for saving
            const scoreData = {
                user_id: user.id,
                game_id: 'econ_terms',
                score: score,
                term: gameData.term,
                attempts: gameData.attempts.length,
                won: gameData.won,
                time_taken: gameData.timeTaken,
                created_at: new Date().toISOString()
            };

            // Save to Supabase leaderboard table
            const { data, error } = await window.supabase
                .from('leaderboard')
                .insert(scoreData);

            if (error) {
                console.error('Error saving score to Supabase:', error);
                // Fallback to local storage
                this.saveScoreLocally(score, gameData);
                return { success: false, error: error.message, local: true };
            }

            console.log('Score saved to Supabase successfully:', data);
            return { success: true, data };
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

            // Get high scores from Supabase
            const { data, error } = await window.supabase
                .from('leaderboard')
                .select(`
                    id,
                    score,
                    created_at,
                    profiles(name)
                `)
                .eq('game_id', 'econ_terms')
                .order('score', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('Error getting high scores from Supabase:', error);
                return this.getHighScoresLocally();
            }

            // Format the data
            const highScores = data.map(item => ({
                id: item.id,
                name: item.profiles?.name || 'Unknown',
                score: item.score,
                date: new Date(item.created_at).toLocaleDateString()
            }));

            return highScores;
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
