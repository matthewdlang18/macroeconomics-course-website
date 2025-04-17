/**
 * Leaderboard Service for Investment Odyssey
 * 
 * Handles leaderboard operations, including getting top scores,
 * saving scores, and retrieving player statistics.
 */

import BaseService from './base-service.js';

class LeaderboardService extends BaseService {
  constructor() {
    super();
  }
  
  // Get leaderboard data
  async getLeaderboard(gameType = 'single', options = {}) {
    try {
      const {
        page = 1,
        pageSize = 20,
        taName = null,
        studentId = null
      } = options;
      
      // Calculate offset for pagination
      const offset = (page - 1) * pageSize;
      
      // Start building the query
      let query = this.supabase
        .from('player_states')
        .select(`
          id,
          game_id,
          user_id,
          round_number,
          portfolio_value,
          created_at,
          profiles:user_id (name),
          games:game_id (type, section_id, created_at)
        `)
        .eq('games.status', 'completed');
      
      // Add game type filter if specified
      if (gameType !== 'all') {
        query = query.eq('games.type', gameType);
      }
      
      // Add TA filter if specified
      if (taName) {
        // This would require a join to sections table
        // For simplicity, we'll skip this for now
      }
      
      // Add student filter if specified
      if (studentId) {
        query = query.eq('user_id', studentId);
      }
      
      // Get only the final round for each game
      query = query.eq('round_number', 20); // Assuming all games have 20 rounds
      
      // Order by portfolio value (descending)
      query = query.order('portfolio_value', { ascending: false });
      
      // Add pagination
      query = query.range(offset, offset + pageSize - 1);
      
      // Execute the query
      const { data: playerStates, error, count } = await query;
      
      if (error) {
        return this.error('Error getting leaderboard', error);
      }
      
      // Format the scores
      const scores = playerStates.map(state => ({
        id: state.id,
        studentId: state.user_id,
        studentName: state.profiles?.name || 'Unknown',
        gameType: state.games?.type || gameType,
        finalPortfolio: state.portfolio_value,
        timestamp: state.created_at
      }));
      
      // Get total count for pagination
      const { count: totalScores } = await this.supabase
        .from('player_states')
        .select('id', { count: 'exact' })
        .eq('games.status', 'completed')
        .eq('round_number', 20);
      
      return this.success({
        scores,
        totalScores: totalScores || scores.length
      });
    } catch (error) {
      return this.error('Error getting leaderboard', error);
    }
  }
  
  // Save a game score
  async saveGameScore(userId, userName, gameId, finalPortfolio, isClassGame = false) {
    try {
      if (!userId || !userName || !gameId || finalPortfolio === undefined) {
        return this.error('User ID, name, game ID, and final portfolio are required');
      }
      
      // Get the game
      const { data: game, error: gameError } = await this.supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();
      
      if (gameError) {
        return this.error('Error getting game', gameError);
      }
      
      // Update the game status to completed if it's not already
      if (game.status !== 'completed') {
        const { error: updateError } = await this.supabase
          .from('games')
          .update({ status: 'completed' })
          .eq('id', gameId);
        
        if (updateError) {
          return this.error('Error updating game status', updateError);
        }
      }
      
      // Check if this is the final round
      const { data: playerState, error: playerError } = await this.supabase
        .from('player_states')
        .select('*')
        .eq('game_id', gameId)
        .eq('user_id', userId)
        .eq('round_number', game.max_rounds)
        .single();
      
      if (playerError) {
        // Create the final player state if it doesn't exist
        const { error: createError } = await this.supabase
          .from('player_states')
          .insert({
            game_id: gameId,
            user_id: userId,
            round_number: game.max_rounds,
            cash: 0, // These values would normally come from the game
            portfolio: {},
            portfolio_value: finalPortfolio,
            portfolio_history: [finalPortfolio]
          });
        
        if (createError) {
          return this.error('Error creating final player state', createError);
        }
      } else {
        // Update the existing player state
        const { error: updateError } = await this.supabase
          .from('player_states')
          .update({ portfolio_value: finalPortfolio })
          .eq('id', playerState.id);
        
        if (updateError) {
          return this.error('Error updating player state', updateError);
        }
      }
      
      return this.success({ message: 'Score saved successfully' });
    } catch (error) {
      return this.error('Error saving game score', error);
    }
  }
  
  // Get player statistics
  async getPlayerStats(userId) {
    try {
      if (!userId) {
        return this.error('User ID is required');
      }
      
      // Get all completed games for this player
      const { data: playerStates, error } = await this.supabase
        .from('player_states')
        .select(`
          portfolio_value,
          games:game_id (type, status)
        `)
        .eq('user_id', userId)
        .eq('games.status', 'completed');
      
      if (error) {
        return this.error('Error getting player stats', error);
      }
      
      // Calculate statistics
      const singlePlayerGames = playerStates.filter(state => state.games.type === 'single');
      const classGames = playerStates.filter(state => state.games.type === 'class');
      
      const singlePlayerStats = this.calculateStats(singlePlayerGames);
      const classGameStats = this.calculateStats(classGames);
      const overallStats = this.calculateStats(playerStates);
      
      return this.success({
        singlePlayer: singlePlayerStats,
        classGames: classGameStats,
        overall: overallStats
      });
    } catch (error) {
      return this.error('Error getting player stats', error);
    }
  }
  
  // Helper: Calculate statistics
  calculateStats(games) {
    if (!games || games.length === 0) {
      return {
        gamesPlayed: 0,
        bestScore: 0,
        averageScore: 0,
        totalValue: 0
      };
    }
    
    const portfolioValues = games.map(game => game.portfolio_value);
    const bestScore = Math.max(...portfolioValues);
    const totalValue = portfolioValues.reduce((sum, value) => sum + value, 0);
    const averageScore = totalValue / games.length;
    
    return {
      gamesPlayed: games.length,
      bestScore,
      averageScore,
      totalValue
    };
  }
  
  // Get global statistics
  async getGlobalStats() {
    try {
      // Get all completed games
      const { data: games, error: gamesError } = await this.supabase
        .from('games')
        .select('id, type')
        .eq('status', 'completed');
      
      if (gamesError) {
        return this.error('Error getting games', gamesError);
      }
      
      const gameIds = games.map(game => game.id);
      
      if (gameIds.length === 0) {
        return this.success({
          totalGames: 0,
          totalPlayers: 0,
          avgPortfolio: 0,
          topScore: 0
        });
      }
      
      // Get stats using our custom function
      const { data: stats, error: statsError } = await this.supabase
        .rpc('get_leaderboard_stats', { game_ids: gameIds });
      
      if (statsError) {
        return this.error('Error getting stats', statsError);
      }
      
      // Count unique players
      const { data: players, error: playersError } = await this.supabase
        .from('player_states')
        .select('user_id', { count: 'exact', distinct: true })
        .in('game_id', gameIds);
      
      if (playersError) {
        return this.error('Error counting players', playersError);
      }
      
      return this.success({
        totalGames: games.length,
        totalPlayers: players.length,
        avgPortfolio: stats.avg_portfolio || 0,
        topScore: stats.max_portfolio || 0
      });
    } catch (error) {
      return this.error('Error getting global stats', error);
    }
  }
}

// Create and export the service instance
const leaderboardService = new LeaderboardService();
export default leaderboardService;
