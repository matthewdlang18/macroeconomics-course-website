/**
 * Authentication Service for Investment Odyssey
 *
 * Handles user authentication, registration, and session management.
 */

import BaseService from './base-service.js';

class AuthService extends BaseService {
  constructor() {
    super();

    // Session keys
    this.USER_ID_KEY = 'investment_odyssey_user_id';
    this.USER_NAME_KEY = 'investment_odyssey_user_name';
    this.USER_ROLE_KEY = 'investment_odyssey_user_role';
    this.USER_SECTION_KEY = 'investment_odyssey_user_section';

    // Check for existing session
    this.initSession();
  }

  // Initialize session
  async initSession() {
    // Check if we have a session in localStorage
    const userId = localStorage.getItem(this.USER_ID_KEY);
    const userName = localStorage.getItem(this.USER_NAME_KEY);

    if (userId && userName) {
      console.log('Found existing session for user:', userName);

      // Check if we have a Supabase session
      const { data: { session } } = await this.supabase.auth.getSession();

      if (!session) {
        console.log('No Supabase session found, attempting to restore');
        // Try to restore the session with Supabase
        // This is a placeholder - in a real app, you'd need a proper auth flow
      }
    }
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

      // Generate a unique email for Supabase Auth
      // In a real app, you'd collect the student's email
      const email = `${name.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}@example.com`;

      // Check if student with same name already exists
      const { data: existingProfiles, error: checkError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('name', name)
        .eq('role', 'student');

      if (checkError) {
        return this.error('Error checking for existing student', checkError);
      }

      if (existingProfiles && existingProfiles.length > 0) {
        const existingProfile = existingProfiles[0];

        // If passcode matches, return success
        if (existingProfile.passcode === passcode) {
          // Save session
          this.saveSession(
            existingProfile.id,
            existingProfile.name,
            existingProfile.role,
            existingProfile.section_id
          );

          return this.success(existingProfile);
        } else {
          return this.error('Student with this name already exists with a different passcode');
        }
      }

      // For simplicity in this version, we'll create a profile without auth
      // In a production app, you'd use proper auth
      const userId = this.generateUserId(name);

      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .insert({
          id: userId,
          name: name,
          role: 'student',
          passcode: passcode,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (profileError) {
        // Fallback to localStorage if database operation fails
        const userData = {
          id: userId,
          name: name,
          passcode: passcode,
          role: 'student',
          section_id: null,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString()
        };

        // Save to localStorage as backup
        const users = this.loadFromLocalStorage('investment_odyssey_users') || [];
        users.push(userData);
        this.saveToLocalStorage('investment_odyssey_users', users);

        // Save session
        this.saveSession(userId, name, 'student', null);

        return this.success(userData);
      }

      // Save session
      this.saveSession(
        profile.id,
        profile.name,
        profile.role,
        profile.section_id
      );

      return this.success(profile);
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

      // Query for student with matching name and passcode
      const { data: profiles, error: queryError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('name', name)
        .eq('passcode', passcode)
        .eq('role', 'student');

      if (queryError) {
        return this.error('Error querying for student', queryError);
      }

      if (!profiles || profiles.length === 0) {
        // Try localStorage as fallback
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
        user.last_login = new Date().toISOString();
        this.saveToLocalStorage('investment_odyssey_users', users);

        // Save session
        this.saveSession(user.id, user.name, user.role, user.section_id);

        return this.success(user);
      }

      const profile = profiles[0];

      // Update last login time
      const { error: updateError } = await this.supabase
        .from('profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', profile.id);

      if (updateError) {
        console.warn('Error updating last login time', updateError);
      }

      // Save session
      this.saveSession(
        profile.id,
        profile.name,
        profile.role,
        profile.section_id
      );

      return this.success(profile);
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

      // Query for TA with matching name
      const { data: profiles, error: queryError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('name', name)
        .eq('role', 'ta');

      if (queryError) {
        return this.error('Error querying for TA', queryError);
      }

      if (profiles && profiles.length > 0) {
        const profile = profiles[0];

        // Check passcode
        if (profile.passcode !== passcode) {
          return this.error('Invalid passcode');
        }

        // Update last login time
        const { error: updateError } = await this.supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', profile.id);

        if (updateError) {
          console.warn('Error updating last login time', updateError);
        }

        // Save session
        this.saveSession(
          profile.id,
          profile.name,
          profile.role,
          null
        );

        return this.success(profile);
      } else if (isKnownTA) {
        // Create TA on the fly for testing
        const generatedPasscode = this.generateTAPasscode(name);

        // Check if provided passcode matches generated one
        if (passcode !== generatedPasscode) {
          return this.error('Invalid passcode');
        }

        // For simplicity in this version, we'll create a profile without auth
        // In a production app, you'd use proper auth
        const userId = this.generateUserId(name);

        const { data: profile, error: profileError } = await this.supabase
          .from('profiles')
          .insert({
            id: userId,
            name: name,
            role: 'ta',
            passcode: generatedPasscode,
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString()
          })
          .select()
          .single();

        if (profileError) {
          // Fallback to localStorage if database operation fails
          const taData = {
            id: userId,
            name: name,
            passcode: generatedPasscode,
            role: 'ta',
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString()
          };

          // Save to localStorage as backup
          const users = this.loadFromLocalStorage('investment_odyssey_users') || [];
          users.push(taData);
          this.saveToLocalStorage('investment_odyssey_users', users);

          // Save session
          this.saveSession(userId, name, 'ta', null);

          return this.success(taData);
        }

        // Save session
        this.saveSession(
          profile.id,
          profile.name,
          profile.role,
          null
        );

        return this.success(profile);
      } else {
        return this.error('TA not found');
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

      // Get section
      const { data: section, error: sectionError } = await this.supabase
        .from('sections')
        .select('*')
        .eq('id', sectionId)
        .single();

      if (sectionError) {
        return this.error('Section not found', sectionError);
      }

      // Update user's section
      const { error: updateError } = await this.supabase
        .from('profiles')
        .update({ section_id: sectionId })
        .eq('id', userId);

      if (updateError) {
        return this.error('Error updating user section', updateError);
      }

      // Update session
      const userName = localStorage.getItem(this.USER_NAME_KEY);
      const userRole = localStorage.getItem(this.USER_ROLE_KEY);
      this.saveSession(userId, userName, userRole, sectionId);

      return this.success(section);
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

      // Update user's section
      const { error: updateError } = await this.supabase
        .from('profiles')
        .update({ section_id: null })
        .eq('id', userId);

      if (updateError) {
        return this.error('Error updating user section', updateError);
      }

      // Update session
      const userName = localStorage.getItem(this.USER_NAME_KEY);
      const userRole = localStorage.getItem(this.USER_ROLE_KEY);
      this.saveSession(userId, userName, userRole, null);

      return this.success();
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
  async logout() {
    // Sign out from Supabase
    await this.supabase.auth.signOut().catch(error => {
      console.warn('Error signing out from Supabase:', error);
    });

    // Clear local session
    localStorage.removeItem(this.USER_ID_KEY);
    localStorage.removeItem(this.USER_NAME_KEY);
    localStorage.removeItem(this.USER_ROLE_KEY);
    localStorage.removeItem(this.USER_SECTION_KEY);

    return this.success();
  }
}

// Create and export singleton instance
const authService = new AuthService();
export default authService;
