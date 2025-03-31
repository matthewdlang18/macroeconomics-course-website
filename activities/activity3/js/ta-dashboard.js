// Global state object to store all data and chart references
const state = {
    studentData: [],
    zScoreData: [],
    recessionData: [],
    charts: {},
    indicators: [
        { id: "10Y2Y_Yield", label: "Yield Curve (10Y-2Y)", weight: 0 },
        { id: "ISM_NewOrders", label: "ISM New Orders", weight: 0 },
        { id: "Building_Permits", label: "Building Permits", weight: 0 },
        { id: "Consumer_Confidence", label: "Consumer Confidence", weight: 0 },
        { id: "Initial_Claims", label: "Initial Claims", weight: 0 },
        { id: "SP500", label: "S&P 500", weight: 0 },
        { id: "Avg_WeeklyHours", label: "CLI", weight: 0 },
        { id: "PMI", label: "PMI", weight: 0 }
    ],
    aggregateIndex: [],
    signals: [],
    signalAnalysis: {}
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeState();
    setupEventListeners();
    initializeCharts();
    loadZScoreData();
    loadRecessionData();
});

// Initialize state object with default values
function initializeState() {
    state.studentData = [];
    state.zScoreData = [];
    state.recessionData = [];
    state.charts = {
        weightsChart: null,
        gdp12Chart: null,
        gdp24Chart: null,
        recessionChart: null,
        indexChart: null
    };
    state.indicators = [
        { id: "10Y2Y_Yield", label: "Yield Curve (10Y-2Y)", weight: 0 },
        { id: "ISM_NewOrders", label: "ISM New Orders", weight: 0 },
        { id: "Building_Permits", label: "Building Permits", weight: 0 },
        { id: "Consumer_Confidence", label: "Consumer Confidence", weight: 0 },
        { id: "Initial_Claims", label: "Initial Claims", weight: 0 },
        { id: "SP500", label: "S&P 500", weight: 0 },
        { id: "Avg_WeeklyHours", label: "CLI", weight: 0 },
        { id: "PMI", label: "PMI", weight: 0 }
    ];
    state.aggregateIndex = [];
    state.signals = [];
    state.signalAnalysis = {
        truePositives: 0,
        falsePositives: 0,
        missedRecessions: 0,
        avgLeadTime: 0
    };
}

// Set up all event listeners
function setupEventListeners() {
    // File upload event listeners
    const dropzone = document.getElementById('fileDropzone');
    const fileInput = document.getElementById('fileInput');
    
    // Dropzone click to trigger file input
    dropzone.addEventListener('click', () => {
        fileInput.click();
    });
    
    // File input change event
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });
    
    // Drag and drop events
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });
    
    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });
    
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        
        if (e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });
    
    // Signal analysis controls
    document.getElementById('signalThreshold').addEventListener('input', (e) => {
        document.getElementById('thresholdValue').textContent = parseFloat(e.target.value).toFixed(1);
        analyzeSignals();
    });
    
    document.getElementById('signalDirection').addEventListener('change', () => {
        analyzeSignals();
    });
    
    // Download button
    document.getElementById('downloadBtn').addEventListener('click', downloadResults);
}

// Initialize empty charts
function initializeCharts() {
    // Initialize weights chart
    const weightsCtx = document.getElementById('weightsChart').getContext('2d');
    state.charts.weightsChart = new Chart(weightsCtx, {
        type: 'bar',
        data: {
            labels: state.indicators.map(ind => ind.label),
            datasets: [{
                label: 'Average Weight (%)',
                data: state.indicators.map(ind => 0),
                backgroundColor: 'rgba(59, 130, 246, 0.7)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Weight (%)'
                    }
                }
            }
        }
    });
    
    // Initialize GDP 12-month forecast chart
    const gdp12Ctx = document.getElementById('gdp12Chart').getContext('2d');
    state.charts.gdp12Chart = new Chart(gdp12Ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Number of Students',
                data: [],
                backgroundColor: 'rgba(59, 130, 246, 0.7)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'GDP Growth Rate (%)'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Students'
                    },
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
    
    // Initialize GDP 24-month forecast chart
    const gdp24Ctx = document.getElementById('gdp24Chart').getContext('2d');
    state.charts.gdp24Chart = new Chart(gdp24Ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Number of Students',
                data: [],
                backgroundColor: 'rgba(59, 130, 246, 0.7)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'GDP Growth Rate (%)'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Students'
                    },
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
    
    // Initialize recession probability chart
    const recessionCtx = document.getElementById('recessionChart').getContext('2d');
    state.charts.recessionChart = new Chart(recessionCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Number of Students',
                data: [],
                backgroundColor: 'rgba(239, 68, 68, 0.7)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Recession Probability (%)'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Students'
                    },
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
    
    // Initialize index chart (empty for now)
    const indexCtx = document.getElementById('indexChart').getContext('2d');
    state.charts.indexChart = new Chart(indexCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Aggregate Leading Index',
                data: [],
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 2,
                fill: false,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                annotation: {
                    annotations: []
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'month',
                        displayFormats: {
                            month: 'MMM yyyy'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Index Value'
                    }
                }
            }
        }
    });
}

