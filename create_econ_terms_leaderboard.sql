-- Create a separate leaderboard table for the Economics Terms game
CREATE TABLE IF NOT EXISTS public.econ_terms_leaderboard (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),
    user_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    term TEXT,
    attempts INTEGER,
    won BOOLEAN DEFAULT false,
    time_taken INTEGER,
    section_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_econ_terms_leaderboard_user_id ON public.econ_terms_leaderboard(user_id);
CREATE INDEX IF NOT EXISTS idx_econ_terms_leaderboard_score ON public.econ_terms_leaderboard(score DESC);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.econ_terms_leaderboard ENABLE ROW LEVEL SECURITY;

-- Allow users to view all leaderboard entries
CREATE POLICY "Econ Terms leaderboard entries are viewable by everyone" 
ON public.econ_terms_leaderboard FOR SELECT USING (true);

-- Allow authenticated users to insert their own scores
CREATE POLICY "Users can insert their own scores in Econ Terms leaderboard" 
ON public.econ_terms_leaderboard FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text OR user_id IN (
    SELECT id FROM public.profiles WHERE auth.uid()::text = id::text
));

-- Allow users to update only their own scores
CREATE POLICY "Users can update their own scores in Econ Terms leaderboard" 
ON public.econ_terms_leaderboard FOR UPDATE 
USING (auth.uid()::text = user_id::text OR user_id IN (
    SELECT id FROM public.profiles WHERE auth.uid()::text = id::text
));

-- Allow users to delete only their own scores
CREATE POLICY "Users can delete their own scores in Econ Terms leaderboard" 
ON public.econ_terms_leaderboard FOR DELETE 
USING (auth.uid()::text = user_id::text OR user_id IN (
    SELECT id FROM public.profiles WHERE auth.uid()::text = id::text
));

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.econ_terms_leaderboard TO authenticated;
GRANT SELECT ON public.econ_terms_leaderboard TO anon;

-- Comment on table and columns for documentation
COMMENT ON TABLE public.econ_terms_leaderboard IS 'Stores game scores for the Economics Terms game';
COMMENT ON COLUMN public.econ_terms_leaderboard.id IS 'Primary key';
COMMENT ON COLUMN public.econ_terms_leaderboard.user_id IS 'Foreign key to profiles table';
COMMENT ON COLUMN public.econ_terms_leaderboard.user_name IS 'Display name of the user';
COMMENT ON COLUMN public.econ_terms_leaderboard.score IS 'Player score';
COMMENT ON COLUMN public.econ_terms_leaderboard.term IS 'The term that was guessed';
COMMENT ON COLUMN public.econ_terms_leaderboard.attempts IS 'Number of attempts made';
COMMENT ON COLUMN public.econ_terms_leaderboard.won IS 'Whether the game was won';
COMMENT ON COLUMN public.econ_terms_leaderboard.time_taken IS 'Time taken in milliseconds';
COMMENT ON COLUMN public.econ_terms_leaderboard.section_id IS 'Section ID if the user is part of a class section';
COMMENT ON COLUMN public.econ_terms_leaderboard.created_at IS 'Timestamp when the score was recorded';
