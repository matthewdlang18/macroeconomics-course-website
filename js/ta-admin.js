// TA Admin Dashboard JavaScript

// Constants
const ADMIN_PASSWORD = "econ2admin"; // Simple admin password for demonstration

document.addEventListener('DOMContentLoaded', function() {
    // Check if admin is already authenticated
    checkAdminAuthStatus();

    // Set up event listeners
    setupEventListeners();
});

// Check admin authentication status
function checkAdminAuthStatus() {
    const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
    
    if (isAuthenticated) {
        showAdminDashboard();
        loadAllData();
    }
}

// Set up event listeners
function setupEventListeners() {
    // Admin login
    document.getElementById('admin-login-btn').addEventListener('click', handleAdminLogin);
    
    // Generate passcode button
    document.getElementById('generate-passcode-btn').addEventListener('click', handleGeneratePasscode);
    
    // Add TA form
    document.getElementById('add-ta-form').addEventListener('submit', handleAddTA);
    
    // Add section form
    document.getElementById('add-section-form').addEventListener('submit', handleAddSection);
}

// Handle admin login
function handleAdminLogin() {
    const password = document.getElementById('admin-password').value.trim();
    const errorElement = document.getElementById('admin-error');
    
    if (password === ADMIN_PASSWORD) {
        // Store authentication status
        localStorage.setItem('admin_authenticated', 'true');
        
        // Show admin dashboard
        showAdminDashboard();
        
        // Load all data
        loadAllData();
        
        // Clear error
        errorElement.textContent = '';
    } else {
        errorElement.textContent = 'Incorrect password. Please try again.';
    }
}

// Show admin dashboard
function showAdminDashboard() {
    document.getElementById('admin-auth').classList.add('d-none');
    document.getElementById('admin-dashboard').classList.remove('d-none');
}

// Load all data
async function loadAllData() {
    await loadTAs();
    await loadSections();
    await loadStudents();
}

// Load TAs
async function loadTAs() {
    try {
        const result = await Service.getAllTAs();
        
        if (result.success) {
            const tas = result.data;
            
            // Update TAs table
            updateTAsTable(tas);
            
            // Update TA dropdown in section form
            updateTADropdown(tas);
        }
    } catch (error) {
        console.error('Error loading TAs:', error);
    }
}

// Update TAs table
function updateTAsTable(tas) {
    const tableBody = document.getElementById('tas-table-body');
    tableBody.innerHTML = '';
    
    if (tas.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="4" class="text-center">No TAs found</td>';
        tableBody.appendChild(row);
        return;
    }
    
    tas.forEach(ta => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${ta.name}</td>
            <td>${ta.email || '-'}</td>
            <td>${ta.passcode}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="handleDeleteTA('${ta.name}')">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Update TA dropdown
function updateTADropdown(tas) {
    const dropdown = document.getElementById('section-ta');
    
    // Clear existing options except the first one
    while (dropdown.options.length > 1) {
        dropdown.remove(1);
    }
    
    // Add TAs to dropdown
    tas.forEach(ta => {
        const option = document.createElement('option');
        option.value = ta.name;
        option.textContent = ta.name;
        dropdown.appendChild(option);
    });
}

// Handle generate passcode
function handleGeneratePasscode() {
    const taName = document.getElementById('ta-name').value.trim();
    
    if (taName) {
        const passcode = generateTAPasscode(taName);
        document.getElementById('ta-passcode').value = passcode;
    } else {
        alert('Please enter a TA name first.');
    }
}

// Handle add TA
async function handleAddTA(event) {
    event.preventDefault();
    
    const name = document.getElementById('ta-name').value.trim();
    const email = document.getElementById('ta-email').value.trim();
    const passcode = document.getElementById('ta-passcode').value.trim();
    
    if (!name) {
        alert('Please enter a TA name.');
        return;
    }
    
    if (!passcode) {
        alert('Please generate a passcode first.');
        return;
    }
    
    try {
        const result = await Service.createTA(name, email);
        
        if (result.success) {
            alert(`TA ${name} added successfully with passcode: ${result.data.passcode}`);
            
            // Clear form
            document.getElementById('add-ta-form').reset();
            
            // Reload TAs
            await loadTAs();
        } else {
            alert(`Error adding TA: ${result.error}`);
        }
    } catch (error) {
        console.error('Error adding TA:', error);
        alert('An error occurred while adding the TA. Please try again.');
    }
}

// Handle delete TA
async function handleDeleteTA(taName) {
    if (confirm(`Are you sure you want to delete TA ${taName}?`)) {
        try {
            // This would need to be implemented in the Service
            // For now, we'll just reload the TAs
            alert('Delete functionality not implemented yet.');
            await loadTAs();
        } catch (error) {
            console.error('Error deleting TA:', error);
            alert('An error occurred while deleting the TA. Please try again.');
        }
    }
}

// Load sections
async function loadSections() {
    try {
        const result = await Service.getAllSections();
        
        if (result.success) {
            const sections = result.data;
            updateSectionsTable(sections);
        }
    } catch (error) {
        console.error('Error loading sections:', error);
    }
}

// Update sections table
function updateSectionsTable(sections) {
    const tableBody = document.getElementById('sections-table-body');
    tableBody.innerHTML = '';
    
    if (sections.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" class="text-center">No sections found</td>';
        tableBody.appendChild(row);
        return;
    }
    
    sections.forEach(section => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${section.day}</td>
            <td>${section.time}</td>
            <td>${section.location}</td>
            <td>${section.ta}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="handleDeleteSection('${section.id}')">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Handle add section
async function handleAddSection(event) {
    event.preventDefault();
    
    const day = document.getElementById('section-day').value;
    const time = document.getElementById('section-time').value.trim();
    const location = document.getElementById('section-location').value.trim();
    const ta = document.getElementById('section-ta').value;
    
    if (!day || !time || !location || !ta) {
        alert('Please fill in all section fields.');
        return;
    }
    
    try {
        const result = await Service.createSection(day, time, location, ta);
        
        if (result.success) {
            alert(`Section added successfully.`);
            
            // Clear form
            document.getElementById('add-section-form').reset();
            
            // Reload sections
            await loadSections();
        } else {
            alert(`Error adding section: ${result.error}`);
        }
    } catch (error) {
        console.error('Error adding section:', error);
        alert('An error occurred while adding the section. Please try again.');
    }
}

// Handle delete section
async function handleDeleteSection(sectionId) {
    if (confirm(`Are you sure you want to delete this section?`)) {
        try {
            // This would need to be implemented in the Service
            // For now, we'll just reload the sections
            alert('Delete functionality not implemented yet.');
            await loadSections();
        } catch (error) {
            console.error('Error deleting section:', error);
            alert('An error occurred while deleting the section. Please try again.');
        }
    }
}

// Load students
async function loadStudents() {
    try {
        // This would need to be implemented in the Service
        // For now, we'll just show a placeholder
        const tableBody = document.getElementById('students-table-body');
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Student data loading functionality not implemented yet.</td></tr>';
    } catch (error) {
        console.error('Error loading students:', error);
    }
}

// Global function for deleting TAs (called from onclick)
window.handleDeleteTA = handleDeleteTA;

// Global function for deleting sections (called from onclick)
window.handleDeleteSection = handleDeleteSection;
