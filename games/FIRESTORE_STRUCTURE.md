# Firestore Database Structure for Economics Games

This document outlines the Firestore database structure for the Economics Games platform.

## Collections Overview

The database is organized into the following collections:

1. `users` - Stores information about all users (students and TAs)
2. `games` - Stores metadata about available games
3. `sessions` - Stores information about TA-created game sessions
4. `participants` - Stores user participation in specific game sessions
5. `gameData` - Stores individual user game data (for single player mode)
6. `leaderboards` - Stores leaderboard entries for each game

## Collection Details

### Users Collection

Stores information about all users in the system.

**Document ID**: Auto-generated or username for TAs

**Fields**:
- `id` (string): User ID (same as document ID)
- `name` (string): User's full name
- `role` (string): User role ('student' or 'ta')
- `createdAt` (timestamp): When the user was created

**Additional fields for students**:
- `studentId` (string): Student ID number

**Additional fields for TAs**:
- `username` (string): TA username for login
- `passcode` (string): TA passcode for login

### Games Collection

Stores metadata about available games.

**Document ID**: Game ID (e.g., 'investment-odyssey')

**Fields**:
- `gameId` (string): Game ID (same as document ID)
- `name` (string): Display name of the game
- `description` (string): Game description
- `config` (map): Game-specific configuration
- `createdAt` (timestamp): When the game was registered

### Sessions Collection

Stores information about TA-created game sessions.

**Document ID**: Auto-generated

**Fields**:
- `id` (string): Session ID (same as document ID)
- `gameId` (string): ID of the game this session is for
- `name` (string): Session name (e.g., "Econ 101 - Section 3")
- `joinCode` (string): 6-digit code for students to join
- `createdBy` (string): ID of the TA who created the session
- `createdAt` (timestamp): When the session was created
- `active` (boolean): Whether the session is currently active
- `endedAt` (timestamp, optional): When the session was ended
- `participants` (array): Array of user IDs who have joined this session

### Participants Collection

Stores user participation in specific game sessions.

**Document ID**: Auto-generated

**Fields**:
- `id` (string): Participant ID (same as document ID)
- `userId` (string): ID of the user
- `sessionId` (string): ID of the session
- `joinedAt` (timestamp): When the user joined the session
- `gameData` (map): Game-specific data for this participant
- `updatedAt` (timestamp, optional): When the participant data was last updated

### GameData Collection

Stores individual user game data (for single player mode).

**Document ID**: Auto-generated

**Fields**:
- `id` (string): Game data ID (same as document ID)
- `userId` (string): ID of the user
- `gameId` (string): ID of the game
- `data` (map): Game-specific data
- `createdAt` (timestamp): When the game data was created
- `updatedAt` (timestamp): When the game data was last updated

### Leaderboards Collection

Stores leaderboard entries for each game.

**Document ID**: Game ID (e.g., 'investment-odyssey')

**Fields**:
- `entries` (array): Array of leaderboard entries
  - Each entry contains:
    - `id` (string): Entry ID
    - `userId` (string): ID of the user
    - `name` (string): Display name of the user
    - `score` (number): User's score
    - `timestamp` (timestamp): When the entry was created
    - `sessionId` (string, optional): ID of the session (for class play)
- `updatedAt` (timestamp): When the leaderboard was last updated
- `resetAt` (timestamp, optional): When the leaderboard was last reset
- `resetBy` (string, optional): ID of the user who reset the leaderboard

## Security Rules

Here are the recommended Firestore security rules for this database structure:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own data
    match /users/{userId} {
      allow read: if request.auth != null && (request.auth.uid == userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ta');
      allow create: if true; // Allow new user registration
      allow update, delete: if request.auth != null && (request.auth.uid == userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ta');
    }
    
    // Games are readable by all, writable by TAs
    match /games/{gameId} {
      allow read: if true;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ta';
    }
    
    // Sessions are readable by all, creatable by TAs, updatable by creator
    match /sessions/{sessionId} {
      allow read: if true;
      allow create: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ta';
      allow update: if request.auth != null && (
        resource.data.createdBy == request.auth.uid || 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ta'
      );
      allow delete: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ta';
    }
    
    // Participants can read/write their own data, TAs can read all
    match /participants/{participantId} {
      allow read: if request.auth != null && (
        resource.data.userId == request.auth.uid || 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ta'
      );
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && resource.data.userId == request.auth.uid;
      allow delete: if request.auth != null && (
        resource.data.userId == request.auth.uid || 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ta'
      );
    }
    
    // GameData can be read/written by the owner, TAs can read all
    match /gameData/{gameDataId} {
      allow read: if request.auth != null && (
        resource.data.userId == request.auth.uid || 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ta'
      );
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && resource.data.userId == request.auth.uid;
      allow delete: if request.auth != null && (
        resource.data.userId == request.auth.uid || 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ta'
      );
    }
    
    // Leaderboards are readable by all, writable by authenticated users
    match /leaderboards/{gameId} {
      allow read: if true;
      allow create, update: if request.auth != null;
      allow delete: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ta';
    }
  }
}
```

## Implementation Notes

1. **User Authentication**: The system uses a simple passcode-based authentication system rather than Firebase Authentication.

2. **Join Codes**: When a TA creates a session, a random 6-digit join code is generated. Students use this code to join the session.

3. **Data Separation**: The database structure separates game configuration, session management, and user data to allow for flexible game development.

4. **Leaderboards**: Leaderboards can be filtered by session ID to show class-specific leaderboards or global leaderboards.

5. **Security**: The security rules ensure that users can only access their own data, while TAs have broader access for class management.

## Example Usage

### Creating a TA User

```javascript
const taRef = db.collection('users').doc('testTA');
await taRef.set({
    id: 'testTA',
    name: 'Test TA',
    username: 'testTA',
    passcode: '1234',
    role: 'ta',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
});
```

### Registering a Student

```javascript
const studentRef = db.collection('users').doc();
await studentRef.set({
    id: studentRef.id,
    name: 'John Doe',
    studentId: '12345',
    role: 'student',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
});
```

### Creating a Game Session

```javascript
const sessionRef = db.collection('sessions').doc();
await sessionRef.set({
    id: sessionRef.id,
    gameId: 'investment-odyssey',
    name: 'Econ 101 - Investment Game',
    joinCode: '123456',
    createdBy: 'testTA',
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    active: true,
    participants: []
});
```

### Joining a Session

```javascript
// Find session by join code
const sessionSnapshot = await db.collection('sessions')
    .where('joinCode', '==', '123456')
    .where('active', '==', true)
    .get();

if (!sessionSnapshot.empty) {
    const sessionId = sessionSnapshot.docs[0].id;
    const userId = 'student123';
    
    // Add user to session participants
    await db.collection('sessions').doc(sessionId).update({
        participants: firebase.firestore.FieldValue.arrayUnion(userId)
    });
    
    // Create participant record
    const participantRef = db.collection('participants').doc();
    await participantRef.set({
        id: participantRef.id,
        userId: userId,
        sessionId: sessionId,
        joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
        gameData: {
            cash: 10000,
            portfolio: {}
        }
    });
}
```
