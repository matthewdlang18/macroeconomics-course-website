-- SQL functions to help fix database issues

-- Function to create game_participants table if it doesn't exist
CREATE OR REPLACE FUNCTION create_game_participants_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if table exists
  IF NOT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'game_participants'
  ) THEN
    -- Create the table
    EXECUTE '
      CREATE TABLE public.game_participants (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        game_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
        student_id TEXT NOT NULL,
        student_name TEXT NOT NULL,
        portfolio_value FLOAT DEFAULT 10000,
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(game_id, student_id)
      );
    ';
    
    -- Disable RLS for now
    EXECUTE 'ALTER TABLE public.game_participants DISABLE ROW LEVEL SECURITY;';
  END IF;
END;
$$;

-- Function to get column type
CREATE OR REPLACE FUNCTION get_column_type(table_name text, column_name text)
RETURNS TABLE(column_name text, data_type text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT c.column_name::text, c.data_type::text
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
  AND c.table_name = table_name
  AND c.column_name = column_name;
END;
$$;

-- Function to execute arbitrary SQL (use with caution)
CREATE OR REPLACE FUNCTION execute_sql(sql_statement text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_statement;
END;
$$;

-- Function to fix game_states user_id column
CREATE OR REPLACE FUNCTION fix_game_states_user_id()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  column_type text;
BEGIN
  -- Get the current type of user_id column
  SELECT data_type INTO column_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'game_states'
  AND column_name = 'user_id';
  
  -- If it's UUID, change it to TEXT
  IF column_type = 'uuid' THEN
    -- First drop the foreign key constraint if it exists
    EXECUTE '
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints tc
          JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
          WHERE tc.constraint_type = ''FOREIGN KEY''
          AND tc.table_name = ''game_states''
          AND ccu.column_name = ''user_id''
        ) THEN
          ALTER TABLE public.game_states DROP CONSTRAINT IF EXISTS game_states_user_id_fkey;
        END IF;
      END $$;
    ';
    
    -- Then alter the column type
    EXECUTE 'ALTER TABLE public.game_states ALTER COLUMN user_id TYPE TEXT;';
  END IF;
END;
$$;

-- Function to check and fix all database issues
CREATE OR REPLACE FUNCTION fix_all_database_issues()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result text := 'Database fixes completed:';
BEGIN
  -- Create game_participants table if it doesn't exist
  PERFORM create_game_participants_table();
  result := result || ' game_participants table checked/created;';
  
  -- Fix game_states user_id column
  PERFORM fix_game_states_user_id();
  result := result || ' game_states user_id column fixed;';
  
  RETURN result;
END;
$$;
