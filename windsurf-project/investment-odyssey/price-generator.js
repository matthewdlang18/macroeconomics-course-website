// Investment Odyssey Price Generation Algorithm

// Asset parameters (mean return, standard deviation, min and max returns)
const assetParams = {
  'S&P 500': { mean: 0.1151, stdDev: 0.1949, min: -0.43, max: 0.50 },
  'Bonds': { mean: 0.0334, stdDev: 0.0301, min: 0.0003, max: 0.14 },
  'Real Estate': { mean: 0.0439, stdDev: 0.0620, min: -0.12, max: 0.24 },
  'Gold': { mean: 0.0648, stdDev: 0.2076, min: -0.32, max: 1.25 },
  'Commodities': { mean: 0.0815, stdDev: 0.1522, min: -0.25, max: 2.00 },
  'Bitcoin': { mean: 0.50, stdDev: 1.00, min: -0.73, max: 2.50 }
};

// Correlation matrix for asset returns
const correlationMatrix = [
  // S&P 500   Bonds    Real Estate  Gold    Commodities  Bitcoin
  [1.0000,    -0.5169,   0.3425,     0.0199,  0.1243,     0.4057],  // S&P 500
  [-0.5169,    1.0000,   0.0176,     0.0289, -0.0235,    -0.2259],  // Bonds
  [0.3425,     0.0176,   1.0000,    -0.4967, -0.0334,     0.1559],  // Real Estate
  [0.0199,     0.0289,  -0.4967,     1.0000,  0.0995,    -0.5343],  // Gold
  [0.1243,    -0.0235,  -0.0334,     0.0995,  1.0000,     0.0436],  // Commodities
  [0.4057,    -0.2259,   0.1559,    -0.5343,  0.0436,     1.0000]   // Bitcoin
];

// Asset names in the same order as the correlation matrix
const assetNames = ['S&P 500', 'Bonds', 'Real Estate', 'Gold', 'Commodities', 'Bitcoin'];

/**
 * Generate correlated returns for all assets
 * @returns {Object} Object with asset names as keys and returns as values
 */
function generateCorrelatedReturns() {
  // Extract means and standard deviations in the same order as the correlation matrix
  const means = assetNames.map(asset => assetParams[asset].mean);
  const stdDevs = assetNames.map(asset => assetParams[asset].stdDev);

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

    // Convert to actual return using mean and standard deviation
    let assetReturn = means[i] + stdDevs[i] * weightedReturn;

    // Ensure return is within bounds
    assetReturn = Math.max(
      assetParams[asset].min,
      Math.min(assetParams[asset].max, assetReturn)
    );

    correlatedReturns[asset] = assetReturn;
  }

  return correlatedReturns;
}

/**
 * Generate Bitcoin return with special behavior
 * @param {Object} gameState Current game state
 * @returns {number} Bitcoin return
 */
function generateBitcoinReturn(gameState) {
  if (!gameState) {
    // If no game state is provided, generate a standard return
    return generateStandardBitcoinReturn();
  }

  // Handle different property naming conventions
  const assetPrices = gameState.asset_prices || gameState.assetPrices || {};
  const bitcoinPrice = assetPrices['Bitcoin'];

  if (!bitcoinPrice) {
    console.error('Bitcoin price not found in game state');
    return generateStandardBitcoinReturn();
  }

  let bitcoinReturn;

  // Bitcoin has special growth patterns based on its price
  if (bitcoinPrice < 10000) {
    // Low price: rapid growth
    bitcoinReturn = 0.5 + Math.random() * 1.5; // Return between 50% and 200%
  } else if (bitcoinPrice >= 1000000) {
    // Very high price: crash
    bitcoinReturn = -0.3 - Math.random() * 0.2; // Return between -30% and -50%
  } else {
    // Normal price range: correlated with other assets but with high volatility
    bitcoinReturn = generateStandardBitcoinReturn();

    // Adjust Bitcoin's return based on its current price
    const priceThreshold = 100000;
    if (bitcoinPrice > priceThreshold) {
      // Calculate how many increments above threshold
      const incrementsAboveThreshold = Math.max(0, (bitcoinPrice - priceThreshold) / 50000);

      // Reduce volatility as price grows (more mature asset)
      const volatilityReduction = Math.min(0.7, incrementsAboveThreshold * 0.05);
      const adjustedStdDev = assetParams['Bitcoin'].stdDev * (1 - volatilityReduction);

      // Recalculate return with reduced volatility
      bitcoinReturn = bitcoinReturn * (1 - volatilityReduction);
    }

    // Check for Bitcoin crash (4-year cycle)
    // Handle different property naming conventions
    const roundNumber = gameState.round_number || gameState.roundNumber || 0;
    const lastBitcoinCrashRound = gameState.last_bitcoin_crash_round || gameState.lastBitcoinCrashRound || 0;
    const bitcoinShockRange = gameState.bitcoin_shock_range || gameState.bitcoinShockRange || [-0.5, -0.75];

    if (roundNumber - lastBitcoinCrashRound >= 4) {
      console.log('Bitcoin crash check: 4+ rounds since last crash');
      if (Math.random() < 0.5) { // 50% chance of crash after 4 rounds
        console.log('Bitcoin crash triggered!');
        // Apply shock based on current shock range
        bitcoinReturn = bitcoinShockRange[0] + Math.random() *
          (bitcoinShockRange[1] - bitcoinShockRange[0]);
      }
    }
  }

  // Ensure Bitcoin return is within bounds
  bitcoinReturn = Math.max(
    assetParams['Bitcoin'].min,
    Math.min(assetParams['Bitcoin'].max, bitcoinReturn)
  );

  return bitcoinReturn;
}

/**
 * Generate a standard Bitcoin return without special behavior
 * @returns {number} Bitcoin return
 */
function generateStandardBitcoinReturn() {
  const mean = assetParams['Bitcoin'].mean;
  const stdDev = assetParams['Bitcoin'].stdDev;

  // Generate random normal value
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

  // Convert to actual return using mean and standard deviation
  return mean + stdDev * z;
}

/**
 * Generate new prices based on previous prices and game state
 * @param {Object} previousPrices Previous asset prices
 * @param {Object} gameState Current game state
 * @returns {Object} New asset prices
 */
function generateNewPrices(previousPrices, gameState) {
  // Generate correlated returns
  const returns = generateCorrelatedReturns();

  // Apply special Bitcoin behavior if game state is provided
  if (gameState) {
    returns['Bitcoin'] = generateBitcoinReturn(gameState);
  }

  // Calculate new prices based on returns
  const newPrices = {};
  for (const asset in previousPrices) {
    const return_value = returns[asset];
    newPrices[asset] = previousPrices[asset] * (1 + return_value);
  }

  return newPrices;
}

// Export functions for use in other files
window.priceGenerator = {
  generateNewPrices,
  generateCorrelatedReturns,
  generateBitcoinReturn,
  assetParams
};
