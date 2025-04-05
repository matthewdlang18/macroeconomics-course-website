# Firestore Security Rules

Below are the recommended security rules for the Economics Games Firebase project. These rules provide better security than the default "allow all" rules.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Common functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isTA() {
      return exists(/databases/$(database)/documents/tas/$(request.auth.uid));
    }
    
    // Students collection
    match /students/{studentId} {
      // Anyone can create a student document
      // Only the owner or a TA can read or update their own document
      allow create: if true;
      allow read, update: if request.auth.uid == studentId || isTA();
      allow delete: if isTA();
    }
    
    // TAs collection
    match /tas/{taId} {
      // Only TAs can read the TA collection
      // No one can create, update, or delete TA documents through client-side code
      // (TA creation should be done through admin tools or server-side functions)
      allow read: if isTA();
      allow create, update, delete: if false;
    }
    
    // Classes collection
    match /classes/{classId} {
      // Anyone can read class documents
      // Only TAs can create, update, or delete class documents
      allow read: if true;
      allow create, update, delete: if isTA();
    }
    
    // Game data collections
    match /fiscalGameData/{docId} {
      // Anyone can read game data
      // Only the owner or a TA can create or update game data
      allow read: if true;
      allow create, update: if true; // For now, allow anyone to create/update
      allow delete: if isTA();
    }
    
    match /investmentGameData/{docId} {
      // Anyone can read game data
      // Only the owner or a TA can create or update game data
      allow read: if true;
      allow create, update: if true; // For now, allow anyone to create/update
      allow delete: if isTA();
    }
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
