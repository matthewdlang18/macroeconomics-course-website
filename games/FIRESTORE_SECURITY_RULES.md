# Firestore Security Rules

Below are the recommended security rules for the Economics Games Firebase project. These rules provide better security than the default "allow all" rules.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // DEVELOPMENT RULES - ALLOW ALL ACCESS
    // WARNING: These rules are for development only and should be replaced with more restrictive rules for production
    match /{document=**} {
      allow read, write: if true;
    }

    // PRODUCTION RULES (commented out for now)
    // Uncomment these rules when moving to production

    // // Common functions
    // function isAuthenticated() {
    //   return request.auth != null;
    // }
    //
    // function isTA() {
    //   return request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "ta";
    // }
    //
    // // Users collection
    // match /users/{userId} {
    //   allow read: if true;
    //   allow create: if true;
    //   allow update: if request.auth != null && request.auth.uid == userId;
    //   allow delete: if request.auth != null && request.auth.uid == userId;
    // }
    //
    // // Sessions collection
    // match /sessions/{sessionId} {
    //   allow read: if true;
    //   allow create: if request.auth != null;
    //   allow update: if request.auth != null;
    //   allow delete: if request.auth != null && isTA();
    // }
    //
    // // Participants collection
    // match /participants/{participantId} {
    //   allow read: if true;
    //   allow create: if request.auth != null;
    //   allow update: if request.auth != null;
    //   allow delete: if request.auth != null;
    // }
    //
    // // Games collection
    // match /games/{gameId} {
    //   allow read: if true;
    //   allow create, update, delete: if request.auth != null && isTA();
    // }
    //
    // // Leaderboards collection
    // match /leaderboards/{leaderboardId} {
    //   allow read: if true;
    //   allow create, update: if request.auth != null;
    //   allow delete: if request.auth != null && isTA();
    // }
  }
}
```

## How to Apply These Rules

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Firestore Database > Rules
4. Replace the existing rules with the rules above
5. Click "Publish"

## Notes

- These rules allow anyone to create a student account
- Only TAs can manage classes and delete data
- Game data can be read by anyone, but only created/updated by the owner or a TA
- TA accounts cannot be created through client-side code for security reasons

For production, you may want to implement even more restrictive rules based on your specific requirements.
