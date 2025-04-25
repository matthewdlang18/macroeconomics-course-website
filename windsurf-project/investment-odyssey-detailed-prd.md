# Investment Odyssey - Detailed Product Requirements Document

## 1. Product Overview

### 1.1 Product Vision
Investment Odyssey is an interactive financial market simulation game designed to help users understand investment strategies, risk management, and portfolio diversification through hands-on experience. The application simulates real market behavior using correlation-based asset price generation and includes special mechanics like Bitcoin's 4-year cycle to provide an educational yet engaging experience.

### 1.2 Target Audience
- College students (primarily economics and finance students)
- Instructors and teaching assistants
- Individual learners interested in investing
- Financial literacy programs

### 1.3 Key Value Propositions
- Learn investment concepts through practical application
- Experience realistic market behavior without risking real money
- Understand correlation effects on portfolio diversification
- Gain insights into cryptocurrency market cycles
- Collaborate in classroom settings with real-time synchronization

## 2. Technical Specifications

### 2.1 Development Stack
- **Frontend**: React.js with functional components and hooks
- **State Management**: React Context API + useReducer
- **Styling**: Tailwind CSS for responsive design
- **Visualizations**: Chart.js for all data visualizations
- **Backend**: Supabase for authentication, database, and real-time capabilities
- **Hosting**: Vercel for frontend deployment

### 2.2 Supabase Integration

#### 2.2.1 Existing Tables
- **profiles**: User information with existing user data
- **sections**: Classroom sections with instructor assignments

#### 2.2.2 New Tables to Create
- **game_sessions**: Tracks active game sessions
  ```sql
  CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    current_round INTEGER DEFAULT 0,
    max_rounds INTEGER DEFAULT 20,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  ```

- **game_states**: Stores market conditions for each round
  ```sql
  CREATE TABLE game_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    asset_prices JSONB NOT NULL,
    price_history JSONB NOT NULL,
    cpi FLOAT NOT NULL,
    cpi_history JSONB NOT NULL,
    last_bitcoin_crash_round INTEGER DEFAULT 0,
    bitcoin_shock_range JSONB DEFAULT '[-0.5, -0.75]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(game_id, user_id, round_number)
  );
  ```

- **player_states**: Tracks player portfolio and actions
  ```sql
  CREATE TABLE player_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    cash FLOAT NOT NULL DEFAULT 10000,
    portfolio JSONB NOT NULL DEFAULT '{}',
    trade_history JSONB NOT NULL DEFAULT '[]',
    portfolio_value_history JSONB NOT NULL DEFAULT '[10000]',
    total_value FLOAT NOT NULL DEFAULT 10000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(game_id, user_id)
  );
  ```

- **leaderboard**: Records game results
  ```sql
  CREATE TABLE leaderboard (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    game_mode TEXT NOT NULL CHECK (game_mode IN ('single', 'class')),
    game_id UUID REFERENCES game_sessions(id) ON DELETE SET NULL,
    section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
    final_value FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, game_id)
  );
  ```

#### 2.2.3 Row Level Security Policies
- Implement appropriate RLS policies for each table
- Ensure instructors can only access their sections
- Ensure students can only access their own game data and class leaderboards

#### 2.2.4 Real-time Subscriptions
- Configure real-time subscriptions for game_sessions table
- Set up listener for round progression in class mode
- Enable real-time leaderboard updates

## 3. User Experience and Interface

### 3.1 Authentication & User Roles
- Login with email/password
- Registration with name, email, password
- User roles: student, instructor, administrator
- Section selection for students
- Section management for instructors

### 3.2 Introduction Page
The Introduction page is a critical component that explains game mechanics and investment concepts.

#### 3.2.1 Layout Components
- Header with navigation and user info
- Game overview section
- How to play instructions
- Asset classes information table
- Correlation matrix visualization
- Bitcoin special mechanics explanation
- Game mode selection

#### 3.2.2 Asset Information Table
Display the following risk-return characteristics:

