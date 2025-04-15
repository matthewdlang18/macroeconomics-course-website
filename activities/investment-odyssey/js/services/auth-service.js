/**
 * Authentication Service for Investment Odyssey
 * 
 * Handles user authentication, registration, and session management.
 */

import BaseService from './base-service.js';
import firebaseManager from './firebase-config.js';

class AuthService extends BaseService {
  constructor() {
    super();
    
    // Session keys
    this.USER_ID_KEY = 'investment_odyssey_user_id';
    this.USER_NAME_KEY = 'investment_odyssey_user_name';
    this.USER_ROLE_KEY = 'investment_odyssey_user_role';
    this.USER_SECTION_KEY = 'investment_odyssey_user_section';
    
    // Collections
    this.usersCollection = this.getCollection('users');
    this.sectionsCollection = this.getCollection('sections');
  }
  
  // Generate a unique user ID
  generateUserId(name) {
    return `${name.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`;
  }
  
  // Generate TA passcode
  generateTAPasscode(name) {
    // Take first three letters of name (lowercase) and add "econ2"
    const firstThreeLetters = name.toLowerCase().substring(0, 3);
    return `${firstThreeLetters}econ2`;
  }
  
  // Register a new student
  async registerStudent(name, passcode) {
    try {
      // Validate inputs
      if (!name || !passcode) {
        return this.error('Name and passcode are required');
      }
      
      // Generate user ID
      const userId = this.generateUserId(name);
      
      if (this.useFirebase) {
        // Check if student with same name already exists
        const snapshot = await this.usersCollection
          .where('name', '==', name)
          .where('role', '==', 'student')
          .get();
        
        if (!snapshot.empty) {
          const existingUser = snapshot.docs[0].data();
          
          // If passcode matches, return success
          if (existingUser.passcode === passcode) {
            // Save session
            this.saveSession(existingUser.id, existingUser.name, 'student', existingUser.sectionId);
            return this.success(existingUser);
          } else {
            return this.error('Student with this name already exists with a different passcode');
          }
        }
        
        // Create new user document
        const userData = {
          id: userId,
          name: name,
          passcode: passcode,
          role: 'student',
          sectionId: null,
          createdAt: this.getServerTimestamp(),
          lastLoginAt: this.getServerTimestamp()
        };
        
        await this.usersCollection.doc(userId).set(userData);
        
        // Save session
        this.saveSession(userId, name, 'student', null);
        
        return this.success(userData);
      } else {
        // Fallback to localStorage
        const users = this.loadFromLocalStorage('investment_odyssey_users') || [];
        
        // Check if user already exists
        const existingUser = users.find(u => u.name === name && u.role === 'student');
        
        if (existingUser) {
          // If passcode matches, return success
          if (existingUser.passcode === passcode) {
            // Save session
            this.saveSession(existingUser.id, existingUser.name, 'student', existingUser.sectionId);
            return this.success(existingUser);
          } else {
            return this.error('Student with this name already exists with a different passcode');
          }
        }
        
        // Create new user
        const userData = {
          id: userId,
          name: name,
          passcode: passcode,
          role: 'student',
          sectionId: null,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        };
        
        users.push(userData);
        this.saveToLocalStorage('investment_odyssey_users', users);
        
        // Save session
        this.saveSession(userId, name, 'student', null);
        
        return this.success(userData);
      }
    } catch (error) {
      return this.error('Error registering student', error);
    }
  }
  
