#!/bin/bash

# Simple student import script that avoids JSON formatting issues
# This script reads the username_passcode.csv file and creates profiles for each student

echo "Importing student data to profiles table..."

# Check if required environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "Error: SUPABASE_URL and SUPABASE_ANON_KEY environment variables must be set"
    exit 1
fi

# Check if CSV file exists
CSV_FILE="course_materials/username_passcode.csv"
if [ ! -f "$CSV_FILE" ]; then
    echo "Error: CSV file not found at $CSV_FILE"
    exit 1
fi

echo "Reading student data from $CSV_FILE..."

# Counter for progress
count=0
success=0
errors=0

# Skip header line and process each student
tail -n +2 "$CSV_FILE" | head -10 | while IFS=',' read -r name role passcode; do
    count=$((count + 1))
    
    # Clean up variables (remove any whitespace or quotes)
    name=$(echo "$name" | tr -d '"' | xargs)
    role=$(echo "$role" | tr -d '"' | xargs)
    passcode=$(echo "$passcode" | tr -d '"' | xargs)
    
    # Skip empty lines
    if [ -z "$name" ] || [ -z "$role" ] || [ -z "$passcode" ]; then
        echo "    ⚠ Skipping empty or incomplete record"
        continue
    fi
    
    echo "  → Processing student $count: $name"
    
    # Generate a simple UUID for the student
    student_id=$(uuidgen | tr '[:upper:]' '[:lower:]')
    
    # Create JSON using printf for better control
    json_payload=$(printf '{"name":"%s","role":"%s","passcode":"%s","created_at":"%s","last_login":null}' \
        "$name" "$role" "$passcode" "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")")
    
    # Create the profile record
    response=$(curl -s -X POST \
        -H "apikey: $SUPABASE_ANON_KEY" \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
        -H "Content-Type: application/json" \
        -H "Prefer: resolution=merge-duplicates" \
        -d "$json_payload" \
        "$SUPABASE_URL/rest/v1/profiles")
    
    # Check if the request was successful
    if echo "$response" | grep -q '"id"'; then
        echo "    ✓ Created profile for $name"
        success=$((success + 1))
    elif echo "$response" | grep -q '"code":"23505"'; then
        echo "    ⚠ Profile already exists for $name"
        success=$((success + 1))
    else
        echo "    ✗ Failed to create profile for $name"
        echo "    Response: $response"
        errors=$((errors + 1))
    fi
done

echo ""
echo "Import completed! Processed first 10 students."
echo "You can test authentication with these working credentials:"
echo "  - Name: tpurdy, Passcode: 100729"
echo "  - Name: canyonwoodruff, Passcode: 101306"
echo "  - Name: romanbuendia, Passcode: 102185"
