#!/bin/bash

# Activity 5 Database Setup Script
# This script sets up the Supabase tables for Activity 5 - AI Exam Generator

echo "Setting up Activity 5 database tables..."

# Check if required environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "Error: SUPABASE_URL and SUPABASE_ANON_KEY environment variables must be set"
    echo "Please add them to your .env file or export them:"
    echo "export SUPABASE_URL='your-supabase-url'"
    echo "export SUPABASE_ANON_KEY='your-supabase-anon-key'"
    exit 1
fi

# Function to execute SQL
execute_sql() {
    local sql="$1"
    local description="$2"
    
    echo "  → $description"
    
    response=$(curl -s -X POST \
        -H "apikey: $SUPABASE_ANON_KEY" \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"$sql\"}" \
        "$SUPABASE_URL/rest/v1/rpc/execute_sql")
    
    if echo "$response" | grep -q '"error"'; then
        echo "    ✗ Error: $response"
        return 1
    else
        echo "    ✓ Success"
        return 0
    fi
}

# Create conversations table
echo "Creating activity5_conversations table..."
execute_sql "
CREATE TABLE IF NOT EXISTS activity5_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id TEXT NOT NULL,
    section TEXT NOT NULL,
    conversation_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, section)
);
" "Conversations table"

# Create group reflections table
echo "Creating activity5_group_reflections table..."
execute_sql "
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
" "Group reflections table"

# Create study guides table
echo "Creating activity5_study_guides table..."
execute_sql "
CREATE TABLE IF NOT EXISTS activity5_study_guides (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id TEXT NOT NULL,
    section TEXT NOT NULL,
    questions_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, section)
);
" "Study guides table"

# Create access log table
echo "Creating activity5_access_log table..."
execute_sql "
CREATE TABLE IF NOT EXISTS activity5_access_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id TEXT NOT NULL,
    section TEXT NOT NULL,
    access_time TIMESTAMPTZ DEFAULT NOW(),
    activity_type TEXT NOT NULL,
    session_data JSONB DEFAULT '{}'::jsonb
);
" "Access log table"

# Create indexes
echo "Creating indexes for better performance..."

execute_sql "
CREATE INDEX IF NOT EXISTS idx_activity5_conversations_student 
    ON activity5_conversations(student_id, section);
" "Conversations student index"

execute_sql "
CREATE INDEX IF NOT EXISTS idx_activity5_reflections_student 
    ON activity5_group_reflections(student_id, section);
" "Reflections student index"

execute_sql "
CREATE INDEX IF NOT EXISTS idx_activity5_study_guides_student 
    ON activity5_study_guides(student_id, section);
" "Study guides student index"

execute_sql "
CREATE INDEX IF NOT EXISTS idx_activity5_access_log_student 
    ON activity5_access_log(student_id, section, access_time);
" "Access log student index"

execute_sql "
CREATE INDEX IF NOT EXISTS idx_activity5_access_log_time 
    ON activity5_access_log(access_time DESC);
" "Access log time index"

echo ""
echo "Activity 5 database setup completed!"
echo ""
echo "Tables created:"
echo "  • activity5_conversations - Stores AI conversation history"
echo "  • activity5_group_reflections - Stores group reflection responses"
echo "  • activity5_study_guides - Stores student-created study guides"
echo "  • activity5_access_log - Logs student access for analytics"
echo ""
echo "You can now use Activity 5 with full database integration."
echo "Access the activity at: activities/activity5/"
echo "Access the TA dashboard at: activities/activity5/ta-dashboard.html"
