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

                    return { success: true, data };
                }

                // Fallback to empty array
                return { success: true, data: [] };
            } catch (error) {
                console.error('Error getting sections:', error);
                return { success: false, error: error.message || 'Error getting sections' };
            }
        }
    };

    // Initialize the service
    Service.init();

    // Make Service available globally
    window.Service = Service;
})();
