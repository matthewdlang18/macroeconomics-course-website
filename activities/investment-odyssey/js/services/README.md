# Investment Odyssey Services

This directory contains the service layer for the Investment Odyssey game. The services provide a clean interface for interacting with the database and managing game state.

## Service Architecture

- `firebase-config.js` - Firebase configuration and initialization
- `auth-service.js` - Authentication and user management
- `game-service.js` - Game state management
- `leaderboard-service.js` - Leaderboard and statistics
- `section-service.js` - TA sections and class games
- `storage-service.js` - Local storage fallback

## Usage

Import the services you need in your JavaScript files:

```javascript
import { AuthService } from './services/auth-service.js';
import { GameService } from './services/game-service.js';

// Use the services
const authService = new AuthService();
const gameService = new GameService();

// Example: Start a new game
gameService.startNewGame(userId)
  .then(gameState => {
    console.log('Game started:', gameState);
  })
  .catch(error => {
    console.error('Error starting game:', error);
  });
```
