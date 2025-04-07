// Firebase Configuration for Economics Games

// Ensure EconGames namespace exists
window.EconGames = window.EconGames || {};

// Firebase Configuration
EconGames.Firebase = {
    // Firebase app instance
    app: null,
    
    // Firestore database instance
    db: null,
    
    // Initialize Firebase
    init: function() {
        // Firebase configuration
        const firebaseConfig = {
            apiKey: "AIzaSyDQxGxaXMECZMYP_90Nx0Vkbs3vRJLwRSw",
            authDomain: "economics-games.firebaseapp.com",
            projectId: "economics-games",
            storageBucket: "economics-games.appspot.com",
            messagingSenderId: "1098853674103",
            appId: "1:1098853674103:web:5b9a8b9c9b9b9b9c9b9b9b"
        };
        
        // Initialize Firebase
        this.app = firebase.initializeApp(firebaseConfig);
        
        // Initialize Firestore
        this.db = firebase.firestore();
        
        console.log('Firebase initialized');
    },
    
    // Generate a random join code
    generateJoinCode: function() {
        const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let result = '';
        
        for (let i = 0; i < 6; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        
        return result;
    }
};

// Initialize Firebase when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Firebase
    EconGames.Firebase.init();
});
