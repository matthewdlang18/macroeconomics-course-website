# Investment Odyssey Services

This directory contains the service layer for the Investment Odyssey game. The services provide a clean interface for interacting with the database and managing game state.

## Service Architecture

### Database Configuration
- `supabase-config.js` - Supabase configuration and initialization
- `env.js` - Environment variables for local development (not committed to Git)
- `env.template.js` - Template for creating your own env.js file

### Service Modules
- `auth-service.js` - Authentication and user management
- `game-service.js` - Game state management
- `leaderboard-service.js` - Leaderboard and statistics
- `section-service.js` - TA sections and class games
- `base-service.js` - Base service with common functionality

## Supabase Integration

### Local Development

For local development:

1. Copy `env.template.js` to `env.js`
2. Replace the placeholder values in `env.js` with your actual Supabase credentials
3. Make sure `env.js` is in your `.gitignore` file to avoid committing credentials

### Production Deployment

For production deployment:

1. Set up GitHub Secrets:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_ANON_KEY` - Your Supabase anon key

2. The GitHub Actions workflow will replace the placeholders in `supabase-config.js` with the actual values from GitHub Secrets during deployment.

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
