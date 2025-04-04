// Centralized Authentication Service for All Activities
// This service handles user authentication across all games/activities

const AuthService = {
    // Firebase configuration - Replace with your own Firebase project details
    firebaseConfig: {
        apiKey: "YOUR_API_KEY",
        authDomain: "your-project-id.firebaseapp.com",
        projectId: "your-project-id",
        storageBucket: "your-project-id.appspot.com",
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
        appId: "YOUR_APP_ID"
    },

    // Initialize Firebase
    init: function() {
        if (!firebase.apps.length) {
            firebase.initializeApp(this.firebaseConfig);
        }
        this.auth = firebase.auth();
        this.db = firebase.firestore();
        this.usersCollection = this.db.collection('users');
        this.classesCollection = this.db.collection('classes');
        
        // Set up auth state change listener
        this.auth.onAuthStateChanged(user => {
            if (user) {
                console.log('User is signed in:', user.uid);
                localStorage.setItem('currentUserId', user.uid);
            } else {
                console.log('User is signed out');
                localStorage.removeItem('currentUserId');
            }
        });
    },

    // Check if user is authenticated
    isAuthenticated: function() {
        return !!this.auth.currentUser;
    },

    // Get current user
    getCurrentUser: function() {
        return this.auth.currentUser;
    },

    // Get current user ID
    getCurrentUserId: function() {
        return this.auth.currentUser ? this.auth.currentUser.uid : null;
    },

    // Register a new user
    registerUser: async function(email, password, name, studentId) {
        try {
            // Create user with email and password
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Add user profile to Firestore
            await this.usersCollection.doc(user.uid).set({
                name: name,
                email: email,
                studentId: studentId,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                classes: []
            });
            
            // Update user profile
            await user.updateProfile({
                displayName: name
            });
            
            return { success: true, data: { uid: user.uid, name, email } };
        } catch (error) {
            console.error("Error registering user:", error);
            return { success: false, error: error.message };
        }
    },

    // Sign in with email and password
    signIn: async function(email, password) {
        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Get user profile from Firestore
            const userDoc = await this.usersCollection.doc(user.uid).get();
            const userData = userDoc.data();
            
            return { success: true, data: { uid: user.uid, ...userData } };
        } catch (error) {
            console.error("Error signing in:", error);
            return { success: false, error: error.message };
        }
    },

    // Sign in anonymously (for quick access)
    signInAnonymously: async function(name, studentId, classNumber = null) {
        try {
            const userCredential = await this.auth.signInAnonymously();
            const user = userCredential.user;
            
            // Add user profile to Firestore
            await this.usersCollection.doc(user.uid).set({
                name: name,
                studentId: studentId,
                isAnonymous: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                classes: classNumber ? [classNumber] : []
            });
            
            // Update user profile
            await user.updateProfile({
                displayName: name
            });
            
            return { success: true, data: { uid: user.uid, name, studentId, isAnonymous: true } };
        } catch (error) {
            console.error("Error signing in anonymously:", error);
            return { success: false, error: error.message };
        }
    },

    // Sign out
    signOut: async function() {
        try {
            await this.auth.signOut();
            return { success: true };
        } catch (error) {
            console.error("Error signing out:", error);
            return { success: false, error: error.message };
        }
    },

    // Join a class
    joinClass: async function(classNumber, className = null) {
        try {
            const userId = this.getCurrentUserId();
            if (!userId) {
                return { success: false, error: "User not authenticated" };
            }
            
            // Check if class exists
            const classDoc = await this.classesCollection.doc(classNumber).get();
            
            if (!classDoc.exists) {
                // Create class if it doesn't exist
                if (className) {
                    await this.classesCollection.doc(classNumber).set({
                        name: className,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        students: [userId]
                    });
                } else {
                    return { success: false, error: "Class does not exist" };
                }
            } else {
                // Add user to existing class
                await this.classesCollection.doc(classNumber).update({
                    students: firebase.firestore.FieldValue.arrayUnion(userId)
                });
            }
            
            // Add class to user's classes
            await this.usersCollection.doc(userId).update({
                classes: firebase.firestore.FieldValue.arrayUnion(classNumber)
            });
            
            return { success: true, data: { classNumber } };
        } catch (error) {
            console.error("Error joining class:", error);
            return { success: false, error: error.message };
        }
    },

    // Get user's classes
    getUserClasses: async function() {
        try {
            const userId = this.getCurrentUserId();
            if (!userId) {
                return { success: false, error: "User not authenticated" };
            }
            
            const userDoc = await this.usersCollection.doc(userId).get();
            const userData = userDoc.data();
            
            if (!userData.classes || userData.classes.length === 0) {
                return { success: true, data: [] };
            }
            
            // Get class details
            const classPromises = userData.classes.map(classNumber => 
                this.classesCollection.doc(classNumber).get()
            );
            
            const classDocs = await Promise.all(classPromises);
            const classes = classDocs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            return { success: true, data: classes };
        } catch (error) {
            console.error("Error getting user classes:", error);
            return { success: false, error: error.message };
        }
    },

    // Get user profile
    getUserProfile: async function() {
        try {
            const userId = this.getCurrentUserId();
            if (!userId) {
                return { success: false, error: "User not authenticated" };
            }
            
            const userDoc = await this.usersCollection.doc(userId).get();
            const userData = userDoc.data();
            
            return { success: true, data: { uid: userId, ...userData } };
        } catch (error) {
            console.error("Error getting user profile:", error);
            return { success: false, error: error.message };
        }
    },

    // Update user profile
    updateUserProfile: async function(profileData) {
        try {
            const userId = this.getCurrentUserId();
            if (!userId) {
                return { success: false, error: "User not authenticated" };
            }
            
            await this.usersCollection.doc(userId).update({
                ...profileData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return { success: true };
        } catch (error) {
            console.error("Error updating user profile:", error);
            return { success: false, error: error.message };
        }
    }
};

// Export the service
window.AuthService = AuthService;
