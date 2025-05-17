# Econ Words Game Integration Flow

This document outlines the complete flow from login to game play to leaderboard for the Econ Words game with Supabase integration.

## Integration Flow

### 1. Authentication Flow

```
START 
  ↓
[User visits game page]
  ↓
[econ-words-auth.js initializes]
  ↓
[Check for existing Supabase session]
  ↓
  +-- YES → [Use authenticated user details]
  |         ↓
  |      [Dispatch econwords-auth-ready]
  |         ↓
  |      [Game components initialize]
  |
  +-- NO → [Check localStorage for user info]
           ↓
           +-- YES → [Use local user details]
           |          ↓
           |       [Dispatch econwords-auth-ready]
           |          ↓
           |       [Game components initialize]
           |
           +-- NO → [Create guest user]
                     ↓
                  [Store in localStorage]
                     ↓
                  [Dispatch econwords-auth-ready]
                     ↓
                  [Game components initialize]
```

### 2. Game Play Flow

```
START
  ↓
[User plays game]
  ↓
[Game ends (win or lose)]
  ↓
[Calculate score]
  ↓
[saveHighScore function called]
  ↓
[Check for Supabase integration]
  ↓
  +-- YES → [Get auth user ID]
  |          ↓
  |       [Save score to Supabase]
  |          ↓
  |       [Save user stats to Supabase]
  |          ↓
  |       [Update UI with success message]
  |
  +-- NO → [Save score locally]
           ↓
        [Update UI with local storage message]
```

### 3. Leaderboard Flow

```
START
  ↓
[User views leaderboard]
  ↓
[leaderboard.js initializes]
  ↓
[Wait for auth ready]
  ↓
[loadLeaderboard function called]
  ↓
[Query Supabase for scores]
  ↓
  +-- SUCCESS → [Display scores]
  |              ↓
  |           [Highlight user's score]
  |              ↓
  |           [Sort and filter as needed]
  |
  +-- FAILURE → [Show fallback/empty leaderboard]
```

## Database Schema

### Tables

1. econ_terms_leaderboard
   - id (UUID, primary key)
   - user_id (TEXT, not null)
   - user_name (TEXT, not null)
   - score (INTEGER, not null)
   - term (TEXT)
   - attempts (INTEGER)
   - won (BOOLEAN)
   - time_taken (INTEGER)
   - section_id (TEXT)
   - auth_user_id (UUID, references auth.users.id)
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)

2. econ_terms_user_stats
   - id (UUID, primary key)
   - user_id (TEXT, not null)
   - streak (INTEGER)
   - high_score (INTEGER)
   - games_played (INTEGER)
   - auth_user_id (UUID, references auth.users.id)
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)

## Key Components

1. **Authentication Service**: `econ-words-auth.js`
   - Manages user identity and session
   - Provides consistent user info to other components

2. **Game Integration**: `supabase-integration-fixed.js`
   - Handles all database operations
   - Manages user stats and leaderboard data

3. **Game Logic**: `simple-game.js` and `simple-game-over.js`
   - Core gameplay functionality
   - Score calculation and game state management

4. **Leaderboard Component**: `leaderboard.js`
   - Displays user scores and stats
   - Provides filtering and sorting options

5. **Initialization**: `init.js`
   - Coordinates component loading
   - Ensures proper sequence of operations

## Troubleshooting

If you experience issues with the integration:

1. Check browser console for errors
2. Verify Supabase credentials in `env.js`
3. Ensure database tables match the schema in `econ_words_schema.sql`
4. Validate Row-Level Security policies in Supabase dashboard
