// Class Leaderboard JavaScript for Investment Odyssey

document.addEventListener('DOMContentLoaded', async function() {
    // Get game ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('gameId');
    
    if (!gameId) {
        showError('No game ID provided. Please go back and try again.');
        return;
    }
    
    try {
        // Load game data
        await loadGameData(gameId);
    } catch (error) {
        console.error('Error loading game data:', error);
        showError('An error occurred while loading the game data. Please try again later.');
    }
});

// Load game data
async function loadGameData(gameId) {
    try {
        // Show loading state
        document.getElementById('section-info').textContent = 'Loading...';
        document.getElementById('game-date').textContent = 'Loading...';
        document.getElementById('participant-count').textContent = 'Loading...';
        
        // Get game data
        const { data: gameData, error: gameError } = await window.supabase
            .from('game_sessions')
            .select('*, sections(*)')
            .eq('id', gameId)
            .single();
            
        if (gameError) {
            throw new Error(gameError.message);
        }
        
        if (!gameData) {
            throw new Error('Game not found');
        }
        
        // Update game info
        const sectionInfo = gameData.sections ? 
            `${gameData.sections.fullDay} ${gameData.sections.time}` : 
            'Unknown Section';
        document.getElementById('section-info').textContent = sectionInfo;
        
        const gameDate = new Date(gameData.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        document.getElementById('game-date').textContent = gameDate;
        
        // Load participants
        await loadParticipants(gameId);
    } catch (error) {
        console.error('Error loading game data:', error);
        showError(`Error: ${error.message}`);
    }
}

// Load participants
async function loadParticipants(gameId) {
    try {
        // Get participants
        const { data: participants, error: participantsError } = await window.supabase
            .from('game_participants')
            .select('*')
            .eq('game_id', gameId)
            .order('total_value', { ascending: false });
            
        if (participantsError) {
            throw new Error(participantsError.message);
        }
        
        if (!participants || participants.length === 0) {
            document.getElementById('participant-count').textContent = '0';
            document.getElementById('no-results').classList.remove('d-none');
            document.getElementById('leaderboard-body').innerHTML = '';
            return;
        }
        
        // Update participant count
        document.getElementById('participant-count').textContent = participants.length;
        
        // Calculate class performance stats
        calculateClassPerformance(participants);
        
        // Display top performers
        displayTopPerformers(participants.slice(0, 3));
        
        // Display full leaderboard
        displayLeaderboard(participants);
        
        // Check if current user is in the leaderboard and highlight their row
        highlightCurrentUser(participants);
    } catch (error) {
        console.error('Error loading participants:', error);
        showError(`Error: ${error.message}`);
    }
}

// Calculate class performance
function calculateClassPerformance(participants) {
    // Calculate average portfolio value
    const totalValue = participants.reduce((sum, p) => sum + p.total_value, 0);
    const avgPortfolio = totalValue / participants.length;
    document.getElementById('avg-portfolio').textContent = `$${avgPortfolio.toFixed(2)}`;
    
    // Calculate average return (including cash injections)
    let totalReturn = 0;
    let highestPortfolio = 0;
    let highestReturn = 0;
    
    participants.forEach(participant => {
        // Calculate adjusted return
        const initialInvestment = 10000;
        const cashInjections = participant.total_cash_injected || 0;
        const totalInvestment = initialInvestment + cashInjections;
        const returnValue = participant.total_value - totalInvestment;
        const returnPercent = (returnValue / totalInvestment) * 100;
        
        totalReturn += returnPercent;
        
        // Track highest portfolio and return
        if (participant.total_value > highestPortfolio) {
            highestPortfolio = participant.total_value;
        }
        
        if (returnPercent > highestReturn) {
            highestReturn = returnPercent;
        }
    });
    
    const avgReturn = totalReturn / participants.length;
    document.getElementById('avg-return').textContent = `${avgReturn.toFixed(2)}%`;
    document.getElementById('highest-portfolio').textContent = `$${highestPortfolio.toFixed(2)}`;
    document.getElementById('highest-return').textContent = `${highestReturn.toFixed(2)}%`;
}

// Display top performers
function displayTopPerformers(topPerformers) {
    const topPerformersContainer = document.getElementById('top-performers');
    
    if (!topPerformers || topPerformers.length === 0) {
        topPerformersContainer.innerHTML = `
            <div class="alert alert-info">
                No participants found for this game.
            </div>
        `;
        return;
    }
    
    let html = '';
    
    topPerformers.forEach((participant, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
        
        // Calculate adjusted return
        const initialInvestment = 10000;
        const cashInjections = participant.total_cash_injected || 0;
        const totalInvestment = initialInvestment + cashInjections;
        const returnValue = participant.total_value - totalInvestment;
        const returnPercent = (returnValue / totalInvestment) * 100;
        
        const returnClass = returnPercent >= 0 ? 'return-positive' : 'return-negative';
        const returnSign = returnPercent >= 0 ? '+' : '';
        
        html += `
            <div class="card mb-2 ${index === 0 ? 'border-warning' : ''}">
                <div class="card-body">
                    <h5 class="card-title">${medal} ${participant.student_name}</h5>
                    <p class="card-text">
                        Final Value: <strong>$${participant.total_value.toFixed(2)}</strong><br>
                        Cash Injections: <strong>$${cashInjections.toFixed(2)}</strong><br>
                        Return: <span class="${returnClass}">
                            ${returnSign}${returnPercent.toFixed(2)}%
                        </span>
                    </p>
                </div>
            </div>
        `;
    });
    
    topPerformersContainer.innerHTML = html;
}

// Display full leaderboard
function displayLeaderboard(participants) {
    const leaderboardBody = document.getElementById('leaderboard-body');
    
    if (!participants || participants.length === 0) {
        leaderboardBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    No participants found for this game.
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    participants.forEach((participant, index) => {
        // Calculate adjusted return
        const initialInvestment = 10000;
        const cashInjections = participant.total_cash_injected || 0;
        const totalInvestment = initialInvestment + cashInjections;
        const returnValue = participant.total_value - totalInvestment;
        const returnPercent = (returnValue / totalInvestment) * 100;
        
        // Calculate unadjusted return (without considering cash injections)
        const unadjustedReturnValue = participant.total_value - initialInvestment;
        const unadjustedReturnPercent = (unadjustedReturnValue / initialInvestment) * 100;
        
        const returnClass = returnPercent >= 0 ? 'return-positive' : 'return-negative';
        const unadjustedReturnClass = unadjustedReturnPercent >= 0 ? 'return-positive' : 'return-negative';
        
        const returnSign = returnPercent >= 0 ? '+' : '';
        const unadjustedReturnSign = unadjustedReturnPercent >= 0 ? '+' : '';
        
        // Determine rank style
        let rankStyle = '';
        if (index === 0) {
            rankStyle = 'rank-1';
        } else if (index === 1) {
            rankStyle = 'rank-2';
        } else if (index === 2) {
            rankStyle = 'rank-3';
        }
        
        html += `
            <tr data-student-id="${participant.student_id}" class="participant-row">
                <td>
                    <span class="rank-badge ${rankStyle}">${index + 1}</span>
                </td>
                <td>${participant.student_name}</td>
                <td>$${participant.total_value.toFixed(2)}</td>
                <td class="${unadjustedReturnClass}">
                    ${unadjustedReturnSign}${unadjustedReturnPercent.toFixed(2)}%
                </td>
                <td>$${cashInjections.toFixed(2)}</td>
                <td class="${returnClass}">
                    ${returnSign}${returnPercent.toFixed(2)}%
                </td>
            </tr>
        `;
    });
    
    leaderboardBody.innerHTML = html;
}

// Highlight current user in the leaderboard
async function highlightCurrentUser(participants) {
    try {
        // Get current user
        const { data: { user } } = await window.supabase.auth.getUser();
        
        if (!user) {
            return;
        }
        
        // Find user's row and highlight it
        const userRow = document.querySelector(`tr[data-student-id="${user.id}"]`);
        if (userRow) {
            userRow.classList.add('player-row-highlight');
            userRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } catch (error) {
        console.error('Error highlighting current user:', error);
    }
}

// Show error message
function showError(message) {
    const container = document.querySelector('.container');
    
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
    container.insertBefore(alertDiv, container.firstChild);
}