// Load Z-Score data from CSV
function loadZScoreData() {
    return new Promise((resolve, reject) => {
        Papa.parse('../data/LeadingIndicators_ZScore.csv', {
            download: true,
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: function(results) {
                // Process the data
                state.zScoreData = results.data
                    .filter(row => row.date) // Filter out rows without dates
                    .map(row => ({
                        date: formatDate(row.date),
                        "10Y2Y_Yield": parseFloat(row["10Y2Y_Yield"]) || 0,
                        "ISM_NewOrders": parseFloat(row["ISM_NewOrders"]) || 0,
                        "Building_Permits": parseFloat(row["Building_Permits"]) || 0,
                        "Consumer_Confidence": parseFloat(row["Consumer_Confidence"]) || 0,
                        "PMI": parseFloat(row["PMI"]) || 0,
                        "Initial_Claims": parseFloat(row["Initial_Claims"]) || 0,
                        "Avg_WeeklyHours": parseFloat(row["Avg_WeeklyHours"]) || 0,
                        "SP500": parseFloat(row["SP500"]) || 0
                    }));
                
                resolve();
            },
            error: function(error) {
                console.error('Error loading Z-score data:', error);
                reject(error);
            }
        });
    });
}

// Load recession data from CSV
async function loadRecessionData() {
    try {
        const response = await fetch('../data/recessions.csv');
        const csvText = await response.text();
        
        // Parse CSV data
        const results = Papa.parse(csvText, { header: true });
        
        // Process and format the data
        state.recessionData = results.data
            .filter(row => row.Start && row.End) // Filter out empty rows
            .map(row => ({
                start: formatDate(row.Start),
                end: formatDate(row.End)
            }))
            .filter(recession => 
                !isNaN(recession.start.getTime()) && 
                !isNaN(recession.end.getTime())
            ); // Filter out invalid dates
    } catch (error) {
        console.error('Error loading recession data:', error);
        showError('Failed to load recession data. Please try refreshing the page.');
    }
}

// Format date string to Date object
function formatDate(dateStr) {
    // Check if the date is in YYYY-MM-DD format
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
        return new Date(dateStr);
    }
    
    // Otherwise, assume MM/DD/YY format
    const [month, day, year] = dateStr.split('/');
    const fullYear = year.length === 2 ? (parseInt(year) > 50 ? '19' : '20') + year : year;
    return new Date(`${fullYear}-${month.padStart(2, '0')}-${day ? day.padStart(2, '0') : '01'}`);
}

// Handle file upload
function handleFileUpload(file) {
    // Reset any previous data
    resetData();
    
    // Show progress bar
    document.getElementById('progressBar').style.width = '0%';
    document.getElementById('uploadProgress').classList.remove('hidden');
    
    // Simulate progress
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += 5;
        if (progress > 90) clearInterval(progressInterval);
        document.getElementById('progressBar').style.width = `${progress}%`;
    }, 100);
    
    // Process file based on type
    const fileType = file.name.split('.').pop().toLowerCase();
    
    if (fileType === 'xlsx' || fileType === 'xls') {
        processExcelFile(file);
    } else if (fileType === 'csv') {
        processCSVFile(file);
    } else {
        clearInterval(progressInterval);
        showError('Unsupported file type. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.');
        resetUploadUI();
    }
}

// Reset data state
function resetData() {
    // Reset student data
    state.studentData = [];
    
    // Reset indicator weights
    state.indicators.forEach(ind => ind.weight = 0);
    
    // Reset aggregate index
    state.aggregateIndex = [];
    
    // Reset signals
    state.signals = [];
    
    // Reset signal analysis
    state.signalAnalysis = {};
    
    // Hide analysis content until new data is processed
    document.getElementById('analysisContent').classList.add('hidden');
    
    // Hide file info
    document.getElementById('fileInfo').classList.add('hidden');
}

