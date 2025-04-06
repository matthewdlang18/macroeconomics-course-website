# Investment Odyssey Game Flow

This document outlines the flow of the Investment Odyssey game, including user authentication, session management, and gameplay.

## Authentication Flow

### Student Authentication
1. **Registration**
   - Students register with a name and student ID
   - No password is required (simple authentication)
   - Students can optionally enter a join code to immediately join a session

2. **Login**
   - Students login with their student ID
   - No password is required (simple authentication)
   - Students can optionally enter a join code to immediately join a session

3. **Guest Play**
   - Students can play in single-player mode without registering
   - Progress is saved to localStorage only

### TA Authentication
1. **Login**
   - TAs login with username "testTA" and passcode "1234"
   - TAs have access to the TA Dashboard

## Session Management

### Creating a Session (TA only)
1. TA logs in and accesses the TA Dashboard
2. TA creates a new session with a name
3. System generates a unique join code for the session
4. TA shares the join code with students

### Joining a Session (Students)
1. Student logs in
2. Student enters the join code provided by the TA
3. System adds the student to the session
4. Student is redirected to the game

## Game Flow

### Single Player Mode
1. Student selects "Single Player" from the front page
2. Game initializes with starting cash and asset prices
3. Student can:
   - Buy and sell assets
   - View portfolio and market data
   - Advance to the next round
4. Each round:
   - Asset prices change based on random returns
   - Student receives a cash injection
5. After 20 rounds, the game ends and the student's score is added to the leaderboard

### Class Mode
1. TA creates a session and shares the join code
2. Students join the session using the join code
3. TA controls the game progression:
   - Initializes the game
   - Advances to the next round
   - Ends the game
4. Students can:
   - Buy and sell assets
   - View portfolio and market data
   - View the class leaderboard
5. Each round:
   - TA advances the round
   - Asset prices change based on random returns
   - Students receive a cash injection
6. After 20 rounds or when the TA ends the game, final scores are recorded on the leaderboard

## Data Structure

### Users Collection
- Stores user information (students and TAs)
- Fields: id, name, role, createdAt

### Sessions Collection
- Stores session information
- Fields: id, name, gameId, joinCode, createdBy, createdAt, active, roundNumber, assetPrices, priceHistory, totalCashInjected

### Participants Collection
- Stores participant information for each session
- Fields: id, userId, sessionId, name, cash, portfolio, tradeHistory, joinedAt

### Leaderboards Collection
- Stores leaderboard entries
- Fields: gameId, sessionId, entries (array of user scores)

## Join Codes vs. Class Numbers

- **Join Codes**: 6-digit numeric codes used to join a specific game session
- **Class Numbers**: Legacy concept from the old system, replaced by join codes

## Important Notes

1. **Authentication**: The system uses a simple authentication system without passwords for ease of use in an educational setting.

2. **Session Control**: Only TAs can create and control sessions, ensuring orderly gameplay.

3. **Data Persistence**: 
   - Registered users' data is stored in Firestore
   - Guest users' data is stored in localStorage

4. **Security**: 
   - For development, all Firestore operations are allowed
   - For production, more restrictive rules should be implemented
