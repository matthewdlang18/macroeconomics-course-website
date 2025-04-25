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
            // Generate a UUID v4
            generateUUID: function() {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    const r = Math.random() * 16 | 0;
                    const v = c === 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            },

            // Save score to Supabase and localStorage
            saveScore: async function(userId, userName, finalValue, isClassGame = false, sectionId = null, gameId = null) {
                try {
                    console.log('Saving score:', { userId, userName, finalValue, isClassGame, sectionId, gameId });

                    // Generate a proper UUID for the score
                    const scoreId = this.generateUUID();

                    // Create score object
                    const scoreData = {
                        id: scoreId,
                        user_id: userId || `guest_${this.generateUUID()}`,
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

                    // Ensure the score has a valid UUID
                    if (!scoreData.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                        console.log(`Converting score ID ${scoreData.id} to UUID before saving to localStorage`);
                        scoreData.id = this.generateUUID();
                    }

                    // Add new score
                    existingScores.push(scoreData);

                    // Sort by score (descending)
                    existingScores.sort((a, b) => b.final_value - a.final_value);

                    // Save back to localStorage
                    localStorage.setItem(storageKey, JSON.stringify(existingScores));

                    console.log('Score saved to localStorage with ID:', scoreData.id);
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
                        try {
                            // Convert the score ID to a proper UUID if it's not already
                            if (!score.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                                console.log(`Converting score ID ${score.id} to UUID`);
                                score.id = this.generateUUID();
                            }

                            // Convert user_id to UUID if it's a guest ID with an invalid format
                            if (score.user_id && score.user_id.startsWith('guest_') &&
                                !score.user_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                                console.log(`Converting user ID ${score.user_id} to UUID`);
                                score.user_id = `guest_${this.generateUUID()}`;
                            }

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

                                // Update the score in localStorage with the new ID
                                this.updateLocalScore(score);
                            }
                        } catch (scoreError) {
                            console.error(`Error processing score:`, scoreError);
                            results.push({ id: score.id || 'unknown', success: false, error: scoreError.message });
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
            },

            // Update a score in localStorage
            updateLocalScore: function(updatedScore) {
                try {
                    const storageKey = 'investment-odyssey-scores';
                    const scores = JSON.parse(localStorage.getItem(storageKey) || '[]');

                    // Find the score by ID and update it
                    const index = scores.findIndex(score => score.id === updatedScore.id);
                    if (index !== -1) {
                        scores[index] = updatedScore;
                        localStorage.setItem(storageKey, JSON.stringify(scores));
                        console.log(`Updated score ${updatedScore.id} in localStorage`);
                    }

                    return true;
                } catch (error) {
                    console.error('Error updating score in localStorage:', error);
                    return false;
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
