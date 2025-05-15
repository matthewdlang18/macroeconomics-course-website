#!/bin/bash

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Econ Words Tables Verification Script${NC}"
echo "This script will check if the required tables exist in your Supabase project"
echo ""

# Ask for Supabase URL and key
read -p "Enter your Supabase URL (e.g., https://your-project-id.supabase.co): " SUPABASE_URL
read -p "Enter your Supabase service role key (starts with 'eyJ...'): " SUPABASE_KEY

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
    echo -e "${RED}Error: Both URL and key are required.${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Verifying tables...${NC}"

# Check if econ_terms_leaderboard table exists
echo "Checking econ_terms_leaderboard table..."
LEADERBOARD_CHECK=$(curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/econ_terms_leaderboard?select=id&limit=1" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}")

if [[ $LEADERBOARD_CHECK == *"error"* ]]; then
    echo -e "${RED}✗ econ_terms_leaderboard table not found or not accessible${NC}"
    LEADERBOARD_EXISTS=false
else
    echo -e "${GREEN}✓ econ_terms_leaderboard table exists${NC}"
    LEADERBOARD_EXISTS=true
fi

# Check if econ_terms_user_stats table exists
echo "Checking econ_terms_user_stats table..."
USER_STATS_CHECK=$(curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/econ_terms_user_stats?select=id&limit=1" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}")

if [[ $USER_STATS_CHECK == *"error"* ]]; then
    echo -e "${RED}✗ econ_terms_user_stats table not found or not accessible${NC}"
    USER_STATS_EXISTS=false
else
    echo -e "${GREEN}✓ econ_terms_user_stats table exists${NC}"
    USER_STATS_EXISTS=true
fi

echo ""
echo -e "${YELLOW}Checking table structures...${NC}"

# If tables exist, check their structure
if [ "$LEADERBOARD_EXISTS" = true ]; then
    echo "Getting econ_terms_leaderboard structure..."
    curl -s -X GET \
      "${SUPABASE_URL}/rest/v1/econ_terms_leaderboard?select=*&limit=0" \
      -H "apikey: ${SUPABASE_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_KEY}" \
      -H "Content-Type: application/json" \
      -v 2>&1 | grep -o '"[a-zA-Z_]*":' | sort | uniq | tr -d ':' | tr -d '"'
fi

if [ "$USER_STATS_EXISTS" = true ]; then
    echo "Getting econ_terms_user_stats structure..."
    curl -s -X GET \
      "${SUPABASE_URL}/rest/v1/econ_terms_user_stats?select=*&limit=0" \
      -H "apikey: ${SUPABASE_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_KEY}" \
      -H "Content-Type: application/json" \
      -v 2>&1 | grep -o '"[a-zA-Z_]*":' | sort | uniq | tr -d ':' | tr -d '"'
fi

echo ""
echo -e "${YELLOW}Checking RLS policies...${NC}"

# Get RLS policies for econ_terms_leaderboard
echo "Getting RLS policies information..."
RLS_CHECK=$(curl -s -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/pg_dump" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: text/plain" \
  -d "SELECT table_name, policy_name FROM pg_policies WHERE tablename IN ('econ_terms_leaderboard', 'econ_terms_user_stats')")

echo "$RLS_CHECK"

echo ""
echo -e "${YELLOW}Next steps:${NC}"

if [ "$LEADERBOARD_EXISTS" = false ] || [ "$USER_STATS_EXISTS" = false ]; then
    echo -e "${RED}One or both tables are missing. You need to create them:${NC}"
    echo "1. Use the setup_econ_terms_tables.sh script"
    echo "2. Or run the SQL files manually in the SQL Editor"
else
    echo -e "${GREEN}Both tables appear to exist.${NC}"
    echo "If you're still having issues, check:"
    echo "1. Authentication - make sure users are logged in"
    echo "2. RLS Policies - ensure they allow proper access"
    echo "3. Table structures - verify they match the expected schema"
    echo ""
    echo "Try creating a test record to verify write access:"
    echo "curl -X POST \\"
    echo "  \"${SUPABASE_URL}/rest/v1/econ_terms_leaderboard\" \\"
    echo "  -H \"apikey: ${SUPABASE_KEY}\" \\"
    echo "  -H \"Authorization: Bearer ${SUPABASE_KEY}\" \\"
    echo "  -H \"Content-Type: application/json\" \\"
    echo "  -d '{\"user_id\":\"test\", \"user_name\":\"TestUser\", \"score\":100, \"term\":\"test\", \"attempts\":1, \"won\":true}'"
fi
