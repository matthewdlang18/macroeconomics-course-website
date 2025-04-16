// Leaderboard JavaScript for Investment Odyssey

// Global variables
let currentPages = {
    single: 1,
    class: 1,
    overall: 1
};
const pageSize = 10;
let totalPages = {
    single: 1,
    class: 1,
    overall: 1
};
let currentFilters = {
    timeFrame: 'all',
    section: 'all',
    view: 'all',
    classGame: 'all' // For filtering by specific class game
};
let currentTab = 'single'; // Default tab
let classGames = []; // Store class game sessions
let globalStats = {
    avgPortfolio: 0,
    topScore: 0,
    totalPlayers: 0,
    totalGames: 0
};

// DOM elements
const singleLeaderboardBody = document.getElementById('single-leaderboard-body');
const classLeaderboardBody = document.getElementById('class-leaderboard-body');
const overallLeaderboardBody = document.getElementById('overall-leaderboard-body');
const personalStatsDiv = document.getElementById('personal-stats');
const singleNoResultsDiv = document.getElementById('single-no-results');
const classNoResultsDiv = document.getElementById('class-no-results');
const overallNoResultsDiv = document.getElementById('overall-no-results');
const singlePaginationDiv = document.getElementById('single-pagination');
const classPaginationDiv = document.getElementById('class-pagination');
const overallPaginationDiv = document.getElementById('overall-pagination');
const timeFilterSelect = document.getElementById('time-filter');
const sectionFilterSelect = document.getElementById('section-filter');
const viewFilterSelect = document.getElementById('view-filter');
const classGameSelect = document.getElementById('class-game-select');
const applyFiltersBtn = document.getElementById('apply-filters');

// Class game info elements
const classGameDate = document.getElementById('class-game-date');
const classGameTA = document.getElementById('class-game-ta');
const classGamePlayers = document.getElementById('class-game-players');

// Personal stats elements
const personalBestScore = document.getElementById('personal-best-score');
const personalAvgScore = document.getElementById('personal-avg-score');
const personalGamesPlayed = document.getElementById('personal-games-played');
const personalBestRank = document.getElementById('personal-best-rank');

// Global stats elements
const globalAvgPortfolio = document.getElementById('global-avg-portfolio');
const globalTopScore = document.getElementById('global-top-score');
const globalTotalPlayers = document.getElementById('global-total-players');
const globalTotalGames = document.getElementById('global-total-games');

// Initialize the leaderboard
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Show loading indicator
        showNotification('Loading leaderboard data...', 'info');

        // Check if Service object is available
        if (typeof window.Service === 'undefined') {
            console.error('Service object not found. Leaderboard functionality will be limited.');
            showNotification('Service connection unavailable. Using fallback data.', 'warning', 5000);
        } else {
            console.log('Service object found:', typeof window.Service);
        }

        // Check if user is logged in
        const studentId = localStorage.getItem('student_id');
        const studentName = localStorage.getItem('student_name');

        if (studentId && studentName) {
            // Show personal stats section
            personalStatsDiv.classList.remove('d-none');

            // Load personal stats
            await loadPersonalStats(studentId);
        }

        // Load TA sections for filter
        await loadTASections();

        // Load class games for history
        await loadClassGames();

        // Load global stats
        await loadGlobalStats();

        // Load initial leaderboard data
        await loadLeaderboardData();

        // Set up event listeners
        setupEventListeners();

        // Check for hash in URL to set active tab
        const hash = window.location.hash.substring(1);
        if (hash && ['single', 'class', 'overall'].includes(hash)) {
            document.querySelector(`#${hash}-tab`).click();
        }

        // Hide loading notification
        showNotification('Leaderboard loaded successfully!', 'success', 2000);
    } catch (error) {
        console.error('Error initializing leaderboard:', error);
        showErrorMessage('Failed to load leaderboard data. Please try again later.');
        showNotification('Failed to load leaderboard data. Please try again.', 'danger');
    }
});

