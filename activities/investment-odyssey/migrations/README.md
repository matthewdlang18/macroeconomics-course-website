# Investment Odyssey Database Migrations

This folder contains SQL migration scripts for the Investment Odyssey game database.

## Migration Files

1. `001_investment_odyssey_schema.sql` - Creates the initial database schema
2. `002_stats_function.sql` - Creates the leaderboard stats function
3. `003_init_tas_sections.sql` - Initializes TAs and sections

## How to Run

These scripts should be run in order in the Supabase SQL Editor:

1. Go to your Supabase dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the contents of each script
5. Click "Run" to execute the script

## Database Schema

The Investment Odyssey database consists of the following tables:

- `profiles` - User profiles (students and TAs)
- `sections` - TA sections
- `games` - Game metadata
- `game_rounds` - Round-specific data (asset prices, etc.)
- `player_states` - Player-specific data for each round

## Relationships

- A profile (user) can belong to one section
- A section belongs to one TA
- A game can belong to one section (for class games)
- A game has many game rounds
- A game has many player states

## Row Level Security

Row Level Security (RLS) policies are set up to control access to the data:

- Profiles are viewable by everyone
- Users can only update their own profile
- Sections are viewable by everyone
- Games are viewable by everyone
- Game rounds are viewable by everyone
- Player states are viewable by everyone, but users can only update their own
