// Section Selection JavaScript

let sections = []; // Store all sections
let selectedSectionId = null; // Currently selected section
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
        const result = await Service.getStudent(studentId);

        if (result.success) {
            currentStudentData = result.data;

            // Check if student already has a section
            if (currentStudentData.sectionId) {
                selectedSectionId = currentStudentData.sectionId;
                updateCurrentSectionInfo();
            }
        }
    } catch (error) {
        console.error('Error loading student data:', error);
    }
}

// Load sections
async function loadSections() {
    try {
        const result = await Service.getAllSections();

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
        }
    } catch (error) {
        console.error('Error loading sections:', error);

        // Show error message
        document.getElementById('sections-container').innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="alert alert-danger">
                    <p>Error loading sections. Please try again later.</p>
                </div>
            </div>
        `;
    }
}

// Filter sections based on current filter
function filterSections() {
    const filteredSections = currentFilter === 'all'
        ? sections
        : sections.filter(section => section.day === currentFilter);

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
                        <h5 class="mb-0">${dayNames[section.day]} - ${section.time}</h5>
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

            infoElement.innerHTML = `Your current section: ${dayNames[section.day]} at ${section.time} with ${section.ta} in ${section.location}`;
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
        const result = await Service.assignStudentToSection(currentStudentId, selectedSectionId);

        if (result.success) {
            // Show success message
            showMessage('Section selection saved successfully!', 'success');

            // Update current student data
            currentStudentData = result.data;

            // Update section info
            updateCurrentSectionInfo();

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
    const messageContainer = document.getElementById('message-container');

    if (!messageContainer) {
        // Create message container if it doesn't exist
        const container = document.createElement('div');
        container.id = 'message-container';
        container.className = 'mb-4';

        // Insert after the current section info
        const currentSectionInfo = document.getElementById('current-section-info');
        currentSectionInfo.parentNode.insertBefore(container, currentSectionInfo.nextSibling);
    }

    // Set message
    document.getElementById('message-container').innerHTML = `
        <div class="alert alert-${type}">
            ${message}
        </div>
    `;

    // Scroll to message
    document.getElementById('message-container').scrollIntoView({ behavior: 'smooth' });
}

// Make selectSection function available globally
window.selectSection = selectSection;
