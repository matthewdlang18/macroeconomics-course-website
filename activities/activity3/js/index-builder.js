// Global state
const state = {
    rawData: [],
    processedData: [],
    recessions: [],
    chart: null,
    indicators: [
        { id: "10Y2Y_Yield", label: "Yield Curve (10Y-2Y)", weight: 0 },
        { id: "ISM_Orders", label: "ISM New Orders", weight: 0 },
        { id: "Building_Permits", label: "Building Permits", weight: 0 },
        { id: "Consumer_Confidence", label: "Consumer Confidence", weight: 0 },
        { id: "PMI", label: "Manufacturing PMI", weight: 0 },
        { id: "Initial_Claims", label: "Initial Claims", weight: 0 },
        { id: "CLI", label: "CLI", weight: 0 },
        { id: "SP500", label: "S&P 500", weight: 0 }
    ]
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeUI();
    loadData();
    
    // Add event listeners
    document.getElementById('signalType').addEventListener('change', updateRuleInputs);
});

async function loadData() {
    try {
        // Show loading state
        document.getElementById('loadingState').classList.remove('hidden');
        document.getElementById('mainContent').classList.add('hidden');

        // Load data files
        const [zScoreResponse, recessionResponse] = await Promise.all([
            fetch('data/LeadingIndicators_ZScore.csv'),
            fetch('data/recessions.csv')
        ]);

        const zScoreText = await zScoreResponse.text();
        const recessionText = await recessionResponse.text();

        // Parse CSV data
        state.rawData = Papa.parse(zScoreText, { header: true }).data
            .filter(row => row.time)
            .map(row => ({
                date: formatDate(row.time),
                "10Y2Y_Yield": parseFloat(row["10Y2Y_Yield"]) || 0,
                "ISM_Orders": parseFloat(row["ISM New Orders"]) || 0,
                "Building_Permits": parseFloat(row["Building Permits"]) || 0,
                "Consumer_Confidence": parseFloat(row["Consumer Confidence"]) || 0,
                "PMI": parseFloat(row["PMI"]) || 0,
                "Initial_Claims": parseFloat(row["4-Week MA Initial Unemployment Claims"]) || 0,
                "CLI": parseFloat(row["US CLI"]) || 0,
                "SP500": parseFloat(row["SP500"]) || 0
            }))
            .filter(row => !isNaN(row.date));

        state.recessions = Papa.parse(recessionText, { header: true }).data
            .filter(row => row.Start && row.End)
            .map(row => ({
                start: formatDate(row.Start),
                end: formatDate(row.End)
            }));

        // Initialize chart
        updateChart();

        // Hide loading state
        document.getElementById('loadingState').classList.add('hidden');
        document.getElementById('mainContent').classList.remove('hidden');
    } catch (error) {
        console.error('Error loading data:', error);
        showError('Failed to load data. Please try refreshing the page.');
    }
}

function formatDate(dateStr) {
    const [month, day, year] = dateStr.split('/');
    return `${year.length === 2 ? '19' + year : year}-${month.padStart(2, '0')}-${day || '01'}`;
}

function initializeUI() {
    const weightInputs = document.getElementById('weightInputs');
    state.indicators.forEach(indicator => {
        const div = document.createElement('div');
        div.className = 'space-y-2';
        div.innerHTML = `
            <label class="block text-sm font-medium text-gray-700">
                ${indicator.label}
            </label>
            <div class="flex items-center space-x-4">
                <input type="range" 
                       id="weight_${indicator.id}" 
                       min="0" 
                       max="100" 
                       value="0"
                       class="flex-1"
                       oninput="updateWeight('${indicator.id}', this.value)">
                <span id="weightLabel_${indicator.id}" class="text-sm w-12 text-right">0%</span>
            </div>
        `;
        weightInputs.appendChild(div);
    });
}

function updateWeight(indicatorId, value) {
    const indicator = state.indicators.find(ind => ind.id === indicatorId);
    if (indicator) {
        indicator.weight = parseInt(value);
        document.getElementById(`weightLabel_${indicatorId}`).textContent = `${value}%`;
        updateTotalWeight();
    }
}

function updateTotalWeight() {
    const total = state.indicators.reduce((sum, ind) => sum + ind.weight, 0);
    document.getElementById('totalWeight').textContent = total;
}

function normalizeWeights() {
    const total = state.indicators.reduce((sum, ind) => sum + ind.weight, 0);
    if (total === 0) return;

    state.indicators.forEach(indicator => {
        const normalizedWeight = Math.round((indicator.weight / total) * 100);
        const input = document.getElementById(`weight_${indicator.id}`);
        input.value = normalizedWeight;
        document.getElementById(`weightLabel_${indicator.id}`).textContent = `${normalizedWeight}%`;
        indicator.weight = normalizedWeight;
    });
    updateTotalWeight();
    updateChart();
}

