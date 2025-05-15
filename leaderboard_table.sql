-- Create leaderboard table for storing game scores
CREATE TABLE IF NOT EXISTS public.leaderboard (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),
    game_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    term TEXT,
    attempts INTEGER,
    won BOOLEAN DEFAULT false,
    time_taken INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Add any additional fields as needed
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id ON public.leaderboard(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_game_id ON public.leaderboard(game_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON public.leaderboard(score DESC);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Allow users to view all leaderboard entries
CREATE POLICY "Leaderboard entries are viewable by everyone" 
ON public.leaderboard FOR SELECT USING (true);

-- Allow authenticated users to insert their own scores
CREATE POLICY "Users can insert their own scores" 
ON public.leaderboard FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text OR user_id IN (
    SELECT id FROM public.profiles WHERE auth.uid()::text = id::text
));

-- Allow users to update only their own scores
CREATE POLICY "Users can update their own scores" 
ON public.leaderboard FOR UPDATE 
USING (auth.uid()::text = user_id::text OR user_id IN (
    SELECT id FROM public.profiles WHERE auth.uid()::text = id::text
));

-- Allow users to delete only their own scores
CREATE POLICY "Users can delete their own scores" 
ON public.leaderboard FOR DELETE 
USING (auth.uid()::text = user_id::text OR user_id IN (
    SELECT id FROM public.profiles WHERE auth.uid()::text = id::text
));

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leaderboard TO authenticated;
GRANT SELECT ON public.leaderboard TO anon;

-- Comment on table and columns for documentation
COMMENT ON TABLE public.leaderboard IS 'Stores game scores for various games';
COMMENT ON COLUMN public.leaderboard.id IS 'Primary key';
COMMENT ON COLUMN public.leaderboard.user_id IS 'Foreign key to profiles table';
COMMENT ON COLUMN public.leaderboard.game_id IS 'Identifier for the game (e.g., econ_terms, investment_odyssey)';
COMMENT ON COLUMN public.leaderboard.score IS 'Player score';
COMMENT ON COLUMN public.leaderboard.term IS 'The term that was guessed (for word games)';
COMMENT ON COLUMN public.leaderboard.attempts IS 'Number of attempts made';
COMMENT ON COLUMN public.leaderboard.won IS 'Whether the game was won';
COMMENT ON COLUMN public.leaderboard.time_taken IS 'Time taken in milliseconds';
COMMENT ON COLUMN public.leaderboard.created_at IS 'Timestamp when the score was recorded';
