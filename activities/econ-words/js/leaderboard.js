/**
 * EconWords Leaderboard Component
 * This file provides functionality to display and manage the leaderboard for the Econ Words game
 */

const EconWordsLeaderboard = {
    // Initialize the leaderboard
    init: function() {
        console.log('Initializing EconWords leaderboard...');
        
        // Check if the game-stats card exists
        const gameStatsCard = document.querySelector('.col-md-4 .card');
        if (!gameStatsCard) {
            console.error('Game stats card not found');
            return;
        }
        
        // Set the card content
        gameStatsCard.innerHTML = `
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0">Econ Words Leaderboard</h5>
            </div>
            <div class="card-body">
                <div class="mb-3">
                    <div class="d-flex justify-content-between mb-2">
                        <span>Your Best Score:</span>
                        <span id="user-best-score">-</span>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                        <span>Games Played:</span>
                        <span id="user-games-played">-</span>
                    </div>
                    <div class="d-flex justify-content-between">
                        <span>Current Streak:</span>
                        <span id="user-streak">-</span>
                    </div>
                </div>
                <h6 class="mt-4 mb-3 border-bottom pb-2">Top Players</h6>
                <div id="leaderboard-loading" class="text-center py-3">
                    <div class="spinner-border spinner-border-sm text-primary" role="status">
                        <span class="sr-only">Loading...</span>
                    </div>
                    <span class="ml-2">Loading leaderboard...</span>
                </div>
                <div id="leaderboard-table-container" style="display: none;">
                    <div class="table-responsive">
                        <table class="table table-sm table-hover">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Player</th>
                                    <th>Score</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody id="leaderboard-table-body">
                                <!-- Leaderboard entries will be inserted here -->
                            </tbody>
                        </table>
                    </div>
                </div>
                <div id="leaderboard-error" class="alert alert-warning" style="display: none;">
                    Unable to load leaderboard data. Please try again later.
                </div>
            </div>
        `;
        
        // Initialize the leaderboard data
        this.loadLeaderboard();
        
        // Set up update interval (refresh leaderboard every 5 minutes)
        setInterval(() => {
            this.loadLeaderboard();
        }, 5 * 60 * 1000);
    },
    
    // Load leaderboard data
    loadLeaderboard: async function() {
        console.log('Loading leaderboard data...');
        
        // Show loading state
        document.getElementById('leaderboard-loading').style.display = 'block';
        document.getElementById('leaderboard-table-container').style.display = 'none';
        document.getElementById('leaderboard-error').style.display = 'none';
        
        try {
            // Get current user stats
            const userStats = await SupabaseEconTerms.getUserStats();
            this.updateUserStats(userStats);
            
            // Get high scores
            const highScores = await SupabaseEconTerms.getHighScores(10);
            this.populateLeaderboard(highScores);
            
            // Hide loading, show table
            document.getElementById('leaderboard-loading').style.display = 'none';
            document.getElementById('leaderboard-table-container').style.display = 'block';
        } catch (error) {
            console.error('Error loading leaderboard data:', error);
            document.getElementById('leaderboard-loading').style.display = 'none';
            document.getElementById('leaderboard-error').style.display = 'block';
        }
    },
    
    // Update the user stats section
    updateUserStats: function(stats) {
        document.getElementById('user-best-score').textContent = stats.highScore || '0';
        document.getElementById('user-games-played').textContent = stats.gamesPlayed || '0';
        document.getElementById('user-streak').textContent = stats.streak || '0';
    },
    
    // Populate the leaderboard table with data
    populateLeaderboard: function(scores) {
        const tableBody = document.getElementById('leaderboard-table-body');
        tableBody.innerHTML = '';
        
        if (scores.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">No scores yet. Be the first!</td>
                </tr>
            `;
            return;
        }
        
        scores.forEach((entry, index) => {
            const row = document.createElement('tr');
            
            // Highlight the current user's scores
            const user = SupabaseEconTerms.getCurrentUser();
            if (user && entry.userId === user.id) {
                row.classList.add('bg-light');
                row.style.fontWeight = '600';
            }
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${this.truncateText(entry.name, 15)}</td>
                <td>${entry.score}</td>
                <td>${entry.date}</td>
            `;
            
            tableBody.appendChild(row);
        });
    },
    
    // Helper function to truncate text if too long
    truncateText: function(text, maxLength) {
        if (!text) return 'Anonymous';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
};