// Process Excel file
function processExcelFile(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Get the first sheet
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Convert to JSON with headers
            const rawData = XLSX.utils.sheet_to_json(worksheet);
            
            // Transform the data structure from indicators as rows to students as rows
            const transformedData = transformExcelData(rawData);
            
            // Process the transformed data
            processStudentData(transformedData);
            
            // Show file info
            showFileInfo(file.name, transformedData.length);
            
            // Hide progress bar
            document.getElementById('uploadProgress').classList.add('hidden');
            document.getElementById('dropzoneContent').classList.remove('hidden');
            
        } catch (error) {
            console.error('Error processing Excel file:', error);
            showError('Error processing Excel file. Please check the format and try again.');
            resetUploadUI();
        }
    };
    
    reader.onerror = function() {
        clearInterval(progressInterval);
        showError('Error reading file. Please try again.');
        resetUploadUI();
    };
    
    // Show progress bar
    document.getElementById('dropzoneContent').classList.add('hidden');
    document.getElementById('uploadProgress').classList.remove('hidden');
    
    // Read the file as an array buffer
    reader.readAsArrayBuffer(file);
}

// Transform Excel data from indicators as rows to students as rows
function transformExcelData(rawData) {
    // Initialize transformed data array
    const transformedData = [];
    
    // Get all student column names (Student 1, Student 2, etc.)
    const firstRow = rawData[0];
    const studentColumns = Object.keys(firstRow).filter(key => key !== 'Indicator');
    
    // Create a student object for each column
    studentColumns.forEach((studentCol, index) => {
        const studentData = {
            studentId: studentCol
        };
        
        // Extract data for each indicator for this student
        rawData.forEach(row => {
            const indicator = row['Indicator'];
            const value = row[studentCol];
            
            // Map indicator names to our expected field names
            switch(indicator) {
                case 'Yield Curve (10Y-2Y)':
                    studentData['10Y2Y_Yield'] = value;
                    break;
                case 'ISM New Orders':
                    studentData['ISM_NewOrders'] = value;
                    break;
                case 'Building Permits':
                    studentData['Building_Permits'] = value;
                    break;
                case 'Consumer Confidence':
                    studentData['Consumer_Confidence'] = value;
                    break;
                case 'Initial Claims':
                    studentData['Initial_Claims'] = value;
                    break;
                case 'S&P 500':
                    studentData['SP500'] = value;
                    break;
                case 'Average Weekly Hours':
                case 'CLI': // Map CLI to Avg_WeeklyHours as a substitute
                    studentData['Avg_WeeklyHours'] = value;
                    break;
                case '12-Month GDP Growth':
                    studentData['GDP_12Month'] = value;
                    break;
                case '24-Month GDP Growth':
                    studentData['GDP_24Month'] = value;
                    break;
                case 'Recession Probability':
                    studentData['Recession_Probability'] = value;
                    break;
                case 'PMI': // Add PMI mapping
                    studentData['PMI'] = value;
                    break;
                default:
                    // Store other indicators with a sanitized name
                    const sanitizedName = indicator.replace(/[^a-zA-Z0-9]/g, '_');
                    studentData[sanitizedName] = value;
            }
        });
        
        transformedData.push(studentData);
    });
    
    return transformedData;
}

// Process CSV file
function processCSVFile(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            // Parse CSV data
            Papa.parse(e.target.result, {
                header: true,
                dynamicTyping: true,
                complete: function(results) {
                    if (results.data && results.data.length > 0) {
                        // Check if the CSV is in the expected format or needs transformation
                        const firstRow = results.data[0];
                        const isIndicatorBasedFormat = 'Indicator' in firstRow;
                        
                        let processedData;
                        if (isIndicatorBasedFormat) {
                            // Transform from indicator-based to student-based format
                            processedData = transformCSVData(results.data);
                        } else {
                            processedData = results.data;
                        }
                        
                        // Process the data
                        processStudentData(processedData);
                        
                        // Show file info
                        showFileInfo(file.name, processedData.length);
                    } else {
                        showError('The CSV file appears to be empty or invalid.');
                    }
                    
                    // Hide progress bar
                    document.getElementById('uploadProgress').classList.add('hidden');
                    document.getElementById('dropzoneContent').classList.remove('hidden');
                },
                error: function(error) {
                    console.error('Error parsing CSV:', error);
                    showError('Error parsing CSV file. Please check the format and try again.');
                    resetUploadUI();
                }
            });
        } catch (error) {
            console.error('Error processing CSV file:', error);
            showError('Error processing CSV file. Please check the format and try again.');
            resetUploadUI();
        }
    };
    
    reader.onerror = function() {
        clearInterval(progressInterval);
        showError('Error reading file. Please try again.');
        resetUploadUI();
    };
    
    // Show progress bar
    document.getElementById('dropzoneContent').classList.add('hidden');
    document.getElementById('uploadProgress').classList.remove('hidden');
    
    // Read the file as text
    reader.readAsText(file);
}

