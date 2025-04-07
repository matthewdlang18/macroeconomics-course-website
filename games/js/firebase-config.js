// Firebase Configuration for Economics Games
// This file provides the Firebase setup and core services

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDXuQDTUxdOjlkXQZOFHPIrGLmQgJYTkAk",
  authDomain: "economics-games.firebaseapp.com",
  projectId: "economics-games",
  storageBucket: "economics-games.appspot.com",
  messagingSenderId: "1051640136569",
  appId: "1:1051640136569:web:c9a9c9c8e9a9c9c8e9a9c9"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Get Firestore instance
const db = firebase.firestore();

// Global namespace for all Economics Games services
window.EconGames = window.EconGames || {};

// Firebase Core Service
EconGames.Firebase = {
  // Get Firestore database instance
  db: db,
  
  // Generate a random join code (6-digit number)
  generateJoinCode: function() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },
  
  // Initialize database with required collections
  initializeDatabase: async function() {
    try {
      console.log('Initializing database...');
      
      // Create collections if they don't exist
      await this.createCollectionIfNotExists('users');
      await this.createCollectionIfNotExists('sections');
      await this.createCollectionIfNotExists('gameSessions');
      await this.createCollectionIfNotExists('participants');
      await this.createCollectionIfNotExists('leaderboards');
      
      // Create TA users
      await this.createTAUsers();
      
      console.log('Database initialization complete');
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  },
  
  // Create a collection by adding and then deleting a document
  createCollectionIfNotExists: async function(collectionName) {
    try {
      // Check if collection exists by trying to get a document
      const snapshot = await db.collection(collectionName).limit(1).get();
      
      if (snapshot.empty) {
        console.log(`Creating collection: ${collectionName}`);
        
        // Add a temporary document to create the collection
        const tempDoc = await db.collection(collectionName).add({
          temp: true,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Delete the temporary document
        await tempDoc.delete();
        
        console.log(`Collection created: ${collectionName}`);
      } else {
        console.log(`Collection already exists: ${collectionName}`);
      }
    } catch (error) {
      console.error(`Error creating collection ${collectionName}:`, error);
    }
  },
  
  // Create TA users
  createTAUsers: async function() {
    const tas = [
      { id: 'akshay', name: 'Akshay', sections: ['T-5:00pm-Phelps-1425', 'T-6:00pm-Phelps-1508', 'R-6:00pm-Phelps-1425'] },
      { id: 'simran', name: 'Simran', sections: ['T-5:00pm-Girvetz-2128', 'W-6:00pm-Ellison-2626', 'F-12:00pm-Arts-1349'] },
      { id: 'camilla', name: 'Camilla', sections: ['T-5:00pm-Phelps-1508', 'W-6:00pm-Girvetz-2128', 'F-12:00pm-Phelps-1425'] },
      { id: 'huiyann', name: 'Hui Yann', sections: ['T-5:00pm-Building-387-1015', 'W-7:00pm-North-Hall-1109', 'F-12:00pm-South-Hall-1430'] },
      { id: 'lars', name: 'Lars', sections: ['W-6:00pm-Phelps-1425', 'F-12:00pm-Ellison-2626'] },
      { id: 'luorao', name: 'Luorao', sections: ['W-6:00pm-South-Hall-1430', 'R-6:00pm-Phelps-2524'] }
    ];
    
    // Create sections
    const sections = [
      { id: 'T-5:00pm-Phelps-1425', day: 'Tuesday', time: '5:00pm-5:50pm', location: 'Phelps, 1425', taId: 'akshay', taName: 'Akshay' },
      { id: 'T-5:00pm-Girvetz-2128', day: 'Tuesday', time: '5:00pm-5:50pm', location: 'Girvetz, 2128', taId: 'simran', taName: 'Simran' },
      { id: 'T-5:00pm-Phelps-1508', day: 'Tuesday', time: '5:00pm-5:50pm', location: 'Phelps, 1508', taId: 'camilla', taName: 'Camilla' },
      { id: 'T-5:00pm-Building-387-1015', day: 'Tuesday', time: '5:00pm-5:50pm', location: 'Building 387, 1015', taId: 'huiyann', taName: 'Hui Yann' },
      { id: 'T-6:00pm-Phelps-1508', day: 'Tuesday', time: '6:00pm-6:50pm', location: 'Phelps, 1508', taId: 'akshay', taName: 'Akshay' },
      { id: 'W-6:00pm-Phelps-1425', day: 'Wednesday', time: '6:00pm-6:50pm', location: 'Phelps, 1425', taId: 'lars', taName: 'Lars' },
      { id: 'W-6:00pm-South-Hall-1430', day: 'Wednesday', time: '6:00pm-6:50pm', location: 'South Hall, 1430', taId: 'luorao', taName: 'Luorao' },
      { id: 'W-6:00pm-Ellison-2626', day: 'Wednesday', time: '6:00pm-6:50pm', location: 'Ellison, 2626', taId: 'simran', taName: 'Simran' },
      { id: 'W-6:00pm-Girvetz-2128', day: 'Wednesday', time: '6:00pm-6:50pm', location: 'Girvetz, 2128', taId: 'camilla', taName: 'Camilla' },
      { id: 'W-7:00pm-North-Hall-1109', day: 'Wednesday', time: '7:00pm-7:50pm', location: 'North Hall, 1109', taId: 'huiyann', taName: 'Hui Yann' },
      { id: 'R-6:00pm-Phelps-2524', day: 'Thursday', time: '6:00pm-6:50pm', location: 'Phelps, 2524', taId: 'luorao', taName: 'Luorao' },
      { id: 'R-6:00pm-Phelps-1425', day: 'Thursday', time: '6:00pm-6:50pm', location: 'Phelps, 1425', taId: 'akshay', taName: 'Akshay' },
      { id: 'F-12:00pm-Arts-1349', day: 'Friday', time: '12:00pm-12:50pm', location: 'Arts, 1349', taId: 'simran', taName: 'Simran' },
      { id: 'F-12:00pm-Phelps-1425', day: 'Friday', time: '12:00pm-12:50pm', location: 'Phelps, 1425', taId: 'camilla', taName: 'Camilla' },
      { id: 'F-12:00pm-South-Hall-1430', day: 'Friday', time: '12:00pm-12:50pm', location: 'South Hall, 1430', taId: 'huiyann', taName: 'Hui Yann' },
      { id: 'F-12:00pm-Ellison-2626', day: 'Friday', time: '12:00pm-12:50pm', location: 'Ellison, 2626', taId: 'lars', taName: 'Lars' }
    ];
    
    // Create TA users
    for (const ta of tas) {
      try {
        // Check if TA exists
        const taDoc = await db.collection('users').doc(ta.id).get();
        
        if (!taDoc.exists) {
          // Create TA user
          await db.collection('users').doc(ta.id).set({
            id: ta.id,
            name: ta.name,
            role: 'ta',
            sections: ta.sections,
            passcode: '1234', // Default passcode
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          
          console.log(`Created TA user: ${ta.name}`);
        } else {
          console.log(`TA user already exists: ${ta.name}`);
        }
      } catch (error) {
        console.error(`Error creating TA user ${ta.name}:`, error);
      }
    }
    
    // Create sections
    for (const section of sections) {
      try {
        // Check if section exists
        const sectionDoc = await db.collection('sections').doc(section.id).get();
        
        if (!sectionDoc.exists) {
          // Create section
          await db.collection('sections').doc(section.id).set({
            id: section.id,
            day: section.day,
            time: section.time,
            location: section.location,
            taId: section.taId,
            taName: section.taName,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          
          console.log(`Created section: ${section.day} ${section.time}`);
        } else {
          console.log(`Section already exists: ${section.day} ${section.time}`);
        }
      } catch (error) {
        console.error(`Error creating section ${section.day} ${section.time}:`, error);
      }
    }
  }
};

// Initialize database when document is ready
document.addEventListener('DOMContentLoaded', function() {
  // Initialize database
  EconGames.Firebase.initializeDatabase();
});
