// User stats management using localStorage
const UserStats = {
    // Storage key
    STORAGE_KEY: 'econWords_stats',

    // Default stats
    defaultStats: {
        gamesPlayed: 0,
        bestScore: 0,
        currentStreak: 0
    },

    // Get stats from localStorage
    getStats() {
        const savedStats = localStorage.getItem(this.STORAGE_KEY);
        return savedStats ? JSON.parse(savedStats) : { ...this.defaultStats };
    },

    // Save stats to localStorage
    saveStats(stats) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stats));
    },

    // Update stats after a game
    updateStats(won, score) {
        const stats = this.getStats();
        
        stats.gamesPlayed++;
        
        if (won) {
            stats.currentStreak++;
            if (score > stats.bestScore) {
                stats.bestScore = score;
            }
        } else {
            stats.currentStreak = 0;
        }

        this.saveStats(stats);
        return stats;
    },

    // Reset stats
    resetStats() {
        this.saveStats(this.defaultStats);
        return { ...this.defaultStats };
    }
};

window.UserStats = UserStats;
