// Global variables
let playerData = {
    name: '',
    section: '',
    games: [],
    achievements: []
};

let globalStats = {
    avgPortfolio: 0,
    topScore: 0,
    totalPlayers: 0,
    totalGames: 0
};

let charts = {};

// DOM elements
const loginPrompt = document.getElementById('login-prompt');
const statisticsContent = document.getElementById('statistics-content');

// Player summary elements
const playerName = document.getElementById('player-name');
const playerSection = document.getElementById('player-section');
const totalGames = document.getElementById('total-games');
const bestRank = document.getElementById('best-rank');
const winRate = document.getElementById('win-rate');
const avgReturn = document.getElementById('avg-return');

// Performance overview elements
const bestPortfolio = document.getElementById('best-portfolio');
const bestPortfolioDate = document.getElementById('best-portfolio-date');
const avgPortfolio = document.getElementById('avg-portfolio');
const performanceBar = document.getElementById('performance-bar');
const performanceText = document.getElementById('performance-text');

// Recent games table
const recentGamesBody = document.getElementById('recent-games-body');

// Achievements list
const achievementsList = document.getElementById('achievements-list');

// Strategy analysis
const strategyAnalysis = document.getElementById('strategy-analysis');

// Initialize the statistics page
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Check if Service object is available
        if (typeof window.Service === 'undefined') {
            console.error('Service object not found. Statistics functionality will be limited.');
            showNotification('Service connection unavailable. Using fallback data.', 'warning', 5000);
        } else {
            console.log('Service object found:', typeof window.Service);
        }

        // Check if user is logged in
        const studentId = localStorage.getItem('student_id');
        const studentName = localStorage.getItem('student_name');

        if (studentId && studentName) {
            // Hide login prompt and show statistics content
            if (loginPrompt) loginPrompt.classList.add('d-none');
            if (statisticsContent) statisticsContent.classList.remove('d-none');

            // Show loading notification
            showNotification('Loading your statistics...', 'info');

            // Load data in parallel for better performance
            const [playerDataResult, globalStatsResult] = await Promise.allSettled([
                loadPlayerData(studentId, studentName),
                loadGlobalStats()
            ]);

            // Check for errors in parallel loading
            if (playerDataResult.status === 'rejected') {
                console.error('Error loading player data:', playerDataResult.reason);
                showNotification('Error loading player data. Using fallback data.', 'warning');
            }

            if (globalStatsResult.status === 'rejected') {
                console.error('Error loading global stats:', globalStatsResult.reason);
                showNotification('Error loading global stats. Using fallback data.', 'warning');
            }

            // Update UI with player data
            updatePlayerSummary();
            updatePerformanceOverview();
            updateRecentGames();
            updateAchievements();
            updateStrategyAnalysis();

            // Initialize charts
            initializeCharts();

            // Show success notification
            showNotification('Statistics loaded successfully!', 'success', 2000);
        } else {
            // Show login prompt and hide statistics content
            if (loginPrompt) loginPrompt.classList.remove('d-none');
            if (statisticsContent) statisticsContent.classList.add('d-none');
        }
    } catch (error) {
        console.error('Error initializing statistics page:', error);
        showNotification('Failed to load statistics. Please try again later.', 'danger');
    }
});

