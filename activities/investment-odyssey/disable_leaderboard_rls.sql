-- Temporarily disable Row Level Security on the leaderboard table
-- This allows guest users to insert scores without authentication
ALTER TABLE leaderboard DISABLE ROW LEVEL SECURITY;

-- Note: This is a temporary solution. In a production environment,
-- you should implement proper authentication and use RLS policies
-- to secure your data.