// Load TA sections for the filter dropdown
async function loadTASections() {
    try {
        // Get all sections from Firebase
        const result = await Service.getAllSections();

        if (result.success) {
            const sections = result.data;

            // Group sections by TA
            const taMap = {};
            sections.forEach(section => {
                if (!taMap[section.ta]) {
                    taMap[section.ta] = true;
                }
            });

            // Add options to the select element
            const tas = Object.keys(taMap).sort();
            tas.forEach(ta => {
                const option = document.createElement('option');
                option.value = ta;
                option.textContent = `${ta}'s Sections`;
                sectionFilterSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading TA sections:', error);
    }
}

// Load class games for the history dropdown
async function loadClassGames() {
    try {
        // Get all class games from Firebase
        let result;

        if (typeof Service.getAllClassGames === 'function') {
            result = await Service.getAllClassGames();
        } else {
            // Fallback if the function doesn't exist
            console.warn('Service.getAllClassGames not available, using fallback');
            result = { success: true, data: [] };

            // Try to get active games from each TA
            const tasResult = await Service.getAllTAs();
            if (tasResult.success) {
                for (const ta of tasResult.data) {
                    const gamesResult = await Service.getActiveClassGamesByTA(ta.name);
                    if (gamesResult.success && gamesResult.data.length > 0) {
                        result.data = [...result.data, ...gamesResult.data];
                    }
                }
            }
        }

        if (result.success) {
            classGames = result.data;

            // Clear existing options except 'All Class Games'
            classGameSelect.innerHTML = '<option value="all">All Class Games</option>';

            // Sort games by date (newest first)
            classGames.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt.seconds * 1000) : new Date(0);
                const dateB = b.createdAt ? new Date(b.createdAt.seconds * 1000) : new Date(0);
                return dateB - dateA;
            });

            // Add each class game as an option
            classGames.forEach(game => {
                const date = game.createdAt ? new Date(game.createdAt.seconds * 1000) : new Date();
                const formattedDate = date.toLocaleDateString();
                const option = document.createElement('option');
                option.value = game.id;
                option.textContent = `${game.taName}'s Class (${formattedDate})`;
                classGameSelect.appendChild(option);
            });

            // Add event listener to update class game info when selection changes
            classGameSelect.addEventListener('change', updateClassGameInfo);

            // Initialize with the first game if available
            if (classGames.length > 0) {
                updateClassGameInfo();
            }
        } else {
            console.error('Failed to load class games:', result.error);
        }
    } catch (error) {
        console.error('Error loading class games:', error);
    }
}

// Update class game info based on selection
function updateClassGameInfo() {
    const selectedGameId = classGameSelect.value;

    if (selectedGameId === 'all') {
        // Show info for all games
        classGameDate.textContent = 'All Dates';
        classGameTA.textContent = 'All TAs';
        classGamePlayers.textContent = classGames.reduce((total, game) => total + (game.playerCount || 0), 0);
        return;
    }

    // Find the selected game
    const selectedGame = classGames.find(game => game.id === selectedGameId);

    if (selectedGame) {
        // Update game info
        const date = selectedGame.createdAt ? new Date(selectedGame.createdAt.seconds * 1000) : new Date();
        classGameDate.textContent = date.toLocaleDateString();
        classGameTA.textContent = selectedGame.taName || 'Unknown';
        classGamePlayers.textContent = selectedGame.playerCount || 0;

        // Update filter and reload data
        currentFilters.classGame = selectedGameId;
        if (currentTab === 'class') {
            loadLeaderboardData();
        }
    }
}

