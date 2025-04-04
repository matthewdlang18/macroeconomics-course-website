// Firebase Initialization for Economics Games
// This file provides a centralized Firebase configuration

// Firebase configuration
// Replace these placeholder values with your actual Firebase project details
const firebaseConfig = {
  apiKey: "AIzaSyDummyKeyReplaceMeWithYourActualKey",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef"
};

// Initialize Firebase
if (!firebase.apps.length) {
  try {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully");
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
}

// Get Firestore instance
const db = firebase.firestore();

// Enable offline persistence (optional but recommended for better user experience)
db.enablePersistence()
  .then(() => {
    console.log("Offline persistence enabled");
  })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      console.warn("Offline persistence not enabled: Multiple tabs open");
    } else if (err.code === 'unimplemented') {
      // The current browser does not support all of the features required for persistence
      console.warn("Offline persistence not supported in this browser");
    } else {
      console.error("Error enabling offline persistence:", err);
    }
  });

// Fallback for offline mode
const isOffline = () => {
  return !window.navigator.onLine;
};

// Add offline detection
window.addEventListener('online', () => {
  console.log('App is online');
});

window.addEventListener('offline', () => {
  console.log('App is offline');
});

// Export Firebase instances
window.firebaseDb = db;
