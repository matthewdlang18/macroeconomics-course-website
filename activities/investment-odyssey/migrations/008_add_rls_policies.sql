-- Add RLS policies for insert, update, and delete operations

-- Profiles policies
CREATE POLICY "Anyone can insert profiles" ON profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update profiles" ON profiles
  FOR UPDATE USING (true);

-- Sections policies
CREATE POLICY "Anyone can insert sections" ON sections
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update sections" ON sections
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete sections" ON sections
  FOR DELETE USING (true);

-- Games policies
CREATE POLICY "Anyone can insert games" ON games
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update games" ON games
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete games" ON games
  FOR DELETE USING (true);

-- Game rounds policies
CREATE POLICY "Anyone can insert game rounds" ON game_rounds
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update game rounds" ON game_rounds
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete game rounds" ON game_rounds
  FOR DELETE USING (true);

-- Player states policies
CREATE POLICY "Anyone can insert player states" ON player_states
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete player states" ON player_states
  FOR DELETE USING (true);

-- Leaderboard policies
CREATE POLICY "Anyone can update leaderboard" ON leaderboard
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete leaderboard" ON leaderboard
  FOR DELETE USING (true);
