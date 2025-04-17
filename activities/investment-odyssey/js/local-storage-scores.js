// Local Storage Scores for Investment Odyssey
// This script provides a reliable way to save and retrieve game scores using localStorage

const LocalStorageScores = {
    // Save a game score to localStorage and attempt to save to Firebase
    saveScore: async function(studentId, studentName, finalPortfolio, isClassGame = false) {
        try {
            console.log('Saving score:', {
                studentId,
                studentName,
                finalPortfolio,
                isClassGame
            });

            // Generate a unique ID for the score
            const scoreId = `score_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Create new score object
            const newScore = {
                id: scoreId,
                studentId: studentId || `guest_${Date.now()}`,
                studentName: studentName || 'Guest',
                gameType: 'investment-odyssey',
                gameMode: isClassGame ? 'class' : 'single',
                finalPortfolio: finalPortfolio,
                timestamp: new Date().toISOString()
            };

            // Always save to localStorage first for reliability
            this.saveScoreToLocalStorage(newScore);

            // Attempt to save to Firebase if available
            let firebaseSaveResult = { success: false, error: 'Firebase not attempted' };

            if (this.isFirebaseAvailable() && studentId && studentName) {
                try {
                    console.log('Attempting to save score to Firebase');

                    // Get student's section and TA
                    let taName = null;

                    try {
                        if (typeof window.Service !== 'undefined' && typeof window.Service.getStudent === 'function') {
                            const studentResult = await window.Service.getStudent(studentId);

                            if (studentResult.success && studentResult.data.sectionId) {
                                const sectionResult = await window.Service.getSection(studentResult.data.sectionId);
                                if (sectionResult.success) {
                                    taName = sectionResult.data.ta;
                                }
                            }
                        }
                    } catch (sectionError) {
                        console.warn('Error getting student section:', sectionError);
                        // Continue without TA name
                    }

                    // Save to Firebase
                    const result = await window.Service.saveGameScore(
                        studentId,
                        studentName,
                        'investment-odyssey',
                        finalPortfolio,
                        taName,
                        isClassGame
                    );

                    if (result.success) {
                        console.log('Score saved successfully to Firebase');
                        firebaseSaveResult = { success: true };

                        // Store the Firebase success in localStorage to help with syncing
                        const syncData = JSON.parse(localStorage.getItem('firebase-sync-data') || '{}');
                        syncData[scoreId] = { synced: true, timestamp: Date.now() };
                        localStorage.setItem('firebase-sync-data', JSON.stringify(syncData));
                    } else {
                        console.warn('Firebase save returned error:', result.error);
                        firebaseSaveResult = { success: false, error: result.error };
                    }
                } catch (firebaseError) {
                    console.error('Error saving to Firebase:', firebaseError);
                    firebaseSaveResult = { success: false, error: firebaseError.message };
                }
            } else {
                console.log('Firebase save not attempted: ' +
                    (!this.isFirebaseAvailable() ? 'Firebase not available' : 'Missing student info'));
            }

            return {
                success: true,
                data: newScore,
                localStorage: { success: true },
                firebase: firebaseSaveResult
            };
        } catch (error) {
            console.error('Error in saveScore:', error);
            return { success: false, error: error.message };
        }
    },

    // Helper method to save a score to localStorage
    saveScoreToLocalStorage: function(scoreObject) {
        try {
            // Get existing scores
            const scores = this.getAllScores();

            // Add to scores array
            scores.push(scoreObject);

            // Sort by score (descending)
            scores.sort((a, b) => b.finalPortfolio - a.finalPortfolio);

            // Save back to localStorage
            localStorage.setItem('investment-odyssey-scores', JSON.stringify(scores));

            console.log('Score saved successfully to localStorage');
            return true;
        } catch (error) {
            console.error('Error saving score to localStorage:', error);
            return false;
        }
    },

    // Check if Firebase is available
    isFirebaseAvailable: function() {
        return (
            typeof window.Service !== 'undefined' &&
            typeof window.Service.saveGameScore === 'function' &&
            typeof firebase !== 'undefined' &&
            firebase.apps.length > 0
        );
    },

    // Get all scores from localStorage
    getAllScores: function() {
        try {
            const scoresJson = localStorage.getItem('investment-odyssey-scores');
            return scoresJson ? JSON.parse(scoresJson) : [];
        } catch (error) {
            console.error('Error getting scores from localStorage:', error);
            return [];
        }
    },

    // Get scores for a specific game mode
    getScoresByMode: function(gameMode = 'single') {
        const scores = this.getAllScores();
        return scores.filter(score => score.gameMode === gameMode);
    },

    // Get scores for a specific student
    getScoresByStudent: function(studentId) {
        const scores = this.getAllScores();
        return scores.filter(score => score.studentId === studentId);
    },

    // Get the highest score for a student in a specific game mode
    getHighestScore: function(studentId, gameMode = 'single') {
        const studentScores = this.getScoresByStudent(studentId)
            .filter(score => score.gameMode === gameMode);

        if (studentScores.length === 0) {
            return null;
        }

        return studentScores.reduce((highest, score) => {
            return score.finalPortfolio > highest.finalPortfolio ? score : highest;
        }, studentScores[0]);
    },

    // Get the top N scores for a specific game mode
    getTopScores: async function(gameMode = 'single', limit = 10) {
        try {
            // Try to get scores from Firebase first
            if (this.isFirebaseAvailable()) {
                try {
                    console.log('Attempting to get scores from Firebase for mode:', gameMode);

                    const options = {
                        gameMode: gameMode,
                        pageSize: limit,
                        page: 1
                    };

                    const result = await window.Service.getGameLeaderboard('investment-odyssey', options);

                    if (result.success && result.data.scores && result.data.scores.length > 0) {
                        console.log('Successfully retrieved scores from Firebase:', result.data.scores.length);

                        // Cache the Firebase scores in localStorage for future use
                        const cacheKey = `firebase-scores-${gameMode}`;
                        localStorage.setItem(cacheKey, JSON.stringify({
                            scores: result.data.scores,
                            timestamp: Date.now()
                        }));

                        return result.data.scores;
                    } else {
                        console.warn('Firebase returned no scores or error:', result);
                        throw new Error('No scores returned from Firebase');
                    }
                } catch (firebaseError) {
                    console.warn('Error getting scores from Firebase:', firebaseError);

                    // Try to use cached Firebase scores if available
                    const cacheKey = `firebase-scores-${gameMode}`;
                    const cachedData = localStorage.getItem(cacheKey);

                    if (cachedData) {
                        try {
                            const parsed = JSON.parse(cachedData);
                            const cacheAge = Date.now() - parsed.timestamp;

                            // Use cache if it's less than 1 hour old
                            if (cacheAge < 3600000) {
                                console.log('Using cached Firebase scores');
                                return parsed.scores;
                            }
                        } catch (cacheError) {
                            console.warn('Error parsing cached scores:', cacheError);
                        }
                    }

                    // Fall back to localStorage scores
                    throw new Error('Firebase scores unavailable');
                }
            }
        } catch (error) {
            console.warn('Using localStorage scores due to error:', error);
        }

        // Fall back to localStorage scores
        console.log('Using localStorage scores for mode:', gameMode);
        const scores = this.getScoresByMode(gameMode);

        // Get unique students (only their highest score)
        const uniqueStudents = {};
        scores.forEach(score => {
            const studentId = score.studentId;
            if (!uniqueStudents[studentId] || score.finalPortfolio > uniqueStudents[studentId].finalPortfolio) {
                uniqueStudents[studentId] = score;
            }
        });

        // Convert to array and sort
        const uniqueScores = Object.values(uniqueStudents);
        uniqueScores.sort((a, b) => b.finalPortfolio - a.finalPortfolio);

        // Return top N scores
        return uniqueScores.slice(0, limit);
    },

    // Get statistics for a specific game mode
    getStatistics: async function(gameMode = 'single') {
        try {
            // Try to get stats from Firebase first
            if (this.isFirebaseAvailable() && typeof window.Service.getGameStats === 'function') {
                try {
                    console.log('Attempting to get game stats from Firebase for mode:', gameMode);

                    const result = await window.Service.getGameStats('investment-odyssey', { gameMode: gameMode });

                    if (result.success && result.data) {
                        console.log('Successfully retrieved stats from Firebase');

                        // Cache the Firebase stats in localStorage for future use
                        const cacheKey = `firebase-stats-${gameMode}`;
                        localStorage.setItem(cacheKey, JSON.stringify({
                            stats: result.data,
                            timestamp: Date.now()
                        }));

                        // Convert to our format
                        return {
                            totalGames: result.data.totalGames || 0,
                            totalPlayers: result.data.totalPlayers || 0,
                            avgScore: result.data.avgPortfolio || 0,
                            highestScore: result.data.topScore || 0
                        };
                    } else {
                        console.warn('Firebase returned no stats or error:', result);
                        throw new Error('No stats returned from Firebase');
                    }
                } catch (firebaseError) {
                    console.warn('Error getting stats from Firebase:', firebaseError);

                    // Try to use cached Firebase stats if available
                    const cacheKey = `firebase-stats-${gameMode}`;
                    const cachedData = localStorage.getItem(cacheKey);

                    if (cachedData) {
                        try {
                            const parsed = JSON.parse(cachedData);
                            const cacheAge = Date.now() - parsed.timestamp;

                            // Use cache if it's less than 1 hour old
                            if (cacheAge < 3600000) {
                                console.log('Using cached Firebase stats');
                                return {
                                    totalGames: parsed.stats.totalGames || 0,
                                    totalPlayers: parsed.stats.totalPlayers || 0,
                                    avgScore: parsed.stats.avgPortfolio || 0,
                                    highestScore: parsed.stats.topScore || 0
                                };
                            }
                        } catch (cacheError) {
                            console.warn('Error parsing cached stats:', cacheError);
                        }
                    }

                    // Fall back to localStorage stats
                    throw new Error('Firebase stats unavailable');
                }
            }
        } catch (error) {
            console.warn('Using localStorage stats due to error:', error);
        }

        // Fall back to calculating stats from localStorage
        console.log('Calculating stats from localStorage for mode:', gameMode);
        const scores = this.getScoresByMode(gameMode);

        if (scores.length === 0) {
            return {
                totalGames: 0,
                totalPlayers: 0,
                avgScore: 0,
                highestScore: 0
            };
        }

        // Get unique players
        const uniquePlayers = new Set(scores.map(score => score.studentId)).size;

        // Calculate average score
        const totalScore = scores.reduce((sum, score) => sum + score.finalPortfolio, 0);
        const avgScore = totalScore / scores.length;

        // Get highest score
        const highestScore = Math.max(...scores.map(score => score.finalPortfolio));

        return {
            totalGames: scores.length,
            totalPlayers: uniquePlayers,
            avgScore: avgScore,
            highestScore: highestScore
        };
    }
};

// Make LocalStorageScores available globally
window.LocalStorageScores = LocalStorageScores;

console.log('LocalStorageScores initialized');
