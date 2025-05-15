# Econ Words Leaderboard Setup

This guide explains how to set up and use the dedicated leaderboard for the Econ Words game.

## Overview

The Econ Words game now has a dedicated leaderboard system that's separate from the Investment Odyssey game. The leaderboard uses two Supabase tables:

1. `econ_terms_leaderboard` - Stores individual game scores
2. `econ_terms_user_stats` - Stores user statistics like streak, high score, and games played

## Setting Up The Tables

### Option 1: Using the Setup Script

If you have the Supabase CLI installed, you can run the setup script:

```bash
./setup_econ_terms_tables.sh
```

### Option 2: Manual Setup

If you prefer to set up the tables manually:

1. Log into the Supabase dashboard
2. Go to the SQL Editor
3. Run the contents of `create_econ_terms_leaderboard.sql`
4. Run the contents of `create_econ_terms_user_stats.sql`

## How It Works

The econ-words game integration automatically:

1. Saves game scores to the `econ_terms_leaderboard` table
2. Updates user stats in the `econ_terms_user_stats` table
3. Displays the leaderboard in the game UI
4. Shows player stats including best score, games played, and current streak

## Fallback Mechanism

If the dedicated tables don't exist, the system will fall back to:

1. Using the general `leaderboard` table with a `game_mode = 'econ_terms'` filter
2. Storing user stats in localStorage

## Troubleshooting

If the leaderboard isn't working:

1. Check the browser console for error messages
2. Verify that the Supabase tables exist and have the correct structure
3. Ensure the user is logged in (guest users can't save scores)
4. Check that the Supabase connection is working (see debug messages in console)

### Common Error Messages

#### 406 Not Acceptable Error
```
Failed to load resource: the server responded with a status of 406 () (econ_terms_user_stats, line 0)
```
This typically means the table structure in Supabase doesn't match what the application expects. Run the setup scripts to create the proper tables.

#### 401 Unauthorized Error
```
Failed to load resource: the server responded with a status of 401 () (econ_terms_user_stats, line 0)
```
This indicates an authentication issue. Make sure:
- The user is properly logged in
- Row-Level Security (RLS) policies are correctly configured in Supabase
- The authenticated user has appropriate permissions for the tables

#### 400 Bad Request Error
```
Failed to load resource: the server responded with a status of 400 () (econ_terms_leaderboard, line 0)
```
This suggests a malformed request. Check that:
- The table structure matches what's defined in the SQL files
- All required fields are being passed to the tables
- The provided data types match the table schema

### Quick Resolution Steps

If you're seeing errors related to Supabase tables:

1. Follow these steps to run the SQL scripts directly in your Supabase project:
   - Go to the Supabase dashboard for your project
   - Navigate to the SQL Editor
   - Copy the contents of `create_econ_terms_leaderboard.sql` and `create_econ_terms_user_stats.sql`
   - Paste and execute them in the SQL Editor

2. Refresh the game page and check the console again

## Table Structures

### econ_terms_leaderboard

```sql
CREATE TABLE IF NOT EXISTS public.econ_terms_leaderboard (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),
    user_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    term TEXT,
    attempts INTEGER,
    won BOOLEAN DEFAULT false,
    time_taken INTEGER,
    section_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### econ_terms_user_stats

```sql
CREATE TABLE IF NOT EXISTS public.econ_terms_user_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),
    streak INTEGER DEFAULT 0,
    high_score INTEGER DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```
