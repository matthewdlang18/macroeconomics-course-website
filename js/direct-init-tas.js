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

        // Check if data already exists
        try {
            const tasSnapshot = await db.collection('tas').get();
            const sectionsSnapshot = await db.collection('sections').get();

            if (tasSnapshot.size > 0 || sectionsSnapshot.size > 0) {
                console.log(`Found existing data: ${tasSnapshot.size} TAs and ${sectionsSnapshot.size} sections`);
                updateStatus(`Found existing data: ${tasSnapshot.size} TAs and ${sectionsSnapshot.size} sections. Continue to add any missing items.`, 'warning');
            }
        } catch (error) {
            console.error('Error checking existing data:', error);
        }

        // Add TAs directly to Firestore
        console.log('Adding TAs directly to Firestore...');
        const addedTAs = [];

        for (const ta of tas) {
            try {
                // Check if TA already exists
                const taDoc = await db.collection('tas').doc(ta.name).get();
                if (taDoc.exists) {
                    console.log(`TA ${ta.name} already exists, skipping...`);
                    updateStatus(`TA ${ta.name} already exists, skipping...`, 'info');
                    continue;
                }

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
                updateStatus(`Successfully added TA: ${ta.name}`, 'success');
                addedTAs.push({ name: ta.name, passcode: passcode });
            } catch (error) {
                console.error(`Error adding TA ${ta.name}:`, error);
                updateStatus(`Error adding TA ${ta.name}: ${error.message}`, 'danger');
            }
        }

        // Add sections directly to Firestore
        console.log('Adding sections directly to Firestore...');
        const addedSections = [];

        for (const section of sections) {
            try {
                // Generate a unique ID for the section that's consistent
                const baseId = `${section.day}_${section.time.replace(/[^a-zA-Z0-9]/g, '')}_${section.location.replace(/[^a-zA-Z0-9]/g, '')}`;

                // Check if a similar section already exists
                const existingQuery = await db.collection('sections')
                    .where('day', '==', section.day)
                    .where('time', '==', section.time)
                    .where('location', '==', section.location)
                    .where('ta', '==', section.ta)
                    .get();

                if (!existingQuery.empty) {
                    console.log(`Section ${section.day} ${section.time} at ${section.location} with TA ${section.ta} already exists, skipping...`);
                    updateStatus(`Section for ${section.ta} on ${section.day} at ${section.time} already exists, skipping...`, 'info');
                    continue;
                }

                const sectionId = `${baseId}_${Date.now()}`;
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
                updateStatus(`Successfully added section: ${section.day} ${section.time} with TA ${section.ta}`, 'success');
                addedSections.push({ id: sectionId, day: section.day, time: section.time, location: section.location, ta: section.ta });
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

            // Create a summary of what was added
            let summaryMessage = '';
            if (addedTAs.length > 0 || addedSections.length > 0) {
                summaryMessage = `Successfully added ${addedTAs.length} TAs and ${addedSections.length} sections.`;
            } else {
                summaryMessage = 'No new items were added. All TAs and sections already exist in the database.';
            }

            // Display summary
            updateStatus(`Initialization complete! ${summaryMessage}`, 'success');

            // Display detailed results
            let resultsHtml = '';

            if (addedTAs.length > 0) {
                resultsHtml += '<h5>Added Teaching Assistants:</h5><ul class="list-group mb-3">';
                addedTAs.forEach(ta => {
                    resultsHtml += `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            ${ta.name}
                            <span class="badge badge-primary badge-pill">Passcode: ${ta.passcode}</span>
                        </li>
                    `;
                });
                resultsHtml += '</ul>';
            }

            if (addedSections.length > 0) {
                resultsHtml += '<h5>Added Sections:</h5><div class="table-responsive"><table class="table table-sm table-striped">';
                resultsHtml += '<thead><tr><th>Day</th><th>Time</th><th>Location</th><th>TA</th></tr></thead><tbody>';
                addedSections.forEach(section => {
                    resultsHtml += `
                        <tr>
                            <td>${section.day}</td>
                            <td>${section.time}</td>
                            <td>${section.location}</td>
                            <td>${section.ta}</td>
                        </tr>
                    `;
                });
                resultsHtml += '</tbody></table></div>';
            }

            // Add a link to the TA admin page
            resultsHtml += '<div class="mt-3"><a href="ta-admin.html" class="btn btn-primary">Go to TA Admin</a></div>';

            // Update the status div with the results
            const statusDiv = document.getElementById('status');
            if (statusDiv) {
                statusDiv.innerHTML = `
                    <div class="alert alert-success">
                        <h4>Initialization Complete!</h4>
                        <p>${summaryMessage}</p>
                    </div>
                    ${resultsHtml}
                `;
            }
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
