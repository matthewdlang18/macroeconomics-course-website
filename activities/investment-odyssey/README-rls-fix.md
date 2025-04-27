# Investment Odyssey RLS Fix

This document explains how to fix the Row Level Security (RLS) issues with the Investment Odyssey game.

## Problem

The Investment Odyssey game is experiencing 406 (Not Acceptable) errors when trying to access the `game_sessions` table. This is likely due to RLS policies being enabled but too restrictive, preventing TAs from accessing the necessary data.

## Solution

We've created a script to check and fix the RLS policies for all Investment Odyssey tables. This script:

1. Checks if RLS is enabled for each table
2. Creates more permissive policies that allow access to the tables

## How to Apply the Fix

Run the `check_and_fix_rls.sql` script in your Supabase SQL Editor:

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Open the file `activities/investment-odyssey/check_and_fix_rls.sql`
4. Run the script

## What the Script Does

The script:

1. Enables RLS for all Investment Odyssey tables if it's not already enabled
2. Creates permissive policies that allow access to all tables
3. Specifically addresses the `game_sessions` table with policies for SELECT, INSERT, and UPDATE operations

## Alternative Solutions

If you prefer to maintain stricter security, you can modify the RLS policies to be more specific:

1. For TAs: Allow access only to sections they are assigned to
2. For students: Allow access only to their own data and games they are participating in

However, for simplicity and to ensure the game works correctly, the current script uses permissive policies.

## Verification

After running the script, you should be able to:

1. Log in as a TA
2. View and manage class games
3. Create new class games
4. Advance rounds and end games

If you're still experiencing issues, check the browser console for error messages and ensure that the Supabase connection is working correctly.
