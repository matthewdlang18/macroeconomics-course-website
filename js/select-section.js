// Section Selection JavaScript

let sections = []; // Store all sections
let selectedSectionId = localStorage.getItem('section_id'); // Currently selected section
let currentStudentId = null; // Current student ID
let currentStudentData = null; // Current student data
let currentFilter = 'all'; // Current day filter

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    checkAuthStatus();

    // Set up event listeners
    setupEventListeners();
});

// Check authentication status
function checkAuthStatus() {
    const studentId = localStorage.getItem('student_id');
    const studentName = localStorage.getItem('student_name');
    const isGuest = localStorage.getItem('is_guest') === 'true';

    if (studentId && studentName && !isGuest) {
        // User is logged in
        currentStudentId = studentId;

        // Show section selection
        document.getElementById('auth-check').classList.add('d-none');
        document.getElementById('section-selection').classList.remove('d-none');

        // Set student name
        document.getElementById('student-name').textContent = studentName;

        // Load student data
        loadStudentData(studentId);

        // Load sections
        loadSections();
    } else {
        // User is not logged in or is a guest
        document.getElementById('auth-check').classList.remove('d-none');
        document.getElementById('section-selection').classList.add('d-none');
    }
}

// Set up event listeners
function setupEventListeners() {
    // Day filter
    const dayFilterLinks = document.querySelectorAll('#day-filter a');
    dayFilterLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            // Update active class
            dayFilterLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            // Update filter
            currentFilter = this.getAttribute('data-day');

            // Filter sections
            filterSections();
        });
    });

    // Save section button
    document.getElementById('save-section-btn').addEventListener('click', handleSaveSection);
}

// Load student data
async function loadStudentData(studentId) {
    try {
        // Check if Service is available
        if (typeof window.Service === 'undefined') {
            console.error('Service is not defined. Make sure service-adapter.js is loaded.');
            showMessage('Error: Service is not available. Please refresh the page or contact support.', 'danger');
            return;
        }

        const result = await window.Service.getStudent(studentId);

        if (result.success) {
            currentStudentData = result.data;

            // Check if student already has a section
            if (currentStudentData.sectionId) {
                selectedSectionId = currentStudentData.sectionId;
                updateCurrentSectionInfo();
                localStorage.setItem('section_id', selectedSectionId);
            }
        }
    } catch (error) {
        console.error('Error loading student data:', error);
        showMessage('Error loading student data. Please refresh the page or contact support.', 'danger');
    }
}

// Load sections
async function loadSections() {
    try {
        // Show loading state
        document.getElementById('sections-container').innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
                <p class="mt-2">Loading sections...</p>
            </div>
        `;

        // Check if Service is available
        if (typeof window.Service === 'undefined') {
            console.error('Service is not defined. Make sure service-adapter.js is loaded.');
            throw new Error('Service is not available');
        }

        // Try to use SectionsCache if available
        let result;
        if (typeof window.SectionsCache !== 'undefined') {
            console.log('Using SectionsCache to load sections');
            result = await window.SectionsCache.getAllSections();
        } else {
            console.log('SectionsCache not available, using Service directly');
            result = await window.Service.getAllSections();
        }

        if (result.success) {
            sections = result.data;

            // Sort sections by day and time
            sections.sort((a, b) => {
                const dayOrder = { 'M': 1, 'T': 2, 'W': 3, 'R': 4, 'F': 5 };
                if (dayOrder[a.day] !== dayOrder[b.day]) {
                    return dayOrder[a.day] - dayOrder[b.day];
                }
                return a.time.localeCompare(b.time);
            });

            // Display sections
            filterSections();
        } else {
            throw new Error(result.error || 'Failed to load sections');
        }
    } catch (error) {
        console.error('Error loading sections:', error);

        // Show error message
        document.getElementById('sections-container').innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="alert alert-danger">
                    <p>Error loading sections: ${error.message || 'Unknown error'}</p>
                    <button class="btn btn-sm btn-primary mt-2" onclick="location.reload()">Try Again</button>
                </div>
            </div>
        `;
    }
}

// Filter sections based on current filter
function filterSections() {
    const dayCodeMap = { 'Monday': 'M', 'Tuesday': 'T', 'Wednesday': 'W', 'Thursday': 'R', 'Friday': 'F' };
    const filteredSections = currentFilter === 'all'
        ? sections
        : sections.filter(section => (dayCodeMap[section.day] || section.day) === currentFilter);

    displaySections(filteredSections);
}

