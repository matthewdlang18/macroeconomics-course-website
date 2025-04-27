/**
 * TA Authentication for Investment Odyssey Class Game
 * This file provides TA-specific authentication functionality for the class game
 */

// Initialize the TAAuth object
const TAAuth = {
    // Initialize the authentication system
    init: function() {
        console.log('Initializing TA Auth system for Investment Odyssey Class Game...');

        // Check if Supabase is available
        if (typeof window.supabase !== 'undefined' && typeof window.supabase.from === 'function') {
            console.log('Supabase client already initialized for TA Auth');
            return this;
        } else {
            console.error('Supabase client not available. TA Authentication will not work.');
            return this;
        }
    },

    // Check if user is logged in as a TA
    isTALoggedIn: function() {
        const taId = localStorage.getItem('ta_id');
        const taName = localStorage.getItem('ta_name');
        const isTA = localStorage.getItem('is_ta') === 'true';
        return !!(taId && taName && isTA);
    },

    // Get current TA info
    getCurrentTA: function() {
        if (this.isTALoggedIn()) {
            return {
                id: localStorage.getItem('ta_id'),
                name: localStorage.getItem('ta_name')
            };
        }
        return null;
    },

    // Get TA's sections
    getTASections: async function() {
        try {
            const ta = this.getCurrentTA();
            if (!ta) {
                return { success: false, error: "Not logged in as a TA" };
            }

            const { data, error } = await window.supabase
                .from('sections')
                .select(`
                    id,
                    day,
                    time,
                    location,
                    ta_id
                `)
                .eq('ta_id', ta.id)
                .order('day')
                .order('time');

            if (error) {
                console.error('Error getting TA sections:', error);
                return { success: false, error: error.message || 'Error getting sections' };
            }

            return { success: true, data };
        } catch (error) {
            console.error('Error getting TA sections:', error);
            return { success: false, error: error.message || 'Error getting sections' };
        }
    },

    // Create a new game session for a section
    createGameSession: async function(sectionId) {
        try {
            if (!sectionId) {
                return { success: false, error: 'Section ID is required' };
            }

            const ta = this.getCurrentTA();
            if (!ta) {
                return { success: false, error: "Not logged in as a TA" };
            }

            // Check if there's already an active game for this section
            const { data: existingGames, error: checkError } = await window.supabase
                .from('game_sessions')
                .select('*')
                .eq('section_id', sectionId)
                .eq('status', 'active');

            if (checkError) {
                console.error('Error checking existing games:', checkError);
                return { success: false, error: checkError.message || 'Error checking existing games' };
            }

            if (existingGames && existingGames.length > 0) {
                return { success: true, data: existingGames[0], message: 'Game already exists' };
            }

            // Create a new game session
            const { data, error } = await window.supabase
                .from('game_sessions')
                .insert({
                    section_id: sectionId,
                    current_round: 0,
                    max_rounds: 20,
                    status: 'active',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating game session:', error);
                return { success: false, error: error.message || 'Error creating game session' };
            }

            return { success: true, data };
        } catch (error) {
            console.error('Error creating game session:', error);
            return { success: false, error: error.message || 'Error creating game session' };
        }
    },

    // Get active game session for a section
    getActiveGameSession: async function(sectionId) {
        try {
            if (!sectionId) {
                return { success: false, error: 'Section ID is required' };
            }

            const { data, error } = await window.supabase
                .from('game_sessions')
                .select('*')
                .eq('section_id', sectionId)
                .eq('active', true)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // No data found
                    return { success: false, error: 'No active game session found' };
                }
                console.error('Error getting active game session:', error);
                return { success: false, error: error.message || 'Error getting active game session' };
            }

            return { success: true, data };
        } catch (error) {
            console.error('Error getting active game session:', error);
            return { success: false, error: error.message || 'Error getting active game session' };
        }
    },

    // Advance game session to next round
    advanceGameRound: async function(gameId) {
        try {
            if (!gameId) {
                return { success: false, error: 'Game ID is required' };
            }

            const ta = this.getCurrentTA();
            if (!ta) {
                return { success: false, error: "Not logged in as a TA" };
            }

            // Get current game state
            const { data: gameData, error: gameError } = await window.supabase
                .from('game_sessions')
                .select('*')
                .eq('id', gameId)
                .single();

            if (gameError) {
                console.error('Error getting game session:', gameError);
                return { success: false, error: gameError.message || 'Error getting game session' };
            }

            // Update game session
            const newRound = gameData.current_round + 1;
            const { data, error } = await window.supabase
                .from('game_sessions')
                .update({
                    current_round: newRound,
                    updated_at: new Date().toISOString()
                })
                .eq('id', gameId)
                .select()
                .single();

            if (error) {
                console.error('Error advancing game round:', error);
                return { success: false, error: error.message || 'Error advancing game round' };
            }

            return { success: true, data };
        } catch (error) {
            console.error('Error advancing game round:', error);
            return { success: false, error: error.message || 'Error advancing game round' };
        }
    },

    // End game session
    endGameSession: async function(gameId) {
        try {
            if (!gameId) {
                return { success: false, error: 'Game ID is required' };
            }

            const ta = this.getCurrentTA();
            if (!ta) {
                return { success: false, error: "Not logged in as a TA" };
            }

            // Update game session
            const { data, error } = await window.supabase
                .from('game_sessions')
                .update({
                    active: false,
                    status: 'completed',
                    updated_at: new Date().toISOString()
                })
                .eq('id', gameId)
                .select()
                .single();

            if (error) {
                console.error('Error ending game session:', error);
                return { success: false, error: error.message || 'Error ending game session' };
            }

            return { success: true, data };
        } catch (error) {
            console.error('Error ending game session:', error);
            return { success: false, error: error.message || 'Error ending game session' };
        }
    }
};

// Initialize TAAuth when the script loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Auth system
    TAAuth.init();

    // Make TAAuth available globally
    window.TAAuth = TAAuth;

    console.log('TA Auth system initialized and ready for Investment Odyssey Class Game');
});
