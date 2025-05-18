/**
 * User Stats Manager using localStorage
 */
const UserStats = {
  // Default stats structure
  defaultStats: {
    highScore: 0,
    gamesPlayed: 0,
    streak: 0,
    lastPlayed: null
  },

  // Get user stats from localStorage
  getStats: function() {
    const stats = localStorage.getItem('econWordsStats');
    return stats ? JSON.parse(stats) : {...this.defaultStats};
  },

  // Save user stats to localStorage
  saveStats: function(stats) {
    localStorage.setItem('econWordsStats', JSON.stringify(stats));
  },

  // Update stats with new game result
  updateStats: function(gameResult) {
    const stats = this.getStats();
    
    // Update high score if new score is higher
    if (gameResult.score > stats.highScore) {
      stats.highScore = gameResult.score;
    }

    // Update games played
    stats.gamesPlayed++;

    // Update streak
    if (gameResult.won) {
      stats.streak++;
    } else {
      stats.streak = 0;
    }

    // Update last played timestamp
    stats.lastPlayed = new Date().toISOString();

    // Save updated stats
    this.saveStats(stats);
    return stats;
  },

  // Reset user stats
  resetStats: function() {
    this.saveStats({...this.defaultStats});
  }
};

// Export as global object
window.UserStats = UserStats;
