# Investment Odyssey - Class Game Mode

This document provides instructions for setting up and using the Class Game mode in Investment Odyssey.

## Overview

Investment Odyssey has two game modes:
1. **Single Player Mode**: Students play individually at their own pace
2. **Class Game Mode**: TAs create and manage games for their sections, with all students progressing through rounds together

## Setup Instructions

### Database Setup

Before using the Class Game mode, you need to ensure the database has the required tables and columns:

1. Make sure the Supabase database is properly configured with the tables from `db-setup.sql`
2. If the game_sessions table already exists, run the `add_status_column.sql` script to add the status column
3. If the game_sessions table doesn't exist, run the `create_game_sessions.sql` script to create it

```sql
-- This script adds a status column to the game_sessions table
-- It can be run directly in the Supabase SQL Editor
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'game_sessions'
        AND column_name = 'status'
    ) THEN
        ALTER TABLE game_sessions
        ADD COLUMN status VARCHAR(20) DEFAULT 'active' NOT NULL;

        -- Add a comment to the column
        COMMENT ON COLUMN game_sessions.status IS 'Game status: active, completed, or cancelled';
    END IF;
END $$;

-- Update existing records to have 'active' status if they don't have a status
UPDATE game_sessions
SET status = 'active'
WHERE status IS NULL;

-- Add an index on the status column for faster queries
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status);

-- Add an index on the section_id column for faster queries
CREATE INDEX IF NOT EXISTS idx_game_sessions_section_id ON game_sessions(section_id);

-- Add a constraint to ensure status is one of the allowed values
ALTER TABLE game_sessions
DROP CONSTRAINT IF EXISTS game_sessions_status_check;

ALTER TABLE game_sessions
ADD CONSTRAINT game_sessions_status_check
CHECK (status IN ('active', 'completed', 'cancelled'));
```

The `create_game_sessions.sql` script creates the game_sessions table if it doesn't exist:

```sql
-- Create game_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  current_round INTEGER DEFAULT 0,
  max_rounds INTEGER DEFAULT 20,
  active BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'game_sessions'
        AND column_name = 'status'
    ) THEN
        ALTER TABLE game_sessions ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
END $$;

-- Update existing records to have 'active' status if they don't have a status
UPDATE game_sessions
SET status = 'active'
WHERE status IS NULL;

-- Add an index on the status column for faster queries
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status);

-- Add an index on the section_id column for faster queries
CREATE INDEX IF NOT EXISTS idx_game_sessions_section_id ON game_sessions(section_id);
```

### File Structure

The Class Game mode consists of the following files:

- `class-game.html`: The main page for students to join and play class games
- `class-game.js`: JavaScript for the student side of class games
- `ta-controls.html`: The control panel for TAs to manage class games
- `ta-controls.js`: JavaScript for the TA control panel
- `service-adapter.js`: Contains methods for interacting with the database
- `supabase.js`: Supabase configuration and initialization
- `supabase-auth.js`: Authentication functions for Supabase

## Instructions for TAs

### Creating and Managing Class Games

1. Sign in as a TA on the games.html page
2. Navigate to the TA Controls page
3. You'll see a list of your sections
4. For each section, you can:
   - Start a new game
   - Manage an active game
   - View completed games

### Game Management

When managing an active game:

1. **View Market Data**: See current asset prices and changes
2. **View Participants**: See a real-time leaderboard of students in your game
3. **Advance Round**: Move the game to the next round, generating new market data
4. **End Game**: Conclude the game and finalize scores

### Best Practices

- **Start with Round 0**: This allows students to make initial investments before the first round of price changes
- **Advance rounds at a reasonable pace**: Give students enough time to make trading decisions
- **Communicate with students**: Let them know when you're about to advance to the next round
- **Monitor participation**: Check that all students are actively participating

## Instructions for Students

### Joining a Class Game

1. Sign in on the games.html page
2. Select your TA section if you haven't already
3. Click "Join Class Game" to enter the class game mode
4. If your TA has created a game, you'll be able to join it

### Playing the Game

1. **Initial Investment**: In Round 0, make your initial investments
2. **Trading**: Buy and sell assets as the market changes
3. **Portfolio Management**: Monitor your portfolio performance and adjust your strategy
4. **Leaderboard**: Track your performance against classmates

### Tips for Success

- **Diversify**: Spread your investments across different asset classes
- **Monitor the market**: Pay attention to price trends
- **Rebalance**: Adjust your portfolio as market conditions change
- **Manage risk**: Don't put all your money in high-risk assets

## Troubleshooting

### Common Issues

1. **Connection Issues**: If you're having trouble connecting to Supabase:
   - Check that the Supabase URL and key are correct in js/supabase.js
   - Make sure you're including the proper initialization scripts
   - Check the browser console for specific error messages

2. **TA Controls Not Working**: If the TA controls page isn't working:
   - Verify that you're signed in as a TA
   - Check the browser console for errors
   - Make sure the database has the game_sessions table with the status column
   - Run the create_game_sessions.sql script if the table doesn't exist

3. **Students Can't Join Games**: If students can't join class games:
   - Verify they've selected a TA section
   - Check that the TA has created an active game for that section
   - Look for error messages in the browser console

4. **406 Errors in Console**: If you see 406 errors when accessing game_sessions:
   - This usually means the table doesn't exist or has the wrong structure
   - Run the create_game_sessions.sql script to create or fix the table

### Support

If you encounter issues that you can't resolve, please contact the course administrator for assistance.
