-- Check and fix RLS policies for Investment Odyssey tables

-- Check if RLS is enabled for game_sessions
DO $$
DECLARE
    rls_enabled BOOLEAN;
BEGIN
    SELECT relrowsecurity INTO rls_enabled FROM pg_class WHERE relname = 'game_sessions';
    
    IF NOT rls_enabled THEN
        RAISE NOTICE 'Enabling RLS for game_sessions table';
        ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
    ELSE
        RAISE NOTICE 'RLS is already enabled for game_sessions table';
    END IF;
END $$;

-- Create a more permissive policy for game_sessions to allow TAs to access all games
DROP POLICY IF EXISTS game_sessions_permissive_read ON game_sessions;
CREATE POLICY game_sessions_permissive_read ON game_sessions
  FOR SELECT
  USING (true);

-- Create a more permissive policy for game_sessions to allow TAs to create games
DROP POLICY IF EXISTS game_sessions_permissive_insert ON game_sessions;
CREATE POLICY game_sessions_permissive_insert ON game_sessions
  FOR INSERT
  WITH CHECK (true);

-- Create a more permissive policy for game_sessions to allow TAs to update games
DROP POLICY IF EXISTS game_sessions_permissive_update ON game_sessions;
CREATE POLICY game_sessions_permissive_update ON game_sessions
  FOR UPDATE
  USING (true);

-- Check if RLS is enabled for game_states
DO $$
DECLARE
    rls_enabled BOOLEAN;
BEGIN
    SELECT relrowsecurity INTO rls_enabled FROM pg_class WHERE relname = 'game_states';
    
    IF NOT rls_enabled THEN
        RAISE NOTICE 'Enabling RLS for game_states table';
        ALTER TABLE game_states ENABLE ROW LEVEL SECURITY;
    ELSE
        RAISE NOTICE 'RLS is already enabled for game_states table';
    END IF;
END $$;

-- Create a more permissive policy for game_states
DROP POLICY IF EXISTS game_states_permissive ON game_states;
CREATE POLICY game_states_permissive ON game_states
  USING (true);

-- Check if RLS is enabled for player_states
DO $$
DECLARE
    rls_enabled BOOLEAN;
BEGIN
    SELECT relrowsecurity INTO rls_enabled FROM pg_class WHERE relname = 'player_states';
    
    IF NOT rls_enabled THEN
        RAISE NOTICE 'Enabling RLS for player_states table';
        ALTER TABLE player_states ENABLE ROW LEVEL SECURITY;
    ELSE
        RAISE NOTICE 'RLS is already enabled for player_states table';
    END IF;
END $$;

-- Create a more permissive policy for player_states
DROP POLICY IF EXISTS player_states_permissive ON player_states;
CREATE POLICY player_states_permissive ON player_states
  USING (true);

-- Check if RLS is enabled for leaderboard
DO $$
DECLARE
    rls_enabled BOOLEAN;
BEGIN
    SELECT relrowsecurity INTO rls_enabled FROM pg_class WHERE relname = 'leaderboard';
    
    IF NOT rls_enabled THEN
        RAISE NOTICE 'Enabling RLS for leaderboard table';
        ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
    ELSE
        RAISE NOTICE 'RLS is already enabled for leaderboard table';
    END IF;
END $$;

-- Create a more permissive policy for leaderboard
DROP POLICY IF EXISTS leaderboard_permissive ON leaderboard;
CREATE POLICY leaderboard_permissive ON leaderboard
  USING (true);

-- Check if RLS is enabled for game_participants
DO $$
DECLARE
    rls_enabled BOOLEAN;
BEGIN
    SELECT relrowsecurity INTO rls_enabled FROM pg_class WHERE relname = 'game_participants';
    
    IF rls_enabled THEN
        RAISE NOTICE 'RLS is enabled for game_participants table';
        
        -- Create a more permissive policy for game_participants
        DROP POLICY IF EXISTS game_participants_permissive ON game_participants;
        CREATE POLICY game_participants_permissive ON game_participants
          USING (true);
    ELSE
        RAISE NOTICE 'RLS is not enabled for game_participants table';
    END IF;
END $$;
