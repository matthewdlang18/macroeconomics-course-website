# Econ Words Game - Supabase Integration Guide

This document provides a comprehensive guide to the Supabase integration for the Econ Words game.

## Overview

The Econ Words game integrates with Supabase for:
1. **User Authentication**: Managing user sessions and identities
2. **Score Tracking**: Storing and retrieving game scores
3. **Leaderboards**: Displaying global and section-specific leaderboards
4. **User Stats**: Tracking user performance metrics such as streaks and games played

## Architecture

The integration follows a complete flow from login to gameplay to leaderboard:

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│  User Login │ ─── │  Game Play   │ ─── │  Leaderboard  │
└─────────────┘     └──────────────┘     └───────────────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌───────────────────────────────────────────────────────┐
│                 Supabase Backend                      │
├───────────────┬──────────────┬────────────────────────┤
│    Auth API    │  Database   │    Storage (Future)    │
└───────────────┴──────────────┴────────────────────────┘
```

## Key Files

- `econ-words-auth.js`: Unified authentication service that integrates with Supabase
- `supabase-integration-fixed.js`: Core integration with Supabase for game data
- `init.js`: Game initialization that coordinates auth and game components
- `leaderboard.js`: Manages displaying scores and user stats from Supabase
- `econ_words_schema.sql`: Database schema for the Supabase tables

## Authentication Flow

1. **User Login**: 
   - User logs in through Supabase Auth
   - The session is established and stored
   - The user ID is saved in localStorage for compatibility

2. **Session Management**:
   - `econ-words-auth.js` handles authentication state
   - Auth changes trigger events that update the UI
   - Guest mode is supported for users who don't want to log in

3. **Authorization**:
   - Row-Level Security (RLS) in Supabase ensures users can only:
     - Read anyone's scores (for leaderboard)
     - Write only their own scores and stats
     - Update only their own user information

## Database Schema

### Tables

1. **econ_terms_leaderboard**
   - Stores individual game scores
   - Fields: user_id, score, term, attempts, won, time_taken, etc.

2. **econ_terms_user_stats**
   - Stores aggregated user statistics
   - Fields: user_id, streak, high_score, games_played, etc.

3. **leaderboard** (fallback table)
   - General-purpose leaderboard with game_mode='econ_terms'
   - Used as fallback when the dedicated table isn't available

### Row-Level Security (RLS)

Policies are implemented to:
- Allow any user to view leaderboard data
- Restrict write access to a user's own data
- Support both authenticated and guest users

## Integration Process

1. **Initialization**:
   - Authentication is initialized first
   - Game components wait for auth to be ready
   - Fallbacks ensure the game works even if auth fails

2. **During Gameplay**:
   - Game state is tracked locally
   - When a game ends, scores are sent to Supabase

3. **Leaderboard Display**:
   - Scores are retrieved from Supabase
   - Data is filtered and sorted client-side
   - User's rank and stats are highlighted

## Troubleshooting

Common issues and solutions:

### Authentication Issues
- **RLS Policy Violations**: Make sure auth_user_id is set correctly for all operations
- **Session Errors**: Check if the Supabase client is properly initialized

### Database Issues
- **Missing Tables**: Ensure all tables in econ_words_schema.sql are created
- **Permission Errors**: Verify RLS policies are correctly set up

### Client Integration Issues
- **Script Loading Order**: Scripts must load in the correct order (auth before game)
- **Event Timing**: Use the econwords-auth-ready event to synchronize components

## Setup Instructions

1. Create tables in Supabase using econ_words_schema.sql
2. Configure RLS policies as specified
3. Update Supabase credentials in env.js
4. Test the authentication flow
5. Verify game data is saved and retrieved properly

## Future Enhancements

- Add user profiles with avatars using Supabase Storage
- Implement real-time leaderboard updates with Supabase Realtime
- Add social features like sharing scores and challenges
