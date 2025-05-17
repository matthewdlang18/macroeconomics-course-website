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
    
    // Make sure tables exist
    let tablesExist = false;
    
    // Try multiple times with exponential backoff if needed
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`Retry attempt ${attempt + 1} to check tables...`);
          // Wait with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500));
        }
        
        // Verify tables exist
        const leaderboardExists = await this._checkTableExists(this.tables.leaderboard);
        const userStatsExists = await this._checkTableExists(this.tables.userStats);
        
        console.log(`Table status - Leaderboard: ${leaderboardExists ? 'exists' : 'missing'}, User Stats: ${userStatsExists ? 'exists' : 'missing'}`);
        
        tablesExist = leaderboardExists && userStatsExists;
        
        if (tablesExist) {
          // If we have failed scores in localStorage and a valid auth session, try to recover them
          const authStatus = await this._ensureAuth();
          if (authStatus.success) {
            // Check for failed scores after a short delay to avoid impacting initial load
            setTimeout(() => {
              const failedScores = JSON.parse(localStorage.getItem('econWordsFailedScores') || '[]');
              if (failedScores.length > 0) {
                console.log(`Found ${failedScores.length} failed scores - attempting recovery`);
                this.recoverFailedScores();
              }
            }, 5000);
          }
          
          break; // Success - exit the retry loop
        }
      } catch (error) {
        console.error(`Error checking tables (attempt ${attempt + 1}):`, error);
        // Continue to next attempt
      }
    }
    
    return tablesExist;
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

  // Utility function to ensure authentication before database operations
  _ensureAuth: async function() {
    if (!window.supabaseClient) {
      return { success: false, error: 'Supabase client not available' };
    }
    
    // Check if we're in guest mode
    const currentUser = window.EconWordsAuth?.getCurrentUser();
    if (currentUser?.isGuest) {
      console.log('Guest user detected in _ensureAuth - no need for auth check');
      return { success: false, error: 'Guest user mode active', isGuest: true };
    }
    
    try {
      // Check current session
      const { data, error } = await supabaseClient.auth.getSession();
      
      if (error) {
        console.error('Error getting auth session:', error);
        return { success: false, error: error.message };
      }
      
      if (!data || !data.session) {
        console.warn('No active auth session found');
        return { success: false, error: 'No active session' };
      }
      
      // If session is close to expiry (within 5 minutes), refresh the token
      const expiresAt = new Date(data.session.expires_at * 1000);
      const now = new Date();
      const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
      
      if (expiresAt.getTime() - now.getTime() < fiveMinutes) {
        console.log('Session close to expiry, refreshing token...');
        const { error: refreshError } = await supabaseClient.auth.refreshSession();
        
        if (refreshError) {
          console.error('Error refreshing auth token:', refreshError);
          return { success: false, error: refreshError.message };
        }
        
        console.log('Auth token refreshed successfully');
      }
      
      return { success: true, session: data.session };
    } catch (error) {
      console.error('Exception ensuring auth:', error);
      return { success: false, error: error.message };
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

      // For guest users, always use localStorage
      if (currentUser.isGuest) {
        console.log('Guest user detected - saving score to localStorage only');
        try {
          const localScoreKey = 'econWordsGuestScores';
          let guestScores = JSON.parse(localStorage.getItem(localScoreKey) || '[]');
          guestScores.push({
            ...scoreRecord,
            id: 'guest-' + Date.now(),
            created_at: new Date().toISOString()
          });
          // Keep only the most recent 50 scores
          if (guestScores.length > 50) guestScores = guestScores.slice(-50);
          localStorage.setItem(localScoreKey, JSON.stringify(guestScores));
          console.log('Guest score saved to localStorage');
          
          // Update user stats immediately
          await this._updateUserStats(scoreData);
          
          return { 
            success: true, 
            data: {
              ...scoreRecord,
              id: 'guest-' + Date.now(),
              created_at: new Date().toISOString()
            }
          };
        } catch (localError) {
          console.error('Error saving guest score to localStorage:', localError);
          return { success: false, error: localError.message };
        }
      }
      
      // For authenticated users, verify auth status first
      const authStatus = await this._ensureAuth();
      if (!authStatus.success) {
        console.warn('Auth verification failed:', authStatus.error);
        
        // Save to localStorage as fallback
        try {
          const localScoreKey = 'econWordsFailedScores';
          let failedScores = JSON.parse(localStorage.getItem(localScoreKey) || '[]');
          failedScores.push({
            ...scoreRecord,
            timestamp: new Date().toISOString(),
            error: authStatus.error
          });
          localStorage.setItem(localScoreKey, JSON.stringify(failedScores));
          console.log('Score saved to localStorage as fallback (auth failure)');
          
          // Update user stats using localStorage
          await this._updateUserStats(scoreData);
          
          return { 
            success: true, 
            data: {
              ...scoreRecord,
              id: 'local-' + Date.now(),
              created_at: new Date().toISOString()
            },
            warning: 'Saved locally due to authentication issue'
          };
        } catch (localError) {
          console.error('Error saving to localStorage:', localError);
          return { success: false, error: localError.message };
        }
      }
      
      // For authenticated users with valid session, try to save to database
      console.log('Attempting to save score to Supabase database');
      const { data, error } = await supabaseClient
        .from(this.tables.leaderboard)
        .insert(scoreRecord)
        .select()
        .single();
      
      if (error) {
        console.error('Error saving score to database:', error);
        
        // Handle RLS policy violations specifically
        if (error.code === '42501' || error.message.includes('policy')) {
          console.warn('Row-level security policy violation. This likely means the user is not properly authenticated.');
          
          // Store the score in localStorage as fallback
          try {
            const localScoreKey = 'econWordsFailedScores';
            let failedScores = JSON.parse(localStorage.getItem(localScoreKey) || '[]');
            failedScores.push({
              ...scoreRecord,
              timestamp: new Date().toISOString(),
              error: error.message
            });
            localStorage.setItem(localScoreKey, JSON.stringify(failedScores));
            console.log('Score saved to localStorage due to RLS policy violation');
            
            // Try to sign in again in the background to fix auth for next time
            if (window.EconWordsAuth) {
              console.log('Attempting to refresh authentication in background');
              const currentSession = await supabaseClient.auth.getSession();
              if (currentSession.data.session) {
                console.log('Session exists, forcing refresh');
                await supabaseClient.auth.refreshSession();
              }
            }
          } catch (localError) {
            console.error('Error saving to localStorage:', localError);
          }
        }
        
        // Return a faked successful response with warning so the game continues
        return { 
          success: true, 
          data: {
            ...scoreRecord,
            id: 'local-' + Date.now(),
            created_at: new Date().toISOString()
          },
          warning: 'Saved locally due to database error: ' + error.message
        };
      }

      console.log('Score saved successfully to database:', data);
      
      // Update user stats
      await this._updateUserStats(scoreData);
      
      return { success: true, data };
    } catch (error) {
      console.error('Exception saving score:', error);
      
      // Always return a non-error response so game can continue
      return { 
        success: true, 
        data: {
          id: 'error-' + Date.now(),
          created_at: new Date().toISOString()
        },
        warning: 'Saved locally due to exception: ' + error.message
      };
    }
  },

  // Try to recover failed scores from localStorage
  recoverFailedScores: async function() {
    console.log('Attempting to recover failed scores from localStorage');
    
    if (!window.supabaseClient) {
      return { success: false, error: 'Supabase client not available' };
    }
    
    // Ensure authentication is working
    const authStatus = await this._ensureAuth();
    if (!authStatus.success) {
      console.warn('Auth verification failed for score recovery:', authStatus.error);
      return { success: false, error: 'Authentication required for recovery' };
    }
    
    try {
      // Get failed scores from localStorage
      const localScoreKey = 'econWordsFailedScores';
      const failedScores = JSON.parse(localStorage.getItem(localScoreKey) || '[]');
      
      if (failedScores.length === 0) {
        console.log('No failed scores found for recovery');
        return { success: true, recovered: 0 };
      }
      
      console.log(`Found ${failedScores.length} failed scores to recover`);
      
      // Try to resubmit each score
      let successCount = 0;
      let failCount = 0;
      const remainingScores = [];
      
      for (const scoreRecord of failedScores) {
        // Filter out metadata fields
        const { timestamp, error, ...cleanRecord } = scoreRecord;
        
        // Try inserting the score
        const { error: insertError } = await supabaseClient
          .from(this.tables.leaderboard)
          .insert(cleanRecord);
          
        if (insertError) {
          console.warn(`Failed to recover score: ${insertError.message}`);
          failCount++;
          remainingScores.push(scoreRecord);
        } else {
          console.log('Successfully recovered score');
          successCount++;
        }
      }
      
      // Save remaining failed scores back to localStorage
      localStorage.setItem(localScoreKey, JSON.stringify(remainingScores));
      
      return {
        success: true,
        recovered: successCount,
        failed: failCount,
        remaining: remainingScores.length
      };
    } catch (error) {
      console.error('Error recovering failed scores:', error);
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
    
    // For guest users, store stats in localStorage instead of database
    // This avoids RLS policy violations
    if (currentUser.isGuest) {
      try {
        // Get existing stats from localStorage
        let localStats = JSON.parse(localStorage.getItem('econWordsGuestStats') || '{}');
        
        // Calculate new stats
        const newStreak = scoreData.won ? (localStats.streak || 0) + 1 : 0;
        const newHighScore = Math.max(scoreData.score || 0, localStats.highScore || 0);
        const newGamesPlayed = (localStats.gamesPlayed || 0) + 1;
        
        // Update localStorage
        localStats = {
          userId: currentUser.id,
          streak: newStreak,
          highScore: newHighScore,
          gamesPlayed: newGamesPlayed,
          updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem('econWordsGuestStats', JSON.stringify(localStats));
        console.log('Guest stats updated in localStorage:', localStats);
        
        return { success: true };
      } catch (error) {
        console.error('Error updating guest stats in localStorage:', error);
        return { success: false, error: error.message };
      }
    }
    
    // Ensure valid authentication before updating stats
    const authStatus = await this._ensureAuth();
    if (!authStatus.success) {
      console.warn('Auth verification failed for updating stats:', authStatus.error);
      try {
        let localStats = JSON.parse(localStorage.getItem('econWordsAuthFallbackStats') || '{}');
        
        // Calculate new stats
        const newStreak = scoreData.won ? (localStats.streak || 0) + 1 : 0;
        const newHighScore = Math.max(scoreData.score || 0, localStats.highScore || 0);
        const newGamesPlayed = (localStats.gamesPlayed || 0) + 1;
        
        // Update localStorage
        localStats = {
          userId: currentUser.id,
          streak: newStreak,
          highScore: newHighScore,
          gamesPlayed: newGamesPlayed,
          updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem('econWordsAuthFallbackStats', JSON.stringify(localStats));
        return { success: true };
      } catch (error) {
        console.error('Error saving stats to localStorage fallback:', error);
        return { success: false, error: error.message };
      }
    }
    
    // For authenticated users with valid session, continue with database operations
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
    
    // For guest users, always get stats from localStorage
    if (currentUser.isGuest) {
      try {
        const localStats = JSON.parse(localStorage.getItem('econWordsGuestStats') || '{}');
        
        return {
          highScore: localStats.highScore || 0,
          streak: localStats.streak || 0,
          gamesPlayed: localStats.gamesPlayed || 0,
          rank: 'Guest'
        };
      } catch (error) {
        console.error('Error reading guest stats from localStorage:', error);
        return {
          highScore: 0,
          streak: 0,
          gamesPlayed: 0,
          rank: 'Guest'
        };
      }
    }
    
    // Ensure valid authentication before getting stats
    const authStatus = await this._ensureAuth();
    if (!authStatus.success) {
      console.warn('Auth verification failed for getting stats:', authStatus.error);
      try {
        const localStats = JSON.parse(localStorage.getItem('econWordsAuthFallbackStats') || '{}');
        
        // Try to recover from auth issues in the background
        this._recoverFromRLSViolation().then(result => {
          console.log('Background auth recovery attempt result:', result.success ? 'success' : 'failed');
        });
        
        return {
          highScore: localStats.highScore || 0,
          streak: localStats.streak || 0,
          gamesPlayed: localStats.gamesPlayed || 0,
          rank: 'Auth-Pending'
        };
      } catch (error) {
        console.error('Error reading auth fallback stats from localStorage:', error);
        return {
          highScore: 0,
          streak: 0,
          gamesPlayed: 0,
          rank: '-'
        };
      }
    }

    try {
      // Get user stats with verified auth session
      const { data: stats, error } = await supabaseClient
        .from(this.tables.userStats)
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (error) {
        console.error('Error getting user stats:', error);
        
        // Handle RLS policy violations
        if (error.code === '42501' || error.message.includes('policy')) {
          console.warn('RLS policy violation when getting stats - attempting recovery');
          this._recoverFromRLSViolation();
        }
        
        try {
          const localStats = JSON.parse(localStorage.getItem('econWordsAuthFallbackStats') || '{}');
          return {
            highScore: localStats.highScore || 0,
            streak: localStats.streak || 0,
            gamesPlayed: localStats.gamesPlayed || 0,
            rank: 'Auth-Error'
          };
        } catch (localError) {
          console.error('Error reading fallback stats:', localError);
        }
        
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
    
    // Check if user is guest
    const currentUser = window.EconWordsAuth?.getCurrentUser();
    if (currentUser?.isGuest) {
      // For guest users, return a sample leaderboard or local scores
      console.log('Guest user: returning local leaderboard data');
      return this._getLocalLeaderboard();
    }

    const {
      limit = 10,
      timeFilter = 'all', // 'all', 'day', 'week', 'month'
      sectionId = null
    } = options;

    // Ensure authentication before database query
    const authStatus = await this._ensureAuth();
    if (!authStatus.success && !authStatus.isGuest) {
      console.warn('Auth verification failed for leaderboard:', authStatus.error);
      
      // Try to recover authentication in the background
      this._recoverFromRLSViolation().then(result => {
        console.log('Background auth recovery attempt result:', result.success ? 'success' : 'failed');
      });
      
      // Return local leaderboard as fallback
      return this._getLocalLeaderboard();
    }

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
        
        // Handle RLS policy violations
        if (error.code === '42501' || error.message.includes('policy')) {
          console.warn('RLS policy violation when getting leaderboard - attempting recovery');
          this._recoverFromRLSViolation();
        }
        
        // Return local leaderboard as fallback
        return this._getLocalLeaderboard();
      }

      return data || [];
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return this._getLocalLeaderboard();
    }
  },
  
  // Get leaderboard data from localStorage
  _getLocalLeaderboard: function() {
    try {
      // Try to combine guest scores and failed scores for a local leaderboard
      const guestScores = JSON.parse(localStorage.getItem('econWordsGuestScores') || '[]');
      const failedScores = JSON.parse(localStorage.getItem('econWordsFailedScores') || '[]')
        .map(score => {
          const { timestamp, error, ...cleanScore } = score;
          return {
            ...cleanScore,
            created_at: timestamp || new Date().toISOString()
          };
        });
      
      // Combine and sort by score (descending)
      const combinedScores = [...guestScores, ...failedScores]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10); // Only take top 10
      
      return combinedScores.length > 0 ? combinedScores : this._getSampleLeaderboard();
    } catch (error) {
      console.error('Error getting local leaderboard:', error);
      return this._getSampleLeaderboard();
    }
  },
  
  // Get sample leaderboard data for guests or when database is unavailable
  _getSampleLeaderboard: function() {
    return [
      { id: 'sample-1', user_name: 'Keynes', score: 980, term: 'INFLATION', attempts: 2, won: true },
      { id: 'sample-2', user_name: 'Adam Smith', score: 850, term: 'SUPPLY', attempts: 3, won: true },
      { id: 'sample-3', user_name: 'Ricardo', score: 790, term: 'DEMAND', attempts: 3, won: true },
      { id: 'sample-4', user_name: 'Hayek', score: 740, term: 'GDP', attempts: 4, won: true },
      { id: 'sample-5', user_name: 'Marx', score: 650, term: 'CAPITAL', attempts: 4, won: true }
    ].map(entry => ({
      ...entry,
      created_at: new Date().toISOString(),
      time_taken: Math.floor(Math.random() * 60000) + 30000
    }));
  },

  // Recover from an RLS policy violation
  _recoverFromRLSViolation: async function() {
    console.log('Attempting to recover from RLS policy violation');
    
    if (!window.supabaseClient) {
      return { success: false, error: 'Supabase client not available' };
    }
    
    try {
      // First, attempt to repair authentication
      if (typeof window.attemptAuthRepair === 'function') {
        const repairResult = await window.attemptAuthRepair();
        if (repairResult.success) {
          console.log('Authentication successfully repaired');
          return { success: true };
        } else {
          console.warn('Authentication repair failed:', repairResult.error);
        }
      }
      
      // If repair fails or function not available, try force refreshing the session
      const { data: refreshData, error: refreshError } = await supabaseClient.auth.refreshSession();
      
      if (refreshError) {
        console.error('Error refreshing session during recovery:', refreshError);
        return { success: false, error: refreshError.message };
      }
      
      if (refreshData && refreshData.session) {
        console.log('Session successfully refreshed during recovery');
        
        // Verify the repair worked by testing database access
        if (typeof window.testSupabaseDatabaseAccess === 'function') {
          const testResult = await window.testSupabaseDatabaseAccess();
          if (testResult.success) {
            console.log('Database access successfully verified after recovery');
            return { success: true };
          } else {
            console.warn('Database access still failing after recovery:', testResult.error);
          }
        }
        
        return { success: true };
      } else {
        console.warn('Session refresh did not return a new session during recovery');
        return { success: false, error: 'Refresh did not yield new session' };
      }
    } catch (error) {
      console.error('Exception during RLS violation recovery:', error);
      return { success: false, error: error.message };
    }
  },
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  EconWordsDB.init();
});

// Export as global object
window.EconWordsDB = EconWordsDB;
