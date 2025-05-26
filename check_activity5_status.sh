#!/bin/bash

# Comprehensive Activity 5 Status Check
echo "=== Activity 5 System Status Check ==="
echo ""

# Check environment variables
echo "1. Environment Variables:"
if [ -z "$SUPABASE_URL" ]; then
    echo "   ❌ SUPABASE_URL not set"
else
    echo "   ✅ SUPABASE_URL set"
fi

if [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "   ❌ SUPABASE_ANON_KEY not set"
else
    echo "   ✅ SUPABASE_ANON_KEY set"
fi

echo ""

# Check database tables
echo "2. Database Tables:"

# Activity 5 tables
tables=("activity5_conversations" "activity5_group_reflections" "activity5_study_guides" "activity5_access_log")
for table in "${tables[@]}"; do
    response=$(curl -s -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $SUPABASE_ANON_KEY" "$SUPABASE_URL/rest/v1/$table?limit=1" 2>/dev/null)
    if echo "$response" | grep -q '\['; then
        echo "   ✅ $table exists"
    else
        echo "   ❌ $table missing or inaccessible"
    fi
done

# Profiles table
response=$(curl -s -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $SUPABASE_ANON_KEY" "$SUPABASE_URL/rest/v1/profiles?role=eq.student&limit=1" 2>/dev/null)
if echo "$response" | grep -q '\['; then
    echo "   ✅ profiles table exists"
else
    echo "   ❌ profiles table missing or inaccessible"
fi

echo ""

# Check student data
echo "3. Student Data:"
student_count=$(curl -s -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $SUPABASE_ANON_KEY" "$SUPABASE_URL/rest/v1/profiles?role=eq.student&select=count" | jq -r '.[0].count' 2>/dev/null)

if [ "$student_count" ] && [ "$student_count" -gt 0 ]; then
    echo "   ✅ $student_count students found in database"
    
    # Get sample students
    echo "   Sample students for testing:"
    curl -s -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $SUPABASE_ANON_KEY" "$SUPABASE_URL/rest/v1/profiles?role=eq.student&limit=3&select=name,passcode" | jq -r '.[] | "     - Name: \(.name), Passcode: \(.passcode)"' 2>/dev/null
else
    echo "   ❌ No students found in database"
fi

echo ""

# Check file structure
echo "4. File Structure:"
required_files=(
    "activities/activity5/index.html"
    "activities/activity5/js/auth.js"
    "activities/activity5/js/activity.js"
    "js/env.js"
    "js/supabase-init.js"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file exists"
    else
        echo "   ❌ $file missing"
    fi
done

echo ""

# Test authentication
echo "5. Authentication Test:"
if [ "$student_count" ] && [ "$student_count" -gt 0 ]; then
    # Get first student for test
    test_student=$(curl -s -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $SUPABASE_ANON_KEY" "$SUPABASE_URL/rest/v1/profiles?role=eq.student&limit=1" | jq -r '.[0] | "\(.name)|\(.passcode)"' 2>/dev/null)
    
    if [ "$test_student" ] && [ "$test_student" != "null|null" ]; then
        name=$(echo "$test_student" | cut -d'|' -f1)
        passcode=$(echo "$test_student" | cut -d'|' -f2)
        
        # Test auth query
        auth_test=$(curl -s -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $SUPABASE_ANON_KEY" "$SUPABASE_URL/rest/v1/profiles?name=eq.$name&passcode=eq.$passcode&role=eq.student" | jq length 2>/dev/null)
        
        if [ "$auth_test" = "1" ]; then
            echo "   ✅ Authentication query works"
            echo "   Test credentials: Name=$name, Passcode=$passcode"
        else
            echo "   ❌ Authentication query failed"
        fi
    else
        echo "   ❌ Cannot get test student data"
    fi
else
    echo "   ⚠️  Skipped - no students in database"
fi

echo ""

# Summary
echo "=== Status Summary ==="
echo "The Activity 5 authentication system has been configured to work with the existing database schema."
echo ""
echo "Key Changes Made:"
echo "• Updated authentication to use 'profiles' table instead of 'students'"
echo "• Changed from 'studentId' to 'studentName' throughout the system"
echo "• Added role='student' filter for security"
echo "• Created Activity 5 specific tables for data storage"
echo "• Added static section list instead of database query"
echo ""
echo "To test the system:"
echo "1. Open: activities/activity5/index.html"
echo "2. Use the test credentials shown above"
echo "3. Select any section from the dropdown"
echo "4. Click 'Sign In' to access the activity"
echo ""
echo "For debugging, use:"
echo "• test_auth_debug.html - Basic auth testing"
echo "• test_full_auth.html - Complete system test"
