-- Investment Odyssey Database Setup
-- This file contains the SQL to set up the database schema for the Investment Odyssey game

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ======== TABLES ========

-- Game Sessions Table
CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID NOT NULL,
    current_round INTEGER DEFAULT 0,
    max_rounds INTEGER DEFAULT 20,
    status TEXT DEFAULT 'active',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game States Table (Market Data)
CREATE TABLE IF NOT EXISTS game_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL, -- Using TEXT instead of UUID for compatibility
    round_number INTEGER NOT NULL,
    asset_prices JSONB NOT NULL,
    price_history JSONB NOT NULL,
    cpi FLOAT DEFAULT 100,
    cpi_history JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(game_id, user_id, round_number)
);

-- Player States Table (Portfolio Data)
CREATE TABLE IF NOT EXISTS player_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    cash FLOAT DEFAULT 10000,
    portfolio JSONB DEFAULT '{}'::jsonb,
    trade_history JSONB DEFAULT '[]'::jsonb,
    portfolio_value_history JSONB DEFAULT '[]'::jsonb,
    total_value FLOAT DEFAULT 10000,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(game_id, user_id)
);

-- Game Participants Table (Players in a Game)
CREATE TABLE IF NOT EXISTS game_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    portfolio_value FLOAT DEFAULT 10000,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(game_id, student_id)
);

-- ======== INDEXES ========

-- Indexes for game_sessions
CREATE INDEX IF NOT EXISTS idx_game_sessions_section_id ON game_sessions(section_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_game_sessions_active ON game_sessions(active);

-- Indexes for game_states
CREATE INDEX IF NOT EXISTS idx_game_states_game_id ON game_states(game_id);
CREATE INDEX IF NOT EXISTS idx_game_states_round_number ON game_states(round_number);
CREATE INDEX IF NOT EXISTS idx_game_states_user_id ON game_states(user_id);

-- Indexes for player_states
CREATE INDEX IF NOT EXISTS idx_player_states_game_id ON player_states(game_id);
CREATE INDEX IF NOT EXISTS idx_player_states_user_id ON player_states(user_id);

-- Indexes for game_participants
CREATE INDEX IF NOT EXISTS idx_game_participants_game_id ON game_participants(game_id);
CREATE INDEX IF NOT EXISTS idx_game_participants_student_id ON game_participants(student_id);

-- ======== FUNCTIONS ========

-- Function to create a new game session
CREATE OR REPLACE FUNCTION create_game(
    p_section_id UUID,
    p_max_rounds INTEGER DEFAULT 20
) RETURNS UUID AS $$
DECLARE
    v_game_id UUID;
BEGIN
    -- Insert new game session
    INSERT INTO game_sessions (
        section_id,
        current_round,
        max_rounds,
        status,
        active,
        created_at,
        updated_at
    ) VALUES (
        p_section_id,
        0,
        p_max_rounds,
        'active',
        TRUE,
        NOW(),
        NOW()
    ) RETURNING id INTO v_game_id;
    
    -- Return the new game ID
    RETURN v_game_id;
END;
$$ LANGUAGE plpgsql;

-- Function to advance a game to the next round
CREATE OR REPLACE FUNCTION advance_round(
    p_game_id UUID
) RETURNS INTEGER AS $$
DECLARE
    v_current_round INTEGER;
    v_max_rounds INTEGER;
BEGIN
    -- Get current round and max rounds
    SELECT current_round, max_rounds 
    INTO v_current_round, v_max_rounds
    FROM game_sessions
    WHERE id = p_game_id;
    
    -- Check if game exists
    IF v_current_round IS NULL THEN
        RAISE EXCEPTION 'Game not found';
    END IF;
    
    -- Check if game is already at max rounds
    IF v_current_round >= v_max_rounds THEN
        RAISE EXCEPTION 'Game already at maximum rounds';
    END IF;
    
    -- Increment round
    UPDATE game_sessions
    SET 
        current_round = current_round + 1,
        updated_at = NOW()
    WHERE id = p_game_id
    RETURNING current_round INTO v_current_round;
    
    -- Return the new round number
    RETURN v_current_round;
END;
$$ LANGUAGE plpgsql;

-- Function to join a game
CREATE OR REPLACE FUNCTION join_game(
    p_game_id UUID,
    p_student_id TEXT,
    p_student_name TEXT,
    p_portfolio_value FLOAT DEFAULT 10000
) RETURNS UUID AS $$
DECLARE
    v_participant_id UUID;
BEGIN
    -- Insert or update participant
    INSERT INTO game_participants (
        game_id,
        student_id,
        student_name,
        portfolio_value,
        last_updated,
        created_at
    ) VALUES (
        p_game_id,
        p_student_id,
        p_student_name,
        p_portfolio_value,
        NOW(),
        NOW()
    )
    ON CONFLICT (game_id, student_id) 
    DO UPDATE SET
        student_name = p_student_name,
        portfolio_value = p_portfolio_value,
        last_updated = NOW()
    RETURNING id INTO v_participant_id;
    
    -- Return the participant ID
    RETURN v_participant_id;
END;
$$ LANGUAGE plpgsql;

-- Function to save player state
CREATE OR REPLACE FUNCTION save_player_state(
    p_game_id UUID,
    p_user_id TEXT,
    p_cash FLOAT,
    p_portfolio JSONB,
    p_trade_history JSONB,
    p_portfolio_value_history JSONB,
    p_total_value FLOAT
) RETURNS UUID AS $$
DECLARE
    v_state_id UUID;
BEGIN
    -- Insert or update player state
    INSERT INTO player_states (
        game_id,
        user_id,
        cash,
        portfolio,
        trade_history,
        portfolio_value_history,
        total_value,
        updated_at
    ) VALUES (
        p_game_id,
        p_user_id,
        p_cash,
        p_portfolio,
        p_trade_history,
        p_portfolio_value_history,
        p_total_value,
        NOW()
    )
    ON CONFLICT (game_id, user_id) 
    DO UPDATE SET
        cash = p_cash,
        portfolio = p_portfolio,
        trade_history = p_trade_history,
        portfolio_value_history = p_portfolio_value_history,
        total_value = p_total_value,
        updated_at = NOW()
    RETURNING id INTO v_state_id;
    
    -- Return the state ID
    RETURN v_state_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create game_participants table if it doesn't exist
-- This is used by the db-fix.js script
CREATE OR REPLACE FUNCTION create_game_participants_table() RETURNS VOID AS $$
BEGIN
    -- This function is a no-op since we've already created the table above
    -- But we keep it for compatibility with existing code
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to get column type
-- This is used by the db-fix.js script
CREATE OR REPLACE FUNCTION get_column_type(
    table_name TEXT,
    column_name TEXT
) RETURNS TEXT AS $$
DECLARE
    column_type TEXT;
BEGIN
    SELECT data_type 
    INTO column_type
    FROM information_schema.columns
    WHERE table_name = $1
    AND column_name = $2;
    
    RETURN column_type;
END;
$$ LANGUAGE plpgsql;

-- Function to execute SQL
-- This is used by the db-fix.js script
CREATE OR REPLACE FUNCTION execute_sql(
    sql_statement TEXT
) RETURNS VOID AS $$
BEGIN
    EXECUTE sql_statement;
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- ======== ROW LEVEL SECURITY ========

-- Enable RLS on tables
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;

-- Game Sessions Policies
CREATE POLICY game_sessions_select_policy ON game_sessions
    FOR SELECT USING (TRUE);  -- Anyone can view game sessions

CREATE POLICY game_sessions_insert_policy ON game_sessions
    FOR INSERT WITH CHECK (
        -- Only TAs can create games
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_ta = TRUE
        )
    );

