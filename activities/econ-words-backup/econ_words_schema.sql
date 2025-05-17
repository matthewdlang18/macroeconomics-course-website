-- Econ Words Game Database Schema
-- This script defines the tables and policies needed for the Econ Words game in Supabase

-- Table for storing scores in the leaderboard
CREATE TABLE econ_terms_leaderboard (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    term TEXT,
    attempts INTEGER,
    won BOOLEAN DEFAULT false,
    time_taken INTEGER,
    section_id TEXT,
    auth_user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for storing user stats
CREATE TABLE econ_terms_user_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    streak INTEGER DEFAULT 0,
    high_score INTEGER DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    auth_user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_econ_terms_leaderboard_user_id ON econ_terms_leaderboard(user_id);
CREATE INDEX idx_econ_terms_leaderboard_score ON econ_terms_leaderboard(score DESC);
CREATE INDEX idx_econ_terms_user_stats_user_id ON econ_terms_user_stats(user_id);

-- Row Level Security (RLS) Policies
-- These policies control access to the tables

-- Enable RLS on both tables
ALTER TABLE econ_terms_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE econ_terms_user_stats ENABLE ROW LEVEL SECURITY;

-- Everyone can view the leaderboard
CREATE POLICY "Anyone can view leaderboard" 
ON econ_terms_leaderboard 
FOR SELECT 
USING (true);

-- Only authenticated users can insert into the leaderboard
CREATE POLICY "Authenticated users can insert scores" 
ON econ_terms_leaderboard 
FOR INSERT 
WITH CHECK (
    -- Auth users can only insert records with their own auth_user_id
    (auth.uid() = auth_user_id) OR 
    -- Or we allow insertion if the auth_user_id is null (for guests)
    (auth_user_id IS NULL)
);

-- Everyone can view user stats - useful for the leaderboard display
CREATE POLICY "Anyone can view user stats" 
ON econ_terms_user_stats 
FOR SELECT 
USING (true);

-- Only authenticated users can update their own stats
CREATE POLICY "Users can update their own stats" 
ON econ_terms_user_stats 
FOR UPDATE 
USING (
    -- Auth users can only update their own stats
    (auth.uid() = auth_user_id) OR 
    -- Or we allow update if the auth_user_id is null (for guests)
    (auth_user_id IS NULL)
);

-- Only authenticated users can create their own stats
CREATE POLICY "Users can create their own stats" 
ON econ_terms_user_stats 
FOR INSERT 
WITH CHECK (
    -- Auth users can only insert their own stats
    (auth.uid() = auth_user_id) OR 
    -- Or we allow insertion if the auth_user_id is null (for guests)
    (auth_user_id IS NULL)
);

-- Schema for the fallback general leaderboard table
-- This is for backward compatibility
CREATE TABLE IF NOT EXISTS leaderboard (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    game_mode TEXT NOT NULL, -- Use 'econ_terms' for Econ Words game
    final_value INTEGER NOT NULL, -- This corresponds to score for Econ Words
    section_id TEXT,
    auth_user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on the general leaderboard table
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Everyone can view the general leaderboard
CREATE POLICY "Anyone can view general leaderboard" 
ON leaderboard 
FOR SELECT 
USING (true);

-- Only authenticated users can insert into the general leaderboard
CREATE POLICY "Authenticated users can insert scores to general leaderboard" 
ON leaderboard 
FOR INSERT 
WITH CHECK (
    -- Auth users can only insert records with their own auth_user_id
    (auth.uid() = auth_user_id) OR 
    -- Or we allow insertion if the auth_user_id is null (for guests)
    (auth_user_id IS NULL)
);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to update the updated_at column
CREATE TRIGGER update_econ_terms_leaderboard_updated_at
BEFORE UPDATE ON econ_terms_leaderboard
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_econ_terms_user_stats_updated_at
BEFORE UPDATE ON econ_terms_user_stats
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leaderboard_updated_at
BEFORE UPDATE ON leaderboard
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
