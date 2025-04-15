/**
 * Section Service for Investment Odyssey
 * 
 * Handles TA sections, including creation, retrieval, and management.
 */

import BaseService from './base-service.js';
import authService from './auth-service.js';

class SectionService extends BaseService {
  constructor() {
    super();
    
    // Collections
    this.sectionsCollection = this.getCollection('sections');
    this.usersCollection = this.getCollection('users');
  }
  
  // Get all sections
  async getAllSections() {
    try {
      if (this.useFirebase) {
        const snapshot = await this.sectionsCollection.orderBy('day').orderBy('time').get();
        const sections = [];
        
        snapshot.forEach(doc => {
          sections.push(doc.data());
        });
        
        return this.success(sections);
      } else {
        // Fallback to localStorage
        const sections = this.loadFromLocalStorage('investment_odyssey_sections') || [];
        
        // Sort sections by day and time
        sections.sort((a, b) => {
          const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
          const dayA = days.indexOf(a.day);
          const dayB = days.indexOf(b.day);
          
          if (dayA !== dayB) {
            return dayA - dayB;
          }
          
          return a.time.localeCompare(b.time);
        });
        
        return this.success(sections);
      }
    } catch (error) {
      return this.error('Error getting sections', error);
    }
  }
  
  // Get sections by TA
  async getSectionsByTA(taName) {
    try {
      if (!taName) {
        return this.error('TA name is required');
      }
      
      if (this.useFirebase) {
        const snapshot = await this.sectionsCollection
          .where('ta', '==', taName)
          .orderBy('day')
          .orderBy('time')
          .get();
        
        const sections = [];
        
        snapshot.forEach(doc => {
          sections.push(doc.data());
        });
        
        return this.success(sections);
      } else {
        // Fallback to localStorage
        const sections = this.loadFromLocalStorage('investment_odyssey_sections') || [];
        const taSections = sections.filter(s => s.ta === taName);
        
        // Sort sections by day and time
        taSections.sort((a, b) => {
          const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
          const dayA = days.indexOf(a.day);
          const dayB = days.indexOf(b.day);
          
          if (dayA !== dayB) {
            return dayA - dayB;
          }
          
          return a.time.localeCompare(b.time);
        });
        
        return this.success(taSections);
      }
    } catch (error) {
      return this.error('Error getting sections by TA', error);
    }
  }
  
  // Get a section by ID
  async getSection(sectionId) {
    try {
      if (!sectionId) {
        return this.error('Section ID is required');
      }
      
      if (this.useFirebase) {
        const doc = await this.sectionsCollection.doc(sectionId).get();
        
        if (!doc.exists) {
          return this.error('Section not found');
        }
        
        return this.success(doc.data());
      } else {
        // Fallback to localStorage
        const sections = this.loadFromLocalStorage('investment_odyssey_sections') || [];
        const section = sections.find(s => s.id === sectionId);
        
        if (!section) {
          return this.error('Section not found');
        }
        
        return this.success(section);
      }
    } catch (error) {
      return this.error('Error getting section', error);
    }
  }
  
  // Create a section
  async createSection(taName, day, time, location) {
    try {
      if (!taName || !day || !time) {
        return this.error('TA name, day, and time are required');
      }
      
      // Generate section ID
      const sectionId = `${taName.replace(/\s+/g, '_')}_${day}_${time.replace(/:/g, '')}_${Date.now()}`;
      
      const sectionData = {
        id: sectionId,
        ta: taName,
        day: day,
        time: time,
        location: location || 'TBD',
        createdAt: this.useFirebase ? this.getServerTimestamp() : new Date().toISOString()
      };
      
      if (this.useFirebase) {
        await this.sectionsCollection.doc(sectionId).set(sectionData);
      } else {
        // Fallback to localStorage
        const sections = this.loadFromLocalStorage('investment_odyssey_sections') || [];
        sections.push(sectionData);
        this.saveToLocalStorage('investment_odyssey_sections', sections);
      }
      
      return this.success(sectionData);
    } catch (error) {
      return this.error('Error creating section', error);
    }
  }
  
