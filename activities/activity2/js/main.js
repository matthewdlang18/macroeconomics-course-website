// Initialize everything when the document is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize map
        const mapVisualizer = new MapVisualizer('map-container');
        
        // Load data
        const { geoData, excelData } = await DataLoader.loadAllData();
        
        if (!geoData || !excelData) {
            throw new Error('Failed to load required data');
        }
        
        // Store data globally for use in other functions
        window.geoData = geoData;
        window.countryData = excelData;
        
        // Draw initial map
        mapVisualizer.drawMap(geoData, excelData, 'gdp');
        
        // Set up event listeners for map type changes
        document.getElementById('show-gdp')?.addEventListener('click', () => {
            mapVisualizer.updateMap(excelData, 'gdp');
        });
        
        document.getElementById('show-hdi')?.addEventListener('click', () => {
            mapVisualizer.updateMap(excelData, 'hdi');
        });
        
        // Initialize rankings table
        populateRankingsTable(excelData);
        
    } catch (error) {
        console.error('Error initializing application:', error);
        // Show error message to user
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = 'Error loading data: ' + error.message;
            errorElement.classList.remove('hidden');
        }
    }
});

// Function to populate the rankings table
function populateRankingsTable(data) {
    if (!data || !Array.isArray(data)) {
        console.error('Invalid data provided to populateRankingsTable');
        return;
    }

    const tableBody = document.getElementById('rankings-table')?.querySelector('tbody');
    if (!tableBody) {
        console.error('Could not find rankings table');
        return;
    }

    tableBody.innerHTML = '';
    
    // Create a new array for sorting
    const sortedData = data.slice().sort((a, b) => {
        const gdpA = typeof a?.gdp === 'number' ? a.gdp : 0;
        const gdpB = typeof b?.gdp === 'number' ? b.gdp : 0;
        return gdpB - gdpA;
    });
    
    sortedData.forEach((country, index) => {
        if (!country?.name) return; // Skip invalid entries
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-4 py-2 border">${country.name || 'N/A'}</td>
            <td class="px-4 py-2 border text-right">${
                typeof country.gdp === 'number' 
                    ? country.gdp.toLocaleString('en-US', {maximumFractionDigits: 2}) 
                    : 'N/A'
            }</td>
            <td class="px-4 py-2 border text-right">${
                typeof country.hdi === 'number'
                    ? country.hdi.toLocaleString('en-US', {maximumFractionDigits: 3})
                    : 'N/A'
            }</td>
        `;
        // Add alternating row colors
        row.classList.add(index % 2 === 0 ? 'bg-white' : 'bg-gray-50');
        tableBody.appendChild(row);
    });
}
