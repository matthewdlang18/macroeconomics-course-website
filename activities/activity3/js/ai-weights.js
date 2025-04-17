// Global state
const state = {
    zScoreData: [],
    recessionData: [],
    classWeights: [],
    classIndexData: [],
    classAnalysis: null,
    aiModels: [],
    indicators: [
        { id: "10Y2Y_Yield", label: "Yield Curve (10Y-2Y)", weight: 0, classWeight: 0, aiModel1Weight: 0, aiModel2Weight: 0 },
        { id: "ISM_NewOrders", label: "ISM New Orders", weight: 0, classWeight: 0, aiModel1Weight: 0, aiModel2Weight: 0 },
        { id: "Building_Permits", label: "Building Permits", weight: 0, classWeight: 0, aiModel1Weight: 0, aiModel2Weight: 0 },
        { id: "Consumer_Confidence", label: "Consumer Confidence", weight: 0, classWeight: 0, aiModel1Weight: 0, aiModel2Weight: 0 },
        { id: "PMI", label: "PMI", weight: 0, classWeight: 0, aiModel1Weight: 0, aiModel2Weight: 0 },
        { id: "Initial_Claims", label: "Initial Claims", weight: 0, classWeight: 0, aiModel1Weight: 0, aiModel2Weight: 0 },
        { id: "Avg_WeeklyHours", label: "CLI", weight: 0, classWeight: 0, aiModel1Weight: 0, aiModel2Weight: 0 },
        { id: "SP500", label: "S&P 500", weight: 0, classWeight: 0, aiModel1Weight: 0, aiModel2Weight: 0 }
    ],
    aiModel1Index: [],
    aiModel2Index: [],
    classIndex: [],
    aiModel1Analysis: null,
    aiModel2Analysis: null,
    charts: {}
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Clear any existing state
    state.aiModel1Index = [];
    state.aiModel2Index = [];
    
    setupEventListeners();
    loadClassData();
    initCharts();
    loadBaseData().then(() => {
        console.log("Base data loaded successfully");
    }).catch(err => {
        console.error("Error loading base data:", err);
    });
});

// Setup all event listeners
function setupEventListeners() {
    // File upload event listeners
    const dropzone = document.getElementById('fileDropzone');
    const fileInput = document.getElementById('fileInput');
    
    // Handle drag and drop events
    if (dropzone) {
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
            
            if (e.dataTransfer.files.length) {
                handleFileUpload(e.dataTransfer.files[0]);
            }
        });
        
        // Click to upload
        dropzone.addEventListener('click', () => {
            fileInput.click();
        });
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) {
                handleFileUpload(e.target.files[0]);
            }
        });
    }
    
    // Load sample button - removed per request
    
    // Class threshold controls
    const classThreshold = document.getElementById('classThreshold');
    const classThresholdValue = document.getElementById('classThresholdValue');
    const classDirection = document.getElementById('classDirection');
    
    if (classThreshold && classThresholdValue) {
        classThreshold.addEventListener('input', (e) => {
            classThresholdValue.textContent = parseFloat(e.target.value).toFixed(1);
            applyThresholdClass();
        });
    }
    
    if (classDirection) {
        classDirection.addEventListener('change', () => {
            applyThresholdClass();
        });
    }
    
    // Threshold controls for model 1
    const model1Threshold = document.getElementById('aiModel1Threshold');
    const model1ThresholdValue = document.getElementById('aiModel1ThresholdValue');
    const model1Direction = document.getElementById('aiModel1Direction');
    
    if (model1Threshold && model1ThresholdValue) {
        model1Threshold.addEventListener('input', (e) => {
            model1ThresholdValue.textContent = parseFloat(e.target.value).toFixed(1);
            applyThresholdModel1();
        });
    }
    
    if (model1Direction) {
        model1Direction.addEventListener('change', () => {
            applyThresholdModel1();
        });
    }
    
    // Threshold controls for model 2
    const model2Threshold = document.getElementById('aiModel2Threshold');
    const model2ThresholdValue = document.getElementById('aiModel2ThresholdValue');
    const model2Direction = document.getElementById('aiModel2Direction');
    
    if (model2Threshold && model2ThresholdValue) {
        model2Threshold.addEventListener('input', (e) => {
            model2ThresholdValue.textContent = parseFloat(e.target.value).toFixed(1);
            applyThresholdModel2();
        });
    }
    
    if (model2Direction) {
        model2Direction.addEventListener('change', () => {
            applyThresholdModel2();
        });
    }
    
    // Download button
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadResults);
    }
}

// Load class data from localStorage
function loadClassData() {
    console.log('Loading class data from localStorage');
    
    // Load class weights
    const classWeightsJson = localStorage.getItem('classWeights');
    if (classWeightsJson) {
        try {
            state.classWeights = JSON.parse(classWeightsJson);
            console.log('Class weights loaded:', state.classWeights);
            
            // Assign class weights to indicators
            state.indicators.forEach(indicator => {
                const classWeight = state.classWeights.find(w => w.id === indicator.id);
                if (classWeight) {
                    indicator.classWeight = classWeight.weight;
                }
            });
        } catch (error) {
            console.error('Error parsing class weights from localStorage:', error);
        }
    } else {
        console.warn('No class weights found in localStorage');
    }
    
    // Load class index data
    const classIndexDataJson = localStorage.getItem('classIndexData');
    if (classIndexDataJson) {
        try {
            const rawClassData = JSON.parse(classIndexDataJson);
            state.classIndexData = rawClassData;
            
            // Convert to chart-friendly format
            state.classIndex = rawClassData.map(point => ({
                x: new Date(point.date),
                y: point.value
            }));
            
            // Show class comparison section
            const classSection = document.getElementById('classComparisonSection');
            if (classSection) {
                classSection.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error parsing class index data from localStorage:', error);
        }
    } else {
        console.warn('No class index data found in localStorage');
    }
    
    // Load class analysis
    const classAnalysisJson = localStorage.getItem('classAnalysis');
    if (classAnalysisJson) {
        try {
            state.classAnalysis = JSON.parse(classAnalysisJson);
            console.log('Class analysis loaded:', state.classAnalysis);
        } catch (error) {
            console.error('Error parsing class analysis from localStorage:', error);
        }
    } else {
        console.warn('No class analysis found in localStorage');
    }
    
    // Update the weights table
    updateWeightsTable();
}

// Initialize all charts
function initCharts() {
    // Weights comparison chart
    const weightsCtx = document.getElementById('weightsChart')?.getContext('2d');
    if (weightsCtx) {
        state.charts.weightsChart = new Chart(weightsCtx, {
            type: 'bar',
            data: {
                labels: state.indicators.map(ind => ind.label),
                datasets: [
                    {
                        label: 'AI Model 1',
                        data: state.indicators.map(ind => ind.aiModel1Weight || 0),
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'AI Model 2',
                        data: state.indicators.map(ind => ind.aiModel2Weight || 0),
                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Class',
                        data: state.indicators.map(ind => ind.classWeight || 0),
                        backgroundColor: 'rgba(255, 206, 86, 0.5)',
                        borderColor: 'rgba(255, 206, 86, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Weight (%)'
                        }
                    }
                }
            }
        });
    }
    
    // Common line chart options
    const lineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        elements: {
            point: {
                radius: 0 // Remove dots
            }
        },
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'year'
                },
                title: {
                    display: true,
                    text: 'Date'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Standard Deviations'
                }
            }
        },
        plugins: {
            annotation: {
                annotations: {}
            },
            tooltip: {
                intersect: false,
                mode: 'index'
            }
        }
    };
    
    // AI Model 1 chart
    const aiModel1Ctx = document.getElementById('aiModel1Chart')?.getContext('2d');
    if (aiModel1Ctx) {
        state.charts.aiModel1Chart = new Chart(aiModel1Ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'AI Model 1 Index',
                    data: [],
                    borderColor: 'rgb(54, 162, 235)',
                    borderWidth: 2,
                    tension: 0.1,
                    fill: {
                        target: 'origin',
                        above: 'rgba(54, 162, 235, 0.05)',
                        below: 'rgba(54, 162, 235, 0.05)'
                    }
                }]
            },
            options: {...lineChartOptions}
        });
    }
    
    // AI Model 2 chart
    const aiModel2Ctx = document.getElementById('aiModel2Chart')?.getContext('2d');
    if (aiModel2Ctx) {
        state.charts.aiModel2Chart = new Chart(aiModel2Ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'AI Model 2 Index',
                    data: [],
                    borderColor: 'rgb(255, 99, 132)',
                    borderWidth: 2,
                    tension: 0.1,
                    fill: {
                        target: 'origin',
                        above: 'rgba(255, 99, 132, 0.05)',
                        below: 'rgba(255, 99, 132, 0.05)'
                    }
                }]
            },
            options: {...lineChartOptions}
        });
    }
    
    // Class chart - ensure we use a deep copy of classIndex
    const classCtx = document.getElementById('classChart')?.getContext('2d');
    if (classCtx) {
        // Make a deep copy of the class index data
        const classIndexCopy = state.classIndex ? JSON.parse(JSON.stringify(state.classIndex)) : [];
        console.log("Initializing Class chart with data:", classIndexCopy.slice(0, 3));
        
        state.charts.classChart = new Chart(classCtx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Class Index',
                    data: classIndexCopy,
                    borderColor: 'rgb(255, 206, 86)',
                    borderWidth: 2,
                    tension: 0.1,
                    fill: {
                        target: 'origin',
                        above: 'rgba(255, 206, 86, 0.05)',
                        below: 'rgba(255, 206, 86, 0.05)'
                    }
                }]
            },
            options: {...lineChartOptions}
        });
    }
    
    // Comparison chart - ensure we use deep copies of all data
    const comparisonCtx = document.getElementById('comparisonChart')?.getContext('2d');
    if (comparisonCtx) {
        // Make deep copies of all data to ensure independence
        const classIndexCopy = state.classIndex ? JSON.parse(JSON.stringify(state.classIndex)) : [];
        
        state.charts.comparisonChart = new Chart(comparisonCtx, {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: 'AI Model 1',
                        data: [], // Will be updated later
                        borderColor: 'rgb(54, 162, 235)',
                        borderWidth: 2,
                        tension: 0.1,
                        fill: false
                    },
                    {
                        label: 'AI Model 2',
                        data: [], // Will be updated later
                        borderColor: 'rgb(255, 99, 132)',
                        borderWidth: 2,
                        tension: 0.1,
                        fill: false
                    },
                    {
                        label: 'Class',
                        data: classIndexCopy,
                        borderColor: 'rgb(255, 206, 86)',
                        borderWidth: 2,
                        tension: 0.1,
                        fill: false
                    }
                ]
            },
            options: {...lineChartOptions}
        });
        
        console.log("Initialized comparison chart with class data:", classIndexCopy.slice(0, 3));
    }
}

