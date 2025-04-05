// Firebase Core Configuration and Services
// This file provides centralized Firebase functionality for all games

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAQ8GqaRb9J3jwjsnZD_rGtNuMdTr2jKjI",
  authDomain: "economics-games.firebaseapp.com",
  projectId: "economics-games",
  storageBucket: "economics-games.firebasestorage.app",
  messagingSenderId: "433473208850",
  appId: "1:433473208850:web:dbc35cfbe0caf382a80ecb",
  measurementId: "G-KYB0YB4J97"
};

// Initialize Firebase if not already initialized
if (typeof firebase === 'undefined') {
    console.error('Firebase SDK not loaded');
} else if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Get Firestore instance
const db = firebase.firestore();

// Namespace for all Economics Games services
const EconGames = EconGames || {};

// Firebase Core Service
EconGames.FirebaseCore = {
    // Get Firestore instance
    getFirestore: function() {
        return db;
    },
    
    // Get Firebase configuration
    getConfig: function() {
        return firebaseConfig;
    },
    
    // Generate a unique ID
    generateId: function() {
        return db.collection('_').doc().id;
    },
    
    // Generate a random 6-digit join code
    generateJoinCode: function() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    },
    
    // Format timestamp
    formatTimestamp: function(timestamp) {
        if (!timestamp) return '';
        
        if (timestamp instanceof Date) {
            return timestamp.toLocaleString();
        }
        
        if (timestamp.toDate) {
            return timestamp.toDate().toLocaleString();
        }
        
        return new Date(timestamp).toLocaleString();
    },
    
    // Convert Firestore timestamp to Date
    timestampToDate: function(timestamp) {
        if (!timestamp) return null;
        
        if (timestamp instanceof Date) {
            return timestamp;
        }
        
        if (timestamp.toDate) {
            return timestamp.toDate();
        }
        
        return new Date(timestamp);
    }
};

// Export to window
window.EconGames = EconGames;
window.firebaseConfig = firebaseConfig;