// Load global stats
async function loadGlobalStats() {
    try {
        // Try to use LocalStorageScores first
        if (typeof window.LocalStorageScores !== 'undefined') {
            console.log('Using LocalStorageScores for global stats');

            // Get stats for single player mode
            const singleStats = window.LocalStorageScores.getStatistics('single');

            // Get stats for class game mode
            const classStats = window.LocalStorageScores.getStatistics('class');

            // Combine stats
            const totalGames = singleStats.totalGames + classStats.totalGames;
            const totalPlayers = singleStats.totalPlayers + classStats.totalPlayers;
            const avgPortfolio = totalGames > 0 ?
                (singleStats.avgScore * singleStats.totalGames + classStats.avgScore * classStats.totalGames) / totalGames : 0;
            const highestScore = Math.max(singleStats.highestScore, classStats.highestScore);

            // Update global stats object
            globalStats = {
                avgPortfolio: avgPortfolio,
                topScore: highestScore,
                totalPlayers: totalPlayers,
                totalGames: totalGames
            };

            // Update UI
            globalAvgPortfolio.textContent = formatCurrency(globalStats.avgPortfolio);
            globalTopScore.textContent = formatCurrency(globalStats.topScore);
            globalTotalPlayers.textContent = formatNumber(globalStats.totalPlayers);
            globalTotalGames.textContent = formatNumber(globalStats.totalGames);

            return;
        }

        // Fallback to Service if LocalStorageScores didn't work
        if (typeof Service !== 'undefined') {
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

            if (result.success) {
                globalStats = result.data;

                // Update UI
                globalAvgPortfolio.textContent = formatCurrency(globalStats.avgPortfolio);
                globalTopScore.textContent = formatCurrency(globalStats.topScore);
                globalTotalPlayers.textContent = formatNumber(globalStats.totalPlayers);
                globalTotalGames.textContent = formatNumber(globalStats.totalGames);
            } else {
                console.error('Failed to load global stats:', result.error);
                throw new Error(result.error || 'Failed to load global stats');
            }
        } else {
            // No data source available
            console.warn('No data source available for global stats');
            throw new Error('No data source available');
        }
    } catch (error) {
        console.error('Error loading global stats:', error);

        // Set default values
        globalAvgPortfolio.textContent = '$0';
        globalTopScore.textContent = '$0';
        globalTotalPlayers.textContent = '0';
        globalTotalGames.textContent = '0';
    }
}

// Load personal stats
async function loadPersonalStats(studentId) {
    try {
        // Try to use LocalStorageScores first
        if (typeof window.LocalStorageScores !== 'undefined') {
            console.log('Using LocalStorageScores for personal stats');

            // Get student's scores
            const scores = window.LocalStorageScores.getScoresByStudent(studentId);

            if (scores.length > 0) {
                // Calculate stats
                const bestScore = Math.max(...scores.map(score => score.finalPortfolio));
                const avgScore = scores.reduce((sum, score) => sum + score.finalPortfolio, 0) / scores.length;
                const gamesPlayed = scores.length;

                // Update UI
                personalBestScore.textContent = formatCurrency(bestScore);
                personalAvgScore.textContent = formatCurrency(avgScore);
                personalGamesPlayed.textContent = gamesPlayed;

                // Calculate rank
                const allScores = window.LocalStorageScores.getAllScores();
                const sortedScores = [...allScores].sort((a, b) => b.finalPortfolio - a.finalPortfolio);
                const bestScoreIndex = sortedScores.findIndex(score =>
                    score.studentId === studentId && score.finalPortfolio === bestScore);

                if (bestScoreIndex !== -1) {
                    personalBestRank.textContent = bestScoreIndex + 1;
                }

                return;
            }
        }

        // Fallback to Service if LocalStorageScores didn't work
        if (typeof Service !== 'undefined' && typeof Service.getStudentGameScores === 'function') {
            // Get student's game scores - specify single player mode
            const result = await Service.getStudentGameScores(studentId, 'investment-odyssey', 'single');

            if (result.success && result.data.length > 0) {
                const scores = result.data;

                // Calculate stats
                const bestScore = Math.max(...scores.map(score => score.finalPortfolio));
                const avgScore = scores.reduce((sum, score) => sum + score.finalPortfolio, 0) / scores.length;
                const gamesPlayed = scores.length;

                // Update UI
                personalBestScore.textContent = formatCurrency(bestScore);
                personalAvgScore.textContent = formatCurrency(avgScore);
                personalGamesPlayed.textContent = gamesPlayed;

                // Best rank will be calculated when loading the leaderboard
            }
        } else {
            // No data source available
            console.warn('No data source available for personal stats');
            personalBestScore.textContent = 'N/A';
            personalAvgScore.textContent = 'N/A';
            personalGamesPlayed.textContent = '0';
            personalBestRank.textContent = 'N/A';
        }
    } catch (error) {
        console.error('Error loading personal stats:', error);
        // Set default values
        personalBestScore.textContent = 'Error';
        personalAvgScore.textContent = 'Error';
        personalGamesPlayed.textContent = 'Error';
        personalBestRank.textContent = 'Error';
    }
}