| Asset Class | Average Return | Standard Deviation | Min Return | Max Return |
|------------|----------------|-------------------|------------|------------|
| S&P 500 | 11.51% | 19.49% | -43% | 50% |
| Bonds | 3.34% | 3.01% | 0.03% | 14% |
| Real Estate | 4.39% | 6.20% | -12% | 24% |
| Gold | 6.48% | 20.76% | -32% | 125% |
| Commodities | 8.15% | 15.22% | -25% | 200% |
| Bitcoin | 50.0% | 100.0% | -73% | 250% |

#### 3.2.3 Correlation Matrix Visualization
Create an interactive heatmap showing the following correlation matrix:

```
            S&P 500   Bonds    Real Estate   Gold    Commodities   Bitcoin
S&P 500     1.0000   -0.5169     0.3425     0.0199     0.1243      0.4057
Bonds      -0.5169    1.0000     0.0176     0.0289    -0.0235     -0.2259
Real Estate 0.3425    0.0176     1.0000    -0.4967    -0.0334      0.1559
Gold        0.0199    0.0289    -0.4967     1.0000     0.0995     -0.5343
Commodities 0.1243   -0.0235    -0.0334     0.0995     1.0000      0.0436
Bitcoin     0.4057   -0.2259     0.1559    -0.5343     0.0436      1.0000
```

#### 3.2.4 Bitcoin Special Mechanics Explanation
Provide visual and textual explanation of:
- 4-year market cycle (50% chance of crash every 4 rounds)
- Price-dependent returns based on price level
- Adaptive volatility as price increases
- Comparison with traditional assets

### 3.3 Game Interface

#### 3.3.1 Dashboard Layout
- Header with navigation, user info, and round indicator
- Portfolio summary panel
- Asset prices and performance table
- Trading interface
- Charts and visualizations area
- Game controls (next round, reset, etc.)

#### 3.3.2 Portfolio Summary Component
- Current cash display
- Portfolio value display
- Total value display
- Performance metrics (returns, etc.)
- Asset allocation summary

#### 3.3.3 Asset Prices Table
- Current prices for all assets
- Price change indicators (percentage and direction)
- Current holdings for each asset
- Value of holdings
- Percentage of portfolio

#### 3.3.4 Trading Interface
- Asset selection dropdown
- Buy/Sell action selection
- Quantity input
- Amount input (synchronized with quantity)
- Percentage-based shortcuts (25%, 50%, 75%, 100%)
- Execute trade button
- Trade history display

### 3.4 Data Visualization Components

#### 3.4.1 Portfolio Charts
- Portfolio value line chart
- Asset allocation pie chart
- Performance comparison with benchmarks
- Historical allocation changes

#### 3.4.2 Market Charts
- Individual asset price charts
- Comparative returns chart
- Correlation heatmap
- Bitcoin cycle visualization
- CPI and inflation chart

### 3.5 Game Modes

#### 3.5.1 Single Player Mode
- Start new game interface
- Round progression controls
- Game saving/loading functionality
- End game summary and analytics
- Submit to leaderboard option

#### 3.5.2 Class Game Mode
- Session creation for instructors
- Student joining interface
- Waiting room for students
- Synchronized round progression
- Class leaderboard with real-time updates
- Instructor control panel

### 3.6 Leaderboard & Analytics

#### 3.6.1 Leaderboard Interface
- Global leaderboard
- Class-specific leaderboards
- Filtering by time period, game mode, section
- Personal performance tracking
- Achievement badges

#### 3.6.2 Analytics Dashboard
- Student performance metrics
- Portfolio analysis tools
- Decision quality indicators
- Strategy effectiveness visualization
- Learning progress tracking

## 4. Game Mechanics Specifications

