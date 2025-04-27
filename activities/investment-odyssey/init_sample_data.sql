-- Initialize sample data for testing

-- Insert sample TAs
INSERT INTO profiles (id, name, email, custom_id, role)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Akshay', 'akshay@example.com', 'ta_akshay', 'ta'),
  ('00000000-0000-0000-0000-000000000002', 'Simran', 'simran@example.com', 'ta_simran', 'ta'),
  ('00000000-0000-0000-0000-000000000003', 'Camilla', 'camilla@example.com', 'ta_camilla', 'ta'),
  ('00000000-0000-0000-0000-000000000004', 'Hui Yann', 'huiyann@example.com', 'ta_huiyann', 'ta'),
  ('00000000-0000-0000-0000-000000000005', 'Lars', 'lars@example.com', 'ta_lars', 'ta')
ON CONFLICT (id) DO NOTHING;

-- Insert sample sections
INSERT INTO sections (id, day, time, location, ta_id)
VALUES 
  ('00000000-0000-0000-0000-000000000101', 'Monday', '10:00-11:30', 'Room 101', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000102', 'Tuesday', '13:00-14:30', 'Room 102', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000103', 'Wednesday', '15:00-16:30', 'Room 103', '00000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000104', 'Thursday', '10:00-11:30', 'Room 104', '00000000-0000-0000-0000-000000000004'),
  ('00000000-0000-0000-0000-000000000105', 'Friday', '13:00-14:30', 'Room 105', '00000000-0000-0000-0000-000000000005')
ON CONFLICT (id) DO NOTHING;

-- Insert sample students
INSERT INTO profiles (id, name, email, role, section_id)
VALUES 
  ('00000000-0000-0000-0000-000000000201', 'Student 1', 'student1@example.com', 'student', '00000000-0000-0000-0000-000000000101'),
  ('00000000-0000-0000-0000-000000000202', 'Student 2', 'student2@example.com', 'student', '00000000-0000-0000-0000-000000000101'),
  ('00000000-0000-0000-0000-000000000203', 'Student 3', 'student3@example.com', 'student', '00000000-0000-0000-0000-000000000102'),
  ('00000000-0000-0000-0000-000000000204', 'Student 4', 'student4@example.com', 'student', '00000000-0000-0000-0000-000000000102'),
  ('00000000-0000-0000-0000-000000000205', 'Student 5', 'student5@example.com', 'student', '00000000-0000-0000-0000-000000000103')
ON CONFLICT (id) DO NOTHING;

-- Insert sample game sessions
INSERT INTO game_sessions (id, section_id, current_round, max_rounds, status)
VALUES 
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000101', 0, 20, 'active'),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000102', 2, 20, 'active'),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000103', 5, 20, 'completed')
ON CONFLICT (id) DO NOTHING;

-- Insert sample game participants
INSERT INTO game_participants (game_id, student_id, student_name, portfolio_value, cash, total_value)
VALUES 
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000201', 'Student 1', 5000, 5000, 10000),
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000202', 'Student 2', 6000, 4000, 10000),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000203', 'Student 3', 7000, 3000, 10000),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000204', 'Student 4', 8000, 2000, 10000)
ON CONFLICT (game_id, student_id) DO NOTHING;
