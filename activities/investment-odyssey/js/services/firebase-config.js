/**
 * Firebase Configuration for Investment Odyssey
 * 
 * This file initializes Firebase and exports the Firebase instances.
 * It also provides a consistent interface for checking if Firebase is available.
 */

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

// Class to manage Firebase initialization and status
class FirebaseManager {
  constructor() {
    this.initialized = false;
    this.available = false;
    this.firebase = null;
    this.db = null;
    this.auth = null;
    this.collections = {};
    
    // Initialize Firebase
    this.initialize();
  }
  
  // Initialize Firebase
  initialize() {
    try {
      // Check if Firebase is already initialized
      if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
        console.log('Firebase already initialized, using existing instance');
        this.firebase = firebase;
      } else if (typeof firebase !== 'undefined') {
        console.log('Initializing Firebase');
        this.firebase = firebase;
        this.firebase.initializeApp(firebaseConfig);
      } else {
        console.error('Firebase SDK not found');
        return;
      }
      
      // Initialize Firestore
      if (this.firebase.firestore) {
        this.db = this.firebase.firestore();
        
        // Configure Firestore
        this.db.settings({
          ignoreUndefinedProperties: true,
          cacheSizeBytes: this.firebase.firestore.CACHE_SIZE_UNLIMITED
        });
        
        // Initialize collections
        this.initializeCollections();
        
        this.initialized = true;
        this.available = true;
        console.log('Firebase initialized successfully');
      } else {
        console.error('Firestore not available');
      }
    } catch (error) {
      console.error('Error initializing Firebase:', error);
      this.available = false;
    }
  }
  
  // Initialize Firestore collections
  initializeCollections() {
    if (!this.db) return;
    
    // Define collections
    this.collections = {
      users: this.db.collection('users'),
      sections: this.db.collection('sections'),
      games: this.db.collection('games'),
      gameParticipants: this.db.collection('game_participants'),
      gameStates: this.db.collection('game_states'),
      leaderboard: this.db.collection('leaderboard')
    };
  }
  
  // Check if Firebase is available
  isAvailable() {
    return this.available;
  }
  
  // Get Firestore instance
  getFirestore() {
    return this.db;
  }
  
  // Get Firebase Auth instance
  getAuth() {
    return this.firebase ? this.firebase.auth() : null;
  }
  
  // Get a collection reference
  getCollection(name) {
    return this.collections[name] || null;
  }
  
  // Get server timestamp
  getServerTimestamp() {
    return this.firebase ? this.firebase.firestore.FieldValue.serverTimestamp() : new Date();
  }
}

// Create and export the Firebase manager instance
const firebaseManager = new FirebaseManager();

export default firebaseManager;
