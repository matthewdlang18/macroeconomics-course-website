/* Property Card Styles */
.property-card {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  background-color: white;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 350px;
  margin-bottom: 1rem;
}

.property-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.property-image {
  height: 180px;
  background-size: cover;
  background-position: center;
  position: relative;
}

.for-sale-tag {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: var(--danger-color);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
}

.property-details {
  padding: 1rem;
}

.property-details h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
  color: var(--text-primary);
}

.property-specs {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.property-neighborhood {
  font-size: 0.9rem;
  color: var(--secondary-dark);
  margin-bottom: 0.5rem;
}

.property-value {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.current-value {
  font-size: 1.1rem;
  font-weight: bold;
  color: var(--text-primary);
}

.value-change {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
}

.value-change.positive {
  background-color: rgba(46, 125, 50, 0.1);
  color: var(--success-color);
}

.value-change.negative {
  background-color: rgba(198, 40, 40, 0.1);
  color: var(--danger-color);
}

.asking-price {
  font-size: 0.9rem;
  color: var(--danger-color);
  margin-bottom: 0.5rem;
}

.sell-button {
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem;
  font-size: 0.9rem;
  cursor: pointer;
  width: 100%;
}

.sell-button:hover {
  background-color: var(--primary-dark);
}

/* Market Indicators Styles */
.market-indicators {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.market-indicators h2 {
  margin-top: 0;
  font-size: 1.3rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}

.phase-indicator {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.phase-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: bold;
  color: white;
}

.phase-badge.stable {
  background-color: var(--phase-stable);
}

.phase-badge.rising {
  background-color: var(--phase-rising);
}

.phase-badge.hot {
  background-color: var(--phase-hot);
  color: var(--text-primary);
}

.phase-badge.top {
  background-color: var(--phase-top);
  color: var(--text-primary);
}

.phase-badge.initial_decline {
  background-color: var(--phase-initial_decline);
}

.phase-badge.crash {
  background-color: var(--phase-crash);
}

.phase-badge.recovery {
  background-color: var(--phase-recovery);
}

.price-chart {
  margin-bottom: 1.5rem;
}

.chart-container {
  position: relative;
}

.key-indicators {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.indicator-item {
  display: flex;
  flex-direction: column;
}

.indicator-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.indicator-value {
  font-size: 1.1rem;
  font-weight: 500;
}

.indicator-value.positive {
  color: var(--success-color);
}

.indicator-value.negative {
  color: var(--danger-color);
}

.indicator-value.high {
  color: var(--warning-color);
}

.indicator-value.low {
  color: var(--success-color);
}

.market-indices {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.market-indices h3 {
  grid-column: 1 / -1;
  margin: 0.5rem 0;
  font-size: 1.1rem;
}

.index-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  border-radius: 4px;
  background-color: rgba(0,0,0,0.03);
}

.index-label {
  font-size: 0.9rem;
}

.index-value {
  font-weight: bold;
  font-size: 1rem;
}

.index-value.high {
  color: var(--warning-color);
}

.index-value.low {
  color: var(--success-color);
}

/* Active Game Layout */
.active-game {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.game-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 1.5rem;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.neighborhood-map-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 1rem;
  overflow: hidden;
}

.property-browser-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 1rem;
}

.property-detail-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 1rem;
}

/* Round Status Styles */
.round-status {
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 1rem;
  min-width: 300px;
}

.round-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.round-number {
  font-size: 1.2rem;
  font-weight: bold;
}

.phase-label {
  font-size: 1rem;
  padding: 2px 8px;
  border-radius: 4px;
  background-color: rgba(0,0,0,0.05);
}

.status-indicator {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.status-text {
  font-weight: bold;
}

.timer {
  font-family: monospace;
  font-size: 1.2rem;
  font-weight: bold;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: rgba(0,0,0,0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background-color: var(--primary-color);
  transition: width 1s linear;
}

.round-status.active .status-text {
  color: var(--success-color);
}

.round-status.waiting .status-text {
  color: var(--warning-color);
}

.round-status.processing .status-text {
  color: var(--secondary-color);
}

/* Game News Styles */
.game-news {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 1rem;
}

.game-news h3 {
  margin-top: 0;
  font-size: 1.1rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}

.news-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.news-item {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
  background-color: rgba(0,0,0,0.03);
}

.news-icon {
  font-size: 1.5rem;
  display: flex;
  align-items: center;
}

.news-content {
  flex: 1;
}

.news-headline {
  font-size: 0.9rem;
  margin-bottom: 0.2rem;
}

.news-round {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.no-news {
  color: var(--text-secondary);
  font-style: italic;
  text-align: center;
  padding: 1rem;
}

/* TA Control Panel Styles */
.market-phase-control {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.market-phase-control h3 {
  margin-top: 0;
  font-size: 1.1rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}

.current-phase {
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.phase-value {
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 4px;
  color: white;
}

.phase-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.phase-button {
  border: none;
  border-radius: 4px;
  padding: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: bold;
  color: white;
  transition: opacity 0.2s;
}

.phase-button:hover:not(:disabled) {
  opacity: 0.9;
}

.phase-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.phase-button.stable {
  background-color: var(--phase-stable);
}

.phase-button.rising {
  background-color: var(--phase-rising);
}

.phase-button.hot {
  background-color: var(--phase-hot);
  color: var(--text-primary);
}

.phase-button.top {
  background-color: var(--phase-top);
  color: var(--text-primary);
}

.phase-button.initial_decline {
  background-color: var(--phase-initial_decline);
}

.phase-button.crash {
  background-color: var(--phase-crash);
}

.phase-button.recovery {
  background-color: var(--phase-recovery);
}

.phase-confirmation {
  background-color: rgba(249, 168, 37, 0.1);
  border: 1px solid var(--warning-color);
  border-radius: 4px;
  padding: 1rem;
  margin-top: 1rem;
}

.confirmation-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.confirm-btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
}

.cancel-btn {
  background-color: var(--danger-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
}

/* Event Injector Styles */
.event-injector {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.event-injector h3 {
  margin-top: 0;
  font-size: 1.1rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}

.event-description {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 0.2rem;
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.slider {
  flex: 1;
}

.slider-value {
  font-weight: bold;
}

.inject-event-btn {
  background-color: var(--secondary-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
}

/* Student Performance Table Styles */
.student-performance-table {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 1rem;
  overflow-x: auto;
}

.student-performance-table table {
  width: 100%;
  border-collapse: collapse;
}

.student-performance-table th {
  text-align: left;
  padding: 0.8rem;
  border-bottom: 2px solid var(--border-color);
  cursor: pointer;
}

.student-performance-table th.sorted {
  background-color: rgba(0,0,0,0.05);
}

.student-performance-table th.sorted::after {
  content: '↓';
  display: inline-block;
  margin-left: 0.5rem;
}

.student-performance-table th.sorted.asc::after {
  content: '↑';
}

.student-performance-table td {
  padding: 0.8rem;
  border-bottom: 1px solid var(--border-color);
}

.student-performance-table tr:hover {
  background-color: rgba(0,0,0,0.02);
}

.student-performance-table .top-performer {
  background-color: rgba(46, 125, 50, 0.05);
}

.rank {
  font-weight: bold;
  text-align: center;
}

.top-performer:nth-child(1) .rank {
  color: var(--primary-color);
}

.total-return.positive {
  color: var(--success-color);
}

.total-return.negative {
  color: var(--danger-color);
}

/* Media Queries for Responsive Design */
@media (max-width: 768px) {
  .game-layout {
    grid-template-columns: 1fr;
  }
  
  .key-indicators {
    grid-template-columns: 1fr;
  }
  
  .market-indices {
    grid-template-columns: 1fr;
  }
  
  .phase-options {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

## Final Implementation Steps

To fully implement the BubbleVille housing market simulation game, follow these steps:

1. **Set Up Firebase Project**
   - Create a new Firebase project
   - Enable Firestore database
   - Set up authentication (email/password or Google)
   - Create security rules to protect data

2. **Initialize Project Structure**
   - Create React frontend using Create React App or Vite
   - Set up Flask backend
   - Configure project for GitHub Pages deployment

3. **Implement Core Backend Services**
   - Set up Flask API endpoints
   - Implement market simulation engine
   - Create property valuation system
   - Develop transaction processing

4. **Develop Frontend Components**
   - Build user interfaces for students and TAs
   - Implement data visualization for market trends
   - Create responsive design for all screen sizes

5. **Connect Frontend and Backend**
   - Set up API client services
   - Implement real-time updates with Firebase
   - Handle authentication and session management

6. **Testing and Refinement**
   - Test with simulated players
   - Balance economic parameters
   - Fine-tune market dynamics
   - Optimize performance

7. **Deployment**
   - Deploy frontend to GitHub Pages
   - Set up GitHub Actions for CI/CD
   - Configure serverless functions for backend
   - Test full deployment

8. **Documentation**
   - Create user guide for students
   - Develop TA instruction manual
   - Document code for future maintenance

## Educational Integration

### Classroom Use Guidelines

1. **Pre-Game Preparation**
   - Introduce economic concepts related to housing markets
   - Explain basic game mechanics
   - Assign readings on housing bubbles (e.g., 2008 crisis)

2. **Game Session Structure**
   - 15-minute introduction
   - 45-60 minutes of gameplay (12-15 rounds)
   - 20-30 minutes for debrief and discussion

3. **Discussion Topics**
   - Factors that contributed to bubble formation
   - Signals that indicated market turning points
   - Impact of regulatory decisions
   - Strategies that succeeded vs. failed

4. **Follow-Up Assignments**
   - Analysis of personal performance
   - Comparison to historical housing markets
   - Proposals for market stabilization policies

### Learning Objectives Assessment

This simulation helps students understand:

1. **Systemic Risk**: How individual rational decisions can collectively create systemic problems
2. **Market Psychology**: The role of FOMO, speculation, and sentiment in pricing
3. **Debt Dynamics**: The relationship between interest rates, affordability, and prices
4. **Policy Effects**: How regulatory decisions impact market behavior
5. **Economic Cycles**: The natural progression of market phases

## Conclusion

BubbleVille provides an engaging, interactive way for students to experience housing market dynamics firsthand. By creating a multiplayer environment where decisions directly affect other players and the overall market, it demonstrates economic principles in a tangible way.

The game's design allows for:
- Direct experience with market feedback loops
- Visualization of economic data and trends
- Social learning through competition and collaboration
- Meaningful connections to real-world financial systems

By implementing this game, you'll create a valuable teaching tool that makes abstract economic concepts concrete and memorable for your students, while providing a framework to discuss important topics in macroeconomics.
// GameNews.jsx
import React from 'react';

const GameNews = ({ events, currentRound }) => {
  // Filter to show only recent events
  const recentEvents = events
    ? events
      .filter(event => event.round >= currentRound - 3) // Show last 3 rounds
      .sort((a, b) => b.round - a.round) // Latest first
    : [];
  
  // Get icon for event type
  const getEventIcon = (type) => {
    switch(type) {
      case 'interest_rate_change':
        return '💰';
      case 'population_change':
        return '👥';
      case 'economic_news':
        return '📰';
      case 'tax_policy':
        return '📝';
      case 'building_regulations':
        return '🏗️';
      case 'natural_disaster':
        return '🌪️';
      case 'foreign_investment':
        return '🌏';
      case 'custom_event':
        return '📊';
      default:
        return '📣';
    }
  };
  
  // Get headline for event
  const getEventHeadline = (event) => {
    if (event.details && event.details.description) {
      return event.details.description;
    }
    
    switch(event.type) {
      case 'interest_rate_change':
        return `Interest rates ${event.details?.amount < 0 ? 'decrease' : 'increase'} by ${Math.abs(event.details?.amount || 0)}%`;
      case 'population_change':
        return `Population ${event.details?.amount < 0 ? 'declines' : 'grows'} by ${Math.abs(event.details?.amount || 0)}%`;
      case 'economic_news':
        return `Economic forecast ${event.details?.sentiment === 'negative' ? 'worsens' : 'improves'}`;
      case 'tax_policy':
        return `Property taxes ${event.details?.amount < 0 ? 'decrease' : 'increase'} by ${Math.abs(event.details?.amount || 0)}%`;
      case 'building_regulations':
        return `Building regulations ${event.details?.restrictiveness === 'relaxed' ? 'relaxed' : 'tightened'}`;
      case 'natural_disaster':
        return `Natural disaster affects housing market`;
      case 'foreign_investment':
        return `Foreign investment ${event.details?.direction === 'decrease' ? 'leaves' : 'enters'} the market`;
      default:
        return `Market event: ${event.type.replace('_', ' ')}`;
    }
  };
  
  return (
    <div className="game-news">
      <h3>Market News</h3>
      
      {recentEvents.length > 0 ? (
        <div className="news-list">
          {recentEvents.map((event, index) => (
            <div key={index} className="news-item">
              <div className="news-icon">{getEventIcon(event.type)}</div>
              <div className="news-content">
                <div className="news-headline">
                  {getEventHeadline(event)}
                </div>
                <div className="news-round">Round {event.round}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-news">
          <p>No recent market events</p>
        </div>
      )}
    </div>
  );
};

export default GameNews;
```

### 6. MarketPhaseControl Component

```jsx
// MarketPhaseControl.jsx
import React, { useState } from 'react';

const MarketPhaseControl = ({ currentPhase, onPhaseChange }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState(null);
  
  const phases = [
    { value: 'stable', label: 'Stable Market', description: 'Modest, steady growth with balanced fundamentals' },
    { value: 'rising', label: 'Rising Market', description: 'Accelerating appreciation and increasing transaction volume' },
    { value: 'hot', label: 'Hot Market', description: 'Rapid price increases and speculative behavior' },
    { value: 'top', label: 'Market Top', description: 'Peak prices with early warning signs appearing' },
    { value: 'initial_decline', label: 'Initial Decline', description: 'Stagnant or falling prices with declining volume' },
    { value: 'crash', label: 'Market Crash', description: 'Sharp price declines and illiquid market conditions' },
    { value: 'recovery', label: 'Recovery', description: 'Stabilizing prices and return of transaction activity' }
  ];
  
  const handlePhaseClick = (phase) => {
    if (phase === currentPhase) return;
    
    setSelectedPhase(phase);
    setShowConfirmation(true);
  };
  
  const confirmPhaseChange = () => {
    onPhaseChange(selectedPhase);
    setShowConfirmation(false);
  };
  
  const cancelPhaseChange = () => {
    setSelectedPhase(null);
    setShowConfirmation(false);
  };
  
  // Format phase for display
  const formatPhase = (phaseStr) => {
    if (!phaseStr) return '';
    
    return phaseStr
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  return (
    <div className="market-phase-control">
      <h3>Market Phase</h3>
      <div className="current-phase">
        <span className="phase-label">Current:</span>
        <span className={`phase-value ${currentPhase}`}>
          {formatPhase(currentPhase)}
        </span>
      </div>
      
      <div className="phase-options">
        {phases.map(phase => (
          <button
            key={phase.value}
            className={`phase-button ${phase.value} ${phase.value === currentPhase ? 'active' : ''}`}
            onClick={() => handlePhaseClick(phase.value)}
            disabled={phase.value === currentPhase}
          >
            {formatPhase(phase.value)}
          </button>
        ))}
      </div>
      
      {showConfirmation && (
        <div className="phase-confirmation">
          <p>
            <strong>Warning:</strong> Changing market phase will significantly affect property values and economic conditions.
          </p>
          <p>
            Change to <span className={`phase-value ${selectedPhase}`}>{formatPhase(selectedPhase)}</span>?
          </p>
          <div className="confirmation-actions">
            <button onClick={confirmPhaseChange} className="confirm-btn">
              Confirm Change
            </button>
            <button onClick={cancelPhaseChange} className="cancel-btn">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketPhaseControl;
```

### 7. StudentPerformanceTable Component

```jsx
// StudentPerformanceTable.jsx
import React, { useState } from 'react';
import { formatCurrency, formatPercent } from '../utils/formatters';

const StudentPerformanceTable = ({ students }) => {
  const [sortField, setSortField] = useState('totalReturn');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Handle sort change
  const handleSort = (field) => {
    if (field === sortField) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to descending for new field
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Sort students based on current sort settings
  const sortedStudents = [...students].sort((a, b) => {
    let aValue, bValue;
    
    switch(sortField) {
      case 'name':
        aValue = a.name || '';
        bValue = b.name || '';
        break;
      case 'netWorth':
        aValue = a.performance?.net_worth || 0;
        bValue = b.performance?.net_worth || 0;
        break;
      case 'totalReturn':
        aValue = a.performance?.total_return || 0;
        bValue = b.performance?.total_return || 0;
        break;
      case 'propertyCount':
        aValue = a.properties?.length || 0;
        bValue = b.properties?.length || 0;
        break;
      case 'cash':
        aValue = a.cash || 0;
        bValue = b.cash || 0;
        break;
      default:
        aValue = a.performance?.total_return || 0;
        bValue = b.performance?.total_return || 0;
    }
    
    // Compare based on direction
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
  
  // Assign ranks based on total return
  const rankedStudents = sortedStudents.map((student, index) => ({
    ...student,
    rank: index + 1
  }));
  
  return (
    <div className="student-performance-table">
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th
              className={sortField === 'name' ? `sorted ${sortDirection}` : ''}
              onClick={() => handleSort('name')}
            >
              Student
            </th>
            <th
              className={sortField === 'netWorth' ? `sorted ${sortDirection}` : ''}
              onClick={() => handleSort('netWorth')}
            >
              Net Worth
            </th>
            <th
              className={sortField === 'totalReturn' ? `sorted ${sortDirection}` : ''}
              onClick={() => handleSort('totalReturn')}
            >
              Total Return
            </th>
            <th
              className={sortField === 'propertyCount' ? `sorted ${sortDirection}` : ''}
              onClick={() => handleSort('propertyCount')}
            >
              Properties
            </th>
            <th
              className={sortField === 'cash' ? `sorted ${sortDirection}` : ''}
              onClick={() => handleSort('cash')}
            >
              Cash
            </th>
          </tr>
        </thead>
        <tbody>
          {rankedStudents.map((student, index) => (
            <tr key={student.id} className={index < 3 ? 'top-performer' : ''}>
              <td className="rank">{student.rank}</td>
              <td className="student-name">{student.name}</td>
              <td className="net-worth">{formatCurrency(student.performance?.net_worth || 0)}</td>
              <td className={`total-return ${(student.performance?.total_return || 0) >= 0 ? 'positive' : 'negative'}`}>
                {formatPercent(student.performance?.total_return || 0)}
              </td>
              <td className="property-count">{student.properties?.length || 0}</td>
              <td className="cash">{formatCurrency(student.cash || 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudentPerformanceTable;
```

### 8. Property Assignment Service

```python
# property_assignment.py

import random
from google.cloud import firestore
from faker import Faker

fake = Faker()

def assign_initial_properties(session_id):
    """
    Assign initial properties to players based on session configuration
    """
    db = firestore.Client()
    
    # Get session configuration
    session_ref = db.collection('sessions').document(session_id)
    session = session_ref.get().to_dict()
    
    if not session:
        raise ValueError(f"Session {session_id} not found")
    
    properties_per_student = session['config'].get('properties_per_student', 2)
    
    # Get all players in this session
    players_query = db.collection('players').where('session_id', '==', session_id)
    players = list(players_query.stream())
    
    # Get all available (unassigned) properties
    properties_query = db.collection('properties').where('session_id', '==', session_id).where('owner_id', '==', None)
    available_properties = list(properties_query.stream())
    
    if len(available_properties) < len(players) * properties_per_student:
        # Create more properties if needed
        from property_generator import generate_properties
        additional_needed = (len(players) * properties_per_student) - len(available_properties)
        generate_properties(session_id, additional_needed)
        
        # Refresh available properties list
        properties_query = db.collection('properties').where('session_id', '==', session_id).where('owner_id', '==', None)
        available_properties = list(properties_query.stream())
    
    # Shuffle properties for random distribution
    random.shuffle(available_properties)
    
    # Track assignments for reporting
    assignments = {}
    
    # Use a batch for efficient updates
    batch = db.batch()
    
    # Assign properties to each player
    for player in players:
        player_id = player.id
        player_data = player.to_dict()
        player_ref = db.collection('players').document(player_id)
        
        # Skip players who already have properties
        if player_data.get('properties') and len(player_data['properties']) >= properties_per_student:
            continue
        
        # Find properties to assign to this player
        player_properties = []
        cash_spent = 0
        
        for _ in range(properties_per_student):
            if not available_properties:
                break
                
            # Get next available property
            prop = available_properties.pop()
            prop_id = prop.id
            prop_data = prop.to_dict()
            prop_ref = db.collection('properties').document(prop_id)
            
            # Calculate purchase price (at 90% of initial value to give some equity)
            purchase_price = prop_data['initial_value'] * 0.9
            
            # Calculate down payment (20% of purchase price)
            down_payment = purchase_price * 0.2
            
            # Calculate loan amount
            loan_amount = purchase_price - down_payment
            
            # Create loan record
            interest_rate = session['config'].get('interest_rate_base', 4.5)
            term_years = 30
            monthly_rate = interest_rate / 100 / 12
            num_payments = term_years * 12
            monthly_payment = (loan_amount * monthly_rate) / (1 - (1 + monthly_rate) ** -num_payments)
            
            loan = {
                'property_id': prop_id,
                'principal': loan_amount,
                'interest_rate': interest_rate,
                'term_years': term_years,
                'monthly_payment': monthly_payment,
                'originated_round': 0
            }
            
            # Deduct down payment from player's cash
            cash_spent += down_payment
            
            # Update property data
            batch.update(prop_ref, {
                'owner_id': player_id,
                'for_sale': False,
                'last_sale_price': purchase_price,
                'last_sale_round': 0
            })
            
            # Track for player update
            player_properties.append(prop_id)
            
            # Track for reporting
            if player_id not in assignments:
                assignments[player_id] = []
                
            assignments[player_id].append({
                'property_id': prop_id,
                'address': prop_data['address'],
                'purchase_price': purchase_price,
                'down_payment': down_payment
            })
        
        # Update player record
        existing_properties = player_data.get('properties', [])
        existing_loans = player_data.get('loans', [])
        
        batch.update(player_ref, {
            'properties': existing_properties + player_properties,
            'loans': existing_loans + [loan for _ in range(len(player_properties))],
            'cash': player_data['cash'] - cash_spent
        })
    
    # Commit all changes
    batch.commit()
    
    return {
        'success': True,
        'assignments': assignments
    }
```

### 9. Property Generator Service

```python
# property_generator.py

import random
from google.cloud import firestore
from faker import Faker

fake = Faker()

def generate_properties(session_id, count):
    """
    Generate properties for a new game session
    """
    db = firestore.Client()
    
    # Get session configuration
    session_ref = db.collection('sessions').document(session_id)
    session = session_ref.get().to_dict()
    
    if not session:
        raise ValueError(f"Session {session_id} not found")
    
    # Get neighborhoods for this session
    neighborhoods_query = db.collection('neighborhoods').where('session_id', '==', session_id)
    neighborhoods = list(neighborhoods_query.stream())
    
    if not neighborhoods:
        raise ValueError(f"No neighborhoods found for session {session_id}")
    
    neighborhoods_data = {n.id: n.to_dict() for n in neighborhoods}
    
    # Property types with bedroom/bathroom configurations
    property_types = [
        {
            'type': 'single_family',
            'bedrooms': [2, 3, 4, 5],
            'bathrooms': [1, 1.5, 2, 2.5, 3],
            'sqft_range': (1200, 3500),
            'base_value_multiplier': 1.0
        },
        {
            'type': 'condo',
            'bedrooms': [1, 2, 3],
            'bathrooms': [1, 1.5, 2],
            'sqft_range': (600, 1800),
            'base_value_multiplier': 0.85
        },
        {
            'type': 'townhouse',
            'bedrooms': [2, 3, 4],
            'bathrooms': [1.5, 2, 2.5, 3],
            'sqft_range': (1000, 2200),
            'base_value_multiplier': 0.9
        },
        {
            'type': 'multi_family',
            'bedrooms': [4, 6, 8],
            'bathrooms': [2, 3, 4],
            'sqft_range': (2000, 4000),
            'base_value_multiplier': 1.2
        }
    ]
    
    # Street names and types
    street_types = ['St', 'Ave', 'Blvd', 'Dr', 'Ln', 'Way', 'Pl', 'Ct']
    
    # Generate properties
    properties = []
    
    for _ in range(count):
        # Select random neighborhood
        neighborhood_id = random.choice(list(neighborhoods_data.keys()))
        neighborhood = neighborhoods_data[neighborhood_id]
        
        # Select random property type
        property_type = random.choice(property_types)
        
        # Generate property details
        bedrooms = random.choice(property_type['bedrooms'])
        bathrooms = random.choice(property_type['bathrooms'])
        sqft = random.randint(*property_type['sqft_range'])
        
        # Generate address
        street_number = random.randint(100, 9999)
        street_name = fake.last_name()
        street_type = random.choice(street_types)
        address = f"{street_number} {street_name} {street_type}"
        
        # Calculate base value
        # Base value formula: $100 per sqft, adjusted for property type and neighborhood
        base_value = 100 * sqft
        type_adjusted = base_value * property_type['base_value_multiplier']
        
        # Adjust for bedrooms/bathrooms (more rooms = higher value)
        room_factor = 1.0 + ((bedrooms - 2) * 0.1) + ((bathrooms - 1) * 0.05)
        room_adjusted = type_adjusted * room_factor
        
        # Adjust for neighborhood
        neighborhood_factor = neighborhood.get('avg_price_history', [{}])[0].get('value', 250000) / 250000
        final_value = room_adjusted * neighborhood_factor
        
        # Add some randomness (±10%)
        random_factor = 0.9 + (random.random() * 0.2)  # 0.9 to 1.1
        final_value = int(final_value * random_factor)
        
        # Round to nearest 5000
        final_value = round(final_value / 5000) * 5000
        
        # Property condition (0.7 to 1.0)
        condition = 0.7 + (random.random() * 0.3)
        
        # Calculate rental income (0.7% of value per month, on average)
        rental_income = int(final_value * (0.006 + (random.random() * 0.002)))
        
        # Create property object
        property_data = {
            'session_id': session_id,
            'address': address,
            'neighborhood': neighborhood['name'],
            'type': property_type['type'],
            'bedrooms': bedrooms,
            'bathrooms': bathrooms,
            'sqft': sqft,
            'initial_value': final_value,
            'current_value': final_value,
            'value_history': [
                {'round': 0, 'value': final_value}
            ],
            'for_sale': False,
            'asking_price': None,
            'owner_id': None,
            'rental_income': rental_income,
            'condition': condition
        }
        
        # Add to database
        db.collection('properties').add(property_data)
        properties.append(property_data)
        
        # Update neighborhood inventory count
        neighborhood_ref = db.collection('neighborhoods').document(neighborhood_id)
        neighborhood_ref.update({
            'inventory': firestore.Increment(1)
        })
    
    return properties
```

### 10. Event Processor Service

```python
# event_processor.py

from google.cloud import firestore

def process_event(session_id, event):
    """
    Process the effects of an economic event on the market
    """
    db = firestore.Client()
    
    # Get session data
    session_ref = db.collection('sessions').document(session_id)
    session = session_ref.get().to_dict()
    
    # Get market data
    market_query = db.collection('market_data').where('session_id', '==', session_id).limit(1)
    market_docs = list(market_query.stream())
    
    if not market_docs:
        raise ValueError(f"No market data found for session {session_id}")
        
    market_ref = market_docs[0].reference
    market_data = market_docs[0].to_dict()
    
    # Process event effects based on type
    effects = {}
    event_type = event['type']
    event_details = event.get('details', {})
    
    if event_type == 'interest_rate_change':
        # Update base interest rate
        amount = event_details.get('amount', 0)
        current_rate = session['config'].get('interest_rate_base', 4.5)
        new_rate = max(1, min(10, current_rate + amount))  # Limit between 1% and 10%
        
        session_ref.update({
            'config.interest_rate_base': new_rate
        })
        
        # Update market sentiment
        sentiment_effect = -0.5 * amount  # Higher rates = lower sentiment
        update_market_sentiment(market_ref, market_data, sentiment_effect)
        
        effects['interest_rate'] = amount
        effects['market_sentiment'] = sentiment_effect
    
    elif event_type == 'population_change':
        # Population affects housing demand
        amount = event_details.get('amount', 0)
        
        # Update housing demand index
        demand_effect = 0.8 * amount
        update_market_index(market_ref, market_data, 'housing_supply_index', -demand_effect)
        
        # Update market sentiment
        sentiment_effect = 0.3 * amount
        update_market_sentiment(market_ref, market_data, sentiment_effect)
        
        effects['housing_demand'] = demand_effect
        effects['market_sentiment'] = sentiment_effect
    
    elif event_type == 'economic_news':
        # Economic news primarily affects sentiment
        magnitude = event_details.get('magnitude', 0.5)
        direction = 1 if event_details.get('sentiment') == 'positive' else -1
        sentiment_effect = direction * magnitude
        
        update_market_sentiment(market_ref, market_data, sentiment_effect)
        
        effects['market_sentiment'] = sentiment_effect
    
    elif event_type == 'tax_policy':
        # Tax policy affects affordability
        amount = event_details.get('amount', 0)
        
        # Update affordability index
        affordability_effect = -0.7 * amount
        update_market_index(market_ref, market_data, 'affordability_index', affordability_effect)
        
        # Update market sentiment
        sentiment_effect = -0.3 * amount
        update_market_sentiment(market_ref, market_data, sentiment_effect)
        
        effects['affordability_index'] = affordability_effect
        effects['market_sentiment'] = sentiment_effect
    
    elif event_type == 'building_regulations':
        # Building regulations affect housing supply
        restrictiveness = 1 if event_details.get('restrictiveness') == 'tightened' else -1
        magnitude = event_details.get('magnitude', 0.5)
        supply_effect = -restrictiveness * magnitude
        
        # Update housing supply index
        update_market_index(market_ref, market_data, 'housing_supply_index', supply_effect)
        
        effects['housing_supply_index'] = supply_effect
    
    elif event_type == 'natural_disaster':
        # Natural disasters affect housing supply and sentiment
        severity = event_details.get('severity', 0.5)
        
        # Update housing supply index
        supply_effect = -0.4 * severity
        update_market_index(market_ref, market_data, 'housing_supply_index', supply_effect)
        
        # Update market sentiment
        sentiment_effect = -0.6 * severity
        update_market_sentiment(market_ref, market_data, sentiment_effect)
        
        effects['housing_supply_index'] = supply_effect
        effects['market_sentiment'] = sentiment_effect
    
    elif event_type == 'foreign_investment':
        # Foreign investment affects speculation and sentiment
        amount = event_details.get('amount', 0.5)
        direction = 1 if event_details.get('direction') == 'increase' else -1
        
        # Update speculative activity index
        speculation_effect = direction * amount
        update_market_index(market_ref, market_data, 'speculative_activity_index', speculation_effect)
        
        # Update market sentiment
        sentiment_effect = 0.5 * speculation_effect
        update_market_sentiment(market_ref, market_data, sentiment_effect)
        
        effects['speculative_activity_index'] = speculation_effect
        effects['market_sentiment'] = sentiment_effect
    
    # Add event to news feed for all players
    # (This could be done by having players listen to the events array in the session)
    
    return effects

def update_market_sentiment(market_ref, market_data, change):
    """
    Update market sentiment index with bounds checking
    """
    latest_round = market_data['rounds'][-1]
    current_sentiment = latest_round.get('market_sentiment', 0.5)
    
    # Sentiment is bound between 0.1 and 0.9
    new_sentiment = max(0.1, min(0.9, current_sentiment + change))
    
    market_ref.update({
        'rounds.{}.market_sentiment'.format(len(market_data['rounds']) - 1): new_sentiment
    })
    
    return new_sentiment

def update_market_index(market_ref, market_data, index_name, change):
    """
    Update a market index with bounds checking
    """
    current_value = market_data['market_indices'].get(index_name, 100)
    
    # Indices are bound between 50 and 150
    new_value = max(50, min(150, current_value + (change * 10)))
    
    market_ref.update({
        'market_indices.{}'.format(index_name): new_value
    })
    
    return new_value
```

## CSS Styling

Here's a sample of the CSS styling for the main components of the BubbleVille application:

```css
/* Main application styles */
:root {
  --primary-color: #2e7d32;
  --primary-light: #60ad5e;
  --primary-dark: #005005;
  --secondary-color: #1565c0;
  --secondary-light: #5e92f3;
  --secondary-dark: #003c8f;
  --danger-color: #c62828;
  --warning-color: #f9a825;
  --success-color: #2e7d32;
  --text-primary: #212121;
  --text-secondary: #757575;
  --bg-light: #f5f5f5;
  --bg-dark: #263238;
  --border-color: #e0e0e0;
  
  /* Market phase colors */
  --phase-stable: #4caf50;
  --phase-rising: #8bc34a;
  --phase-hot: #ffeb3b;
  --phase-top: #ffc107;
  --phase-initial_decline: #ff9800;
  --phase-crash: #f44336;
  --phase-recovery: #7cb342;
}

body {
  font-family: 'Roboto', sans-serif;
  margin: 0;
  padding: 0;
  background-color: var(--bg-light);
  color: var(--text-primary);
}

.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header {
  background-color: var(--primary-color);
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.main-content {
  flex: 1;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

/* Property Card Styles */
.property-card {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  background-color: white;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}## API Endpoints

The Flask backend will need the following API endpoints to support the game functionality:

```python
# app.py
from flask import Flask, request, jsonify
from firebase_admin import credentials, firestore, initialize_app
from flask_cors import CORS
import os
import json
from services.market_simulation import MarketSimulation
from services.property_valuation import PropertyValuationEngine
from services.transaction_processor import TransactionProcessor
from services.phase_transition import PhaseTransitionSystem

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize Firestore DB
cred = credentials.Certificate('path/to/serviceAccountKey.json')
initialize_app(cred)
db = firestore.client()

@app.route('/api/process_round', methods=['POST'])
def process_round():
    """
    Process a complete round of the market simulation
    This is called by the TA when ending a round
    """
    data = request.json
    session_id = data.get('session_id')
    
    if not session_id:
        return jsonify({"error": "Session ID is required"}), 400
    
    try:
        # Initialize simulation engine
        market_sim = MarketSimulation(session_id)
        
        # Process the round
        result = market_sim.process_round()
        
        return jsonify(result), 200
    except Exception as e:
        print(f"Error processing round: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/update_property_values', methods=['POST'])
def update_property_values():
    """
    Update all property values based on current market conditions
    """
    data = request.json
    session_id = data.get('session_id')
    
    if not session_id:
        return jsonify({"error": "Session ID is required"}), 400
    
    try:
        # Initialize property valuation engine
        valuation_engine = PropertyValuationEngine(session_id)
        
        # Update property values
        result = valuation_engine.update_all_property_values()
        
        return jsonify({"success": result}), 200
    except Exception as e:
        print(f"Error updating property values: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/process_transactions', methods=['POST'])
def process_transactions():
    """
    Process all pending buy/sell transactions for the current round
    """
    data = request.json
    session_id = data.get('session_id')
    
    if not session_id:
        return jsonify({"error": "Session ID is required"}), 400
    
    try:
        # Initialize transaction processor
        processor = TransactionProcessor(session_id)
        
        # Process transactions
        transactions = processor.process_transactions()
        
        return jsonify({"transactions": transactions}), 200
    except Exception as e:
        print(f"Error processing transactions: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/check_phase_transition', methods=['POST'])
def check_phase_transition():
    """
    Check if market conditions warrant a phase transition
    """
    data = request.json
    session_id = data.get('session_id')
    
    if not session_id:
        return jsonify({"error": "Session ID is required"}), 400
    
    try:
        # Initialize phase transition system
        transition_system = PhaseTransitionSystem(session_id)
        
        # Check for transition
        result = transition_system.check_transition()
        
        return jsonify(result), 200
    except Exception as e:
        print(f"Error checking phase transition: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/create_properties', methods=['POST'])
def create_properties():
    """
    Create initial properties for a new game session
    """
    data = request.json
    session_id = data.get('session_id')
    count = data.get('count', 50)
    
    if not session_id:
        return jsonify({"error": "Session ID is required"}), 400
    
    try:
        # This would call a service function to generate properties
        # We'll implement this separately
        from services.property_generator import generate_properties
        properties = generate_properties(session_id, count)
        
        return jsonify({"properties": properties}), 200
    except Exception as e:
        print(f"Error creating properties: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/initialize_player', methods=['POST'])
def initialize_player():
    """
    Initialize a player for a game session
    """
    data = request.json
    session_id = data.get('session_id')
    user_id = data.get('user_id')
    name = data.get('name')
    
    if not session_id or not user_id or not name:
        return jsonify({"error": "Session ID, user ID, and name are required"}), 400
    
    try:
        # Get session config
        session_ref = db.collection('sessions').document(session_id)
        session = session_ref.get().to_dict()
        
        # Create player document
        player_data = {
            'user_id': user_id,
            'session_id': session_id,
            'name': name,
            'role': 'investor',  # Default role
            'starting_capital': session['config']['starting_capital'],
            'cash': session['config']['starting_capital'],
            'properties': [],
            'loans': [],
            'net_worth_history': [
                {'round': 0, 'value': session['config']['starting_capital']}
            ],
            'transactions': [],
            'performance': {
                'total_return': 0,
                'cash_on_cash_return': 0,
                'rank': 0
            }
        }
        
        player_ref = db.collection('players').add(player_data)
        
        return jsonify({"player_id": player_ref.id}), 200
    except Exception as e:
        print(f"Error initializing player: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/assign_properties', methods=['POST'])
def assign_properties():
    """
    Assign initial properties to players
    """
    data = request.json
    session_id = data.get('session_id')
    
    if not session_id:
        return jsonify({"error": "Session ID is required"}), 400
    
    try:
        # This would call a service function to assign properties
        from services.property_assignment import assign_initial_properties
        result = assign_initial_properties(session_id)
        
        return jsonify(result), 200
    except Exception as e:
        print(f"Error assigning properties: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/inject_event', methods=['POST'])
def inject_event():
    """
    Inject an economic event into the game
    """
    data = request.json
    session_id = data.get('session_id')
    event_type = data.get('event_type')
    event_details = data.get('details', {})
    
    if not session_id or not event_type:
        return jsonify({"error": "Session ID and event type are required"}), 400
    
    try:
        # Get session data
        session_ref = db.collection('sessions').document(session_id)
        session = session_ref.get().to_dict()
        
        # Create event
        event = {
            'type': event_type,
            'round': session['current_round'],
            'details': event_details,
            'timestamp': firestore.SERVER_TIMESTAMP
        }
        
        # Add event to session
        session_ref.update({
            'events': firestore.ArrayUnion([event])
        })
        
        # Process event effects
        from services.event_processor import process_event
        effects = process_event(session_id, event)
        
        return jsonify({"effects": effects}), 200
    except Exception as e:
        print(f"Error injecting event: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
```

## Additional Components

### 1. NeighborhoodMap Component

```jsx
// NeighborhoodMap.jsx
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const NeighborhoodMap = ({ 
  neighborhoods, 
  properties, 
  onSelectProperty 
}) => {
  const svgRef = useRef(null);
  
  useEffect(() => {
    if (!neighborhoods || neighborhoods.length === 0 || !properties) return;
    
    drawMap();
  }, [neighborhoods, properties]);
  
  const drawMap = () => {
    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 600;
    
    // Clear previous content
    svg.selectAll("*").remove();
    
    // Create map layout
    // This is a simplified layout - a real implementation would use
    // more sophisticated geospatial rendering
    
    // Create neighborhood areas
    const voronoi = d3.Delaunay
      .from(neighborhoods.map((n, i) => [
        100 + (i * (width - 200) / neighborhoods.length),
        height / 2 + (Math.random() * 100 - 50)
      ]))
      .voronoi([0, 0, width, height]);
    
    // Color scale for neighborhoods based on desirability
    const colorScale = d3.scaleLinear()
      .domain([0.5, 0.9])  // Min/max desirability
      .range(["#e3f2fd", "#1565c0"]);  // Light blue to dark blue
    
    // Draw neighborhood regions
    svg.append("g")
      .selectAll("path")
      .data(neighborhoods)
      .enter()
      .append("path")
      .attr("d", (d, i) => voronoi.renderCell(i))
      .attr("fill", d => colorScale(d.desirability))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .attr("opacity", 0.7);
    
    // Add neighborhood labels
    svg.append("g")
      .selectAll("text")
      .data(neighborhoods)
      .enter()
      .append("text")
      .attr("x", (d, i) => 100 + (i * (width - 200) / neighborhoods.length))
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .attr("fill", "#333")
      .text(d => d.name);
    
    // Distribute properties within neighborhoods
    const propertyPositions = {};
    properties.forEach(property => {
      // Find neighborhood index
      const nIndex = neighborhoods.findIndex(n => n.name === property.neighborhood);
      if (nIndex === -1) return;
      
      // Calculate position (with jitter)
      const baseX = 100 + (nIndex * (width - 200) / neighborhoods.length);
      const baseY = height / 2;
      
      // Add some random offset within the neighborhood
      const radius = 70;
      const angle = Math.random() * Math.PI * 2;
      const x = baseX + Math.cos(angle) * radius * Math.random();
      const y = baseY + Math.sin(angle) * radius * Math.random();
      
      propertyPositions[property.id] = { x, y };
    });
    
    // Draw properties
    const propertiesGroup = svg.append("g");
    
    propertiesGroup.selectAll("circle")
      .data(properties)
      .enter()
      .append("circle")
      .attr("cx", d => propertyPositions[d.id]?.x || 0)
      .attr("cy", d => propertyPositions[d.id]?.y || 0)
      .attr("r", 6)
      .attr("fill", d => d.for_sale ? "#e53935" : "#43a047")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .attr("cursor", "pointer")
      .on("click", (event, d) => {
        onSelectProperty(d);
      })
      .append("title")
      .text(d => `${d.address} - ${d.type}`);
    
    // Add a legend
    const legend = svg.append("g")
      .attr("transform", `translate(20, 20)`);
    
    // For-sale legend item
    legend.append("circle")
      .attr("cx", 10)
      .attr("cy", 10)
      .attr("r", 6)
      .attr("fill", "#e53935");
    
    legend.append("text")
      .attr("x", 20)
      .attr("y", 15)
      .text("For Sale")
      .attr("font-size", "12px");
    
    // Owned property legend item
    legend.append("circle")
      .attr("cx", 10)
      .attr("cy", 30)
      .attr("r", 6)
      .attr("fill", "#43a047");
    
    legend.append("text")
      .attr("x", 20)
      .attr("y", 35)
      .text("Owned")
      .attr("font-size", "12px");
  };
  
  return (
    <div className="neighborhood-map">
      <h3>Property Map</h3>
      <div className="map-container">
        <svg 
          ref={svgRef} 
          width="800" 
          height="600" 
          viewBox="0 0 800 600"
          className="property-map"
        ></svg>
      </div>
    </div>
  );
};

export default NeighborhoodMap;
```

### 2. MortgageCalculator Component

```jsx
// MortgageCalculator.jsx
import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/formatters';

const MortgageCalculator = ({ 
  propertyPrice, 
  interestRate,
  availableCash
}) => {
  const [loanAmount, setLoanAmount] = useState(propertyPrice * 0.8);
  const [downPayment, setDownPayment] = useState(propertyPrice * 0.2);
  const [term, setTerm] = useState(30);
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  
  // Calculate monthly payment
  useEffect(() => {
    const calculatePayment = () => {
      const monthlyRate = interestRate / 100 / 12;
      const numPayments = term * 12;
      const payment = (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -numPayments));
      setMonthlyPayment(payment);
    };
    
    calculatePayment();
  }, [loanAmount, interestRate, term]);
  
  // Synchronize down payment and loan amount with property price
  useEffect(() => {
    const newDownPayment = propertyPrice * (downPaymentPercent / 100);
    setDownPayment(newDownPayment);
    setLoanAmount(propertyPrice - newDownPayment);
  }, [propertyPrice, downPaymentPercent]);
  
  // Handle down payment change
  const handleDownPaymentChange = (e) => {
    const newDownPayment = parseFloat(e.target.value);
    if (isNaN(newDownPayment) || newDownPayment < 0) return;
    
    const maxDownPayment = Math.min(propertyPrice, availableCash);
    const boundedDownPayment = Math.min(maxDownPayment, Math.max(0, newDownPayment));
    
    setDownPayment(boundedDownPayment);
    setLoanAmount(propertyPrice - boundedDownPayment);
    setDownPaymentPercent((boundedDownPayment / propertyPrice) * 100);
  };
  
  // Handle down payment percent change
  const handleDownPaymentPercentChange = (e) => {
    const newPercent = parseFloat(e.target.value);
    if (isNaN(newPercent) || newPercent < 0) return;
    
    const maxPercent = Math.min(100, (availableCash / propertyPrice) * 100);
    const boundedPercent = Math.min(maxPercent, Math.max(0, newPercent));
    
    setDownPaymentPercent(boundedPercent);
    const newDownPayment = propertyPrice * (boundedPercent / 100);
    setDownPayment(newDownPayment);
    setLoanAmount(propertyPrice - newDownPayment);
  };
  
  return (
    <div className="mortgage-calculator">
      <h3>Mortgage Calculator</h3>
      
      <div className="calculator-form">
        <div className="form-group">
          <label>Property Price</label>
          <div className="input-value">{formatCurrency(propertyPrice)}</div>
        </div>
        
        <div className="form-group">
          <label>Down Payment</label>
          <input
            type="number"
            value={downPayment}
            onChange={handleDownPaymentChange}
            min={0}
            max={Math.min(propertyPrice, availableCash)}
            step={1000}
          />
          <div className="slider-container">
            <input
              type="range"
              min={0}
              max={Math.min(100, (availableCash / propertyPrice) * 100)}
              value={downPaymentPercent}
              onChange={handleDownPaymentPercentChange}
              step={1}
              className="slider"
            />
            <div className="slider-value">{downPaymentPercent.toFixed(0)}%</div>
          </div>
          <div className="max-available">
            Max available: {formatCurrency(availableCash)}
          </div>
        </div>
        
        <div className="form-group">
          <label>Loan Amount</label>
          <div className="input-value">{formatCurrency(loanAmount)}</div>
        </div>
        
        <div className="form-group">
          <label>Interest Rate</label>
          <div className="input-value">{interestRate.toFixed(2)}%</div>
        </div>
        
        <div className="form-group">
          <label>Loan Term</label>
          <select
            value={term}
            onChange={(e) => setTerm(parseInt(e.target.value))}
          >
            <option value={15}>15 years</option>
            <option value={20}>20 years</option>
            <option value={30}>30 years</option>
          </select>
        </div>
      </div>
      
      <div className="payment-results">
        <div className="monthly-payment">
          <span className="payment-label">Monthly Payment:</span>
          <span className="payment-amount">{formatCurrency(monthlyPayment)}</span>
        </div>
        
        <div className="payment-details">
          <div className="detail-item">
            <span>Principal & Interest:</span>
            <span>{formatCurrency(monthlyPayment)}</span>
          </div>
          <div className="detail-item">
            <span>Total of 360 Payments:</span>
            <span>{formatCurrency(monthlyPayment * term * 12)}</span>
          </div>
          <div className="detail-item">
            <span>Total Interest:</span>
            <span>{formatCurrency((monthlyPayment * term * 12) - loanAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MortgageCalculator;
```

### 3. EventInjector Component

```jsx
// EventInjector.jsx
import React, { useState } from 'react';

const EventInjector = ({ onInjectEvent }) => {
  const [eventType, setEventType] = useState('interest_rate_change');
  const [eventMagnitude, setEventMagnitude] = useState(0.5);
  const [eventDirection, setEventDirection] = useState('decrease');
  const [customDetails, setCustomDetails] = useState('');
  
  const eventTypes = [
    {
      value: 'interest_rate_change',
      label: 'Interest Rate Change',
      description: 'Adjust the base interest rate'
    },
    {
      value: 'population_change',
      label: 'Population Change',
      description: 'Simulate population growth or decline'
    },
    {
      value: 'economic_news',
      label: 'Economic News',
      description: 'Announce economic forecasts affecting sentiment'
    },
    {
      value: 'tax_policy',
      label: 'Tax Policy Change',
      description: 'Implement property tax adjustments'
    },
    {
      value: 'building_regulations',
      label: 'Building Regulations',
      description: 'Change zoning or construction regulations'
    },
    {
      value: 'natural_disaster',
      label: 'Natural Disaster',
      description: 'Simulate impact of a natural disaster'
    },
    {
      value: 'foreign_investment',
      label: 'Foreign Investment',
      description: 'Introduce foreign capital into the market'
    },
    {
      value: 'custom_event',
      label: 'Custom Event',
      description: 'Create a custom economic event'
    }
  ];
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Calculate actual magnitude (considering direction)
    const actualMagnitude = eventDirection === 'decrease' 
      ? -1 * eventMagnitude 
      : eventMagnitude;
    
    // Create event details based on event type
    let details = {};
    
    switch(eventType) {
      case 'interest_rate_change':
        details = {
          amount: actualMagnitude,
          description: `Interest rates ${eventDirection} by ${eventMagnitude}%`,
          effects: {
            interest_rate: actualMagnitude,
            market_sentiment: -0.5 * actualMagnitude // Higher rates = lower sentiment
          }
        };
        break;
        
      case 'population_change':
        details = {
          amount: actualMagnitude,
          description: `Population ${eventDirection}s by ${eventMagnitude}%`,
          effects: {
            housing_demand: 0.8 * actualMagnitude,
            market_sentiment: 0.3 * actualMagnitude
          }
        };
        break;
        
      case 'economic_news':
        details = {
          sentiment: eventDirection === 'decrease' ? 'negative' : 'positive',
          magnitude: eventMagnitude,
          description: `Economic forecast ${eventDirection === 'decrease' ? 'worsens' : 'improves'} market outlook`,
          effects: {
            market_sentiment: 0.5 * actualMagnitude
          }
        };
        break;
        
      case 'tax_policy':
        details = {
          amount: actualMagnitude,
          description: `Property taxes ${eventDirection} by ${eventMagnitude}%`,
          effects: {
            affordability_index: -0.7 * actualMagnitude,
            market_sentiment: -0.3 * actualMagnitude
          }
        };
        break;
        
      case 'building_regulations':
        details = {
          restrictiveness: eventDirection === 'decrease' ? 'relaxed' : 'tightened',
          description: `Building regulations ${eventDirection === 'decrease' ? 'relaxed' : 'tightened'} for new construction`,
          effects: {
            housing_supply_index: -0.8 * actualMagnitude,
            development_costs: 0.4 * actualMagnitude
          }
        };
        break;
        
      case 'natural_disaster':
        details = {
          severity: eventMagnitude,
          description: `Natural disaster affects property values`,
          effects: {
            housing_supply_index: -0.4 * eventMagnitude,
            market_sentiment: -0.6 * eventMagnitude
          }
        };
        break;
        
      case 'foreign_investment':
        details = {
          amount: eventMagnitude,
          direction: eventDirection,
          description: `Foreign investment ${eventDirection === 'decrease' ? 'leaves' : 'enters'} the market`,
          effects: {
            speculative_activity_index: 0.9 * actualMagnitude,
            market_sentiment: 0.5 * actualMagnitude
          }
        };
        break;
        
      case 'custom_event':
        details = {
          description: customDetails,
          effects: {
            market_sentiment: eventDirection === 'decrease' ? -0.3 : 0.3
          }
        };
        break;
        
      default:
        details = {};
    }
    
    // Call the inject event handler
    onInjectEvent({
      type: eventType,
      details
    });
    
    // Reset custom details
    if (eventType === 'custom_event') {
      setCustomDetails('');
    }
  };
  
  return (
    <div className="event-injector">
      <h3>Inject Market Event</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Event Type</label>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
          >
            {eventTypes.map(event => (
              <option key={event.value} value={event.value}>
                {event.label}
              </option>
            ))}
          </select>
          <div className="event-description">
            {eventTypes.find(e => e.value === eventType)?.description}
          </div>
        </div>
        
        {eventType !== 'custom_event' && (
          <>
            <div className="form-group">
              <label>Direction</label>
              <select
                value={eventDirection}
                onChange={(e) => setEventDirection(e.target.value)}
              >
                <option value="increase">Increase</option>
                <option value="decrease">Decrease</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Magnitude</label>
              <div className="slider-container">
                <input
                  type="range"
                  min={0.1}
                  max={2.0}
                  step={0.1}
                  value={eventMagnitude}
                  onChange={(e) => setEventMagnitude(parseFloat(e.target.value))}
                  className="slider"
                />
                <div className="slider-value">{eventMagnitude.toFixed(1)}</div>
              </div>
            </div>
          </>
        )}
        
        {eventType === 'custom_event' && (
          <div className="form-group">
            <label>Event Description</label>
            <textarea
              value={customDetails}
              onChange={(e) => setCustomDetails(e.target.value)}
              rows={3}
              placeholder="Describe the economic event..."
              required
            />
          </div>
        )}
        
        <div className="form-actions">
          <button type="submit" className="inject-event-btn">
            Inject Event
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventInjector;
```

### 4. RoundStatus Component

```jsx
// RoundStatus.jsx
import React from 'react';

const RoundStatus = ({ status, round, phase, timer }) => {
  // Format timer as MM:SS
  const formatTime = (seconds) => {
    if (seconds === null) return '--:--';
    
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Get status display text
  const getStatusText = () => {
    switch(status) {
      case 'active':
        return 'Round In Progress';
      case 'waiting':
        return 'Waiting for Next Round';
      case 'processing':
        return 'Processing Results';
      default:
        return 'Unknown Status';
    }
  };
  
  // Format phase for display
  const formatPhase = (phaseStr) => {
    if (!phaseStr) return '';
    
    return phaseStr
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  return (
    <div className={`round-status ${status}`}>
      <div className="round-info">
        <span className="round-number">Round {round || 0}</span>
        <span className="phase-label">{formatPhase(phase)}</span>
      </div>
      
      <div className="status-indicator">
        <div className="status-text">{getStatusText()}</div>
        {status === 'active' && (
          <div className="timer">{formatTime(timer)}</div>
        )}
      </div>
      
      {status === 'active' && (
        <div className="progress-bar">
          <div 
            className="progress" 
            style={{ 
              width: `${timer ? (timer / 180) * 100 : 0}%` 
            }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default RoundStatus;
```

### 5. GameNews Component

```jsx
// GameNews.jsx
import React from 'react';

const GameNews = ({ events, currentRound }) => {
  // Filter to show only recent events
  const recentEvents = events
    ? events
      .filter(event => event.round >= currentRound - 3) // Show last 3 rounds
      .sort((a, b) => b.round - a.round) // Latest first
    : [];
  
  // Get icon for event type
  const getEventIcon = (type) => {
    switch(type) {
      case 'interest_rate_change':
        return '💰';
      case 'population_change':
        return '👥';
      case 'economic_news':
        return '📰';
      case 'tax_policy':
        return '📝';
      case 'building_regulations':
        return '🏗️';
      case 'natural_disaster':
        return '// PropertyCard.jsx
import React from 'react';
import { formatCurrency } from '../utils/formatters';

const PropertyCard = ({ property, onSelect, onSell, isOwned }) => {
  const handleSelectClick = () => {
    onSelect(property);
  };
  
  const handleSellClick = (e) => {
    e.stopPropagation();
    onSell(property.id);
  };
  
  // Calculate value change percentage
  const calculateValueChange = () => {
    if (property.value_history && property.value_history.length > 1) {
      const current = property.current_value;
      const previous = property.value_history[property.value_history.length - 2].value;
      return ((current - previous) / previous) * 100;
    }
    return 0;
  };
  
  const valueChange = calculateValueChange();
  const valueChangeClass = valueChange >= 0 ? 'positive' : 'negative';
  
  return (
    <div className="property-card" onClick={handleSelectClick}>
      <div className="property-image" 
           style={{ backgroundImage: `url(/images/property-types/${property.type}.jpg)` }}>
        {property.for_sale && (
          <div className="for-sale-tag">FOR SALE</div>
        )}
      </div>
      
      <div className="property-details">
        <h3>{property.address}</h3>
        <div className="property-specs">
          <span>{property.bedrooms} bed</span>
          <span>{property.bathrooms} bath</span>
          <span>{property.sqft.toLocaleString()} sqft</span>
        </div>
        
        <div className="property-neighborhood">
          {property.neighborhood}
        </div>
        
        <div className="property-value">
          <div className="current-value">
            {formatCurrency(property.current_value)}
          </div>
          
          <div className={`value-change ${valueChangeClass}`}>
            {valueChange >= 0 ? '+' : ''}{valueChange.toFixed(1)}%
          </div>
        </div>
        
        {property.for_sale && !isOwned && (
          <div className="asking-price">
            Asking: {formatCurrency(property.asking_price)}
          </div>
        )}
        
        {isOwned && !property.for_sale && (
          <button 
            className="sell-button"
            onClick={handleSellClick}
          >
            Sell Property
          </button>
        )}
      </div>
    </div>
  );
};

export default PropertyCard;
```

```jsx
// MarketIndicators.jsx
import React from 'react';
import { Line } from 'react-chartjs-2';
import { formatCurrency, formatPercent } from '../utils/formatters';

const MarketIndicators = ({ marketData, currentPhase }) => {
  if (!marketData) return <div className="loading">Loading market data...</div>;
  
  // Get latest round data
  const latestRound = marketData.rounds[marketData.rounds.length - 1];
  
  // Prepare data for price trend chart
  const chartData = {
    labels: marketData.rounds.map(r => `Round ${r.round}`),
    datasets: [
      {
        label: 'Median Price',
        data: marketData.rounds.map(r => r.median_price),
        borderColor: '#4e79a7',
        backgroundColor: 'rgba(78, 121, 167, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(200, 200, 200, 0.2)'
        },
        ticks: {
          callback: function(value) {
            return formatCurrency(value, true); // shortened version
          }
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return formatCurrency(context.raw);
          }
        }
      }
    }
  };
  
  // Helper function to get indicator class based on value
  const getIndicatorClass = (value, thresholds) => {
    if (value >= thresholds.high) return 'high';
    if (value <= thresholds.low) return 'low';
    return 'medium';
  };
  
  return (
    <div className="market-indicators">
      <h2>Market Status</h2>
      
      <div className="phase-indicator">
        <h3>Current Phase</h3>
        <div className={`phase-badge ${currentPhase}`}>
          {currentPhase.replace('_', ' ').toUpperCase()}
        </div>
      </div>
      
      <div className="price-chart">
        <h3>Price Trends</h3>
        <div className="chart-container" style={{ height: '200px' }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
      
      <div className="key-indicators">
        <div className="indicator-item">
          <div className="indicator-label">Median Price</div>
          <div className="indicator-value">
            {formatCurrency(latestRound.median_price)}
          </div>
        </div>
        
        <div className="indicator-item">
          <div className="indicator-label">Price Change</div>
          <div className={`indicator-value ${
            latestRound.price_change_rate >= 0 ? 'positive' : 'negative'
          }`}>
            {formatPercent(latestRound.price_change_rate)}
          </div>
        </div>
        
        <div className="indicator-item">
          <div className="indicator-label">Inventory</div>
          <div className="indicator-value">
            {latestRound.total_inventory} properties
          </div>
        </div>
        
        <div className="indicator-item">
          <div className="indicator-label">Days on Market</div>
          <div className={`indicator-value ${
            getIndicatorClass(latestRound.avg_days_on_market, {low: 15, high: 40})
          }`}>
            {latestRound.avg_days_on_market.toFixed(0)} days
          </div>
        </div>
        
        <div className="indicator-item">
          <div className="indicator-label">Interest Rate</div>
          <div className="indicator-value">
            {latestRound.interest_rate.toFixed(2)}%
          </div>
        </div>
        
        <div className="indicator-item">
          <div className="indicator-label">Market Sentiment</div>
          <div className={`indicator-value ${
            getIndicatorClass(latestRound.market_sentiment, {low: 0.3, high: 0.7})
          }`}>
            {(latestRound.market_sentiment * 100).toFixed(0)}%
          </div>
        </div>
      </div>
      
      <div className="market-indices">
        <h3>Market Indices</h3>
        
        <div className="index-item">
          <div className="index-label">Affordability</div>
          <div className={`index-value ${
            getIndicatorClass(marketData.market_indices.affordability_index, {low: 80, high: 120})
          }`}>
            {marketData.market_indices.affordability_index}
          </div>
        </div>
        
        <div className="index-item">
          <div className="index-label">Housing Supply</div>
          <div className={`index-value ${
            getIndicatorClass(marketData.market_indices.housing_supply_index, {low: 80, high: 120})
          }`}>
            {marketData.market_indices.housing_supply_index}
          </div>
        </div>
        
        <div className="index-item">
          <div className="index-label">Speculation</div>
          <div className={`index-value ${
            getIndicatorClass(marketData.market_indices.speculative_activity_index, {low: 80, high: 120})
          }`}>
            {marketData.market_indices.speculative_activity_index}
          </div>
        </div>
        
        <div className="index-item">
          <div className="index-label">Credit Availability</div>
          <div className={`index-value ${
            getIndicatorClass(marketData.market_indices.credit_availability_index, {low: 80, high: 120})
          }`}>
            {marketData.market_indices.credit_availability_index}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketIndicators;
```

```jsx
// PropertyDetail.jsx
import React, { useState } from 'react';
import { formatCurrency } from '../utils/formatters';

const PropertyDetail = ({ 
  property, 
  isOwned, 
  canBuy, 
  canSell,
  availableCash,
  onBuy,
  onSell,
  interestRate
}) => {
  const [offerPrice, setOfferPrice] = useState(property.asking_price || property.current_value);
  const [askingPrice, setAskingPrice] = useState(property.current_value);
  const [financing, setFinancing] = useState('mortgage');
  const [downPayment, setDownPayment] = useState(property.asking_price * 0.2 || property.current_value * 0.2);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleBuySubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const success = await onBuy(property.id, {
      offerPrice,
      financing,
      downPayment
    });
    
    setIsSubmitting(false);
    // Could add success/error notification here
  };
  
  const handleSellSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const success = await onSell(property.id, askingPrice);
    
    setIsSubmitting(false);
    // Could add success/error notification here
  };
  
  // Calculate monthly mortgage payment
  const calculateMonthlyPayment = () => {
    if (financing !== 'mortgage') return 0;
    
    const loanAmount = offerPrice - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = 30 * 12; // 30-year mortgage
    
    return (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -numPayments));
  };
  
  const monthlyPayment = calculateMonthlyPayment();
  
  // Get value history for display
  const getValueHistory = () => {
    if (!property.value_history || property.value_history.length < 2) {
      return 'No historical data available';
    }
    
    const history = property.value_history.map((entry, index) => {
      let changePercent = 0;
      if (index > 0) {
        const prevValue = property.value_history[index - 1].value;
        changePercent = ((entry.value - prevValue) / prevValue) * 100;
      }
      
      return (
        <div key={entry.round} className="history-entry">
          <span className="round">Round {entry.round}</span>
          <span className="value">{formatCurrency(entry.value)}</span>
          {index > 0 && (
            <span className={`change ${changePercent >= 0 ? 'positive' : 'negative'}`}>
              {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(1)}%
            </span>
          )}
        </div>
      );
    });
    
    return <div className="value-history-list">{history}</div>;
  };
  
  return (
    <div className="property-detail">
      <h2>{property.address}</h2>
      
      <div className="property-image-large" 
           style={{ backgroundImage: `url(/images/property-types/${property.type}.jpg)` }}>
        {property.for_sale && !isOwned && (
          <div className="for-sale-badge">FOR SALE</div>
        )}
      </div>
      
      <div className="property-specs-detailed">
        <div className="spec-item">
          <span className="spec-label">Type</span>
          <span className="spec-value">{property.type.replace('_', ' ')}</span>
        </div>
        
        <div className="spec-item">
          <span className="spec-label">Bedrooms</span>
          <span className="spec-value">{property.bedrooms}</span>
        </div>
        
        <div className="spec-item">
          <span className="spec-label">Bathrooms</span>
          <span className="spec-value">{property.bathrooms}</span>
        </div>
        
        <div className="spec-item">
          <span className="spec-label">Square Feet</span>
          <span className="spec-value">{property.sqft.toLocaleString()}</span>
        </div>
        
        <div className="spec-item">
          <span className="spec-label">Neighborhood</span>
          <span className="spec-value">{property.neighborhood}</span>
        </div>
        
        <div className="spec-item">
          <span className="spec-label">Condition</span>
          <span className="spec-value">{(property.condition * 100).toFixed(0)}%</span>
        </div>
        
        {property.rental_income > 0 && (
          <div className="spec-item">
            <span className="spec-label">Monthly Rental Income</span>
            <span className="spec-value">{formatCurrency(property.rental_income)}</span>
          </div>
        )}
      </div>
      
      <div className="property-value-details">
        <div className="current-value-large">
          <span className="value-label">Current Value</span>
          <span className="value-amount">{formatCurrency(property.current_value)}</span>
        </div>
        
        {property.for_sale && !isOwned && (
          <div className="asking-price-large">
            <span className="price-label">Asking Price</span>
            <span className="price-amount">{formatCurrency(property.asking_price)}</span>
          </div>
        )}
      </div>
      
      <div className="value-history">
        <h3>Value History</h3>
        {getValueHistory()}
      </div>
      
      {/* Buy form for properties that are for sale */}
      {property.for_sale && !isOwned && canBuy && (
        <div className="buy-property-form">
          <h3>Make an Offer</h3>
          
          <form onSubmit={handleBuySubmit}>
            <div className="form-group">
              <label>Offer Price</label>
              <input
                type="number"
                min={property.asking_price * 0.7}
                max={property.asking_price * 1.1}
                value={offerPrice}
                onChange={(e) => setOfferPrice(Number(e.target.value))}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Financing</label>
              <select
                value={financing}
                onChange={(e) => setFinancing(e.target.value)}
              >
                <option value="mortgage">Mortgage</option>
                <option value="cash">Cash</option>
              </select>
            </div>
            
            {financing === 'mortgage' && (
              <div className="form-group">
                <label>Down Payment</label>
                <input
                  type="number"
                  min={offerPrice * 0.1}
                  max={Math.min(offerPrice * 0.5, availableCash)}
                  value={downPayment}
                  onChange={(e) => setDownPayment(Number(e.target.value))}
                  required
                />
                <div className="down-payment-percent">
                  ({((downPayment / offerPrice) * 100).toFixed(0)}%)
                </div>
              </div>
            )}
            
            {financing === 'mortgage' && (
              <div className="payment-summary">
                <div className="summary-item">
                  <span>Loan Amount:</span>
                  <span>{formatCurrency(offerPrice - downPayment)}</span>
                </div>
                <div className="summary-item">
                  <span>Interest Rate:</span>
                  <span>{interestRate.toFixed(2)}%</span>
                </div>
                <div className="summary-item">
                  <span>Monthly Payment:</span>
                  <span>{formatCurrency(monthlyPayment)}</span>
                </div>
              </div>
            )}
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="submit-offer-btn"
                disabled={
                  isSubmitting || 
                  (financing === 'cash' && offerPrice > availableCash) ||
                  (financing === 'mortgage' && downPayment > availableCash)
                }
              >
                {isSubmitting ? 'Submitting...' : 'Submit Offer'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Sell form for owned properties */}
      {isOwned && canSell && !property.for_sale && (
        <div className="sell-property-form">
          <h3>List Property for Sale</h3>
          
          <form onSubmit={handleSellSubmit}>
            <div className="form-group">
              <label>Asking Price</label>
              <input
                type="number"
                min={property.current_value * 0.7}
                max={property.current_value * 1.3}
                value={askingPrice}
                onChange={(e) => setAskingPrice(Number(e.target.value))}
                required
              />
              <div className="price-comparison">
                ({((askingPrice / property.current_value - 1) * 100).toFixed(0)}% relative to current value)
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="list-for-sale-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Listing...' : 'List for Sale'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PropertyDetail;
```

### 5. Game Setup and Configuration

```jsx
// GameSetup.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';

const GameSetup = () => {
  const [gameName, setGameName] = useState('');
  const [numRounds, setNumRounds] = useState(12);
  const [roundDuration, setRoundDuration] = useState(180); // 3 minutes
  const [startingCapital, setStartingCapital] = useState(100000);
  const [interestRate, setInterestRate] = useState(4.5);
  const [numNeighborhoods, setNumNeighborhoods] = useState(5);
  const [propertiesPerStudent, setPropertiesPerStudent] = useState(2);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    setError('');
    
    try {
      // Create new game session
      const sessionRef = await addDoc(collection(db, 'sessions'), {
        name: gameName,
        created_by: currentUser.uid,
        ta_id: currentUser.uid,
        created_at: serverTimestamp(),
        current_round: 1,
        phase_round: 1,
        total_rounds: numRounds,
        market_phase: 'stable',
        status: 'setup',
        round_status: 'waiting',
        config: {
          round_duration: roundDuration,
          starting_capital: startingCapital,
          interest_rate_base: interestRate,
          neighborhood_count: numNeighborhoods,
          properties_per_student: propertiesPerStudent
        },
        phase_history: []
      });
      
      // Create initial market data
      await createInitialMarketData(sessionRef.id);
      
      // Create neighborhoods
      await createNeighborhoods(sessionRef.id, numNeighborhoods);
      
      // Navigate to TA dashboard
      navigate('/ta-dashboard');
      
    } catch (error) {
      console.error("Error creating game:", error);
      setError('Failed to create game. Please try again.');
      setIsCreating(false);
    }
  };
  
  const createInitialMarketData = async (sessionId) => {
    // Initial market metrics
    await addDoc(collection(db, 'market_data'), {
      session_id: sessionId,
      rounds: [
        {
          round: 1,
          phase: 'stable',
          median_price: 250000,
          avg_price: 275000,
          transaction_volume: 0,
          total_inventory: 0, // Will be populated when properties are created
          avg_days_on_market: 30,
          interest_rate: interestRate,
          price_to_income_ratio: 4.0,
          price_change_rate: 0.02,
          mortgage_approval_rate: 0.8,
          market_sentiment: 0.5 // Neutral
        }
      ],
      market_indices: {
        affordability_index: 100, // 100 is baseline
        housing_supply_index: 100,
        speculative_activity_index: 100,
        credit_availability_index: 100
      }
    });
  };
  
  const createNeighborhoods = async (sessionId, count) => {
    // Define neighborhood templates
    const templates = [
      {
        name: "Downtown",
        desirability: 0.85,
        price_multiplier: 1.3,
        development_potential: 0.4
      },
      {
        name: "Midtown",
        desirability: 0.75,
        price_multiplier: 1.1,
        development_potential: 0.6
      },
      {
        name: "Westside",
        desirability: 0.7,
        price_multiplier: 1.0,
        development_potential: 0.7
      },
      {
        name: "Eastside",
        desirability: 0.65,
        price_multiplier: 0.9,
        development_potential: 0.8
      },
      {
        name: "Suburbs",
        desirability: 0.6,
        price_multiplier: 0.85,
        development_potential: 0.9
      },
      {
        name: "Rural",
        desirability: 0.5,
        price_multiplier: 0.7,
        development_potential: 1.0
      }
    ];
    
    // Create the requested number of neighborhoods
    const neighborhoods = [];
    for (let i = 0; i < Math.min(count, templates.length); i++) {
      const template = templates[i];
      
      const neighborhoodData = {
        session_id: sessionId,
        name: template.name,
        desirability: template.desirability,
        inventory: 0, // Will be populated when properties are created
        avg_price_history: [
          { round: 1, value: 250000 * template.price_multiplier }
        ],
        price_change_rate: 0.02,
        days_on_market: 30,
        development_potential: template.development_potential
      };
      
      const neighborhoodRef = await addDoc(collection(db, 'neighborhoods'), neighborhoodData);
      neighborhoods.push({
        id: neighborhoodRef.id,
        ...neighborhoodData
      });
    }
    
    return neighborhoods;
  };
  
  return (
    <div className="game-setup">
      <h1>Create New Game</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Game Name</label>
          <input
            type="text"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            placeholder="e.g., Econ 101 - Spring 2025"
            required
          />
        </div>
        
        <div className="form-section">
          <h2>Game Structure</h2>
          
          <div className="form-group">
            <label>Number of Rounds</label>
            <input
              type="number"
              min={8}
              max={20}
              value={numRounds}
              onChange={(e) => setNumRounds(Number(e.target.value))}
              required
            />
            <div className="form-hint">Recommended: 12-15 rounds</div>
          </div>
          
          <div className="form-group">
            <label>Round Duration (seconds)</label>
            <input
              type="number"
              min={60}
              max={600}
              step={30}
              value={roundDuration}
              onChange={(e) => setRoundDuration(Number(e.target.value))}
              required
            />
            <div className="form-hint">Recommended: 180 seconds (3 minutes)</div>
          </div>
        </div>
        
        <div className="form-section">
          <h2>Economic Parameters</h2>
          
          <div className="form-group">
            <label>Starting Capital per Student</label>
            <input
              type="number"
              min={50000}
              max={500000}
              step={10000}
              value={startingCapital}
              onChange={(e) => setStartingCapital(Number(e.target.value))}
              required
            />
            <div className="form-hint">Recommended: $100,000</div>
          </div>
          
          <div className="form-group">
            <label>Initial Interest Rate (%)</label>
            <input
              type="number"
              min={1}
              max={10}
              step={0.25}
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              required
            />
            <div className="form-hint">Recommended: 4.5%</div>
          </div>
        </div>
        
        <div className="form-section">
          <h2>Property Settings</h2>
          
          <div className="form-group">
            <label>Number of Neighborhoods</label>
            <input
              type="number"
              min={3}
              max={6}
              value={numNeighborhoods}
              onChange={(e) => setNumNeighborhoods(Number(e.target.value))}
              required
            />
            <div className="form-hint">Recommended: 5 neighborhoods</div>
          </div>
          
          <div className="form-group">
            <label>Initial Properties per Student</label>
            <input
              type="number"
              min={0}
              max={5}
              value={propertiesPerStudent}
              onChange={(e) => setPropertiesPerStudent(Number(e.target.value))}
              required
            />
            <div className="form-hint">Recommended: 2 properties</div>
          </div>
        </div>
        
        <div className="form-actions">
          <button 
            type="submit" 
            className="create-game-btn"
            disabled={isCreating}
          >
            {isCreating ? 'Creating Game...' : 'Create Game'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GameSetup;
```

## Deployment Architecture

```
GitHub Repository
├── frontend/              # React application
│   ├── public/            # Static assets
│   ├── src/               # Source code
│   │   ├── components/    # UI components
│   │   ├── pages/         # Main pages
│   │   ├── services/      # API services
│   │   └── utils/         # Helper functions
│   └── package.json       # Dependencies
├── backend/               # Flask API
│   ├── app.py             # Main application
│   ├── models/            # Data models
│   ├── routes/            # API endpoints
│   ├── services/          # Business logic
│   └── requirements.txt   # Dependencies
├── database/              # Database schemas
│   └── firestore-rules.js # Security rules
├── .github/workflows/     # GitHub Actions
│   ├── deploy-frontend.yml # Frontend deployment
│   └── deploy-backend.yml  # Backend deployment
└── README.md              # Documentation
```

## Next Steps for Implementation

1. **Define Game Parameters**
   - Specific price growth rates for each phase
   - Thresholds for phase transitions
   - Starting conditions for students

2. **Create Firebase Project**
   - Set up authentication
   - Create database structure
   - Configure security rules

3. **Develop Core Simulation Logic**
   - Property valuation algorithm
   - Transaction processing system
   - Performance calculation logic

4. **Build User Interfaces**
   - TA control panel
   - Student dashboard
   - Market visualization tools

5. **Test with Small Group**
   - Validate game mechanics
   - Tune economic parameters
   - Gather feedback on user experience

With this implementation plan, you can create a dynamic, educational housing market simulation that runs primarily client-side with minimal server requirements, making it suitable for GitHub hosting while providing a rich, interconnected economic experience for your students.
# BubbleVille: Housing Market Simulation Game

## Project Overview

BubbleVille is an interactive classroom game that simulates a housing market cycle, allowing students to experience the dynamics of market bubbles firsthand. This multiplayer simulation demonstrates how individual decisions collectively create system-wide outcomes, with a focus on the formation, inflation, and potential crash of housing markets.

## Core Concept

Students participate as property investors in a dynamic market that progresses through multiple phases of a housing cycle. The Teaching Assistant controls the game flow and can inject economic events, while the system tracks market conditions and player performance. The collective behavior of students directly influences market conditions, creating an emergent economic simulation.

## Technical Architecture

The application consists of:

1. **Flask Backend**: Extended from existing macro2.py file
2. **React Frontend**: Modern UI with data visualizations
3. **Firestore Database**: Real-time game state management
4. **GitHub Pages Deployment**: Static hosting for the frontend

## Database Structure

```javascript
// Firestore Collections

// Game Sessions
{
  "session_id": {
    "name": "Econ 101 Spring 2025",
    "created_by": "ta_user_id",
    "current_round": 5,
    "market_phase": "hot_market", // stable, rising, hot, top, initial_decline, crash, recovery
    "phase_round": 2, // Which round of the current phase
    "total_rounds": 12,
    "status": "in_progress", // setup, in_progress, completed
    "config": {
      "interest_rate_base": 4.5,
      "starting_capital": 100000,
      "properties_per_student": 2,
      "round_duration": 180, // seconds
      "neighborhood_count": 5
    },
    "phase_history": [
      {"phase": "stable", "rounds": 2},
      {"phase": "rising", "rounds": 3}
    ],
    "events": [
      {
        "round": 3,
        "type": "interest_rate_change",
        "description": "Federal Reserve lowers interest rates by 0.5%",
        "effects": {"interest_rate": -0.5, "market_sentiment": 0.1}
      }
    ]
  }
}

// Players
{
  "player_id": {
    "user_id": "student_email_hash",
    "session_id": "session_id",
    "name": "Student Name",
    "role": "investor", // first_time_buyer, investor, developer, institutional
    "starting_capital": 100000,
    "cash": 25000,
    "properties": ["property_id_1", "property_id_2"],
    "loans": [
      {
        "property_id": "property_id_1",
        "principal": 200000,
        "interest_rate": 4.25,
        "term_years": 30,
        "monthly_payment": 983.88,
        "originated_round": 2
      }
    ],
    "net_worth_history": [
      {"round": 1, "value": 100000},
      {"round": 2, "value": 105000},
      {"round": 3, "value": 120000}
    ],
    "transactions": [
      {
        "round": 2,
        "type": "purchase",
        "property_id": "property_id_1",
        "price": 225000,
        "financing": "mortgage", // cash, mortgage
        "down_payment": 45000,
        "loan_amount": 180000
      }
    ],
    "performance": {
      "total_return": 0.23, // percentage
      "cash_on_cash_return": 0.18,
      "rank": 5
    }
  }
}

// Properties
{
  "property_id": {
    "session_id": "session_id",
    "address": "123 Main St",
    "neighborhood": "downtown",
    "type": "single_family", // single_family, condo, multi_family, commercial
    "bedrooms": 3,
    "bathrooms": 2,
    "sqft": 1800,
    "initial_value": 250000,
    "current_value": 285000,
    "value_history": [
      {"round": 1, "value": 250000},
      {"round": 2, "value": 262500},
      {"round": 3, "value": 285000}
    ],
    "for_sale": true,
    "asking_price": 300000,
    "owner_id": "player_id",
    "rental_income": 1800, // monthly
    "condition": 0.85, // 0-1 scale
    "listed_round": 3
  }
}

// Neighborhoods
{
  "neighborhood_id": {
    "session_id": "session_id",
    "name": "Downtown",
    "desirability": 0.8, // 0-1 scale
    "inventory": 12, // available properties
    "avg_price_history": [
      {"round": 1, "value": 275000},
      {"round": 2, "value": 290000},
      {"round": 3, "value": 315000}
    ],
    "price_change_rate": 0.086, // percentage
    "days_on_market": 18,
    "development_potential": 0.6 // 0-1 scale
  }
}

// Market Data
{
  "market_id": {
    "session_id": "session_id",
    "rounds": [
      {
        "round": 3,
        "phase": "rising",
        "median_price": 290000,
        "avg_price": 310000,
        "transaction_volume": 14,
        "total_inventory": 35,
        "avg_days_on_market": 22,
        "interest_rate": 4.25,
        "price_to_income_ratio": 4.2,
        "price_change_rate": 0.075,
        "mortgage_approval_rate": 0.85,
        "market_sentiment": 0.7 // 0-1 scale
      }
    ],
    "market_indices": {
      "affordability_index": 112, // 100 is baseline
      "housing_supply_index": 95,
      "speculative_activity_index": 118,
      "credit_availability_index": 105
    }
  }
}
```

## Core Backend Components

### 1. Market Simulation Engine

```python
# market_simulation.py

class MarketSimulation:
    def __init__(self, session_id):
        self.session_id = session_id
        self.db = firestore.Client()
        self.session_ref = self.db.collection('sessions').document(session_id)
        self.session_data = self.session_ref.get().to_dict()
        
    def process_round(self):
        """Process a complete round of the market simulation"""
        current_round = self.session_data['current_round']
        market_phase = self.session_data['market_phase']
        
        # 1. Process any events for this round
        self._process_events(current_round)
        
        # 2. Process property transactions
        transactions = self._process_transactions()
        
        # 3. Update property values
        self._update_property_values(transactions)
        
        # 4. Calculate player performance
        self._update_player_performance()
        
        # 5. Update market indicators
        market_data = self._calculate_market_data(transactions)
        
        # 6. Check for phase transition
        phase_transition = self._check_phase_transition(market_data)
        if phase_transition['should_transition']:
            self._transition_market_phase(phase_transition['next_phase'])
            
        # 7. Advance to next round
        self.session_ref.update({
            'current_round': current_round + 1,
            'last_update': firestore.SERVER_TIMESTAMP
        })
        
        return {
            'round_complete': True,
            'market_data': market_data,
            'phase_transition': phase_transition['should_transition'],
            'next_phase': phase_transition.get('next_phase', None)
        }
    
    def _process_events(self, current_round):
        """Process any scheduled or triggered events for this round"""
        # Implementation details for event processing
        pass
    
    def _process_transactions(self):
        """Process all buy/sell transactions for the current round"""
        # Implementation for matching buyers and sellers
        # and executing transactions
        pass
    
    def _update_property_values(self, transactions):
        """Update all property values based on market conditions"""
        # Implementation of property valuation algorithm
        pass
    
    def _update_player_performance(self):
        """Calculate and update performance metrics for all players"""
        # Implementation for performance tracking
        pass
    
    def _calculate_market_data(self, transactions):
        """Calculate market-wide indicators"""
        # Implementation for market data aggregation
        pass
    
    def _check_phase_transition(self, market_data):
        """Determine if market should transition to a new phase"""
        # Implementation of phase transition logic
        pass
    
    def _transition_market_phase(self, next_phase):
        """Handle transition to a new market phase"""
        # Implementation of phase transition effects
        pass
```

### 2. Property Valuation System

```python
# property_valuation.py

class PropertyValuationEngine:
    def __init__(self, session_id):
        self.session_id = session_id
        self.db = firestore.Client()
        
    def update_all_property_values(self):
        """Update values for all properties in the session"""
        # Get session data and market phase
        session_ref = self.db.collection('sessions').document(self.session_id)
        session = session_ref.get().to_dict()
        market_phase = session['market_phase']
        
        # Get phase-specific pricing modifiers
        modifiers = self._get_phase_modifiers(market_phase)
        
        # Get neighborhood data
        neighborhoods = self._get_neighborhood_data()
        
        # Get recent transactions
        transactions = self._get_recent_transactions(5)  # Last 5 rounds
        
        # Update each property in a batch
        batch = self.db.batch()
        property_query = self.db.collection('properties').where('session_id', '==', self.session_id)
        
        for prop_doc in property_query.stream():
            prop_id = prop_doc.id
            prop_data = prop_doc.to_dict()
            
            # Calculate new value
            new_value = self._calculate_property_value(
                prop_data, 
                modifiers, 
                neighborhoods, 
                transactions
            )
            
            # Update property document
            prop_ref = self.db.collection('properties').document(prop_id)
            
            # Add to value history
            value_history = prop_data.get('value_history', [])
            current_round = session['current_round']
            value_history.append({
                'round': current_round,
                'value': new_value
            })
            
            # Update the property
            batch.update(prop_ref, {
                'current_value': new_value,
                'value_history': value_history
            })
        
        # Commit all updates as a batch
        batch.commit()
        
        return True
    
    def _get_phase_modifiers(self, market_phase):
        """Get value modifiers specific to the current market phase"""
        modifiers = {
            'stable': {
                'base_appreciation': 0.02,
                'volatility': 0.01,
                'neighborhood_factor': 1.0,
                'days_on_market_factor': 1.0
            },
            'rising': {
                'base_appreciation': 0.05,
                'volatility': 0.015,
                'neighborhood_factor': 1.2,
                'days_on_market_factor': 0.8
            },
            'hot': {
                'base_appreciation': 0.10,
                'volatility': 0.03,
                'neighborhood_factor': 1.5,
                'days_on_market_factor': 0.6
            },
            'top': {
                'base_appreciation': 0.15,
                'volatility': 0.08,
                'neighborhood_factor': 1.8,
                'days_on_market_factor': 0.5
            },
            'initial_decline': {
                'base_appreciation': -0.02,
                'volatility': 0.04,
                'neighborhood_factor': 2.0,
                'days_on_market_factor': 1.5
            },
            'crash': {
                'base_appreciation': -0.12,
                'volatility': 0.1,
                'neighborhood_factor': 2.5,
                'days_on_market_factor': 3.0
            },
            'recovery': {
                'base_appreciation': 0.03,
                'volatility': 0.025,
                'neighborhood_factor': 1.3,
                'days_on_market_factor': 1.2
            }
        }
        
        return modifiers.get(market_phase, modifiers['stable'])
    
    def _get_neighborhood_data(self):
        """Get current data for all neighborhoods"""
        neighborhoods = {}
        query = self.db.collection('neighborhoods').where('session_id', '==', self.session_id)
        
        for doc in query.stream():
            neighborhoods[doc.id] = doc.to_dict()
            
        return neighborhoods
    
    def _get_recent_transactions(self, num_rounds):
        """Get recent property transactions"""
        # Implementation to retrieve recent transactions
        pass
    
    def _calculate_property_value(self, property_data, modifiers, neighborhoods, transactions):
        """Calculate new value for a specific property"""
        current_value = property_data['current_value']
        neighborhood_id = property_data['neighborhood']
        property_type = property_data['type']
        
        # Base appreciation from market phase
        base_change = modifiers['base_appreciation']
        
        # Add randomness based on volatility
        volatility = modifiers['volatility']
        random_factor = random.uniform(-volatility, volatility)
        
        # Neighborhood effect
        neighborhood = neighborhoods.get(neighborhood_id, {})
        neighborhood_trend = neighborhood.get('price_change_rate', 0)
        neighborhood_factor = modifiers['neighborhood_factor']
        neighborhood_effect = neighborhood_trend * neighborhood_factor
        
        # Property-specific factors
        property_effect = self._calculate_property_specific_effect(property_data)
        
        # Comparable sales effect (based on recent transactions)
        comps_effect = self._calculate_comps_effect(property_data, transactions)
        
        # Supply/demand balance in neighborhood
        supply_demand_effect = self._calculate_supply_demand_effect(neighborhood)
        
        # Calculate total change
        total_change = base_change + random_factor + neighborhood_effect + property_effect + comps_effect + supply_demand_effect
        
        # Apply reasonable limits to change
        total_change = max(-0.25, min(0.25, total_change))  # Limit to -25% to +25% per round
        
        # Calculate and return new value
        new_value = current_value * (1 + total_change)
        
        return new_value
    
    def _calculate_property_specific_effect(self, property_data):
        """Calculate value effect based on property-specific factors"""
        # Implementation for property-specific factors
        pass
    
    def _calculate_comps_effect(self, property_data, transactions):
        """Calculate effect of comparable sales"""
        # Implementation for comparable sales analysis
        pass
    
    def _calculate_supply_demand_effect(self, neighborhood):
        """Calculate effect of supply/demand balance"""
        # Implementation for supply/demand analysis
        pass
```

### 3. Phase Transition System

```python
# phase_transition.py

class PhaseTransitionSystem:
    def __init__(self, session_id):
        self.session_id = session_id
        self.db = firestore.Client()
        
    def check_transition(self):
        """Check if market conditions warrant a phase transition"""
        # Get session and market data
        session_ref = self.db.collection('sessions').document(self.session_id)
        session = session_ref.get().to_dict()
        
        current_phase = session['market_phase']
        current_round = session['current_round']
        phase_round = session['phase_round']
        
        # Get market data
        market_ref = self.db.collection('market_data').where('session_id', '==', self.session_id).limit(1)
        market_data = list(market_ref.stream())[0].to_dict()
        
        # Get transition thresholds
        thresholds = self._get_transition_thresholds()
        
        # Determine next phase
        next_phase = self._get_next_phase(current_phase)
        transition_key = f"{current_phase}_to_{next_phase}"
        
        # Check if transition conditions are met
        if transition_key in thresholds:
            threshold = thresholds[transition_key]
            
            # Check minimum rounds requirement
            if phase_round >= threshold['min_rounds']:
                # Check metric conditions
                metrics = self._calculate_transition_metrics(market_data)
                conditions_met = True
                
                for metric, required_value in threshold['metrics'].items():
                    if metric not in metrics:
                        continue
                    
                    current_value = metrics[metric]
                    # Check if condition is met based on comparison operator
                    operator = threshold['operators'].get(metric, '>=')
                    
                    if operator == '>=' and current_value < required_value:
                        conditions_met = False
                    elif operator == '<=' and current_value > required_value:
                        conditions_met = False
                    elif operator == '>' and current_value <= required_value:
                        conditions_met = False
                    elif operator == '<' and current_value >= required_value:
                        conditions_met = False
                
                if conditions_met:
                    return {
                        'should_transition': True,
                        'next_phase': next_phase,
                        'reason': f"Transition conditions met for {transition_key}",
                        'metrics': metrics
                    }
        
        # No transition
        return {
            'should_transition': False,
            'current_phase': current_phase
        }
    
    def _get_next_phase(self, current_phase):
        """Get the next phase in the cycle"""
        phase_sequence = [
            'stable',
            'rising',
            'hot',
            'top',
            'initial_decline',
            'crash',
            'recovery'
        ]
        
        current_index = phase_sequence.index(current_phase)
        next_index = (current_index + 1) % len(phase_sequence)
        
        return phase_sequence[next_index]
    
    def _get_transition_thresholds(self):
        """Get thresholds for phase transitions"""
        return {
            'stable_to_rising': {
                'min_rounds': 2,
                'metrics': {
                    'price_change_rate': 0.04,
                    'transaction_volume_change': 0.15,
                    'market_sentiment': 0.6
                },
                'operators': {
                    'price_change_rate': '>=',
                    'transaction_volume_change': '>=',
                    'market_sentiment': '>='
                }
            },
            'rising_to_hot': {
                'min_rounds': 3,
                'metrics': {
                    'price_change_rate': 0.08,
                    'days_on_market': 20,
                    'price_to_income_ratio': 4.5
                },
                'operators': {
                    'price_change_rate': '>=',
                    'days_on_market': '<=',
                    'price_to_income_ratio': '>='
                }
            },
            'hot_to_top': {
                'min_rounds': 2,
                'metrics': {
                    'price_change_rate': 0.12,
                    'speculative_activity_index': 120,
                    'price_to_income_ratio': 5.5
                },
                'operators': {
                    'price_change_rate': '>=',
                    'speculative_activity_index': '>=',
                    'price_to_income_ratio': '>='
                }
            },
            'top_to_initial_decline': {
                'min_rounds': 1,
                'metrics': {
                    'transaction_volume_change': -0.1,
                    'inventory_change': 0.2,
                    'days_on_market_change': 0.25
                },
                'operators': {
                    'transaction_volume_change': '<=',
                    'inventory_change': '>=',
                    'days_on_market_change': '>='
                }
            },
            'initial_decline_to_crash': {
                'min_rounds': 1,
                'metrics': {
                    'price_change_rate': -0.05,
                    'transaction_volume_change': -0.3,
                    'market_sentiment': 0.3
                },
                'operators': {
                    'price_change_rate': '<=',
                    'transaction_volume_change': '<=',
                    'market_sentiment': '<='
                }
            },
            'crash_to_recovery': {
                'min_rounds': 2,
                'metrics': {
                    'cumulative_price_decline': -0.25,
                    'transaction_volume_change': 0.1,
                    'price_to_income_ratio': 3.8
                },
                'operators': {
                    'cumulative_price_decline': '<=',
                    'transaction_volume_change': '>=',
                    'price_to_income_ratio': '<='
                }
            }
        }
    
    def _calculate_transition_metrics(self, market_data):
        """Calculate metrics used for phase transition decisions"""
        # Implementation for metrics calculation
        pass
```

### 4. Transaction Processing System

```python
# transaction_processor.py

class TransactionProcessor:
    def __init__(self, session_id):
        self.session_id = session_id
        self.db = firestore.Client()
        
    def process_transactions(self):
        """Process all pending buy/sell transactions for the current round"""
        # Get session data
        session_ref = self.db.collection('sessions').document(self.session_id)
        session = session_ref.get().to_dict()
        current_round = session['current_round']
        
        # Get all pending buy orders
        buy_orders = self._get_buy_orders()
        
        # Get all properties for sale
        for_sale_properties = self._get_for_sale_properties()
        
        # Process each buy order
        transactions = []
        
        for order in buy_orders:
            buyer_id = order['player_id']
            property_id = order.get('property_id')
            max_price = order['max_price']
            financing = order.get('financing', 'mortgage')
            
            # If targeting a specific property
            if property_id and property_id in for_sale_properties:
                property_data = for_sale_properties[property_id]
                
                # Check if price is acceptable
                if property_data['asking_price'] <= max_price:
                    # Process the transaction
                    transaction = self._execute_transaction(
                        buyer_id=buyer_id,
                        seller_id=property_data['owner_id'],
                        property_id=property_id,
                        price=property_data['asking_price'],
                        financing=financing,
                        down_payment=order.get('down_payment', 0.2 * property_data['asking_price'])
                    )
                    
                    if transaction:
                        transactions.append(transaction)
                        # Remove the property from available properties
                        del for_sale_properties[property_id]
            
            # If looking for properties meeting criteria
            else:
                # Filter properties based on buyer criteria
                matching_properties = self._find_matching_properties(
                    for_sale_properties, 
                    order.get('criteria', {}),
                    max_price
                )
                
                if matching_properties:
                    # Select the best matching property
                    best_match = self._select_best_property_match(matching_properties, order)
                    
                    # Process the transaction
                    transaction = self._execute_transaction(
                        buyer_id=buyer_id,
                        seller_id=best_match['owner_id'],
                        property_id=best_match['id'],
                        price=best_match['asking_price'],
                        financing=financing,
                        down_payment=order.get('down_payment', 0.2 * best_match['asking_price'])
                    )
                    
                    if transaction:
                        transactions.append(transaction)
                        # Remove the property from available properties
                        del for_sale_properties[best_match['id']]
        
        return transactions
    
    def _get_buy_orders(self):
        """Get all pending buy orders for the current round"""
        # Implementation to retrieve buy orders
        pass
    
    def _get_for_sale_properties(self):
        """Get all properties currently for sale"""
        # Implementation to retrieve for-sale properties
        pass
    
    def _find_matching_properties(self, properties, criteria, max_price):
        """Find properties matching buyer criteria"""
        # Implementation to filter properties by criteria
        pass
    
    def _select_best_property_match(self, properties, order):
        """Select the best matching property based on buyer preferences"""
        # Implementation to rank and select properties
        pass
    
    def _execute_transaction(self, buyer_id, seller_id, property_id, price, financing, down_payment):
        """Execute a property transaction between buyer and seller"""
        # Implementation for transaction execution
        pass
```

## Frontend Components

### 1. Main App Structure

```jsx
// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';

// Pages
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import TADashboard from './pages/TADashboard';
import GameSetup from './pages/GameSetup';
import ActiveGame from './pages/ActiveGame';
import GameResults from './pages/GameResults';

// Components
import PrivateRoute from './components/PrivateRoute';
import Header from './components/Header';

function App() {
  return (
    <Router>
      <AuthProvider>
        <GameProvider>
          <div className="app">
            <Header />
            <main className="main-content">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route 
                  path="/student-dashboard" 
                  element={
                    <PrivateRoute>
                      <StudentDashboard />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/ta-dashboard" 
                  element={
                    <PrivateRoute requireTA={true}>
                      <TADashboard />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/game-setup" 
                  element={
                    <PrivateRoute requireTA={true}>
                      <GameSetup />
                    </PrivateRoute>
                  } 
                />
                <Route path="/game/:sessionId" element={<ActiveGame />} />
                <Route path="/results/:sessionId" element={<GameResults />} />
                <Route path="/" element={<Login />} />
              </Routes>
            </main>
          </div>
        </GameProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
```

### 2. TA Control Panel

```jsx
// TADashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp
} from 'firebase/firestore';
import GameSessionCard from '../components/GameSessionCard';
import MarketPhaseControl from '../components/MarketPhaseControl';
import EventInjector from '../components/EventInjector';
import StudentPerformanceTable from '../components/StudentPerformanceTable';
import MarketDashboard from '../components/MarketDashboard';

const TADashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [marketData, setMarketData] = useState(null);
  const [students, setStudents] = useState([]);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Fetch sessions where the current user is the TA
    const fetchSessions = async () => {
      const sessionsRef = collection(db, 'sessions');
      const sessionsQuery = query(
        sessionsRef, 
        where('ta_id', '==', currentUser.uid)
      );
      
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessionsData = sessionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setSessions(sessionsData);
      
      // If there's an active session, set it as active
      const active = sessionsData.find(s => s.status === 'in_progress');
      if (active) {
        setActiveSession(active);
        fetchMarketData(active.id);
        fetchStudents(active.id);
      }
    };
    
    fetchSessions();
  }, [currentUser]);
  
  const fetchMarketData = async (sessionId) => {
    const marketRef = collection(db, 'market_data');
    const marketQuery = query(
      marketRef, 
      where('session_id', '==', sessionId)
    );
    
    const marketSnapshot = await getDocs(marketQuery);
    if (!marketSnapshot.empty) {
      setMarketData(marketSnapshot.docs[0].data());
    }
  };
  
  const fetchStudents = async (sessionId) => {
    const playersRef = collection(db, 'players');
    const playersQuery = query(
      playersRef, 
      where('session_id', '==', sessionId)
    );
    
    const playersSnapshot = await getDocs(playersQuery);
    const playersData = playersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    setStudents(playersData);
  };
  
  const createNewSession = () => {
    navigate('/game-setup');
  };
  
  const startNextRound = async () => {
    if (!activeSession) return;
    
    // Update session to start next round
    const sessionRef = doc(db, 'sessions', activeSession.id);
    
    await updateDoc(sessionRef, {
      round_status: 'in_progress',
      round_start_time: serverTimestamp(),
      last_updated: serverTimestamp()
    });
    
    // Refresh data
    fetchMarketData(activeSession.id);
  };
  
  const endCurrentRound = async () => {
    if (!activeSession) return;
    
    // Process market updates for the round
    // This would trigger the backend processing
    // In a real implementation, this would call an API endpoint
    
    // For demo, we'll just update the session
    const sessionRef = doc(db, 'sessions', activeSession.id);
    
    await updateDoc(sessionRef, {
      current_round: activeSession.current_round + 1,
      round_status: 'completed',
      last_updated: serverTimestamp()
    });
    
    // Refresh data
    const updatedSession = { 
      ...activeSession, 
      current_round: activeSession.current_round + 1 
    };
    setActiveSession(updatedSession);
    
    // Refresh market data and students
    fetchMarketData(activeSession.id);
    fetchStudents(activeSession.id);
  };
  
  const injectEvent = async (event) => {
    if (!activeSession) return;
    
    // Add the event to the session
    const sessionRef = doc(db, 'sessions', activeSession.id);
    
    await updateDoc(sessionRef, {
      events: arrayUnion({
        ...event,
        round: activeSession.current_round,
        timestamp: serverTimestamp()
      })
    });
    
    // Refresh data
    fetchMarketData(activeSession.id);
  };
  
  const changeMarketPhase = async (newPhase) => {
    if (!activeSession) return;
    
    // Update the market phase
    const sessionRef = doc(db, 'sessions', activeSession.id);
    
    await updateDoc(sessionRef, {
      market_phase: newPhase,
      phase_round: 1, // Reset phase round counter
      phase_history: arrayUnion({
        phase: activeSession.market_phase,
        rounds: activeSession.phase_round,
        end_round: activeSession.current_round
      }),
      last_updated: serverTimestamp()
    });
    
    // Refresh session data
    const updatedSession = { 
      ...activeSession, 
      market_phase: newPhase,
      phase_round: 1
    };
    setActiveSession(updatedSession);
    
    // Refresh market data
    fetchMarketData(activeSession.id);
  };
  
  return (
    <div className="ta-dashboard">
      <h1>Teaching Assistant Dashboard</h1>
      
      <div className="dashboard-actions">
        <button onClick={createNewSession}>Create New Game</button>
      </div>
      
      {sessions.length > 0 ? (
        <div className="session-list">
          <h2>Your Game Sessions</h2>
          {sessions.map(session => (
            <GameSessionCard 
              key={session.id}
              session={session}
              isActive={activeSession && activeSession.id === session.id}
              onSelect={() => {
                setActiveSession(session);
                fetchMarketData(session.id);
                fetchStudents(session.id);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="no-sessions">
          <p>You don't have any game sessions yet.</p>
        </div>
      )}
      
      {activeSession && (
        <div className="active-session-controls">
          <h2>Active Session: {activeSession.name}</h2>
          
          <div className="round-controls">
            <div className="round-info">
              <p>Current Round: {activeSession.current_round}</p>
              <p>Market Phase: {activeSession.market_phase}</p>
              <p>Phase Round: {activeSession.phase_round}</p>
            </div>
            
            <div className="round-buttons">
              <button 
                onClick={startNextRound}
                disabled={activeSession.round_status === 'in_progress'}
              >
                Start Round
              </button>
              <button 
                onClick={endCurrentRound}
                disabled={activeSession.round_status !== 'in_progress'}
              >
                End Round
              </button>
            </div>
          </div>
          
          <MarketPhaseControl 
            currentPhase={activeSession.market_phase}
            onPhaseChange={changeMarketPhase}
          />
          
          <EventInjector onInjectEvent={injectEvent} />
          
          {marketData && (
            <MarketDashboard marketData={marketData} />
          )}
          
          <h3>Student Performance</h3>
          <StudentPerformanceTable students={students} />
        </div>
      )}
    </div>
  );
};

export default TADashboard;
```

### 3. Student Dashboard

```jsx
// StudentDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot 
} from 'firebase/firestore';
import PropertyCard from '../components/PropertyCard';
import PortfolioSummary from '../components/PortfolioSummary';
import MarketIndicators from '../components/MarketIndicators';
import TransactionHistory from '../components/TransactionHistory';

// ActiveGame.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  onSnapshot,
  updateDoc,
  arrayUnion,
  serverTimestamp 
} from 'firebase/firestore';
import PropertyBrowser from '../components/PropertyBrowser';
import PropertyDetail from '../components/PropertyDetail';
import PortfolioSummary from '../components/PortfolioSummary';
import MarketIndicators from '../components/MarketIndicators';
import RoundStatus from '../components/RoundStatus';
import MortgageCalculator from '../components/MortgageCalculator';
import GameNews from '../components/GameNews';
import NeighborhoodMap from '../components/NeighborhoodMap';

const ActiveGame = () => {
  const { sessionId } = useParams();
  const { currentUser } = useAuth();
  const [session, setSession] = useState(null);
  const [player, setPlayer] = useState(null);
  const [marketData, setMarketData] = useState(null);
  const [properties, setProperties] = useState([]);
  const [forSaleProperties, setForSaleProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [roundTimer, setRoundTimer] = useState(null);
  const [roundStatus, setRoundStatus] = useState('waiting');
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [buyOrder, setBuyOrder] = useState(null);
  
  // Fetch session data
  useEffect(() => {
    const sessionRef = doc(db, 'sessions', sessionId);
    
    const unsubscribe = onSnapshot(sessionRef, (doc) => {
      if (doc.exists()) {
        const sessionData = doc.data();
        setSession(sessionData);
        
        // Update round status and timer
        if (sessionData.round_status === 'in_progress') {
          setRoundStatus('active');
          const startTime = sessionData.round_start_time?.toDate();
          if (startTime) {
            const duration = sessionData.config?.round_duration || 180; // 3 minutes default
            const endTime = new Date(startTime.getTime() + duration * 1000);
            const remaining = Math.max(0, (endTime - new Date()) / 1000);
            setRoundTimer(Math.floor(remaining));
          }
        } else if (sessionData.round_status === 'completed') {
          setRoundStatus('waiting');
          setRoundTimer(null);
        }
      }
    });
    
    return () => unsubscribe();
  }, [sessionId]);
  
  // Fetch player data
  useEffect(() => {
    const fetchPlayerData = async () => {
      const playersRef = collection(db, 'players');
      const playerQuery = query(
        playersRef,
        where('user_id', '==', currentUser.uid),
        where('session_id', '==', sessionId)
      );
      
      const playerSnapshot = await getDocs(playerQuery);
      if (!playerSnapshot.empty) {
        const playerDoc = playerSnapshot.docs[0];
        setPlayer({
          id: playerDoc.id,
          ...playerDoc.data()
        });
      }
    };
    
    fetchPlayerData();
  }, [sessionId, currentUser]);
  
  // Subscribe to market data
  useEffect(() => {
    const marketRef = collection(db, 'market_data');
    const marketQuery = query(marketRef, where('session_id', '==', sessionId));
    
    const unsubscribe = onSnapshot(marketQuery, (snapshot) => {
      if (!snapshot.empty) {
        setMarketData(snapshot.docs[0].data());
      }
    });
    
    return () => unsubscribe();
  }, [sessionId]);
  
  // Fetch neighborhood data
  useEffect(() => {
    const neighborhoodsRef = collection(db, 'neighborhoods');
    const neighborhoodsQuery = query(
      neighborhoodsRef,
      where('session_id', '==', sessionId)
    );
    
    const unsubscribe = onSnapshot(neighborhoodsQuery, (snapshot) => {
      const neighborhoodsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNeighborhoods(neighborhoodsData);
    });
    
    return () => unsubscribe();
  }, [sessionId]);
  
  // Fetch player's properties
  useEffect(() => {
    if (player && player.properties && player.properties.length > 0) {
      const propertiesQuery = player.properties.map(propId => 
        getDoc(doc(db, 'properties', propId))
      );
      
      Promise.all(propertiesQuery)
        .then(propertiesDocs => {
          const propertiesData = propertiesDocs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setProperties(propertiesData);
        });
    } else {
      setProperties([]);
    }
  }, [player]);
  
  // Fetch properties for sale
  useEffect(() => {
    const propertiesRef = collection(db, 'properties');
    const forSaleQuery = query(
      propertiesRef,
      where('session_id', '==', sessionId),
      where('for_sale', '==', true)
    );
    
    const unsubscribe = onSnapshot(forSaleQuery, (snapshot) => {
      const forSaleData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setForSaleProperties(forSaleData);
    });
    
    return () => unsubscribe();
  }, [sessionId]);
  
  // Count down round timer
  useEffect(() => {
    if (roundTimer === null) return;
    
    const interval = setInterval(() => {
      setRoundTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [roundTimer]);
  
  // Handle selecting a property
  const handleSelectProperty = (property) => {
    setSelectedProperty(property);
  };
  
  // Handle buying a property
  const handleBuyProperty = async (propertyId, offerDetails) => {
    if (!player) return;
    
    // Create a buy order
    const buyOrderData = {
      player_id: player.id,
      property_id: propertyId,
      max_price: offerDetails.offerPrice,
      financing: offerDetails.financing,
      down_payment: offerDetails.downPayment,
      submitted_round: session.current_round,
      status: 'pending'
    };
    
    // Save to Firestore
    const ordersRef = collection(db, 'buy_orders');
    try {
      // Add order to database
      const orderRef = await addDoc(ordersRef, buyOrderData);
      
      // Update local state
      setBuyOrder({
        id: orderRef.id,
        ...buyOrderData
      });
      
      return true;
    } catch (error) {
      console.error("Error submitting buy order:", error);
      return false;
    }
  };
  
  // Handle selling a property
  const handleSellProperty = async (propertyId, askingPrice) => {
    if (!player) return;
    
    // Update property as for sale
    const propertyRef = doc(db, 'properties', propertyId);
    
    try {
      await updateDoc(propertyRef, {
        for_sale: true,
        asking_price: askingPrice,
        listed_round: session.current_round
      });
      
      return true;
    } catch (error) {
      console.error("Error listing property for sale:", error);
      return false;
    }
  };
  
  // Calculate available cash for buying
  const getAvailableCash = useCallback(() => {
    if (!player) return 0;
    return player.cash;
  }, [player]);
  
  return (
    <div className="active-game">
      <div className="game-header">
        <h1>{session?.name || 'Loading game...'}</h1>
        <RoundStatus 
          status={roundStatus}
          round={session?.current_round}
          phase={session?.market_phase}
          timer={roundTimer}
        />
      </div>
      
      <div className="game-layout">
        <div className="sidebar">
          {player && (
            <PortfolioSummary 
              cash={player.cash}
              properties={properties}
              loans={player.loans}
              netWorth={player.performance?.net_worth || 0}
              totalReturn={player.performance?.total_return || 0}
              rank={player.performance?.rank || '-'}
            />
          )}
          
          <MarketIndicators 
            marketData={marketData}
            currentPhase={session?.market_phase}
          />
          
          <GameNews 
            events={session?.events || []}
            currentRound={session?.current_round}
          />
        </div>
        
        <div className="main-content">
          <div className="neighborhood-map-container">
            <NeighborhoodMap 
              neighborhoods={neighborhoods}
              properties={properties.concat(forSaleProperties)}
              onSelectProperty={handleSelectProperty}
            />
          </div>
          
          <div className="property-browser-container">
            <PropertyBrowser 
              forSaleProperties={forSaleProperties}
              ownedProperties={properties}
              onSelectProperty={handleSelectProperty}
              onSellProperty={handleSellProperty}
              neighborhoods={neighborhoods}
            />
          </div>
          
          {selectedProperty && (
            <div className="property-detail-container">
              <PropertyDetail 
                property={selectedProperty}
                isOwned={player?.properties?.includes(selectedProperty.id)}
                canBuy={roundStatus === 'active' && !player?.properties?.includes(selectedProperty.id)}
                canSell={roundStatus === 'active' && player?.properties?.includes(selectedProperty.id)}
                availableCash={getAvailableCash()}
                onBuy={handleBuyProperty}
                onSell={handleSellProperty}
                interestRate={session?.config?.interest_rate_base || 4.5}
              />
              
              {selectedProperty.for_sale && !player?.properties?.includes(selectedProperty.id) && (
                <MortgageCalculator 
                  propertyPrice={selectedProperty.asking_price}
                  interestRate={session?.config?.interest_rate_base || 4.5}
                  availableCash={getAvailableCash()}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActiveGame;

const StudentDashboard = () => {
  const [activeGames, setActiveGames] = useState([]);
  const [completedGames, setCompletedGames] = useState([]);
  const [playerData, setPlayerData] = useState(null);
  const [properties, setProperties] = useState([]);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Fetch games the student is participating in
    const fetchGames = async () => {
      const playersRef = collection(db, 'players');
      const playerQuery = query(
        playersRef, 
        where('user_id', '==', currentUser.uid)
      );
      
      const playerSnapshot = await getDocs(playerQuery);
      
      if (!playerSnapshot.empty) {
        const playerDoc = playerSnapshot.docs[0];
        setPlayerData(playerDoc.data());
        
        // Get session data
        const sessionId = playerDoc.data().session_id;
        const sessionRef = doc(db, 'sessions', sessionId);
        const sessionSnap = await getDoc(sessionRef);
        
        if (sessionSnap.exists()) {
          const sessionData = sessionSnap.data();
          
          if (sessionData.status === 'in_progress') {
            setActiveGames([sessionData]);
          } else if (sessionData.status === 'completed') {
            setCompletedGames([sessionData]);
          }
        }
      }
    };
    
    fetchGames();
  }, [currentUser]);
  
  useEffect(() => {
    // Fetch player's properties
    if (playerData && playerData.properties) {
      const fetchProperties = async () => {
        const propertyPromises = playerData.properties.map(propId => 
          getDoc(doc(db, 'properties', propId))
        );
        
        const propertyDocs = await Promise.all(propertyPromises);
        const propertyData = propertyDocs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setProperties(propertyData);
      };
      
      fetchProperties();
    }
  }, [playerData]);
  
  const joinGame = (sessionId) => {
    navigate(`/game/${sessionId}`);
  };
  
  return (
    <div className="student-dashboard">
      <h1>Student Dashboard</h1>
      
      {activeGames.length > 0 ? (
        <div className="active-games">
          <h2>Active Games</h2>
          {activeGames.map(game => (
            <div key={game.id} className="game-card">
              <h3>{game.name}</h3>
              <p>Round: {game.current_round}</p>
              <p>Phase: {game.market_phase}</p>
              <button onClick={() => joinGame(game.id)}>
                Join Game
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-games">
          <p>You are not currently in any active games.</p>
        </div>
      )}
      
      {playerData && (
        <div className="player-portfolio">
          <h2>Your Portfolio</h2>
          <PortfolioSummary 
            cash={playerData.cash}
            netWorth={playerData.performance?.netWorth || 0}
            totalReturn={playerData.performance?.totalReturn || 0}
            rank={playerData.performance?.rank || '-'}
          />
          
          <h3>Your Properties</h3>
          <div className="property-grid">
            {properties.map(property => (
              <PropertyCard 
                key={property.id}
                property={property}
                onSell={() => handleSellProperty(property.id)}
              />
            ))}
          </div>
          
          <h3>Transaction History</h3>
          <TransactionHistory transactions={playerData.transactions || []} />
        </div>
      )}
      
      {completedGames.length > 0 && (
        <div className="completed-games">
          <h2>Completed Games</h2>
          {completedGames.map(game => (
            <div key={game.id} className="game-card">
              <h3>{game.name}</h3>
              <p>Final Round: {game.total_rounds}</p>
              <p>Your Rank: {playerData?.performance?.rank || '-'}</p>
              <button onClick={() => navigate(`/results/${game.id}`)}>
                View Results
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );