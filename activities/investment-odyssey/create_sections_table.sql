-- Create sections table if it doesn't exist
CREATE TABLE IF NOT EXISTS sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day TEXT NOT NULL,
  time TEXT NOT NULL,
  location TEXT,
  ta_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on ta_id for faster queries
CREATE INDEX IF NOT EXISTS idx_sections_ta_id ON sections(ta_id);

-- Create index on day and time for faster sorting
CREATE INDEX IF NOT EXISTS idx_sections_day_time ON sections(day, time);

-- Add RLS policies for sections table
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read sections
CREATE POLICY sections_read ON sections
  FOR SELECT
  USING (true);

-- Allow TAs to create sections
CREATE POLICY sections_ta_insert ON sections
  FOR INSERT
  WITH CHECK (
    ta_id = (
      SELECT id FROM profiles
      WHERE id = auth.uid() AND role = 'ta'
    )
  );

-- Allow TAs to update their own sections
CREATE POLICY sections_ta_update ON sections
  FOR UPDATE
  USING (
    ta_id = (
      SELECT id FROM profiles
      WHERE id = auth.uid() AND role = 'ta'
    )
  );

-- Allow admins to manage all sections
CREATE POLICY sections_admin_all ON sections
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
