#!/bin/bash

# Check database structure to understand authentication

echo "Checking database structure..."

# Check if required environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "Error: SUPABASE_URL and SUPABASE_ANON_KEY environment variables must be set"
    exit 1
fi

# Function to run SQL query
run_query() {
    local query="$1"
    local description="$2"
    
    echo "  → $description"
    
    response=$(curl -s -X POST \
        -H "apikey: $SUPABASE_ANON_KEY" \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"$query\"}" \
        "$SUPABASE_URL/rest/v1/rpc/execute_sql")
    
    echo "$response" | jq '.result' 2>/dev/null || echo "$response"
    echo ""
}

# Check what tables exist
run_query "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" "Available tables"

# Check profiles table structure
run_query "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles' ORDER BY ordinal_position;" "Profiles table structure"

# Check sections table structure (if it exists)
run_query "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'sections' ORDER BY ordinal_position;" "Sections table structure"

# Check if there's a students table
run_query "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'students' ORDER BY ordinal_position;" "Students table structure (if exists)"

# Check if there's a ta_sections table
run_query "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'ta_sections' ORDER BY ordinal_position;" "TA Sections table structure (if exists)"

echo "Database structure check completed!"
