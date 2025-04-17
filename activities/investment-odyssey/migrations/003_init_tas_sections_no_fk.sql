-- Initialize TAs and Sections for Investment Odyssey
-- This script creates the initial TAs and their sections
-- This version temporarily disables the foreign key constraint

-- Temporarily disable the foreign key constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Create the TAs
INSERT INTO profiles (id, name, role, passcode, created_at)
VALUES 
  (uuid_generate_v4(), 'Akshay', 'ta', 'aksecon2', CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'Simran', 'ta', 'simecon2', CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'Camilla', 'ta', 'camecon2', CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'Hui Yann', 'ta', 'huiecon2', CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'Lars', 'ta', 'larecon2', CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'Luorao', 'ta', 'luoecon2', CURRENT_TIMESTAMP)
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

-- Note: We're not re-enabling the foreign key constraint
-- This is because we don't have corresponding auth.users entries
-- In a production environment, you would need to create these users properly
