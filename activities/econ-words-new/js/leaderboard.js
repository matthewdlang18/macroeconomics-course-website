/**
 * Leaderboard Module for Econ Words Game
 * Handles displaying and updating the leaderboard
 */

const EconWordsLeaderboard = {
  // State
  state: {
    scores: [],
    filteredScores: [],
    sortField: 'score',
    sortDirection: 'desc',
    timeFilter: 'all',
    sectionFilter: 'all',
    isStandalonePage: false
  },

  // Initialize the leaderboard
  init: function() {
    console.log('Initializing leaderboard...');
    
    // Check if this is the standalone leaderboard page
    this.state.isStandalonePage = window.location.pathname.includes('leaderboard.html');
    
    // Listen for auth ready event
    window.addEventListener('econwords-auth-ready', async () => {
      // Load leaderboard data
      await this.loadLeaderboard();
      
      // Set up event listeners
      this._setupEventListeners();
    });
  },

  // Load leaderboard data from database
  loadLeaderboard: async function() {
    if (!window.EconWordsDB) {
      console.error('Database module not available for leaderboard');
      return;
    }

    try {
      // Get options from state
      const options = {
        timeFilter: this.state.timeFilter,
        limit: this.state.isStandalonePage ? 50 : 10
      };

      // Add section filter if applicable
      if (this.state.sectionFilter !== 'all') {
        options.sectionId = this.state.sectionFilter;
      }

      // Get leaderboard data
      const scores = await window.EconWordsDB.getLeaderboard(options);
      this.state.scores = scores;
      this.state.filteredScores = [...scores];
      
      // Sort scores
      this._sortScores();
      
      // Update UI
      this._updateLeaderboardUI();
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  },

  // Sort scores based on current sort field and direction
  _sortScores: function() {
    const { sortField, sortDirection } = this.state;
    
    // Map database field names to score object field names
    const fieldMap = {
      'score': 'score',
      'created_at': 'created_at',
      'user_name': 'user_name',
      'attempts': 'attempts'
    };
    
    const field = fieldMap[sortField] || 'score';
    
    this.state.filteredScores.sort((a, b) => {
      let valA = a[field];
      let valB = b[field];
      
      // Handle dates
      if (field === 'created_at') {
        valA = new Date(valA);
        valB = new Date(valB);
      }
      
      // Compare based on sort direction
      if (sortDirection === 'asc') {
        return valA > valB ? 1 : valA < valB ? -1 : 0;
      } else {
        return valA < valB ? 1 : valA > valB ? -1 : 0;
      }
    });
  },

  // Set up event listeners
  _setupEventListeners: function() {
    // Sort buttons
    document.querySelectorAll('.leaderboard-sort').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const field = e.currentTarget.getAttribute('data-sort');
        
        if (field === this.state.sortField) {
          // Toggle direction if same field
          this.state.sortDirection = this.state.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          // Set new field and reset direction
          this.state.sortField = field;
          this.state.sortDirection = 'desc';
        }
        
        this._sortScores();
        this._updateLeaderboardUI();
      });
    });
    
    // Time filter dropdown
    const timeFilter = document.getElementById('time-filter');
    if (timeFilter) {
      timeFilter.addEventListener('change', (e) => {
        this.state.timeFilter = e.target.value;
        this.loadLeaderboard();
      });
    }
    
    // Section filter dropdown (for standalone page)
    if (this.state.isStandalonePage) {
      const sectionFilter = document.getElementById('section-filter');
      if (sectionFilter) {
        sectionFilter.addEventListener('change', (e) => {
          this.state.sectionFilter = e.target.value;
          this.loadLeaderboard();
        });
      }
    }
    
    // Refresh button
    const refreshButton = document.getElementById('refresh-leaderboard');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => {
        this.loadLeaderboard();
      });
    }
  },

  // Update the leaderboard UI
  _updateLeaderboardUI: function() {
    const { filteredScores, sortField, sortDirection } = this.state;
    
    // Update table header indicators
    document.querySelectorAll('.leaderboard-sort').forEach(btn => {
      const field = btn.getAttribute('data-sort');
      const indicator = btn.querySelector('.sort-indicator');
      
      if (indicator) {
        if (field === sortField) {
          indicator.textContent = sortDirection === 'asc' ? '↑' : '↓';
          indicator.style.opacity = '1';
        } else {
          indicator.textContent = '↕';
          indicator.style.opacity = '0.3';
        }
      }
    });
    
    // Update table rows
    const tableBody = document.querySelector('.leaderboard-table tbody');
    if (!tableBody) return;
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    if (filteredScores.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = `
        <td colspan="5" class="text-center">No scores available</td>
      `;
      tableBody.appendChild(emptyRow);
      return;
    }
    
    // Add each score as a row
    filteredScores.forEach((score, index) => {
      const row = document.createElement('tr');
      
      // Highlight current user's scores
      const currentUser = window.EconWordsAuth?.getCurrentUser();
      if (currentUser && score.user_id === currentUser.id) {
        row.classList.add('current-user');
      }
      
      // Format date
      const date = new Date(score.created_at);
      const formattedDate = date.toLocaleDateString() + ' ' + 
                           date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Create row content
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${score.user_name}</td>
        <td class="text-center">${score.score}</td>
        <td class="text-center">${score.attempts}</td>
        <td>${formattedDate}</td>
      `;
      
      tableBody.appendChild(row);
    });
  }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  EconWordsLeaderboard.init();
});

// Export as global object
window.EconWordsLeaderboard = EconWordsLeaderboard;