function calculateIndex() {
    if (!state.rawData || state.rawData.length === 0) return [];

    const weights = {};
    state.indicators.forEach(ind => {
        weights[ind.id] = ind.weight / 100;
    });

    return state.rawData.map(row => {
        let indexValue = 0;
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
}

function updateChart() {
    const indexData = calculateIndex();
    if (!indexData || indexData.length === 0) return;

    const ctx = document.getElementById('indexChart').getContext('2d');
    
    if (state.chart) {
        state.chart.destroy();
    }

    // Prepare recession overlay data
    const recessionOverlays = state.recessions.map(recession => ({
        type: 'box',
        xMin: recession.start,
        xMax: recession.end,
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        borderWidth: 0
    }));

    state.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: indexData.map(d => d.date),
            datasets: [{
                label: 'Leading Index',
                data: indexData.map(d => d.value),
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
                    annotations: recessionOverlays
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'year'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Standard Deviations'
                    }
                }
            }
        }
    });

    // Apply signal rule if active
    applyRule();
}

function updateRuleInputs() {
    const ruleType = document.getElementById('signalType').value;
    document.getElementById('thresholdRules').classList.toggle('hidden', ruleType !== 'threshold');
    document.getElementById('changeRules').classList.toggle('hidden', ruleType !== 'change');
    document.getElementById('retriggerRules').classList.toggle('hidden', ruleType !== 'threshold');
    updateChart();
}

function applyRule() {
    const ruleType = document.getElementById('signalType').value;
    const retriggerRule = document.getElementById('retriggerRule').value;
    const indexData = calculateIndex();
    let signals = [];

    if (ruleType === 'threshold') {
        const direction = document.getElementById('thresholdDirection').value;
        const threshold = parseFloat(document.getElementById('thresholdValue').value);
        
        let lastSignalDate = null;
        
        indexData.forEach((point, i) => {
            const isThresholdMet = direction === 'below' ? 
                point.value < threshold :
                point.value > threshold;
                
            if (!isThresholdMet) return;
            
            // Check if enough time has passed since last signal
            if (lastSignalDate) {
                const currentDate = new Date(point.date);
                const daysSinceLastSignal = (currentDate - lastSignalDate) / (1000 * 60 * 60 * 24);
                
                // Check retrigger rules
                if (retriggerRule === 'after24' && daysSinceLastSignal < 730) return; // 24 months
                if (retriggerRule === 'afterRecession') {
                    const lastRecessionEnd = state.recessions
                        .filter(r => new Date(r.end) < currentDate)
                        .sort((a, b) => new Date(b.end) - new Date(a.end))[0];
                    if (lastRecessionEnd && lastSignalDate > new Date(lastRecessionEnd.end)) return;
                }
                if (retriggerRule === 'afterEither') {
                    const lastRecessionEnd = state.recessions
                        .filter(r => new Date(r.end) < currentDate)
                        .sort((a, b) => new Date(b.end) - new Date(a.end))[0];
                    if (daysSinceLastSignal < 730 && (!lastRecessionEnd || lastSignalDate > new Date(lastRecessionEnd.end))) return;
                }
            }
            
            signals.push({ date: point.date, value: point.value });
            lastSignalDate = new Date(point.date);
        });
    }

    analyzeSignals(signals);
}

function analyzeSignals(signals) {
    if (!signals || signals.length === 0) return;

    // First analyze all signals
    const analysis = {
        signals: signals.map(signal => {
            const signalDate = new Date(signal.date);
            
            // Check if signal occurred during recession
            const duringRecession = state.recessions.some(r => {
                const start = new Date(r.start);
                const end = new Date(r.end);
                return signalDate >= start && signalDate <= end;
            });

            if (duringRecession) {
                // Find the recession this signal is coincident with
                const coincidentRecession = state.recessions.find(r => {
                    const start = new Date(r.start);
                    const end = new Date(r.end);
                    return signalDate >= start && signalDate <= end;
                });
                
                return {
                    date: signalDate,
                    value: signal.value,
                    result: 'Coincident',
                    leadTime: 'Coincident',
                    recessionStart: coincidentRecession.start,
                    duringRecession: true
                };
            }

            // For non-coincident signals, find the next recession
            const nextRecession = state.recessions.find(r => {
                const start = new Date(r.start);
                return start > signalDate;
            });

            if (!nextRecession) return {
                date: signalDate,
                value: signal.value,
                result: 'False Positive',
                leadTime: 'More than 24 months',
                recessionStart: null,
                duringRecession: false
            };

            const recessionStart = new Date(nextRecession.start);
            const leadTime = Math.round((recessionStart - signalDate) / (30 * 24 * 60 * 60 * 1000));

            return {
                date: signalDate,
                value: signal.value,
                result: leadTime <= 24 ? 'True Positive' : 'False Positive',
                leadTime: leadTime <= 24 ? leadTime : 'More than 24 months',
                recessionStart: nextRecession.start,
                duringRecession: false
            };
        }),
        stats: {}
    };

    // Calculate statistics
    const validSignals = analysis.signals.filter(s => !s.duringRecession);
    const truePositives = validSignals.filter(s => s.result === 'True Positive');
    const falsePositives = validSignals.filter(s => s.result === 'False Positive');
    const coincidentCount = analysis.signals.filter(s => s.duringRecession).length;

    // For each recession, check if it was predicted by a true positive
    const missedRecessions = state.recessions.filter(recession => {
        const recessionStart = new Date(recession.start);
        
        // Check if this recession was predicted by a true positive
        return !truePositives.some(signal => {
            const leadTime = Math.round((recessionStart - signal.date) / (30 * 24 * 60 * 60 * 1000));
            return leadTime > 0 && leadTime <= 24;
        });
    });

    // Debug information
    console.log('True Positives:', truePositives.length);
    console.log('False Positives:', falsePositives.length);
    console.log('Missed Recessions:', missedRecessions.length);
    console.log('Coincident Signals:', coincidentCount);
    console.log('Total Predictions (TP+FP+FN):', truePositives.length + falsePositives.length + missedRecessions.length);
    console.log('Adjusted Total (TP+FP+FN-Coincident):', truePositives.length + falsePositives.length + missedRecessions.length - coincidentCount);
    
    // Manual calculation for verification
    const manualNumerator = truePositives.length;
    const manualDenominator = truePositives.length + falsePositives.length + missedRecessions.length - coincidentCount;
    const manualAccuracy = Math.round((manualNumerator / manualDenominator) * 100);
    console.log('Manual calculation:', `${manualNumerator}/${manualDenominator} = ${manualAccuracy}%`);
    
    analysis.stats = {
        truePositives: truePositives.length,
        falsePositives: falsePositives.length,
        coincidentSignals: coincidentCount,
        missedRecessions: missedRecessions.length,
        accuracy: manualAccuracy
    };
    
    // Debug the final accuracy
    console.log('Accuracy:', analysis.stats.accuracy + '%');

    updateAnalysis(analysis);
}