CREATE POLICY game_sessions_update_policy ON game_sessions
    FOR UPDATE USING (
        -- Only TAs can update games for their sections
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_ta = TRUE
            AND profiles.id = (
                SELECT ta_id FROM sections
                WHERE sections.id = game_sessions.section_id
            )
        )
    );

-- Game States Policies
CREATE POLICY game_states_select_policy ON game_states
    FOR SELECT USING (TRUE);  -- Anyone can view game states

CREATE POLICY game_states_insert_policy ON game_states
    FOR INSERT WITH CHECK (
        -- TAs can insert game states
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_ta = TRUE
        )
        -- Or users can insert their own game states
        OR user_id = auth.uid()::TEXT
        -- Or special TA user ID can insert game states
        OR user_id = '32bb7f40-5b33-4680-b0ca-76e64c5a23d9'
    );

CREATE POLICY game_states_update_policy ON game_states
    FOR UPDATE USING (
        -- TAs can update game states
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_ta = TRUE
        )
        -- Or users can update their own game states
        OR user_id = auth.uid()::TEXT
        -- Or special TA user ID can update game states
        OR user_id = '32bb7f40-5b33-4680-b0ca-76e64c5a23d9'
    );

-- Player States Policies
CREATE POLICY player_states_select_policy ON player_states
    FOR SELECT USING (
        -- Users can view their own player states
        user_id = auth.uid()::TEXT
        -- TAs can view player states for their sections
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_ta = TRUE
            AND EXISTS (
                SELECT 1 FROM game_sessions
                WHERE game_sessions.id = player_states.game_id
                AND game_sessions.section_id IN (
                    SELECT sections.id FROM sections
                    WHERE sections.ta_id = profiles.id
                )
            )
        )
    );

CREATE POLICY player_states_insert_policy ON player_states
    FOR INSERT WITH CHECK (
        -- Users can insert their own player states
        user_id = auth.uid()::TEXT
    );

CREATE POLICY player_states_update_policy ON player_states
    FOR UPDATE USING (
        -- Users can update their own player states
        user_id = auth.uid()::TEXT
    );

-- Game Participants Policies
CREATE POLICY game_participants_select_policy ON game_participants
    FOR SELECT USING (TRUE);  -- Anyone can view game participants

CREATE POLICY game_participants_insert_policy ON game_participants
    FOR INSERT WITH CHECK (
        -- Users can insert themselves as participants
        student_id = auth.uid()::TEXT
        -- TAs can insert participants for their sections
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_ta = TRUE
            AND EXISTS (
                SELECT 1 FROM game_sessions
                WHERE game_sessions.id = game_participants.game_id
                AND game_sessions.section_id IN (
                    SELECT sections.id FROM sections
                    WHERE sections.ta_id = profiles.id
                )
            )
        )
    );

CREATE POLICY game_participants_update_policy ON game_participants
    FOR UPDATE USING (
        -- Users can update their own participant records
        student_id = auth.uid()::TEXT
        -- TAs can update participants for their sections
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_ta = TRUE
            AND EXISTS (
                SELECT 1 FROM game_sessions
                WHERE game_sessions.id = game_participants.game_id
                AND game_sessions.section_id IN (
                    SELECT sections.id FROM sections
                    WHERE sections.ta_id = profiles.id
                )
            )
        )
    );
