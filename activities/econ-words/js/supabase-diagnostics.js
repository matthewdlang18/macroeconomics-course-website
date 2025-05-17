/**
 * Supabase Diagnostics for Econ Words Game
 * This file provides diagnostic tools to troubleshoot Supabase connection issues
 */

const SupabaseDiagnostics = {
  // Run a full diagnostic check on Supabase connection and permissions
  runFullDiagnostics: async function() {
    console.log('======= SUPABASE DIAGNOSTICS START =======');
    
    // Check if client is initialized
    if (!window.supabaseClient) {
      console.error('FAIL: Supabase client is not initialized');
      return {
        success: false,
        clientInitialized: false,
        authStatus: null,
        tableAccess: null,
        error: 'Supabase client is not initialized'
      };
    }
    
    console.log('PASS: Supabase client is initialized');
    
    // Results object
    const results = {
      success: false,
      clientInitialized: true,
      authStatus: null,
      tableAccess: {},
      rlsPolicies: null,
      error: null
    };
    
    // Step 1: Check authentication status
    try {
      console.log('Checking authentication status...');
      const { data, error } = await supabaseClient.auth.getSession();
      
      if (error) {
        console.error('FAIL: Error getting auth session:', error);
        results.authStatus = { authenticated: false, error: error.message };
      } else if (data && data.session) {
        const expiresAt = new Date(data.session.expires_at * 1000);
        const now = new Date();
        
        console.log('PASS: User is authenticated');
        console.log('User ID:', data.session.user.id);
        console.log('Token expires:', expiresAt.toISOString());
        console.log('Time until expiry:', Math.round((expiresAt - now) / 1000 / 60), 'minutes');
        
        results.authStatus = { 
          authenticated: true,
          userId: data.session.user.id,
          expiresAt: expiresAt.toISOString(),
          timeUntilExpiryMinutes: Math.round((expiresAt - now) / 1000 / 60)
        };
      } else {
        console.warn('INFO: User is not authenticated (no session)');
        results.authStatus = { authenticated: false, reason: 'No session found' };
      }
    } catch (error) {
      console.error('FAIL: Exception checking auth status:', error);
      results.authStatus = { authenticated: false, error: error.message };
    }
    
    // Step 2: Check table access for each table
    const tables = [
      'econ_terms_leaderboard',
      'econ_terms_user_stats',
      'profiles'
    ];
    
    console.log('Checking table access...');
    
    for (const table of tables) {
      try {
        console.log(`Testing access to ${table} table...`);
        const { data, error } = await supabaseClient
          .from(table)
          .select('*', { count: 'exact', head: true })
          .limit(0);
          
        if (error) {
          console.error(`FAIL: Cannot access ${table} table:`, error);
          results.tableAccess[table] = { 
            accessible: false, 
            error: error.message,
            isRLSError: error.code === '42501' || error.message.includes('policy') || error.message.includes('permission')
          };
        } else {
          console.log(`PASS: ${table} table is accessible`);
          results.tableAccess[table] = { accessible: true };
        }
      } catch (error) {
        console.error(`FAIL: Exception testing ${table} table access:`, error);
        results.tableAccess[table] = { accessible: false, error: error.message };
      }
    }
    
    // Step 3: Test insert operations to check RLS policies
    if (results.authStatus && results.authStatus.authenticated) {
      console.log('Testing insert operations to check RLS policies...');
      
      try {
        // Create test data
        const testRecord = {
          user_id: results.authStatus.userId,
          user_name: 'Test User',
          score: 1,
          term: 'TEST-DIAG',
          attempts: 1,
          won: true,
          time_taken: 1000
        };
        
        console.log('Attempting test insert to econ_terms_leaderboard...');
        const { data, error } = await supabaseClient
          .from('econ_terms_leaderboard')
          .insert(testRecord)
          .select()
          .single();
        
        if (error) {
          console.error('FAIL: Insert test failed:', error);
          results.rlsPolicies = { 
            canInsert: false,
            error: error.message,
            isRLSError: error.code === '42501' || error.message.includes('policy') || error.message.includes('permission')
          };
        } else {
          console.log('PASS: Insert test succeeded:', data);
          results.rlsPolicies = { canInsert: true, insertedId: data.id };
          
          // Clean up the test record
          console.log('Cleaning up test record...');
          await supabaseClient
            .from('econ_terms_leaderboard')
            .delete()
            .eq('id', data.id);
        }
      } catch (error) {
        console.error('FAIL: Exception during insert test:', error);
        results.rlsPolicies = { canInsert: false, error: error.message };
      }
    } else {
      results.rlsPolicies = { canInsert: false, reason: 'Not authenticated' };
    }
    
    // Summarize results
    console.log('======= DIAGNOSTICS SUMMARY =======');
    console.log('Client initialized:', results.clientInitialized);
    console.log('Authentication:', results.authStatus?.authenticated ? 'YES' : 'NO');
    
    let tableAccessSummary = '';
    for (const table in results.tableAccess) {
      tableAccessSummary += `${table}: ${results.tableAccess[table].accessible ? 'YES' : 'NO'}, `;
    }
    console.log('Table access:', tableAccessSummary);
    
    console.log('Can insert data:', results.rlsPolicies?.canInsert ? 'YES' : 'NO');
    
    // Determine overall success
    results.success = results.clientInitialized && 
                     results.authStatus?.authenticated &&
                     Object.values(results.tableAccess).some(access => access.accessible);
    
    console.log('Overall diagnosis:', results.success ? 'PASS' : 'FAIL');
    console.log('======= SUPABASE DIAGNOSTICS END =======');
    
    return results;
  },
  
  // Get Supabase RLS policies for tables (simulated, since we can't query them directly)
  checkRLSPolicies: function() {
    // We can't actually fetch RLS policies from Supabase via the client
    // This is educational information about how RLS usually works
    return {
      econ_terms_leaderboard: [
        {
          name: "Users can view their own scores (educated guess)",
          operation: "SELECT",
          definition: "auth.uid() = user_id"
        },
        {
          name: "Users can insert their own scores (educated guess)",
          operation: "INSERT", 
          definition: "auth.uid() = user_id"
        }
      ],
      econ_terms_user_stats: [
        {
          name: "Users can view their own stats (educated guess)",
          operation: "SELECT",
          definition: "auth.uid() = user_id"
        },
        {
          name: "Users can update their own stats (educated guess)",
          operation: "UPDATE",
          definition: "auth.uid() = user_id"
        }
      ]
    };
  },
  
  // Check Supabase version and connection info (non-functional, for future use)
  getConnectionInfo: async function() {
    // This doesn't actually work with Supabase client - just a placeholder
    return {
      version: "Unknown (not accessible via client)",
      connection: "Supabase cloud service",
      region: "Unknown (not accessible via client)",
      capabilities: ["Authentication", "Database", "Storage", "Edge Functions", "Realtime"]
    };
  },
  
  // Test authentication (renamed from testAnonymousAuth)
  testAuthentication: async function() {
    console.log('======= TESTING AUTHENTICATION =======');
    
    if (!window.supabaseClient) {
      console.error('FAIL: Supabase client is not initialized');
      return {
        success: false,
        error: 'Supabase client not available'
      };
    }
    
    // Check current session
    try {
      console.log('Checking current session...');
      const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
      
      if (sessionError) {
        console.error('Error getting current session:', sessionError);
        return {
          success: false,
          error: sessionError.message,
          hasExistingSession: false
        };
      } else if (sessionData?.session) {
        console.log('Session already exists with user ID:', sessionData.session.user.id);
        console.log('Session expires at:', new Date(sessionData.session.expires_at * 1000).toISOString());
        
        // Test token refresh
        console.log('Testing token refresh...');
        const { data: refreshData, error: refreshError } = await supabaseClient.auth.refreshSession();
        
        if (refreshError) {
          console.warn('Token refresh test failed:', refreshError);
        } else if (refreshData?.session) {
          console.log('Token refresh successful');
        }
        
        // Test database access
        console.log('Testing database access with authenticated user...');
        const { data: dbData, error: dbError } = await supabaseClient
          .from('econ_terms_leaderboard')
          .select('*', { count: 'exact' })
          .limit(1);
        
        return {
          success: true,
          hasExistingSession: true,
          userId: sessionData.session.user.id,
          expiresAt: new Date(sessionData.session.expires_at * 1000).toISOString(),
          dbAccessResult: dbError ? { 
            success: false, 
            error: dbError.message,
            code: dbError.code
          } : { 
            success: true,
            recordCount: dbData?.length || 0 
          }
        };
      } else {
        console.log('No active session found');
        return {
          success: false,
          error: 'No active session found. Please sign in first.',
          hasExistingSession: false
        };
      }
    } catch (error) {
      console.error('FAIL: Exception during auth test:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // Test available auth methods
  testAuthMethods: function() {
    console.log('======= TESTING AVAILABLE AUTH METHODS =======');
    
    if (!window.supabaseClient) {
      return { 
        success: false,
        error: 'Supabase client not initialized'
      };
    }
    
    // Check what methods are available on the auth object
    const authMethods = {};
    
    // Check each method
    for (const method of [
      'signInWithPassword', 
      'signInWithOAuth', 
      'signInWithOtp',
      'signUp',
      'signOut',
      'refreshSession',
      'getSession',
      'getUser',
      'signInAnonymously' // This shouldn't exist in current Supabase versions
    ]) {
      authMethods[method] = typeof supabaseClient.auth[method] === 'function';
    }
    
    console.log('Available auth methods:', authMethods);
    
    return {
      success: true,
      authMethods,
      recommendedMethod: authMethods.signInWithPassword ? 'signInWithPassword' : 
                        (authMethods.signInWithOtp ? 'signInWithOtp' : 'signUp')
    };
  },
  
  // Create a test user for diagnostic purposes
  createTestUser: async function(email, password) {
    console.log('======= CREATING TEST USER =======');
    
    if (!window.supabaseClient) {
      return { 
        success: false,
        error: 'Supabase client not initialized'
      };
    }
    
    try {
      if (!email || !password) {
        email = 'test@example.com';
        password = 'password123';
      }
      
      console.log(`Attempting to create test user with email: ${email}`);
      
      // First check if signUp method exists
      if (typeof supabaseClient.auth.signUp !== 'function') {
        return {
          success: false,
          error: 'signUp method not available in this Supabase client version'
        };
      }
      
      // Create the user
      const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: 'Test User'
          }
        }
      });
      
      if (error) {
        console.error('Error creating test user:', error);
        
        // If the error indicates user already exists, try to sign in instead
        if (error.message.includes('already registered') || 
            error.message.includes('unique constraint') ||
            error.message.includes('already taken')) {
          
          console.log('User may already exist, attempting sign in...');
          return await this.signInTestUser(email, password);
        }
        
        return {
          success: false,
          error: error.message
        };
      }
      
      return {
        success: true,
        user: data.user,
        isNewUser: !data.session, // If no session returned, might need email confirmation
        session: data.session,
        message: data.session ? 'User created and signed in successfully' : 'User created but email confirmation required'
      };
    } catch (error) {
      console.error('Exception creating test user:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // Sign in the test user
  signInTestUser: async function(email, password) {
    console.log('======= SIGNING IN TEST USER =======');
    
    if (!window.supabaseClient) {
      return { 
        success: false,
        error: 'Supabase client not initialized'
      };
    }
    
    try {
      if (!email || !password) {
        email = 'test@example.com';
        password = 'password123';
      }
      
      console.log(`Attempting to sign in test user with email: ${email}`);
      
      // Check if signInWithPassword exists
      if (typeof supabaseClient.auth.signInWithPassword !== 'function') {
        return {
          success: false,
          error: 'signInWithPassword method not available in this Supabase client version'
        };
      }
      
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
      });
      
      if (error) {
        console.error('Error signing in test user:', error);
        return {
          success: false,
          error: error.message
        };
      }
      
      return {
        success: true,
        user: data.user,
        session: data.session
      };
    } catch (error) {
      console.error('Exception signing in test user:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// Export as global object
window.SupabaseDiagnostics = SupabaseDiagnostics;

// Add a command to run diagnostics from console
console.log('Supabase diagnostics loaded. Run window.SupabaseDiagnostics.runFullDiagnostics() to check connection.');
