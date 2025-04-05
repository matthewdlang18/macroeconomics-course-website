/**
 * create-initial-ta.js
 * This script creates the initial TA user in the Firestore database
 * Run this script once to set up the TA account
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async function() {
    // Check if EconGames namespace and AuthService are available
    if (!window.EconGames || !window.EconGames.AuthService) {
        console.error('EconGames.AuthService not available. Make sure firebase-core.js and auth-service.js are loaded first.');
        return;
    }

    try {
        // Check if the TA collection exists and has any documents
        const snapshot = await EconGames.collections.tas.get();
        
        if (!snapshot.empty) {
            console.log('TA collection already has documents. Skipping initial TA creation.');
            return;
        }
        
        // Create the initial TA user
        const result = await EconGames.AuthService.createTA('testTA', '1234', 'ta');
        
        if (result.success) {
            console.log('Initial TA user created successfully:', result.data);
        } else {
            console.error('Failed to create initial TA user:', result.error);
        }
    } catch (error) {
        console.error('Error creating initial TA user:', error);
    }
});
