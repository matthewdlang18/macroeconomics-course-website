Phase 1: Backend & Service Layer Enhancements

(Focus: Ensure the Supabase tables and service functions support the multiplayer logic)

Database Verification:

Confirm the game_sessions, game_states, and player_states tables exist as defined in db-setup.sql.
Crucially: Ensure the status column ('active', 'completed') has been added to the game_sessions table as per add_status_column.sql and README-class-game-updates.md. If not, apply the ALTER TABLE script.
Review Row Level Security (RLS) policies in db-setup.sql. While the file notes RLS is temporarily disabled, ensure policies are eventually enabled and correctly restrict TA access to their sections and student access to their own states within a game.
Service Layer (js/services/* or service-adapter.js):

game-service.js / Adapter:
Refine/confirm createGame specifically for type='class', ensuring it correctly links to section_id and sets status='active', current_round=0, max_rounds=20.
Implement advanceRound(gameId): Fetches current game, increments current_round, generates/stores the next round's market data in game_states, updates game_session.current_round.
Implement endGame(gameId): Updates game_session.status to 'completed'.
Implement getGameParticipants(gameId): Fetches all player_states linked to a specific game_session.id.
Refine getGamesBySection to optionally filter by status='active' to easily find the current game for a section.
Refine savePlayerState to ensure it updates the correct record based on both game_id and user_id.
leaderboard-service.js / Adapter:
Implement getClassGameLeaderboard(gameId): Fetches final scores from the leaderboard table filtered by a specific game_id.
Phase 2: TA Control Interface

(Focus: Replace ta-controls.html/.js with a new, functional interface)

Create New Files: new-ta-controls.html and new-ta-controls.js.
HTML Structure (new-ta-controls.html):
Container to display TA's name.
Area to list the TA's sections (will be populated by JS).
Template for displaying each section card, including:
Section details (Day, Time, Location).
Game status display area (e.g., "No Active Game", "Active - Round X/20").
"Start New Game" / "Manage Game" / "Restart Game" button.
Dedicated area for "Active Game Controls" (initially hidden), containing:
Current round display.
Participant list table (<thead> ready).
Market data display (optional, or just show round number).
"Advance Round" button.
"End Game" button.
Real-time class ranking display area.
JavaScript Logic (new-ta-controls.js):
On load, verify TA login status (using Auth or localStorage). Redirect if not a TA.
Fetch and display the TA's assigned sections using the service layer.
For each section, check its current game status (query game_sessions via service) and update the button/status text accordingly.
Implement "Start New Game" button logic: Call createGame service function, then update UI to show "Manage Game".
Implement "Manage Game" button logic: Fetch game details, display the "Active Game Controls" section, populate with game data (round, participants), and potentially set up real-time listeners or polling for participants/rankings.
Implement "Advance Round" button logic: Call advanceRound service function. Update the round display.
Implement "End Game" button logic: Call endGame service function. Update UI to show "Start New Game" again.
Implement "Restart Game" button logic: Call endGame then createGame.
Implement logic to fetch and display participants and rankings for the active game session using getGameParticipants. Use polling or Supabase Realtime if possible.
Phase 3: Student Class Game Interface (class-game.html / class-game.js)

(Focus: Adapt existing single-player UI/logic for synchronous multiplayer)

Initialization (class-game.js):
Verify student login and section selection.
Fetch the active game_session for the student's section using the service layer.
If no active game, display the "Waiting for TA" message.
If active game found:
Store the game_session.id.
Call a service function (e.g., joinGame(gameId, userId, userName)) to ensure a player_states record exists for this student in this session. Initialize with starting cash ($10,000) if new.
Load the student's current player_state (cash, portfolio) for this game_session.id.
Set up real-time listener (or polling) on the game_session record, specifically watching current_round and status.
Real-time Updates (class-game.js):
When the listener detects a change in game_session.current_round:
Update the round display.
Fetch the official market data (assetPrices, CPI) for the new round from the game_states table (using game_id and current_round).
Crucially: Update the local gameState (prices, history, CPI) with this fetched data.
Recalculate portfolio value based on new prices.
Update the entire UI (game-ui.js functions) to reflect the new market state and portfolio value.
Enable the trading interface.
Display a "New Round Started!" notification.
When the listener detects game_session.status changed to 'completed' (or round > max):
Disable trading.
Calculate and display final results.
Save the final score to the leaderboard table, linking it with the game_session.id.
Show the "Game Over" screen with a link to the class leaderboard results.
Trading Logic (game-trading.js adaptation):
Ensure all trade executions (executeTrade, buyAllAssets, etc.) update the player_states record associated with the current game_session.id and user_id via the service layer (savePlayerState).
UI (class-game.html):
Add a prominent "Waiting for Next Round..." overlay/message that shows when the student's local round doesn't match the game_session.current_round.
Ensure the round display always shows the official game_session.current_round.
Add the mini-leaderboard display area for class rankings.
Phase 4: Leaderboard Updates

(Focus: Displaying class game results)

UI (leaderboard.html):
Add a dropdown or tabs to switch between "Single Player", "Overall", and "Class Game Results".
When "Class Game Results" is selected, display additional filters (e.g., dropdown populated with completed game_sessions relevant to the student/TA, perhaps grouped by section/date).
JavaScript (leaderboard.js):
Implement logic for the new filters.
When fetching class game results, call the getClassGameLeaderboard(gameId) service function, passing the selected completed game_session.id.
Display the fetched results, showing ranks within that specific game.