// Transform CSV data from indicators as rows to students as rows
function transformCSVData(rawData) {
    // Similar to transformExcelData but for CSV format
    const transformedData = [];
    
    // Find the indicator column
    const indicatorColumn = 'Indicator';
    
    // Get all student column names
    const firstRow = rawData[0];
    const studentColumns = Object.keys(firstRow).filter(key => key !== indicatorColumn);
    
    // Create a student object for each column
    studentColumns.forEach(studentCol => {
        const studentData = {
            studentId: studentCol
        };
        
        // Extract data for each indicator for this student
        rawData.forEach(row => {
            const indicator = row[indicatorColumn];
            const value = row[studentCol];
            
            // Map indicator names to our expected field names (same as in transformExcelData)
            switch(indicator) {
                case 'Yield Curve (10Y-2Y)':
                    studentData['10Y2Y_Yield'] = value;
                    break;
                case 'ISM New Orders':
                    studentData['ISM_NewOrders'] = value;
                    break;
                case 'Building Permits':
                    studentData['Building_Permits'] = value;
                    break;
                case 'Consumer Confidence':
                    studentData['Consumer_Confidence'] = value;
                    break;
                case 'Initial Claims':
                    studentData['Initial_Claims'] = value;
                    break;
                case 'S&P 500':
                    studentData['SP500'] = value;
                    break;
                case 'Average Weekly Hours':
                case 'CLI': // Map CLI to Avg_WeeklyHours as a substitute
                    studentData['Avg_WeeklyHours'] = value;
                    break;
                case '12-Month GDP Growth':
                    studentData['GDP_12Month'] = value;
                    break;
                case '24-Month GDP Growth':
                    studentData['GDP_24Month'] = value;
                    break;
                case 'Recession Probability':
                    studentData['Recession_Probability'] = value;
                    break;
                case 'PMI': // Add PMI mapping
                    studentData['PMI'] = value;
                    break;
                default:
                    // Store other indicators with a sanitized name
                    const sanitizedName = indicator.replace(/[^a-zA-Z0-9]/g, '_');
                    studentData[sanitizedName] = value;
            }
        });
        
        transformedData.push(studentData);
    });
    
    return transformedData;
}

// Process student data from uploaded file
function processStudentData(data) {
    // Store the raw data
    state.studentData = data;
    
    // Calculate average weights for each indicator
    calculateAverageWeights();
    
    // Process GDP forecasts
    processGDPForecasts();
    
    // Process recession probabilities
    processRecessionProbabilities();
    
    // Calculate aggregate index using average weights
    calculateIndex();
    
    // Update all charts and tables
    updateCharts();
    
    // Analyze signals with default threshold
    analyzeSignals();
    
    // Show analysis content
    document.getElementById('analysisContent').classList.remove('hidden');
}

// Calculate average weights for each indicator from student data
function calculateAverageWeights() {
    // Reset weights
    state.indicators.forEach(ind => ind.weight = 0);
    
    if (!state.studentData || state.studentData.length === 0) return;
    
    // Calculate sum of weights for each indicator
    state.studentData.forEach(student => {
        state.indicators.forEach(ind => {
            // Assuming column names in the Excel/CSV match indicator IDs
            const weight = parseFloat(student[ind.id]) || 0;
            ind.weight += weight;
        });
    });
    
    // Calculate average
    const studentCount = state.studentData.length;
    state.indicators.forEach(ind => {
        ind.weight = Math.round(ind.weight / studentCount);
    });
    
    // Update weights table
    updateWeightsTable();
}

