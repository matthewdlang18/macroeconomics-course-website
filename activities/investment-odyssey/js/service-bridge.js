// Service Bridge for Investment Odyssey TA Controls
// This file ensures that the Service object is properly defined and available

// Check if Service is already defined
if (typeof window.Service === 'undefined') {
    console.warn('Service object not found. Creating fallback Service object.');
    
    // Create a fallback Service object with all the methods used in ta-controls.js
    window.Service = {
        // Section management
        getSectionsByTA: async function(taName) {
            console.error('Fallback Service.getSectionsByTA called');
            return { 
                success: false, 
                error: 'Service not properly initialized',
                data: []
            };
        },
        
        getSection: async function(sectionId) {
            console.error('Fallback Service.getSection called');
            return { 
                success: false, 
                error: 'Service not properly initialized' 
            };
        },
        
        // Game management
        getActiveClassGame: async function(sectionId) {
            console.error('Fallback Service.getActiveClassGame called');
            return { 
                success: false, 
                error: 'Service not properly initialized' 
            };
        },
        
        getActiveClassGamesByTA: async function(taName) {
            console.error('Fallback Service.getActiveClassGamesByTA called');
            return { 
                success: false, 
                error: 'Service not properly initialized',
                data: []
            };
        },
        
        createClassGame: async function(sectionId, taName, day, time) {
            console.error('Fallback Service.createClassGame called');
            return { 
                success: false, 
                error: 'Service not properly initialized' 
            };
        },
        
        getClassGame: async function(gameId) {
            console.error('Fallback Service.getClassGame called');
            return { 
                success: false, 
                error: 'Service not properly initialized' 
            };
        },
        
        advanceClassGameRound: async function(gameId) {
            console.error('Fallback Service.advanceClassGameRound called');
            return { 
                success: false, 
                error: 'Service not properly initialized' 
            };
        },
        
        endClassGame: async function(gameId) {
            console.error('Fallback Service.endClassGame called');
            return { 
                success: false, 
                error: 'Service not properly initialized' 
            };
        }
    };
} else {
    console.log('Service object found and available.');
}

// Log the status of the Service object
console.log('Service bridge loaded. Service object status:', typeof window.Service);
