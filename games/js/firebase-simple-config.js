// Simple Firebase Configuration
// This file provides a simplified Firebase setup with minimal dependencies

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

// Simple Authentication Service
const SimpleAuth = {
  // Check if user is logged in
  isLoggedIn: function() {
    return localStorage.getItem('userSession') !== null;
  },
  
  // Get current user session
  getSession: function() {
    const session = localStorage.getItem('userSession');
    return session ? JSON.parse(session) : null;
  },
  
  // Login as student
  loginStudent: async function(name, studentId) {
    try {
      // Check if student exists
      const snapshot = await db.collection('users')
        .where('studentId', '==', studentId)
        .limit(1)
        .get();
      
      let userId;
      
      if (snapshot.empty) {
        // Create new student
        const userRef = db.collection('users').doc();
        await userRef.set({
          id: userRef.id,
          name: name,
          studentId: studentId,
          role: 'student',
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        userId = userRef.id;
      } else {
        // Update existing student
        const userDoc = snapshot.docs[0];
        userId = userDoc.id;
        
        // Update name if different
        if (userDoc.data().name !== name) {
          await userDoc.ref.update({ name: name });
        }
      }
      
      // Save session to localStorage
      const session = {
        userId: userId,
        name: name,
        studentId: studentId,
        role: 'student'
      };
      
      localStorage.setItem('userSession', JSON.stringify(session));
      
      return { success: true, data: session };
    } catch (error) {
      console.error('Error logging in student:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Login as TA
  loginTA: async function(username, passcode) {
    try {
      // Check if TA exists
      const snapshot = await db.collection('users')
        .where('username', '==', username)
        .where('passcode', '==', passcode)
        .where('role', '==', 'ta')
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return { success: false, error: 'Invalid credentials' };
      }
      
      const taDoc = snapshot.docs[0];
      const taData = taDoc.data();
      
      // Save session to localStorage
      const session = {
        userId: taDoc.id,
        name: taData.name,
        username: taData.username,
        role: 'ta'
      };
      
      localStorage.setItem('userSession', JSON.stringify(session));
      
      return { success: true, data: session };
    } catch (error) {
      console.error('Error logging in TA:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Join a session
  joinSession: async function(joinCode) {
    try {
      if (!this.isLoggedIn()) {
        return { success: false, error: 'You must be logged in to join a session' };
      }
      
      const session = this.getSession();
      
      // Find session by join code
      const snapshot = await db.collection('sessions')
        .where('joinCode', '==', joinCode)
        .where('active', '==', true)
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return { success: false, error: 'Session not found or inactive' };
      }
      
      const sessionDoc = snapshot.docs[0];
      const sessionData = sessionDoc.data();
      
      // Add user to participants
      await sessionDoc.ref.update({
        participants: firebase.firestore.FieldValue.arrayUnion(session.userId)
      });
      
      // Create participant if not exists
      const participantSnapshot = await db.collection('participants')
        .where('userId', '==', session.userId)
        .where('sessionId', '==', sessionDoc.id)
        .limit(1)
        .get();
      
      if (participantSnapshot.empty) {
        await db.collection('participants').add({
          userId: session.userId,
          sessionId: sessionDoc.id,
          name: session.name,
          cash: 10000,
          portfolio: {},
          tradeHistory: [],
          joinedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      
      // Update session in localStorage
      session.gameSession = {
        id: sessionDoc.id,
        name: sessionData.name,
        joinCode: sessionData.joinCode
      };
      
      localStorage.setItem('userSession', JSON.stringify(session));
      
      return { success: true, data: sessionData };
    } catch (error) {
      console.error('Error joining session:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Create a session (TA only)
  createSession: async function(sessionName) {
    try {
      if (!this.isLoggedIn()) {
        return { success: false, error: 'You must be logged in to create a session' };
      }
      
      const session = this.getSession();
      
      if (session.role !== 'ta') {
        return { success: false, error: 'Only TAs can create sessions' };
      }
      
      // Generate join code (6-digit number)
      const joinCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Create session
      const sessionRef = db.collection('sessions').doc();
      const sessionData = {
        id: sessionRef.id,
        name: sessionName,
        joinCode: joinCode,
        gameId: 'investment-odyssey',
        createdBy: session.userId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        active: true,
        participants: [session.userId],
        roundNumber: 0,
        assetPrices: {
          'S&P 500': 5000,
          'Bonds': 1000,
          'Real Estate': 2000,
          'Gold': 1800,
          'Commodities': 1000,
          'Bitcoin': 50000
        },
        priceHistory: {},
        totalCashInjected: 0
      };
      
      await sessionRef.set(sessionData);
      
      return { success: true, data: sessionData };
    } catch (error) {
      console.error('Error creating session:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Logout
  logout: function() {
    localStorage.removeItem('userSession');
    return { success: true };
  },
  
  // Check if user is a TA
  isTA: function() {
    const session = this.getSession();
    return session && session.role === 'ta';
  }
};

// Simple Game Service
const GameService = {
  // Get session data
  getSession: async function(sessionId) {
    try {
      const sessionDoc = await db.collection('sessions').doc(sessionId).get();
      
      if (!sessionDoc.exists) {
        return { success: false, error: 'Session not found' };
      }
      
      return { success: true, data: { id: sessionDoc.id, ...sessionDoc.data() } };
    } catch (error) {
      console.error('Error getting session:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Get participant data
  getParticipant: async function(sessionId, userId) {
    try {
      const snapshot = await db.collection('participants')
        .where('sessionId', '==', sessionId)
        .where('userId', '==', userId)
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return { success: false, error: 'Participant not found' };
      }
      
      return { success: true, data: { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } };
    } catch (error) {
      console.error('Error getting participant:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Get all participants in a session
  getParticipants: async function(sessionId) {
    try {
      const snapshot = await db.collection('participants')
        .where('sessionId', '==', sessionId)
        .get();
      
      const participants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      return { success: true, data: participants };
    } catch (error) {
      console.error('Error getting participants:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Get leaderboard for a session
  getLeaderboard: async function(sessionId) {
    try {
      // Get session data for asset prices
      const sessionDoc = await db.collection('sessions').doc(sessionId).get();
      
      if (!sessionDoc.exists) {
        return { success: false, error: 'Session not found' };
      }
      
      const sessionData = sessionDoc.data();
      const assetPrices = sessionData.assetPrices || {};
      
      // Get all participants
      const snapshot = await db.collection('participants')
        .where('sessionId', '==', sessionId)
        .get();
      
      const entries = [];
      
      snapshot.forEach(doc => {
        const participant = doc.data();
        const portfolio = participant.portfolio || {};
        
        // Calculate portfolio value
        let portfolioValue = 0;
        for (const [asset, quantity] of Object.entries(portfolio)) {
          if (assetPrices[asset]) {
            portfolioValue += assetPrices[asset] * quantity;
          }
        }
        
        // Calculate total value
        const totalValue = portfolioValue + (participant.cash || 0);
        
        // Calculate return percentage
        const initialCash = 10000;
        const totalCashInjected = participant.totalCashInjected || 0;
        const returnPercentage = ((totalValue - initialCash) / initialCash) * 100;
        
        entries.push({
          userId: participant.userId,
          name: participant.name,
          totalValue: totalValue,
          returnPercentage: returnPercentage,
          portfolioValue: portfolioValue,
          cash: participant.cash || 0
        });
      });
      
      // Sort by total value (descending)
      entries.sort((a, b) => b.totalValue - a.totalValue);
      
      return { success: true, data: entries };
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Execute buy order
  executeBuy: async function(sessionId, userId, asset, quantity) {
    try {
      // Get session data for asset prices
      const sessionDoc = await db.collection('sessions').doc(sessionId).get();
      
      if (!sessionDoc.exists) {
        return { success: false, error: 'Session not found' };
      }
      
      const sessionData = sessionDoc.data();
      const assetPrices = sessionData.assetPrices || {};
      
      // Check if asset exists
      if (!assetPrices[asset]) {
        return { success: false, error: 'Asset not found' };
      }
      
      // Get participant
      const snapshot = await db.collection('participants')
        .where('sessionId', '==', sessionId)
        .where('userId', '==', userId)
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return { success: false, error: 'Participant not found' };
      }
      
      const participantDoc = snapshot.docs[0];
      const participantData = participantDoc.data();
      
      // Calculate cost
      const price = assetPrices[asset];
      const cost = price * quantity;
      
      // Check if participant has enough cash
      if (participantData.cash < cost) {
        return { success: false, error: 'Not enough cash' };
      }
      
      // Update portfolio
      const portfolio = participantData.portfolio || {};
      const currentQuantity = portfolio[asset] || 0;
      const newQuantity = currentQuantity + quantity;
      
      portfolio[asset] = newQuantity;
      
      // Update cash
      const newCash = participantData.cash - cost;
      
      // Update trade history
      const tradeHistory = participantData.tradeHistory || [];
      tradeHistory.push({
        asset: asset,
        action: 'buy',
        quantity: quantity,
        price: price,
        cost: cost,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Update participant
      await participantDoc.ref.update({
        portfolio: portfolio,
        cash: newCash,
        tradeHistory: tradeHistory,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true, data: { asset, quantity, price, cost, newCash, newQuantity } };
    } catch (error) {
      console.error('Error executing buy order:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Execute sell order
  executeSell: async function(sessionId, userId, asset, quantity) {
    try {
      // Get session data for asset prices
      const sessionDoc = await db.collection('sessions').doc(sessionId).get();
      
      if (!sessionDoc.exists) {
        return { success: false, error: 'Session not found' };
      }
      
      const sessionData = sessionDoc.data();
      const assetPrices = sessionData.assetPrices || {};
      
      // Check if asset exists
      if (!assetPrices[asset]) {
        return { success: false, error: 'Asset not found' };
      }
      
      // Get participant
      const snapshot = await db.collection('participants')
        .where('sessionId', '==', sessionId)
        .where('userId', '==', userId)
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return { success: false, error: 'Participant not found' };
      }
      
      const participantDoc = snapshot.docs[0];
      const participantData = participantDoc.data();
      
      // Check if participant has enough of the asset
      const portfolio = participantData.portfolio || {};
      const currentQuantity = portfolio[asset] || 0;
      
      if (currentQuantity < quantity) {
        return { success: false, error: 'Not enough of the asset' };
      }
      
      // Calculate value
      const price = assetPrices[asset];
      const value = price * quantity;
      
      // Update portfolio
      const newQuantity = currentQuantity - quantity;
      
      if (newQuantity > 0) {
        portfolio[asset] = newQuantity;
      } else {
        delete portfolio[asset];
      }
      
      // Update cash
      const newCash = participantData.cash + value;
      
      // Update trade history
      const tradeHistory = participantData.tradeHistory || [];
      tradeHistory.push({
        asset: asset,
        action: 'sell',
        quantity: quantity,
        price: price,
        value: value,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Update participant
      await participantDoc.ref.update({
        portfolio: portfolio,
        cash: newCash,
        tradeHistory: tradeHistory,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true, data: { asset, quantity, price, value, newCash, newQuantity } };
    } catch (error) {
      console.error('Error executing sell order:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Advance to next round (TA only)
  advanceRound: async function(sessionId) {
    try {
      // Get session data
      const sessionDoc = await db.collection('sessions').doc(sessionId).get();
      
      if (!sessionDoc.exists) {
        return { success: false, error: 'Session not found' };
      }
      
      const sessionData = sessionDoc.data();
      const currentRound = sessionData.roundNumber || 0;
      const nextRound = currentRound + 1;
      
      // Check if we've reached the maximum number of rounds
      if (nextRound > 20) {
        return { success: false, error: 'Maximum number of rounds reached' };
      }
      
      // Generate new asset prices
      const previousPrices = sessionData.assetPrices || {};
      const newPrices = {};
      
      // Asset returns configuration
      const assetReturns = {
        'S&P 500': { mean: 0.1151, stdDev: 0.1949, min: -0.43, max: 0.50 },
        'Bonds': { mean: 0.0334, stdDev: 0.0301, min: 0.0003, max: 0.14 },
        'Real Estate': { mean: 0.0439, stdDev: 0.062, min: -0.12, max: 0.24 },
        'Gold': { mean: 0.0648, stdDev: 0.2076, min: -0.32, max: 1.25 },
        'Commodities': { mean: 0.0815, stdDev: 0.1522, min: -0.25, max: 2.00 },
        'Bitcoin': { mean: 0.50, stdDev: 1.00, min: -0.73, max: 4.50 }
      };
      
      // Generate new prices
      for (const [asset, price] of Object.entries(previousPrices)) {
        const returns = assetReturns[asset];
        
        if (!returns) {
          newPrices[asset] = price;
          continue;
        }
        
        // Generate random return using normal distribution
        let randomReturn;
        do {
          // Box-Muller transform for normal distribution
          const u1 = Math.random();
          const u2 = Math.random();
          const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
          
          // Apply mean and standard deviation
          randomReturn = returns.mean + returns.stdDev * z;
          
          // Ensure return is within bounds
        } while (randomReturn < returns.min || randomReturn > returns.max);
        
        // Apply return to price
        newPrices[asset] = price * (1 + randomReturn);
      }
      
      // Generate cash injection
      const baseAmount = 2500;
      const variability = 500;
      const cashInjection = baseAmount + (Math.random() * 2 - 1) * variability;
      
      // Update price history
      const priceHistory = sessionData.priceHistory || {};
      for (const [asset, price] of Object.entries(previousPrices)) {
        if (!priceHistory[asset]) {
          priceHistory[asset] = [];
        }
        priceHistory[asset].push(price);
      }
      
      // Update session
      await sessionDoc.ref.update({
        roundNumber: nextRound,
        assetPrices: newPrices,
        priceHistory: priceHistory,
        totalCashInjected: (sessionData.totalCashInjected || 0) + cashInjection,
        lastCashInjection: cashInjection,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Update all participants with cash injection
      const participantsSnapshot = await db.collection('participants')
        .where('sessionId', '==', sessionId)
        .get();
      
      const batch = db.batch();
      
      participantsSnapshot.forEach(doc => {
        const participant = doc.data();
        const newCash = (participant.cash || 0) + cashInjection;
        
        batch.update(doc.ref, {
          cash: newCash,
          totalCashInjected: (participant.totalCashInjected || 0) + cashInjection,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      });
      
      await batch.commit();
      
      return { success: true, data: { roundNumber: nextRound, cashInjection: cashInjection } };
    } catch (error) {
      console.error('Error advancing round:', error);
      return { success: false, error: error.message };
    }
  }
};

// Initialize test TA user
async function initializeTestTA() {
  try {
    // Check if test TA user exists
    const snapshot = await db.collection('users')
      .where('username', '==', 'testTA')
      .where('role', '==', 'ta')
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      // Create test TA user
      await db.collection('users').doc('testTA').set({
        id: 'testTA',
        name: 'Test TA',
        username: 'testTA',
        passcode: '1234',
        role: 'ta',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('Created test TA user');
    } else {
      console.log('Test TA user already exists');
    }
  } catch (error) {
    console.error('Error initializing test TA user:', error);
  }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
  // Initialize test TA user
  initializeTestTA();
});

// Export to window
window.SimpleAuth = SimpleAuth;
window.GameService = GameService;