### 4.1 Game State Structure
```javascript
gameState = {
  roundNumber: 0,
  assetPrices: {
    'S&P 500': 100,
    'Bonds': 100,
    'Real Estate': 5000,
    'Gold': 3000,
    'Commodities': 100,
    'Bitcoin': 50000
  },
  priceHistory: {
    'S&P 500': [],
    'Bonds': [],
    'Real Estate': [],
    'Gold': [],
    'Commodities': [],
    'Bitcoin': []
  },
  cpi: 100,
  cpiHistory: [],
  lastBitcoinCrashRound: 0,
  bitcoinShockRange: [-0.5, -0.75]
}
```

### 4.2 Player State Structure
```javascript
playerState = {
  cash: 10000,
  portfolio: {
    'S&P 500': 0,
    'Bonds': 0,
    'Real Estate': 0,
    'Gold': 0,
    'Commodities': 0,
    'Bitcoin': 0
  },
  tradeHistory: [],
  portfolioValueHistory: [10000]
}
```

### 4.3 Price Generation Algorithm

#### 4.3.1 Correlated Returns Generation
Implement the following algorithm to generate correlated returns:

```javascript
function generateCorrelatedReturns() {
  // Asset names and their parameters
  const assetNames = Object.keys(assetReturns);
  const means = assetNames.map(asset => assetReturns[asset].mean);
  const stdDevs = assetNames.map(asset => assetReturns[asset].stdDev);

  // Generate uncorrelated standard normal random variables
  const uncorrelatedZ = [];
  for (let i = 0; i < assetNames.length; i++) {
    // Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    uncorrelatedZ.push(z);
  }

  // Apply correlation matrix to get correlated returns
  const correlatedReturns = {};
  
  // Handle Bitcoin separately
  const bitcoinReturn = generateBitcoinReturn();
  correlatedReturns['Bitcoin'] = bitcoinReturn;

  // Generate correlated returns for other assets
  for (let i = 0; i < assetNames.length - 1; i++) {
    const asset = assetNames[i];
    if (asset === 'Bitcoin') continue;

    let weightedReturn = 0;
    for (let j = 0; j < assetNames.length; j++) {
      weightedReturn += correlationMatrix[i][j] * uncorrelatedZ[j];
    }

    let assetReturn = means[i] + stdDevs[i] * weightedReturn;

    // Ensure return is within bounds
    assetReturn = Math.max(
      assetReturns[asset].min,
      Math.min(assetReturns[asset].max, assetReturn)
    );

    correlatedReturns[asset] = assetReturn;
  }

  return correlatedReturns;
}
```

#### 4.3.2 Bitcoin Special Return Generation
Implement Bitcoin's special behavior:

```javascript
function generateBitcoinReturn() {
  const bitcoinPrice = gameState.assetPrices['Bitcoin'];
  let bitcoinReturn;

  // Bitcoin has special growth patterns based on its price
  if (bitcoinPrice < 10000) {
    // Low price: rapid growth
    bitcoinReturn = 2 + Math.random() * 2; // Return between 200% and 400%
  } else if (bitcoinPrice >= 1000000) {
    // Very high price: crash
    bitcoinReturn = -0.3 - Math.random() * 0.2; // Return between -30% and -50%
  } else {
    // Normal price range: correlated with other assets but with high volatility
    // [Standard correlation-based return generation]

    // Adjust Bitcoin's return based on its current price
    const priceThreshold = 100000;
    if (bitcoinPrice > priceThreshold) {
      // Calculate how many increments above threshold
      const incrementsAboveThreshold = Math.max(0, (bitcoinPrice - priceThreshold) / 50000);

      // Reduce volatility as price grows (more mature asset)
      const volatilityReduction = Math.min(0.7, incrementsAboveThreshold * 0.05);
      const adjustedStdDev = assetReturns['Bitcoin'].stdDev * (1 - volatilityReduction);

      // [Recalculate return with reduced volatility]
    }

    // Check for Bitcoin crash (4-year cycle)
    if (gameState.roundNumber - gameState.lastBitcoinCrashRound >= 4) {
      if (Math.random() < 0.5) { // 50% chance of crash after 4 rounds
        // Apply shock based on current shock range
        bitcoinReturn = gameState.bitcoinShockRange[0] + Math.random() * 
          (gameState.bitcoinShockRange[1] - gameState.bitcoinShockRange[0]);
        
        // Update last crash round
        gameState.lastBitcoinCrashRound = gameState.roundNumber;
        
        // Update shock range for next crash (less severe but still negative)
        gameState.bitcoinShockRange = [
          Math.min(Math.max(gameState.bitcoinShockRange[0] + 0.1, -0.5), -0.05),
          Math.min(Math.max(gameState.bitcoinShockRange[1] + 0.1, -0.75), -0.15)
        ];
      }
    }
  }

  // Ensure Bitcoin return is within bounds
  bitcoinReturn = Math.max(
    assetReturns['Bitcoin'].min,
    Math.min(assetReturns['Bitcoin'].max, bitcoinReturn)
  );

  return bitcoinReturn;
}
```

