/**
 * firebase-core.js
 * Core Firebase initialization and configuration
 * This file should be loaded FIRST before any other Firebase-related scripts
 */

// Namespace to prevent global variable conflicts
window.EconGames = window.EconGames || {};

// Firebase configuration
// Replace these placeholder values with your actual Firebase project details
EconGames.firebaseConfig = {
  apiKey: "AIzaSyAQ8GqaRb9J3jwjsnZD_rGtNuMdTr2jKjI",
  authDomain: "economics-games.firebaseapp.com",
  projectId: "economics-games",
  storageBucket: "economics-games.firebasestorage.app",
  messagingSenderId: "433473208850",
  appId: "1:433473208850:web:dbc35cfbe0caf382a80ecb",
  measurementId: "G-KYB0YB4J97"
};

// Initialize Firebase (only once)
if (!firebase.apps.length) {
  try {
    firebase.initializeApp(EconGames.firebaseConfig);
    console.log("Firebase initialized successfully");
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
}

// Get Firestore instance (shared across all files)
EconGames.db = firebase.firestore();

// Enable offline persistence (optional but recommended)
EconGames.db.enablePersistence()
  .then(() => {
    console.log("Offline persistence enabled");
  })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("Offline persistence not enabled: Multiple tabs open");
    } else if (err.code === 'unimplemented') {
      console.warn("Offline persistence not supported in this browser");
    } else {
      console.error("Error enabling offline persistence:", err);
    }
  });

// Collection references (centralized)
EconGames.collections = {
  students: EconGames.db.collection('students'),
  classes: EconGames.db.collection('classes'),
  fiscalGameData: EconGames.db.collection('fiscalGameData'),
  investmentGameData: EconGames.db.collection('investmentGameData'),
  tas: EconGames.db.collection('tas')
};

// Utility functions
EconGames.utils = {
  // Generate a timestamp string
  timestamp: function() {
    return new Date().toISOString();
  },

  // Check if we're offline
  isOffline: function() {
    return !window.navigator.onLine;
  },

  // Generate a unique ID
  generateId: function(prefix = '') {
    return prefix + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
};

// Add offline detection
window.addEventListener('online', () => {
  console.log('App is online');
  // You could dispatch a custom event here if needed
});

window.addEventListener('offline', () => {
  console.log('App is offline');
  // You could dispatch a custom event here if needed
});

console.log("Firebase core module loaded");
