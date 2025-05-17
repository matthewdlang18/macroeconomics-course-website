/**
 * Enhanced Local Storage for Econ Words Game
 * Uses IndexedDB as primary with localStorage fallback
 */

const EnhancedStorage = {
    DB_NAME: 'econ_words_db',
    DB_VERSION: 1,
    STORES: {
        scores: 'scores',
        stats: 'stats',
        settings: 'settings'
    },
    db: null,
    
    // Initialize the database
    init: async function() {
        // If indexedDB is not supported, we'll fall back to localStorage
        if (!window.indexedDB) {
            console.log('IndexedDB not supported, using localStorage fallback');
            return;
        }
        
        return new Promise((resolve, reject) => {
            const request = window.indexedDB.open(this.DB_NAME, this.DB_VERSION);
            
            request.onerror = (event) => {
                console.error('Error opening IndexedDB:', event.target.error);
                resolve(false); // Resolve with false to indicate failure
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('IndexedDB initialized successfully');
                resolve(true);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores
                if (!db.objectStoreNames.contains(this.STORES.scores)) {
                    db.createObjectStore(this.STORES.scores, { keyPath: 'id', autoIncrement: true });
                }
                
                if (!db.objectStoreNames.contains(this.STORES.stats)) {
                    db.createObjectStore(this.STORES.stats, { keyPath: 'key' });
                }
                
                if (!db.objectStoreNames.contains(this.STORES.settings)) {
                    db.createObjectStore(this.STORES.settings, { keyPath: 'key' });
                }
            };
        });
    },
    
    // Get a value from storage (IndexedDB first, then localStorage fallback)
    get: async function(store, key) {
        // Try IndexedDB first
        if (this.db) {
            try {
                return new Promise((resolve) => {
                    const transaction = this.db.transaction([store], 'readonly');
                    const objectStore = transaction.objectStore(store);
                    const request = objectStore.get(key);
                    
                    request.onsuccess = (event) => {
                        if (event.target.result) {
                            resolve(event.target.result.value);
                        } else {
                            // Try localStorage fallback
                            resolve(localStorage.getItem(`econ_terms_${key}`));
                        }
                    };
                    
                    request.onerror = () => {
                        // Try localStorage fallback
                        resolve(localStorage.getItem(`econ_terms_${key}`));
                    };
                });
            } catch (e) {
                console.warn('Error reading from IndexedDB:', e);
            }
        }
        
        // Fallback to localStorage
        return localStorage.getItem(`econ_terms_${key}`);
    },
    
    // Set a value in storage (both IndexedDB and localStorage)
    set: async function(store, key, value) {
        // Always update localStorage as fallback
        localStorage.setItem(`econ_terms_${key}`, value);
        
        // Try to update IndexedDB
        if (this.db) {
            try {
                return new Promise((resolve) => {
                    const transaction = this.db.transaction([store], 'readwrite');
                    const objectStore = transaction.objectStore(store);
                    
                    // Check if item exists
                    const getRequest = objectStore.get(key);
                    
                    getRequest.onsuccess = (event) => {
                        const data = event.target.result;
                        let request;
                        
                        if (data) {
                            // Update existing item
                            data.value = value;
                            request = objectStore.put(data);
                        } else {
                            // Add new item
                            request = objectStore.add({ key, value });
                        }
                        
                        request.onsuccess = () => resolve(true);
                        request.onerror = () => resolve(false);
                    };
                    
                    getRequest.onerror = () => resolve(false);
                });
            } catch (e) {
                console.warn('Error writing to IndexedDB:', e);
                return false;
            }
        }
        
        return true;
    },
    
    // Store a score in the scores store
    storeScore: async function(scoreData) {
        // Add timestamp if not present
        if (!scoreData.date) {
            scoreData.date = new Date().toISOString();
        }
        
        // Store in IndexedDB if available
        if (this.db) {
            try {
                return new Promise((resolve) => {
                    const transaction = this.db.transaction([this.STORES.scores], 'readwrite');
                    const objectStore = transaction.objectStore(this.STORES.scores);
                    const request = objectStore.add(scoreData);
                    
                    request.onsuccess = () => resolve(true);
                    request.onerror = () => resolve(false);
                });
            } catch (e) {
                console.warn('Error storing score in IndexedDB:', e);
            }
        }
        
        // Fallback to localStorage
        try {
            let scores = JSON.parse(localStorage.getItem('econ_terms_scores') || '[]');
            scores.push(scoreData);
            
            // Limit to 50 scores to prevent storage issues
            if (scores.length > 50) {
                scores = scores.slice(-50);
            }
            
            localStorage.setItem('econ_terms_scores', JSON.stringify(scores));
            return true;
        } catch (e) {
            console.error('Error storing score in localStorage:', e);
            return false;
        }
    },
    
    // Get the most recent scores
    getScores: async function(limit = 10) {
        // Try IndexedDB first
        if (this.db) {
            try {
                return new Promise((resolve) => {
                    const transaction = this.db.transaction([this.STORES.scores], 'readonly');
                    const objectStore = transaction.objectStore(this.STORES.scores);
                    const request = objectStore.getAll();
                    
                    request.onsuccess = (event) => {
                        if (event.target.result && event.target.result.length > 0) {
                            // Sort by date desc
                            const scores = event.target.result.sort((a, b) => {
                                return new Date(b.date) - new Date(a.date);
                            });
                            
                            resolve(scores.slice(0, limit));
                        } else {
                            // Try localStorage fallback
                            const localScores = JSON.parse(localStorage.getItem('econ_terms_scores') || '[]');
                            resolve(localScores.slice(0, limit));
                        }
                    };
                    
                    request.onerror = () => {
                        // Try localStorage fallback
                        const localScores = JSON.parse(localStorage.getItem('econ_terms_scores') || '[]');
                        resolve(localScores.slice(0, limit));
                    };
                });
            } catch (e) {
                console.warn('Error reading scores from IndexedDB:', e);
            }
        }
        
        // Fallback to localStorage
        try {
            const scores = JSON.parse(localStorage.getItem('econ_terms_scores') || '[]');
            return scores.slice(0, limit);
        } catch (e) {
            console.error('Error reading scores from localStorage:', e);
            return [];
        }
    },
    
    // Update user stats - high score, streak, games played
    updateStats: async function(stats) {
        // Always update localStorage as fallback
        if (stats.highScore !== undefined) {
            localStorage.setItem('econ_terms_high_score', stats.highScore.toString());
        }
        
        if (stats.streak !== undefined) {
            localStorage.setItem('econ_terms_streak', stats.streak.toString());
        }
        
        if (stats.gamesPlayed !== undefined) {
            localStorage.setItem('econ_terms_games_played', stats.gamesPlayed.toString());
        }
        
        // Try to update IndexedDB
        if (this.db) {
            try {
                const transaction = this.db.transaction([this.STORES.stats], 'readwrite');
                const objectStore = transaction.objectStore(this.STORES.stats);
                
                // Update each stat individually
                if (stats.highScore !== undefined) {
                    this.updateSingleStat(objectStore, 'high_score', stats.highScore);
                }
                
                if (stats.streak !== undefined) {
                    this.updateSingleStat(objectStore, 'streak', stats.streak);
                }
                
                if (stats.gamesPlayed !== undefined) {
                    this.updateSingleStat(objectStore, 'games_played', stats.gamesPlayed);
                }
                
                return true;
            } catch (e) {
                console.warn('Error updating stats in IndexedDB:', e);
            }
        }
        
        return true;
    },
    
    // Helper to update a single stat
    updateSingleStat: function(objectStore, key, value) {
        // Check if stat exists
        const getRequest = objectStore.get(key);
        
        getRequest.onsuccess = (event) => {
            const data = event.target.result;
            
            if (data) {
                // Update existing stat
                data.value = value;
                objectStore.put(data);
            } else {
                // Add new stat
                objectStore.add({ key, value });
            }
        };
    },
    
    // Get user stats
    getStats: async function() {
        // Try IndexedDB first
        if (this.db) {
            try {
                return new Promise((resolve) => {
                    const transaction = this.db.transaction([this.STORES.stats], 'readonly');
                    const objectStore = transaction.objectStore(this.STORES.stats);
                    
                    const stats = {};
                    
                    // Get high score
                    const highScoreRequest = objectStore.get('high_score');
                    highScoreRequest.onsuccess = (event) => {
                        if (event.target.result) {
                            stats.highScore = event.target.result.value;
                        } else {
                            stats.highScore = localStorage.getItem('econ_terms_high_score') || 0;
                        }
                        
                        // Get streak
                        const streakRequest = objectStore.get('streak');
                        streakRequest.onsuccess = (event) => {
                            if (event.target.result) {
                                stats.streak = event.target.result.value;
                            } else {
                                stats.streak = localStorage.getItem('econ_terms_streak') || 0;
                            }
                            
                            // Get games played
                            const gamesPlayedRequest = objectStore.get('games_played');
                            gamesPlayedRequest.onsuccess = (event) => {
                                if (event.target.result) {
                                    stats.gamesPlayed = event.target.result.value;
                                } else {
                                    stats.gamesPlayed = localStorage.getItem('econ_terms_games_played') || 0;
                                }
                                
                                resolve(stats);
                            };
                        };
                    };
                });
            } catch (e) {
                console.warn('Error reading stats from IndexedDB:', e);
            }
        }
        
        // Fallback to localStorage
        return {
            highScore: localStorage.getItem('econ_terms_high_score') || 0,
            streak: localStorage.getItem('econ_terms_streak') || 0,
            gamesPlayed: localStorage.getItem('econ_terms_games_played') || 0
        };
    },
    
    // Clear all data
    clear: async function() {
        // Clear relevant localStorage items
        localStorage.removeItem('econ_terms_high_score');
        localStorage.removeItem('econ_terms_streak');
        localStorage.removeItem('econ_terms_games_played');
        localStorage.removeItem('econ_terms_scores');
        
        // Clear IndexedDB if available
        if (this.db) {
            try {
                const transaction = this.db.transaction([this.STORES.scores, this.STORES.stats], 'readwrite');
                transaction.objectStore(this.STORES.scores).clear();
                transaction.objectStore(this.STORES.stats).clear();
                return true;
            } catch (e) {
                console.error('Error clearing IndexedDB:', e);
                return false;
            }
        }
        
        return true;
    }
};

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', function() {
    EnhancedStorage.init().then((success) => {
        if (success) {
            console.log('Enhanced Storage initialized successfully');
        } else {
            console.warn('Enhanced Storage initialization failed, using localStorage only');
        }
    });
});

// Make available globally
window.EnhancedStorage = EnhancedStorage;
