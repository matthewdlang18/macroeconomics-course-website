# Firebase Setup Instructions

This document provides instructions for setting up Firebase for the Economics Games.

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a project name (e.g., "Economics Games")
4. Follow the setup wizard to create your project

## Step 2: Register Your Web App

1. In the Firebase Console, select your project
2. Click the web icon (</>) to add a web app
3. Enter a nickname for your app (e.g., "Economics Games Web")
4. Check the box for "Also set up Firebase Hosting" (optional)
5. Click "Register app"

## Step 3: Get Your Firebase Configuration

After registering your app, you'll see a code snippet with your Firebase configuration. It will look something like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD_YOUR_API_KEY_HERE",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef"
};
```

## Step 4: Update the Firebase Configuration

1. Open the file `games/js/firebase-init.js`
2. Replace the placeholder configuration with your actual Firebase configuration:

```javascript
// Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-actual-project-id.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-actual-project-id.appspot.com",
  messagingSenderId: "YOUR_ACTUAL_MESSAGING_SENDER_ID",
  appId: "YOUR_ACTUAL_APP_ID"
};
```

## Step 5: Set Up Firestore Database

1. In the Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Start in test mode (you can update security rules later)
4. Choose a location for your database
5. Click "Enable"

## Step 6: Create the Required Collections

Create the following collections in your Firestore database:

1. `students` - For student information
2. `classes` - For class information
3. `fiscalGameData` - For Fiscal Balance Game data
4. `investmentGameData` - For Investment Odyssey data

## Step 7: Set Up Firestore Security Rules

1. In the Firebase Console, go to "Firestore Database" > "Rules"
2. Update the rules to match your security requirements:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all users for now
    // You should update these rules for production
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## Step 8: Test Your Firebase Setup

1. Open the games in your browser
2. Check the browser console for any Firebase-related errors
3. Try performing actions that interact with Firebase (e.g., logging in, saving data)

## Troubleshooting

If you encounter issues with Firebase:

1. **Connection errors**: Make sure your Firebase configuration is correct
2. **Permission errors**: Check your Firestore security rules
3. **Missing collections**: Ensure you've created all required collections
4. **Console errors**: Look for specific error messages in the browser console

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Web Setup Guide](https://firebase.google.com/docs/web/setup)