// Display sections
function displaySections(sectionsToDisplay) {
    const container = document.getElementById('sections-container');

    if (sectionsToDisplay.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="alert alert-info">
                    <p>No sections available for the selected day.</p>
                </div>
            </div>
        `;
        return;
    }

    let html = '';

    sectionsToDisplay.forEach(section => {
        const isSelected = section.id === selectedSectionId;
        const dayNames = {
            'M': 'Monday',
            'T': 'Tuesday',
            'W': 'Wednesday',
            'R': 'Thursday',
            'F': 'Friday'
        };

        html += `
            <div class="col-md-6 mb-4">
                <div class="card section-card ${isSelected ? 'selected' : ''}" data-section-id="${section.id}" onclick="selectSection('${section.id}')">
                    <div class="card-header ${isSelected ? 'bg-success text-white' : 'bg-light'}">
                        <h5 class="mb-0">${dayNames[section.day] || section.day} - ${section.time}</h5>
                    </div>
                    <div class="card-body">
                        <p><strong>Location:</strong> ${section.location}</p>
                        <p><strong>TA:</strong> ${section.ta}</p>
                        ${isSelected ? '<div class="text-success font-weight-bold">✓ Currently Selected</div>' : ''}
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Select a section
function selectSection(sectionId) {
    selectedSectionId = sectionId;
    filterSections(); // Refresh display
}

// Update current section info
function updateCurrentSectionInfo() {
    const infoElement = document.getElementById('current-section-info');

    if (selectedSectionId) {
        const section = sections.find(s => s.id === selectedSectionId);

        if (section) {
            const dayNames = {
                'M': 'Monday',
                'T': 'Tuesday',
                'W': 'Wednesday',
                'R': 'Thursday',
                'F': 'Friday'
            };

            infoElement.innerHTML = `
                <span class="d-block mb-1">Your current section: <strong>${dayNames[section.day] || section.day} at ${section.time}</strong></span>
                <span class="d-block mb-1">Teaching Assistant: <strong>${section.ta}</strong></span>
                <span class="d-block">Location: <strong>${section.location}</strong></span>
            `;
        } else {
            infoElement.innerHTML = 'Your section information is loading...';
        }
    } else {
        infoElement.innerHTML = 'You have not selected a section yet.';
    }
}

// Handle save section
async function handleSaveSection() {
    if (!selectedSectionId) {
        // Show error message
        showMessage('Please select a section first.', 'danger');
        return;
    }

    if (!currentStudentId) {
        // Show error message
        showMessage('You need to be logged in to save a section.', 'danger');
        return;
    }

    // Show loading message
    const saveButton = document.getElementById('save-section-btn');
    const originalText = saveButton.textContent;
    saveButton.textContent = 'Saving...';
    saveButton.disabled = true;

    try {
        // Check if Service is available
        if (typeof window.Service === 'undefined') {
            console.error('Service is not defined. Make sure service-adapter.js is loaded.');
            throw new Error('Service is not available');
        }

        const result = await window.Service.assignStudentToSection(currentStudentId, selectedSectionId);

        if (result.success) {
            // Show success message
            showMessage('Section selection saved successfully!', 'success');

            // Update current student data
            currentStudentData = result.data;

            // Update section info
            updateCurrentSectionInfo();
            localStorage.setItem('section_id', selectedSectionId);
            const section = sections.find(s => s.id === selectedSectionId);
            if (section) {
                const dayNames = { 'M': 'Monday', 'T': 'Tuesday', 'W': 'Wednesday', 'R': 'Thursday', 'F': 'Friday' };
                // Include TA name in the section name
                localStorage.setItem('section_name', `${dayNames[section.day] || section.day} ${section.time}`);
                // Store TA name separately for easier access
                localStorage.setItem('section_ta', section.ta);
            }

            // Add a link to return to games
            const messageElement = document.getElementById('message-container');
            messageElement.innerHTML += `
                <div class="mt-2">
                    <a href="games.html" class="btn btn-primary">Return to Games</a>
                </div>
            `;
        } else {
            // Show error message
            showMessage(`Error saving section selection: ${result.error}`, 'danger');
        }
    } catch (error) {
        console.error('Error saving section selection:', error);
        // Show error message
        showMessage('An error occurred while saving your section selection. Please try again.', 'danger');
    } finally {
        // Restore button
        saveButton.textContent = originalText;
        saveButton.disabled = false;
    }
}

// Show message
function showMessage(message, type = 'info') {
    try {
        const messageContainer = document.getElementById('message-container');

        if (!messageContainer) {
            // Create message container if it doesn't exist
            const container = document.createElement('div');
            container.id = 'message-container';
            container.className = 'mb-4';

            // Insert after the current section info
            const currentSectionInfo = document.getElementById('current-section-info');
            if (currentSectionInfo && currentSectionInfo.parentNode) {
                currentSectionInfo.parentNode.insertBefore(container, currentSectionInfo.nextSibling);
            } else {
                // If current section info doesn't exist, try to insert at the top of the section selection
                const sectionSelection = document.getElementById('section-selection');
                if (sectionSelection) {
                    sectionSelection.prepend(container);
                } else {
                    // If all else fails, just log to console
                    console.error('Cannot show message:', message);
                    return;
                }
            }
        }

        // Set message
        const msgContainer = document.getElementById('message-container');
        if (msgContainer) {
            msgContainer.innerHTML = `
                <div class="alert alert-${type}">
                    ${message}
                </div>
            `;

            // Scroll to message
            msgContainer.scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        console.error('Error showing message:', error);
        alert(`${type.toUpperCase()}: ${message}`);
    }
}

// Make selectSection function available globally
window.selectSection = selectSection;
