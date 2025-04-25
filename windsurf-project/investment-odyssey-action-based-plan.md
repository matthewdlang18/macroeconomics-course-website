# Investment Odyssey - Action-Based Implementation Plan

## Phase 1: Project Setup & Planning

### Project Initialization
- Create GitHub repository
- Set up folder structure for the project
- Initialize package.json
- Install core dependencies (React/framework, Chart.js, styling libraries)
- Configure linting and formatting tools
- Set up development environment with hot reloading

### Supabase Integration
- Review existing Supabase tables (profiles and sections)
- Design schema for new tables (game_sessions, game_states, player_states, leaderboard)
- Create environment variables configuration
- Set up Supabase client connection
- Test authentication flow with existing setup
- Configure real-time subscription capabilities

### Project Documentation
- Create comprehensive README.md
- Document database schema and relationships
- Set up issue/task tracking
- Create development guidelines
- Document API endpoints

## Phase 2: Core UI Development

### Authentication Components
- Build login form component
- Create registration form component
- Implement authentication service
- Create protected route mechanism
- Set up authentication state management
- Implement persistent login

### Landing Page & Navigation
- Design and implement landing page
- Create main navigation bar
- Implement responsive design
- Add section selection for students
- Build section management for instructors
- Create user profile page
- Implement settings management
- Add user role management

### Introduction Page
- Design introduction page layout
- Create game overview and objectives section
- Build how-to-play instructions
- Implement asset classes information table with the following data:
  - S&P 500: 11.51% avg. return, 19.49% std. dev., -43% min, 50% max
  - Bonds: 3.34% avg. return, 3.01% std. dev., 0.03% min, 14% max
  - Real Estate: 4.39% avg. return, 6.20% std. dev., -12% min, 24% max
  - Gold: 6.48% avg. return, 20.76% std. dev., -32% min, 125% max
  - Commodities: 8.15% avg. return, 15.22% std. dev., -25% min, 200% max
  - Bitcoin: 50.0% avg. return, 100.0% std. dev., -73% min, 250% max
- Create correlation matrix visualization showing the relationships between assets
- Build Bitcoin special mechanics explanation
- Add game mode selection interface
- Implement responsive design for all screen sizes

### Game Interface
- Design main game dashboard layout
- Create portfolio summary component
- Build market data display
- Implement round navigation
- Design trading interface
- Create notification system
- Build game controls

## Phase 3: Game Logic Implementation

### Game State Structure
- Define game state object structure
- Create player state object structure
- Implement state initialization functions
- Build state persistence mechanisms
- Create state loading functions
- Implement state synchronization with Supabase

### Game Lifecycle Management
- Implement start game functionality
- Create round advancement mechanism
- Build game reset functionality
- Implement end game logic
- Create game summary generation
- Add game history tracking
- Build save/load game functionality

### Price Generation Algorithms
- Implement correlation matrix data structure
- Create random number generation with proper distribution
- Build correlated return generator based on the matrix:
  ```
                  S&P 500   Bonds    Real Estate   Gold    Commodities   Bitcoin
  S&P 500         1.0000   -0.5169     0.3425     0.0199     0.1243      0.4057
  Bonds          -0.5169    1.0000     0.0176     0.0289    -0.0235     -0.2259
  Real Estate     0.3425    0.0176     1.0000    -0.4967    -0.0334      0.1559
  Gold            0.0199    0.0289    -0.4967     1.0000     0.0995     -0.5343
  Commodities     0.1243   -0.0235    -0.0334     0.0995     1.0000      0.0436
  Bitcoin         0.4057   -0.2259     0.1559    -0.5343     0.0436      1.0000
  ```
- Implement price update function for standard assets
- Create price history tracking
- Add min/max bounds enforcement

### Bitcoin Special Behavior
- Implement price-dependent growth patterns:
  - Low price range (< $10,000): 200-400% returns
  - Normal price range: Correlated with high volatility
  - Very high price (≥ $1,000,000): -30% to -50% returns
- Create 4-year market cycle mechanism
  - Track rounds since last crash
  - Implement 50% crash probability after 4 rounds
  - Create shock range adjustment for subsequent crashes
- Implement adaptive volatility based on price
- Build event notification system for Bitcoin events

### Economic Simulation
- Implement CPI calculation and tracking
- Create cash injection mechanism
- Build inflation impact on asset returns
- Add economic event notifications
- Implement market trend indicators

## Phase 4: Trading System

### Basic Trading Functions
- Create buy asset function
- Implement sell asset function
- Build transaction validation
- Add error handling
- Create transaction history logging
- Implement portfolio update logic

### Portfolio Management
- Implement portfolio value calculation
- Create asset allocation tracking
- Build portfolio performance metrics
- Implement portfolio value history
- Add portfolio diversification analysis
- Create rebalancing suggestions

### Trading Interface Logic
- Connect UI elements to trading functions
- Implement amount/quantity synchronization
- Create percentage-based trading shortcuts
- Build portfolio rebalancing functionality
- Add trade confirmation system
- Implement trade history display

## Phase 5: Data Visualization

### Portfolio Visualization
- Implement portfolio value line chart
- Create asset allocation pie chart
- Build portfolio performance metrics display
- Implement historical performance comparison
- Add portfolio composition visualization
- Create investment growth visualization

