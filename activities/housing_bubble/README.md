# Housing Bubble Game

An interactive multiplayer game simulating housing market dynamics and bubble formation.

## Overview

This game allows students to experience the dynamics of a housing market bubble through different roles:
- Homebuyers: Purchase houses for personal use
- Developers: Build and sell new houses
- Speculators: Buy and sell properties for profit
- Mortgage Lenders: Provide loans to buyers
- Bankers: Set interest rates and provide loans to banks

## Features

- Up to 50 players per game
- Real-time market price updates
- Interactive price chart
- Role-specific actions
- Transaction history
- Final leaderboard

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the server:
```bash
python app.py
```

3. Access the game at `http://localhost:5000`

## How to Play

### For TAs:
1. Click "Create Game" to generate a game code
2. Share the game code with students
3. Wait for students to join
4. Start the game when ready

### For Students:
1. Enter the game code provided by the TA
2. Enter your name
3. Join the game and receive your assigned role
4. Perform actions based on your role to maximize profits
5. Watch the market and adapt to changes

## Game Mechanics

- Each player starts with $1,000
- Market prices update based on player actions and random events
- A bubble forms when prices rise significantly
- The bubble may pop if prices get too high
- Game ends a few rounds after the bubble pops
- Winner is the player with the most money at the end
