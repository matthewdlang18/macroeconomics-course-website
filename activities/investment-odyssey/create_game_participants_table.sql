-- Create game_participants table if it doesn't exist
CREATE TABLE IF NOT EXISTS game_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  portfolio_value FLOAT DEFAULT 0,
  cash FLOAT DEFAULT 10000,
  total_value FLOAT DEFAULT 10000,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_id, student_id)
);

-- Create index on game_id for faster queries
CREATE INDEX IF NOT EXISTS idx_game_participants_game_id ON game_participants(game_id);

-- Create index on student_id for faster queries
CREATE INDEX IF NOT EXISTS idx_game_participants_student_id ON game_participants(student_id);

-- Add RLS policies for game_participants table
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;

-- Allow students to read their own participation
CREATE POLICY game_participants_student_read_own ON game_participants
  FOR SELECT
  USING (student_id = auth.uid());

-- Allow students to insert their own participation
CREATE POLICY game_participants_student_insert_own ON game_participants
  FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- Allow students to update their own participation
CREATE POLICY game_participants_student_update_own ON game_participants
  FOR UPDATE
  USING (student_id = auth.uid());

-- Allow TAs to read participants in their games
CREATE POLICY game_participants_ta_read ON game_participants
  FOR SELECT
  USING (
    game_id IN (
      SELECT gs.id FROM game_sessions gs
      JOIN sections s ON gs.section_id = s.id
      WHERE s.ta_id = (
        SELECT id FROM profiles
        WHERE id = auth.uid() AND role = 'ta'
      )
    )
  );

-- Allow admins to manage all participants
CREATE POLICY game_participants_admin_all ON game_participants
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