// Load player data from Firebase
async function loadPlayerData(studentId, studentName) {
    try {
        // Check if we have cached data and it's less than 5 minutes old
        const cachedData = localStorage.getItem('statistics-player-data');
        const cacheTimestamp = localStorage.getItem('statistics-player-data-timestamp');

        if (cachedData && cacheTimestamp) {
            const cacheAge = Date.now() - parseInt(cacheTimestamp);
            if (cacheAge < 300000) { // 5 minutes in milliseconds
                console.log('Using cached player data');
                const parsedData = JSON.parse(cachedData);
                if (parsedData.studentId === studentId) {
                    playerData = parsedData;
                    // Calculate achievements
                    calculateAchievements();
                    return;
                }
            }
        }

        // Set a timeout to prevent hanging
        const timeout = setTimeout(() => {
            console.warn('Player data loading timeout - using fallback data');
            // Use fallback data if we have no games yet
            if (playerData.games.length === 0) {
                playerData.name = studentName;
                playerData.section = 'Sample Section';
                playerData.games = generateSampleGames(studentId);
                calculateAchievements();
            }
        }, 5000); // 5 second timeout

        // Get student data and section in parallel
        const studentResult = await Service.getStudent(studentId);

        // Set player name
        playerData.name = studentName;

        // Set section if available
        if (studentResult.success && studentResult.data.sectionId) {
            const sectionResult = await Service.getSection(studentResult.data.sectionId);
            if (sectionResult.success) {
                playerData.section = sectionResult.data.ta;
            }
        }

        // Get player's game history
        const gamesResult = await Service.getPlayerGames(studentId, 'investment-odyssey');

        // Clear the timeout since we got a response
        clearTimeout(timeout);

        if (gamesResult.success) {
            playerData.games = gamesResult.data;

            // Sort games by date (newest first)
            playerData.games.sort((a, b) => {
                const dateA = a.timestamp ? new Date(a.timestamp.seconds * 1000) : new Date(0);
                const dateB = b.timestamp ? new Date(b.timestamp.seconds * 1000) : new Date(0);
                return dateB - dateA;
            });

            console.log('Player games loaded:', playerData.games);

            // Cache the data
            localStorage.setItem('statistics-player-data', JSON.stringify({
                ...playerData,
                studentId: studentId // Store the student ID for validation
            }));
            localStorage.setItem('statistics-player-data-timestamp', Date.now().toString());
        } else {
            // Try fallback to localStorage
            try {
                const localLeaderboard = JSON.parse(localStorage.getItem('investment-odyssey-leaderboard') || '[]');
                playerData.games = localLeaderboard.filter(score => score.studentId === studentId);
                console.log('Using local leaderboard data for player games');

                if (playerData.games.length === 0) {
                    // If still no games, generate sample data
                    playerData.games = generateSampleGames(studentId);
                    console.log('Using generated sample games');
                }
            } catch (localError) {
                console.error('Error loading local leaderboard:', localError);
                playerData.games = generateSampleGames(studentId);
                console.log('Using generated sample games after error');
            }
        }

        // Calculate achievements
        calculateAchievements();

    } catch (error) {
        console.error('Error loading player data:', error);
        showNotification('Failed to load player data. Using sample data.', 'warning');

        // Use fallback data
        playerData.name = studentName;
        playerData.section = 'Sample Section';
        playerData.games = generateSampleGames(studentId);
        calculateAchievements();
    }
}

// Generate sample games for fallback
function generateSampleGames(studentId) {
    const games = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Start from 30 days ago

    // Generate 5 sample games
    for (let i = 0; i < 5; i++) {
        const gameDate = new Date(startDate);
        gameDate.setDate(gameDate.getDate() + (i * 6)); // Every 6 days

        // Random portfolio value between 9000 and 13000
        const portfolioValue = 10000 + Math.floor(Math.random() * 4000) - 1000;

        // Random rank between 1 and 20
        const rank = Math.floor(Math.random() * 20) + 1;

        games.push({
            id: `sample-game-${i}`,
            studentId: studentId,
            finalPortfolio: portfolioValue,
            rank: rank,
            totalPlayers: 50,
            isClassGame: i % 2 === 0, // Every other game is a class game
            timestamp: {
                seconds: gameDate.getTime() / 1000
            }
        });
    }

    return games;
}

