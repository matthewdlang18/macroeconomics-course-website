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
      console.log(`Checking if table ${tableName} exists and is accessible...`);
      
      // Try a dummy query to test table access
      const { count, error } = await supabaseClient
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .limit(0);
      
      if (error) {
        // Special handling for RLS policy errors (code 42501)
        if (error.code === '42501' || error.message.includes('policy')) {
          console.warn(`Table ${tableName} exists but blocked by RLS policy - this is expected if not authenticated`);
          
          // If this is an RLS error, the table does exist but we might not have access
          // We'll mark it as existing and let individual operations handle auth
          return true;
        }
        
        console.warn(`Table ${tableName} error:`, error);
        return false;
      }
      
      console.log(`Table ${tableName} exists and is accessible`);
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
      return this._saveScoreToLocalStorage({
        user_id: 'local-' + Date.now(),
        user_name: 'Offline Player',
        score: scoreData.score || 0,
        term: scoreData.term || '',
        attempts: scoreData.attempts || 0,
        won: scoreData.won || false,
        time_taken: scoreData.timeTaken || 0
      }, scoreData, 'Supabase client not available');
    }

    // Step 1: Get current auth session directly from Supabase
    let authUserId = null;
    let userName = 'Unknown Player';
    
    try {
      console.log('Getting auth session for saveScore...');
      const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
      
      if (sessionError) {
        console.error('Error getting auth session for saveScore:', sessionError);
        return this._saveScoreToLocalStorage({
          user_id: 'local-' + Date.now(),
          user_name: 'Unknown Player',
          score: scoreData.score || 0,
          term: scoreData.term || '',
          attempts: scoreData.attempts || 0,
          won: scoreData.won || false,
          time_taken: scoreData.timeTaken || 0
        }, scoreData, 'Session error: ' + sessionError.message);
      } else if (sessionData?.session?.user?.id) {
        authUserId = sessionData.session.user.id;
        console.log('Found authenticated user ID:', authUserId);
      } else {
        console.warn('No authenticated session found');
        return this._saveScoreToLocalStorage({
          user_id: 'local-' + Date.now(),
          user_name: 'Unknown Player',
          score: scoreData.score || 0,
          term: scoreData.term || '',
          attempts: scoreData.attempts || 0,
          won: scoreData.won || false,
          time_taken: scoreData.timeTaken || 0
        }, scoreData, 'No active session found');
      }
      
      // Try to get the user's name from profiles table
      try {
        const { data: profileData, error: profileError } = await supabaseClient
          .from('profiles')
          .select('full_name')
          .eq('id', authUserId)
          .single();
          
        if (!profileError && profileData?.full_name) {
          userName = profileData.full_name;
          console.log('Found user name from profile:', userName);
        } else {
          // Fallback to email or default name
          userName = sessionData.session.user.email || 'Player';
          console.log('Using fallback user name:', userName);
        }
      } catch (profileError) {
        console.warn('Error getting user profile:', profileError);
        // Fallback to email or default name
        userName = sessionData.session.user.email || 'Player';
      }
    } catch (authError) {
      console.error('Exception getting auth session:', authError);
      return this._saveScoreToLocalStorage({
        user_id: 'local-' + Date.now(),
        user_name: 'Unknown Player',
        score: scoreData.score || 0,
        term: scoreData.term || '',
        attempts: scoreData.attempts || 0,
        won: scoreData.won || false,
        time_taken: scoreData.timeTaken || 0
      }, scoreData, 'Auth exception: ' + authError.message);
    }
    
    // Step 2: Check against EconWordsAuth for consistency
    const currentUser = window.EconWordsAuth?.getCurrentUser();
    if (!currentUser) {
      console.error('User information not available from EconWordsAuth');
      if (!authUserId) {
        return this._saveScoreToLocalStorage({
          user_id: 'local-' + Date.now(),
          user_name: 'Unknown Player',
          score: scoreData.score || 0,
          term: scoreData.term || '',
          attempts: scoreData.attempts || 0,
          won: scoreData.won || false,
          time_taken: scoreData.timeTaken || 0
        }, scoreData, 'User information not available');
      }
    } else if (currentUser.isGuest) {
      console.log('User is in guest mode - saving to localStorage only');
      return this._saveScoreToLocalStorage({
        user_id: currentUser.id || ('local-' + Date.now()),
        user_name: currentUser.name || 'Guest User',
        score: scoreData.score || 0,
        term: scoreData.term || '',
        attempts: scoreData.attempts || 0,
        won: scoreData.won || false,
        time_taken: scoreData.timeTaken || 0
      }, scoreData, 'User is in guest mode');
    }
    
    // Final check to ensure we have a valid user ID
    if (!authUserId) {
      console.error('Unable to determine valid user ID for saveScore');
      return this._saveScoreToLocalStorage({
        user_id: 'local-' + Date.now(),
        user_name: 'Unknown Player',
        score: scoreData.score || 0,
        term: scoreData.term || '',
        attempts: scoreData.attempts || 0,
        won: scoreData.won || false,
        time_taken: scoreData.timeTaken || 0
      }, scoreData, 'Unable to determine valid user ID');
    }
    
    // Step 3: If we have an authenticated user, save the score to the leaderboard
    try {
      console.log('Attempting to save score to leaderboard with user ID:', authUserId);
      
      // Create leaderboard entry
      const leaderboardEntry = {
        user_id: authUserId,
        user_name: userName,
        score: scoreData.score || 0,
        term: scoreData.term || '',
        attempts: scoreData.attempts || 0,
        won: scoreData.won || false,
        time_taken: scoreData.timeTaken || 0,
        created_at: new Date().toISOString()
      };
      
      console.log('Saving score to leaderboard:', leaderboardEntry);
      
      const { data, error } = await supabaseClient
        .from(this.tables.leaderboard)
        .insert(leaderboardEntry)
        .select()
        .single();
        
      if (error) {
        console.error('Error saving score to leaderboard:', error);
        
        // Save to localStorage as a fallback
        return this._saveScoreToLocalStorage(leaderboardEntry, scoreData, 'Database error: ' + error.message);
      }
      
      console.log('Score saved to leaderboard successfully:', data);
      
      // Also update user stats
      await this._updateUserStats(authUserId, scoreData);
      
      return { 
        success: true,
        savedToLeaderboard: true,
        score: data
      };
    } catch (error) {
      console.error('Exception saving score:', error);
      
      // Save to localStorage as a fallback
      return this._saveScoreToLocalStorage({
        user_id: authUserId || ('local-' + Date.now()),
        user_name: userName || 'Unknown Player',
        score: scoreData.score || 0,
        term: scoreData.term || '',
        attempts: scoreData.attempts || 0,
        won: scoreData.won || false,
        time_taken: scoreData.timeTaken || 0
      }, scoreData, 'Exception: ' + error.message);
    }
  },

  // Save score to localStorage as a fallback when database save fails
  _saveScoreToLocalStorage: function(leaderboardEntry, originalScore, errorReason) {
    console.log('Saving score to localStorage as fallback');
    
    try {
      // Get existing failed scores
      const failedScores = JSON.parse(localStorage.getItem('econWordsFailedScores') || '[]');
      
      // Add new failed score
      failedScores.push({
        leaderboardEntry: leaderboardEntry,
        originalScore: originalScore,
        errorReason: errorReason,
        timestamp: new Date().toISOString()
      });
      
      // Store back in localStorage (max 50 entries to avoid storage issues)
      localStorage.setItem('econWordsFailedScores', JSON.stringify(
        failedScores.slice(-50)
      ));
      
      // Save to local history as well
      const history = JSON.parse(localStorage.getItem('econWordsHistory') || '[]');
      history.push({
        ...leaderboardEntry,
        localOnly: true,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('econWordsHistory', JSON.stringify(history.slice(-100)));
      
      return {
        success: true,
        savedToLeaderboard: false,
        savedToLocalStorage: true,
        error: errorReason,
        recoveryPending: true,
        score: leaderboardEntry
      };
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return {
        success: false,
        savedToLeaderboard: false,
        savedToLocalStorage: false,
        error: 'Failed to save to database and localStorage: ' + error.message
      };
    }
  },

  // Update user stats when a score is saved
  _updateUserStats: async function(userId, scoreData) {
    try {
      if (!userId) {
        console.error('Cannot update user stats - no user ID provided');
        return { success: false, error: 'No user ID provided' };
      }
      
      console.log('Updating user stats for user:', userId);
      
      // Get current stats
      const { data: existingStats, error: fetchError } = await supabaseClient
        .from(this.tables.userStats)
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 means no rows returned - not an error for us
        console.error('Error fetching user stats:', fetchError);
      }
      
      // Calculate new stats
      const won = scoreData.won || false;
      const newStats = {
        user_id: userId,
        games_played: 1,
        games_won: won ? 1 : 0, 
        total_score: scoreData.score || 0,
        average_score: scoreData.score || 0,
        best_score: scoreData.score || 0,
        unique_terms_played: [scoreData.term || 'unknown'],
        updated_at: new Date().toISOString()
      };
      
      // If existing stats, update them
      if (existingStats) {
        newStats.games_played = existingStats.games_played + 1;
        newStats.games_won = existingStats.games_won + (won ? 1 : 0);
        newStats.total_score = existingStats.total_score + (scoreData.score || 0);
        newStats.average_score = newStats.total_score / newStats.games_played;
        newStats.best_score = Math.max(existingStats.best_score || 0, scoreData.score || 0);
        
        // Update unique terms
        const uniqueTerms = new Set(existingStats.unique_terms_played || []);
        if (scoreData.term) {
          uniqueTerms.add(scoreData.term);
        }
        newStats.unique_terms_played = Array.from(uniqueTerms);
      }
      
      // Insert or update stats
      const { data, error } = await supabaseClient
        .from(this.tables.userStats)
        .upsert(newStats)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating user stats:', error);
        return { success: false, error: error.message };
      }
      
      console.log('User stats updated successfully:', data);
      return { success: true, stats: data };
    } catch (error) {
      console.error('Exception updating user stats:', error);
      return { success: false, error: error.message };
    }
  },

  // Get user stats
  getUserStats: async function() {
    if (!window.supabaseClient) {
      console.error('Supabase client not available for getting user stats');
      return this._getLocalUserStats();
    }
    
    // Check for active session first
    let authUserId = null;
    let isGuest = false;
    
    try {
      const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
      
      if (sessionError || !sessionData?.session?.user?.id) {
        console.log('No valid session found for getUserStats');
        isGuest = true;
      } else {
        authUserId = sessionData.session.user.id;
        console.log('Found existing session for getUserStats with ID:', authUserId);
      }
    } catch (e) {
      console.error('Error checking session status:', e);
      isGuest = true;
    }
    
    // Check EconWordsAuth for user info
    const currentUser = window.EconWordsAuth?.getCurrentUser();
    
    // If authenticated user and IDs match, use that ID
    if (authUserId && currentUser && !currentUser.isGuest && currentUser.id === authUserId) {
      console.log('Using authenticated user ID from matching auth session:', authUserId);
    } 
    // If we have an auth ID but it doesn't match current user, use the auth ID
    else if (authUserId) {
      console.warn('Auth session ID does not match current user - using auth session ID');
    }
    // If guest or no auth, use local stats
    else if (currentUser?.isGuest || isGuest) {
      console.log('Using guest mode for stats');
      return this._getLocalUserStats();
    }
    // No user info available
    else {
      console.error('No user information available for getUserStats');
      return {
        success: false,
        error: 'No user information available'
      };
    }
    
    try {
      console.log('Getting stats for user:', authUserId);
      
      // Get stats from database
      const { data, error } = await supabaseClient
        .from(this.tables.userStats)
        .select('*')
        .eq('user_id', authUserId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No stats found - not an error
          console.log('No stats found for user - returning empty stats');
          return {
            success: true,
            stats: {
              user_id: authUserId,
              games_played: 0,
              games_won: 0,
              total_score: 0,
              average_score: 0,
              best_score: 0,
              unique_terms_played: []
            },
            userName: currentUser?.name || 'Player'
          };
        }
        
        console.error('Error fetching user stats:', error);
        return this._getLocalUserStats();
      }
      
      console.log('User stats retrieved successfully');
      return {
        success: true,
        stats: data,
        userName: currentUser?.name || 'Player'
      };
    } catch (error) {
      console.error('Exception getting user stats:', error);
      return this._getLocalUserStats();
    }
  },
  
  // Get local user stats from localStorage
  _getLocalUserStats: function() {
    console.log('Getting user stats from localStorage');
    
    try {
      const history = JSON.parse(localStorage.getItem('econWordsHistory') || '[]');
      
      if (history.length === 0) {
        console.log('No history found in localStorage');
        return {
          success: true,
          isLocal: true,
          stats: {
            games_played: 0,
            games_won: 0,
            total_score: 0,
            average_score: 0,
            best_score: 0,
            unique_terms_played: []
          }
        };
      }
      
      const currentUser = window.EconWordsAuth?.getCurrentUser();
      const userId = currentUser?.id || 'local-user';
      
      // Calculate stats
      let gamesPlayed = 0;
      let gamesWon = 0;
      let totalScore = 0;
      let bestScore = 0;
      const uniqueTerms = new Set();
      
      // Only use most recent 100 games to avoid localStorage performance issues
      const recentHistory = history.slice(-100);
      
      recentHistory.forEach(game => {
        gamesPlayed++;
        if (game.won) {
          gamesWon++;
        }
        if (game.score) {
          totalScore += game.score;
          bestScore = Math.max(bestScore, game.score);
        }
        if (game.term) {
          uniqueTerms.add(game.term);
        }
      });
      
      const averageScore = gamesPlayed > 0 ? totalScore / gamesPlayed : 0;
      
      console.log('Local stats calculated from', gamesPlayed, 'games');
      
      return {
        success: true,
        isLocal: true,
        stats: {
          user_id: userId,
          games_played: gamesPlayed,
          games_won: gamesWon,
          total_score: totalScore,
          average_score: averageScore,
          best_score: bestScore,
          unique_terms_played: Array.from(uniqueTerms)
        },
        userName: currentUser?.name || 'Guest Player'
      };
    } catch (error) {
      console.error('Error getting local user stats:', error);
      return {
        success: false,
        isLocal: true,
        error: error.message,
        stats: {
          games_played: 0,
          games_won: 0,
          total_score: 0,
          average_score: 0,
          best_score: 0,
          unique_terms_played: []
        }
      };
    }
  },

  // Get leaderboard data
  getLeaderboard: async function(limit = 20, term = null) {
    if (!window.supabaseClient) {
      console.error('Supabase client not available for getting leaderboard');
      return this._getLocalLeaderboard(limit, term);
    }
    
    try {
      console.log(`Getting leaderboard data (limit ${limit}, term ${term || 'all'})`);
      
      // Start query
      let query = supabaseClient
        .from(this.tables.leaderboard)
        .select('*');
      
      // Add term filter if provided
      if (term) {
        query = query.eq('term', term);
      }
      
      // Finish query with sorting and limit
      const { data, error } = await query
        .order('score', { ascending: false })
        .order('time_taken', { ascending: true })
        .limit(limit);
      
      if (error) {
        console.error('Error fetching leaderboard:', error);
        
        // This might be an RLS policy error - try getting local leaderboard
        return this._getLocalLeaderboard(limit, term);
      }
      
      return {
        success: true,
        leaderboard: data || [],
        isLocal: false
      };
    } catch (error) {
      console.error('Exception getting leaderboard:', error);
      return this._getLocalLeaderboard(limit, term);
    }
  },

  // Get leaderboard data from localStorage
  _getLocalLeaderboard: function(limit = 20, term = null) {
    console.log('Getting leaderboard from localStorage');
    
    try {
      const history = JSON.parse(localStorage.getItem('econWordsHistory') || '[]');
      
      if (history.length === 0) {
        console.log('No history found in localStorage');
        return {
          success: true,
          leaderboard: [],
          isLocal: true
        };
      }
      
      // Filter by term if provided
      let filteredHistory = history;
      if (term) {
        filteredHistory = history.filter(game => game.term === term);
      }
      
      // Sort by score (descending) and time (ascending)
      const sortedHistory = filteredHistory.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return (a.time_taken || 0) - (b.time_taken || 0);
      });
      
      // Limit results
      const limitedHistory = sortedHistory.slice(0, limit);
      
      return {
        success: true,
        leaderboard: limitedHistory,
        isLocal: true
      };
    } catch (error) {
      console.error('Error getting local leaderboard:', error);
      return {
        success: false,
        leaderboard: [],
        isLocal: true,
        error: error.message
      };
    }
  },

  // Try to recover failed scores saved in localStorage
  recoverFailedScores: async function() {
    console.log('Attempting to recover failed scores from localStorage');
    
    try {
      // Get failed scores from localStorage
      const failedScores = JSON.parse(localStorage.getItem('econWordsFailedScores') || '[]');
      
      if (failedScores.length === 0) {
        console.log('No failed scores found in localStorage');
        return {
          success: true,
          recovered: 0,
          remainingFailed: 0
        };
      }
      
      console.log(`Found ${failedScores.length} failed scores to recover`);
      
      // Check authentication status
      const authStatus = await this._ensureAuth();
      if (!authStatus.success) {
        console.error('Cannot recover scores - not authenticated');
        return {
          success: false,
          error: 'Not authenticated',
          recovered: 0,
          remainingFailed: failedScores.length
        };
      }
      
      const authUserId = authStatus.session.user.id;
      console.log('Authenticated with user ID:', authUserId);
      
      // Try to recover each score
      const successfullyRecovered = [];
      const stillFailed = [];
      
      for (const failedScore of failedScores) {
        try {
          const leaderboardEntry = { ...failedScore.leaderboardEntry };
          
          // Update the user ID to match the current authenticated user
          leaderboardEntry.user_id = authUserId;
          
          // Try to insert the score
          const { data, error } = await supabaseClient
            .from(this.tables.leaderboard)
            .insert(leaderboardEntry)
            .select()
            .single();
            
          if (error) {
            console.warn(`Failed to recover score for term ${leaderboardEntry.term}:`, error);
            stillFailed.push(failedScore);
          } else {
            console.log(`Successfully recovered score for term ${leaderboardEntry.term}`);
            successfullyRecovered.push(data);
            
            // Also update user stats for this score
            await this._updateUserStats(authUserId, failedScore.originalScore);
          }
        } catch (error) {
          console.error('Exception recovering score:', error);
          stillFailed.push(failedScore);
        }
      }
      
      // Update localStorage with remaining failed scores
      localStorage.setItem('econWordsFailedScores', JSON.stringify(stillFailed));
      
      console.log(`Recovery complete: ${successfullyRecovered.length} recovered, ${stillFailed.length} still failed`);
      
      return {
        success: true,
        recovered: successfullyRecovered.length,
        remainingFailed: stillFailed.length,
        recoveredScores: successfullyRecovered
      };
    } catch (error) {
      console.error('Exception recovering failed scores:', error);
      return {
        success: false,
        error: error.message,
        recovered: 0,
        remainingFailed: -1  // Unknown
      };
    }
  }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  EconWordsDB.init();
});

// Export as global object
window.EconWordsDB = EconWordsDB;

// For testing in the console
console.log('EconWords Database module loaded. Use window.EconWordsDB to access functions.');
