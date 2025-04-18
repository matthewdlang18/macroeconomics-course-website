-- Investment Odyssey Stats Functions
-- This script creates functions to calculate leaderboard statistics

-- Function to get leaderboard stats for specific games
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

-- Function to get game statistics
CREATE OR REPLACE FUNCTION get_game_statistics(game_type_param text)
RETURNS TABLE (
  avg_portfolio numeric,
  top_score numeric,
  total_players integer,
  total_games integer
) AS $$
BEGIN
  RETURN QUERY
  WITH game_scores AS (
    SELECT
      l.user_id,
      MAX(l.final_portfolio) as best_score
    FROM
      leaderboard l
    WHERE
      l.game_type = game_type_param
    GROUP BY
      l.user_id
  )
  SELECT
    COALESCE(AVG(gs.best_score), 0) as avg_portfolio,
    COALESCE(MAX(gs.best_score), 0) as top_score,
    COUNT(DISTINCT gs.user_id) as total_players,
    (SELECT COUNT(*) FROM leaderboard WHERE game_type = game_type_param) as total_games
  FROM
    game_scores gs;
END;
$$ LANGUAGE plpgsql;
