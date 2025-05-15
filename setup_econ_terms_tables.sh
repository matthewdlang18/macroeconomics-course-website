#!/bin/bash

# Setup script for Econ Terms game tables in Supabase
# This script requires the Supabase CLI to be installed and configured

echo "Setting up Econ Terms game tables in Supabase..."

# Execute the SQL files to create the tables
echo "Creating econ_terms_leaderboard table..."
supabase sql < create_econ_terms_leaderboard.sql

echo "Creating econ_terms_user_stats table..."
supabase sql < create_econ_terms_user_stats.sql

echo "Setup complete!"
