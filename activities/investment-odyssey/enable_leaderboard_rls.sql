-- Re-enable Row Level Security on the leaderboard table
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Note: This will re-enable RLS on the leaderboard table.
-- Make sure you have proper RLS policies in place before running this script,
-- or users will not be able to insert scores into the leaderboard.
