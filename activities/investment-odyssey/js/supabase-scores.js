/**
 * Supabase Scores Service for Investment Odyssey
 * This file provides functionality to save scores to Supabase
 */

// Initialize the scores service
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Supabase Scores Service...');
    
    // Check if Supabase is available
    if (typeof window.supabase !== 'undefined') {
        console.log('Supabase client available, initializing scores service');
        
        // Create the LocalStorageScores service
        window.LocalStorageScores = {
            // Save score to Supabase and localStorage
            saveScore: async function(userId, userName, finalValue, isClassGame = false, sectionId = null, gameId = null) {
                try {
                    console.log('Saving score:', { userId, userName, finalValue, isClassGame, sectionId, gameId });
                    
                    // Generate a unique ID for the score
                    const scoreId = `score_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    
                    // Create score object
                    const scoreData = {
                        id: scoreId,
                        user_id: userId || `guest_${Date.now()}`,
                        user_name: userName || 'Guest',
                        final_value: finalValue,
                        timestamp: new Date().toISOString(),
                        game_type: 'investment-odyssey',
                        game_mode: isClassGame ? 'class' : 'single'
                    };
                    
                    // Add section_id and game_id if provided (for class games)
                    if (isClassGame && sectionId) {
                        scoreData.section_id = sectionId;
                    }
                    
                    if (isClassGame && gameId) {
                        scoreData.game_id = gameId;
                    }
                    
                    // Save to localStorage first as backup
                    this.saveToLocalStorage(scoreData);
                    
                    // Try to save to Supabase
                    let supabaseResult = { success: false };
                    try {
                        const { data, error } = await window.supabase
                            .from('leaderboard')
                            .insert(scoreData)
                            .select()
                            .single();
                        
                        if (error) {
                            console.error('Error saving score to Supabase:', error);
                            supabaseResult = { success: false, error: error.message };
                        } else {
                            console.log('Score saved to Supabase successfully:', data);
                            supabaseResult = { success: true, data };
                        }
                    } catch (supabaseError) {
                        console.error('Exception saving score to Supabase:', supabaseError);
                        supabaseResult = { success: false, error: supabaseError.message };
                    }
                    
                    return {
                        success: true,
                        scoreId: scoreId,
                        localStorage: { success: true },
                        supabase: supabaseResult
                    };
                } catch (error) {
                    console.error('Error in saveScore:', error);
                    return { success: false, error: error.message };
                }
            },
            
            // Save score to localStorage
            saveToLocalStorage: function(scoreData) {
                try {
                    // Get existing scores from localStorage
                    const storageKey = 'investment-odyssey-scores';
                    const existingScores = JSON.parse(localStorage.getItem(storageKey) || '[]');
                    
                    // Add new score
                    existingScores.push(scoreData);
                    
                    // Sort by score (descending)
                    existingScores.sort((a, b) => b.final_value - a.final_value);
                    
                    // Save back to localStorage
                    localStorage.setItem(storageKey, JSON.stringify(existingScores));
                    
                    console.log('Score saved to localStorage');
                    return true;
                } catch (error) {
                    console.error('Error saving score to localStorage:', error);
                    return false;
                }
            },
            
            // Get scores from localStorage
            getLocalScores: function(gameMode = null) {
                try {
                    const storageKey = 'investment-odyssey-scores';
                    const scores = JSON.parse(localStorage.getItem(storageKey) || '[]');
                    
                    // Filter by game mode if provided
                    if (gameMode) {
                        return scores.filter(score => score.game_mode === gameMode);
                    }
                    
                    return scores;
                } catch (error) {
                    console.error('Error getting scores from localStorage:', error);
                    return [];
                }
            },
            
            // Sync local scores to Supabase
            syncLocalScoresToSupabase: async function() {
                try {
                    const localScores = this.getLocalScores();
                    console.log(`Found ${localScores.length} local scores to sync`);
                    
                    if (localScores.length === 0) {
                        return { success: true, message: 'No local scores to sync' };
                    }
                    
                    const results = [];
                    
                    for (const score of localScores) {
                        // Check if this score has already been synced
                        const { data: existingScore, error: checkError } = await window.supabase
                            .from('leaderboard')
                            .select('id')
                            .eq('id', score.id)
                            .maybeSingle();
                        
                        if (checkError) {
                            console.error('Error checking if score exists:', checkError);
                            results.push({ id: score.id, success: false, error: checkError.message });
                            continue;
                        }
                        
                        if (existingScore) {
                            console.log(`Score ${score.id} already exists in Supabase, skipping`);
                            results.push({ id: score.id, success: true, message: 'Already synced' });
                            continue;
                        }
                        
                        // Score doesn't exist, insert it
                        const { data, error } = await window.supabase
                            .from('leaderboard')
                            .insert(score)
                            .select()
                            .single();
                        
                        if (error) {
                            console.error(`Error syncing score ${score.id}:`, error);
                            results.push({ id: score.id, success: false, error: error.message });
                        } else {
                            console.log(`Score ${score.id} synced successfully`);
                            results.push({ id: score.id, success: true, data });
                        }
                    }
                    
                    return {
                        success: true,
                        results,
                        syncedCount: results.filter(r => r.success).length,
                        failedCount: results.filter(r => !r.success).length
                    };
                } catch (error) {
                    console.error('Error syncing local scores to Supabase:', error);
                    return { success: false, error: error.message };
                }
            }
        };
        
        console.log('Supabase Scores Service initialized');
        
        // Try to sync local scores to Supabase
        setTimeout(async () => {
            try {
                console.log('Attempting to sync local scores to Supabase...');
                const result = await window.LocalStorageScores.syncLocalScoresToSupabase();
                console.log('Sync result:', result);
            } catch (error) {
                console.error('Error during automatic sync:', error);
            }
        }, 5000); // Wait 5 seconds before syncing to ensure Supabase is fully initialized
    } else {
        console.warn('Supabase client not available, scores service will be limited');
    }
});
