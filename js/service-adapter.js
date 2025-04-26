/**
 * Service Adapter for Investment Odyssey
 *
 * This adapter provides a unified interface for Supabase services.
 * It detects if Supabase is available and uses it, with localStorage as fallback.
 */

// Initialize Supabase with the correct credentials from windsurf-project
(function initializeSupabase() {
    // Supabase URL and key from windsurf-project
    const SUPABASE_URL = 'https://bvvkevmqnnlecghyraao.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2dmtldm1xbm5sZWNnaHlyYWFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MDAzNDEsImV4cCI6MjA2MDQ3NjM0MX0.UY_H91jIbbZWq6A-l7XbdyF6s3rSoBVcJfawhZ2CyVg';

    console.log('Service Adapter: Initializing Supabase with URL:', SUPABASE_URL);

    // Make these available as window variables
    window.supabaseUrl = SUPABASE_URL;
    window.supabaseKey = SUPABASE_ANON_KEY;

    // Initialize Supabase client if the library is available
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Service Adapter: Supabase client initialized successfully');
    } else {
        console.warn('Service Adapter: Supabase library not available, will try to use it when it loads');
    }
})();

// Service adapter
const Service = (function() {
    // Check if Supabase is available
    let isSupabaseAvailable = false;
    try {
        isSupabaseAvailable = typeof window.supabase !== 'undefined' &&
                             typeof window.supabase.from === 'function';
        console.log('Supabase availability check:', isSupabaseAvailable ? 'Available' : 'Not available');

        // If Supabase is not available, show an error message
        if (!isSupabaseAvailable) {
            const errorDiv = document.createElement('div');
            errorDiv.style.position = 'fixed';
            errorDiv.style.top = '0';
            errorDiv.style.left = '0';
            errorDiv.style.right = '0';
            errorDiv.style.backgroundColor = '#f44336';
            errorDiv.style.color = 'white';
            errorDiv.style.padding = '15px';
            errorDiv.style.textAlign = 'center';
            errorDiv.style.zIndex = '9999';
            errorDiv.innerHTML = `
                <strong>Error:</strong> Cannot connect to Supabase database.
                The game requires a connection to Supabase to function properly.
                <button onclick="this.parentNode.style.display='none'" style="margin-left: 15px; padding: 5px 10px; background: white; color: #f44336; border: none; cursor: pointer;">
                    Dismiss
                </button>
            `;
            document.body.appendChild(errorDiv);
            console.error('Supabase is not available. The game requires a connection to Supabase.');
        }
    } catch (e) {
        console.warn('Error checking Supabase availability:', e);
    }

    console.log('Service Adapter initialized:');
    console.log('- Supabase available:', isSupabaseAvailable);

    // Get student data
    async function getStudent(studentId) {
        if (isSupabaseAvailable) {
            try {
                // Check if Supabase client is available and properly initialized
                if (!window.supabase || !window.supabase.from) {
                    console.warn('Supabase client not properly initialized, using localStorage fallback');
                    return getStudentFromLocalStorage(studentId);
                }

                const { data, error } = await window.supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', studentId)
                    .single();

                if (error) {
                    console.warn('Supabase error:', error);
                    return getStudentFromLocalStorage(studentId);
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
            } catch (error) {
                console.error('Supabase error getting student:', error);
                return getStudentFromLocalStorage(studentId);
            }
        } else {
            return getStudentFromLocalStorage(studentId);
        }
    }

    // Get student from localStorage
    function getStudentFromLocalStorage(studentId) {
        try {
            // Get student from localStorage
            const students = JSON.parse(localStorage.getItem('students') || '[]');
            const student = students.find(s => s.id === studentId);

            if (student) {
                return {
                    success: true,
                    data: {
                        id: student.id,
                        name: student.name,
                        role: 'student',
                        sectionId: student.sectionId
                    }
                };
            } else {
                // If student not found in localStorage, check if we have the current student in session
                const currentStudentId = localStorage.getItem('student_id');
                const currentStudentName = localStorage.getItem('student_name');

                if (currentStudentId === studentId && currentStudentName) {
                    return {
                        success: true,
                        data: {
                            id: currentStudentId,
                            name: currentStudentName,
                            role: 'student',
                            sectionId: null
                        }
                    };
                }

                return {
                    success: false,
                    error: 'Student not found in localStorage'
                };
            }
        } catch (error) {
            console.error('Error getting student from localStorage:', error);
            return { success: false, error: error.message };
        }
    }



    // Get all sections
    async function getAllSections() {
        if (isSupabaseAvailable) {
            try {
                // Check if Supabase client is available and properly initialized
                if (!window.supabase || !window.supabase.from) {
                    console.warn('Supabase client not properly initialized, using localStorage fallback');
                    return getAllSectionsFromLocalStorage();
                }

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
                    console.warn('Supabase error:', error);
                    return getAllSectionsFromLocalStorage();
                }

                // Format the sections for the UI
                const formattedSections = data.map(section => ({
                    id: section.id,
                    day: section.day,
                    time: section.time,
                    location: section.location,
                    ta: section.profiles?.name || 'Unknown'
                }));

                return {
                    success: true,
                    data: formattedSections
                };
            } catch (error) {
                console.error('Supabase error getting sections:', error);
                return getAllSectionsFromLocalStorage();
            }
        } else {
            return getAllSectionsFromLocalStorage();
        }
    }

    // Get all sections from localStorage
    function getAllSectionsFromLocalStorage() {
        try {
            // Get sections from localStorage
            const sections = JSON.parse(localStorage.getItem('sections') || '[]');

            // If no sections in localStorage, return default sections
            if (sections.length === 0) {
                const defaultSections = [
                    { id: 'section_1', day: 'Monday', time: '10:00 AM', location: 'Room 101', ta: 'Akshay' },
                    { id: 'section_2', day: 'Tuesday', time: '2:00 PM', location: 'Room 102', ta: 'Simran' },
                    { id: 'section_3', day: 'Wednesday', time: '11:00 AM', location: 'Room 103', ta: 'Camilla' },
                    { id: 'section_4', day: 'Thursday', time: '3:00 PM', location: 'Room 104', ta: 'Hui Yann' },
                    { id: 'section_5', day: 'Friday', time: '1:00 PM', location: 'Room 105', ta: 'Lars' },
                    { id: 'section_6', day: 'Friday', time: '4:00 PM', location: 'Room 106', ta: 'Luorao' }
                ];

                // Save default sections to localStorage
                localStorage.setItem('sections', JSON.stringify(defaultSections));

                return {
                    success: true,
                    data: defaultSections
                };
            }

            return {
                success: true,
                data: sections
            };
        } catch (error) {
            console.error('Error getting sections from localStorage:', error);
            return { success: false, error: error.message };
        }
    }



    // Assign student to section
    async function assignStudentToSection(studentId, sectionId) {
        if (isSupabaseAvailable) {
            try {
                // Check if Supabase client is available and properly initialized
                if (!window.supabase || !window.supabase.from) {
                    console.warn('Supabase client not properly initialized, using localStorage fallback');
                    return assignStudentToSectionInLocalStorage(studentId, sectionId);
                }

                // Update the student's section
                const { data, error } = await window.supabase
                    .from('profiles')
                    .update({ section_id: sectionId })
                    .eq('id', studentId)
                    .select()
                    .single();

                if (error) {
                    console.warn('Supabase error:', error);
                    return assignStudentToSectionInLocalStorage(studentId, sectionId);
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
            } catch (error) {
                console.error('Supabase error assigning student to section:', error);
                return assignStudentToSectionInLocalStorage(studentId, sectionId);
            }
        } else {
            return assignStudentToSectionInLocalStorage(studentId, sectionId);
        }
    }

    // Assign student to section in localStorage
    function assignStudentToSectionInLocalStorage(studentId, sectionId) {
        try {
            // Get student from localStorage
            const students = JSON.parse(localStorage.getItem('students') || '[]');
            const studentIndex = students.findIndex(s => s.id === studentId);

            if (studentIndex !== -1) {
                // Update student's section
                students[studentIndex].sectionId = sectionId;
                localStorage.setItem('students', JSON.stringify(students));

                // Also update the current session if this is the logged-in student
                if (localStorage.getItem('student_id') === studentId) {
                    localStorage.setItem('section_id', sectionId);

                    // Get section name if available
                    const sections = JSON.parse(localStorage.getItem('sections') || '[]');
                    const section = sections.find(s => s.id === sectionId);
                    if (section) {
                        localStorage.setItem('section_name', `${section.day} ${section.time}`);
                    }
                }

                return {
                    success: true,
                    data: {
                        id: students[studentIndex].id,
                        name: students[studentIndex].name,
                        role: 'student',
                        sectionId: sectionId
                    }
                };
            } else {
                // If student not found in localStorage, check if we have the current student in session
                const currentStudentId = localStorage.getItem('student_id');
                const currentStudentName = localStorage.getItem('student_name');

                if (currentStudentId === studentId && currentStudentName) {
                    // Update the current session
                    localStorage.setItem('section_id', sectionId);

                    // Get section name if available
                    const sections = JSON.parse(localStorage.getItem('sections') || '[]');
                    const section = sections.find(s => s.id === sectionId);
                    if (section) {
                        localStorage.setItem('section_name', `${section.day} ${section.time}`);
                    }

                    // Add student to localStorage
                    const newStudent = {
                        id: currentStudentId,
                        name: currentStudentName,
                        role: 'student',
                        sectionId: sectionId,
                        createdAt: new Date().toISOString(),
                        lastLoginAt: new Date().toISOString()
                    };

                    students.push(newStudent);
                    localStorage.setItem('students', JSON.stringify(students));

                    return {
                        success: true,
                        data: {
                            id: currentStudentId,
                            name: currentStudentName,
                            role: 'student',
                            sectionId: sectionId
                        }
                    };
                }

                return {
                    success: false,
                    error: 'Student not found in localStorage'
                };
            }
        } catch (error) {
            console.error('Error assigning student to section in localStorage:', error);
            return { success: false, error: error.message };
        }
    }



    // Return the public API
    return {
        getStudent,
        getAllSections,
        assignStudentToSection
    };
})();

// Make Service available globally
window.Service = Service;
