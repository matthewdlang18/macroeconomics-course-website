# Economics Games

This directory contains interactive economics games for learning economic concepts.

## Project Structure

```
games/
├── index.html                  # Login page
├── selection.html              # Game selection page
├── ta-dashboard.html           # TA dashboard for managing class sessions
├── js/
│   ├── auth-service-new.js     # Authentication service
│   ├── firebase-config-new.js  # Firebase configuration
│   └── game-service.js         # Game service for managing game sessions
└── investment-odyssey/         # Investment Odyssey game
    ├── class-game.html         # Class game page
    ├── single-player-game.html # Single player game page
    ├── leaderboard-new.html    # Leaderboard page
    └── js/
        ├── game-core.js        # Core functionality for class game
        ├── game-display.js     # UI functions for class game
        ├── game-trading.js     # Trading functions for class game
        ├── single-player-core.js    # Core functionality for single player
        ├── single-player-ui.js      # UI functions for single player
        ├── single-player-trading.js # Trading functions for single player
        └── single-player-main.js    # Main file for single player
```

## Authentication System

The authentication system supports three types of users:
1. **Students** - Can register with name and email, join class sessions, and play games
2. **TAs** - Can create and manage class sessions, initialize games, and advance rounds
3. **Guests** - Can play single player games without registering

## Game Flow

### Single Player Mode
1. Player starts a new game
2. Player trades assets to build a portfolio
3. Player advances rounds to see how asset prices change
4. After 20 rounds, the game ends and the player can submit their score to the leaderboard

### Class Mode
1. TA creates a new game session from the TA dashboard
2. Students join the session using the join code
3. TA initializes the game and advances rounds
4. Students trade assets to build their portfolios
5. Leaderboard shows real-time rankings of all participants

## Investment Odyssey Game

The Investment Odyssey game simulates investing in different asset classes:
- S&P 500
- Bonds
- Real Estate
- Gold
- Commodities
- Bitcoin

Each asset has different risk and return characteristics based on historical data.

### Game Features
- Real-time price updates
- Portfolio visualization with pie charts
- Price history charts
- Cash injections each round
- Leaderboard based on portfolio value and return percentage
- Trading features like "Distribute Cash Evenly" and "Sell All Assets"

## Firebase Integration

The games connect to the 'economics-games' Firebase project with the following collections:
- **users** - Student and TA accounts
- **sections** - TA sections
- **gameSessions** - Active game sessions
- **participants** - Players in game sessions
- **leaderboards** - Game leaderboards

## Getting Started

1. Open `games/index.html` to access the login page
2. Register as a student or log in as a TA
3. Select a game to play or create a new game session
4. Follow the in-game instructions to play

## Development

To modify or extend the games:
1. Update the HTML files for UI changes
2. Modify the JavaScript files for functionality changes
3. Update the Firebase configuration if needed
4. Test thoroughly before deploying
