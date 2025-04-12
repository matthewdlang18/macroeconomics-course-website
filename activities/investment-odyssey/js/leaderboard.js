// Leaderboard JavaScript for Investment Odyssey

// Global variables
let currentPage = 1;
const pageSize = 10;
let totalPages = 1;
let currentFilters = {
    timeFrame: 'all',
    section: 'all',
    view: 'all'
};

// DOM elements
const leaderboardTableBody = document.getElementById('leaderboard-table-body');
const personalStatsDiv = document.getElementById('personal-stats');
const noResultsDiv = document.getElementById('no-results');
const paginationDiv = document.getElementById('pagination');
const timeFilterSelect = document.getElementById('time-filter');
const sectionFilterSelect = document.getElementById('section-filter');
const viewFilterSelect = document.getElementById('view-filter');
const applyFiltersBtn = document.getElementById('apply-filters');

// Personal stats elements
const personalBestScore = document.getElementById('personal-best-score');
const personalAvgScore = document.getElementById('personal-avg-score');
const personalGamesPlayed = document.getElementById('personal-games-played');
const personalBestRank = document.getElementById('personal-best-rank');

// Initialize the leaderboard
document.addEventListener('DOMContentLoaded', async function() {
    try {
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

        // Load initial leaderboard data
        await loadLeaderboardData();

        // Set up event listeners
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing leaderboard:', error);
        showErrorMessage('Failed to load leaderboard data. Please try again later.');
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

// Load personal stats
async function loadPersonalStats(studentId) {
    try {
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
    } catch (error) {
        console.error('Error loading personal stats:', error);
    }
}

// Load leaderboard data
async function loadLeaderboardData() {
    try {
        // Show loading state
        leaderboardTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="sr-only">Loading...</span>
                    </div>
                    <p class="mt-2">Loading leaderboard data...</p>
                </td>
            </tr>
        `;

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

        // Get leaderboard data from Firebase - specify single player mode
        const result = await Service.getGameLeaderboard('investment-odyssey', {
            startDate: startDate,
            taName: section !== 'all' ? section : null,
            studentId: studentId,
            page: currentPage,
            pageSize: pageSize,
            gameMode: 'single' // Only show single player scores
        });

        if (result.success) {
            const { scores, totalScores } = result.data;

            // Calculate total pages
            totalPages = Math.ceil(totalScores / pageSize);

            // Update UI
            updateLeaderboardTable(scores);
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
        } else {
            showErrorMessage('Failed to load leaderboard data.');
        }
    } catch (error) {
        console.error('Error loading leaderboard data:', error);
        showErrorMessage('An error occurred while loading the leaderboard.');
    }
}

// Update the leaderboard table with data
function updateLeaderboardTable(scores) {
    // Clear the table
    leaderboardTableBody.innerHTML = '';

    // Calculate starting rank for current page
    const startRank = (currentPage - 1) * pageSize + 1;

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

        leaderboardTableBody.appendChild(row);
    });
}

// Update pagination controls
function updatePagination() {
    // Clear pagination
    paginationDiv.innerHTML = '';

    // Don't show pagination if only one page
    if (totalPages <= 1) {
        return;
    }

    // Create pagination nav
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Leaderboard pagination');

    const ul = document.createElement('ul');
    ul.className = 'pagination';

    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;

    const prevLink = document.createElement('a');
    prevLink.className = 'page-link';
    prevLink.href = '#';
    prevLink.textContent = 'Previous';
    prevLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            loadLeaderboardData();
        }
    });

    prevLi.appendChild(prevLink);
    ul.appendChild(prevLi);

    // Page numbers
    const maxPages = Math.min(totalPages, 5);
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(startPage + maxPages - 1, totalPages);

    // Adjust start page if needed
    if (endPage - startPage < maxPages - 1) {
        startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;

        const pageLink = document.createElement('a');
        pageLink.className = 'page-link';
        pageLink.href = '#';
        pageLink.textContent = i;
        pageLink.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = i;
            loadLeaderboardData();
        });

        pageLi.appendChild(pageLink);
        ul.appendChild(pageLi);
    }

    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;

    const nextLink = document.createElement('a');
    nextLink.className = 'page-link';
    nextLink.href = '#';
    nextLink.textContent = 'Next';
    nextLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage < totalPages) {
            currentPage++;
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

        // Reset to first page
        currentPage = 1;

        // Reload data
        loadLeaderboardData();
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
function showErrorMessage(message) {
    leaderboardTableBody.innerHTML = `
        <tr>
            <td colspan="5" class="text-center py-4">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle"></i> ${message}
                </div>
            </td>
        </tr>
    `;
}
