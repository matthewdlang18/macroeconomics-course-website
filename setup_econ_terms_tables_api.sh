#!/bin/bash

# Quick setup script for Econ Terms tables using the Supabase API directly
# This is useful when you don't have the Supabase CLI installed

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Econ Words Tables Quick Setup${NC}"
echo "This script will set up the required Supabase tables for the Econ Words game"
echo ""

# Ask for Supabase URL and key
read -p "Enter your Supabase URL (e.g., https://your-project-id.supabase.co): " SUPABASE_URL
read -p "Enter your Supabase service role key (starts with 'eyJ...'): " SUPABASE_KEY

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
    echo -e "${RED}Error: Both URL and key are required.${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Setting up tables...${NC}"

# Read the SQL files
LEADERBOARD_SQL=$(cat create_econ_terms_leaderboard.sql)
USER_STATS_SQL=$(cat create_econ_terms_user_stats.sql)

# Execute the leaderboard table SQL
echo "Creating econ_terms_leaderboard table..."
curl -s -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/pg_dump" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: text/plain" \
  -d "${LEADERBOARD_SQL}" > /dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Leaderboard table creation request sent${NC}"
else
    echo -e "${RED}× Failed to create leaderboard table${NC}"
fi

# Execute the user stats table SQL
echo "Creating econ_terms_user_stats table..."
curl -s -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/pg_dump" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: text/plain" \
  -d "${USER_STATS_SQL}" > /dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ User stats table creation request sent${NC}"
else
    echo -e "${RED}× Failed to create user stats table${NC}"
fi

echo ""
echo -e "${YELLOW}Setup complete!${NC}"
echo ""
echo "Now you can verify the tables were created successfully:"
echo "1. Go to your Supabase dashboard"
echo "2. Navigate to the Database section"
echo "3. Look for tables named 'econ_terms_leaderboard' and 'econ_terms_user_stats'"
echo ""
echo "If the tables weren't created, you can try running the SQL directly:"
echo "1. Go to the SQL Editor in your Supabase dashboard"
echo "2. Copy the content of create_econ_terms_leaderboard.sql and run it"
echo "3. Copy the content of create_econ_terms_user_stats.sql and run it"
echo ""
echo -e "${GREEN}Once the tables are created, the game should connect properly.${NC}"
