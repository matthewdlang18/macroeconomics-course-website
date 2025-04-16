// Local Storage Scores for Investment Odyssey
// This script provides a reliable way to save and retrieve game scores using localStorage

const LocalStorageScores = {
    // Save a game score to localStorage
    saveScore: function(studentId, studentName, finalPortfolio, isClassGame = false) {
        try {
            console.log('Saving score to localStorage:', {
                studentId,
                studentName,
                finalPortfolio,
                isClassGame
            });
            
            // Generate a unique ID for the score
            const scoreId = `score_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Get existing scores
            const scores = this.getAllScores();
            
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
            
            // Add to scores array
            scores.push(newScore);
            
            // Sort by score (descending)
            scores.sort((a, b) => b.finalPortfolio - a.finalPortfolio);
            
            // Save back to localStorage
            localStorage.setItem('investment-odyssey-scores', JSON.stringify(scores));
            
            console.log('Score saved successfully to localStorage');
            return { success: true, data: newScore };
        } catch (error) {
            console.error('Error saving score to localStorage:', error);
            return { success: false, error: error.message };
        }
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
    getTopScores: function(gameMode = 'single', limit = 10) {
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
    getStatistics: function(gameMode = 'single') {
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
