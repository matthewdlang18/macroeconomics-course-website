-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  custom_id TEXT UNIQUE,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'ta', 'admin')),
  section_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on role for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Create index on section_id for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_section_id ON profiles(section_id);

-- Add RLS policies for profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY profiles_read_own ON profiles
  FOR SELECT
  USING (id = auth.uid());

-- Allow users to update their own profile
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE
  USING (id = auth.uid());

-- Allow TAs to read profiles of students in their sections
CREATE POLICY profiles_ta_read_students ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'ta' AND
      section_id IN (
        SELECT id FROM sections
        WHERE ta_id = p.id
      )
    )
  );

-- Allow admins to manage all profiles
CREATE POLICY profiles_admin_all ON profiles
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
