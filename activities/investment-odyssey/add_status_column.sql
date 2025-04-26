-- Add status column to game_sessions table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'game_sessions'
        AND column_name = 'status'
    ) THEN
        ALTER TABLE game_sessions
        ADD COLUMN status VARCHAR(20) DEFAULT 'active' NOT NULL;

        -- Add a comment to the column
        COMMENT ON COLUMN game_sessions.status IS 'Game status: active, completed, or cancelled';
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

-- Add a constraint to ensure status is one of the allowed values
ALTER TABLE game_sessions
DROP CONSTRAINT IF EXISTS game_sessions_status_check;

ALTER TABLE game_sessions
ADD CONSTRAINT game_sessions_status_check
CHECK (status IN ('active', 'completed', 'cancelled'));
