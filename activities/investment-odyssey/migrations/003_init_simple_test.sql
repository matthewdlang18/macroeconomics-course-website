-- Simple Test Initialization for Investment Odyssey
-- This script creates a single TA and section for testing

-- Temporarily disable the foreign key constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Create a test TA
INSERT INTO profiles (id, name, role, passcode, created_at)
VALUES (uuid_generate_v4(), 'Test TA', 'ta', 'testecon2', CURRENT_TIMESTAMP);

-- Get the TA ID
DO $$
DECLARE
  ta_id UUID;
BEGIN
  SELECT id INTO ta_id FROM profiles WHERE name = 'Test TA' AND role = 'ta';
  
  -- Create a test section
  INSERT INTO sections (id, day, time, location, ta_id, created_at)
  VALUES (uuid_generate_v4(), 'Monday', '10:00am-10:50am', 'Test Room', ta_id, CURRENT_TIMESTAMP);
END;
$$;

-- Verify the data was inserted
SELECT * FROM profiles WHERE role = 'ta';
SELECT * FROM sections;
