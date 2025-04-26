# Investment Odyssey Leaderboard Fix

## Issue: Row Level Security (RLS) Error When Saving Scores

When playing the Investment Odyssey game, you may encounter an error when the game tries to save your score to the leaderboard. The error message in the browser console will look like this:

```
Error saving score to Supabase: {code: "42501", details: null, hint: null, …}
Error details: "{\"code\": \"42501\", \"details\": null, \"hint\": null, \"message\": \"new row violates row-level security policy for table \\\"leaderboard\\\"\"}"
```

This error occurs because the Supabase database has Row Level Security (RLS) enabled on the leaderboard table, but the game is not properly authenticated when trying to insert scores.

## Solution: Temporarily Disable RLS on the Leaderboard Table

To fix this issue, you need to temporarily disable Row Level Security on the leaderboard table. This will allow guest users and unauthenticated users to insert scores into the leaderboard.

### Step 1: Connect to your Supabase Database

1. Log in to your Supabase account
2. Go to your project dashboard
3. Click on "SQL Editor" in the left sidebar

### Step 2: Run the SQL Script

Copy and paste the following SQL script into the SQL Editor and run it:

```sql
-- Temporarily disable Row Level Security on the leaderboard table
-- This allows guest users to insert scores without authentication
ALTER TABLE leaderboard DISABLE ROW LEVEL SECURITY;
```

Alternatively, you can run the provided `disable_leaderboard_rls.sql` script.

### Step 3: Test the Game

After running the SQL script, refresh the Investment Odyssey game and play it again. When the game ends, your score should now be saved to the leaderboard without errors.

## Security Considerations

Disabling Row Level Security is a temporary solution and should only be used in development or educational environments. In a production environment, you should implement proper authentication and use RLS policies to secure your data.

## Re-enabling RLS

If you need to re-enable RLS on the leaderboard table, you can run the following SQL script:

```sql
-- Re-enable Row Level Security on the leaderboard table
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
```

## Alternative Solution: Create a More Permissive RLS Policy

Instead of completely disabling RLS, you can create a more permissive policy that allows anyone to insert scores:

```sql
-- Drop the existing policy if it exists
DROP POLICY IF EXISTS leaderboard_student_insert ON leaderboard;

-- Create a new policy that allows anyone to insert scores
CREATE POLICY leaderboard_insert_anyone ON leaderboard
  FOR INSERT
  WITH CHECK (true);
```

This policy will allow anyone to insert scores into the leaderboard table, while still maintaining RLS for other operations like UPDATE and DELETE.
