// Script to initialize TA sections in the database

// Wait for Firebase to initialize
document.addEventListener('DOMContentLoaded', async function() {
    // Make sure Firebase is initialized
    if (!usingFirebase) {
        console.error('Firebase is not initialized. Cannot add TA sections.');
        return;
    }

    console.log('Starting TA sections initialization...');

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
    console.log('Adding TAs...');
    for (const ta of tas) {
        try {
            const result = await Service.createTA(ta.name, ta.email);
            if (result.success) {
                console.log(`Added TA: ${ta.name} with passcode: ${result.data.passcode}`);
            } else {
                console.error(`Failed to add TA ${ta.name}: ${result.error}`);
            }
        } catch (error) {
            console.error(`Error adding TA ${ta.name}:`, error);
        }
    }

    // Add sections
    console.log('Adding sections...');
    for (const section of sections) {
        try {
            const result = await Service.createSection(section.day, section.time, section.location, section.ta);
            if (result.success) {
                console.log(`Added section: ${section.day} ${section.time} with TA ${section.ta}`);
            } else {
                console.error(`Failed to add section ${section.day} ${section.time}: ${result.error}`);
            }
        } catch (error) {
            console.error(`Error adding section ${section.day} ${section.time}:`, error);
        }
    }

    console.log('TA sections initialization complete!');
});