### 4.4 Trading Functions

#### 4.4.1 Buy Asset Function
```javascript
function buyAsset(asset, quantity) {
  const price = gameState.assetPrices[asset];
  const cost = price * quantity;
  
  // Validate transaction
  if (cost > playerState.cash) {
    return { success: false, message: "Not enough cash" };
  }
  
  // Update player state
  playerState.cash -= cost;
  playerState.portfolio[asset] = (playerState.portfolio[asset] || 0) + quantity;
  
  // Record transaction
  playerState.tradeHistory.push({
    asset: asset,
    action: 'buy',
    quantity: quantity,
    price: price,
    cost: cost,
    timestamp: new Date().toISOString()
  });
  
  return { 
    success: true, 
    message: `Bought ${quantity} ${asset} for $${cost.toFixed(2)}` 
  };
}
```

#### 4.4.2 Sell Asset Function
```javascript
function sellAsset(asset, quantity) {
  const currentQuantity = playerState.portfolio[asset] || 0;
  const price = gameState.assetPrices[asset];
  
  // Validate transaction
  if (quantity > currentQuantity) {
    return { success: false, message: "Not enough assets to sell" };
  }
  
  const value = price * quantity;
  
  // Update player state
  playerState.cash += value;
  playerState.portfolio[asset] -= quantity;
  
  // Remove asset from portfolio if quantity is 0
  if (playerState.portfolio[asset] <= 0) {
    delete playerState.portfolio[asset];
  }
  
  // Record transaction
  playerState.tradeHistory.push({
    asset: asset,
    action: 'sell',
    quantity: quantity,
    price: price,
    value: value,
    timestamp: new Date().toISOString()
  });
  
  return { 
    success: true, 
    message: `Sold ${quantity} ${asset} for $${value.toFixed(2)}` 
  };
}
```

### 4.5 Portfolio Calculations

#### 4.5.1 Calculate Portfolio Value
```javascript
function calculatePortfolioValue() {
  let portfolioValue = 0;
  
  for (const [asset, quantity] of Object.entries(playerState.portfolio)) {
    const price = gameState.assetPrices[asset] || 0;
    portfolioValue += price * quantity;
  }
  
  return portfolioValue;
}
```

#### 4.5.2 Calculate Total Value
```javascript
function calculateTotalValue() {
  const portfolioValue = calculatePortfolioValue();
  return portfolioValue + playerState.cash;
}
```

### 4.6 CPI and Inflation

#### 4.6.1 Update CPI
```javascript
function updateCPI() {
  // Store current CPI in history
  gameState.cpiHistory.push(gameState.cpi);
  
  // Generate random CPI change (between -1% and 3%)
  const cpiChange = -0.01 + Math.random() * 0.04;
  
  // Update CPI
  gameState.cpi = gameState.cpi * (1 + cpiChange);
}
```

#### 4.6.2 Calculate Cash Injection
```javascript
function calculateCashInjection() {
  // Base amount increases each round
  const baseAmount = 5000 + (gameState.roundNumber * 500);
  const variability = 1000;
  
  // Generate random cash injection with increasing trend
  const cashInjection = baseAmount + (Math.random() * 2 - 1) * variability;
  
  return Math.max(0, cashInjection);
}
```

