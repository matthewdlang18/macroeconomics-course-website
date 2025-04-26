-- Create game_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  current_round INTEGER DEFAULT 0,
  max_rounds INTEGER DEFAULT 20,
  active BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'game_sessions'
        AND column_name = 'status'
    ) THEN
        ALTER TABLE game_sessions ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
END $$;

-- Update existing records to have 'active' status if they don't have a status
UPDATE game_sessions
SET status = 'active'
WHERE status IS NULL;

-- Add an index on the status column for faster queries
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status);

-- Add an index on the section_id column for faster queries
CREATE INDEX IF NOT EXISTS idx_game_sessions_section_id ON game_sessions(section_id);
