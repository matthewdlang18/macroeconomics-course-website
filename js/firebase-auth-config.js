/**
 * Firebase Auth Configuration (Fallback)
 * 
 * This file is a fallback for the Firebase auth configuration.
 * It's used to prevent 404 errors when the real Firebase config is not available.
 * The actual authentication is now handled by Supabase.
 */

console.log('Using fallback Firebase auth configuration');

// Create a mock Firebase object
window.firebase = {
    auth: function() {
        return {
            signInWithEmailAndPassword: function() {
                return Promise.reject(new Error('Firebase authentication is not available'));
            },
            createUserWithEmailAndPassword: function() {
                return Promise.reject(new Error('Firebase authentication is not available'));
            },
            signOut: function() {
                return Promise.resolve();
            },
            onAuthStateChanged: function(callback) {
                callback(null);
                return function() {};
            }
        };
    },
    firestore: function() {
        return {
            collection: function() {
                return {
                    doc: function() {
                        return {
                            get: function() {
                                return Promise.resolve({
                                    exists: false,
                                    data: function() { return null; }
                                });
                            },
                            set: function() {
                                return Promise.reject(new Error('Firebase Firestore is not available'));
                            },
                            update: function() {
                                return Promise.reject(new Error('Firebase Firestore is not available'));
                            }
                        };
                    },
                    where: function() {
                        return {
                            get: function() {
                                return Promise.resolve({
                                    empty: true,
                                    docs: []
                                });
                            }
                        };
                    }
                };
            }
        };
    }
};

// Create a mock FirebaseUI object
window.firebaseui = {
    auth: {
        AuthUI: function() {
            return {
                start: function() {},
                reset: function() {}
            };
        }
    }
};

console.log('Fallback Firebase auth configuration loaded');