// Load leaderboard data
async function loadLeaderboardData() {
    try {
        // Get the appropriate elements based on the current tab
        const tableBody = getTableBodyForTab(currentTab);
        const noResultsDiv = getNoResultsDivForTab(currentTab);

        // Show loading state
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="sr-only">Loading...</span>
                    </div>
                    <p class="mt-2">Loading leaderboard data...</p>
                </td>
            </tr>
        `;

        // Set a timeout to prevent infinite loading
        const loadingTimeout = setTimeout(() => {
            if (tableBody.innerHTML.includes('Loading leaderboard data')) {
                console.warn('Leaderboard data loading timeout - using fallback data');
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center py-4">
                            <div class="alert alert-warning">
                                <i class="fas fa-exclamation-triangle mr-2"></i>
                                Unable to load leaderboard data. Using cached or sample data.
                                <button class="btn btn-sm btn-outline-primary ml-3" onclick="location.reload()">Refresh</button>
                            </div>
                        </td>
                    </tr>
                `;

                // Try to use LocalStorageScores
                if (typeof window.LocalStorageScores !== 'undefined') {
                    try {
                        console.log('Using LocalStorageScores for leaderboard');
                        let scores = [];

                        if (currentTab === 'single') {
                            scores = window.LocalStorageScores.getTopScores('single', pageSize);
                        } else if (currentTab === 'class') {
                            scores = window.LocalStorageScores.getTopScores('class', pageSize);
                        } else {
                            // For overall tab, get both and combine
                            const singleScores = window.LocalStorageScores.getTopScores('single', pageSize);
                            const classScores = window.LocalStorageScores.getTopScores('class', pageSize);
                            scores = [...singleScores, ...classScores];
                            scores.sort((a, b) => b.finalPortfolio - a.finalPortfolio);
                            scores = scores.slice(0, pageSize);
                        }

                        updateLeaderboardTable(scores, tableBody);
                        totalPages[currentTab] = 1; // For now, just one page
                        updatePagination();
                        showNotification('Leaderboard loaded from local storage', 'success', 3000);
                    } catch (localError) {
                        console.error('Error using LocalStorageScores:', localError);
                        // Fall back to sample data
                        const sampleData = generateSampleLeaderboardData(10);
                        updateLeaderboardTable(sampleData, tableBody);
                        totalPages[currentTab] = 1;
                        updatePagination();
                        showNotification('Using sample leaderboard data', 'info', 3000);
                    }
                } else {
                    // Try to use cached data
                    const cachedData = localStorage.getItem(`leaderboard-cache-${currentTab}`);
                    if (cachedData) {
                        try {
                            const parsedData = JSON.parse(cachedData);
                            updateLeaderboardTable(parsedData.scores, tableBody);
                            totalPages[currentTab] = parsedData.totalPages;
                            updatePagination();
                            showNotification('Using cached leaderboard data', 'info', 3000);
                        } catch (cacheError) {
                            console.error('Error parsing cached leaderboard data:', cacheError);
                            // Will fall back to sample data below
                            const sampleData = generateSampleLeaderboardData(10);
                            updateLeaderboardTable(sampleData, tableBody);
                            totalPages[currentTab] = 1;
                            updatePagination();
                            showNotification('Using sample leaderboard data', 'info', 3000);
                        }
                    } else {
                        // Use sample data
                        const sampleData = generateSampleLeaderboardData(10);
                        updateLeaderboardTable(sampleData, tableBody);
                        totalPages[currentTab] = 1;
                        updatePagination();
                        showNotification('Using sample leaderboard data', 'info', 3000);
                    }
                }
            }
        }, 8000); // 8 seconds timeout

        // Get filters
        const timeFrame = currentFilters.timeFrame;
        const section = currentFilters.section;
        const view = currentFilters.view;

        // Get student ID if viewing personal scores
        const studentId = view === 'me' ? localStorage.getItem('student_id') : null;

        // Calculate date range for time filter
        let startDate = null;
        if (timeFrame === 'today') {
            startDate = new Date();
            startDate.setHours(0, 0, 0, 0);
        } else if (timeFrame === 'week') {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
        } else if (timeFrame === 'month') {
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
        }

        // Determine game mode based on current tab
        let gameMode;
        if (currentTab === 'single') {
            gameMode = 'single';
        } else if (currentTab === 'class') {
            gameMode = 'class';
        } else {
            gameMode = null; // null means all game modes
        }

        try {
            // Prepare options for leaderboard query
            const options = {
                startDate: startDate,
                taName: section !== 'all' ? section : null,
                studentId: studentId,
                page: currentPages[currentTab],
                pageSize: pageSize,
                gameMode: gameMode
            };

            // Add class game filter if applicable
            if (currentTab === 'class' && currentFilters.classGame !== 'all') {
                options.gameId = currentFilters.classGame;
            }

            console.log('Fetching leaderboard with options:', options);

            // Get leaderboard data from Firebase
            const result = await Service.getGameLeaderboard('investment-odyssey', options);

            if (result.success) {
                const { scores, totalScores } = result.data;

                // Calculate total pages
                totalPages[currentTab] = Math.ceil(totalScores / pageSize);

                // Update UI
                updateLeaderboardTable(scores, tableBody);
                updatePagination();

                // Update personal best rank if logged in
                if (localStorage.getItem('student_id') && scores.length > 0) {
                    updatePersonalBestRank();
                }

                // Show no results message if needed
                if (scores.length === 0) {
                    noResultsDiv.classList.remove('d-none');
                } else {
                    noResultsDiv.classList.add('d-none');
                }

                // Cache the data for future use
                localStorage.setItem(`leaderboard-cache-${currentTab}`, JSON.stringify({
                    scores: scores,
                    totalPages: totalPages[currentTab],
                    timestamp: Date.now()
                }));
            } else {
                throw new Error('Failed to load leaderboard data from Firebase');
            }
            // Clear the timeout if data loaded successfully
            clearTimeout(loadingTimeout);
        } catch (error) {
            console.error('Error loading leaderboard from Firebase:', error);

            // Show error message
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4">
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-circle mr-2"></i>
                            Error loading leaderboard data: ${error.message}
                            <button class="btn btn-sm btn-outline-primary ml-3" onclick="location.reload()">Try Again</button>
                        </div>
                    </td>
                </tr>
            `;

            // Fallback: Try to load from localStorage
            try {
                const localLeaderboard = JSON.parse(localStorage.getItem('investment-odyssey-leaderboard') || '[]');

                // Filter based on current tab
                let filteredScores = localLeaderboard;

                // Apply filters
                if (timeFrame === 'today') {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    filteredScores = filteredScores.filter(score => new Date(score.timestamp) >= today);
                } else if (timeFrame === 'week') {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    filteredScores = filteredScores.filter(score => new Date(score.timestamp) >= weekAgo);
                } else if (timeFrame === 'month') {
                    const monthAgo = new Date();
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    filteredScores = filteredScores.filter(score => new Date(score.timestamp) >= monthAgo);
                }

                // Filter by student ID if viewing personal scores
                if (studentId) {
                    filteredScores = filteredScores.filter(score => score.studentId === studentId);
                }

                // Calculate total pages
                totalPages[currentTab] = Math.ceil(filteredScores.length / pageSize);

                // Apply pagination
                const startIndex = (currentPages[currentTab] - 1) * pageSize;
                const endIndex = Math.min(startIndex + pageSize, filteredScores.length);
                const paginatedScores = filteredScores.slice(startIndex, endIndex);

                // Format scores to match Firebase format
                const formattedScores = paginatedScores.map((score, index) => ({
                    studentId: score.studentId || 'guest',
                    studentName: score.studentName || 'Guest Player',
                    finalPortfolio: score.finalPortfolio || 0,
                    taName: score.taName || 'N/A',
                    timestamp: score.timestamp || new Date().toISOString()
                }));

                console.log('Using local leaderboard data:', formattedScores);

                // Update UI
                updateLeaderboardTable(formattedScores, tableBody);
                updatePagination();

                // Show no results message if needed
                if (formattedScores.length === 0) {
                    noResultsDiv.classList.remove('d-none');
                } else {
                    noResultsDiv.classList.add('d-none');
                }

                // Show warning that we're using local data
                showNotification('Using locally stored leaderboard data. Firebase connection failed.', 'warning', 5000);

            } catch (localError) {
                console.error('Error loading local leaderboard:', localError);
                showErrorMessage('Failed to load leaderboard data from both Firebase and local storage.');
            }
        }
    } catch (error) {
        console.error('Error loading leaderboard data:', error);
        showErrorMessage('An error occurred while loading the leaderboard.');
    }
}

// Helper functions to get the appropriate elements based on the current tab
function getTableBodyForTab(tab) {
    switch (tab) {
        case 'single': return singleLeaderboardBody;
        case 'class': return classLeaderboardBody;
        case 'overall': return overallLeaderboardBody;
        default: return singleLeaderboardBody;
    }
}

function getNoResultsDivForTab(tab) {
    switch (tab) {
        case 'single': return singleNoResultsDiv;
        case 'class': return classNoResultsDiv;
        case 'overall': return overallNoResultsDiv;
        default: return singleNoResultsDiv;
    }
}

function getPaginationDivForTab(tab) {
    switch (tab) {
        case 'single': return singlePaginationDiv;
        case 'class': return classPaginationDiv;
        case 'overall': return overallPaginationDiv;
        default: return singlePaginationDiv;
    }
}

// Update the leaderboard table with data
function updateLeaderboardTable(scores, tableBody = singleLeaderboardBody) {
    // Clear the table
    tableBody.innerHTML = '';

    // Calculate starting rank for current page
    const startRank = (currentPages[currentTab] - 1) * pageSize + 1;

    // Add each score to the table
    scores.forEach((score, index) => {
        const rank = startRank + index;
        const row = document.createElement('tr');

        // Highlight the current user's row
        const isCurrentUser = score.studentId === localStorage.getItem('student_id');
        if (isCurrentUser) {
            row.classList.add('table-primary');
        }

        // Create rank cell with badge for top 3
        let rankCell = '';
        if (rank <= 3) {
            rankCell = `
                <td>
                    <div class="rank-badge rank-${rank}">
                        ${rank}
                    </div>
                </td>
            `;
        } else {
            rankCell = `<td>${rank}</td>`;
        }

        // Format the date
        const date = new Date(score.timestamp);
        const formattedDate = date.toLocaleDateString();

        // Create the row HTML
        row.innerHTML = `
            ${rankCell}
            <td>${score.studentName}${isCurrentUser ? ' <span class="badge badge-info">You</span>' : ''}</td>
            <td>${score.taName || 'N/A'}</td>
            <td>${formatCurrency(score.finalPortfolio)}</td>
            <td>${formattedDate}</td>
        `;

        tableBody.appendChild(row);
    });
}

// Update pagination controls
function updatePagination() {
    // Get the pagination div for the current tab
    const paginationDiv = getPaginationDivForTab(currentTab);

    // Clear pagination
    paginationDiv.innerHTML = '';

    // Don't show pagination if only one page
    if (totalPages[currentTab] <= 1) {
        return;
    }

    // Create pagination nav
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Leaderboard pagination');

    const ul = document.createElement('ul');
    ul.className = 'pagination';

    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPages[currentTab] === 1 ? 'disabled' : ''}`;

    const prevLink = document.createElement('a');
    prevLink.className = 'page-link';
    prevLink.href = '#';
    prevLink.textContent = 'Previous';
    prevLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPages[currentTab] > 1) {
            currentPages[currentTab]--;
            loadLeaderboardData();
        }
    });

    prevLi.appendChild(prevLink);
    ul.appendChild(prevLi);

    // Page numbers
    const maxPages = Math.min(totalPages[currentTab], 5);
    let startPage = Math.max(1, currentPages[currentTab] - 2);
    let endPage = Math.min(startPage + maxPages - 1, totalPages[currentTab]);

    // Adjust start page if needed
    if (endPage - startPage < maxPages - 1) {
        startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === currentPages[currentTab] ? 'active' : ''}`;

        const pageLink = document.createElement('a');
        pageLink.className = 'page-link';
        pageLink.href = '#';
        pageLink.textContent = i;
        pageLink.addEventListener('click', (e) => {
            e.preventDefault();
            currentPages[currentTab] = i;
            loadLeaderboardData();
        });

        pageLi.appendChild(pageLink);
        ul.appendChild(pageLi);
    }

    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPages[currentTab] === totalPages[currentTab] ? 'disabled' : ''}`;

    const nextLink = document.createElement('a');
    nextLink.className = 'page-link';
    nextLink.href = '#';
    nextLink.textContent = 'Next';
    nextLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPages[currentTab] < totalPages[currentTab]) {
            currentPages[currentTab]++;
            loadLeaderboardData();
        }
    });

    nextLi.appendChild(nextLink);
    ul.appendChild(nextLi);

    nav.appendChild(ul);
    paginationDiv.appendChild(nav);
}

