// Simplified Firebase Configuration
// This file provides a clean implementation of Firebase initialization

// Firebase configuration
// Check if firebaseConfig is already defined to avoid duplicate declaration
if (typeof firebaseConfig === 'undefined') {
  window.firebaseConfig = {
  apiKey: "AIzaSyDIbSxMBpZ9Iu0xrMNm7wheQYEYZkwkJU8",
  authDomain: "economics-games.firebaseapp.com",
  projectId: "economics-games",
  storageBucket: "economics-games.appspot.com",
  messagingSenderId: "1026551065876",
  appId: "1:1026551065876:web:c2b4c1a3b7b1c9c2b4c1a3"
  };
}

// Initialize Firebase
if (typeof firebase !== 'undefined') {
  try {
    // Check if Firebase is already initialized
    if (firebase.apps.length === 0) {
      console.log('Initializing Firebase...');
      firebase.initializeApp(firebaseConfig);
    } else {
      console.log('Firebase already initialized');
    }

    // Initialize Firestore
    const db = firebase.firestore();

    // Set up collections
    const studentsCollection = db.collection('students');
    const sectionsCollection = db.collection('sections');
    const gamesCollection = db.collection('games');

    // Make collections available globally
    window.db = db;
    window.studentsCollection = studentsCollection;
    window.sectionsCollection = sectionsCollection;
    window.gamesCollection = gamesCollection;

    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
} else {
  console.error('Firebase SDK not loaded');
}

// Create a flag to indicate Firebase status
window.firebaseInitialized = typeof firebase !== 'undefined' && firebase.apps.length > 0;