// Update the weights table with statistics
function updateWeightsTable() {
    const tableBody = document.getElementById('weightsTable');
    tableBody.innerHTML = '';
    
    // Calculate min/max for each indicator
    const stats = state.indicators.map(ind => {
        const weights = state.studentData.map(student => parseFloat(student[ind.id]) || 0);
        return {
            id: ind.id,
            label: ind.label,
            avg: ind.weight,
            min: Math.min(...weights),
            max: Math.max(...weights)
        };
    });
    
    // Create table rows
    stats.forEach(stat => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-4 py-2">${stat.label}</td>
            <td class="px-4 py-2">${stat.avg.toFixed(1)}%</td>
            <td class="px-4 py-2">${stat.min.toFixed(1)}%</td>
            <td class="px-4 py-2">${stat.max.toFixed(1)}%</td>
        `;
        tableBody.appendChild(row);
    });
}

// Process GDP forecasts from student data
function processGDPForecasts() {
    if (!state.studentData || state.studentData.length === 0) return;
    
    // Extract GDP 12-month forecasts
    const gdp12Data = state.studentData.map(student => parseFloat(student['GDP_12Month']) || 0);
    
    // Extract GDP 24-month forecasts
    const gdp24Data = state.studentData.map(student => parseFloat(student['GDP_24Month']) || 0);
    
    // Calculate statistics for 12-month forecasts
    const gdp12Stats = calculateStatistics(gdp12Data);
    
    // Calculate statistics for 24-month forecasts
    const gdp24Stats = calculateStatistics(gdp24Data);
    
    // Update GDP statistics in the UI
    document.getElementById('gdp12Avg').textContent = `${gdp12Stats.mean.toFixed(2)}%`;
    document.getElementById('gdp12Median').textContent = `${gdp12Stats.median.toFixed(2)}%`;
    document.getElementById('gdp12Min').textContent = `${gdp12Stats.min.toFixed(2)}%`;
    document.getElementById('gdp12Max').textContent = `${gdp12Stats.max.toFixed(2)}%`;
    
    document.getElementById('gdp24Avg').textContent = `${gdp24Stats.mean.toFixed(2)}%`;
    document.getElementById('gdp24Median').textContent = `${gdp24Stats.median.toFixed(2)}%`;
    document.getElementById('gdp24Min').textContent = `${gdp24Stats.min.toFixed(2)}%`;
    document.getElementById('gdp24Max').textContent = `${gdp24Stats.max.toFixed(2)}%`;
    
    // Create histograms for GDP forecasts
    updateGDPCharts(gdp12Data, gdp24Data);
}

// Process recession probabilities from student data
function processRecessionProbabilities() {
    if (!state.studentData || state.studentData.length === 0) return;
    
    // Extract recession probabilities
    const recessionData = state.studentData.map(student => parseFloat(student['Recession_Probability']) || 0);
    
    // Calculate statistics
    const stats = calculateStatistics(recessionData);
    
    // Update recession statistics in the UI
    document.getElementById('recessionAvg').textContent = `${stats.mean.toFixed(2)}%`;
    document.getElementById('recessionMedian').textContent = `${stats.median.toFixed(2)}%`;
    document.getElementById('recessionMin').textContent = `${stats.min.toFixed(2)}%`;
    document.getElementById('recessionMax').textContent = `${stats.max.toFixed(2)}%`;
    
    // Create histogram for recession probabilities
    updateRecessionChart(recessionData);
    
    // Update probability ranges
    updateProbabilityRanges(recessionData);
}

// Update probability ranges display
function updateProbabilityRanges(data) {
    const rangesContainer = document.getElementById('probabilityRanges');
    rangesContainer.innerHTML = '';
    
    // Define probability ranges
    const ranges = [
        { min: 0, max: 20, label: 'Very Low (0-20%)' },
        { min: 20, max: 40, label: 'Low (20-40%)' },
        { min: 40, max: 60, label: 'Moderate (40-60%)' },
        { min: 60, max: 80, label: 'High (60-80%)' },
        { min: 80, max: 100, label: 'Very High (80-100%)' }
    ];
    
    // Count students in each range
    ranges.forEach(range => {
        const count = data.filter(p => p >= range.min && p < range.max).length;
        const percentage = (count / data.length) * 100;
        
        const rangeDiv = document.createElement('div');
        rangeDiv.className = 'flex items-center';
        rangeDiv.innerHTML = `
            <div class="w-32 text-sm text-gray-600">${range.label}:</div>
            <div class="flex-1 mx-2">
                <div class="bg-gray-200 h-4 rounded-full overflow-hidden">
                    <div class="bg-red-500 h-full" style="width: ${percentage}%"></div>
                </div>
            </div>
            <div class="text-sm font-medium">${count} (${percentage.toFixed(1)}%)</div>
        `;
        
        rangesContainer.appendChild(rangeDiv);
    });
}

// Calculate basic statistics for an array of numbers
function calculateStatistics(data) {
    if (!data || data.length === 0) {
        return { min: 0, max: 0, mean: 0, median: 0 };
    }
    
    // Sort data for median calculation
    const sortedData = [...data].sort((a, b) => a - b);
    
    // Calculate statistics
    const min = Math.min(...data);
    const max = Math.max(...data);
    const sum = data.reduce((acc, val) => acc + val, 0);
    const mean = sum / data.length;
    
    // Calculate median
    let median;
    const mid = Math.floor(sortedData.length / 2);
    if (sortedData.length % 2 === 0) {
        median = (sortedData[mid - 1] + sortedData[mid]) / 2;
    } else {
        median = sortedData[mid];
    }
    
    return { min, max, mean, median };
}

// Update GDP forecast charts
function updateGDPCharts(gdp12Data, gdp24Data) {
    // Create histogram bins for 12-month GDP
    const gdp12Bins = createHistogramBins(gdp12Data, 0.5);
    
    // Create histogram bins for 24-month GDP
    const gdp24Bins = createHistogramBins(gdp24Data, 0.5);
    
    // Update 12-month GDP chart
    state.charts.gdp12Chart.data.labels = gdp12Bins.labels;
    state.charts.gdp12Chart.data.datasets[0].data = gdp12Bins.counts;
    state.charts.gdp12Chart.update();
    
    // Update 24-month GDP chart
    state.charts.gdp24Chart.data.labels = gdp24Bins.labels;
    state.charts.gdp24Chart.data.datasets[0].data = gdp24Bins.counts;
    state.charts.gdp24Chart.update();
}

// Update recession probability chart
function updateRecessionChart(recessionData) {
    // Create histogram bins
    const bins = createHistogramBins(recessionData, 10);
    
    // Update chart
    state.charts.recessionChart.data.labels = bins.labels;
    state.charts.recessionChart.data.datasets[0].data = bins.counts;
    state.charts.recessionChart.update();
}

// Create histogram bins for data visualization
function createHistogramBins(data, binSize) {
    if (!data || data.length === 0) {
        return { labels: [], counts: [] };
    }
    
    // Determine min and max values
    const min = Math.floor(Math.min(...data));
    const max = Math.ceil(Math.max(...data));
    
    // Create bins
    const bins = {};
    for (let i = min; i <= max; i += binSize) {
        const binLabel = binSize < 1 
            ? `${i.toFixed(1)}-${(i + binSize).toFixed(1)}` 
            : `${i}-${i + binSize}`;
        bins[binLabel] = 0;
    }
    
    // Count values in each bin
    data.forEach(value => {
        const binIndex = Math.floor((value - min) / binSize);
        const binStart = min + (binIndex * binSize);
        const binLabel = binSize < 1 
            ? `${binStart.toFixed(1)}-${(binStart + binSize).toFixed(1)}` 
            : `${binStart}-${binStart + binSize}`;
        
        if (bins[binLabel] !== undefined) {
            bins[binLabel]++;
        }
    });
    
    // Convert to arrays for Chart.js
    const labels = Object.keys(bins);
    const counts = Object.values(bins);
    
    return { labels, counts };
}

// Calculate the aggregate leading index using average weights
function calculateIndex() {
    if (!state.zScoreData || state.zScoreData.length === 0) return;
    
    // Get normalized weights (ensure they sum to 1)
    const totalWeight = state.indicators.reduce((sum, ind) => sum + ind.weight, 0);
    const weights = {};
    
    state.indicators.forEach(ind => {
        weights[ind.id] = totalWeight > 0 ? ind.weight / totalWeight : 0;
    });
    
    // Calculate weighted index for each date
    state.aggregateIndex = state.zScoreData.map(row => {
        let indexValue = 0;
        
        // Calculate weighted sum of indicators
        Object.entries(weights).forEach(([indicator, weight]) => {
            // For Initial Claims, invert the value since higher is worse
            const value = indicator === "Initial_Claims" ? -row[indicator] : row[indicator];
            indexValue += (value || 0) * weight;
        });
        
        return {
            date: row.date,
            value: indexValue
        };
    });
    
    // Update the index chart
    updateIndexChart();
}

// Update the aggregate index chart
function updateIndexChart() {
    if (!state.aggregateIndex || state.aggregateIndex.length === 0) return;
    
    // Prepare data for chart
    const chartData = {
        labels: state.aggregateIndex.map(d => d.date),
        datasets: [{
            label: 'Aggregate Leading Index',
            data: state.aggregateIndex.map(d => ({ x: d.date, y: d.value })),
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 2,
            fill: false,
            tension: 0.1
        }]
    };
    
    // Prepare recession overlays
    const recessionOverlays = state.recessionData.map(recession => ({
        type: 'box',
        xMin: recession.start,
        xMax: recession.end,
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        borderWidth: 0
    }));
    
    // Update chart
    state.charts.indexChart.data = chartData;
    state.charts.indexChart.options.plugins.annotation.annotations = recessionOverlays;
    state.charts.indexChart.update();
}

// Update all charts with current data
function updateCharts() {
    // Update weights chart
    state.charts.weightsChart.data.datasets[0].data = state.indicators.map(ind => ind.weight);
    state.charts.weightsChart.update();
    
    // Other charts are updated in their respective functions
}

// Generate signals based on threshold and analyze them
function analyzeSignals() {
    if (!state.aggregateIndex || state.aggregateIndex.length === 0) return;
    
    // Get threshold and direction from UI
    const threshold = parseFloat(document.getElementById('signalThreshold').value);
    const direction = document.getElementById('signalDirection').value;
    
    // Generate signals
    state.signals = generateSignals(threshold, direction);
    
    // Analyze signals against recessions
    state.signalAnalysis = analyzeSignalPerformance(state.signals);
    
    // Update signals table
    updateSignalsTable();
    
    // Update performance metrics
    updatePerformanceMetrics();
}

// Generate signals based on threshold and direction
function generateSignals(threshold, direction) {
    const signals = [];
    let inSignalState = false;
    
    state.aggregateIndex.forEach((dataPoint, index) => {
        const value = dataPoint.value;
        const date = dataPoint.date;
        
        // Check if value crosses threshold based on direction
        const isSignal = direction === 'below' ? value < threshold : value > threshold;
        
        // Only register signal when first crossing threshold
        if (isSignal && !inSignalState) {
            signals.push({
                date,
                value,
                index
            });
            inSignalState = true;
        } else if (!isSignal) {
            inSignalState = false;
        }
    });
    
    return signals;
}

// Analyze signal performance against recessions
function analyzeSignalPerformance(signals) {
    if (!signals || signals.length === 0 || !state.recessionData || state.recessionData.length === 0) {
        return {
            truePositives: 0,
            falsePositives: 0,
            missedRecessions: 0,
            avgLeadTime: 0,
            signalDetails: []
        };
    }
    
    // Track performance metrics
    let truePositives = 0;
    let falsePositives = 0;
    let totalLeadTime = 0;
    const detectedRecessions = new Set();
    const signalDetails = [];
    
    // Analyze each signal
    signals.forEach(signal => {
        // Find the next recession after this signal
        const nextRecession = state.recessionData.find(recession => 
            recession.start > signal.date
        );
        
        // Find current recession if signal occurs during recession
        const currentRecession = state.recessionData.find(recession => 
            signal.date >= recession.start && signal.date <= recession.end
        );
        
        if (nextRecession) {
            // Calculate lead time in months
            const leadTime = Math.round((nextRecession.start - signal.date) / (30 * 24 * 60 * 60 * 1000));
            
            // Consider it a true positive if lead time is between 1-24 months
            if (leadTime >= 1 && leadTime <= 24) {
                truePositives++;
                detectedRecessions.add(nextRecession.start.getTime());
                totalLeadTime += leadTime;
                
                signalDetails.push({
                    date: signal.date,
                    value: signal.value,
                    recessionStart: nextRecession.start,
                    leadTime,
                    result: 'True Positive'
                });
            } else {
                falsePositives++;
                
                signalDetails.push({
                    date: signal.date,
                    value: signal.value,
                    recessionStart: null,
                    leadTime: null,
                    result: 'False Positive'
                });
            }
        } else if (currentRecession) {
            // Signal during recession is not counted as false positive
            signalDetails.push({
                date: signal.date,
                value: signal.value,
                recessionStart: currentRecession.start,
                leadTime: 0,
                result: 'During Recession'
            });
        } else {
            falsePositives++;
            
            signalDetails.push({
                date: signal.date,
                value: signal.value,
                recessionStart: null,
                leadTime: null,
                result: 'False Positive'
            });
        }
    });
    
    // Calculate missed recessions
    const missedRecessions = state.recessionData.length - detectedRecessions.size;
    
    // Calculate average lead time
    const avgLeadTime = truePositives > 0 ? Math.round(totalLeadTime / truePositives) : 0;
    
    return {
        truePositives,
        falsePositives,
        missedRecessions,
        avgLeadTime,
        signalDetails
    };
}

// Update signals table with analysis results
function updateSignalsTable() {
    const tableBody = document.getElementById('signalsTable');
    tableBody.innerHTML = '';
    
    if (!state.signalAnalysis.signalDetails) return;
    
    // Create table rows for each signal
    state.signalAnalysis.signalDetails.forEach(signal => {
        const row = document.createElement('tr');
        
        const dateStr = signal.date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short'
        });
        
        const recessionDateStr = signal.recessionStart ? 
            signal.recessionStart.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short'
            }) : 
            '-';
        
        row.innerHTML = `
            <td class="px-4 py-2">${dateStr}</td>
            <td class="px-4 py-2">${signal.value.toFixed(2)}</td>
            <td class="px-4 py-2">${recessionDateStr}</td>
            <td class="px-4 py-2">${signal.leadTime !== null ? signal.leadTime : '-'}</td>
        `;
        
        // Add color based on result
        if (signal.result === 'True Positive') {
            row.classList.add('bg-green-50');
        } else if (signal.result === 'False Positive') {
            row.classList.add('bg-red-50');
        }
        
        tableBody.appendChild(row);
    });
}

// Update performance metrics display
function updatePerformanceMetrics() {
    document.getElementById('truePositives').textContent = state.signalAnalysis.truePositives;
    document.getElementById('falsePositives').textContent = state.signalAnalysis.falsePositives;
    document.getElementById('avgLeadTime').textContent = `${state.signalAnalysis.avgLeadTime} months`;
    document.getElementById('missedRecessions').textContent = state.signalAnalysis.missedRecessions;
}

// Reset upload UI after error
function resetUploadUI() {
    document.getElementById('dropzoneContent').classList.remove('hidden');
    document.getElementById('uploadProgress').classList.add('hidden');
    document.getElementById('progressBar').style.width = '0%';
}

// Show file info after successful upload
function showFileInfo(fileName, studentCount) {
    document.getElementById('fileName').textContent = fileName;
    document.getElementById('studentCount').textContent = `${studentCount} student responses loaded`;
    document.getElementById('fileInfo').classList.remove('hidden');
}

// Show error message
function showError(message) {
    alert(message);
}

// Download analysis results as CSV
function downloadResults() {
    // Prepare data for download
    const data = [
        // Header row
        ['TA Dashboard Analysis Results', '', '', ''],
        ['Generated on', new Date().toLocaleString(), '', ''],
        ['', '', '', ''],
        
        // Indicator weights
        ['Indicator Weights', '', '', ''],
        ['Indicator', 'Average Weight (%)', 'Min Weight (%)', 'Max Weight (%)'],
        ...state.indicators.map(ind => {
            const weights = state.studentData.map(student => parseFloat(student[ind.id]) || 0);
            return [
                ind.label,
                ind.weight.toFixed(1),
                Math.min(...weights).toFixed(1),
                Math.max(...weights).toFixed(1)
            ];
        }),
        ['', '', '', ''],
        
        // GDP forecasts
        ['GDP Growth Forecasts', '', '', ''],
        ['Timeframe', 'Average (%)', 'Median (%)', 'Min (%)', 'Max (%)'],
        ['12-Month', 
            calculateStatistics(state.studentData.map(s => parseFloat(s['GDP_12Month']) || 0)).mean.toFixed(2),
            calculateStatistics(state.studentData.map(s => parseFloat(s['GDP_12Month']) || 0)).median.toFixed(2),
            calculateStatistics(state.studentData.map(s => parseFloat(s['GDP_12Month']) || 0)).min.toFixed(2),
            calculateStatistics(state.studentData.map(s => parseFloat(s['GDP_12Month']) || 0)).max.toFixed(2)
        ],
        ['24-Month', 
            calculateStatistics(state.studentData.map(s => parseFloat(s['GDP_24Month']) || 0)).mean.toFixed(2),
            calculateStatistics(state.studentData.map(s => parseFloat(s['GDP_24Month']) || 0)).median.toFixed(2),
            calculateStatistics(state.studentData.map(s => parseFloat(s['GDP_24Month']) || 0)).min.toFixed(2),
            calculateStatistics(state.studentData.map(s => parseFloat(s['GDP_24Month']) || 0)).max.toFixed(2)
        ],
        ['', '', '', ''],
        
        // Recession probability
        ['Recession Probability', '', '', ''],
        ['Average (%)', 'Median (%)', 'Min (%)', 'Max (%)'],
        [
            calculateStatistics(state.studentData.map(s => parseFloat(s['Recession_Probability']) || 0)).mean.toFixed(2),
            calculateStatistics(state.studentData.map(s => parseFloat(s['Recession_Probability']) || 0)).median.toFixed(2),
            calculateStatistics(state.studentData.map(s => parseFloat(s['Recession_Probability']) || 0)).min.toFixed(2),
            calculateStatistics(state.studentData.map(s => parseFloat(s['Recession_Probability']) || 0)).max.toFixed(2)
        ],
        ['', '', '', ''],
        
        // Signal analysis
        ['Signal Analysis', '', '', ''],
        ['Metric', 'Value', '', ''],
        ['True Positives', state.signalAnalysis.truePositives, '', ''],
        ['False Positives', state.signalAnalysis.falsePositives, '', ''],
        ['Missed Recessions', state.signalAnalysis.missedRecessions, '', ''],
        ['Average Lead Time', `${state.signalAnalysis.avgLeadTime} months`, '', ''],
        ['', '', '', ''],
        
        // Signal details
        ['Signal Details', '', '', ''],
        ['Date', 'Value', 'Recession Start', 'Lead Time (Months)'],
        ...(state.signalAnalysis.signalDetails || []).map(signal => [
            signal.date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
            signal.value.toFixed(2),
            signal.recessionStart ? signal.recessionStart.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : '-',
            signal.leadTime !== null ? signal.leadTime : '-'
        ])
    ];
    
    // Convert to CSV
    const csv = Papa.unparse(data);
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ta_dashboard_analysis.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}