### Market Visualization
- Build price ticker component
- Create individual asset price charts
- Implement comparative returns chart
- Build correlation heatmap visualization
- Create CPI and inflation chart
- Add market trend indicators
- Implement Bitcoin cycle visualization

### Chart Configuration and Enhancement
- Configure Chart.js options for consistency
- Add zoom and pan functionality
- Implement tooltip customizations
- Create chart legends and explanations
- Add interactive filters for charts
- Build chart export functionality
- Implement responsive chart sizing

## Phase 6: Game Modes Implementation

### Single Player Mode
- Finalize single player game loop
- Implement round progression controls
- Create persistent game saving
- Build game resumption functionality
- Add game completion tracking
- Implement achievement system
- Create personal records tracking

### Class Game Mode
- Implement game session creation for instructors
- Create student roster management
- Build round progression controls
- Implement game parameter configuration
- Create session joining mechanism for students
- Build waiting room interface
- Implement synchronized round progression
- Create class leaderboard

### Real-time Synchronization
- Set up Supabase real-time subscriptions
- Implement state synchronization logic
- Build conflict resolution mechanisms
- Add reconnection handling
- Create activity indicators
- Implement instructor control panel
- Build student status monitoring

## Phase 7: Leaderboard & Analytics

### Leaderboard Development
- Design leaderboard layout
- Implement filtering options
- Create sorting mechanisms
- Build pagination
- Add player highlighting
- Implement score calculation
- Create score submission to Supabase
- Build score history tracking

### Analytics Features
- Design student performance dashboard
- Implement historical performance tracking
- Create decision analysis tools
- Build portfolio comparison features
- Add learning progress indicators
- Design instructor analytics dashboard
- Implement class performance visualization
- Create student comparison tools

### Advanced Analytics
- Implement strategy analysis tools
- Create market timing evaluation
- Build diversification effectiveness metrics
- Add risk/return optimization suggestions
- Implement "what if" scenario analysis
- Create performance benchmarking
- Build learning outcome assessment

## Phase 8: Testing & Refinement

### Core Testing
- Create test cases for game mechanics
- Test price generation algorithms
- Validate portfolio calculations
- Test Bitcoin simulation behavior
- Verify authentication flows
- Test Supabase integration
- Validate real-time synchronization

### User Experience Testing
- Create user testing protocol
- Implement feedback collection
- Conduct usability testing
- Document issues and feedback
- Prioritize improvements
- Test on different devices and browsers
- Verify responsive design

### Refinement
- Improve visual design
- Enhance interaction patterns
- Optimize performance
- Improve accessibility
- Add visual polish
- Refine instructional content
- Update notifications and feedback

## Phase 9: Documentation & Deployment

### User Documentation
- Create student user guide
- Write instructor manual
- Develop help/FAQ section
- Create tutorial videos
- Implement in-game help system
- Build tooltips and hints

### Deployment
- Configure production build
- Implement error tracking
- Set up analytics
- Create deployment pipeline
- Test production environment
- Deploy to production server
- Configure custom domain
- Monitor initial usage

## Introduction Page Detailed Implementation

Since the introduction page is crucial for explaining the investment mechanics, here's a detailed breakdown of its implementation:

### Introduction Page Layout
- Create responsive grid layout
- Implement header and navigation elements
- Design welcome section with game overview
- Build tabbed interface for different sections of information

### How to Play Section
- Create step-by-step instructions
- Add visual illustrations for each step
- Implement interactive examples where appropriate
- Build game mode comparison table

### Asset Classes Information
- Create comprehensive asset table with all risk-return metrics
- Add interactive tooltips explaining technical terms
- Implement sorting and filtering capabilities
- Build visual representation of risk-return spectrum

### Correlation Matrix Visualization
- Create data structure for correlation matrix
- Build heatmap visualization with color gradient
- Add interactive tooltips showing exact correlation values
- Implement explanatory text about correlation significance
- Create examples of how correlation affects diversification

### Bitcoin Special Mechanics Explanation
- Design visual explanation of 4-year cycle
- Create price-dependent behavior diagram
- Implement adaptive volatility visualization
- Build risk-reward comparison with other assets
- Add historical context for Bitcoin's behavior

## Key Milestones

1. **Project Setup Complete**: Repository created, Supabase connected
2. **Core UI Developed**: Authentication, landing page, and introduction page complete
3. **Game Mechanics Functional**: Price generation, Bitcoin behavior, and trading system working
4. **Data Visualization Complete**: All charts and visualizations implemented
5. **Game Modes Implemented**: Single player and class mode functioning
6. **Leaderboard & Analytics Working**: Score tracking and performance analysis operational
7. **Testing & Refinement Finished**: All major issues addressed, usability improved
8. **Deployment Ready**: Documentation complete, production build configured

## Critical Components

1. **Correlation-Based Price Generation**: Accurate implementation of the correlation matrix to create realistic market behavior
2. **Bitcoin Special Behavior**: Implementation of 4-year cycle, price-dependent returns, and adaptive volatility
3. **Real-time Synchronization**: Supabase real-time capabilities for class mode
4. **Data Visualization**: Effective charts to help users understand market dynamics
5. **State Management**: Proper handling of complex game and player states

By following this action-based plan, you'll be able to implement all aspects of the Investment Odyssey game systematically, focusing on the key components that make the simulation realistic and educational.