  // Update a section
  async updateSection(sectionId, updates) {
    try {
      if (!sectionId) {
        return this.error('Section ID is required');
      }
      
      if (this.useFirebase) {
        // Add updatedAt timestamp
        updates.updatedAt = this.getServerTimestamp();
        
        await this.sectionsCollection.doc(sectionId).update(updates);
        
        // Get updated section
        const doc = await this.sectionsCollection.doc(sectionId).get();
        
        return this.success(doc.data());
      } else {
        // Fallback to localStorage
        const sections = this.loadFromLocalStorage('investment_odyssey_sections') || [];
        const sectionIndex = sections.findIndex(s => s.id === sectionId);
        
        if (sectionIndex === -1) {
          return this.error('Section not found');
        }
        
        // Add updatedAt timestamp
        updates.updatedAt = new Date().toISOString();
        
        // Update section
        sections[sectionIndex] = {
          ...sections[sectionIndex],
          ...updates
        };
        
        this.saveToLocalStorage('investment_odyssey_sections', sections);
        
        return this.success(sections[sectionIndex]);
      }
    } catch (error) {
      return this.error('Error updating section', error);
    }
  }
  
  // Delete a section
  async deleteSection(sectionId) {
    try {
      if (!sectionId) {
        return this.error('Section ID is required');
      }
      
      if (this.useFirebase) {
        // First, update all users in this section
        const usersSnapshot = await this.usersCollection
          .where('sectionId', '==', sectionId)
          .get();
        
        const batch = this.db.batch();
        
        usersSnapshot.forEach(doc => {
          batch.update(doc.ref, { sectionId: null });
        });
        
        // Delete the section
        batch.delete(this.sectionsCollection.doc(sectionId));
        
        await batch.commit();
        
        return this.success();
      } else {
        // Fallback to localStorage
        const sections = this.loadFromLocalStorage('investment_odyssey_sections') || [];
        const users = this.loadFromLocalStorage('investment_odyssey_users') || [];
        
        // Update users
        const updatedUsers = users.map(user => {
          if (user.sectionId === sectionId) {
            return { ...user, sectionId: null };
          }
          return user;
        });
        
        // Remove section
        const updatedSections = sections.filter(s => s.id !== sectionId);
        
        this.saveToLocalStorage('investment_odyssey_users', updatedUsers);
        this.saveToLocalStorage('investment_odyssey_sections', updatedSections);
        
        return this.success();
      }
    } catch (error) {
      return this.error('Error deleting section', error);
    }
  }
  
  // Get students in a section
  async getStudentsInSection(sectionId) {
    try {
      if (!sectionId) {
        return this.error('Section ID is required');
      }
      
      if (this.useFirebase) {
        const snapshot = await this.usersCollection
          .where('sectionId', '==', sectionId)
          .where('role', '==', 'student')
          .orderBy('name')
          .get();
        
        const students = [];
        
        snapshot.forEach(doc => {
          students.push(doc.data());
        });
        
        return this.success(students);
      } else {
        // Fallback to localStorage
        const users = this.loadFromLocalStorage('investment_odyssey_users') || [];
        const sectionStudents = users.filter(u => 
          u.sectionId === sectionId && 
          u.role === 'student'
        );
        
        // Sort by name
        sectionStudents.sort((a, b) => a.name.localeCompare(b.name));
        
        return this.success(sectionStudents);
      }
    } catch (error) {
      return this.error('Error getting students in section', error);
    }
  }
  
  // Initialize default sections
  async initializeDefaultSections() {
    try {
      // Check if we already have sections
      const sectionsResult = await this.getAllSections();
      
      if (sectionsResult.success && sectionsResult.data.length > 0) {
        console.log('Sections already exist, skipping initialization');
        return this.success(sectionsResult.data);
      }
      
      // Default TA sections
      const defaultSections = [
        { ta: 'Akshay', day: 'Monday', time: '10:00 AM', location: 'Room 101' },
        { ta: 'Akshay', day: 'Monday', time: '11:00 AM', location: 'Room 101' },
        { ta: 'Simran', day: 'Tuesday', time: '1:00 PM', location: 'Room 102' },
        { ta: 'Simran', day: 'Tuesday', time: '2:00 PM', location: 'Room 102' },
        { ta: 'Camilla', day: 'Wednesday', time: '9:00 AM', location: 'Room 103' },
        { ta: 'Hui Yann', day: 'Thursday', time: '3:00 PM', location: 'Room 104' },
        { ta: 'Lars', day: 'Friday', time: '12:00 PM', location: 'Room 105' },
        { ta: 'Luorao', day: 'Friday', time: '4:00 PM', location: 'Room 106' }
      ];
      
      const createdSections = [];
      
      // Create each section
      for (const section of defaultSections) {
        const result = await this.createSection(
          section.ta,
          section.day,
          section.time,
          section.location
        );
        
        if (result.success) {
          createdSections.push(result.data);
        }
      }
      
      return this.success(createdSections);
    } catch (error) {
      return this.error('Error initializing default sections', error);
    }
  }
}

// Create and export singleton instance
const sectionService = new SectionService();
export default sectionService;
