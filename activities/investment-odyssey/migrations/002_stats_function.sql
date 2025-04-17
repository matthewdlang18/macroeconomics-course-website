-- Investment Odyssey Stats Function
-- This script creates a function to calculate leaderboard statistics

CREATE OR REPLACE FUNCTION get_leaderboard_stats(game_ids UUID[])
RETURNS TABLE (
  avg_portfolio DECIMAL,
  max_portfolio DECIMAL
) LANGUAGE SQL AS $$
  SELECT 
    AVG(portfolio_value) as avg_portfolio,
    MAX(portfolio_value) as max_portfolio
  FROM player_states
  WHERE game_id = ANY(game_ids)
  AND round_number = 20;
$$;
