# Investment Odyssey Class Game Updates

This document outlines the changes made to fix the Investment Odyssey class game functionality.

## Database Changes

A new column has been added to the `game_sessions` table in Supabase:

```sql
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
```

You need to run this SQL command in your Supabase SQL editor. The SQL script is available at:
`activities/investment-odyssey/add_status_column.sql`

## TA Controls Updates

1. TAs can now restart games at any time
   - When a TA clicks "Start New Game" for a section that already has an active game, they'll be asked if they want to restart or manage the existing game
   - If they choose to restart, the existing game will be ended and a new one will be created

2. Games now have 20 rounds by default (instead of 10)
   - This matches the requirement for the game to have 20 rounds

3. Removed sample student information
   - The participants table now only shows real students who have joined the game

## Class Game Updates

1. The TA's name is now properly displayed in the section information
   - If no TA name is available, the TA name container will be hidden

2. Fixed the connection between class-game.js and Supabase
   - Students should now be able to properly join TA-created games

## How to Test

1. Run the SQL script to add the status column to the game_sessions table
2. Sign in as a TA and create a new class game
3. Sign in as a student and join the class game
4. Verify that the TA's name is displayed in the section information
5. Verify that the game has 20 rounds
6. Verify that the TA can restart the game at any time
7. Verify that students can see the updated game after the TA advances rounds
