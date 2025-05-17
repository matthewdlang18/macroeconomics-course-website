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
      return { success: false, error: 'Database not available' };
    }

    // Step 1: Get current auth session directly from Supabase
    let authUserId = null;

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
        return { success: false, error: 'User not authenticated' };
      }
    } else if (authUserId && authUserId !== currentUser.id) {
      console.error('CRITICAL: Auth user ID mismatch detected!');
      console.log('Auth session user ID:', authUserId);
      console.log('EconWordsAuth user ID:', currentUser.id);

      // Update the currentUser ID to match the auth session (this is crucial for RLS)
      console.log('Fixing user ID mismatch by using auth session ID');
      currentUser.id = authUserId;
    }

    try {
      // Step 3: Prepare score record using the auth user ID
      // IMPORTANT: For authenticated users, we MUST use the auth session user ID to comply with RLS
      const scoreRecord = {
        user_id: authUserId,
        user_name: currentUser?.name || 'Unknown Player',
        score: scoreData.score || 0,
        term: scoreData.term || '',
        attempts: scoreData.attempts || 0,
        won: scoreData.won || false,
        time_taken: scoreData.timeTaken || 0,
        section_id: currentUser?.sectionId || null
      };

      // Step 4: Try to insert into database with the authenticated user ID
      console.log('Attempting to save score to database with auth user ID:', authUserId);
      const { data, error } = await supabaseClient
        .from('econ_terms_leaderboard')
        .insert(scoreRecord)
        .select()
        .single();

      if (error) {
        console.error('Error saving score to database:', error);

        // Handle RLS policy violations specifically
        if (error.code === '42501' || error.message.includes('policy')) {
          console.error('Row-level security policy violation. Details:');
          console.log('Auth user ID:', authUserId);
          console.log('Score record:', scoreRecord);

          // Try to fix by refreshing token
          try {
            console.log('Attempting to refresh token after RLS violation...');
            await supabaseClient.auth.refreshSession();

            // Try insert again after token refresh
            console.log('Retrying insert with fresh token...');
            const { data: retryData, error: retryError } = await supabaseClient
              .from('econ_terms_leaderboard')
              .insert(scoreRecord)
              .select()
              .single();

            if (retryError) {
              console.error('Retry failed:', retryError);
              return this._saveScoreToLocalStorage(scoreRecord, scoreData, 'RLS error even after token refresh: ' + retryError.message);
            } else {
              console.log('Retry succeeded after token refresh!', retryData);

              // Update user stats
              await this._updateUserStats(scoreData);

              return { success: true, data: retryData };
            }
          } catch (refreshError) {
            console.error('Error during token refresh:', refreshError);
            return this._saveScoreToLocalStorage(scoreRecord, scoreData, 'RLS policy violation: ' + error.message);
          }
        }

        // For other errors, also use localStorage as fallback
        return this._saveScoreToLocalStorage(scoreRecord, scoreData, 'Database error: ' + error.message);
      }

      console.log('Score saved successfully to database:', data);

      // Update user stats
      await this._updateUserStats(scoreData);

      return { success: true, data };
    } catch (error) {
      console.error('Exception saving score:', error);
      return this._saveScoreToLocalStorage({
        user_id: authUserId || (currentUser?.id || 'unknown'),
        user_name: currentUser?.name || 'Unknown Player',
        score: scoreData.score || 0,
        term: scoreData.term || '',
        attempts: scoreData.attempts || 0,
        won: scoreData.won || false,
        time_taken: scoreData.timeTaken || 0
      }, scoreData, 'Exception: ' + error.message);
    }
  },

  // Helper function to save score to localStorage
  _saveScoreToLocalStorage: async function(scoreRecord, scoreData, errorMessage) {
    try {
      const localScoreKey = 'econWordsFailedScores';
      let failedScores = JSON.parse(localStorage.getItem(localScoreKey) || '[]');
      const newScore = {
        ...scoreRecord,
        timestamp: new Date().toISOString(),
        error: errorMessage
      };

      failedScores.push(newScore);
      localStorage.setItem(localScoreKey, JSON.stringify(failedScores));
      console.log('Score saved to localStorage as fallback');

      // Update user stats
      await this._updateUserStats(scoreData);

      return {
        success: true,
        data: {
          ...scoreRecord,
          id: 'local-' + Date.now(),
          created_at: new Date().toISOString()
        },
        warning: 'Saved locally due to error: ' + errorMessage
      };
    } catch (localError) {
      console.error('Error saving to localStorage:', localError);
      return { success: false, error: 'Failed to save score: ' + errorMessage + ', localStorage error: ' + localError.message };
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
      return { success: false, error: 'Authentication required for recovery - Please sign in first' };
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

    // Step 1: Get current auth session directly from Supabase
    let authUserId = null;
    let isGuest = false;

    try {
      console.log('Checking auth session for updating stats...');
      const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();

      if (sessionError || !sessionData?.session?.user?.id) {
        console.log('No valid auth session for updating stats');
        isGuest = true;
      } else {
        authUserId = sessionData.session.user.id;
        console.log('Found auth session for stats update with ID:', authUserId);
      }
    } catch (e) {
      console.error('Error checking auth session for stats update:', e);
      isGuest = true;
    }

    // Step 2: Check EconWordsAuth
    const currentUser = window.EconWordsAuth?.getCurrentUser();
    if (!currentUser) {
      if (!authUserId) {
        console.error('No user information available for updating stats');
        return { success: false, error: 'User not authenticated' };
      }
    } else {
      // If EconWordsAuth says guest but we have auth, update EconWordsAuth
      if (authUserId && currentUser.isGuest && window.EconWordsAuth?._setupAuthenticatedUser) {
        console.log('Updating EconWordsAuth with new authenticated session');
        try {
          const { data } = await supabaseClient.auth.getUser(authUserId);
          if (data?.user) {
            await window.EconWordsAuth._setupAuthenticatedUser(data.user);
            isGuest = false;
          }
        } catch (e) {
          console.error('Error updating EconWordsAuth during stats update:', e);
        }
      } else {
        isGuest = currentUser.isGuest && !authUserId;

        // Fix mismatch if needed
        if (authUserId && !isGuest && authUserId !== currentUser.id) {
          console.warn('User ID mismatch when updating stats:');
          console.log('Auth ID:', authUserId);
          console.log('EconWordsAuth ID:', currentUser.id);
          currentUser.id = authUserId;
        }
      }
    }

    // Step 3: For guest users, store stats in localStorage
    if (isGuest) {
      try {
        console.log('Updating guest stats in localStorage');
        // Get existing stats from localStorage
        let localStats = JSON.parse(localStorage.getItem('econWordsGuestStats') || '{}');

        // Calculate new stats
        const newStreak = scoreData.won ? (localStats.streak || 0) + 1 : 0;
        const newHighScore = Math.max(scoreData.score || 0, localStats.highScore || 0);
        const newGamesPlayed = (localStats.gamesPlayed || 0) + 1;

        // Update localStorage
        localStats = {
          userId: currentUser?.id || 'guest-user',
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

    // Step 4: For authenticated users, make sure we have a valid ID
    const userId = authUserId || currentUser?.id;
    if (!userId) {
      console.error('No valid user ID for updating stats in database');
      return { success: false, error: 'No valid user ID' };
    }

    try {
      // Check if user stats record exists
      console.log('Checking for existing user stats with ID:', userId);
      const { data: existingStats, error: fetchError } = await supabaseClient
        .from('econ_terms_user_stats')
        .select('*')
        .eq('user_id', userId)
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
        console.log('Updating existing stats record');
        const { error: updateError } = await supabaseClient
          .from('econ_terms_user_stats')
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

        console.log('User stats updated successfully');
      } else {
        // Create new record
        console.log('Creating new stats record');
        const { error: insertError } = await supabaseClient
          .from('econ_terms_user_stats')
          .insert({
            user_id: userId,
            streak: newStreak,
            high_score: newHighScore,
            games_played: newGamesPlayed
          });

        if (insertError) {
          console.error('Error creating user stats:', insertError);
          return { success: false, error: insertError.message };
        }

        console.log('New user stats record created successfully');
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

    // Check for active session first
    let authUserId = null;
    let isGuest = false;

    try {
      const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();

      if (sessionError || !sessionData?.session?.user?.id) {
        // Try to create an anonymous session if we don't have one
        console.log('No valid session found for getUserStats, attempting anonymous sign-in...');
        try {
          // Check if signInAnonymously is available (Supabase v2.39.0+)
          if (typeof supabaseClient.auth.signInAnonymously === 'function') {
            const { data: anonData, error: anonError } = await supabaseClient.auth.signInAnonymously();

            if (anonError) {
              console.error('Failed to create anonymous session for getUserStats:', anonError);
              isGuest = true;
            } else if (anonData?.user?.id) {
              authUserId = anonData.user.id;
              console.log('Created anonymous session with ID:', authUserId);

              // Wait a moment for the session to be fully established
              await new Promise(resolve => setTimeout(resolve, 300));

              // Update EconWordsAuth if needed
              if (window.EconWordsAuth?._setupAuthenticatedUser) {
                await window.EconWordsAuth._setupAuthenticatedUser(anonData.user);
              }
            }
          } else {
            // Fallback for older Supabase versions
            console.log('Anonymous sign-in not available in this Supabase version, using guest mode');
            isGuest = true;

            // Create a guest user in EconWordsAuth if available
            if (window.EconWordsAuth?.setupGuestUser) {
              const guestUser = await window.EconWordsAuth.setupGuestUser();
              console.log('Created guest user with ID:', guestUser.id);
            }
          }
        } catch (e) {
          console.error('Exception creating anonymous session:', e);
          isGuest = true;
        }
      } else {
        authUserId = sessionData.session.user.id;
        console.log('Found existing session for getUserStats with ID:', authUserId);
      }
    } catch (e) {
      console.error('Error checking session status:', e);
      isGuest = true;
    }

    // Check EconWordsAuth for consistency
    const currentUser = window.EconWordsAuth?.getCurrentUser();
    if (!currentUser) {
      if (!authUserId) {
        console.error('No user information available for getUserStats');
        return {
          highScore: 0,
          streak: 0,
          gamesPlayed: 0,
          rank: 'No User'
        };
      }
    } else {
      isGuest = currentUser.isGuest && !authUserId;

      // Fix mismatch between auth and EconWordsAuth if needed
      if (authUserId && currentUser.id !== authUserId) {
        console.warn('User ID mismatch in getUserStats:');
        console.log('Auth session ID:', authUserId);
        console.log('EconWordsAuth ID:', currentUser.id);
        currentUser.id = authUserId;
      }
    }

    // For guest users, get stats from localStorage
    if (isGuest) {
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

    try {
      // Make sure we have a valid user ID for the query
      const userId = authUserId || currentUser?.id;
      if (!userId) {
        console.error('No valid user ID for database query');
        return {
          highScore: 0,
          streak: 0,
          gamesPlayed: 0,
          rank: 'No ID'
        };
      }

      // Get user stats with verified auth session
      console.log('Querying user stats for ID:', userId);
      const { data: stats, error } = await supabaseClient
        .from('econ_terms_user_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error getting user stats:', error);

        // Handle RLS policy violations
        if (error.code === '42501' || error.message.includes('policy')) {
          console.warn('RLS policy violation when getting stats - attempting recovery');
          await this._recoverFromRLSViolation();
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

      // Create stats if they don't exist
      if (!stats) {
        console.log('No stats found for user, creating new record');
        try {
          const newStats = {
            user_id: userId,
            high_score: 0,
            streak: 0,
            games_played: 0
          };

          const { error: insertError } = await supabaseClient
            .from('econ_terms_user_stats')
            .insert(newStats);

          if (insertError) {
            console.error('Error creating new user stats:', insertError);
          }

          return {
            highScore: 0,
            streak: 0,
            gamesPlayed: 0,
            rank: 'New'
          };
        } catch (e) {
          console.error('Exception creating new user stats:', e);
          return {
            highScore: 0,
            streak: 0,
            gamesPlayed: 0,
            rank: 'Error'
          };
        }
      }

      // Get user rank by getting count of users with higher scores
      const { count, error: rankError } = await supabaseClient
        .from('econ_terms_user_stats')
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
