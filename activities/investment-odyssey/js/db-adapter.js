/**
 * Database Adapter for Investment Odyssey
 * 
 * This adapter provides a consistent interface for the game to interact with the database,
 * regardless of whether it's using the old or new database structure.
 * 
 * It serves as a bridge between the existing code and the new database structure.
 */

// Service object for database operations
const Service = {
    // TA Authentication
    isTALoggedIn: function() {
        return localStorage.getItem('is_ta') === 'true';
    },

    // Section Management
    getSectionsByTA: async function(taName) {
        try {
            console.log('Getting sections for TA:', taName);
            
            // Query sections table
            const { data, error } = await window.supabase
                .from('sections')
                .select(`
                    id,
                    day,
                    time,
                    location,
                    ta_id,
                    profiles:ta_id (name)
                `)
                .eq('profiles.name', taName);
            
            if (error) {
                console.error('Error getting sections:', error);
                return { success: false, error: error.message };
            }
            
            // Format sections
            const formattedSections = data.map(section => ({
                id: section.id,
                day: section.day,
                fullDay: getDayFullName(section.day),
                time: section.time,
                location: section.location,
                ta: section.profiles?.name || taName
            }));
            
            return { success: true, data: formattedSections };
        } catch (error) {
            console.error('Exception getting sections:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Game Management
    createClassGame: async function(sectionId) {
        try {
            console.log('Creating class game for section:', sectionId);
            
            // Check if there's already an active game for this section
            const { data: existingGames, error: checkError } = await window.supabase
                .from('game_sessions')
                .select('*')
                .eq('section_id', sectionId)
                .eq('active', true);
            
            if (checkError) {
                console.error('Error checking for existing games:', checkError);
                return { success: false, error: checkError.message };
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
                    active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();
            
            if (error) {
                console.error('Error creating game session:', error);
                return { success: false, error: error.message };
            }
            
            return { success: true, data };
        } catch (error) {
            console.error('Exception creating game session:', error);
            return { success: false, error: error.message };
        }
    },
    
    getActiveClassGame: async function(sectionId) {
        try {
            console.log('Getting active class game for section:', sectionId);
            
            const { data, error } = await window.supabase
                .from('game_sessions')
                .select('*')
                .eq('section_id', sectionId)
                .eq('active', true)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            
            if (error) {
                console.error('Error getting active game:', error);
                return { success: false, error: error.message };
            }
            
            return { success: true, data };
        } catch (error) {
            console.error('Exception getting active game:', error);
            return { success: false, error: error.message };
        }
    },
    
    getClassGame: async function(gameId) {
        try {
            console.log('Getting class game:', gameId);
            
            const { data, error } = await window.supabase
                .from('game_sessions')
                .select('*')
                .eq('id', gameId)
                .single();
            
            if (error) {
                console.error('Error getting game:', error);
                return { success: false, error: error.message };
            }
            
            return { success: true, data };
        } catch (error) {
            console.error('Exception getting game:', error);
            return { success: false, error: error.message };
        }
    },
    
    advanceRound: async function(gameId) {
        try {
            console.log('Advancing round for game:', gameId);
            
            // Get current game state
            const { data: game, error: gameError } = await window.supabase
                .from('game_sessions')
                .select('*')
                .eq('id', gameId)
                .single();
            
            if (gameError) {
                console.error('Error getting game:', gameError);
                return { success: false, error: gameError.message };
            }
            
            // Increment round
            const newRound = (game.current_round || 0) + 1;
            
            // Update game session
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
                console.error('Error advancing round:', error);
                return { success: false, error: error.message };
            }
            
            return { success: true, data };
        } catch (error) {
            console.error('Exception advancing round:', error);
            return { success: false, error: error.message };
        }
    },
    
    endGame: async function(gameId) {
        try {
            console.log('Ending game:', gameId);
            
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
                console.error('Error ending game:', error);
                return { success: false, error: error.message };
            }
            
            return { success: true, data };
        } catch (error) {
            console.error('Exception ending game:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Game State Management
    saveGameState: async function(gameId, userId, roundNumber, assetPrices, priceHistory, cpi, cpiHistory) {
        try {
            console.log('Saving game state:', { gameId, userId, roundNumber });
            
            // Check if game state already exists
            const { data: existingState, error: checkError } = await window.supabase
                .from('game_states')
                .select('id')
                .eq('game_id', gameId)
                .eq('user_id', userId)
                .eq('round_number', roundNumber)
                .maybeSingle();
            
            if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" which is expected
                console.error('Error checking for existing game state:', checkError);
                return { success: false, error: checkError.message };
            }
            
            let gameState;
            if (existingState) {
                // Update existing state
                const { data: updatedState, error: updateError } = await window.supabase
                    .from('game_states')
                    .update({
                        asset_prices: assetPrices,
                        price_history: priceHistory,
                        cpi: cpi || 100,
                        cpi_history: cpiHistory || [100],
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existingState.id)
                    .select()
                    .single();
                
                if (updateError) {
                    console.error('Error updating game state:', updateError);
                    return { success: false, error: updateError.message };
                }
                
                gameState = updatedState;
            } else {
                // Create new state
                const { data: newState, error: insertError } = await window.supabase
                    .from('game_states')
                    .insert({
                        game_id: gameId,
                        user_id: userId,
                        round_number: roundNumber,
                        asset_prices: assetPrices,
                        price_history: priceHistory,
                        cpi: cpi || 100,
                        cpi_history: cpiHistory || [100],
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .select()
                    .single();
                
                if (insertError) {
                    console.error('Error creating game state:', insertError);
                    return { success: false, error: insertError.message };
                }
                
                gameState = newState;
            }
            
            return { success: true, data: gameState };
        } catch (error) {
            console.error('Exception saving game state:', error);
            return { success: false, error: error.message };
        }
    },
    
    getGameState: async function(gameId, roundNumber) {
        try {
            console.log('Getting game state:', { gameId, roundNumber });
            
            // Try to get the TA-generated game state first (most authoritative)
            const { data, error } = await window.supabase
                .from('game_states')
                .select('*')
                .eq('game_id', gameId)
                .eq('round_number', roundNumber)
                .eq('user_id', '32bb7f40-5b33-4680-b0ca-76e64c5a23d9')
                .maybeSingle();
            
            if (!error && data) {
                return { success: true, data };
            }
            
            // If no TA-generated state, try to get any game state for this round
            const { data: anyState, error: anyError } = await window.supabase
                .from('game_states')
                .select('*')
                .eq('game_id', gameId)
                .eq('round_number', roundNumber)
                .limit(1)
                .maybeSingle();
            
            if (!anyError && anyState) {
                return { success: true, data: anyState };
            }
            
            // If no game state found, return null (client will need to generate one)
            return { success: true, data: null };
        } catch (error) {
            console.error('Exception getting game state:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Player Management
    joinGame: async function(gameId, userId, userName) {
        try {
            console.log('Joining game:', { gameId, userId, userName });
            
            // Join game
            const { data, error } = await window.supabase
                .from('game_participants')
                .upsert({
                    game_id: gameId,
                    student_id: userId,
                    student_name: userName,
                    portfolio_value: 10000,
                    last_updated: new Date().toISOString(),
                    created_at: new Date().toISOString()
                })
                .select()
                .single();
            
            if (error) {
                console.error('Error joining game:', error);
                return { success: false, error: error.message };
            }
            
            // Initialize player state if it doesn't exist
            const { data: playerState, error: playerStateError } = await window.supabase
                .from('player_states')
                .select('*')
                .eq('game_id', gameId)
                .eq('user_id', userId)
                .maybeSingle();
            
            if (!playerState && !playerStateError) {
                // Create initial player state
                const { error: createError } = await window.supabase
                    .from('player_states')
                    .insert({
                        game_id: gameId,
                        user_id: userId,
                        cash: 10000,
                        portfolio: {},
                        trade_history: [],
                        portfolio_value_history: [{ round: 0, value: 10000 }],
                        total_value: 10000,
                        updated_at: new Date().toISOString()
                    });
                
                if (createError) {
                    console.error('Error creating initial player state:', createError);
                    // Continue anyway - the player can still join the game
                }
            }
            
            return { success: true, data };
        } catch (error) {
            console.error('Exception joining game:', error);
            return { success: false, error: error.message };
        }
    },
    
    savePlayerState: async function(gameId, userId, cash, portfolio, tradeHistory, portfolioValueHistory, totalValue) {
        try {
            console.log('Saving player state:', { gameId, userId });
            
            // Check if player state already exists
            const { data: existingState, error: checkError } = await window.supabase
                .from('player_states')
                .select('id')
                .eq('game_id', gameId)
                .eq('user_id', userId)
                .maybeSingle();
            
            if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" which is expected
                console.error('Error checking for existing player state:', checkError);
                return { success: false, error: checkError.message };
            }
            
            let playerState;
            if (existingState) {
                // Update existing state
                const { data: updatedState, error: updateError } = await window.supabase
                    .from('player_states')
                    .update({
                        cash: cash,
                        portfolio: portfolio,
                        trade_history: tradeHistory || [],
                        portfolio_value_history: portfolioValueHistory || [],
                        total_value: totalValue || cash,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existingState.id)
                    .select()
                    .single();
                
                if (updateError) {
                    console.error('Error updating player state:', updateError);
                    return { success: false, error: updateError.message };
                }
                
                playerState = updatedState;
            } else {
                // Create new state
                const { data: newState, error: insertError } = await window.supabase
                    .from('player_states')
                    .insert({
                        game_id: gameId,
                        user_id: userId,
                        cash: cash,
                        portfolio: portfolio,
                        trade_history: tradeHistory || [],
                        portfolio_value_history: portfolioValueHistory || [],
                        total_value: totalValue || cash,
                        updated_at: new Date().toISOString()
                    })
                    .select()
                    .single();
                
                if (insertError) {
                    console.error('Error creating player state:', insertError);
                    return { success: false, error: insertError.message };
                }
                
                playerState = newState;
            }
            
            // Also update the game_participants table
            try {
                await window.supabase
                    .from('game_participants')
                    .upsert({
                        game_id: gameId,
                        student_id: userId,
                        portfolio_value: totalValue || cash,
                        last_updated: new Date().toISOString()
                    });
            } catch (participantError) {
                console.error('Error updating game participant:', participantError);
                // Continue anyway - the player state is more important
            }
            
            return { success: true, data: playerState };
        } catch (error) {
            console.error('Exception saving player state:', error);
            return { success: false, error: error.message };
        }
    },
    
    getPlayerState: async function(gameId, userId) {
        try {
            console.log('Getting player state:', { gameId, userId });
            
            const { data, error } = await window.supabase
                .from('player_states')
                .select('*')
                .eq('game_id', gameId)
                .eq('user_id', userId)
                .maybeSingle();
            
            if (error) {
                console.error('Error getting player state:', error);
                return { success: false, error: error.message };
            }
            
            return { success: true, data };
        } catch (error) {
            console.error('Exception getting player state:', error);
            return { success: false, error: error.message };
        }
    },
    
    getGameParticipants: async function(gameId) {
        try {
            console.log('Getting game participants:', gameId);
            
            const { data, error } = await window.supabase
                .from('game_participants')
                .select('*')
                .eq('game_id', gameId)
                .order('portfolio_value', { ascending: false });
            
            if (error) {
                console.error('Error getting game participants:', error);
                return { success: false, error: error.message };
            }
            
            return { success: true, data };
        } catch (error) {
            console.error('Exception getting game participants:', error);
            return { success: false, error: error.message };
        }
    }
};

// Helper function to get full day name
function getDayFullName(day) {
    const dayMap = {
        'M': 'Monday',
        'T': 'Tuesday',
        'W': 'Wednesday',
        'R': 'Thursday',
        'F': 'Friday',
        'Monday': 'Monday',
        'Tuesday': 'Tuesday',
        'Wednesday': 'Wednesday',
        'Thursday': 'Thursday',
        'Friday': 'Friday'
    };
    
    return dayMap[day] || day;
}

// Export the Service object
window.Service = Service;
