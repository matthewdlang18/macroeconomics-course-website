// Direct Firebase initialization script for TAs and sections

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Direct initialization script loaded');
    
    // Check if Firebase is available
    if (typeof firebase === 'undefined') {
        console.error('Firebase is not available');
        updateStatus('Firebase is not available', 'danger');
        return;
    }
    
    try {
        // Get Firestore instance
        const db = firebase.firestore();
        console.log('Firestore instance:', db);
        
        // Update status
        updateStatus('Connected to Firebase. Starting initialization...', 'info');
        
        // TA data
        const tas = [
            { name: 'Akshay', email: 'akshay@example.com' },
            { name: 'Simran', email: 'simran@example.com' },
            { name: 'Camilla', email: 'camilla@example.com' },
            { name: 'Hui Yann', email: 'huiyann@example.com' },
            { name: 'Lars', email: 'lars@example.com' },
            { name: 'Luorao', email: 'luorao@example.com' }
        ];
        
        // Section data
        const sections = [
            { day: 'T', time: '5:00pm-5:50pm', location: 'Phelps, 1425', ta: 'Akshay' },
            { day: 'T', time: '5:00pm-5:50pm', location: 'Girvetz, 2128', ta: 'Simran' },
            { day: 'T', time: '5:00pm-5:50pm', location: 'Phelps, 1508', ta: 'Camilla' },
            { day: 'T', time: '5:00pm-5:50pm', location: 'Building 387, 1015', ta: 'Hui Yann' },
            { day: 'T', time: '6:00pm-6:50pm', location: 'Phelps, 1508', ta: 'Akshay' },
            { day: 'W', time: '6:00pm-6:50pm', location: 'Phelps, 1425', ta: 'Lars' },
            { day: 'W', time: '6:00pm-6:50pm', location: 'South Hall, 1430', ta: 'Luorao' },
            { day: 'W', time: '6:00pm-6:50pm', location: 'Ellison, 2626', ta: 'Simran' },
            { day: 'W', time: '6:00pm-6:50pm', location: 'Girvetz, 2128', ta: 'Camilla' },
            { day: 'W', time: '7:00pm-7:50pm', location: 'North Hall, 1109', ta: 'Hui Yann' },
            { day: 'R', time: '6:00pm-6:50pm', location: 'Phelps, 2524', ta: 'Luorao' },
            { day: 'R', time: '6:00pm-6:50pm', location: 'Phelps, 1425', ta: 'Akshay' },
            { day: 'F', time: '12:00pm-12:50pm', location: 'Arts, 1349', ta: 'Simran' },
            { day: 'F', time: '12:00pm-12:50pm', location: 'Phelps, 1425', ta: 'Camilla' },
            { day: 'F', time: '12:00pm-12:50pm', location: 'South Hall, 1430', ta: 'Hui Yann' },
            { day: 'F', time: '12:00pm-12:50pm', location: 'Ellison, 2626', ta: 'Lars' }
        ];
        
        // Generate TA passcode
        function generateTAPasscode(name) {
            return name.toLowerCase().substring(0, 3) + 'econ2';
        }
        
        // Add TAs directly to Firestore
        console.log('Adding TAs directly to Firestore...');
        for (const ta of tas) {
            try {
                const passcode = generateTAPasscode(ta.name);
                console.log(`Adding TA: ${ta.name} with passcode: ${passcode}`);
                
                // Use the same approach as student registration
                await db.collection('tas').doc(ta.name).set({
                    name: ta.name,
                    email: ta.email || '',
                    passcode: passcode,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                console.log(`Successfully added TA: ${ta.name}`);
            } catch (error) {
                console.error(`Error adding TA ${ta.name}:`, error);
                updateStatus(`Error adding TA ${ta.name}: ${error.message}`, 'danger');
            }
        }
        
        // Add sections directly to Firestore
        console.log('Adding sections directly to Firestore...');
        for (const section of sections) {
            try {
                // Generate a unique ID for the section
                const sectionId = `${section.day}_${section.time.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}`;
                console.log(`Adding section: ${section.day} ${section.time} with TA ${section.ta}`);
                
                // Use the same approach as student registration
                await db.collection('sections').doc(sectionId).set({
                    id: sectionId,
                    day: section.day,
                    time: section.time,
                    location: section.location,
                    ta: section.ta,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                console.log(`Successfully added section: ${section.day} ${section.time}`);
            } catch (error) {
                console.error(`Error adding section ${section.day} ${section.time}:`, error);
                updateStatus(`Error adding section: ${error.message}`, 'danger');
            }
        }
        
        // Verify data was added
        try {
            const tasSnapshot = await db.collection('tas').get();
            console.log(`TAs in database: ${tasSnapshot.size}`);
            
            const sectionsSnapshot = await db.collection('sections').get();
            console.log(`Sections in database: ${sectionsSnapshot.size}`);
            
            updateStatus(`Initialization complete! Added ${tasSnapshot.size} TAs and ${sectionsSnapshot.size} sections.`, 'success');
        } catch (error) {
            console.error('Error verifying data:', error);
            updateStatus(`Error verifying data: ${error.message}`, 'warning');
        }
        
    } catch (error) {
        console.error('Initialization error:', error);
        updateStatus(`Initialization failed: ${error.message}`, 'danger');
    }
});

// Update status message
function updateStatus(message, type) {
    const statusDiv = document.getElementById('status');
    if (statusDiv) {
        statusDiv.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    }
    
    // Also update console div if it exists
    const consoleDiv = document.getElementById('console');
    if (consoleDiv) {
        const logLine = document.createElement('div');
        logLine.className = type === 'danger' ? 'text-danger' : type === 'success' ? 'text-success' : '';
        logLine.textContent = message;
        consoleDiv.appendChild(logLine);
        consoleDiv.scrollTop = consoleDiv.scrollHeight;
    }
}