// Update personal best rank
async function updatePersonalBestRank() {
    try {
        const studentId = localStorage.getItem('student_id');

        if (!studentId) return;

        // Get student's rank - specify single player mode
        const result = await Service.getStudentGameRank(studentId, 'investment-odyssey', 'single');

        if (result.success) {
            const rank = result.data;
            personalBestRank.textContent = `#${rank}`;
        }
    } catch (error) {
        console.error('Error getting student rank:', error);
    }
}

// Set up event listeners
function setupEventListeners() {
    // Apply filters button
    applyFiltersBtn.addEventListener('click', () => {
        // Update filters
        currentFilters.timeFrame = timeFilterSelect.value;
        currentFilters.section = sectionFilterSelect.value;
        currentFilters.view = viewFilterSelect.value;

        // Class game filter is handled separately by its own event listener

        // Reset to first page for all tabs
        currentPages.single = 1;
        currentPages.class = 1;
        currentPages.overall = 1;

        // Reload data
        loadLeaderboardData();
    });

    // Class game select
    classGameSelect.addEventListener('change', () => {
        // Update filter
        currentFilters.classGame = classGameSelect.value;

        // Update class game info
        updateClassGameInfo();

        // Reset to first page for class tab
        currentPages.class = 1;

        // Reload data if on class tab
        if (currentTab === 'class') {
            loadLeaderboardData();
        }
    });

    // Tab switching
    document.querySelectorAll('#leaderboardTabs a[data-toggle="tab"]').forEach(tab => {
        tab.addEventListener('shown.bs.tab', event => {
            // Get the new active tab ID
            const tabId = event.target.getAttribute('href').substring(1);

            // Update current tab
            currentTab = tabId;

            // Load data for the new tab
            loadLeaderboardData();
        });
    });
}

