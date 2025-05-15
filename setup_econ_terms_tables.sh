#!/bin/bash

# Setup script for Econ Terms game tables in Supabase
# This script requires the Supabase CLI to be installed and configured

# Function to display usage instructions
show_usage() {
    echo "Usage options:"
    echo "1. Using Supabase CLI (recommended):"
    echo "   ./setup_econ_terms_tables.sh"
    echo ""
    echo "2. Using Service Role Key (alternative):"
    echo "   SUPABASE_URL=https://your-project-id.supabase.co SUPABASE_KEY=your-service-role-key ./setup_econ_terms_tables.sh service-key"
    echo ""
    echo "3. Using SQL Editor in Supabase Dashboard:"
    echo "   Copy the contents of create_econ_terms_leaderboard.sql and create_econ_terms_user_stats.sql"
    echo "   Paste into the SQL Editor in the Supabase Dashboard and execute"
}

# Check if help flag is provided
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
    show_usage
    exit 0
fi

echo "Setting up Econ Terms game tables in Supabase..."

if [ "$1" == "service-key" ]; then
    # Check if SUPABASE_URL and SUPABASE_KEY environment variables are set
    if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
        echo "Error: SUPABASE_URL and SUPABASE_KEY environment variables must be set"
        show_usage
        exit 1
    fi

    # Using REST API with service key
    echo "Using provided service key to execute SQL..."
    
    echo "Creating econ_terms_leaderboard table..."
    curl -X POST \
      "${SUPABASE_URL}/rest/v1/rpc/pg_dump" \
      -H "apikey: ${SUPABASE_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_KEY}" \
      -H "Content-Type: text/plain" \
      --data-binary @create_econ_terms_leaderboard.sql
    
    echo "Creating econ_terms_user_stats table..."
    curl -X POST \
      "${SUPABASE_URL}/rest/v1/rpc/pg_dump" \
      -H "apikey: ${SUPABASE_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_KEY}" \
      -H "Content-Type: text/plain" \
      --data-binary @create_econ_terms_user_stats.sql
else
    # Using Supabase CLI
    if ! command -v supabase &> /dev/null; then
        echo "Error: Supabase CLI not found. Please install it first:"
        echo "npm install -g supabase"
        echo "Or see alternative methods below:"
        show_usage
        exit 1
    fi
    
    # Execute the SQL files to create the tables
    echo "Creating econ_terms_leaderboard table..."
    supabase sql < create_econ_terms_leaderboard.sql
    
    echo "Creating econ_terms_user_stats table..."
    supabase sql < create_econ_terms_user_stats.sql
fi

echo "Setup complete!"
echo ""
echo "IMPORTANT: Verify that the tables were created successfully in your Supabase dashboard."
echo "If you encounter errors, try running the SQL files manually through the Supabase SQL Editor."
