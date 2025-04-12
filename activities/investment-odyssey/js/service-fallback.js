// Service Fallback for Investment Odyssey Leaderboard
// This file provides a fallback Service object when Firebase is not available

// Check if Service is already defined
if (typeof window.Service === 'undefined') {
    console.warn('Service object not found. Creating fallback Service object for leaderboard.');
    
    // Create a fallback Service object with all the methods used in leaderboard.js
    window.Service = {
        // Leaderboard methods
        getGameLeaderboard: async function(gameName, options) {
            console.log('Fallback Service.getGameLeaderboard called with:', gameName, options);
            
            // Return sample data for display
            return { 
                success: true, 
                data: {
                    scores: [
                        {
                            studentId: 'sample1',
                            studentName: 'Sample Player 1',
                            finalPortfolio: 12500,
                            taName: 'Demo TA',
                            timestamp: new Date().toISOString()
                        },
                        {
                            studentId: 'sample2',
                            studentName: 'Sample Player 2',
                            finalPortfolio: 11800,
                            taName: 'Demo TA',
                            timestamp: new Date().toISOString()
                        },
                        {
                            studentId: 'sample3',
                            studentName: 'Sample Player 3',
                            finalPortfolio: 10900,
                            taName: 'Demo TA',
                            timestamp: new Date().toISOString()
                        }
                    ],
                    totalScores: 3
                }
            };
        },
        
        getAllSections: async function() {
            console.log('Fallback Service.getAllSections called');
            return { 
                success: true, 
                data: [
                    { id: 'section1', ta: 'Demo TA', day: 'Monday', time: '10:00 AM' }
                ]
            };
        },
        
        getAllTAs: async function() {
            console.log('Fallback Service.getAllTAs called');
            return { 
                success: true, 
                data: [
                    { name: 'Demo TA', email: 'demo@example.com' }
                ]
            };
        },
        
        getActiveClassGamesByTA: async function(taName) {
            console.log('Fallback Service.getActiveClassGamesByTA called for:', taName);
            return { 
                success: true, 
                data: [
                    { 
                        id: 'game1', 
                        taName: 'Demo TA', 
                        sectionId: 'section1',
                        playerCount: 3,
                        createdAt: { seconds: Date.now() / 1000 }
                    }
                ]
            };
        },
        
        getAllClassGames: async function() {
            console.log('Fallback Service.getAllClassGames called');
            return { 
                success: true, 
                data: [
                    { 
                        id: 'game1', 
                        taName: 'Demo TA', 
                        sectionId: 'section1',
                        playerCount: 3,
                        createdAt: { seconds: Date.now() / 1000 }
                    }
                ]
            };
        },
        
        getGameStats: async function(gameName) {
            console.log('Fallback Service.getGameStats called for:', gameName);
            return { 
                success: true, 
                data: {
                    avgPortfolio: 11733,
                    topScore: 12500,
                    totalPlayers: 3,
                    totalGames: 3
                }
            };
        },
        
        getStudentGameScores: async function(studentId, gameName, gameMode) {
            console.log('Fallback Service.getStudentGameScores called for:', studentId, gameName, gameMode);
            return { 
                success: true, 
                data: [
                    {
                        studentId: studentId,
                        finalPortfolio: 10500,
                        timestamp: new Date().toISOString()
                    }
                ]
            };
        },
        
        getStudentGameRank: async function(studentId, gameName, gameMode) {
            console.log('Fallback Service.getStudentGameRank called for:', studentId, gameName, gameMode);
            return { 
                success: true, 
                data: 4
            };
        }
    };
} else {
    console.log('Service object found and available for leaderboard.');
}

// Log the status of the Service object
console.log('Service fallback loaded. Service object status:', typeof window.Service);