function updateAnalysis(analysis) {
    // Update statistics
    document.getElementById('truePositives').textContent = analysis.stats.truePositives;
    document.getElementById('falsePositives').textContent = analysis.stats.falsePositives;
    document.getElementById('falseNegatives').textContent = analysis.stats.missedRecessions;
    document.getElementById('coincidentCount').textContent = analysis.stats.coincidentSignals;
    document.getElementById('accuracy').textContent = `${analysis.stats.accuracy}%`;
    
    // Update the accuracy formula display
    const accuracyFormula = document.querySelector('.accuracy-formula');
    if (accuracyFormula) {
        accuracyFormula.textContent = 'True Positives / (TP + FP + FN)';
    }

    // Update signals table
    const signalsList = document.getElementById('signalsList');
    signalsList.innerHTML = '';

    // Add signals
    analysis.signals.forEach(signal => {
        signalsList.innerHTML += `
            <tr class="border-b">
                <td class="px-3 py-2 text-sm">${signal.date.toLocaleDateString()}</td>
                <td class="px-3 py-2 text-sm">Signal</td>
                <td class="px-3 py-2 text-sm">${signal.recessionStart ? new Date(signal.recessionStart).toLocaleDateString() : 'None'}</td>
                <td class="px-3 py-2 text-sm">${signal.leadTime}</td>
                <td class="px-3 py-2 text-sm">
                    <span class="px-2 py-1 text-xs font-medium rounded ${
                        signal.result === 'True Positive' ? 'bg-green-100 text-green-800' :
                        signal.result === 'False Positive' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                    }">
                        ${signal.result}
                    </span>
                </td>
            </tr>
        `;
    });

    // Add missed recessions (only those without coincident signals)
    state.recessions.forEach(recession => {
        // Skip if this recession has a coincident signal
        const hasCoincidentSignal = analysis.signals.some(signal => 
            signal.duringRecession && signal.recessionStart === recession.start
        );
        
        if (hasCoincidentSignal) return;

        // Check if this recession was predicted by a true positive
        const wasPredicted = analysis.signals.some(signal => {
            if (signal.result !== 'True Positive') return false;
            const leadTime = Math.round((new Date(recession.start) - signal.date) / (30 * 24 * 60 * 60 * 1000));
            return leadTime > 0 && leadTime <= 24;
        });

        if (!wasPredicted) {
            signalsList.innerHTML += `
                <tr class="border-b">
                    <td class="px-3 py-2 text-sm">${new Date(recession.start).toLocaleDateString()}</td>
                    <td class="px-3 py-2 text-sm">Recession</td>
                    <td class="px-3 py-2 text-sm">${new Date(recession.start).toLocaleDateString()}</td>
                    <td class="px-3 py-2 text-sm">Missed Recession</td>
                    <td class="px-3 py-2 text-sm">
                        <span class="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-800">
                            False Negative
                        </span>
                    </td>
                </tr>
            `;
        }
    });
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative';
    errorDiv.innerHTML = `
        <strong class="font-bold">Error!</strong>
        <span class="block sm:inline">${message}</span>
    `;
    document.querySelector('main').prepend(errorDiv);
}