  // Login a student
  async loginStudent(name, passcode) {
    try {
      // Validate inputs
      if (!name || !passcode) {
        return this.error('Name and passcode are required');
      }
      
      if (this.useFirebase) {
        // Query for student with matching name and passcode
        const snapshot = await this.usersCollection
          .where('name', '==', name)
          .where('passcode', '==', passcode)
          .where('role', '==', 'student')
          .get();
        
        if (snapshot.empty) {
          return this.error('Invalid name or passcode');
        }
        
        const userData = snapshot.docs[0].data();
        
        // Update last login time
        await this.usersCollection.doc(userData.id).update({
          lastLoginAt: this.getServerTimestamp()
        });
        
        // Save session
        this.saveSession(userData.id, userData.name, 'student', userData.sectionId);
        
        return this.success(userData);
      } else {
        // Fallback to localStorage
        const users = this.loadFromLocalStorage('investment_odyssey_users') || [];
        const user = users.find(u => 
          u.name === name && 
          u.passcode === passcode && 
          u.role === 'student'
        );
        
        if (!user) {
          return this.error('Invalid name or passcode');
        }
        
        // Update last login time
        user.lastLoginAt = new Date().toISOString();
        this.saveToLocalStorage('investment_odyssey_users', users);
        
        // Save session
        this.saveSession(user.id, user.name, 'student', user.sectionId);
        
        return this.success(user);
      }
    } catch (error) {
      return this.error('Error logging in student', error);
    }
  }
  
  // Login a TA
  async loginTA(name, passcode) {
    try {
      // Validate inputs
      if (!name || !passcode) {
        return this.error('Name and passcode are required');
      }
      
      // Check if this is a known TA name
      const knownTAs = ['Akshay', 'Simran', 'Camilla', 'Hui Yann', 'Lars', 'Luorao'];
      const isKnownTA = knownTAs.includes(name);
      
      if (this.useFirebase) {
        // Get TA document
        const taDoc = await this.usersCollection.doc(name).get();
        
        if (taDoc.exists) {
          const taData = taDoc.data();
          
          // Check passcode
          if (taData.passcode !== passcode) {
            return this.error('Invalid passcode');
          }
          
          // Update last login time
          await this.usersCollection.doc(name).update({
            lastLoginAt: this.getServerTimestamp()
          });
          
          // Save session
          this.saveSession(taData.id || name, taData.name || name, 'ta', null);
          
          return this.success(taData);
        } else if (isKnownTA) {
          // Create TA on the fly for testing
          const generatedPasscode = this.generateTAPasscode(name);
          
          // Check if provided passcode matches generated one
          if (passcode !== generatedPasscode) {
            return this.error('Invalid passcode');
          }
          
          // Create TA document
          const taData = {
            id: name,
            name: name,
            passcode: generatedPasscode,
            role: 'ta',
            email: '',
            createdAt: this.getServerTimestamp(),
            lastLoginAt: this.getServerTimestamp()
          };
          
          await this.usersCollection.doc(name).set(taData);
          
          // Save session
          this.saveSession(name, name, 'ta', null);
          
          return this.success(taData);
        } else {
          return this.error('TA not found');
        }
      } else {
        // Fallback to localStorage
        const users = this.loadFromLocalStorage('investment_odyssey_users') || [];
        let taUser = users.find(u => u.name === name && u.role === 'ta');
        
        if (taUser) {
          // Check passcode
          if (taUser.passcode !== passcode) {
            return this.error('Invalid passcode');
          }
          
          // Update last login time
          taUser.lastLoginAt = new Date().toISOString();
          this.saveToLocalStorage('investment_odyssey_users', users);
          
          // Save session
          this.saveSession(taUser.id || name, taUser.name, 'ta', null);
          
          return this.success(taUser);
        } else if (isKnownTA) {
          // Create TA on the fly for testing
          const generatedPasscode = this.generateTAPasscode(name);
          
          // Check if provided passcode matches generated one
          if (passcode !== generatedPasscode) {
            return this.error('Invalid passcode');
          }
          
          // Create TA user
          const taData = {
            id: name,
            name: name,
            passcode: generatedPasscode,
            role: 'ta',
            email: '',
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString()
          };
          
          users.push(taData);
          this.saveToLocalStorage('investment_odyssey_users', users);
          
          // Save session
          this.saveSession(name, name, 'ta', null);
          
          return this.success(taData);
        } else {
          return this.error('TA not found');
        }
      }
    } catch (error) {
      return this.error('Error logging in TA', error);
    }
  }
  
