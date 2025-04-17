const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Generate TA passcode
function generateTAPasscode(name) {
    return name.toLowerCase().substring(0, 3) + 'econ2';
}

// Initialize TAs and sections
exports.initializeTAsAndSections = functions.https.onRequest(async (req, res) => {
    try {
        const db = admin.firestore();
        
        // Check if initialization has already been done
        const initDoc = await db.collection('system').doc('initialization').get();
        if (initDoc.exists && initDoc.data().completed) {
            res.json({ 
                success: false, 
                message: 'Database has already been initialized. To reinitialize, delete the system/initialization document first.' 
            });
            return;
        }
        
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
        
        // Add TAs
        const taPromises = tas.map(async (ta) => {
            const passcode = generateTAPasscode(ta.name);
            await db.collection('tas').doc(ta.name).set({
                name: ta.name,
                email: ta.email || '',
                passcode: passcode,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            return { name: ta.name, passcode };
        });
        
        const taResults = await Promise.all(taPromises);
        
        // Add sections
        const sectionPromises = sections.map(async (section) => {
            const sectionId = `${section.day}_${section.time.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}`;
            await db.collection('sections').doc(sectionId).set({
                id: sectionId,
                day: section.day,
                time: section.time,
                location: section.location,
                ta: section.ta,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            return { id: sectionId, day: section.day, time: section.time, ta: section.ta };
        });
        
        const sectionResults = await Promise.all(sectionPromises);
        
        // Mark initialization as completed
        await db.collection('system').doc('initialization').set({
            completed: true,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            tasCount: taResults.length,
            sectionsCount: sectionResults.length
        });
        
        res.json({
            success: true,
            message: 'Database initialized successfully',
            tas: taResults,
            sections: sectionResults
        });
    } catch (error) {
        console.error('Initialization error:', error);
        res.status(500).json({
            success: false,
            message: 'Initialization failed',
            error: error.message
        });
    }
});

// Trigger initialization when the app is deployed
exports.initializeOnDeploy = functions.firestore
    .document('system/config')
    .onWrite(async (change, context) => {
        try {
            const db = admin.firestore();
            
            // Check if initialization has already been done
            const initDoc = await db.collection('system').doc('initialization').get();
            if (initDoc.exists && initDoc.data().completed) {
                console.log('Database has already been initialized.');
                return null;
            }
            
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
            
            // Add TAs
            const taPromises = tas.map(async (ta) => {
                const passcode = generateTAPasscode(ta.name);
                await db.collection('tas').doc(ta.name).set({
                    name: ta.name,
                    email: ta.email || '',
                    passcode: passcode,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
                return { name: ta.name, passcode };
            });
            
            await Promise.all(taPromises);
            
            // Add sections
            const sectionPromises = sections.map(async (section) => {
                const sectionId = `${section.day}_${section.time.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}`;
                await db.collection('sections').doc(sectionId).set({
                    id: sectionId,
                    day: section.day,
                    time: section.time,
                    location: section.location,
                    ta: section.ta,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
                return { id: sectionId, day: section.day, time: section.time, ta: section.ta };
            });
            
            await Promise.all(sectionPromises);
            
            // Mark initialization as completed
            await db.collection('system').doc('initialization').set({
                completed: true,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                tasCount: tas.length,
                sectionsCount: sections.length
            });
            
            console.log('Database initialized successfully');
            return null;
        } catch (error) {
            console.error('Initialization error:', error);
            return null;
        }
    });
