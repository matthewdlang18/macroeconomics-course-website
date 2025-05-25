#!/bin/bash

# Activity 5 Database Verification Script
# This script verifies that all Activity 5 tables were created correctly

echo "Verifying Activity 5 database tables..."

# Check if required environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "Error: SUPABASE_URL and SUPABASE_ANON_KEY environment variables must be set"
    exit 1
fi

# Function to check if table exists
check_table() {
    local table_name="$1"
    local description="$2"
    
    echo "  → Checking $description"
    
    response=$(curl -s -X POST \
        -H "apikey: $SUPABASE_ANON_KEY" \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '$table_name');\"}" \
        "$SUPABASE_URL/rest/v1/rpc/execute_sql")
    
    if echo "$response" | grep -q '"result":\[{"exists":true}\]'; then
        echo "    ✓ Table '$table_name' exists"
        return 0
    else
        echo "    ✗ Table '$table_name' NOT FOUND"
        return 1
    fi
}

# Function to check table structure
check_table_structure() {
    local table_name="$1"
    local expected_columns="$2"
    
    echo "  → Checking structure of $table_name"
    
    response=$(curl -s -X POST \
        -H "apikey: $SUPABASE_ANON_KEY" \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"SELECT column_name FROM information_schema.columns WHERE table_name = '$table_name' ORDER BY ordinal_position;\"}" \
        "$SUPABASE_URL/rest/v1/rpc/execute_sql")
    
    for column in $expected_columns; do
        if echo "$response" | grep -q "\"column_name\":\"$column\""; then
            echo "    ✓ Column '$column' exists"
        else
            echo "    ✗ Column '$column' missing"
        fi
    done
}

echo ""
echo "=== Activity 5 Table Verification ==="
echo ""

# Check all tables
tables_ok=0

# Conversations table
if check_table "activity5_conversations" "AI conversations table"; then
    check_table_structure "activity5_conversations" "id student_id section conversation_data last_updated created_at"
    ((tables_ok++))
fi
echo ""

# Group reflections table
if check_table "activity5_group_reflections" "Group reflections table"; then
    check_table_structure "activity5_group_reflections" "id student_id section ai_insights challenges improvements submitted_at"
    ((tables_ok++))
fi
echo ""

# Study guides table
if check_table "activity5_study_guides" "Study guides table"; then
    check_table_structure "activity5_study_guides" "id student_id section questions_data created_at updated_at"
    ((tables_ok++))
fi
echo ""

# Access log table
if check_table "activity5_access_log" "Access log table"; then
    check_table_structure "activity5_access_log" "id student_id section access_time activity_type session_data"
    ((tables_ok++))
fi
echo ""

# Summary
echo "=== Verification Summary ==="
echo "Tables found: $tables_ok/4"

if [ $tables_ok -eq 4 ]; then
    echo "✓ All Activity 5 tables are properly set up!"
    echo ""
    echo "Activity 5 is ready to use:"
    echo "  • Student Activity: activities/activity5/"
    echo "  • TA Dashboard: activities/activity5/ta-dashboard.html"
    exit 0
else
    echo "✗ Some tables are missing. Please run setup_activity5_tables.sh"
    exit 1
fi
