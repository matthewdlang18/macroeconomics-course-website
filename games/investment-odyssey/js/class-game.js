// Class Game JavaScript for Investment Odyssey

// Document ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    if (typeof $ !== 'undefined' && $.fn.tooltip) {
        $('[data-toggle="tooltip"]').tooltip();
    }
    
    // Check if we need to redirect to game.html
    checkRedirect();
});

// Check if we should redirect to game.html
function checkRedirect() {
    // If user is logged in and has joined a session, redirect to game.html
    if (EconGames.SimpleAuth.isLoggedIn()) {
        const session = EconGames.SimpleAuth.getSession();
        
        // If user has a game session, redirect to game.html
        if (session.gameSession) {
            // Check if we're coming from game.html (to avoid redirect loop)
            const referrer = document.referrer;
            if (!referrer.includes('game.html')) {
                window.location.href = 'game.html';
            }
        }
    }
}

// Class Game Service
const ClassGameService = {
    // Get active sessions
    getActiveSessions: async function() {
        try {
            return await EconGames.DataService.getActiveSessions('investment-odyssey');
        } catch (error) {
            console.error('Error getting active sessions:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Join session
    joinSession: async function(joinCode) {
        try {
            if (!EconGames.SimpleAuth.isLoggedIn()) {
                return { success: false, error: 'You must be logged in to join a session' };
            }
            
            const userId = EconGames.SimpleAuth.getSession().userId;
            return await EconGames.AuthService.joinSession(userId, joinCode);
        } catch (error) {
            console.error('Error joining session:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Get current session
    getCurrentSession: async function() {
        try {
            if (!EconGames.SimpleAuth.isLoggedIn()) {
                return { success: false, error: 'You must be logged in to get session data' };
            }
            
            const session = EconGames.SimpleAuth.getSession();
            
            if (!session.gameSession) {
                return { success: false, error: 'No active game session' };
            }
            
            return await EconGames.InvestmentGame.getSession(session.gameSession.id);
        } catch (error) {
            console.error('Error getting current session:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Get participant data
    getParticipantData: async function() {
        try {
            if (!EconGames.SimpleAuth.isLoggedIn()) {
                return { success: false, error: 'You must be logged in to get participant data' };
            }
            
            const session = EconGames.SimpleAuth.getSession();
            
            if (!session.gameSession) {
                return { success: false, error: 'No active game session' };
            }
            
            return await EconGames.InvestmentGame.getParticipant(session.gameSession.id);
        } catch (error) {
            console.error('Error getting participant data:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Execute buy order
    executeBuy: async function(asset, quantity) {
        try {
            if (!EconGames.SimpleAuth.isLoggedIn()) {
                return { success: false, error: 'You must be logged in to execute trades' };
            }
            
            const session = EconGames.SimpleAuth.getSession();
            
            if (!session.gameSession) {
                return { success: false, error: 'No active game session' };
            }
            
            return await EconGames.InvestmentGame.executeBuy(session.gameSession.id, asset, quantity);
        } catch (error) {
            console.error('Error executing buy order:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Execute sell order
    executeSell: async function(asset, quantity) {
        try {
            if (!EconGames.SimpleAuth.isLoggedIn()) {
                return { success: false, error: 'You must be logged in to execute trades' };
            }
            
            const session = EconGames.SimpleAuth.getSession();
            
            if (!session.gameSession) {
                return { success: false, error: 'No active game session' };
            }
            
            return await EconGames.InvestmentGame.executeSell(session.gameSession.id, asset, quantity);
        } catch (error) {
            console.error('Error executing sell order:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Get leaderboard
    getLeaderboard: async function() {
        try {
            if (!EconGames.SimpleAuth.isLoggedIn()) {
                return { success: false, error: 'You must be logged in to view the leaderboard' };
            }
            
            const session = EconGames.SimpleAuth.getSession();
            
            if (!session.gameSession) {
                return { success: false, error: 'No active game session' };
            }
            
            return await EconGames.InvestmentGame.getLeaderboard(session.gameSession.id);
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            return { success: false, error: error.message };
        }
    }
};