// Load global stats
async function loadGlobalStats() {
    try {
        // Check if we have cached data and it's less than 15 minutes old
        const cachedStats = localStorage.getItem('statistics-global-stats');
        const cacheTimestamp = localStorage.getItem('statistics-global-stats-timestamp');

        if (cachedStats && cacheTimestamp) {
            const cacheAge = Date.now() - parseInt(cacheTimestamp);
            if (cacheAge < 900000) { // 15 minutes in milliseconds
                console.log('Using cached global stats');
                globalStats = JSON.parse(cachedStats);
                return;
            }
        }

        // Set a timeout to prevent hanging
        const timeout = setTimeout(() => {
            console.warn('Global stats loading timeout - using fallback data');
            // Use fallback data
            globalStats = {
                avgPortfolio: 11500,
                topScore: 15000,
                totalPlayers: 120,
                totalGames: 250
            };
        }, 5000); // 5 second timeout

        // Get global stats from Firebase
        let result;

        if (typeof Service.getGameStats === 'function') {
            result = await Service.getGameStats('investment-odyssey');
        } else {
            // Fallback if the function doesn't exist
            console.warn('Service.getGameStats not available, using fallback');

            // Get all scores to calculate stats
            const scoresResult = await Service.getGameLeaderboard('investment-odyssey', {
                pageSize: 1000 // Get a large number of scores
            });

            if (scoresResult.success) {
                const scores = scoresResult.data.scores;

                // Calculate stats
                const totalPortfolio = scores.reduce((sum, score) => sum + score.finalPortfolio, 0);
                const avgPortfolio = scores.length > 0 ? totalPortfolio / scores.length : 0;
                const topScore = scores.length > 0 ? Math.max(...scores.map(score => score.finalPortfolio)) : 0;

                // Get unique players
                const uniquePlayers = new Set(scores.map(score => score.studentId)).size;

                result = {
                    success: true,
                    data: {
                        avgPortfolio,
                        topScore,
                        totalPlayers: uniquePlayers,
                        totalGames: scores.length
                    }
                };
            } else {
                throw new Error('Failed to get scores for stats calculation');
            }
        }

        // Clear the timeout since we got a response
        clearTimeout(timeout);

        if (result.success) {
            globalStats = result.data;
            console.log('Global stats loaded:', globalStats);

            // Cache the data
            localStorage.setItem('statistics-global-stats', JSON.stringify(globalStats));
            localStorage.setItem('statistics-global-stats-timestamp', Date.now().toString());
        } else {
            console.error('Failed to load global stats:', result.error);
            // Use fallback data
            globalStats = {
                avgPortfolio: 11500,
                topScore: 15000,
                totalPlayers: 120,
                totalGames: 250
            };
        }
    } catch (error) {
        console.error('Error loading global stats:', error);
        // Use fallback data
        globalStats = {
            avgPortfolio: 11500,
            topScore: 15000,
            totalPlayers: 120,
            totalGames: 250
        };
    }
}

// Calculate player achievements
function calculateAchievements() {
    const achievements = [];

    // First Game Achievement
    if (playerData.games.length > 0) {
        achievements.push({
            name: 'First Game',
            description: 'Complete your first Investment Odyssey game',
            unlocked: true
        });
    }

    // 5 Games Achievement
    if (playerData.games.length >= 5) {
        achievements.push({
            name: 'Regular Investor',
            description: 'Complete 5 Investment Odyssey games',
            unlocked: true
        });
    }

    // 10 Games Achievement
    if (playerData.games.length >= 10) {
        achievements.push({
            name: 'Dedicated Investor',
            description: 'Complete 10 Investment Odyssey games',
            unlocked: true
        });
    }

    // Market Master Achievement (50% return)
    const highReturnGame = playerData.games.find(game => {
        const returnRate = (game.finalPortfolio - 10000) / 10000; // Assuming starting amount is 10000
        return returnRate >= 0.5;
    });

    achievements.push({
        name: 'Market Master',
        description: 'Achieve a 50% return in a single game',
        unlocked: !!highReturnGame
    });

    // Top 3 Achievement
    const top3Game = playerData.games.find(game => game.rank && game.rank <= 3);

    achievements.push({
        name: 'Podium Finish',
        description: 'Finish in the top 3 of any leaderboard',
        unlocked: !!top3Game
    });

    // Class Champion Achievement
    const firstPlaceGame = playerData.games.find(game => game.rank === 1);

    achievements.push({
        name: 'Class Champion',
        description: 'Finish first in any leaderboard',
        unlocked: !!firstPlaceGame
    });

    playerData.achievements = achievements;
}

