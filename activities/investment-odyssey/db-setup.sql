-- Investment Odyssey Database Setup

-- Drop existing tables if they exist
DROP TABLE IF EXISTS leaderboard;
DROP TABLE IF EXISTS player_states;
DROP TABLE IF EXISTS game_states;
DROP TABLE IF EXISTS game_participants;
DROP TABLE IF EXISTS game_sessions;

-- Game Sessions Table
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  current_round INTEGER DEFAULT 0,
  max_rounds INTEGER DEFAULT 20,
  active BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game Participants Table
CREATE TABLE game_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  portfolio_value FLOAT DEFAULT 10000,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_id, student_id)
);

-- Game States Table
CREATE TABLE game_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  round_number INTEGER NOT NULL,
  asset_prices JSONB NOT NULL,
  price_history JSONB NOT NULL,
  cpi FLOAT NOT NULL,
  cpi_history JSONB NOT NULL,
  last_bitcoin_crash_round INTEGER DEFAULT 0,
  bitcoin_shock_range JSONB DEFAULT '[-0.5, -0.75]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_id, user_id, round_number)
);

-- Player States Table
CREATE TABLE player_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  cash FLOAT NOT NULL DEFAULT 10000,
  portfolio JSONB NOT NULL DEFAULT '{}',
  trade_history JSONB NOT NULL DEFAULT '[]',
  portfolio_value_history JSONB NOT NULL DEFAULT '[10000]',
  total_value FLOAT NOT NULL DEFAULT 10000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_id, user_id)
);

-- Leaderboard Table
CREATE TABLE leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  game_mode TEXT NOT NULL CHECK (game_mode IN ('single', 'class')),
  game_id UUID REFERENCES game_sessions(id) ON DELETE SET NULL,
  section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
  final_value FLOAT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

-- Row Level Security Policies

-- Game Sessions RLS
-- Temporarily disable RLS for testing
ALTER TABLE game_sessions DISABLE ROW LEVEL SECURITY;

-- Allow students to read game sessions for their section
CREATE POLICY game_sessions_student_read ON game_sessions
  FOR SELECT
  USING (
    section_id IN (
      SELECT section_id FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Allow students to insert game sessions for their section
CREATE POLICY game_sessions_student_insert ON game_sessions
  FOR INSERT
  WITH CHECK (
    section_id IN (
      SELECT section_id FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Allow students to update game sessions they created
CREATE POLICY game_sessions_student_update ON game_sessions
  FOR UPDATE
  USING (
    section_id IN (
      SELECT section_id FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Allow TAs to read and update game sessions for their sections
CREATE POLICY game_sessions_ta_read ON game_sessions
  FOR SELECT
  USING (
    section_id IN (
      SELECT id FROM sections
      WHERE ta_id = (
        SELECT custom_id FROM profiles
        WHERE id = auth.uid() AND role = 'ta'
      )
    )
  );

CREATE POLICY game_sessions_ta_update ON game_sessions
  FOR UPDATE
  USING (
    section_id IN (
      SELECT id FROM sections
      WHERE ta_id = (
        SELECT custom_id FROM profiles
        WHERE id = auth.uid() AND role = 'ta'
      )
    )
  );

-- Game States RLS
-- Temporarily disable RLS for testing
ALTER TABLE game_states DISABLE ROW LEVEL SECURITY;

-- Allow students to read game states for their games
CREATE POLICY game_states_student_read ON game_states
  FOR SELECT
  USING (
    game_id IN (
      SELECT id FROM game_sessions
      WHERE section_id = (
        SELECT section_id FROM profiles
        WHERE id = auth.uid()
      )
    )
  );

-- Allow students to insert game states for their games
CREATE POLICY game_states_student_insert ON game_states
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
  );

-- Allow students to update game states they created
CREATE POLICY game_states_student_update ON game_states
  FOR UPDATE
  USING (
    user_id = auth.uid()
  );

-- Player States RLS
-- Temporarily disable RLS for testing
ALTER TABLE player_states DISABLE ROW LEVEL SECURITY;

-- Allow students to read and update their own player states
CREATE POLICY player_states_student_read ON player_states
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY player_states_student_update ON player_states
  FOR UPDATE
  USING (user_id = auth.uid());

-- Allow students to insert their own player states
CREATE POLICY player_states_student_insert ON player_states
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Game Participants RLS
-- Temporarily disable RLS for testing
ALTER TABLE game_participants DISABLE ROW LEVEL SECURITY;

-- Allow students to read game participants for their games
CREATE POLICY game_participants_student_read ON game_participants
  FOR SELECT
  USING (
    game_id IN (
      SELECT id FROM game_sessions
      WHERE section_id = (
        SELECT section_id FROM profiles
        WHERE id = auth.uid()
      )
    )
  );

-- Allow students to insert themselves as participants
CREATE POLICY game_participants_student_insert ON game_participants
  FOR INSERT
  WITH CHECK (
    game_id IN (
      SELECT id FROM game_sessions
      WHERE section_id = (
        SELECT section_id FROM profiles
        WHERE id = auth.uid()
      )
    )
  );

-- Allow students to update their own participant records
CREATE POLICY game_participants_student_update ON game_participants
  FOR UPDATE
  USING (
    student_id = auth.uid() OR
    student_id = (
      SELECT custom_id FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Leaderboard RLS
-- Temporarily disable RLS for testing
ALTER TABLE leaderboard DISABLE ROW LEVEL SECURITY;

-- Allow everyone to read the leaderboard
CREATE POLICY leaderboard_read ON leaderboard
  FOR SELECT
  USING (true);

-- Allow students to insert their own scores
CREATE POLICY leaderboard_student_insert ON leaderboard
  FOR INSERT
  WITH CHECK (user_id = auth.uid());
