/**
 * Service Adapter for Investment Odyssey
 * 
 * This adapter provides a unified interface for both Firebase and Supabase services.
 * It detects which backend is available and uses the appropriate one.
 */

// Service adapter
const Service = (function() {
    // Check if Supabase is available
    const isSupabaseAvailable = typeof supabase !== 'undefined';
    
    // Check if Firebase is available
    const isFirebaseAvailable = typeof firebase !== 'undefined' && 
                               typeof firebase.firestore === 'function';
    
    console.log('Service Adapter initialized:');
    console.log('- Supabase available:', isSupabaseAvailable);
    console.log('- Firebase available:', isFirebaseAvailable);
    
    // Get student data
    async function getStudent(studentId) {
        if (isSupabaseAvailable) {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', studentId)
                    .single();
                
                if (error) throw error;
                
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
                return { success: false, error: error.message };
            }
        } else if (isFirebaseAvailable) {
            return getStudentFromFirebase(studentId);
        } else {
            return { 
                success: false, 
                error: 'No backend service available' 
            };
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
                const { data, error } = await supabase
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
                
                if (error) throw error;
                
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
                return { success: false, error: error.message };
            }
        } else if (isFirebaseAvailable) {
            return getAllSectionsFromFirebase();
        } else {
            return { 
                success: false, 
                error: 'No backend service available' 
            };
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
                // Update the student's section
                const { data, error } = await supabase
                    .from('profiles')
                    .update({ section_id: sectionId })
                    .eq('id', studentId)
                    .select()
                    .single();
                
                if (error) throw error;
                
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
                return { success: false, error: error.message };
            }
        } else if (isFirebaseAvailable) {
            return assignStudentToSectionInFirebase(studentId, sectionId);
        } else {
            return { 
                success: false, 
                error: 'No backend service available' 
            };
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