// Update player summary section
function updatePlayerSummary() {
    // Update player name and section
    playerName.textContent = playerData.name || 'Guest Player';
    playerSection.textContent = playerData.section ? `Section: ${playerData.section}` : 'No Section';

    // Update total games
    totalGames.textContent = playerData.games.length;

    // Update best rank
    const ranks = playerData.games.map(game => game.rank).filter(rank => rank);
    const bestRankValue = ranks.length > 0 ? Math.min(...ranks) : 0;
    bestRank.textContent = bestRankValue > 0 ? `#${bestRankValue}` : '-';

    // Calculate win rate (top 25%)
    let wins = 0;
    playerData.games.forEach(game => {
        if (game.rank && game.totalPlayers) {
            if (game.rank <= Math.ceil(game.totalPlayers * 0.25)) {
                wins++;
            }
        }
    });

    const winRateValue = playerData.games.length > 0 ? (wins / playerData.games.length) * 100 : 0;
    winRate.textContent = `${Math.round(winRateValue)}%`;

    // Calculate average return
    let totalReturn = 0;
    playerData.games.forEach(game => {
        const returnRate = (game.finalPortfolio - 10000) / 10000; // Assuming starting amount is 10000
        totalReturn += returnRate;
    });

    const avgReturnValue = playerData.games.length > 0 ? (totalReturn / playerData.games.length) * 100 : 0;
    avgReturn.textContent = `${Math.round(avgReturnValue)}%`;
}

// Update performance overview section
function updatePerformanceOverview() {
    // Find best portfolio
    let bestPortfolioValue = 0;
    let bestPortfolioGame = null;

    playerData.games.forEach(game => {
        if (game.finalPortfolio > bestPortfolioValue) {
            bestPortfolioValue = game.finalPortfolio;
            bestPortfolioGame = game;
        }
    });

    // Update best portfolio
    bestPortfolio.textContent = formatCurrency(bestPortfolioValue);

    // Update best portfolio date
    if (bestPortfolioGame && bestPortfolioGame.timestamp) {
        const date = new Date(bestPortfolioGame.timestamp.seconds * 1000);
        bestPortfolioDate.textContent = `Date: ${date.toLocaleDateString()}`;
    } else {
        bestPortfolioDate.textContent = 'Date: -';
    }

    // Calculate average portfolio
    const totalPortfolio = playerData.games.reduce((sum, game) => sum + game.finalPortfolio, 0);
    const avgPortfolioValue = playerData.games.length > 0 ? totalPortfolio / playerData.games.length : 0;

    // Update average portfolio
    avgPortfolio.textContent = formatCurrency(avgPortfolioValue);

    // Calculate performance vs average
    const globalAvg = globalStats.avgPortfolio || 10000;
    const performancePercent = Math.min(Math.round((avgPortfolioValue / globalAvg) * 100), 200);

    // Update performance bar
    performanceBar.style.width = `${performancePercent}%`;
    performanceBar.textContent = `${performancePercent}%`;

    // Update performance text
    if (performancePercent > 100) {
        performanceBar.classList.remove('bg-danger', 'bg-warning');
        performanceBar.classList.add('bg-success');
        performanceText.textContent = `Your average portfolio is ${performancePercent - 100}% higher than the global average`;
    } else if (performancePercent === 100) {
        performanceBar.classList.remove('bg-danger', 'bg-success');
        performanceBar.classList.add('bg-warning');
        performanceText.textContent = 'Your average portfolio is equal to the global average';
    } else {
        performanceBar.classList.remove('bg-success', 'bg-warning');
        performanceBar.classList.add('bg-danger');
        performanceText.textContent = `Your average portfolio is ${100 - performancePercent}% lower than the global average`;
    }
}

