// Simplified Authentication System for Economics Games
// This file provides a clean implementation of user authentication
// with fallback to localStorage when Firebase is not available

// Initialize the Auth object
const Auth = {
    // Flag to track if we're using Firebase
    usingFirebase: false,
    
    // Initialize the authentication system
    init: function() {
        console.log('Initializing Auth system...');
        
        // Check if Firebase is available
        if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
            console.log('Firebase is available, using Firebase authentication');
            this.usingFirebase = true;
            
            // Set up Firestore references if not already set
            if (typeof window.db === 'undefined') {
                window.db = firebase.firestore();
            }
            
            if (typeof window.studentsCollection === 'undefined') {
                window.studentsCollection = window.db.collection('students');
            }
        } else {
            console.log('Firebase is not available, using localStorage authentication');
            this.usingFirebase = false;
        }
        
        return this;
    },
    
    // Check if user is logged in
    isLoggedIn: function() {
        const studentId = localStorage.getItem('student_id');
        const studentName = localStorage.getItem('student_name');
        return !!(studentId && studentName);
    },
    
    // Check if user is a guest
    isGuest: function() {
        return localStorage.getItem('is_guest') === 'true';
    },
    
    // Get current user info
    getCurrentUser: function() {
        if (this.isLoggedIn()) {
            return {
                id: localStorage.getItem('student_id'),
                name: localStorage.getItem('student_name'),
                isGuest: this.isGuest()
            };
        }
        return null;
    },
    
    // Register a new student
    registerStudent: async function(name, passcode) {
        console.log(`Attempting to register student: ${name}`);
        
        if (!name || !passcode) {
            return { success: false, error: "Name and passcode are required" };
        }
        
        try {
            if (this.usingFirebase) {
                return await this._registerStudentFirebase(name, passcode);
            } else {
                return await this._registerStudentLocalStorage(name, passcode);
            }
        } catch (error) {
            console.error('Error in registerStudent:', error);
            
            // If Firebase fails, try localStorage as fallback
            if (this.usingFirebase) {
                console.log('Firebase registration failed, trying localStorage fallback');
                try {
                    return await this._registerStudentLocalStorage(name, passcode);
                } catch (fallbackError) {
                    console.error('Fallback registration also failed:', fallbackError);
                    return { success: false, error: "Registration failed. Please try again." };
                }
            }
            
            return { success: false, error: error.message || "Registration failed. Please try again." };
        }
    },
    
    // Login a student
    loginStudent: async function(name, passcode) {
        console.log(`Attempting to login student: ${name}`);
        
        if (!name || !passcode) {
            return { success: false, error: "Name and passcode are required" };
        }
        
        try {
            if (this.usingFirebase) {
                return await this._loginStudentFirebase(name, passcode);
            } else {
                return await this._loginStudentLocalStorage(name, passcode);
            }
        } catch (error) {
            console.error('Error in loginStudent:', error);
            
            // If Firebase fails, try localStorage as fallback
            if (this.usingFirebase) {
                console.log('Firebase login failed, trying localStorage fallback');
                try {
                    return await this._loginStudentLocalStorage(name, passcode);
                } catch (fallbackError) {
                    console.error('Fallback login also failed:', fallbackError);
                    return { success: false, error: "Login failed. Please try again." };
                }
            }
            
            return { success: false, error: error.message || "Login failed. Please try again." };
        }
    },
    
    // Set guest mode
    setGuestMode: function() {
        localStorage.setItem('is_guest', 'true');
        return { success: true };
    },
    
    // Logout
    logout: function() {
        localStorage.removeItem('student_id');
        localStorage.removeItem('student_name');
        localStorage.removeItem('is_guest');
        localStorage.removeItem('section_id');
        localStorage.removeItem('section_name');
        return { success: true };
    },
    
    // Private method: Register student with Firebase
    _registerStudentFirebase: async function(name, passcode) {
        // Generate a unique ID for the student
        const studentId = `${name.replace(/\\s+/g, '_')}_${Date.now()}`;
        
        // Check if student with same name already exists
        const snapshot = await window.studentsCollection.where('name', '==', name).get();
        
        if (!snapshot.empty) {
            const existingStudent = snapshot.docs[0].data();
            // If passcode matches, return success (essentially a login)
            if (existingStudent.passcode === passcode) {
                // Store student info in local storage for session
                localStorage.setItem('student_id', existingStudent.id);
                localStorage.setItem('student_name', existingStudent.name);
                
                return { success: true, data: existingStudent };
            } else {
                return { success: false, error: "Student with this name already exists with a different passcode" };
            }
        }
        
        // Create student document
        await window.studentsCollection.doc(studentId).set({
            id: studentId,
            name: name,
            passcode: passcode,
            sectionId: null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Store student info in local storage for session
        localStorage.setItem('student_id', studentId);
        localStorage.setItem('student_name', name);
        
        return { success: true, data: { id: studentId, name, passcode } };
    },
    
    // Private method: Login student with Firebase
    _loginStudentFirebase: async function(name, passcode) {
        const snapshot = await window.studentsCollection.where('name', '==', name).where('passcode', '==', passcode).get();
        
        if (!snapshot.empty) {
            const student = snapshot.docs[0].data();
            
            // Update last login time
            await window.studentsCollection.doc(student.id).update({
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Store student info in local storage for session
            localStorage.setItem('student_id', student.id);
            localStorage.setItem('student_name', student.name);
            
            return { success: true, data: student };
        } else {
            return { success: false, error: "Invalid name or passcode" };
        }
    },
    
    // Private method: Register student with localStorage
    _registerStudentLocalStorage: async function(name, passcode) {
        // Generate a unique ID for the student
        const studentId = `${name.replace(/\\s+/g, '_')}_${Date.now()}`;
        
        // Get existing students
        const students = JSON.parse(localStorage.getItem('students') || '[]');
        
        // Check if student with same name already exists
        const existingStudent = students.find(s => s.name === name);
        if (existingStudent) {
            // If passcode matches, return success (essentially a login)
            if (existingStudent.passcode === passcode) {
                // Store student info in local storage for session
                localStorage.setItem('student_id', existingStudent.id);
                localStorage.setItem('student_name', existingStudent.name);
                
                return { success: true, data: existingStudent };
            } else {
                return { success: false, error: "Student with this name already exists with a different passcode" };
            }
        }
        
        // Create student object
        const newStudent = {
            id: studentId,
            name: name,
            passcode: passcode,
            sectionId: null,
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString()
        };
        
        // Add student to array
        students.push(newStudent);
        
        // Save to localStorage
        localStorage.setItem('students', JSON.stringify(students));
        
        // Store student info in local storage for session
        localStorage.setItem('student_id', studentId);
        localStorage.setItem('student_name', name);
        
        return { success: true, data: newStudent };
    },
    
    // Private method: Login student with localStorage
    _loginStudentLocalStorage: async function(name, passcode) {
        const students = JSON.parse(localStorage.getItem('students') || '[]');
        const student = students.find(s => s.name === name && s.passcode === passcode);
        
        if (student) {
            // Update last login time
            const studentIndex = students.findIndex(s => s.id === student.id);
            students[studentIndex].lastLoginAt = new Date().toISOString();
            localStorage.setItem('students', JSON.stringify(students));
            
            // Store student info in local storage for session
            localStorage.setItem('student_id', student.id);
            localStorage.setItem('student_name', student.name);
            
            return { success: true, data: student };
        } else {
            return { success: false, error: "Invalid name or passcode" };
        }
    }
};

// Initialize Auth when the script loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Auth system
    Auth.init();
    
    // Make Auth available globally
    window.Auth = Auth;
    
    console.log('Auth system initialized and ready');
});
