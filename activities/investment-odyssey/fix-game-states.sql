-- Fix game_states table to use TEXT for user_id instead of UUID

-- First, check if the user_id column is UUID
DO $$
DECLARE
    column_type TEXT;
BEGIN
    -- Get the current type of user_id column
    SELECT data_type INTO column_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'game_states'
    AND column_name = 'user_id';
    
    -- If it's UUID, change it to TEXT
    IF column_type = 'uuid' THEN
        -- First drop the foreign key constraint if it exists
        EXECUTE '
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.table_constraints tc
                    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
                    WHERE tc.constraint_type = ''FOREIGN KEY''
                    AND tc.table_name = ''game_states''
                    AND ccu.column_name = ''user_id''
                ) THEN
                    ALTER TABLE public.game_states DROP CONSTRAINT IF EXISTS game_states_user_id_fkey;
                END IF;
            END $$;
        ';
        
        -- Then alter the column type
        EXECUTE 'ALTER TABLE public.game_states ALTER COLUMN user_id TYPE TEXT;';
        
        RAISE NOTICE 'Changed user_id column from UUID to TEXT';
    ELSE
        RAISE NOTICE 'user_id column is already of type %', column_type;
    END IF;
END $$;

-- Create a special TA user if it doesn't exist
INSERT INTO profiles (id, name, email, created_at, updated_at, is_ta, custom_id)
SELECT 
    '00000000-0000-0000-0000-000000000000', 
    'TA Default User', 
    'ta_default@example.com', 
    NOW(), 
    NOW(), 
    true, 
    'TA_DEFAULT'
WHERE NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = '00000000-0000-0000-0000-000000000000'
);