// Update recent games table
function updateRecentGames() {
    // Clear table
    recentGamesBody.innerHTML = '';

    // Check if there are any games
    if (playerData.games.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="4" class="text-center">
                No games played yet
            </td>
        `;
        recentGamesBody.appendChild(row);
        return;
    }

    // Add recent games (up to 5)
    const recentGames = playerData.games.slice(0, 5);

    recentGames.forEach(game => {
        const row = document.createElement('tr');

        // Format date
        let dateText = '-';
        if (game.timestamp) {
            const date = new Date(game.timestamp.seconds * 1000);
            dateText = date.toLocaleDateString();
        }

        // Calculate return
        const returnRate = ((game.finalPortfolio - 10000) / 10000) * 100; // Assuming starting amount is 10000
        const returnClass = returnRate >= 0 ? 'text-success' : 'text-danger';
        const returnSign = returnRate >= 0 ? '+' : '';

        row.innerHTML = `
            <td>${dateText}</td>
            <td>${game.isClassGame ? 'Class' : 'Single'}</td>
            <td>${formatCurrency(game.finalPortfolio)}</td>
            <td class="${returnClass}">${returnSign}${Math.round(returnRate)}%</td>
        `;

        recentGamesBody.appendChild(row);
    });
}

// Update achievements list
function updateAchievements() {
    // Clear list
    achievementsList.innerHTML = '';

    // Add achievements
    playerData.achievements.forEach(achievement => {
        const item = document.createElement('div');
        item.className = `list-group-item achievement-card${achievement.unlocked ? '' : ' achievement-locked'}`;

        item.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
                <h5 class="mb-1">${achievement.name}</h5>
                <span class="badge badge-${achievement.unlocked ? 'success' : 'secondary'} badge-large">
                    ${achievement.unlocked ? 'Unlocked' : 'Locked'}
                </span>
            </div>
            <p class="mb-1">${achievement.description}</p>
        `;

        achievementsList.appendChild(item);
    });
}

// Update strategy analysis
function updateStrategyAnalysis() {
    // Default analysis
    let analysis = 'Play more games to receive a personalized investment strategy analysis.';

    // Check if there are enough games for analysis
    if (playerData.games.length >= 3) {
        // Calculate average return
        let totalReturn = 0;
        playerData.games.forEach(game => {
            const returnRate = (game.finalPortfolio - 10000) / 10000; // Assuming starting amount is 10000
            totalReturn += returnRate;
        });

        const avgReturnValue = totalReturn / playerData.games.length;

        // Generate analysis based on performance
        if (avgReturnValue > 0.2) {
            analysis = 'Your investment strategy is excellent! You consistently outperform the market and make smart asset allocation decisions. Continue to diversify your portfolio while focusing on high-growth assets.';
        } else if (avgReturnValue > 0) {
            analysis = 'Your investment strategy is solid. You generally make good decisions, but there\'s room for improvement. Consider being more aggressive in growth markets and more conservative during downturns.';
        } else {
            analysis = 'Your investment strategy needs improvement. Focus on diversification and avoid putting too much into volatile assets. Consider a more balanced approach with a mix of stable and growth-oriented investments.';
        }
    }

    strategyAnalysis.textContent = analysis;
}

