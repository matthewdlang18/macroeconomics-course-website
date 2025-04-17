-- Initialize TAs and Sections for Investment Odyssey
-- This script creates the initial TAs and their sections

-- IMPORTANT: This script assumes you've already created users through the Supabase Auth UI or API
-- For each TA, you should have created a user with the corresponding email address

-- First, create the TAs in the profiles table
-- We'll use hardcoded UUIDs for simplicity in this example
-- In a real application, you would get these IDs from the auth.users table

-- Create the TAs
INSERT INTO profiles (id, name, role, passcode, created_at)
VALUES
  -- Replace these UUIDs with actual user IDs from your auth.users table
  -- or remove the foreign key constraint temporarily
  ('11111111-1111-1111-1111-111111111111', 'Akshay', 'ta', 'aksecon2', CURRENT_TIMESTAMP),
  ('22222222-2222-2222-2222-222222222222', 'Simran', 'ta', 'simecon2', CURRENT_TIMESTAMP),
  ('33333333-3333-3333-3333-333333333333', 'Camilla', 'ta', 'camecon2', CURRENT_TIMESTAMP),
  ('44444444-4444-4444-4444-444444444444', 'Hui Yann', 'ta', 'huiecon2', CURRENT_TIMESTAMP),
  ('55555555-5555-5555-5555-555555555555', 'Lars', 'ta', 'larecon2', CURRENT_TIMESTAMP),
  ('66666666-6666-6666-6666-666666666666', 'Luorao', 'ta', 'luoecon2', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Get the TA IDs for reference in sections
WITH ta_ids AS (
  SELECT id, name FROM profiles WHERE role = 'ta'
)
-- Now create the sections
INSERT INTO sections (id, day, time, location, ta_id, created_at)
SELECT
  uuid_generate_v4(),
  day,
  time,
  location,
  ta.id,
  CURRENT_TIMESTAMP
FROM (
  VALUES
    ('Tuesday', '5:00pm-5:50pm', 'Phelps, 1425', 'Akshay'),
    ('Tuesday', '5:00pm-5:50pm', 'Girvetz, 2128', 'Simran'),
    ('Tuesday', '5:00pm-5:50pm', 'Phelps, 1508', 'Camilla'),
    ('Tuesday', '5:00pm-5:50pm', 'Building 387, 1015', 'Hui Yann'),
    ('Tuesday', '6:00pm-6:50pm', 'Phelps, 1508', 'Akshay'),
    ('Wednesday', '6:00pm-6:50pm', 'Phelps, 1425', 'Lars'),
    ('Wednesday', '6:00pm-6:50pm', 'South Hall, 1430', 'Luorao'),
    ('Wednesday', '6:00pm-6:50pm', 'Ellison, 2626', 'Simran'),
    ('Wednesday', '6:00pm-6:50pm', 'Girvetz, 2128', 'Camilla'),
    ('Wednesday', '7:00pm-7:50pm', 'North Hall, 1109', 'Hui Yann'),
    ('Thursday', '6:00pm-6:50pm', 'Phelps, 2524', 'Luorao'),
    ('Thursday', '6:00pm-6:50pm', 'Phelps, 1425', 'Akshay'),
    ('Friday', '12:00pm-12:50pm', 'Arts, 1349', 'Simran'),
    ('Friday', '12:00pm-12:50pm', 'Phelps, 1425', 'Camilla'),
    ('Friday', '12:00pm-12:50pm', 'South Hall, 1430', 'Hui Yann'),
    ('Friday', '12:00pm-12:50pm', 'Ellison, 2626', 'Lars')
) AS sections(day, time, location, ta_name)
JOIN ta_ids ta ON ta.name = sections.ta_name;

-- Verify the data was inserted
SELECT 'TAs created: ' || COUNT(*)::text FROM profiles WHERE role = 'ta';
SELECT 'Sections created: ' || COUNT(*)::text FROM sections;
