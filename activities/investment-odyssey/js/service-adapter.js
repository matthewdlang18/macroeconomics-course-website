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
        // Track availability of Supabase
        _supabaseAvailable: false,

        // Initialize the service
        init: function() {
            // Check if Supabase is available
            if (typeof window.supabase !== 'undefined' && typeof window.supabase.from === 'function') {
                this._supabaseAvailable = true;
                console.log('Supabase availability check:', 'Available');
            } else {
                console.warn('Supabase availability check:', 'Not available');
            }

            console.log('Service Adapter initialized:');
            console.log('- Supabase available:', this._supabaseAvailable);

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

                    // Debug: Log the raw data from Supabase
                    console.log('Raw sections data from Supabase:', JSON.stringify(data, null, 2));

                    // Format the sections for the UI
                    const formattedSections = data.map(section => {
                        // Get the day from the database or derive it
                        let dayAbbr = 'U';  // Default
                        let fullDay = 'Unknown';
                        let dayOrder = 6;  // Default (Unknown = 6)

                        // First, try to use the day field from the database
                        if (section.day) {
                            // Convert day to standard format
                            const dayMapping = {
                                // Full day names
                                'monday': { abbr: 'M', full: 'Monday', order: 1 },
                                'tuesday': { abbr: 'T', full: 'Tuesday', order: 2 },
                                'wednesday': { abbr: 'W', full: 'Wednesday', order: 3 },
                                'thursday': { abbr: 'R', full: 'Thursday', order: 4 },
                                'friday': { abbr: 'F', full: 'Friday', order: 5 },
                                // Abbreviations
                                'm': { abbr: 'M', full: 'Monday', order: 1 },
                                't': { abbr: 'T', full: 'Tuesday', order: 2 },
                                'w': { abbr: 'W', full: 'Wednesday', order: 3 },
                                'r': { abbr: 'R', full: 'Thursday', order: 4 },
                                'f': { abbr: 'F', full: 'Friday', order: 5 },
                                // Numbers (1-5 for Monday-Friday)
                                '1': { abbr: 'M', full: 'Monday', order: 1 },
                                '2': { abbr: 'T', full: 'Tuesday', order: 2 },
                                '3': { abbr: 'W', full: 'Wednesday', order: 3 },
                                '4': { abbr: 'R', full: 'Thursday', order: 4 },
                                '5': { abbr: 'F', full: 'Friday', order: 5 },
                                // Also map the abbreviations directly
                                'M': { abbr: 'M', full: 'Monday', order: 1 },
                                'T': { abbr: 'T', full: 'Tuesday', order: 2 },
                                'W': { abbr: 'W', full: 'Wednesday', order: 3 },
                                'R': { abbr: 'R', full: 'Thursday', order: 4 },
                                'F': { abbr: 'F', full: 'Friday', order: 5 }
                            };

                            // Try to match the day from the database
                            const dayKey = section.day.toString().toLowerCase();
                            if (dayMapping[dayKey]) {
                                dayAbbr = dayMapping[dayKey].abbr;
                                fullDay = dayMapping[dayKey].full;
                                dayOrder = dayMapping[dayKey].order;
                            } else {
                                // If we can't match directly, try to extract from the string
                                if (dayKey.includes('mon')) {
                                    dayAbbr = 'M';
                                    fullDay = 'Monday';
                                    dayOrder = 1;
                                } else if (dayKey.includes('tue')) {
                                    dayAbbr = 'T';
                                    fullDay = 'Tuesday';
                                    dayOrder = 2;
                                } else if (dayKey.includes('wed')) {
                                    dayAbbr = 'W';
                                    fullDay = 'Wednesday';
                                    dayOrder = 3;
                                } else if (dayKey.includes('thu')) {
                                    dayAbbr = 'R';
                                    fullDay = 'Thursday';
                                    dayOrder = 4;
                                } else if (dayKey.includes('fri')) {
                                    dayAbbr = 'F';
                                    fullDay = 'Friday';
                                    dayOrder = 5;
                                }
                            }
                        }

                        // If we still don't have a valid day, fall back to TA name and time pattern
                        if (dayAbbr === 'U') {
                            const taName = section.profiles?.name || '';
                            const timeSlot = section.time || '';

                            // Specific assignments based on the data we see in the screenshot
                            if (taName === 'Camilla' && timeSlot.includes('12:00pm-12:50pm')) {
                                dayAbbr = 'M';
                                fullDay = 'Monday';
                                dayOrder = 1;
                            } else if (taName === 'Simran' && timeSlot.includes('12:00pm-12:50pm')) {
                                dayAbbr = 'T';
                                fullDay = 'Tuesday';
                                dayOrder = 2;
                            } else if (taName === 'Lars' && timeSlot.includes('12:00pm-12:50pm')) {
                                dayAbbr = 'W';
                                fullDay = 'Wednesday';
                                dayOrder = 3;
                            } else if (taName === 'Hui Yann' && timeSlot.includes('12:00pm-12:50pm')) {
                                dayAbbr = 'R';
                                fullDay = 'Thursday';
                                dayOrder = 4;
                            } else if (timeSlot.includes('5:00pm-5:50pm')) {
                                // For the 5pm sections
                                if (taName === 'Akshay') {
                                    dayAbbr = 'M';
                                    fullDay = 'Monday';
                                    dayOrder = 1;
                                } else if (taName === 'Simran') {
                                    dayAbbr = 'T';
                                    fullDay = 'Tuesday';
                                    dayOrder = 2;
                                }
                            }
                        }

                        // Log the mapping for debugging
                        console.log(`Section ${section.id}: Original day "${section.day}" mapped to "${dayAbbr}" (${fullDay}) with order ${dayOrder}`);

                        return {
                            id: section.id,
                            day: dayAbbr,
                            fullDay: fullDay,
                            dayOrder: dayOrder,
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
            if (!day) return 'Unknown';

            // Normalize the day value
            const dayStr = day.toString().toLowerCase();

            // Map of day values to full names
            const dayMap = {
                // Abbreviations
                'm': 'Monday',
                't': 'Tuesday',
                'w': 'Wednesday',
                'r': 'Thursday',
                'f': 'Friday',
                // Full names
                'monday': 'Monday',
                'tuesday': 'Tuesday',
                'wednesday': 'Wednesday',
                'thursday': 'Thursday',
                'friday': 'Friday',
                // Numbers
                '1': 'Monday',
                '2': 'Tuesday',
                '3': 'Wednesday',
                '4': 'Thursday',
                '5': 'Friday'
            };

            // Try direct mapping
            if (dayMap[dayStr]) {
                return dayMap[dayStr];
            }

            // Try partial matching
            if (dayStr.includes('mon')) return 'Monday';
            if (dayStr.includes('tue')) return 'Tuesday';
            if (dayStr.includes('wed')) return 'Wednesday';
            if (dayStr.includes('thu')) return 'Thursday';
            if (dayStr.includes('fri')) return 'Friday';

            return 'Unknown';
        },

        // Helper method to get day abbreviation from full name or abbreviation
        _getDayAbbr: function(day) {
            if (!day) return 'U';

            // Normalize the day value
            const dayStr = day.toString().toLowerCase();

            // Map of day values to abbreviations
            const dayMap = {
                // Abbreviations
                'm': 'M',
                't': 'T',
                'w': 'W',
                'r': 'R',
                'f': 'F',
                // Full names
                'monday': 'M',
                'tuesday': 'T',
                'wednesday': 'W',
                'thursday': 'R',
                'friday': 'F',
                // Numbers
                '1': 'M',
                '2': 'T',
                '3': 'W',
                '4': 'R',
                '5': 'F'
            };

            // Try direct mapping
            if (dayMap[dayStr]) {
                return dayMap[dayStr];
            }

            // Try partial matching
            if (dayStr.includes('mon')) return 'M';
            if (dayStr.includes('tue')) return 'T';
            if (dayStr.includes('wed')) return 'W';
            if (dayStr.includes('thu')) return 'R';
            if (dayStr.includes('fri')) return 'F';

            return 'U';
        }
    };

    // Initialize the service
    Service.init();

    // Add TA-specific functions
    Service.getSectionsByTA = async function(taName) {
        try {
            if (!taName) {
                return { success: false, error: 'TA name is required' };
            }

            // Try to use Supabase
            if (this._supabaseAvailable) {
                console.log('Getting sections for TA:', taName);

                // First, get the TA's ID
                const { data: taData, error: taError } = await window.supabase
                    .from('profiles')
                    .select('id')
                    .eq('name', taName)
                    .eq('role', 'ta')
                    .single();

                if (taError) {
                    console.error('Error getting TA ID:', taError);

                    // Try a more lenient search without checking the role
                    console.log('Trying more lenient search for TA:', taName);
                    const { data: lenientData, error: lenientError } = await window.supabase
                        .from('profiles')
                        .select('id')
                        .eq('name', taName)
                        .single();

                    if (lenientError || !lenientData) {
                        console.error('Error in lenient search:', lenientError);
                        return { success: false, error: 'TA not found' };
                    }

                    // Use the lenient data instead
                    console.log('Found TA in lenient search:', lenientData);
                    return await this.getSectionsByTAId(lenientData.id);
                }

                if (!taData) {
                    console.error('TA not found:', taName);
                    return { success: false, error: 'TA not found' };
                }

                console.log('Found TA ID:', taData.id);

                // Now get the sections for this TA
                const { data: sections, error: sectionsError } = await window.supabase
                    .from('sections')
                    .select('*')
                    .eq('ta_id', taData.id)
                    .order('day')
                    .order('time');

                if (sectionsError) {
                    console.error('Error getting sections:', sectionsError);
                    return { success: false, error: sectionsError.message };
                }

                console.log('Found sections:', sections);
                return { success: true, data: sections };
            }

            // Fallback to default sections
            const defaultSections = [
                { id: '1', day: 'M', time: '10:00-11:30', location: 'Room 101', ta_id: 'ta_1' },
                { id: '2', day: 'T', time: '13:00-14:30', location: 'Room 102', ta_id: 'ta_1' },
                { id: '3', day: 'W', time: '15:00-16:30', location: 'Room 103', ta_id: 'ta_1' }
            ];
            console.log('Using default sections for TA:', taName);
            return { success: true, data: defaultSections };
        } catch (error) {
            console.error('Error getting sections by TA:', error);
            return { success: false, error: error.message || 'Error getting sections by TA' };
        }
    };

    Service.getActiveClassGame = async function(sectionId) {
        try {
            if (!sectionId) {
                return { success: false, error: 'Section ID is required' };
            }

            // Try to use Supabase
            if (this._supabaseAvailable) {
                console.log('Getting active class game for section:', sectionId);

                // First check if the game_sessions table exists
                try {
                    // First check if the table exists by doing a simple count query
                    const { count, error: countError } = await window.supabase
                        .from('game_sessions')
                        .select('*', { count: 'exact', head: true });

                    if (countError) {
                        console.warn('Error checking game_sessions table:', countError);
                        // Table might not exist or have the right structure, return null
                        return { success: true, data: null };
                    }

                    // If we get here, the table exists, so try to query it
                    const { data, error } = await window.supabase
                        .from('game_sessions')
                        .select('*')
                        .eq('section_id', sectionId);

                    if (error) {
                        console.error('Error getting game for section:', error);
                        return { success: true, data: null }; // Return null instead of error
                    }

                    // Filter for active games only
                    const activeGame = data && data.length > 0
                        ? data.find(game => game.status === 'active' || !game.status) // Include games without status for backward compatibility
                        : null;

                    // Return the active game found for this section, or null if none
                    return { success: true, data: activeGame };
                } catch (innerError) {
                    console.error('Error querying game_sessions:', innerError);
                    return { success: true, data: null }; // Return null instead of error
                }


            }

            // Fallback to null
            return { success: true, data: null };
        } catch (error) {
            console.error('Error getting active class game:', error);
            return { success: false, error: error.message || 'Error getting active class game' };
        }
    };

    Service.getSectionsByTAId = async function(taId) {
        try {
            if (!taId) {
                return { success: false, error: 'TA ID is required' };
            }

            // Try to use Supabase
            if (this._supabaseAvailable) {
                console.log('Getting sections for TA ID:', taId);

                // Get the sections for this TA
                const { data: sections, error: sectionsError } = await window.supabase
                    .from('sections')
                    .select('*')
                    .eq('ta_id', taId)
                    .order('day')
                    .order('time');

                if (sectionsError) {
                    console.error('Error getting sections:', sectionsError);
                    return { success: false, error: sectionsError.message };
                }

                console.log('Found sections for TA ID:', sections);
                return { success: true, data: sections };
            }

            // Fallback to default sections
            const defaultSections = [
                { id: '1', day: 'M', time: '10:00-11:30', location: 'Room 101', ta_id: taId },
                { id: '2', day: 'T', time: '13:00-14:30', location: 'Room 102', ta_id: taId },
                { id: '3', day: 'W', time: '15:00-16:30', location: 'Room 103', ta_id: taId }
            ];
            console.log('Using default sections for TA ID:', taId);
            return { success: true, data: defaultSections };
        } catch (error) {
            console.error('Error getting sections by TA ID:', error);
            return { success: false, error: error.message || 'Error getting sections by TA ID' };
        }
    };

    Service.getActiveClassGamesByTA = async function(taName) {
        try {
            if (!taName) {
                return { success: false, error: 'TA name is required' };
            }

            // Try to use Supabase
            if (this._supabaseAvailable) {
                console.log('Getting active class games for TA:', taName);

                // First, get the TA's sections
                const sectionsResult = await this.getSectionsByTA(taName);

                if (!sectionsResult.success || !sectionsResult.data || sectionsResult.data.length === 0) {
                    console.log('No sections found for TA:', taName);
                    return { success: true, data: [] };
                }

                // Get section IDs
                const sectionIds = sectionsResult.data.map(section => section.id);
                console.log('Section IDs:', sectionIds);

                // Get games for these sections - handle the case where the table might not exist
                try {
                    // First check if the table exists by doing a simple count query
                    const { count, error: countError } = await window.supabase
                        .from('game_sessions')
                        .select('*', { count: 'exact', head: true });

                    if (countError) {
                        console.warn('Error checking game_sessions table:', countError);
                        // Table might not exist or have the right structure, return empty array
                        return { success: true, data: [] };
                    }

                    // If we get here, the table exists, so try to query it
                    const { data: games, error: gamesError } = await window.supabase
                        .from('game_sessions')
                        .select('*');

                    if (gamesError) {
                        console.error('Error getting games:', gamesError);
                        return { success: true, data: [] }; // Return empty array instead of error
                    }

                    // Filter games by section IDs manually since the .in() operator might be causing issues
                    const filteredGames = games ? games.filter(game => sectionIds.includes(game.section_id)) : [];

                    console.log('Found games:', filteredGames);
                    return { success: true, data: filteredGames };
                } catch (innerError) {
                    console.error('Error querying game_sessions:', innerError);
                    return { success: true, data: [] }; // Return empty array instead of error
                }
            }

            // Fallback to empty array
            return { success: true, data: [] };
        } catch (error) {
            console.error('Error getting active class games by TA:', error);
            return { success: false, error: error.message || 'Error getting active class games by TA' };
        }
    };

    // Add functions for TA game management
    Service.getSection = async function(sectionId) {
        try {
            if (!sectionId) {
                return { success: false, error: 'Section ID is required' };
            }

            // Try to use Supabase
            if (this._supabaseAvailable) {
                console.log('Getting section details for:', sectionId);

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
                    .eq('id', sectionId)
                    .single();

                if (error) {
                    console.error('Error getting section:', error);
                    return { success: false, error: error.message };
                }

                if (!data) {
                    console.error('Section not found:', sectionId);
                    return { success: false, error: 'Section not found' };
                }

                // Format the section for the UI
                const formattedSection = {
                    id: data.id,
                    day: data.day,
                    time: data.time,
                    location: data.location,
                    ta: data.profiles?.name || 'Unknown'
                };

                console.log('Found section:', formattedSection);
                return { success: true, data: formattedSection };
            }

            // Fallback to finding section in currentSections
            const currentSections = this.currentSections || [];
            const section = currentSections.find(s => s.id === sectionId);

            if (section) {
                return { success: true, data: section };
            }

            return { success: false, error: 'Section not found' };
        } catch (error) {
            console.error('Error getting section:', error);
            return { success: false, error: error.message };
        }
    };

    Service.createClassGame = async function(sectionId, taName, day, time, maxRounds = 20) {
        try {
            if (!sectionId) {
                return { success: false, error: 'Section ID is required' };
            }

            // Try to use Supabase
            if (this._supabaseAvailable) {
                console.log('Creating class game for section:', sectionId);

                // First, check if the game_sessions table exists
                try {
                    const { count, error: countError } = await window.supabase
                        .from('game_sessions')
                        .select('*', { count: 'exact', head: true });

                    if (countError) {
                        console.warn('Error checking game_sessions table:', countError);
                        // Table might not exist, create a fallback game session
                        return createFallbackGameSession(sectionId, taName, day, time, maxRounds);
                    }

                    // Create a new game session - only include fields that are known to exist
                    const gameData = {
                        section_id: sectionId,
                        current_round: 0,
                        max_rounds: maxRounds,
                        status: 'active',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };

                    const { data, error } = await window.supabase
                        .from('game_sessions')
                        .insert(gameData)
                        .select()
                        .single();

                    if (error) {
                        console.error('Error creating game session:', error);
                        return createFallbackGameSession(sectionId, taName, day, time, maxRounds);
                    }

                    // Format the game session for the UI
                    const formattedGameSession = {
                        id: data.id,
                        sectionId: data.section_id,
                        taName: data.ta_name,
                        day: data.day,
                        time: data.time,
                        currentRound: data.current_round,
                        maxRounds: data.max_rounds,
                        playerCount: data.player_count,
                        createdAt: data.created_at,
                        updatedAt: data.updated_at
                    };

                    console.log('Created game session:', formattedGameSession);
                    return { success: true, data: formattedGameSession };
                } catch (innerError) {
                    console.error('Error creating game session:', innerError);
                    return createFallbackGameSession(sectionId, taName, day, time, maxRounds);
                }
            }

            // Fallback to creating a local game session
            return createFallbackGameSession(sectionId, taName, day, time, maxRounds);
        } catch (error) {
            console.error('Error creating class game:', error);
            return { success: false, error: error.message };
        }
    };

    // Helper function to create a fallback game session
    function createFallbackGameSession(sectionId, taName, day, time, maxRounds = 20) {
        try {
            // Create a fallback game session
            const gameSession = {
                id: 'local_' + Date.now(),
                sectionId: sectionId,
                taName: taName,
                day: day,
                time: time,
                currentRound: 0,
                maxRounds: maxRounds,
                playerCount: 0,
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            console.log('Created fallback game session:', gameSession);
            return { success: true, data: gameSession };
        } catch (error) {
            console.error('Error creating fallback game session:', error);
            return { success: false, error: error.message };
        }
    }

    Service.getClassGame = async function(gameId) {
        try {
            if (!gameId) {
                return { success: false, error: 'Game ID is required' };
            }

            // If it's a local game ID, return from localStorage
            if (gameId.startsWith('local_')) {
                // Try to get from localStorage
                const gameSessionsStr = localStorage.getItem('game_sessions');
                if (gameSessionsStr) {
                    const gameSessions = JSON.parse(gameSessionsStr);
                    const gameSession = gameSessions.find(g => g.id === gameId);
                    if (gameSession) {
                        return { success: true, data: gameSession };
                    }
                }
                return { success: false, error: 'Game not found' };
            }

            // Try to use Supabase
            if (this._supabaseAvailable) {
                console.log('Getting class game:', gameId);

                const { data, error } = await window.supabase
                    .from('game_sessions')
                    .select('*')
                    .eq('id', gameId)
                    .single();

                if (error) {
                    console.error('Error getting game session:', error);
                    return { success: false, error: error.message };
                }

                if (!data) {
                    console.error('Game not found:', gameId);
                    return { success: false, error: 'Game not found' };
                }

                // Format the game session for the UI
                const formattedGameSession = {
                    id: data.id,
                    sectionId: data.section_id,
                    taName: data.ta_name,
                    day: data.day,
                    time: data.time,
                    currentRound: data.current_round,
                    maxRounds: data.max_rounds,
                    playerCount: data.player_count,
                    createdAt: data.created_at,
                    updatedAt: data.updated_at
                };

                console.log('Found game session:', formattedGameSession);
                return { success: true, data: formattedGameSession };
            }

            return { success: false, error: 'Game not found' };
        } catch (error) {
            console.error('Error getting class game:', error);
            return { success: false, error: error.message };
        }
    };

    Service.advanceClassGameRound = async function(gameId) {
        try {
            if (!gameId) {
                return { success: false, error: 'Game ID is required' };
            }

            // If it's a local game ID, update in localStorage
            if (gameId.startsWith('local_')) {
                // Try to get from localStorage
                const gameSessionsStr = localStorage.getItem('game_sessions');
                if (gameSessionsStr) {
                    const gameSessions = JSON.parse(gameSessionsStr);
                    const gameSessionIndex = gameSessions.findIndex(g => g.id === gameId);
                    if (gameSessionIndex !== -1) {
                        // Update the game session
                        gameSessions[gameSessionIndex].currentRound++;
                        gameSessions[gameSessionIndex].updatedAt = new Date().toISOString();

                        // Save back to localStorage
                        localStorage.setItem('game_sessions', JSON.stringify(gameSessions));

                        return { success: true, data: gameSessions[gameSessionIndex] };
                    }
                }
                return { success: false, error: 'Game not found' };
            }

            // Try to use Supabase
            if (this._supabaseAvailable) {
                console.log('Advancing round for game:', gameId);

                // First get the current game
                const { data: currentGame, error: getError } = await window.supabase
                    .from('game_sessions')
                    .select('*')
                    .eq('id', gameId)
                    .single();

                if (getError) {
                    console.error('Error getting game session:', getError);
                    return { success: false, error: getError.message };
                }

                if (!currentGame) {
                    console.error('Game not found:', gameId);
                    return { success: false, error: 'Game not found' };
                }

                // Update the game session
                const { data, error } = await window.supabase
                    .from('game_sessions')
                    .update({
                        current_round: currentGame.current_round + 1,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', gameId)
                    .select()
                    .single();

                if (error) {
                    console.error('Error advancing round:', error);
                    return { success: false, error: error.message };
                }

                // Format the game session for the UI
                const formattedGameSession = {
                    id: data.id,
                    sectionId: data.section_id,
                    taName: data.ta_name,
                    day: data.day,
                    time: data.time,
                    currentRound: data.current_round,
                    maxRounds: data.max_rounds,
                    playerCount: data.player_count,
                    createdAt: data.created_at,
                    updatedAt: data.updated_at
                };

                console.log('Advanced round for game session:', formattedGameSession);
                return { success: true, data: formattedGameSession };
            }

            return { success: false, error: 'Failed to advance round' };
        } catch (error) {
            console.error('Error advancing round:', error);
            return { success: false, error: error.message };
        }
    };

    Service.joinClassGame = async function(gameId, studentId, studentName) {
        try {
            if (!gameId || !studentId || !studentName) {
                return { success: false, error: 'Game ID, student ID, and student name are required' };
            }

            console.log(`Joining class game ${gameId} as student ${studentName} (${studentId})`);

            // Try to use Supabase
            if (this._supabaseAvailable) {
                // First, check if the game_participants table exists
                try {
                    // Create a game_participants table if it doesn't exist
                    const { data, error } = await window.supabase
                        .from('game_participants')
                        .insert({
                            game_id: gameId,
                            student_id: studentId,
                            student_name: studentName,
                            portfolio_value: 10000, // Initial portfolio value
                            last_updated: new Date().toISOString()
                        })
                        .select();

                    if (error) {
                        // If the table doesn't exist or there's another error, log it but don't fail
                        console.warn('Error joining class game in Supabase:', error);
                        // Continue with fallback
                    } else {
                        console.log('Successfully joined class game in Supabase:', data);
                        return { success: true, data: data };
                    }
                } catch (innerError) {
                    console.error('Error joining class game:', innerError);
                    // Continue with fallback
                }
            }

            // Fallback to localStorage
            try {
                // Store participant info in localStorage
                const participantsKey = `game_participants_${gameId}`;
                let participants = [];

                const participantsStr = localStorage.getItem(participantsKey);
                if (participantsStr) {
                    participants = JSON.parse(participantsStr);
                }

                // Check if already joined
                const existingIndex = participants.findIndex(p => p.studentId === studentId);
                if (existingIndex !== -1) {
                    // Already joined, update last updated time
                    participants[existingIndex].lastUpdated = new Date().toISOString();
                } else {
                    // Add new participant
                    participants.push({
                        gameId: gameId,
                        studentId: studentId,
                        studentName: studentName,
                        portfolioValue: 10000,
                        lastUpdated: new Date().toISOString()
                    });
                }

                // Save back to localStorage
                localStorage.setItem(participantsKey, JSON.stringify(participants));

                console.log('Successfully joined class game using localStorage fallback');
                return { success: true };
            } catch (fallbackError) {
                console.error('Error with localStorage fallback:', fallbackError);
                return { success: false, error: fallbackError.message };
            }
        } catch (error) {
            console.error('Error joining class game:', error);
            return { success: false, error: error.message };
        }
    };

    Service.getGameParticipant = async function(gameId, studentId) {
        try {
            if (!gameId || !studentId) {
                return { success: false, error: 'Game ID and student ID are required' };
            }

            console.log(`Getting game participant for game ${gameId} and student ${studentId}`);

            // Try to use Supabase
            if (this._supabaseAvailable) {
                try {
                    const { data, error } = await window.supabase
                        .from('game_participants')
                        .select('*')
                        .eq('game_id', gameId)
                        .eq('student_id', studentId)
                        .single();

                    if (error) {
                        console.warn('Error getting game participant from Supabase:', error);
                        // Continue with fallback
                    } else if (data) {
                        console.log('Found game participant in Supabase:', data);
                        return { success: true, data: data };
                    }
                } catch (innerError) {
                    console.error('Error querying game_participants:', innerError);
                    // Continue with fallback
                }
            }

            // Fallback to localStorage
            try {
                const participantsKey = `game_participants_${gameId}`;
                const participantsStr = localStorage.getItem(participantsKey);

                if (participantsStr) {
                    const participants = JSON.parse(participantsStr);
                    const participant = participants.find(p => p.studentId === studentId);

                    if (participant) {
                        console.log('Found game participant in localStorage:', participant);
                        return { success: true, data: participant };
                    }
                }

                console.log('Game participant not found');
                return { success: true, data: null };
            } catch (fallbackError) {
                console.error('Error with localStorage fallback:', fallbackError);
                return { success: false, error: fallbackError.message };
            }
        } catch (error) {
            console.error('Error getting game participant:', error);
            return { success: false, error: error.message };
        }
    };

    Service.saveGameState = async function(gameId, studentId, studentName, gameState, playerState, totalValue) {
        try {
            if (!gameId || !studentId || !gameState || !playerState) {
                return { success: false, error: 'Game ID, student ID, game state, and player state are required' };
            }

            console.log(`Saving game state for game ${gameId} and student ${studentId}`);
            console.log('Total value:', totalValue);

            // Try to use Supabase
            if (this._supabaseAvailable) {
                try {
                    // First, update the game participant record with the latest portfolio value
                    const { data: participantData, error: participantError } = await window.supabase
                        .from('game_participants')
                        .upsert({
                            game_id: gameId,
                            student_id: studentId,
                            student_name: studentName,
                            portfolio_value: totalValue,
                            last_updated: new Date().toISOString()
                        })
                        .select();

                    if (participantError) {
                        console.warn('Error updating game participant in Supabase:', participantError);
                    } else {
                        console.log('Updated game participant in Supabase:', participantData);
                    }

                    // Now save the game state
                    // Note: We're not actually saving the full game state to Supabase to avoid overloading the database
                    // Instead, we're just updating the participant record with the portfolio value

                    return { success: true };
                } catch (innerError) {
                    console.error('Error saving game state to Supabase:', innerError);
                    // Continue with fallback
                }
            }

            // Fallback to localStorage
            try {
                // Update participant info
                const participantsKey = `game_participants_${gameId}`;
                let participants = [];

                const participantsStr = localStorage.getItem(participantsKey);
                if (participantsStr) {
                    participants = JSON.parse(participantsStr);
                }

                // Check if already joined
                const existingIndex = participants.findIndex(p => p.studentId === studentId);
                if (existingIndex !== -1) {
                    // Update existing participant
                    participants[existingIndex].portfolioValue = totalValue;
                    participants[existingIndex].lastUpdated = new Date().toISOString();
                } else {
                    // Add new participant
                    participants.push({
                        gameId: gameId,
                        studentId: studentId,
                        studentName: studentName,
                        portfolioValue: totalValue,
                        lastUpdated: new Date().toISOString()
                    });
                }

                // Save back to localStorage
                localStorage.setItem(participantsKey, JSON.stringify(participants));

                // Save game state
                const gameStateKey = `game_state_${gameId}_${studentId}`;
                localStorage.setItem(gameStateKey, JSON.stringify({
                    gameState: gameState,
                    playerState: playerState,
                    roundNumber: gameState.roundNumber
                }));

                console.log('Successfully saved game state using localStorage fallback');
                return { success: true };
            } catch (fallbackError) {
                console.error('Error with localStorage fallback:', fallbackError);
                return { success: false, error: fallbackError.message };
            }
        } catch (error) {
            console.error('Error saving game state:', error);
            return { success: false, error: error.message };
        }
    };

    Service.getGameState = async function(gameId, studentId) {
        try {
            if (!gameId || !studentId) {
                return { success: false, error: 'Game ID and student ID are required' };
            }

            console.log(`Getting game state for game ${gameId} and student ${studentId}`);

            // We're not actually storing full game states in Supabase to avoid overloading the database
            // Instead, we're just using localStorage for this

            // Try to get from localStorage
            try {
                const gameStateKey = `game_state_${gameId}_${studentId}`;
                const gameStateStr = localStorage.getItem(gameStateKey);

                if (gameStateStr) {
                    const savedState = JSON.parse(gameStateStr);
                    console.log('Found game state in localStorage:', savedState);
                    return { success: true, data: savedState };
                }

                console.log('Game state not found');
                return { success: true, data: null };
            } catch (fallbackError) {
                console.error('Error with localStorage:', fallbackError);
                return { success: false, error: fallbackError.message };
            }
        } catch (error) {
            console.error('Error getting game state:', error);
            return { success: false, error: error.message };
        }
    };

    Service.endClassGame = async function(gameId) {
        try {
            if (!gameId) {
                return { success: false, error: 'Game ID is required' };
            }

            // If it's a local game ID, update in localStorage
            if (gameId.startsWith('local_')) {
                // Try to get from localStorage
                const gameSessionsStr = localStorage.getItem('game_sessions');
                if (gameSessionsStr) {
                    const gameSessions = JSON.parse(gameSessionsStr);
                    const gameSessionIndex = gameSessions.findIndex(g => g.id === gameId);
                    if (gameSessionIndex !== -1) {
                        // Update the game session to max rounds
                        gameSessions[gameSessionIndex].currentRound = gameSessions[gameSessionIndex].maxRounds;
                        gameSessions[gameSessionIndex].updatedAt = new Date().toISOString();

                        // Save back to localStorage
                        localStorage.setItem('game_sessions', JSON.stringify(gameSessions));

                        return { success: true, data: gameSessions[gameSessionIndex] };
                    }
                }
                return { success: false, error: 'Game not found' };
            }

            // Try to use Supabase
            if (this._supabaseAvailable) {
                console.log('Ending game:', gameId);

                // First get the current game
                const { data: currentGame, error: getError } = await window.supabase
                    .from('game_sessions')
                    .select('*')
                    .eq('id', gameId)
                    .single();

                if (getError) {
                    console.error('Error getting game session:', getError);
                    return { success: false, error: getError.message };
                }

                if (!currentGame) {
                    console.error('Game not found:', gameId);
                    return { success: false, error: 'Game not found' };
                }

                // Update the game session to max rounds and set status to completed
                const { data, error } = await window.supabase
                    .from('game_sessions')
                    .update({
                        current_round: currentGame.max_rounds,
                        status: 'completed',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', gameId)
                    .select()
                    .single();

                if (error) {
                    console.error('Error ending game:', error);
                    return { success: false, error: error.message };
                }

                // Format the game session for the UI
                const formattedGameSession = {
                    id: data.id,
                    sectionId: data.section_id,
                    taName: data.ta_name,
                    day: data.day,
                    time: data.time,
                    currentRound: data.current_round,
                    maxRounds: data.max_rounds,
                    playerCount: data.player_count,
                    createdAt: data.created_at,
                    updatedAt: data.updated_at
                };

                console.log('Ended game session:', formattedGameSession);
                return { success: true, data: formattedGameSession };
            }

            return { success: false, error: 'Failed to end game' };
        } catch (error) {
            console.error('Error ending game:', error);
            return { success: false, error: error.message };
        }
    };

    // Make Service available globally
    window.Service = Service;
})();
