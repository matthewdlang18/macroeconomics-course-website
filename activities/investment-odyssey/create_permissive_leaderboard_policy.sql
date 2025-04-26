-- Create a more permissive RLS policy for the leaderboard table
-- This allows anyone to insert scores, while still maintaining RLS for other operations

-- First, make sure RLS is enabled
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Drop the existing policy if it exists
DROP POLICY IF EXISTS leaderboard_student_insert ON leaderboard;

-- Create a new policy that allows anyone to insert scores
CREATE POLICY leaderboard_insert_anyone ON leaderboard
  FOR INSERT
  WITH CHECK (true);

-- Keep the existing read policy (or create it if it doesn't exist)
DROP POLICY IF EXISTS leaderboard_read ON leaderboard;
CREATE POLICY leaderboard_read ON leaderboard
  FOR SELECT
  USING (true);

-- Note: This is a more secure approach than completely disabling RLS,
-- as it still restricts UPDATE and DELETE operations.
