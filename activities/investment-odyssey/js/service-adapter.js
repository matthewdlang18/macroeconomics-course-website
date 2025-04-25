/**
 * Service Adapter for Investment Odyssey
 *
 * This file provides a unified interface for accessing services,
 * whether they are available through the services/ directory or
 * through direct Supabase calls.
 */

// Initialize the Service Adapter
(function() {
    console.log('Service Adapter: Initializing...');

    // Check if Supabase is available
    if (typeof window.supabase !== 'undefined') {
        console.log('Service Adapter: Initializing Supabase with URL:', window.supabaseUrl);
    } else {
        console.warn('Service Adapter: Supabase library not available, will try to use it when it loads');
    }

    // Create the Service object
    const Service = {
        // Track availability of different backends
        _supabaseAvailable: false,
        _firebaseAvailable: false,

        // Initialize the service
        init: function() {
            // Check if Supabase is available
            if (typeof window.supabase !== 'undefined' && typeof window.supabase.from === 'function') {
                this._supabaseAvailable = true;
                console.log('Supabase availability check:', 'Available');
            } else {
                console.warn('Supabase availability check:', 'Not available');
            }

            // Check if Firebase is available (legacy)
            if (typeof window.firebase !== 'undefined') {
                this._firebaseAvailable = true;
                console.log('Firebase availability check:', 'Available');
            } else {
                console.log('Firebase availability check:', 'Not available');
            }

            console.log('Service Adapter initialized:');
            console.log('- Supabase available:', this._supabaseAvailable);
            console.log('- Firebase available:', this._firebaseAvailable);

            return this;
        },

        // Join a section
        joinSection: async function(sectionId) {
            try {
                if (!sectionId) {
                    return { success: false, error: 'Section ID is required' };
                }

                // Get current user
                const currentUser = window.Auth ? window.Auth.getCurrentUser() : null;
                const userId = currentUser ? currentUser.id : localStorage.getItem('student_id');

                if (!userId) {
                    return { success: false, error: 'User ID is required' };
                }

                // Try to use Supabase
                if (this._supabaseAvailable) {
                    const { error } = await window.supabase
                        .from('profiles')
                        .update({ section_id: sectionId })
                        .eq('id', userId);

                    if (error) {
                        console.error('Error joining section:', error);
                        return { success: false, error: error.message || 'Error joining section' };
                    }

                    return { success: true };
                }

                // Fallback to localStorage only
                localStorage.setItem('section_id', sectionId);
                return { success: true };
            } catch (error) {
                console.error('Error joining section:', error);
                return { success: false, error: error.message || 'Error joining section' };
            }
        },

        // Get all sections
        getAllSections: async function() {
            try {
                // Try to use Supabase
                if (this._supabaseAvailable) {
                    const { data, error } = await window.supabase
                        .from('sections')
                        .select(`
                            id,
                            day,
                            time,
                            location,
                            ta_id,
                            profiles:ta_id (name)
                        `)
                        .order('day')
                        .order('time');

                    if (error) {
                        console.error('Error getting sections:', error);
                        return { success: false, error: error.message || 'Error getting sections' };
                    }

                    // Format the sections for the UI
                    const formattedSections = data.map(section => {
                        // Handle both abbreviation and full day name formats
                        const dayAbbr = this._getDayAbbr(section.day);
                        const fullDay = this._getDayName(section.day);

                        return {
                            id: section.id,
                            day: dayAbbr, // Always use abbreviation for internal use
                            fullDay: fullDay, // Always use full name for display
                            time: section.time,
                            location: section.location,
                            ta: section.profiles?.name || 'Unknown'
                        };
                    });

                    console.log('Formatted sections:', formattedSections);
                    return { success: true, data: formattedSections };
                }

                // Fallback to default sections
                const defaultSections = [
                    { id: '1', day: 'M', fullDay: 'Monday', time: '10:00-11:30', location: 'Room 101', ta: 'Akshay' },
                    { id: '2', day: 'T', fullDay: 'Tuesday', time: '13:00-14:30', location: 'Room 102', ta: 'Simran' },
                    { id: '3', day: 'W', fullDay: 'Wednesday', time: '15:00-16:30', location: 'Room 103', ta: 'Camilla' },
                    { id: '4', day: 'R', fullDay: 'Thursday', time: '10:00-11:30', location: 'Room 104', ta: 'Hui Yann' },
                    { id: '5', day: 'F', fullDay: 'Friday', time: '13:00-14:30', location: 'Room 105', ta: 'Lars' }
                ];
                console.log('Using default sections:', defaultSections);
                return { success: true, data: defaultSections };
            } catch (error) {
                console.error('Error getting sections:', error);
                return { success: false, error: error.message || 'Error getting sections' };
            }
        },

        // Get student data
        getStudent: async function(studentId) {
            try {
                if (!studentId) {
                    return { success: false, error: 'Student ID is required' };
                }

                // Try to use Supabase
                if (this._supabaseAvailable) {
                    const { data, error } = await window.supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', studentId)
                        .single();

                    if (error) {
                        console.error('Error getting student:', error);
                        return { success: false, error: error.message || 'Error getting student' };
                    }

                    return {
                        success: true,
                        data: {
                            id: data.id,
                            name: data.name,
                            role: data.role,
                            sectionId: data.section_id
                        }
                    };
                }

                // Fallback to localStorage
                const studentName = localStorage.getItem('student_name');
                const sectionId = localStorage.getItem('section_id');

                if (studentName) {
                    return {
                        success: true,
                        data: {
                            id: studentId,
                            name: studentName,
                            role: 'student',
                            sectionId: sectionId
                        }
                    };
                }

                return { success: false, error: 'Student not found' };
            } catch (error) {
                console.error('Error getting student:', error);
                return { success: false, error: error.message || 'Error getting student' };
            }
        },

        // Assign student to section
        assignStudentToSection: async function(studentId, sectionId) {
            try {
                if (!studentId || !sectionId) {
                    return { success: false, error: 'Student ID and section ID are required' };
                }

                // Try to use Supabase
                if (this._supabaseAvailable) {
                    const { data, error } = await window.supabase
                        .from('profiles')
                        .update({ section_id: sectionId })
                        .eq('id', studentId)
                        .select()
                        .single();

                    if (error) {
                        console.error('Error assigning student to section:', error);
                        return { success: false, error: error.message || 'Error assigning student to section' };
                    }

                    // Also update localStorage for compatibility
                    localStorage.setItem('section_id', sectionId);

                    // Get section details to save section name
                    const sectionsResult = await this.getAllSections();
                    if (sectionsResult.success) {
                        const section = sectionsResult.data.find(s => s.id === sectionId);
                        if (section) {
                            localStorage.setItem('section_name', `${section.fullDay} ${section.time} (${section.ta})`);
                        }
                    }

                    return {
                        success: true,
                        data: {
                            id: data.id,
                            name: data.name,
                            role: data.role,
                            sectionId: data.section_id
                        }
                    };
                }

                // Fallback to localStorage
                localStorage.setItem('section_id', sectionId);

                // Get section details to save section name
                const sectionsResult = await this.getAllSections();
                if (sectionsResult.success) {
                    const section = sectionsResult.data.find(s => s.id === sectionId);
                    if (section) {
                        localStorage.setItem('section_name', `${section.fullDay} ${section.time} (${section.ta})`);
                    }
                }

                return {
                    success: true,
                    data: {
                        id: studentId,
                        name: localStorage.getItem('student_name'),
                        role: 'student',
                        sectionId: sectionId
                    }
                };
            } catch (error) {
                console.error('Error assigning student to section:', error);
                return { success: false, error: error.message || 'Error assigning student to section' };
            }
        },

        // Helper method to get full day name from abbreviation or full name
        _getDayName: function(day) {
            const dayMap = {
                'M': 'Monday',
                'T': 'Tuesday',
                'W': 'Wednesday',
                'R': 'Thursday',
                'F': 'Friday',
                'Monday': 'Monday',
                'Tuesday': 'Tuesday',
                'Wednesday': 'Wednesday',
                'Thursday': 'Thursday',
                'Friday': 'Friday'
            };

            return dayMap[day] || 'Unknown';
        },

        // Helper method to get day abbreviation from full name or abbreviation
        _getDayAbbr: function(day) {
            const dayMap = {
                'M': 'M',
                'T': 'T',
                'W': 'W',
                'R': 'R',
                'F': 'F',
                'Monday': 'M',
                'Tuesday': 'T',
                'Wednesday': 'W',
                'Thursday': 'R',
                'Friday': 'F'
            };

            return dayMap[day] || 'U';
        }
    };

    // Initialize the service
    Service.init();

    // Make Service available globally
    window.Service = Service;
})();
