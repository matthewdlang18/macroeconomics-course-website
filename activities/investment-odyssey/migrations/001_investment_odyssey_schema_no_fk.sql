-- Investment Odyssey Database Schema (No Foreign Key Version)
-- This script creates the initial database schema for the Investment Odyssey game
-- without the foreign key constraint to auth.users

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (without foreign key to auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'ta')),
  passcode TEXT,
  section_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE
);

-- Sections table
CREATE TABLE sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day TEXT NOT NULL,
  time TEXT NOT NULL,
  location TEXT,
  ta_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ta FOREIGN KEY (ta_id) REFERENCES profiles(id)
);

-- Add section foreign key to profiles after sections table exists
ALTER TABLE profiles ADD CONSTRAINT fk_section FOREIGN KEY (section_id) REFERENCES sections(id);

-- Games table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('single', 'class')),
  section_id UUID REFERENCES sections(id),
  creator_id UUID REFERENCES profiles(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  current_round INTEGER DEFAULT 0,
  max_rounds INTEGER DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Game rounds table (stores asset prices for each round)
CREATE TABLE game_rounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES games(id) NOT NULL,
  round_number INTEGER NOT NULL,
  asset_prices JSONB NOT NULL,
  price_history JSONB,
  cpi DECIMAL NOT NULL,
  cpi_history JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(game_id, round_number)
);

-- Player states table (stores player portfolio for each round)
CREATE TABLE player_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES games(id) NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  round_number INTEGER NOT NULL,
  cash DECIMAL NOT NULL,
  portfolio JSONB NOT NULL,
  trade_history JSONB,
  portfolio_value DECIMAL NOT NULL,
  portfolio_history JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(game_id, user_id, round_number)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_states ENABLE ROW LEVEL SECURITY;

-- Create policies (who can access what)
-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Sections policies
CREATE POLICY "Sections are viewable by everyone" ON sections
  FOR SELECT USING (true);

-- Games policies
CREATE POLICY "Games are viewable by everyone" ON games
  FOR SELECT USING (true);

-- Game rounds policies
CREATE POLICY "Game rounds are viewable by everyone" ON game_rounds
  FOR SELECT USING (true);

-- Player states policies
CREATE POLICY "Player states are viewable by everyone" ON player_states
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own player states" ON player_states
  FOR UPDATE USING (user_id = auth.uid());
