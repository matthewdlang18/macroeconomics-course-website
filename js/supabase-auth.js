/**
 * Supabase Authentication Service for Economics Games
 * This file provides authentication functionality using Supabase
 */

// Initialize the SupabaseAuth object
const SupabaseAuth = {
    // Initialize the authentication system
    init: function() {
        console.log('Initializing Supabase Auth system...');

        // Check if Supabase is available
        if (typeof window.supabase !== 'undefined' && typeof window.supabase.from === 'function') {
            console.log('Supabase client already initialized');
            this.usingFallback = false;
            return this;
        } else {
            console.warn('Supabase client not available, using localStorage fallback');
            return this._initFallback();
        }
    },

    // Initialize fallback to localStorage
    _initFallback: function() {
        console.log('Using localStorage fallback for authentication');
        this.usingFallback = true;
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
            if (!this.usingFallback) {
                return await this._registerStudentSupabase(name, passcode);
            } else {
                return await this._registerStudentLocalStorage(name, passcode);
            }
        } catch (error) {
            console.error('Error in registerStudent:', error);

            // If Supabase fails, try localStorage as fallback
            if (!this.usingFallback) {
                console.log('Supabase registration failed, trying localStorage fallback');
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
            if (!this.usingFallback) {
                return await this._loginStudentSupabase(name, passcode);
            } else {
                return await this._loginStudentLocalStorage(name, passcode);
            }
        } catch (error) {
            console.error('Error in loginStudent:', error);

            // If Supabase fails, try localStorage as fallback
            if (!this.usingFallback) {
                console.log('Supabase login failed, trying localStorage fallback');
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



    // Private method: Register student with Supabase
    _registerStudentSupabase: async function(name, passcode) {
        // Generate a unique ID for the student
        const userId = this._generateUserId(name);

        try {
            // Check if student with same name already exists
            const { data: existingProfiles, error: queryError } = await window.supabase
                .from('profiles')
                .select('*')
                .eq('name', name)
                .eq('role', 'student');

            if (queryError) throw queryError;

            if (existingProfiles && existingProfiles.length > 0) {
                const existingStudent = existingProfiles[0];
                // If passcode matches, return success (essentially a login)
                if (existingStudent.passcode === passcode) {
                    // Store student info in local storage for session
                    localStorage.setItem('student_id', existingStudent.id);
                    localStorage.setItem('student_name', existingStudent.name);

                    // Update last login time
                    await window.supabase
                        .from('profiles')
                        .update({ last_login: new Date().toISOString() })
                        .eq('id', existingStudent.id);

                    return { success: true, data: existingStudent };
                } else {
                    return { success: false, error: "Student with this name already exists with a different passcode" };
                }
            }

            // Create student profile
            const { data: newProfile, error: insertError } = await window.supabase
                .from('profiles')
                .insert({
                    id: userId,
                    custom_id: userId,
                    name: name,
                    role: 'student',
                    passcode: passcode,
                    created_at: new Date().toISOString(),
                    last_login: new Date().toISOString()
                })
                .select()
                .single();

            if (insertError) throw insertError;

            // Store student info in local storage for session
            localStorage.setItem('student_id', newProfile.id);
            localStorage.setItem('student_name', newProfile.name);

            return { success: true, data: newProfile };
        } catch (error) {
            console.error('Supabase registration error:', error);
            throw error;
        }
    },

    // Private method: Login student with Supabase
    _loginStudentSupabase: async function(name, passcode) {
        try {
            // Find student with matching name and passcode
            const { data: profiles, error } = await window.supabase
                .from('profiles')
                .select('*')
                .eq('name', name)
                .eq('passcode', passcode)
                .eq('role', 'student');

            if (error) throw error;

            if (profiles && profiles.length > 0) {
                const student = profiles[0];

                // Update last login time
                await window.supabase
                    .from('profiles')
                    .update({ last_login: new Date().toISOString() })
                    .eq('id', student.id);

                // Store student info in local storage for session
                localStorage.setItem('student_id', student.id);
                localStorage.setItem('student_name', student.name);

                return { success: true, data: student };
            } else {
                return { success: false, error: "Invalid name or passcode" };
            }
        } catch (error) {
            console.error('Supabase login error:', error);
            throw error;
        }
    },

    // Private method: Register student with localStorage
    _registerStudentLocalStorage: async function(name, passcode) {
        // Generate a unique ID for the student
        const studentId = this._generateUserId(name);

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
    },

    // Generate a unique ID for a user
    _generateUserId: function(name) {
        return `${name.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    }
};

// Initialize SupabaseAuth when the script loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Auth system
    SupabaseAuth.init();

    // Make Auth available globally
    window.Auth = SupabaseAuth;

    console.log('Supabase Auth system initialized and ready');
});