// Format currency
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(value);
}

// Show error message
function showErrorMessage(message, tableBody = null) {
    // If no table body is specified, use the current tab's table body
    if (!tableBody) {
        tableBody = getTableBodyForTab(currentTab);
    }

    tableBody.innerHTML = `
        <tr>
            <td colspan="5" class="text-center py-4">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle"></i> ${message}
                </div>
            </td>
        </tr>
    `;
}

// Show notification message
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

// Generate sample leaderboard data for fallback
function generateSampleLeaderboardData(count = 10) {
    const sampleData = [];
    const names = ['Alex Johnson', 'Taylor Smith', 'Jordan Lee', 'Casey Brown', 'Morgan Wilson', 'Riley Davis', 'Quinn Miller', 'Avery Thomas', 'Jamie Garcia', 'Drew Martinez'];
    const taNames = ['Demo TA', 'Sample TA', 'Test TA'];

    // Get current student ID if available
    const currentStudentId = localStorage.getItem('student_id');
    const currentStudentName = localStorage.getItem('student_name');

    // Generate sample entries
    for (let i = 0; i < count; i++) {
        // Random portfolio value between 9000 and 15000
        const portfolioValue = 10000 + Math.floor(Math.random() * 6000) - 1000;

        // Random date within the last 30 days
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 30));

        // Use current student for one of the entries if available
        let studentId, studentName;
        if (currentStudentId && currentStudentName && i === 2) { // Make the current student #3
            studentId = currentStudentId;
            studentName = currentStudentName;
        } else {
            studentId = `sample-${i}`;
            studentName = names[i % names.length];
        }

        sampleData.push({
            studentId: studentId,
            studentName: studentName,
            finalPortfolio: portfolioValue,
            taName: taNames[i % taNames.length],
            timestamp: date.toISOString()
        });
    }

    // Sort by portfolio value (highest first)
    sampleData.sort((a, b) => b.finalPortfolio - a.finalPortfolio);

    return sampleData;
}