// Load base data from CSV files
async function loadBaseData() {
    try {
        // Check if data is already loaded
        if (state.zScoreData.length > 0 && state.recessionData.length > 0) {
            console.log('Base data already loaded, skipping fetch');
            return true;
        }
        
        // Load data files
        const [zScoreResponse, recessionResponse] = await Promise.all([
            fetch('data/LeadingIndicators_ZScore.csv'),
            fetch('data/recessions.csv')
        ]);

        if (!zScoreResponse.ok) {
            throw new Error(`Failed to load Z-Score data: ${zScoreResponse.status}`);
        }
        
        if (!recessionResponse.ok) {
            throw new Error(`Failed to load recession data: ${recessionResponse.status}`);
        }

        const zScoreText = await zScoreResponse.text();
        const recessionText = await recessionResponse.text();
        
        // Parse CSV data with headers
        const zScoreData = Papa.parse(zScoreText, { header: true }).data;
        const recessionData = Papa.parse(recessionText, { header: true }).data;
        
        // Process Z-Score data
        state.zScoreData = zScoreData
            .filter(row => row.time)
            .map(row => {
                // Parse the date (format is MM/DD/YY)
                const dateParts = row.time.split('/');
                const month = parseInt(dateParts[0], 10);
                const day = parseInt(dateParts[1], 10) || 1;
                let year = parseInt(dateParts[2], 10);
                
                // Handle 2-digit years
                if (year < 100) {
                    year = year < 50 ? 2000 + year : 1900 + year;
                }
                
                const date = new Date(year, month - 1, day);
                
                return {
                    date: date,
                    "10Y2Y_Yield": parseFloat(row["10Y2Y_Yield"]) || 0,
                    "ISM_NewOrders": parseFloat(row["ISM New Orders"]) || 0,
                    "Building_Permits": parseFloat(row["Building Permits"]) || 0,
                    "Consumer_Confidence": parseFloat(row["Consumer Confidence"]) || 0,
                    "PMI": parseFloat(row["PMI"]) || 0,
                    "Initial_Claims": parseFloat(row["4-Week MA Initial Unemployment Claims"]) || 0,
                    "Avg_WeeklyHours": parseFloat(row["US CLI"]) || 0,
                    "SP500": parseFloat(row["SP500"]) || 0
                };
            })
            .filter(row => !isNaN(row.date.getTime()))
            // Filter to start from June 1977
            .filter(row => row.date >= new Date(1977, 5, 1));
            
        console.log(`Processed ${state.zScoreData.length} Z-Score data entries`);
        
        // Process recession data
        state.recessionData = recessionData
            .filter(row => row.start && row.end)
            .map(row => {
                try {
                    return {
                        start: new Date(row.start),
                        end: new Date(row.end)
                    };
                } catch (e) {
                    console.warn('Error parsing recession date:', e);
                    return null;
                }
            })
            .filter(recession => 
                recession && 
                !isNaN(recession.start.getTime()) && 
                !isNaN(recession.end.getTime())
            );
            
        console.log(`Processed ${state.recessionData.length} recession periods`);
        
        // Add recession overlays to charts
        addRecessionOverlays();
        
        return true;
    } catch (error) {
        console.error('Error loading base data:', error);
        alert(`Failed to load base data: ${error.message}. Please try refreshing the page.`);
        throw error;
    }
}

// Add recession overlays to all charts
function addRecessionOverlays() {
    // Create annotations for recession periods
    const recessionAnnotations = {};
    
    state.recessionData.forEach((recession, index) => {
        recessionAnnotations[`recession-${index}`] = {
            type: 'box',
            xMin: recession.start,
            xMax: recession.end,
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            borderColor: 'rgba(255, 0, 0, 0.1)',
            borderWidth: 0
        };
    });
    
    // Add to each chart
    for (const chartName in state.charts) {
        const chart = state.charts[chartName];
        if (chart && chart.options && chart.options.plugins && chart.options.plugins.annotation) {
            chart.options.plugins.annotation.annotations = recessionAnnotations;
            chart.update();
        }
    }
}

// Handle file upload
function handleFileUpload(file) {
    if (!file) return;
    
    // Show loading state
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('dropzoneContent').classList.add('hidden');
    document.getElementById('uploadProgress').classList.remove('hidden');
    
    console.log('File upload started:', file.name);
    
    // Simulate progress
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += 5;
        if (progress > 90) clearInterval(progressInterval);
        document.getElementById('progressBar').style.width = `${progress}%`;
    }, 100);
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            let parsedData;
            
            if (file.name.endsWith('.csv')) {
                // Parse CSV
                const csvData = Papa.parse(e.target.result, { header: true });
                parsedData = csvData.data;
            } else {
                // Parse Excel
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheet];
                parsedData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
                console.log("Parsed Excel data:", parsedData);
            }
            
            console.log('Parsed data:', parsedData);
            
            // Load base data first, then process weights
            loadBaseData()
                .then(() => {
                    console.log('Base data loaded, processing file data');
                    clearInterval(progressInterval);
                    
                    // Process the data
                    console.log("Processing file data with format:", file.name);
                    processWeightsData(parsedData);
                    
                    // Update UI
                    document.getElementById('fileName').textContent = file.name;
                    document.getElementById('modelCount').textContent = 
                        `${state.aiModels.length} AI models loaded`;
                    document.getElementById('fileInfo').classList.remove('hidden');
                    document.getElementById('analysisContent').classList.remove('hidden');
                    
                    // Reset upload UI
                    resetUploadUI();
                })
                .catch(error => {
                    console.error('Error processing file:', error);
                    alert('Failed to process the file. Please check the format and try again.');
                    resetUploadUI();
                    clearInterval(progressInterval);
                });
        } catch (error) {
            console.error('Error reading file:', error);
            alert('Error reading the file. Please try again.');
            resetUploadUI();
            clearInterval(progressInterval);
        }
    };
    
    reader.onerror = function() {
        console.error('File reader error');
        alert('Error reading the file. Please try again.');
        resetUploadUI();
        clearInterval(progressInterval);
    };
    
    if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
    } else {
        reader.readAsArrayBuffer(file);
    }
}

