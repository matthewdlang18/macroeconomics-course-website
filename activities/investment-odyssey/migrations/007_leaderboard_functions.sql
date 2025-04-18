-- Create functions for leaderboard queries

-- Function to get single player leaderboard
CREATE OR REPLACE FUNCTION get_single_player_leaderboard(max_results integer DEFAULT 100)
RETURNS TABLE (
  user_id text,
  user_name text,
  final_portfolio numeric,
  game_id text,
  created_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  WITH ranked_scores AS (
    SELECT
      l.user_id,
      l.user_name,
      l.final_portfolio,
      l.game_id,
      l.created_at,
      ROW_NUMBER() OVER (PARTITION BY l.user_id ORDER BY l.final_portfolio DESC) as rank
    FROM
      leaderboard l
    WHERE
      l.game_mode = 'single'
  )
  SELECT
    rs.user_id,
    rs.user_name,
    rs.final_portfolio,
    rs.game_id,
    rs.created_at
  FROM
    ranked_scores rs
  WHERE
    rs.rank = 1
  ORDER BY
    rs.final_portfolio DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Function to get class game leaderboard
CREATE OR REPLACE FUNCTION get_class_leaderboard(section_id_param text, max_results integer DEFAULT 100)
RETURNS TABLE (
  user_id text,
  user_name text,
  final_portfolio numeric,
  game_id text,
  created_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  WITH ranked_scores AS (
    SELECT
      l.user_id,
      l.user_name,
      l.final_portfolio,
      l.game_id,
      l.created_at,
      ROW_NUMBER() OVER (PARTITION BY l.user_id ORDER BY l.final_portfolio DESC) as rank
    FROM
      leaderboard l
    WHERE
      l.game_mode = 'class'
      AND l.section_id = section_id_param
  )
  SELECT
    rs.user_id,
    rs.user_name,
    rs.final_portfolio,
    rs.game_id,
    rs.created_at
  FROM
    ranked_scores rs
  WHERE
    rs.rank = 1
  ORDER BY
    rs.final_portfolio DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Function to get player's best score (single player)
CREATE OR REPLACE FUNCTION get_player_best_score(user_id_param text)
RETURNS numeric AS $$
DECLARE
  best_score numeric;
BEGIN
  SELECT MAX(final_portfolio) INTO best_score
  FROM leaderboard
  WHERE user_id = user_id_param AND game_mode = 'single';
  
  RETURN COALESCE(best_score, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get player's best score in a class game
CREATE OR REPLACE FUNCTION get_player_best_class_score(user_id_param text, section_id_param text)
RETURNS numeric AS $$
DECLARE
  best_score numeric;
BEGIN
  SELECT MAX(final_portfolio) INTO best_score
  FROM leaderboard
  WHERE user_id = user_id_param AND game_mode = 'class' AND section_id = section_id_param;
  
  RETURN COALESCE(best_score, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get player's rank in single player leaderboard
CREATE OR REPLACE FUNCTION get_player_single_player_rank(user_id_param text)
RETURNS integer AS $$
DECLARE
  player_rank integer;
BEGIN
  WITH player_best_score AS (
    SELECT user_id, MAX(final_portfolio) as best_score
    FROM leaderboard
    WHERE game_mode = 'single'
    GROUP BY user_id
  ),
  ranked_players AS (
    SELECT user_id, best_score, RANK() OVER (ORDER BY best_score DESC) as rank
    FROM player_best_score
  )
  SELECT rank INTO player_rank
  FROM ranked_players
  WHERE user_id = user_id_param;
  
  RETURN COALESCE(player_rank, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get player's rank in class leaderboard
CREATE OR REPLACE FUNCTION get_player_class_rank(user_id_param text, section_id_param text)
RETURNS integer AS $$
DECLARE
  player_rank integer;
BEGIN
  WITH player_best_score AS (
    SELECT user_id, MAX(final_portfolio) as best_score
    FROM leaderboard
    WHERE game_mode = 'class' AND section_id = section_id_param
    GROUP BY user_id
  ),
  ranked_players AS (
    SELECT user_id, best_score, RANK() OVER (ORDER BY best_score DESC) as rank
    FROM player_best_score
  )
  SELECT rank INTO player_rank
  FROM ranked_players
  WHERE user_id = user_id_param;
  
  RETURN COALESCE(player_rank, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get section statistics
CREATE OR REPLACE FUNCTION get_section_statistics(section_id_param text)
RETURNS TABLE (
  avg_portfolio numeric,
  top_score numeric,
  total_players integer,
  total_games integer
) AS $$
BEGIN
  RETURN QUERY
  WITH section_scores AS (
    SELECT
      l.user_id,
      MAX(l.final_portfolio) as best_score
    FROM
      leaderboard l
    WHERE
      l.section_id = section_id_param
      AND l.game_mode = 'class'
    GROUP BY
      l.user_id
  )
  SELECT
    COALESCE(AVG(ss.best_score), 0) as avg_portfolio,
    COALESCE(MAX(ss.best_score), 0) as top_score,
    COUNT(DISTINCT ss.user_id) as total_players,
    (SELECT COUNT(*) FROM leaderboard WHERE section_id = section_id_param AND game_mode = 'class') as total_games
  FROM
    section_scores ss;
END;
$$ LANGUAGE plpgsql;

-- Function to get server timestamp
CREATE OR REPLACE FUNCTION get_server_timestamp()
RETURNS timestamp with time zone AS $$
BEGIN
  RETURN NOW();
END;
$$ LANGUAGE plpgsql;
