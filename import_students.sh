#!/bin/bash

# Import student data from CSV to Supabase profiles table
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

# Skip header line and process each student
tail -n +2 "$CSV_FILE" | while IFS=',' read -r name role passcode; do
    echo "  → Processing student: $name (role: $role, passcode: $passcode)"
    
    # Skip empty lines
    if [ -z "$name" ] || [ -z "$role" ] || [ -z "$passcode" ]; then
        echo "    ⚠ Skipping empty or incomplete record"
        continue
    fi
    
    # Generate a UUID for the student (using a simple hash of the name)
    # In a real system, you'd use proper UUIDs
    student_id=$(echo -n "$name" | md5sum | cut -c1-32)
    student_id="${student_id:0:8}-${student_id:8:4}-${student_id:12:4}-${student_id:16:4}-${student_id:20:12}"
    
    # Clean up variables (remove any whitespace or quotes)
    name=$(echo "$name" | tr -d '"' | xargs)
    role=$(echo "$role" | tr -d '"' | xargs)
    passcode=$(echo "$passcode" | tr -d '"' | xargs)
    
    # Create JSON payload using jq for proper JSON formatting
    json_payload=$(jq -n \
        --arg id "$student_id" \
        --arg name "$name" \
        --arg role "$role" \
        --arg passcode "$passcode" \
        --arg created_at "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")" \
        '{
            id: $id,
            name: $name,
            role: $role,
            passcode: $passcode,
            created_at: $created_at,
            last_login: null
        }')
    
    # Debug: show the payload
    echo "    JSON payload: $json_payload"
    
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
    elif echo "$response" | grep -q '"code":"23505"'; then
        echo "    ⚠ Profile already exists for $name"
    else
        echo "    ✗ Failed to create profile for $name"
        echo "    Response: $response"
    fi
done

echo ""
echo "Student import completed!"
echo ""
echo "To verify the import, you can check the profiles table in your Supabase dashboard."
echo "Example students you can use to test:"
echo "  - Name: melrose, Passcode: 10036"
echo "  - Name: emilytucker, Passcode: 10065"
echo "  - Name: kaia_hayes, Passcode: 10080"