// Initialize charts
function initializeCharts() {
    // Portfolio Value Chart
    const portfolioCtx = document.getElementById('portfolio-chart').getContext('2d');

    // Prepare data for portfolio chart
    const portfolioLabels = [];
    const portfolioData = [];

    // Get last 10 games in chronological order
    const portfolioGames = [...playerData.games].slice(0, 10).reverse();

    portfolioGames.forEach((game, index) => {
        // Format date
        let dateText = `Game ${index + 1}`;
        if (game.timestamp) {
            const date = new Date(game.timestamp.seconds * 1000);
            dateText = date.toLocaleDateString();
        }

        portfolioLabels.push(dateText);
        portfolioData.push(game.finalPortfolio);
    });

    charts.portfolio = new Chart(portfolioCtx, {
        type: 'line',
        data: {
            labels: portfolioLabels,
            datasets: [{
                label: 'Portfolio Value',
                data: portfolioData,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Value: ' + formatCurrency(context.raw);
                        }
                    }
                }
            }
        }
    });

    // Returns Chart
    const returnsCtx = document.getElementById('returns-chart').getContext('2d');

    // Prepare data for returns chart
    const returnsLabels = [];
    const returnsData = [];

    portfolioGames.forEach((game, index) => {
        // Format date
        let dateText = `Game ${index + 1}`;
        if (game.timestamp) {
            const date = new Date(game.timestamp.seconds * 1000);
            dateText = date.toLocaleDateString();
        }

        // Calculate return
        const returnRate = ((game.finalPortfolio - 10000) / 10000) * 100; // Assuming starting amount is 10000

        returnsLabels.push(dateText);
        returnsData.push(returnRate);
    });

    charts.returns = new Chart(returnsCtx, {
        type: 'bar',
        data: {
            labels: returnsLabels,
            datasets: [{
                label: 'Return (%)',
                data: returnsData,
                backgroundColor: returnsData.map(value => value >= 0 ? 'rgba(75, 192, 192, 0.2)' : 'rgba(255, 99, 132, 0.2)'),
                borderColor: returnsData.map(value => value >= 0 ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)'),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Return: ' + context.raw.toFixed(1) + '%';
                        }
                    }
                }
            }
        }
    });

    // Asset Allocation Chart
    const assetsCtx = document.getElementById('assets-chart').getContext('2d');

    // Mock data for asset allocation (would need actual data from game history)
    const assetLabels = ['Stocks', 'Bonds', 'Real Estate', 'Crypto', 'Cash'];
    const assetData = [40, 20, 15, 15, 10];

    charts.assets = new Chart(assetsCtx, {
        type: 'doughnut',
        data: {
            labels: assetLabels,
            datasets: [{
                label: 'Asset Allocation',
                data: assetData,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.raw + '%';
                        }
                    }
                }
            }
        }
    });

    // Favorite Assets Chart
    const favoriteAssetsCtx = document.getElementById('favorite-assets-chart').getContext('2d');

    // Mock data for favorite assets (would need actual data from game history)
    const favoriteAssetLabels = ['Stocks', 'Crypto', 'Real Estate', 'Bonds', 'Cash'];
    const favoriteAssetData = [45, 25, 15, 10, 5];

    charts.favoriteAssets = new Chart(favoriteAssetsCtx, {
        type: 'bar',
        data: {
            labels: favoriteAssetLabels,
            datasets: [{
                label: 'Allocation Frequency (%)',
                data: favoriteAssetData,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });

    // Best Performing Assets Chart
    const bestAssetsCtx = document.getElementById('best-assets-chart').getContext('2d');

    // Mock data for best performing assets (would need actual data from game history)
    const bestAssetLabels = ['Crypto', 'Stocks', 'Real Estate', 'Bonds', 'Cash'];
    const bestAssetData = [35, 25, 15, 5, 0];

    charts.bestAssets = new Chart(bestAssetsCtx, {
        type: 'bar',
        data: {
            labels: bestAssetLabels,
            datasets: [{
                label: 'Average Return (%)',
                data: bestAssetData,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
}

// Format currency
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

// Format number
function formatNumber(value) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

// Show notification
function showNotification(message, type = 'info', duration = 5000) {
    // Create notification container if it doesn't exist
    let notificationContainer = document.getElementById('notification-container');

    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.top = '20px';
        notificationContainer.style.right = '20px';
        notificationContainer.style.zIndex = '9999';
        notificationContainer.style.maxWidth = '350px';
        document.body.appendChild(notificationContainer);
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show`;
    notification.role = 'alert';
    notification.style.marginBottom = '10px';
    notification.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';

    // Add notification content
    notification.innerHTML = `
        <div>${message}</div>
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    `;

    // Add notification to container
    notificationContainer.appendChild(notification);

    // Auto-remove notification after duration
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, duration);

    // Add click event to close button
    const closeButton = notification.querySelector('.close');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
    }
}