## 5. Database and State Management

### 5.1 Game State Persistence
- Save game state to Supabase after each round
- Handle concurrent updates for class mode
- Implement optimistic updates with fallback
- Create automatic save/restore functionality

### 5.2 Real-time Synchronization
- Configure Supabase real-time channels
- Subscribe to game session updates
- Handle round progression synchronization
- Implement state reconciliation for conflicts

### 5.3 Leaderboard Integration
- Save final game results to leaderboard
- Calculate rankings in real-time
- Implement filtering and sorting options
- Create achievement tracking

## 6. Responsive Design Requirements

### 6.1 Breakpoints
- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px and above

### 6.2 Mobile Adaptations
- Simplified trading interface
- Stacked layout instead of side-by-side
- Optimized charts for smaller screens
- Touch-friendly controls

### 6.3 Tablet Adaptations
- Hybrid layout with both stacked and side-by-side elements
- Adjustable chart sizes
- Optimized navigation

### 6.4 Desktop Experience
- Full dashboard experience
- Multiple charts visible simultaneously
- Advanced trading controls
- Detailed analytics

## 7. Performance Requirements

### 7.1 Loading Times
- Initial page load: < 3 seconds
- Round transition: < 1 second
- Trading execution: < 500ms
- Chart updates: < 300ms

### 7.2 Optimization Strategies
- Lazy loading of components
- Memoization of calculations
- Efficient state updates
- Asset preloading for critical elements

## 8. Accessibility Requirements

### 8.1 Compliance Standards
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Sufficient color contrast

### 8.2 Implementation Details
- Semantic HTML structure
- ARIA attributes where appropriate
- Focus management
- Alternative text for charts and visualizations

## 9. Testing Requirements

### 9.1 Unit Testing
- Test all core game mechanics
- Validate price generation algorithms
- Test portfolio calculations
- Verify Bitcoin special behavior

### 9.2 Integration Testing
- Test Supabase integration
- Validate real-time synchronization
- Test authentication flows
- Verify leaderboard functionality

### 9.3 User Testing
- Usability testing with target audience
- Performance testing across devices
- Accessibility testing
- Cross-browser compatibility

## 10. Implementation Milestones

### 10.1 Phase 1: Foundation (Week 1-2)
- Project setup
- Supabase integration
- Authentication
- Basic UI components

### 10.2 Phase 2: Core Game (Week 3-6)
- Game state management
- Price generation algorithms
- Trading system
- Basic visualization

### 10.3 Phase 3: Game Modes (Week 7-10)
- Single player mode
- Class game mode
- Real-time synchronization
- Leaderboard

### 10.4 Phase 4: Polish & Launch (Week 11-14)
- Advanced visualizations
- Analytics
- Testing and refinement
- Documentation and deployment

## 11. Documentation Requirements

### 11.1 User Documentation
- Student user guide
- Instructor manual
- Help/FAQ section
- Tutorial videos/walkthroughs

### 11.2 Technical Documentation
- API documentation
- Database schema
- State management overview
- Component hierarchy

## 12. Success Criteria

### 12.1 Functional Success
- All game mechanics work as specified
- Real-time synchronization functions reliably
- Data visualization accurately represents market state
- Leaderboard and analytics provide meaningful insights

### 12.2 User Experience Success
- Intuitive interface with minimal learning curve
- Engaging gameplay that maintains interest
- Educational value demonstrated through user surveys
- Positive feedback from instructors and students

### 12.3 Technical Success
- Performance metrics met across all devices
- Accessibility compliance achieved
- No critical bugs or issues
- Scalable to handle classroom-sized user groups

## 13. Future Enhancements

### 13.1 Advanced Features
- Monte Carlo simulations for extended timeframes
- Customizable game parameters
- Market event scenarios (crashes, booms, etc.)
- Economic indicator effects on markets

### 13.2 Integration Possibilities
- Export to educational platforms
- API for third-party integration
- Mobile app version
- Connection with external financial data sources
