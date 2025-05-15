-- Alter the existing leaderboard table to add missing columns
-- This script uses ALTER TABLE IF EXISTS and ADD COLUMN IF NOT EXISTS to safely add columns

-- Add score column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'leaderboard' AND column_name = 'score'
    ) THEN
        ALTER TABLE public.leaderboard ADD COLUMN score INTEGER NOT NULL DEFAULT 0;
        RAISE NOTICE 'Added score column to leaderboard table';
    ELSE
        RAISE NOTICE 'score column already exists in leaderboard table';
    END IF;
END $$;

-- Add game_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'leaderboard' AND column_name = 'game_id'
    ) THEN
        ALTER TABLE public.leaderboard ADD COLUMN game_id TEXT NOT NULL DEFAULT 'unknown';
        RAISE NOTICE 'Added game_id column to leaderboard table';
    ELSE
        RAISE NOTICE 'game_id column already exists in leaderboard table';
    END IF;
END $$;

-- Add term column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'leaderboard' AND column_name = 'term'
    ) THEN
        ALTER TABLE public.leaderboard ADD COLUMN term TEXT;
        RAISE NOTICE 'Added term column to leaderboard table';
    ELSE
        RAISE NOTICE 'term column already exists in leaderboard table';
    END IF;
END $$;

-- Add attempts column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'leaderboard' AND column_name = 'attempts'
    ) THEN
        ALTER TABLE public.leaderboard ADD COLUMN attempts INTEGER;
        RAISE NOTICE 'Added attempts column to leaderboard table';
    ELSE
        RAISE NOTICE 'attempts column already exists in leaderboard table';
    END IF;
END $$;

-- Add won column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'leaderboard' AND column_name = 'won'
    ) THEN
        ALTER TABLE public.leaderboard ADD COLUMN won BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added won column to leaderboard table';
    ELSE
        RAISE NOTICE 'won column already exists in leaderboard table';
    END IF;
END $$;

-- Add time_taken column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'leaderboard' AND column_name = 'time_taken'
    ) THEN
        ALTER TABLE public.leaderboard ADD COLUMN time_taken INTEGER;
        RAISE NOTICE 'Added time_taken column to leaderboard table';
    ELSE
        RAISE NOTICE 'time_taken column already exists in leaderboard table';
    END IF;
END $$;

-- Add user_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'leaderboard' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.leaderboard ADD COLUMN user_id UUID REFERENCES public.profiles(id);
        RAISE NOTICE 'Added user_id column to leaderboard table';
    ELSE
        RAISE NOTICE 'user_id column already exists in leaderboard table';
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id ON public.leaderboard(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_game_id ON public.leaderboard(game_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON public.leaderboard(score DESC);

-- Add RLS (Row Level Security) policies if they don't exist
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Check if policies exist before creating them
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE tablename = 'leaderboard' AND policyname = 'Leaderboard entries are viewable by everyone'
    ) THEN
        CREATE POLICY "Leaderboard entries are viewable by everyone" 
        ON public.leaderboard FOR SELECT USING (true);
        RAISE NOTICE 'Created SELECT policy for leaderboard table';
    ELSE
        RAISE NOTICE 'SELECT policy already exists for leaderboard table';
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE tablename = 'leaderboard' AND policyname = 'Users can insert their own scores'
    ) THEN
        CREATE POLICY "Users can insert their own scores" 
        ON public.leaderboard FOR INSERT 
        WITH CHECK (auth.uid()::text = user_id::text OR user_id IN (
            SELECT id FROM public.profiles WHERE auth.uid()::text = id::text
        ));
        RAISE NOTICE 'Created INSERT policy for leaderboard table';
    ELSE
        RAISE NOTICE 'INSERT policy already exists for leaderboard table';
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE tablename = 'leaderboard' AND policyname = 'Users can update their own scores'
    ) THEN
        CREATE POLICY "Users can update their own scores" 
        ON public.leaderboard FOR UPDATE 
        USING (auth.uid()::text = user_id::text OR user_id IN (
            SELECT id FROM public.profiles WHERE auth.uid()::text = id::text
        ));
        RAISE NOTICE 'Created UPDATE policy for leaderboard table';
    ELSE
        RAISE NOTICE 'UPDATE policy already exists for leaderboard table';
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE tablename = 'leaderboard' AND policyname = 'Users can delete their own scores'
    ) THEN
        CREATE POLICY "Users can delete their own scores" 
        ON public.leaderboard FOR DELETE 
        USING (auth.uid()::text = user_id::text OR user_id IN (
            SELECT id FROM public.profiles WHERE auth.uid()::text = id::text
        ));
        RAISE NOTICE 'Created DELETE policy for leaderboard table';
    ELSE
        RAISE NOTICE 'DELETE policy already exists for leaderboard table';
    END IF;
END $$;

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leaderboard TO authenticated;
GRANT SELECT ON public.leaderboard TO anon;
