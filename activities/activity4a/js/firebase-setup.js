// This file contains instructions for setting up Firebase for the Investment Odyssey game

/*
SETUP INSTRUCTIONS:

1. Go to https://console.firebase.google.com/
2. Click "Add project" and follow the steps to create a new Firebase project
3. Once your project is created, click on the Web icon (</>) to add a web app
4. Register your app with a nickname like "Investment Odyssey"
5. Copy the Firebase configuration object provided
6. Replace the configuration in firebase-config.js with your own configuration
7. Enable Firestore Database in your Firebase project:
   - Go to Firestore Database in the left sidebar
   - Click "Create database"
   - Start in production mode
   - Choose a location close to your users
8. Set up Firestore security rules:
   - Go to the "Rules" tab in Firestore
   - Update the rules to allow read/write access:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // For development only! Restrict this in production
    }
  }
}
```

9. Test your Firebase connection by creating a class in the TA Dashboard

IMPORTANT: For production, you should implement proper authentication and more restrictive security rules.
*/

// Example Firebase configuration (replace with your own)
/*
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
*/

console.log("Firebase setup instructions loaded. See firebase-setup.js for details.");
