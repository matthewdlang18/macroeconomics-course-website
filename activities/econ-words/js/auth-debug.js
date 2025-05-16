/**
 * Auth Debug Helper for Econ Words Game
 * This provides debugging and fallback functionality for auth-related issues
 */

const AuthDebug = {
    // Log levels
    LOG_LEVEL: {
        NONE: 0,
        ERROR: 1,
        WARN: 2,
        INFO: 3,
        DEBUG: 4,
        VERBOSE: 5
    },
    
    // Current log level - change to adjust verbosity
    currentLevel: 4, // DEBUG by default
    
    // Track auth issues
    authIssueCount: 0,
    maxAuthIssues: 3,
    authIssueTimer: null,
    
    // Initialize
    init: function() {
        console.log('🔍 Auth Debug Helper initialized');
        this.patchSupabaseInit();
        this.setupAuthFallback();
        
        // Reset issue counter periodically
        this.authIssueTimer = setInterval(() => {
            if (this.authIssueCount > 0) {
                this.log('AUTH issue counter reset', this.LOG_LEVEL.INFO);
            }
            this.authIssueCount = 0;
        }, 60000); // Reset every minute
        
        return this;
    },
    
    // Enhanced logging
    log: function(message, level, data) {
        if (level <= this.currentLevel) {
            const prefix = this.getLogPrefix(level);
            if (data) {
                console.log(`${prefix} ${message}`, data);
            } else {
                console.log(`${prefix} ${message}`);
            }
        }
    },
    
    getLogPrefix: function(level) {
        switch(level) {
            case this.LOG_LEVEL.ERROR: return '❌';
            case this.LOG_LEVEL.WARN:  return '⚠️';
            case this.LOG_LEVEL.INFO:  return 'ℹ️';
            case this.LOG_LEVEL.DEBUG: return '🔍';
            case this.LOG_LEVEL.VERBOSE: return '🔎';
            default: return '📝';
        }
    },
    
    // Patch Supabase initialization with error handling
    patchSupabaseInit: function() {
        if (typeof window.SupabaseEconTerms !== 'undefined' && window.SupabaseEconTerms.init) {
            const originalInit = window.SupabaseEconTerms.init;
            
            window.SupabaseEconTerms.init = function() {
                try {
                    const result = originalInit.apply(this, arguments);
                    AuthDebug.log('SupabaseEconTerms.init called successfully', AuthDebug.LOG_LEVEL.INFO);
                    return result;
                } catch (error) {
                    AuthDebug.log('Error in SupabaseEconTerms.init', AuthDebug.LOG_LEVEL.ERROR, error);
                    AuthDebug.handleAuthFailure('init-error');
                    // Return this to maintain chaining
                    return window.SupabaseEconTerms;
                }
            };
            
            this.log('Patched SupabaseEconTerms.init', this.LOG_LEVEL.DEBUG);
        }
    },
    
    // Set up auth fallback mechanism
    setupAuthFallback: function() {
        // Intercept 403/401 errors
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            try {
                const response = await originalFetch.apply(this, args);
                
                // Check for auth errors (403/401)
                if (response.status === 403 || response.status === 401) {
                    const url = args[0];
                    AuthDebug.log(`Fetch auth error (${response.status}) for: ${url}`, AuthDebug.LOG_LEVEL.WARN);
                    AuthDebug.handleAuthFailure(`fetch-${response.status}`);
                }
                
                return response;
            } catch (error) {
                AuthDebug.log('Fetch error:', AuthDebug.LOG_LEVEL.ERROR, error);
                throw error;
            }
        };
        
        this.log('Set up fetch interception for auth errors', this.LOG_LEVEL.DEBUG);
    },
    
    // Handle authentication failures
    handleAuthFailure: function(source) {
        this.authIssueCount++;
        this.log(`Auth issue #${this.authIssueCount} from: ${source}`, this.LOG_LEVEL.WARN);
        
        if (this.authIssueCount >= this.maxAuthIssues) {
            this.log('Multiple auth issues detected, triggering fallback mode', this.LOG_LEVEL.ERROR);
            this.activateFallbackMode();
        }
    },
    
    // Activate offline/fallback mode
    activateFallbackMode: function() {
        if (window.localStorage.getItem('econ_words_fallback_mode') === 'true') {
            this.log('Fallback mode already active', this.LOG_LEVEL.INFO);
            return;
        }
        
        // Set fallback mode flag
        window.localStorage.setItem('econ_words_fallback_mode', 'true');
        
        this.log('🔄 Activating fallback mode', this.LOG_LEVEL.INFO);
        
        // Force use of local storage for all operations
        if (typeof window.SupabaseEconTerms !== 'undefined') {
            this.patchSupabaseOperations();
        }
        
        // Set a guest user
        if (!localStorage.getItem('student_id')) {
            const guestId = 'guest-' + Math.floor(Math.random() * 1000000);
            localStorage.setItem('student_id', guestId);
            localStorage.setItem('student_name', 'Guest Player');
            localStorage.setItem('is_guest', 'true');
            this.log('Created guest user: ' + guestId, this.LOG_LEVEL.INFO);
        }
        
        // Check/create default value for scores
        if (!localStorage.getItem('econ_terms_scores')) {
            localStorage.setItem('econ_terms_scores', '[]');
        }
        
        // Show fallback mode notification to user
        this.showFallbackNotification();
    },
    
    // Patch Supabase operations for offline mode
    patchSupabaseOperations: function() {
        const supabase = window.SupabaseEconTerms;
        
        // Override methods to use localStorage
        supabase.getUserStats = async function() {
            AuthDebug.log('Using fallback getUserStats', AuthDebug.LOG_LEVEL.DEBUG);
            return {
                streak: localStorage.getItem('econ_terms_streak') || 0,
                highScore: localStorage.getItem('econ_terms_high_score') || 0,
                gamesPlayed: localStorage.getItem('econ_terms_games_played') || 0
            };
        };
        
        supabase.getHighScores = async function() {
            AuthDebug.log('Using fallback getHighScores', AuthDebug.LOG_LEVEL.DEBUG);
            try {
                // Create a mock leaderboard entry with the user's high score
                const scores = [{
                    id: 'local-1',
                    name: localStorage.getItem('student_name') || 'You',
                    score: localStorage.getItem('econ_terms_high_score') || 0,
                    date: new Date().toLocaleDateString()
                }];
                
                // Add some mock entries
                scores.push({
                    id: 'local-2',
                    name: 'Player 1',
                    score: Math.floor(Math.random() * 100) + 50,
                    date: new Date().toLocaleDateString()
                });
                
                scores.push({
                    id: 'local-3',
                    name: 'Player 2',
                    score: Math.floor(Math.random() * 100) + 40,
                    date: new Date().toLocaleDateString()
                });
                
                return scores;
            } catch (e) {
                AuthDebug.log('Error in fallback getHighScores', AuthDebug.LOG_LEVEL.ERROR, e);
                return [{
                    id: 'local-error',
                    name: 'Offline Mode',
                    score: 0,
                    date: new Date().toLocaleDateString()
                }];
            }
        };
        
        supabase.saveScore = async function(score, gameData) {
            AuthDebug.log('Using fallback saveScore', AuthDebug.LOG_LEVEL.DEBUG);
            
            // Update high score if needed
            const currentHighScore = parseInt(localStorage.getItem('econ_terms_high_score') || '0');
            if (score > currentHighScore) {
                localStorage.setItem('econ_terms_high_score', score.toString());
            }
            
            // Handle streak
            let currentStreak = parseInt(localStorage.getItem('econ_terms_streak') || '0');
            if (gameData && gameData.won) {
                currentStreak++;
                localStorage.setItem('econ_terms_streak', currentStreak.toString());
            } else if (gameData && !gameData.won) {
                localStorage.setItem('econ_terms_streak', '0');
            }
            
            // Update games played
            const gamesPlayed = parseInt(localStorage.getItem('econ_terms_games_played') || '0');
            localStorage.setItem('econ_terms_games_played', (gamesPlayed + 1).toString());
            
            // Store score in local scores array
            try {
                let localScores = JSON.parse(localStorage.getItem('econ_terms_scores') || '[]');
                localScores.push({
                    score: score,
                    term: gameData && gameData.term ? gameData.term : 'unknown',
                    attempts: gameData && gameData.attempts ? gameData.attempts : 0,
                    won: gameData && gameData.won ? gameData.won : false,
                    date: new Date().toISOString()
                });
                
                // Keep only last 20 scores
                if (localScores.length > 20) {
                    localScores = localScores.slice(-20);
                }
                
                localStorage.setItem('econ_terms_scores', JSON.stringify(localScores));
            } catch (e) {
                AuthDebug.log('Error storing score locally', AuthDebug.LOG_LEVEL.ERROR, e);
            }
            
            return { success: true, local: true };
        };
        
        supabase.updateUserStats = async function(score, gameData) {
            AuthDebug.log('Using fallback updateUserStats', AuthDebug.LOG_LEVEL.DEBUG);
            
            // Similar to saveScore logic
            const currentHighScore = parseInt(localStorage.getItem('econ_terms_high_score') || '0');
            if (score > currentHighScore) {
                localStorage.setItem('econ_terms_high_score', score.toString());
            }
            
            let currentStreak = parseInt(localStorage.getItem('econ_terms_streak') || '0');
            if (gameData && gameData.won) {
                currentStreak++;
                localStorage.setItem('econ_terms_streak', currentStreak.toString());
            } else if (gameData && !gameData.won) {
                localStorage.setItem('econ_terms_streak', '0');
            }
            
            const gamesPlayed = parseInt(localStorage.getItem('econ_terms_games_played') || '0');
            localStorage.setItem('econ_terms_games_played', (gamesPlayed + 1).toString());
            
            return { success: true, local: true };
        };
        
        this.log('Patched Supabase operations to use localStorage', this.LOG_LEVEL.INFO);
    },
    
    // Show a notification to the user that we're in fallback mode
    showFallbackNotification: function() {
        // Only show once per session
        if (sessionStorage.getItem('fallback_notification_shown')) {
            return;
        }
        
        try {
            // Create notification element
            const notification = document.createElement('div');
            notification.className = 'econ-words-fallback-notification';
            notification.style.cssText = 'position: fixed; top: 10px; left: 50%; transform: translateX(-50%); ' +
                'background-color: #fff3cd; color: #856404; border: 1px solid #ffeeba; border-radius: 4px; ' +
                'padding: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 10000; max-width: 80%; ' +
                'text-align: center;';
            
            notification.innerHTML = `
                <div style="margin-bottom: 8px; font-weight: bold;">⚠️ Offline Mode Active</div>
                <div>The game is currently running in offline mode. Your progress will be saved locally.</div>
                <button style="margin-top: 10px; background-color: #856404; color: white; border: none; 
                    padding: 5px 10px; border-radius: 4px; cursor: pointer;">OK</button>
            `;
            
            // Add to document
            document.body.appendChild(notification);
            
            // Add click handler to dismiss
            const button = notification.querySelector('button');
            if (button) {
                button.addEventListener('click', function() {
                    notification.style.display = 'none';
                });
            }
            
            // Auto hide after 10 seconds
            setTimeout(() => {
                notification.style.display = 'none';
            }, 10000);
            
            // Mark as shown
            sessionStorage.setItem('fallback_notification_shown', 'true');
        } catch (e) {
            this.log('Error showing fallback notification', this.LOG_LEVEL.ERROR, e);
        }
    },
    
    // Clean up
    destroy: function() {
        if (this.authIssueTimer) {
            clearInterval(this.authIssueTimer);
            this.authIssueTimer = null;
        }
        
        this.log('Auth Debug Helper destroyed', this.LOG_LEVEL.INFO);
    }
};

// Auto-initialize
document.addEventListener('DOMContentLoaded', function() {
    AuthDebug.init();
});

// Make available globally
window.AuthDebug = AuthDebug;
