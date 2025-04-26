-- Add status column to game_sessions table
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
