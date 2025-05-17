/**
 * Database Module for Econ Words Game
 * Handles interaction with Supabase for leaderboard and user stats
 */

const EconWordsDB = {
  // Table references
  tables: {
    leaderboard: 'econ_terms_leaderboard',
    userStats: 'econ_terms_user_stats'
  },

  // Initialize the database module
  init: async function() {
    console.log('Initializing Econ Words DB module...');
    
    if (!window.supabaseClient) {
      console.error('Supabase client not available for DB operations');
      return false;
    }
    
    // Verify tables exist
    try {
      const leaderboardExists = await this._checkTableExists(this.tables.leaderboard);
      const userStatsExists = await this._checkTableExists(this.tables.userStats);
      
      console.log(`Table status - Leaderboard: ${leaderboardExists ? 'exists' : 'missing'}, User Stats: ${userStatsExists ? 'exists' : 'missing'}`);
      
      return leaderboardExists && userStatsExists;
    } catch (error) {
      console.error('Error checking tables:', error);
      return false;
    }
  },

  // Check if table exists
  _checkTableExists: async function(tableName) {
    try {
      // Only count rows to check if the table exists
      const { count, error } = await supabaseClient
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .limit(0);
      
      if (error) {
        console.warn(`Table ${tableName} error:`, error);
        return false;
      }
      
      return true; // Table exists and is accessible
    } catch (error) {
      console.warn(`Error checking table ${tableName}:`, error);
      return false;
    }
  },

  // Save game score to leaderboard
  saveScore: async function(scoreData) {
    if (!window.supabaseClient) {
      console.error('Supabase client not available for saving score');
      return { success: false, error: 'Database not available' };
    }

    // Get current user
    const currentUser = window.EconWordsAuth?.getCurrentUser();
    if (!currentUser) {
      console.error('User information not available for saving score');
      return { success: false, error: 'User not authenticated' };
    }

    try {
      // Prepare score record
      const scoreRecord = {
        user_id: currentUser.id,
        user_name: currentUser.name || 'Unknown Player',
        score: scoreData.score || 0,
        term: scoreData.term || '',
        attempts: scoreData.attempts || 0,
        won: scoreData.won || false,
        time_taken: scoreData.timeTaken || 0,
        section_id: currentUser.sectionId || null
      };

      // Insert score into leaderboard
      const { data, error } = await supabaseClient
        .from(this.tables.leaderboard)
        .insert(scoreRecord)
        .select()
        .single();

      if (error) {
        console.error('Error saving score:', error);
        return { success: false, error: error.message };
      }

      console.log('Score saved successfully:', data);
      
      // Update user stats
      await this._updateUserStats(scoreData);
      
      return { success: true, data };
    } catch (error) {
      console.error('Error saving score:', error);
      return { success: false, error: error.message };
    }
  },

  // Update user stats based on new score
  _updateUserStats: async function(scoreData) {
    if (!window.supabaseClient) {
      return { success: false, error: 'Database not available' };
    }

    const currentUser = window.EconWordsAuth?.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      // Check if user stats record exists
      const { data: existingStats, error: fetchError } = await supabaseClient
        .from(this.tables.userStats)
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching user stats:', fetchError);
        return { success: false, error: fetchError.message };
      }

      // Calculate new stats
      const newStreak = scoreData.won ? (existingStats?.streak || 0) + 1 : 0;
      const newHighScore = Math.max(scoreData.score || 0, existingStats?.high_score || 0);
      const newGamesPlayed = (existingStats?.games_played || 0) + 1;

      if (existingStats) {
        // Update existing record
        const { error: updateError } = await supabaseClient
          .from(this.tables.userStats)
          .update({
            streak: newStreak,
            high_score: newHighScore,
            games_played: newGamesPlayed,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingStats.id);

        if (updateError) {
          console.error('Error updating user stats:', updateError);
          return { success: false, error: updateError.message };
        }
      } else {
        // Create new record
        const { error: insertError } = await supabaseClient
          .from(this.tables.userStats)
          .insert({
            user_id: currentUser.id,
            streak: newStreak,
            high_score: newHighScore,
            games_played: newGamesPlayed
          });

        if (insertError) {
          console.error('Error creating user stats:', insertError);
          return { success: false, error: insertError.message };
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating user stats:', error);
      return { success: false, error: error.message };
    }
  },

  // Get user stats
  getUserStats: async function() {
    if (!window.supabaseClient) {
      console.error('Supabase client not available for getting user stats');
      return {
        highScore: 0,
        streak: 0,
        gamesPlayed: 0,
        rank: '-'
      };
    }

    const currentUser = window.EconWordsAuth?.getCurrentUser();
    if (!currentUser) {
      return {
        highScore: 0,
        streak: 0,
        gamesPlayed: 0,
        rank: '-'
      };
    }

    try {
      // Get user stats
      const { data: stats, error } = await supabaseClient
        .from(this.tables.userStats)
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (error) {
        console.error('Error getting user stats:', error);
        return {
          highScore: 0,
          streak: 0,
          gamesPlayed: 0,
          rank: '-'
        };
      }

      // Get user rank by getting count of users with higher scores
      const { count, error: rankError } = await supabaseClient
        .from(this.tables.userStats)
        .select('*', { count: 'exact' })
        .gt('high_score', stats?.high_score || 0);

      if (rankError) {
        console.error('Error getting user rank:', rankError);
      }

      // Return formatted stats
      return {
        highScore: stats?.high_score || 0,
        streak: stats?.streak || 0,
        gamesPlayed: stats?.games_played || 0,
        rank: rankError ? '-' : (count + 1).toString()
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        highScore: 0,
        streak: 0,
        gamesPlayed: 0,
        rank: '-'
      };
    }
  },

  // Get leaderboard data
  getLeaderboard: async function(options = {}) {
    if (!window.supabaseClient) {
      console.error('Supabase client not available for getting leaderboard');
      return [];
    }

    const {
      limit = 10,
      timeFilter = 'all', // 'all', 'day', 'week', 'month'
      sectionId = null
    } = options;

    try {
      // Start query builder
      let query = supabaseClient
        .from(this.tables.leaderboard)
        .select('*');

      // Apply time filter
      if (timeFilter !== 'all') {
        const now = new Date();
        let startDate;

        if (timeFilter === 'day') {
          startDate = new Date(now.setDate(now.getDate() - 1));
        } else if (timeFilter === 'week') {
          startDate = new Date(now.setDate(now.getDate() - 7));
        } else if (timeFilter === 'month') {
          startDate = new Date(now.setMonth(now.getMonth() - 1));
        }

        if (startDate) {
          query = query.gte('created_at', startDate.toISOString());
        }
      }

      // Apply section filter
      if (sectionId) {
        query = query.eq('section_id', sectionId);
      }

      // Order and limit
      const { data, error } = await query
        .order('score', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting leaderboard:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  EconWordsDB.init();
});

// Export as global object
window.EconWordsDB = EconWordsDB;
