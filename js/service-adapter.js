/**
 * Service Adapter for Investment Odyssey
 *
 * This adapter provides a unified interface for both Firebase and Supabase services.
 * It detects which backend is available and uses the appropriate one.
 */

// Service adapter
const Service = (function() {
    // Check if Supabase is available
    let isSupabaseAvailable = false;
    try {
        isSupabaseAvailable = typeof window.supabase !== 'undefined';
    } catch (e) {
        console.warn('Error checking Supabase availability:', e);
    }

    // Check if Firebase is available
    let isFirebaseAvailable = false;
    try {
        isFirebaseAvailable = typeof window.firebase !== 'undefined' &&
                             typeof window.firebase.firestore === 'function';
    } catch (e) {
        console.warn('Error checking Firebase availability:', e);
    }

    console.log('Service Adapter initialized:');
    console.log('- Supabase available:', isSupabaseAvailable);
    console.log('- Firebase available:', isFirebaseAvailable);

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
                // Fall back to Firebase if available
                if (isFirebaseAvailable) {
                    return getStudentFromFirebase(studentId);
                }
                return getStudentFromLocalStorage(studentId);
            }
        } else if (isFirebaseAvailable) {
            return getStudentFromFirebase(studentId);
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

    // Get student from Firebase
    async function getStudentFromFirebase(studentId) {
        try {
            const doc = await firebase.firestore()
                .collection('users')
                .doc(studentId)
                .get();

            if (!doc.exists) {
                return {
                    success: false,
                    error: 'Student not found'
                };
            }

            const data = doc.data();
            return {
                success: true,
                data: {
                    id: doc.id,
                    name: data.name,
                    role: data.role,
                    sectionId: data.sectionId
                }
            };
        } catch (error) {
            console.error('Firebase error getting student:', error);
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
                // Fall back to Firebase if available
                if (isFirebaseAvailable) {
                    return getAllSectionsFromFirebase();
                }
                return getAllSectionsFromLocalStorage();
            }
        } else if (isFirebaseAvailable) {
            return getAllSectionsFromFirebase();
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

    // Get all sections from Firebase
    async function getAllSectionsFromFirebase() {
        try {
            const snapshot = await firebase.firestore()
                .collection('sections')
                .orderBy('day')
                .orderBy('time')
                .get();

            const sections = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                sections.push({
                    id: doc.id,
                    day: data.day,
                    time: data.time,
                    location: data.location,
                    ta: data.ta
                });
            });

            return {
                success: true,
                data: sections
            };
        } catch (error) {
            console.error('Firebase error getting sections:', error);
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
                // Fall back to Firebase if available
                if (isFirebaseAvailable) {
                    return assignStudentToSectionInFirebase(studentId, sectionId);
                }
                return assignStudentToSectionInLocalStorage(studentId, sectionId);
            }
        } else if (isFirebaseAvailable) {
            return assignStudentToSectionInFirebase(studentId, sectionId);
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

    // Assign student to section in Firebase
    async function assignStudentToSectionInFirebase(studentId, sectionId) {
        try {
            // Update the student's section
            await firebase.firestore()
                .collection('users')
                .doc(studentId)
                .update({
                    sectionId: sectionId,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

            // Get the updated student data
            const doc = await firebase.firestore()
                .collection('users')
                .doc(studentId)
                .get();

            if (!doc.exists) {
                return {
                    success: false,
                    error: 'Student not found'
                };
            }

            const data = doc.data();
            return {
                success: true,
                data: {
                    id: doc.id,
                    name: data.name,
                    role: data.role,
                    sectionId: data.sectionId
                }
            };
        } catch (error) {
            console.error('Firebase error assigning student to section:', error);
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
