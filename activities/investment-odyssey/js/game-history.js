// Game History JavaScript for Investment Odyssey

// Global variables
let currentTA = null;
let taGames = [];

// DOM elements
const authCheck = document.getElementById('auth-check');
const gameHistoryContainer = document.getElementById('game-history-container');
const taNameDisplay = document.getElementById('ta-name-display');
const gamesList = document.getElementById('games-list');
const refreshGamesBtn = document.getElementById('refresh-games-btn');
const searchFilter = document.getElementById('search-filter');
const statusFilter = document.getElementById('status-filter');

// Initialize the game history page
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Check if user is logged in as a TA
        const isTA = Service.isTALoggedIn ? Service.isTALoggedIn() : (localStorage.getItem('is_ta') === 'true');
        const taName = localStorage.getItem('ta_name');

        if (!isTA || !taName) {
            // User is not logged in as a TA
            authCheck.classList.remove('d-none');
            gameHistoryContainer.classList.add('d-none');
            return;
        }

        // Set current TA
        currentTA = taName;
        taNameDisplay.textContent = currentTA;

        // Hide auth check, show game history
        authCheck.classList.add('d-none');
        gameHistoryContainer.classList.remove('d-none');

        // Load TA's games
        await loadTAGames();

        // Set up event listeners
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing game history:', error);
        showError('An error occurred while initializing the game history. Please try again later.');
    }
});

// Set up event listeners
function setupEventListeners() {
    // Refresh games button
    if (refreshGamesBtn) {
        refreshGamesBtn.addEventListener('click', loadTAGames);
    }

    // Search filter
    if (searchFilter) {
        searchFilter.addEventListener('input', displayGames);
    }

    // Status filter
    if (statusFilter) {
        statusFilter.addEventListener('change', displayGames);
    }
}

// Load TA's games
async function loadTAGames() {
    try {
        // Show loading state
        gamesList.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
                <p class="mt-3">Loading your games...</p>
            </div>
        `;

        // Get TA's user ID
        let taId = null;
        try {
            const { data: { user } } = await window.supabase.auth.getUser();
            if (user) {
                taId = user.id;
            }
        } catch (authError) {
            console.error('Error getting TA user ID:', authError);
        }

        if (!taId) {
            throw new Error('Could not determine TA user ID');
        }

        // Get sections for the current TA
        const { data: sections, error: sectionsError } = await window.supabase
            .from('sections')
            .select('*')
            .eq('ta_id', taId);

        if (sectionsError) {
            throw new Error(`Error loading sections: ${sectionsError.message}`);
        }

        if (!sections || sections.length === 0) {
            gamesList.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle mr-2"></i>
                        You don't have any sections assigned.
                    </div>
                </div>
            `;
            return;
        }

        // Get section IDs
        const sectionIds = sections.map(section => section.id);

        // Get games for these sections
        const { data: games, error: gamesError } = await window.supabase
            .from('game_sessions')
            .select(`
                *,
                sections:section_id (
                    id,
                    day,
                    time,
                    location
                )
            `)
            .in('section_id', sectionIds)
            .order('created_at', { ascending: false });

        if (gamesError) {
            throw new Error(`Error loading games: ${gamesError.message}`);
        }

        // Process games data
        taGames = games.map(game => {
            // Format section info
            const section = game.sections || {};
            const dayMap = {
                'M': 'Monday',
                'T': 'Tuesday',
                'W': 'Wednesday',
                'R': 'Thursday',
                'F': 'Friday'
            };
            const fullDay = dayMap[section.day] || section.day || 'Unknown';
            
            // Format date
            const createdDate = new Date(game.created_at);
            const formattedDate = createdDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            // Determine game status
            let status = 'unknown';
            if (game.active === true || game.status === 'active') {
                status = 'active';
            } else if (game.active === false || game.status === 'completed') {
                status = 'completed';
            }

            // Get current round
            const currentRound = game.current_round || 0;
            const maxRounds = game.max_rounds || 20;

            return {
                id: game.id,
                sectionId: game.section_id,
                sectionInfo: {
                    id: section.id,
                    day: section.day,
                    fullDay: fullDay,
                    time: section.time,
                    location: section.location
                },
                createdAt: game.created_at,
                formattedDate: formattedDate,
                status: status,
                currentRound: currentRound,
                maxRounds: maxRounds
            };
        });

        // Display games
        displayGames();
    } catch (error) {
        console.error('Error loading TA games:', error);
        gamesList.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle mr-2"></i>
                    Error loading games: ${error.message || 'Unknown error'}
                    <button id="retry-games-btn" class="btn btn-outline-danger btn-sm ml-3">Retry</button>
                </div>
            </div>
        `;

        // Add event listener to retry button
        const retryBtn = document.getElementById('retry-games-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', loadTAGames);
        }
    }
}

// Display games
function displayGames() {
    // Clear games list
    gamesList.innerHTML = '';

    // Apply filters
    const searchFilterValue = searchFilter ? searchFilter.value.toLowerCase() : '';
    const statusFilterValue = statusFilter ? statusFilter.value : 'all';

    const filteredGames = taGames.filter(game => {
        // Apply search filter
        if (searchFilterValue) {
            const sectionText = `${game.sectionInfo.fullDay} ${game.sectionInfo.time} ${game.sectionInfo.location} ${game.formattedDate}`.toLowerCase();
            if (!sectionText.includes(searchFilterValue)) {
                return false;
            }
        }

        // Apply status filter
        if (statusFilterValue !== 'all' && game.status !== statusFilterValue) {
            return false;
        }

        return true;
    });

    // Check if there are any games after filtering
    if (filteredGames.length === 0) {
        gamesList.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle mr-2"></i>
                    No games found with the current filters.
                </div>
            </div>
        `;
        return;
    }

    // Display each game
    filteredGames.forEach(game => {
        // Create game card
        const gameCard = document.createElement('div');
        gameCard.className = 'col-md-6 col-lg-4 mb-4';

        // Determine status class and text
        let statusClass = '';
        let statusText = 'Unknown Status';
        let statusBadgeClass = 'badge-secondary';

        if (game.status === 'active') {
            statusClass = 'active-game';
            statusText = `Active - Round ${game.currentRound}/${game.maxRounds}`;
            statusBadgeClass = 'badge-success';
        } else if (game.status === 'completed') {
            statusClass = 'completed-game';
            statusText = 'Completed';
            statusBadgeClass = 'badge-danger';
        }

        // Create card HTML
        gameCard.innerHTML = `
            <div class="card game-card ${statusClass}">
                <div class="card-body">
                    <h5 class="card-title">${game.sectionInfo.fullDay} ${game.sectionInfo.time}</h5>
                    <h6 class="card-subtitle mb-2 text-muted">${game.formattedDate}</h6>
                    <p class="card-text">Location: ${game.sectionInfo.location || 'N/A'}</p>
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <span class="badge ${statusBadgeClass} p-2">
                            ${statusText}
                        </span>
                        <div>
                            ${game.status === 'active' ? 
                                `<a href="ta-controls.html" class="btn btn-outline-primary btn-sm mr-2">
                                    <i class="fas fa-cogs mr-1"></i> Manage
                                </a>` : ''
                            }
                            <a href="class-leaderboard.html?gameId=${game.id}" class="btn btn-primary btn-sm">
                                <i class="fas fa-trophy mr-1"></i> Results
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add to games list
        gamesList.appendChild(gameCard);
    });
}

// Show error message
function showError(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show';
    alertDiv.innerHTML = `
        <i class="fas fa-exclamation-circle mr-2"></i>
        ${message}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    `;

    // Add to container
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);
}
