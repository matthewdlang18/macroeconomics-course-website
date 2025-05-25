-- Activity 5 Database Setup: AI Exam Generator Tables
-- Run this script in your Supabase SQL Editor to create the necessary tables

-- Table for tracking AI conversations
CREATE TABLE IF NOT EXISTS activity5_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id TEXT NOT NULL,
    section TEXT NOT NULL,
    conversation_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, section)
);

-- Table for group reflections
CREATE TABLE IF NOT EXISTS activity5_group_reflections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id TEXT NOT NULL,
    section TEXT NOT NULL,
    ai_insights TEXT NOT NULL,
    challenges TEXT NOT NULL,
    improvements TEXT NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, section)
);

-- Table for study guides
CREATE TABLE IF NOT EXISTS activity5_study_guides (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id TEXT NOT NULL,
    section TEXT NOT NULL,
    questions_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, section)
);

-- Table for access logging and analytics
CREATE TABLE IF NOT EXISTS activity5_access_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id TEXT NOT NULL,
    section TEXT NOT NULL,
    access_time TIMESTAMPTZ DEFAULT NOW(),
    activity_type TEXT NOT NULL, -- 'login', 'chat', 'reflection', 'study_guide'
    session_data JSONB DEFAULT '{}'::jsonb
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activity5_conversations_student 
    ON activity5_conversations(student_id, section);

CREATE INDEX IF NOT EXISTS idx_activity5_reflections_student 
    ON activity5_group_reflections(student_id, section);

CREATE INDEX IF NOT EXISTS idx_activity5_study_guides_student 
    ON activity5_study_guides(student_id, section);

CREATE INDEX IF NOT EXISTS idx_activity5_access_log_student 
    ON activity5_access_log(student_id, section, access_time);

CREATE INDEX IF NOT EXISTS idx_activity5_access_log_time 
    ON activity5_access_log(access_time DESC);

-- Add foreign key constraints (assuming students and ta_sections tables exist)
-- Note: Uncomment these if you want strict foreign key enforcement
-- ALTER TABLE activity5_conversations 
--     ADD CONSTRAINT fk_conversations_student 
--     FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE;

-- ALTER TABLE activity5_group_reflections 
--     ADD CONSTRAINT fk_reflections_student 
--     FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE;

-- ALTER TABLE activity5_study_guides 
--     ADD CONSTRAINT fk_study_guides_student 
--     FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE;

-- ALTER TABLE activity5_access_log 
--     ADD CONSTRAINT fk_access_log_student 
--     FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE;

-- Row Level Security (RLS) - Enable if needed for security
-- ALTER TABLE activity5_conversations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE activity5_group_reflections ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE activity5_study_guides ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE activity5_access_log ENABLE ROW LEVEL SECURITY;

-- Sample RLS policies (uncomment and adjust as needed)
-- CREATE POLICY "Students can view own conversations" ON activity5_conversations
--     FOR SELECT USING (auth.jwt() ->> 'student_id' = student_id);

-- CREATE POLICY "Students can insert own conversations" ON activity5_conversations
--     FOR INSERT WITH CHECK (auth.jwt() ->> 'student_id' = student_id);

-- CREATE POLICY "Students can update own conversations" ON activity5_conversations
--     FOR UPDATE USING (auth.jwt() ->> 'student_id' = student_id);

COMMENT ON TABLE activity5_conversations IS 'Stores AI conversation history for each student';
COMMENT ON TABLE activity5_group_reflections IS 'Stores group reflection responses';
COMMENT ON TABLE activity5_study_guides IS 'Stores student-created study guide questions';
COMMENT ON TABLE activity5_access_log IS 'Logs student access and activity for analytics';
