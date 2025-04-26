-- Update game_sessions table to add status column if it doesn't exist
DO $$
BEGIN
    -- Check if the status column exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'game_sessions'
        AND column_name = 'status'
    ) THEN
        -- Add the status column
        ALTER TABLE game_sessions ADD COLUMN status TEXT DEFAULT 'active';
        
        -- Update existing records to set status based on active column
        UPDATE game_sessions SET status = 
            CASE 
                WHEN active = TRUE THEN 'active'
                ELSE 'completed'
            END;
    END IF;
END $$;