  // Join a section
  async joinSection(userId, sectionId) {
    try {
      if (!userId || !sectionId) {
        return this.error('User ID and section ID are required');
      }
      
      if (this.useFirebase) {
        // Get section
        const sectionDoc = await this.sectionsCollection.doc(sectionId).get();
        
        if (!sectionDoc.exists) {
          return this.error('Section not found');
        }
        
        const sectionData = sectionDoc.data();
        
        // Update user's section
        await this.usersCollection.doc(userId).update({
          sectionId: sectionId
        });
        
        // Update session
        const userName = localStorage.getItem(this.USER_NAME_KEY);
        this.saveSession(userId, userName, 'student', sectionId);
        
        return this.success(sectionData);
      } else {
        // Fallback to localStorage
        const users = this.loadFromLocalStorage('investment_odyssey_users') || [];
        const sections = this.loadFromLocalStorage('investment_odyssey_sections') || [];
        
        const userIndex = users.findIndex(u => u.id === userId);
        const section = sections.find(s => s.id === sectionId);
        
        if (userIndex === -1) {
          return this.error('User not found');
        }
        
        if (!section) {
          return this.error('Section not found');
        }
        
        // Update user's section
        users[userIndex].sectionId = sectionId;
        this.saveToLocalStorage('investment_odyssey_users', users);
        
        // Update session
        const userName = localStorage.getItem(this.USER_NAME_KEY);
        this.saveSession(userId, userName, 'student', sectionId);
        
        return this.success(section);
      }
    } catch (error) {
      return this.error('Error joining section', error);
    }
  }
  
  // Leave a section
  async leaveSection(userId) {
    try {
      if (!userId) {
        return this.error('User ID is required');
      }
      
      if (this.useFirebase) {
        // Update user's section
        await this.usersCollection.doc(userId).update({
          sectionId: null
        });
        
        // Update session
        const userName = localStorage.getItem(this.USER_NAME_KEY);
        this.saveSession(userId, userName, 'student', null);
        
        return this.success();
      } else {
        // Fallback to localStorage
        const users = this.loadFromLocalStorage('investment_odyssey_users') || [];
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
          return this.error('User not found');
        }
        
        // Update user's section
        users[userIndex].sectionId = null;
        this.saveToLocalStorage('investment_odyssey_users', users);
        
        // Update session
        const userName = localStorage.getItem(this.USER_NAME_KEY);
        this.saveSession(userId, userName, 'student', null);
        
        return this.success();
      }
    } catch (error) {
      return this.error('Error leaving section', error);
    }
  }
  
  // Get current user
  getCurrentUser() {
    const userId = localStorage.getItem(this.USER_ID_KEY);
    const userName = localStorage.getItem(this.USER_NAME_KEY);
    const userRole = localStorage.getItem(this.USER_ROLE_KEY);
    const userSection = localStorage.getItem(this.USER_SECTION_KEY);
    
    if (!userId || !userName || !userRole) {
      return null;
    }
    
    return {
      id: userId,
      name: userName,
      role: userRole,
      sectionId: userSection
    };
  }
  
  // Check if user is logged in
  isLoggedIn() {
    return !!this.getCurrentUser();
  }
  
  // Check if user is a TA
  isTA() {
    const user = this.getCurrentUser();
    return user && user.role === 'ta';
  }
  
  // Check if user is a student
  isStudent() {
    const user = this.getCurrentUser();
    return user && user.role === 'student';
  }
  
  // Save session
  saveSession(userId, userName, userRole, sectionId) {
    localStorage.setItem(this.USER_ID_KEY, userId);
    localStorage.setItem(this.USER_NAME_KEY, userName);
    localStorage.setItem(this.USER_ROLE_KEY, userRole);
    
    if (sectionId) {
      localStorage.setItem(this.USER_SECTION_KEY, sectionId);
    } else {
      localStorage.removeItem(this.USER_SECTION_KEY);
    }
  }
  
  // Clear session
  logout() {
    localStorage.removeItem(this.USER_ID_KEY);
    localStorage.removeItem(this.USER_NAME_KEY);
    localStorage.removeItem(this.USER_ROLE_KEY);
    localStorage.removeItem(this.USER_SECTION_KEY);
  }
}

// Create and export singleton instance
const authService = new AuthService();
export default authService;
