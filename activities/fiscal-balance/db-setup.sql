-- Fiscal Balance Game Database Schema
-- This file defines the database schema for the Fiscal Balance game

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create fiscal_game_sessions table (if not exists)
CREATE TABLE IF NOT EXISTS fiscal_game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    section_id TEXT,
    current_term INTEGER DEFAULT 1,
    year INTEGER DEFAULT 2025,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fiscal_game_states table (if not exists)
CREATE TABLE IF NOT EXISTS fiscal_game_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES fiscal_game_sessions(id) ON DELETE CASCADE,
    term INTEGER NOT NULL,
    year INTEGER NOT NULL,
    gdp FLOAT NOT NULL,
    gdp_growth FLOAT NOT NULL,
    unemployment FLOAT NOT NULL,
    inflation FLOAT NOT NULL,
    interest_rate FLOAT NOT NULL,
    debt FLOAT NOT NULL,
    debt_to_gdp FLOAT NOT NULL,
    tax_rate FLOAT NOT NULL,
    approval_rating FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(game_id, term)
);

-- Create fiscal_game_decisions table (if not exists)
CREATE TABLE IF NOT EXISTS fiscal_game_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES fiscal_game_sessions(id) ON DELETE CASCADE,
    term INTEGER NOT NULL,
    year INTEGER NOT NULL,
    phase TEXT NOT NULL,
    interest_tax_funding FLOAT,
    interest_money_creation FLOAT,
    spending_amount FLOAT,
    spending_tax_funding FLOAT,
    spending_debt_funding FLOAT,
    tax_rate FLOAT,
    tax_structure TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(game_id, term, phase)
);

-- Add game_type column to leaderboard table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leaderboard' AND column_name = 'game_type'
    ) THEN
        ALTER TABLE leaderboard ADD COLUMN game_type TEXT;
    END IF;
END $$;

-- Add terms column to leaderboard table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leaderboard' AND column_name = 'terms'
    ) THEN
        ALTER TABLE leaderboard ADD COLUMN terms INTEGER;
    END IF;
END $$;

-- Add final_approval column to leaderboard table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leaderboard' AND column_name = 'final_approval'
    ) THEN
        ALTER TABLE leaderboard ADD COLUMN final_approval FLOAT;
    END IF;
END $$;