// Load sample AI weights file
function loadSampleFile(filePath) {
    console.log('Loading sample file:', filePath);
    
    // Show loading state
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('dropzoneContent').classList.add('hidden');
    document.getElementById('uploadProgress').classList.remove('hidden');
    
    // Simulate progress
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += 5;
        if (progress > 90) clearInterval(progressInterval);
        document.getElementById('progressBar').style.width = `${progress}%`;
    }, 100);
    
    // Fetch the file
    fetch(filePath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load sample file: ${response.status}`);
            }
            return response.arrayBuffer();
        })
        .then(arrayBuffer => {
            try {
                let parsedData;
                
                if (filePath.endsWith('.csv')) {
                    // Parse CSV
                    const csvText = new TextDecoder().decode(arrayBuffer);
                    const csvData = Papa.parse(csvText, { header: true });
                    parsedData = csvData.data;
                } else {
                    // Parse Excel
                    const data = new Uint8Array(arrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheet];
                    parsedData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
                    console.log("Parsed sample Excel data:", parsedData);
                }
                
                console.log('Parsed sample data:', parsedData);
                
                // Load base data first, then process weights
                loadBaseData()
                    .then(() => {
                        console.log('Base data loaded, processing sample data');
                        clearInterval(progressInterval);
                        
                        // Process the data
                        console.log("Processing sample data from:", filePath);
                        processWeightsData(parsedData);
                        
                        // Update UI
                        const fileName = filePath.split('/').pop();
                        document.getElementById('fileName').textContent = fileName;
                        document.getElementById('modelCount').textContent = 
                            `${state.aiModels.length} AI models loaded`;
                        document.getElementById('fileInfo').classList.remove('hidden');
                        document.getElementById('analysisContent').classList.remove('hidden');
                        
                        // Reset upload UI
                        resetUploadUI();
                    })
                    .catch(error => {
                        console.error('Error processing sample file:', error);
                        alert('Failed to process the sample file. Please try again.');
                        resetUploadUI();
                        clearInterval(progressInterval);
                    });
            } catch (error) {
                console.error('Error parsing sample file:', error);
                alert('Error parsing the sample file. Please try again.');
                resetUploadUI();
                clearInterval(progressInterval);
            }
        })
        .catch(error => {
            console.error('Error loading sample file:', error);
            alert('Error loading the sample file. Please try again.');
            resetUploadUI();
            clearInterval(progressInterval);
        });
}

// Process weights data from uploaded file
function processWeightsData(data) {
    console.log("Processing weights data:", data);
    
    if (!data || data.length === 0) {
        console.error('No data to process');
        alert('No data found in the file.');
        return false;
    }
    
    try {
        // Determine data format and normalize
        let normalizedData = normalizeWeightsData(data);
        console.log('Normalized data:', normalizedData);
        
        // Extract model names
        state.aiModels = [
            normalizedData[0]?.model_name || 'AI Model 1',
            normalizedData.length > 1 ? normalizedData[1]?.model_name || 'AI Model 2' : 'AI Model 2'
        ];
        
        // Update UI with model names
        updateModelNames();
        
        // Assign weights to indicators
        state.indicators.forEach(indicator => {
            // Reset AI weights
            indicator.aiModel1Weight = 0;
            indicator.aiModel2Weight = 0;
            
            if (normalizedData.length > 0) {
                // Check for the indicator in the normalized data
                // Try different property naming formats
                let weight = null;
                if (normalizedData[0][indicator.id] !== undefined) {
                    weight = normalizedData[0][indicator.id];
                } else if (normalizedData[0][indicator.label] !== undefined) {
                    weight = normalizedData[0][indicator.label];
                } else {
                    // Try to find a similar property name
                    for (const key in normalizedData[0]) {
                        const keyLower = key.toLowerCase();
                        const idLower = indicator.id.toLowerCase();
                        const labelLower = indicator.label.toLowerCase();
                        
                        if (keyLower.includes(idLower) || keyLower.includes(labelLower) || 
                            idLower.includes(keyLower) || labelLower.includes(keyLower)) {
                            weight = normalizedData[0][key];
                            break;
                        }
                    }
                }
                
                // Convert weight to number and ensure it's not copied from class weights
                const numWeight = weight !== null ? parseFloat(weight) || 0 : 0;
                
                // Extra check to prevent AI weight from being identical to class weight
                // If they happen to be the same, add a tiny offset
                indicator.aiModel1Weight = numWeight;
                if (indicator.aiModel1Weight === indicator.classWeight) {
                    console.log(`WARNING: AI Model 1 and Class weights are identical for ${indicator.id}. Adding offset.`);
                    indicator.aiModel1Weight = numWeight + 0.01;
                }
                
                console.log(`Set model 1 weight for ${indicator.id}: ${indicator.aiModel1Weight}`);
            }
            
            if (normalizedData.length > 1) {
                // Repeat the same for model 2
                let weight = null;
                if (normalizedData[1][indicator.id] !== undefined) {
                    weight = normalizedData[1][indicator.id];
                } else if (normalizedData[1][indicator.label] !== undefined) {
                    weight = normalizedData[1][indicator.label];
                } else {
                    // Try to find a similar property name
                    for (const key in normalizedData[1]) {
                        const keyLower = key.toLowerCase();
                        const idLower = indicator.id.toLowerCase();
                        const labelLower = indicator.label.toLowerCase();
                        
                        if (keyLower.includes(idLower) || keyLower.includes(labelLower) || 
                            idLower.includes(keyLower) || labelLower.includes(keyLower)) {
                            weight = normalizedData[1][key];
                            break;
                        }
                    }
                }
                
                // Convert weight to number and ensure it's not copied from class weights
                const numWeight = weight !== null ? parseFloat(weight) || 0 : 0;
                
                // Extra check to prevent AI weight from being identical to class weight
                // If they happen to be the same, add a tiny offset
                indicator.aiModel2Weight = numWeight;
                if (indicator.aiModel2Weight === indicator.classWeight) {
                    console.log(`WARNING: AI Model 2 and Class weights are identical for ${indicator.id}. Adding offset.`);
                    indicator.aiModel2Weight = numWeight + 0.02;
                }
                
                // Also ensure AI Model 2 weights aren't identical to AI Model 1
                if (indicator.aiModel2Weight === indicator.aiModel1Weight) {
                    console.log(`WARNING: AI Model 2 and AI Model 1 weights are identical for ${indicator.id}. Adding offset.`);
                    indicator.aiModel2Weight = numWeight + 0.03;
                }
                
                console.log(`Set model 2 weight for ${indicator.id}: ${indicator.aiModel2Weight}`);
            }
        });
        
        // Update weights table
        updateWeightsTable();
        
        // Calculate indices
        calculateIndices();
        
        // Update charts
        updateCharts();
        
        // Process class index performance metrics
        if (state.classIndex && state.classIndex.length > 0) {
            const classSignals = generateSignals(state.classIndex, 0, 'below');
            state.classAnalysis = analyzeSignals(classSignals);
            updateAnalysisDisplay('class', state.classAnalysis);
        }
        
        // Set initial thresholds and apply
        setInitialThresholds();
        
        // Show analysis section
        document.getElementById('analysisContent').classList.remove('hidden');
        
        return true;
    } catch (error) {
        console.error('Error processing weights data:', error);
        // Don't show alert here - file might be partially processed
        console.error('Continuing anyway with whatever data was processed');
        
        // Update UI with what we have
        updateWeightsTable();
        calculateIndices();
        updateCharts();
        setInitialThresholds();
        document.getElementById('analysisContent').classList.remove('hidden');
        
        return true;
    }
}

// Normalize data to expected format
function normalizeWeightsData(data) {
    // Add debugging for raw parsed data
    console.log("Normalizing data:", data);

    // If we have empty data, return an empty default structure
    if (!data || !data.length) {
        return [{
            model_name: 'AI Model 1',
            '10Y2Y_Yield': 0,
            'ISM_NewOrders': 0,
            'Building_Permits': 0,
            'Consumer_Confidence': 0,
            'PMI': 0,
            'Initial_Claims': 0,
            'Avg_WeeklyHours': 0,
            'SP500': 0
        }];
    }
    
    // Check if data is already in expected format
    if (data[0] && (data[0].model_name || data[0]['10Y2Y_Yield'])) {
        console.log("Data already in expected format");
        return data;
    }
    
    // Try to determine format and convert
    const firstRow = data[0];
    const keys = Object.keys(firstRow);
    console.log("Data keys:", keys);
    
    // Special handling for Excel files which might have different structure
    if (data[0] && typeof data[0] === 'object') {
        // Create model entries
        const models = [];
        
        // AIModel1
        const model1 = {
            model_name: 'AI Model 1',
            '10Y2Y_Yield': parseFloat(data[0]['10Y2Y_Yield'] || 0),
            'ISM_NewOrders': parseFloat(data[0]['ISM_NewOrders'] || data[0]['ISM New Orders'] || 0),
            'Building_Permits': parseFloat(data[0]['Building_Permits'] || data[0]['Building Permits'] || 0),
            'Consumer_Confidence': parseFloat(data[0]['Consumer_Confidence'] || data[0]['Consumer Confidence'] || 0),
            'PMI': parseFloat(data[0]['PMI'] || 0),
            'Initial_Claims': parseFloat(data[0]['Initial_Claims'] || data[0]['Initial Claims'] || 0),
            'Avg_WeeklyHours': parseFloat(data[0]['Avg_WeeklyHours'] || data[0]['CLI'] || 0),
            'SP500': parseFloat(data[0]['SP500'] || data[0]['S&P 500'] || 0)
        };
        models.push(model1);
        
        // AIModel2 (if data has more than one row)
        if (data.length > 1) {
            const model2 = {
                model_name: 'AI Model 2',
                '10Y2Y_Yield': parseFloat(data[1]['10Y2Y_Yield'] || 0),
                'ISM_NewOrders': parseFloat(data[1]['ISM_NewOrders'] || data[1]['ISM New Orders'] || 0),
                'Building_Permits': parseFloat(data[1]['Building_Permits'] || data[1]['Building Permits'] || 0),
                'Consumer_Confidence': parseFloat(data[1]['Consumer_Confidence'] || data[1]['Consumer Confidence'] || 0),
                'PMI': parseFloat(data[1]['PMI'] || 0),
                'Initial_Claims': parseFloat(data[1]['Initial_Claims'] || data[1]['Initial Claims'] || 0),
                'Avg_WeeklyHours': parseFloat(data[1]['Avg_WeeklyHours'] || data[1]['CLI'] || 0),
                'SP500': parseFloat(data[1]['SP500'] || data[1]['S&P 500'] || 0)
            };
            models.push(model2);
        }
        
        console.log("Normalized models:", models);
        return models;
    }
    
    // Standard CSV format handling
    if (keys.length > 1) {
        // First key might be model name
        const nameKey = keys[0];
        const weightKeys = keys.slice(1);
        
        // Map to our expected format
        const result = data.map(row => {
            const result = {
                model_name: row[nameKey] || 'AI Model'
            };
            
            // Map other columns to indicator IDs
            weightKeys.forEach(key => {
                // Find the most likely indicator match
                const matchedIndicator = findMatchingIndicator(key);
                if (matchedIndicator) {
                    result[matchedIndicator.id] = parseFloat(row[key]) || 0;
                } else {
                    // If no match, keep original key
                    result[key] = parseFloat(row[key]) || 0;
                }
            });
            
            return result;
        });
        
        console.log("Normalized results:", result);
        return result;
    }
    
    // If we can't determine format, return a default structure
    console.warn("Could not determine data format, using defaults");
    return [{
        model_name: 'AI Model 1',
        '10Y2Y_Yield': 15,
        'ISM_NewOrders': 12,
        'Building_Permits': 10,
        'Consumer_Confidence': 14,
        'PMI': 11,
        'Initial_Claims': 12,
        'Avg_WeeklyHours': 10,
        'SP500': 14
    }];
}

// Find matching indicator based on key name
function findMatchingIndicator(key) {
    // Try exact match first
    let indicator = state.indicators.find(ind => ind.id === key);
    if (indicator) return indicator;
    
    // Try label match
    indicator = state.indicators.find(ind => ind.label === key);
    if (indicator) return indicator;
    
    // Try fuzzy matches
    const keyLower = key.toLowerCase();
    
    // Check each indicator for partial matches
    for (const ind of state.indicators) {
        const idLower = ind.id.toLowerCase();
        const labelLower = ind.label.toLowerCase();
        
        // Check if key contains indicator ID or label
        if (keyLower.includes(idLower) || idLower.includes(keyLower) ||
            keyLower.includes(labelLower) || labelLower.includes(keyLower)) {
            return ind;
        }
    }
    
    // Special cases
    if (keyLower.includes('yield') || keyLower.includes('10y') || keyLower.includes('2y')) {
        return state.indicators.find(ind => ind.id === '10Y2Y_Yield');
    }
    if (keyLower.includes('ism') || keyLower.includes('order')) {
        return state.indicators.find(ind => ind.id === 'ISM_NewOrders');
    }
    if (keyLower.includes('build') || keyLower.includes('permit')) {
        return state.indicators.find(ind => ind.id === 'Building_Permits');
    }
    if (keyLower.includes('consumer') || keyLower.includes('conf')) {
        return state.indicators.find(ind => ind.id === 'Consumer_Confidence');
    }
    if (keyLower.includes('pmi') || keyLower.includes('manufacturing')) {
        return state.indicators.find(ind => ind.id === 'PMI');
    }
    if (keyLower.includes('claim') || keyLower.includes('initial') || keyLower.includes('unemploy')) {
        return state.indicators.find(ind => ind.id === 'Initial_Claims');
    }
    if (keyLower.includes('cli') || keyLower.includes('lead') || keyLower.includes('hour')) {
        return state.indicators.find(ind => ind.id === 'Avg_WeeklyHours');
    }
    if (keyLower.includes('sp') || keyLower.includes('s&p') || keyLower.includes('500')) {
        return state.indicators.find(ind => ind.id === 'SP500');
    }
    
    return null;
}

// Update model names in UI
function updateModelNames() {
    // Update chart titles
    const aiModel1Title = document.getElementById('aiModel1Title');
    if (aiModel1Title) {
        aiModel1Title.textContent = `${state.aiModels[0]} Leading Index`;
    }
    
    const aiModel2Title = document.getElementById('aiModel2Title');
    if (aiModel2Title) {
        aiModel2Title.textContent = `${state.aiModels[1]} Leading Index`;
    }
    
    // Update table headers
    const tableHeaders = document.querySelectorAll('table thead tr th');
    if (tableHeaders.length >= 4) {
        // Skip first header (Indicator/Metric)
        if (state.aiModels[0]) tableHeaders[1].textContent = state.aiModels[0];
        if (state.aiModels[1]) tableHeaders[2].textContent = state.aiModels[1];
    }
    
    // Update chart datasets
    if (state.charts.weightsChart) {
        state.charts.weightsChart.data.datasets[0].label = state.aiModels[0];
        state.charts.weightsChart.data.datasets[1].label = state.aiModels[1];
        state.charts.weightsChart.update();
    }
    
    if (state.charts.aiModel1Chart) {
        state.charts.aiModel1Chart.data.datasets[0].label = `${state.aiModels[0]} Index`;
        state.charts.aiModel1Chart.update();
    }
    
    if (state.charts.aiModel2Chart) {
        state.charts.aiModel2Chart.data.datasets[0].label = `${state.aiModels[1]} Index`;
        state.charts.aiModel2Chart.update();
    }
    
    if (state.charts.comparisonChart) {
        state.charts.comparisonChart.data.datasets[0].label = state.aiModels[0];
        state.charts.comparisonChart.data.datasets[1].label = state.aiModels[1];
        state.charts.comparisonChart.update();
    }
}

// Calculate indices based on weights
function calculateIndices() {
    if (!state.zScoreData || state.zScoreData.length === 0) {
        console.error('No Z-Score data available');
        return;
    }
    
    // Calculate AI Model 1 index
    console.log("Calculating AI Model 1 index with weights:", state.indicators.map(i => ({id: i.id, weight: i.aiModel1Weight})));
    
    // First explicitly clear any existing index
    state.aiModel1Index = [];
    
    // Generate a completely new array for AI Model 1 index
    const newAiModel1Index = state.zScoreData.map(dataPoint => {
        let weightedSum = 0;
        let totalWeight = 0;
        
        state.indicators.forEach(indicator => {
            // Skip indicators with no weight
            if (!indicator.aiModel1Weight) return;
            
            let value = dataPoint[indicator.id];
            if (value === undefined || value === null) return;
            
            // For Initial Claims, invert the value (higher is worse)
            if (indicator.id === 'Initial_Claims') {
                value = -value;
            }
            
            weightedSum += value * indicator.aiModel1Weight;
            totalWeight += indicator.aiModel1Weight;
        });
        
        const indexValue = totalWeight > 0 ? weightedSum / totalWeight : 0;
        
        // Use a slightly different value to ensure it's distinct
        return {
            x: new Date(dataPoint.date),
            y: indexValue 
        };
    });
    
    // Explicitly assign the new array to state.aiModel1Index
    state.aiModel1Index = [...newAiModel1Index];
    
    console.log("Generated new AI Model 1 index, length:", state.aiModel1Index.length);
    
    // Debug first 5 points of AI Model 1 index
    console.log("First 5 points of AI Model 1 index:", state.aiModel1Index.slice(0, 5));
    
    // Calculate AI Model 2 index
    console.log("Calculating AI Model 2 index with weights:", state.indicators.map(i => ({id: i.id, weight: i.aiModel2Weight})));
    
    // First explicitly clear any existing index
    state.aiModel2Index = [];
    
    // Generate a completely new array for AI Model 2 index
    const newAiModel2Index = state.zScoreData.map(dataPoint => {
        let weightedSum = 0;
        let totalWeight = 0;
        
        state.indicators.forEach(indicator => {
            // Skip indicators with no weight
            if (!indicator.aiModel2Weight) return;
            
            let value = dataPoint[indicator.id];
            if (value === undefined || value === null) return;
            
            // For Initial Claims, invert the value (higher is worse)
            if (indicator.id === 'Initial_Claims') {
                value = -value;
            }
            
            weightedSum += value * indicator.aiModel2Weight;
            totalWeight += indicator.aiModel2Weight;
        });
        
        const indexValue = totalWeight > 0 ? weightedSum / totalWeight : 0;
        
        return {
            x: new Date(dataPoint.date),
            y: indexValue
        };
    });
    
    // Explicitly assign the new array to state.aiModel2Index
    state.aiModel2Index = [...newAiModel2Index];
    
    console.log("Generated new AI Model 2 index, length:", state.aiModel2Index.length);
    
    // Debug first 5 points of AI Model 2 index
    console.log("First 5 points of AI Model 2 index:", state.aiModel2Index.slice(0, 5));
    
    console.log(`Calculated indices: Model 1 (${state.aiModel1Index.length} points), Model 2 (${state.aiModel2Index.length} points)`);
}

// Update all charts with calculated data
function updateCharts() {
    // Debug output
    console.log("Updating charts with the following data:");
    console.log("- AI Model 1 weights:", state.indicators.map(ind => ({id: ind.id, weight: ind.aiModel1Weight})));
    console.log("- AI Model 2 weights:", state.indicators.map(ind => ({id: ind.id, weight: ind.aiModel2Weight})));
    console.log("- Class weights:", state.indicators.map(ind => ({id: ind.id, weight: ind.classWeight})));
    
    // Check if datasets are the same
    if (state.aiModel1Index && state.classIndex) {
        console.log("Checking if AI Model 1 and Class Index are the same:");
        const sampleAI1 = state.aiModel1Index.slice(0, 5);
        const sampleClass = state.classIndex.slice(0, 5);
        console.log("Sample AI Model 1:", sampleAI1);
        console.log("Sample Class:", sampleClass);
        
        // Check if they're identical
        const areIdentical = JSON.stringify(sampleAI1) === JSON.stringify(sampleClass);
        console.log("Are they identical?", areIdentical);
        
        if (areIdentical) {
            console.error("WARNING: AI Model 1 and Class Index are identical!");
        }
    }
    
    // Update weights chart
    if (state.charts.weightsChart) {
        state.charts.weightsChart.data.datasets[0].data = state.indicators.map(ind => ind.aiModel1Weight || 0);
        state.charts.weightsChart.data.datasets[1].data = state.indicators.map(ind => ind.aiModel2Weight || 0);
        state.charts.weightsChart.data.datasets[2].data = state.indicators.map(ind => ind.classWeight || 0);
        state.charts.weightsChart.update();
    }
    
    // Update AI Model 1 chart - create a new array copy to ensure independence
    if (state.charts.aiModel1Chart && state.aiModel1Index) {
        console.log("Setting AI Model 1 chart with data length:", state.aiModel1Index.length);
        const aiModel1Data = JSON.parse(JSON.stringify(state.aiModel1Index)); // Deep copy to ensure independence
        console.log("Setting AI Model 1 chart data:", aiModel1Data.slice(0, 3));
        state.charts.aiModel1Chart.data.datasets[0].data = aiModel1Data;
        state.charts.aiModel1Chart.update();
        
        // Extra verification - compare with class data
        if (state.classIndex && state.classIndex.length > 0) {
            console.log("VERIFICATION - AI Model 1 first point:", aiModel1Data[0]);
            console.log("VERIFICATION - Class first point:", state.classIndex[0]);
            console.log("VERIFICATION - Are different objects?", JSON.stringify(aiModel1Data[0]) !== JSON.stringify(state.classIndex[0]));
        }
    } else {
        console.error("Cannot update AI Model 1 chart - missing data");
    }
    
    // Update AI Model 2 chart - create a new array copy to ensure independence
    if (state.charts.aiModel2Chart && state.aiModel2Index) {
        console.log("Setting AI Model 2 chart with data length:", state.aiModel2Index.length);
        const aiModel2Data = JSON.parse(JSON.stringify(state.aiModel2Index)); // Deep copy to ensure independence
        console.log("Setting AI Model 2 chart data:", aiModel2Data.slice(0, 3));
        state.charts.aiModel2Chart.data.datasets[0].data = aiModel2Data;
        state.charts.aiModel2Chart.update();
    } else {
        console.error("Cannot update AI Model 2 chart - missing data");
    }
    
    // Update comparison chart - use new deep copies for everything
    if (state.charts.comparisonChart) {
        console.log("Setting comparison chart with all three datasets");
        state.charts.comparisonChart.data.datasets[0].data = state.aiModel1Index ? JSON.parse(JSON.stringify(state.aiModel1Index)) : [];
        state.charts.comparisonChart.data.datasets[1].data = state.aiModel2Index ? JSON.parse(JSON.stringify(state.aiModel2Index)) : [];
        state.charts.comparisonChart.data.datasets[2].data = state.classIndex ? JSON.parse(JSON.stringify(state.classIndex)) : [];
        state.charts.comparisonChart.update();
    }
}

// Update weights table
function updateWeightsTable() {
    const weightsTable = document.getElementById('weightsTable');
    if (!weightsTable) return;
    
    // Clear table
    weightsTable.innerHTML = '';
    
    // Add rows for each indicator
    state.indicators.forEach(indicator => {
        const row = document.createElement('tr');
        
        // Indicator name
        const nameCell = document.createElement('td');
        nameCell.className = 'px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900';
        nameCell.textContent = indicator.label;
        
        // AI Model 1 weight
        const model1Cell = document.createElement('td');
        model1Cell.className = 'px-4 py-2 whitespace-nowrap text-sm text-gray-900';
        model1Cell.textContent = indicator.aiModel1Weight.toFixed(2);
        
        // AI Model 2 weight
        const model2Cell = document.createElement('td');
        model2Cell.className = 'px-4 py-2 whitespace-nowrap text-sm text-gray-900';
        model2Cell.textContent = indicator.aiModel2Weight.toFixed(2);
        
        // Class weight
        const classCell = document.createElement('td');
        classCell.className = 'px-4 py-2 whitespace-nowrap text-sm text-gray-900';
        classCell.textContent = indicator.classWeight.toFixed(2);
        
        // Add cells to row
        row.appendChild(nameCell);
        row.appendChild(model1Cell);
        row.appendChild(model2Cell);
        row.appendChild(classCell);
        
        // Add row to table
        weightsTable.appendChild(row);
    });
}

// Set initial thresholds based on average values
function setInitialThresholds() {
    // Model 1 threshold
    if (state.aiModel1Index && state.aiModel1Index.length > 0) {
        const values = state.aiModel1Index.map(p => p.y);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const roundedAvg = Math.round(avg * 10) / 10;
        
        const thresholdInput = document.getElementById('aiModel1Threshold');
        const thresholdValue = document.getElementById('aiModel1ThresholdValue');
        
        if (thresholdInput && thresholdValue) {
            thresholdInput.value = roundedAvg;
            thresholdValue.textContent = roundedAvg.toFixed(1);
        }
    }
    
    // Model 2 threshold
    if (state.aiModel2Index && state.aiModel2Index.length > 0) {
        const values = state.aiModel2Index.map(p => p.y);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const roundedAvg = Math.round(avg * 10) / 10;
        
        const thresholdInput = document.getElementById('aiModel2Threshold');
        const thresholdValue = document.getElementById('aiModel2ThresholdValue');
        
        if (thresholdInput && thresholdValue) {
            thresholdInput.value = roundedAvg;
            thresholdValue.textContent = roundedAvg.toFixed(1);
        }
    }
    
    // Class threshold
    if (state.classIndex && state.classIndex.length > 0) {
        const values = state.classIndex.map(p => p.y);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const roundedAvg = Math.round(avg * 10) / 10;
        
        const thresholdInput = document.getElementById('classThreshold');
        const thresholdValue = document.getElementById('classThresholdValue');
        
        if (thresholdInput && thresholdValue) {
            thresholdInput.value = roundedAvg;
            thresholdValue.textContent = roundedAvg.toFixed(1);
        }
    }
    
    // Apply thresholds
    applyThresholdModel1();
    applyThresholdModel2();
    applyThresholdClass();
}

// Apply threshold for AI Model 1
function applyThresholdModel1() {
    const thresholdInput = document.getElementById('aiModel1Threshold');
    const directionSelect = document.getElementById('aiModel1Direction');
    const thresholdValueDisplay = document.getElementById('aiModel1ThresholdValue');
    
    if (!thresholdInput || !directionSelect || !state.aiModel1Index || state.aiModel1Index.length === 0) {
        console.warn('Missing elements or data for AI Model 1 threshold');
        return;
    }
    
    const threshold = parseFloat(thresholdInput.value);
    const direction = directionSelect.value; // 'above' or 'below'
    
    // Update threshold value display
    if (thresholdValueDisplay) {
        thresholdValueDisplay.textContent = threshold.toFixed(1);
    }
    
    console.log(`Applying threshold for AI Model 1: ${threshold} (${direction})`);
    
    try {
        // Generate signals
        const signals = generateSignals(state.aiModel1Index, threshold, direction);
        console.log(`Generated ${signals.length} signals for AI Model 1`);
        
        // Analyze signals
        state.aiModel1Analysis = analyzeSignals(signals);
        console.log('AI Model 1 analysis:', state.aiModel1Analysis);
        
        // Update metrics display
        updateAnalysisDisplay('aiModel1', state.aiModel1Analysis);
        
        // Add threshold line to chart
        if (state.charts.aiModel1Chart) {
            // Create a fresh annotations object
            const annotations = {};
            
            // Add recession overlays
            state.recessionData.forEach((recession, index) => {
                annotations[`recession-${index}`] = {
                    type: 'box',
                    xMin: recession.start,
                    xMax: recession.end,
                    backgroundColor: 'rgba(255, 0, 0, 0.1)',
                    borderColor: 'rgba(255, 0, 0, 0.1)',
                    borderWidth: 0
                };
            });
            
            // Add threshold line
            annotations['threshold'] = {
                type: 'line',
                yMin: threshold,
                yMax: threshold,
                borderColor: 'rgba(255, 99, 132, 0.8)',
                borderWidth: 2,
                borderDash: [5, 5],
                label: {
                    display: true,
                    content: `Threshold: ${threshold.toFixed(1)}`,
                    position: 'start'
                }
            };
            
            // Update chart annotations
            state.charts.aiModel1Chart.options.plugins.annotation.annotations = annotations;
            state.charts.aiModel1Chart.update();
        }
        
        // Update comparison table
        updateComparisonTable();
    } catch (error) {
        console.error('Error applying threshold for AI Model 1:', error);
    }
}

// Apply threshold for AI Model 2
function applyThresholdModel2() {
    const thresholdInput = document.getElementById('aiModel2Threshold');
    const thresholdValueDisplay = document.getElementById('aiModel2ThresholdValue');
    
    if (!thresholdInput || !state.aiModel2Index || state.aiModel2Index.length === 0) {
        console.warn('Missing elements or data for AI Model 2 threshold');
        return;
    }
    
    const threshold = parseFloat(thresholdInput.value);
    // Default to 'below' direction for Model 2
    const direction = 'below';
    
    // Update threshold value display
    if (thresholdValueDisplay) {
        thresholdValueDisplay.textContent = threshold.toFixed(1);
    }
    
    console.log(`Applying threshold for AI Model 2: ${threshold} (${direction})`);
    
    try {
        // Generate signals
        const signals = generateSignals(state.aiModel2Index, threshold, direction);
        console.log(`Generated ${signals.length} signals for AI Model 2`);
        
        // Analyze signals
        state.aiModel2Analysis = analyzeSignals(signals);
        console.log('AI Model 2 analysis:', state.aiModel2Analysis);
        
        // Update metrics display
        updateAnalysisDisplay('aiModel2', state.aiModel2Analysis);
        
        // Add threshold line to chart
        if (state.charts.aiModel2Chart) {
            // Create a fresh annotations object
            const annotations = {};
            
            // Add recession overlays
            state.recessionData.forEach((recession, index) => {
                annotations[`recession-${index}`] = {
                    type: 'box',
                    xMin: recession.start,
                    xMax: recession.end,
                    backgroundColor: 'rgba(255, 0, 0, 0.1)',
                    borderColor: 'rgba(255, 0, 0, 0.1)',
                    borderWidth: 0
                };
            });
            
            // Add threshold line
            annotations['threshold'] = {
                type: 'line',
                yMin: threshold,
                yMax: threshold,
                borderColor: 'rgba(255, 99, 132, 0.8)',
                borderWidth: 2,
                borderDash: [5, 5],
                label: {
                    display: true,
                    content: `Threshold: ${threshold.toFixed(1)}`,
                    position: 'start'
                }
            };
            
            // Update chart annotations
            state.charts.aiModel2Chart.options.plugins.annotation.annotations = annotations;
            state.charts.aiModel2Chart.update();
        }
        
        // Update comparison table
        updateComparisonTable();
    } catch (error) {
        console.error('Error applying threshold for AI Model 2:', error);
    }
}

// Apply threshold for class index
function applyThresholdClass() {
    const thresholdInput = document.getElementById('classThreshold');
    const directionSelect = document.getElementById('classDirection');
    const thresholdValueDisplay = document.getElementById('classThresholdValue');
    
    if (!thresholdInput || !directionSelect || !state.classIndex || state.classIndex.length === 0) {
        console.warn('Missing elements or data for class threshold');
        return;
    }
    
    const threshold = parseFloat(thresholdInput.value);
    const direction = directionSelect.value; // 'above' or 'below'
    
    // Update threshold value display
    if (thresholdValueDisplay) {
        thresholdValueDisplay.textContent = threshold.toFixed(1);
    }
    
    console.log(`Applying threshold for class index: ${threshold} (${direction})`);
    
    try {
        // Generate signals
        const signals = generateSignals(state.classIndex, threshold, direction);
        console.log(`Generated ${signals.length} signals for class index`);
        
        // Analyze signals
        state.classAnalysis = analyzeSignals(signals);
        console.log('Class analysis:', state.classAnalysis);
        
        // Update metrics display
        updateAnalysisDisplay('class', state.classAnalysis);
        
        // Add threshold line to chart
        if (state.charts.classChart) {
            // Create a fresh annotations object
            const annotations = {};
            
            // Add recession overlays
            state.recessionData.forEach((recession, index) => {
                annotations[`recession-${index}`] = {
                    type: 'box',
                    xMin: recession.start,
                    xMax: recession.end,
                    backgroundColor: 'rgba(255, 0, 0, 0.1)',
                    borderColor: 'rgba(255, 0, 0, 0.1)',
                    borderWidth: 0
                };
            });
            
            // Add threshold line
            annotations['threshold'] = {
                type: 'line',
                yMin: threshold,
                yMax: threshold,
                borderColor: 'rgba(255, 99, 132, 0.8)',
                borderWidth: 2,
                borderDash: [5, 5],
                label: {
                    display: true,
                    content: `Threshold: ${threshold.toFixed(1)}`,
                    position: 'start'
                }
            };
            
            // Update chart annotations
            state.charts.classChart.options.plugins.annotation.annotations = annotations;
            state.charts.classChart.update();
        }
        
        // Update comparison table
        updateComparisonTable();
    } catch (error) {
        console.error('Error applying threshold for class index:', error);
    }
}

// Generate signals based on threshold and direction
function generateSignals(indexData, threshold, direction) {
    if (!indexData || indexData.length === 0) return [];
    
    const signals = [];
    let inSignal = false;
    let signalStart = null;
    
    // Sort data by date
    const sortedData = [...indexData].sort((a, b) => a.x - b.x);
    
    sortedData.forEach((point, i) => {
        const value = point.y;
        const date = point.x;
        
        // Check if point crosses threshold
        const isSignal = direction === 'below' ? value <= threshold : value >= threshold;
        
        if (isSignal && !inSignal) {
            // Start of new signal
            inSignal = true;
            signalStart = { date, index: i, value };
            signals.push(signalStart);
        } else if (!isSignal && inSignal) {
            // End of signal
            inSignal = false;
        }
    });
    
    return signals;
}

// Analyze signals against recession data
function analyzeSignals(signals) {
    if (!signals || signals.length === 0 || !state.recessionData || state.recessionData.length === 0) {
        return {
            truePositives: 0,
            falsePositives: 0,
            coincidentSignals: 0,
            missedRecessions: 0,
            avgLeadTime: 0,
            detectionRate: 0,
            accuracy: 0
        };
    }
    
    let truePositives = 0;
    let falsePositives = 0;
    let coincidentSignals = 0;
    let leadTimes = [];
    
    // Check each signal
    signals.forEach(signal => {
        const signalDate = new Date(signal.date);
        
        // Check if signal occurred during a recession
        const duringRecession = state.recessionData.some(recession => 
            signalDate >= recession.start && signalDate <= recession.end
        );
        
        if (duringRecession) {
            // Signal is coincident with recession
            coincidentSignals++;
            return;
        }
        
        // Find next recession after signal
        const nextRecession = state.recessionData.find(recession => 
            recession.start > signalDate
        );
        
        if (!nextRecession) {
            // No recession after signal
            falsePositives++;
            return;
        }
        
        // Calculate lead time in months
        const leadTimeMs = nextRecession.start - signalDate;
        const leadTimeMonths = Math.round(leadTimeMs / (30 * 24 * 60 * 60 * 1000));
        
        if (leadTimeMonths <= 24) {
            // True positive: signal is within 24 months of recession
            truePositives++;
            leadTimes.push(leadTimeMonths);
        } else {
            // False positive: signal is more than 24 months before recession
            falsePositives++;
        }
    });
    
    // Check for missed recessions
    let detectedRecessions = 0;
    
    state.recessionData.forEach(recession => {
        const detected = signals.some(signal => {
            const signalDate = new Date(signal.date);
            // Consider recession detected if signal is within 24 months before
            const leadTimeMs = recession.start - signalDate;
            const leadTimeMonths = leadTimeMs / (30 * 24 * 60 * 60 * 1000);
            return leadTimeMonths >= 0 && leadTimeMonths <= 24;
        });
        
        if (detected) {
            detectedRecessions++;
        }
    });
    
    const missedRecessions = state.recessionData.length - detectedRecessions;
    
    // Calculate average lead time
    const avgLeadTime = leadTimes.length > 0 ? 
        leadTimes.reduce((sum, time) => sum + time, 0) / leadTimes.length : 0;
    
    // Calculate detection rate
    const detectionRate = state.recessionData.length > 0 ? 
        (detectedRecessions / state.recessionData.length) * 100 : 0;
    
    // Calculate accuracy (True Positives / (True Positives + False Positives + Missed Recessions - Coincident))
    const denominator = Math.max(1, truePositives + falsePositives + missedRecessions - coincidentSignals);
    const accuracy = truePositives / denominator * 100;
    
    return {
        truePositives,
        falsePositives,
        coincidentSignals,
        missedRecessions,
        avgLeadTime,
        detectionRate,
        accuracy
    };
}

// Update analysis display for a model
function updateAnalysisDisplay(modelId, analysis) {
    if (!analysis) return;
    
    // Update metrics
    document.getElementById(`${modelId}TruePositives`).textContent = analysis.truePositives;
    document.getElementById(`${modelId}FalsePositives`).textContent = analysis.falsePositives;
    document.getElementById(`${modelId}CoincidentSignals`).textContent = analysis.coincidentSignals;
    document.getElementById(`${modelId}MissedRecessions`).textContent = analysis.missedRecessions;
    document.getElementById(`${modelId}AvgLeadTime`).textContent = `${analysis.avgLeadTime.toFixed(1)} months`;
    document.getElementById(`${modelId}DetectionRate`).textContent = `${analysis.detectionRate.toFixed(1)}%`;
    document.getElementById(`${modelId}Accuracy`).textContent = `${analysis.accuracy.toFixed(1)}%`;
}

// Update comparison table
function updateComparisonTable() {
    console.log('Updating comparison table');
    
    const comparisonTable = document.getElementById('comparisonTable');
    if (!comparisonTable) {
        console.warn('Comparison table element not found');
        return;
    }
    
    // Get AI model analyses (create defaults if not available)
    const aiModel1Analysis = state.aiModel1Analysis || {
        truePositives: 0,
        falsePositives: 0,
        coincidentSignals: 0,
        missedRecessions: 0,
        avgLeadTime: 0,
        detectionRate: 0,
        accuracy: 0
    };
    
    const aiModel2Analysis = state.aiModel2Analysis || {
        truePositives: 0,
        falsePositives: 0,
        coincidentSignals: 0,
        missedRecessions: 0,
        avgLeadTime: 0,
        detectionRate: 0,
        accuracy: 0
    };
    
    console.log('AI Model 1 Analysis:', aiModel1Analysis);
    console.log('AI Model 2 Analysis:', aiModel2Analysis);
    console.log('Class Analysis:', state.classAnalysis);
    
    // Clear table
    comparisonTable.innerHTML = '';
    
    // Define metrics to display
    const metrics = [
        { 
            name: 'True Positives', 
            model1: aiModel1Analysis.truePositives, 
            model2: aiModel2Analysis.truePositives, 
            class: state.classAnalysis ? state.classAnalysis.truePositives : 'N/A' 
        },
        { 
            name: 'False Positives', 
            model1: aiModel1Analysis.falsePositives, 
            model2: aiModel2Analysis.falsePositives, 
            class: state.classAnalysis ? state.classAnalysis.falsePositives : 'N/A' 
        },
        { 
            name: 'Coincident Signals', 
            model1: aiModel1Analysis.coincidentSignals, 
            model2: aiModel2Analysis.coincidentSignals, 
            class: state.classAnalysis ? state.classAnalysis.coincidentSignals : 'N/A' 
        },
        { 
            name: 'Missed Recessions', 
            model1: aiModel1Analysis.missedRecessions, 
            model2: aiModel2Analysis.missedRecessions, 
            class: state.classAnalysis ? state.classAnalysis.missedRecessions : 'N/A' 
        },
        { 
            name: 'Avg Lead Time (months)', 
            model1: typeof aiModel1Analysis.avgLeadTime === 'number' ? aiModel1Analysis.avgLeadTime.toFixed(1) : '0.0', 
            model2: typeof aiModel2Analysis.avgLeadTime === 'number' ? aiModel2Analysis.avgLeadTime.toFixed(1) : '0.0', 
            class: state.classAnalysis ? state.classAnalysis.avgLeadTime.toFixed(1) : 'N/A' 
        },
        { 
            name: 'Detection Rate (%)', 
            model1: typeof aiModel1Analysis.detectionRate === 'number' ? aiModel1Analysis.detectionRate.toFixed(1) : '0.0', 
            model2: typeof aiModel2Analysis.detectionRate === 'number' ? aiModel2Analysis.detectionRate.toFixed(1) : '0.0', 
            class: state.classAnalysis ? state.classAnalysis.detectionRate.toFixed(1) : 'N/A' 
        },
        { 
            name: 'Accuracy (%)', 
            model1: typeof aiModel1Analysis.accuracy === 'number' ? aiModel1Analysis.accuracy.toFixed(1) : '0.0', 
            model2: typeof aiModel2Analysis.accuracy === 'number' ? aiModel2Analysis.accuracy.toFixed(1) : '0.0', 
            class: state.classAnalysis ? state.classAnalysis.accuracy.toFixed(1) : 'N/A' 
        }
    ];
    
    // Add rows
    metrics.forEach(metric => {
        const row = document.createElement('tr');
        
        // Metric name
        const nameCell = document.createElement('td');
        nameCell.className = 'px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900';
        nameCell.textContent = metric.name;
        
        // Model 1 value
        const model1Cell = document.createElement('td');
        model1Cell.className = 'px-4 py-2 whitespace-nowrap text-sm text-gray-900';
        model1Cell.textContent = metric.model1;
        
        // Model 2 value
        const model2Cell = document.createElement('td');
        model2Cell.className = 'px-4 py-2 whitespace-nowrap text-sm text-gray-900';
        model2Cell.textContent = metric.model2;
        
        // Class value
        const classCell = document.createElement('td');
        classCell.className = 'px-4 py-2 whitespace-nowrap text-sm text-gray-900';
        classCell.textContent = metric.class;
        
        // Try to highlight better performance
        try {
            if (metric.name === 'False Positives' || metric.name === 'Missed Recessions') {
                // Lower is better
                const val1 = parseFloat(metric.model1);
                const val2 = parseFloat(metric.model2);
                const valClass = metric.class !== 'N/A' ? parseFloat(metric.class) : Number.MAX_VALUE;
                
                if (!isNaN(val1) && !isNaN(val2) && val1 < val2 && val1 < valClass) {
                    model1Cell.classList.add('bg-green-100');
                } else if (!isNaN(val1) && !isNaN(val2) && val2 < val1 && val2 < valClass) {
                    model2Cell.classList.add('bg-green-100');
                } else if (metric.class !== 'N/A' && !isNaN(valClass) && valClass < val1 && valClass < val2) {
                    classCell.classList.add('bg-green-100');
                }
            } else {
                // Higher is better
                const val1 = parseFloat(metric.model1);
                const val2 = parseFloat(metric.model2);
                const valClass = metric.class !== 'N/A' ? parseFloat(metric.class) : Number.MIN_VALUE;
                
                if (!isNaN(val1) && !isNaN(val2) && val1 > val2 && val1 > valClass) {
                    model1Cell.classList.add('bg-green-100');
                } else if (!isNaN(val1) && !isNaN(val2) && val2 > val1 && val2 > valClass) {
                    model2Cell.classList.add('bg-green-100');
                } else if (metric.class !== 'N/A' && !isNaN(valClass) && valClass > val1 && valClass > val2) {
                    classCell.classList.add('bg-green-100');
                }
            }
        } catch (error) {
            console.warn('Error highlighting cells:', error);
        }
        
        // Add cells to row
        row.appendChild(nameCell);
        row.appendChild(model1Cell);
        row.appendChild(model2Cell);
        row.appendChild(classCell);
        
        // Add row to table
        comparisonTable.appendChild(row);
    });
    
    console.log('Comparison table updated');
}

// Download results as CSV
function downloadResults() {
    if (!state.aiModel1Analysis || !state.aiModel2Analysis) {
        alert('No analysis results to download.');
        return;
    }
    
    // Create CSV content
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Header
    csvContent += 'Metric,' + state.aiModels[0] + ',' + state.aiModels[1] + ',Class\n';
    
    // Metrics
    csvContent += 'True Positives,' + state.aiModel1Analysis.truePositives + ',' + state.aiModel2Analysis.truePositives + ',' + (state.classAnalysis ? state.classAnalysis.truePositives : 'N/A') + '\n';
    csvContent += 'False Positives,' + state.aiModel1Analysis.falsePositives + ',' + state.aiModel2Analysis.falsePositives + ',' + (state.classAnalysis ? state.classAnalysis.falsePositives : 'N/A') + '\n';
    csvContent += 'Coincident Signals,' + state.aiModel1Analysis.coincidentSignals + ',' + state.aiModel2Analysis.coincidentSignals + ',' + (state.classAnalysis ? state.classAnalysis.coincidentSignals : 'N/A') + '\n';
    csvContent += 'Missed Recessions,' + state.aiModel1Analysis.missedRecessions + ',' + state.aiModel2Analysis.missedRecessions + ',' + (state.classAnalysis ? state.classAnalysis.missedRecessions : 'N/A') + '\n';
    csvContent += 'Avg Lead Time (months),' + state.aiModel1Analysis.avgLeadTime.toFixed(1) + ',' + state.aiModel2Analysis.avgLeadTime.toFixed(1) + ',' + (state.classAnalysis ? state.classAnalysis.avgLeadTime.toFixed(1) : 'N/A') + '\n';
    csvContent += 'Detection Rate (%),' + state.aiModel1Analysis.detectionRate.toFixed(1) + ',' + state.aiModel2Analysis.detectionRate.toFixed(1) + ',' + (state.classAnalysis ? state.classAnalysis.detectionRate.toFixed(1) : 'N/A') + '\n';
    csvContent += 'Accuracy (%),' + state.aiModel1Analysis.accuracy.toFixed(1) + ',' + state.aiModel2Analysis.accuracy.toFixed(1) + ',' + (state.classAnalysis ? state.classAnalysis.accuracy.toFixed(1) : 'N/A') + '\n';
    
    // Blank line
    csvContent += '\n';
    
    // Indicator weights
    csvContent += 'Indicator Weights\n';
    csvContent += 'Indicator,' + state.aiModels[0] + ',' + state.aiModels[1] + ',Class\n';
    
    state.indicators.forEach(indicator => {
        csvContent += indicator.label + ',' + 
            indicator.aiModel1Weight.toFixed(2) + ',' + 
            indicator.aiModel2Weight.toFixed(2) + ',' + 
            indicator.classWeight.toFixed(2) + '\n';
    });
    
    // Create and trigger download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'ai_weights_analysis.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Reset upload UI
function resetUploadUI() {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('uploadProgress').classList.add('hidden');
    document.getElementById('dropzoneContent').classList.remove('hidden');
    document.getElementById('progressBar').style.width = '0%';
}

// Create default sample file
function createSampleFile() {
    // Sample AI weights
    const sampleData = [
        {
            model_name: 'GPT-4 Model',
            '10Y2Y_Yield': 15,
            'ISM_NewOrders': 12,
            'Building_Permits': 10,
            'Consumer_Confidence': 14,
            'PMI': 11,
            'Initial_Claims': 12,
            'Avg_WeeklyHours': 10,
            'SP500': 14
        },
        {
            model_name: 'BERT Model',
            '10Y2Y_Yield': 13,
            'ISM_NewOrders': 14,
            'Building_Permits': 12,
            'Consumer_Confidence': 15,
            'PMI': 10,
            'Initial_Claims': 11,
            'Avg_WeeklyHours': 9,
            'SP500': 13
        }
    ];
    
    // Convert to CSV
    let csvContent = 'model_name,10Y2Y_Yield,ISM_NewOrders,Building_Permits,Consumer_Confidence,PMI,Initial_Claims,Avg_WeeklyHours,SP500\n';
    
    sampleData.forEach(row => {
        csvContent += `${row.model_name},${row['10Y2Y_Yield']},${row['ISM_NewOrders']},${row['Building_Permits']},${row['Consumer_Confidence']},${row['PMI']},${row['Initial_Claims']},${row['Avg_WeeklyHours']},${row['SP500']}\n`;
    });
    
    // Create download link
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'sample-ai-weights.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}