// Global state
const state = {
    rawData: null,
    processedData: null,
    recessions: null,
    chart: null,
    indicators: [
        "10Y2Y_Yield",
        "ISM_Orders",
        "Building_Permits",
        "Consumer_Confidence",
        "PMI",
        "Initial_Claims",
        "CLI",
        "SP500"
    ]
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners
    document.getElementById('normalizeBtn').addEventListener('click', normalizeWeights);
    document.getElementById('updateBtn').addEventListener('click', updateChart);
    document.getElementById('applyRuleBtn').addEventListener('click', applyRule);
    document.getElementById('ruleType').addEventListener('change', updateRuleInputs);

    // Start loading data
    loadData();
});

async function loadData() {
    try {
        // Show loading state
        document.getElementById('loadingState').classList.remove('hidden');
        document.getElementById('mainContent').classList.add('hidden');

        // Load CSV files
        const [indicatorsResponse, recessionsResponse] = await Promise.all([
            fetch('data/LeadingIndicators.csv'),
            fetch('data/recessions.csv')
        ]);

        if (!indicatorsResponse.ok || !recessionsResponse.ok) {
            throw new Error('Failed to fetch data files');
        }

        const [indicatorsCsv, recessionsCsv] = await Promise.all([
            indicatorsResponse.text(),
            recessionsResponse.text()
        ]);

        // Parse indicators
        const parsedIndicators = Papa.parse(indicatorsCsv, { header: true });
        if (parsedIndicators.errors.length > 0) {
            console.error('CSV parsing errors:', parsedIndicators.errors);
        }

        // Store raw data and process it
        const rawData = parsedIndicators.data.filter(row => row.Date);
        if (!rawData.length) {
            throw new Error('No valid data found in indicators file');
        }

        // Process the data
        state.rawData = rawData;
        state.processedData = processData(rawData);

        // Parse recessions
        const parsedRecessions = Papa.parse(recessionsCsv, { header: true });
        state.recessions = parsedRecessions.data
            .filter(row => row.Start && row.End)
            .map(row => ({
                start: new Date(row.Start),
                end: new Date(row.End)
            }))
            .filter(r => !isNaN(r.start) && !isNaN(r.end));

        // Initialize UI
        initializeUI();
        updateChart();

        // Show main content
        document.getElementById('loadingState').classList.add('hidden');
        document.getElementById('mainContent').classList.remove('hidden');

    } catch (error) {
        console.error('Data load failed:', error);
        showError('Failed to load data: ' + error.message);
    }
}

function processData(rawData) {
    // Convert dates and parse numbers
    return rawData
        .map(row => {
            const date = new Date(row.Date);
            if (isNaN(date.getTime())) return null;

            const values = {};
            state.indicators.forEach(indicator => {
                values[indicator] = parseFloat(row[indicator]) || 0;
            });

            return { date, values };
        })
        .filter(row => row !== null)
        .sort((a, b) => a.date - b.date);
}

function calculateZScores(data) {
    const zScores = {};
    
    state.indicators.forEach(indicator => {
        // Get all values for this indicator
        const values = data.map(d => d.values[indicator]);
        
        // Calculate mean and standard deviation
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const stdDev = Math.sqrt(
            values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
        ) || 1; // Use 1 if stdDev is 0 to avoid division by zero
        
        // Calculate z-scores for each date
        zScores[indicator] = data.map(d => ({
            date: d.date,
            value: (d.values[indicator] - mean) / stdDev
        }));
    });
    
    return zScores;
}

function initializeUI() {
    // Create weight inputs
    const container = document.getElementById('weightInputs');
    if (!container) return;

    container.innerHTML = state.indicators.map(indicator => `
        <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">
                ${formatIndicatorLabel(indicator)}
            </label>
            <div class="flex items-center space-x-4">
                <input type="range" 
                       id="slider_${indicator}"
                       class="flex-grow"
                       min="0" 
                       max="100" 
                       value="${indicator === 'CLI' ? '100' : '0'}"
                       oninput="updateWeight('${indicator}', this.value)">
                <input type="number" 
                       id="weight_${indicator}" 
                       value="${indicator === 'CLI' ? '100' : '0'}"
                       min="0" 
                       max="100"
                       class="w-20"
                       oninput="updateWeight('${indicator}', this.value)">
            </div>
        </div>
    `).join('');

    updateTotalWeight();
}

function formatIndicatorLabel(indicator) {
    const labels = {
        '10Y2Y_Yield': 'Yield Curve (10Y-2Y)',
        'ISM_Orders': 'ISM New Orders',
        'Building_Permits': 'Building Permits',
        'Consumer_Confidence': 'Consumer Confidence',
        'PMI': 'Manufacturing PMI',
        'Initial_Claims': 'Initial Claims',
        'CLI': 'CLI',
        'SP500': 'S&P 500'
    };
    return labels[indicator] || indicator;
}

function updateWeight(indicator, value) {
    document.getElementById(`slider_${indicator}`).value = value;
    document.getElementById(`weight_${indicator}`).value = value;
    updateTotalWeight();
}

function updateTotalWeight() {
    const total = state.indicators.reduce((sum, indicator) => 
        sum + parseFloat(document.getElementById(`weight_${indicator}`).value || 0), 0
    );
    document.getElementById('totalWeight').textContent = total.toFixed(1);
}

function normalizeWeights() {
    const total = parseFloat(document.getElementById('totalWeight').textContent);
    if (total <= 0) return;

    state.indicators.forEach(indicator => {
        const currentWeight = parseFloat(document.getElementById(`weight_${indicator}`).value || 0);
        const normalizedWeight = (currentWeight / total * 100).toFixed(1);
        updateWeight(indicator, normalizedWeight);
    });

    updateChart();
}

function calculateIndex() {
    if (!state.processedData) return [];

    const weights = {};
    let totalWeight = 0;

    state.indicators.forEach(indicator => {
        weights[indicator] = parseFloat(document.getElementById(`weight_${indicator}`).value || 0);
        totalWeight += weights[indicator];
    });

    if (totalWeight === 0) {
        return state.processedData.map(d => ({ date: d.date, value: 0 }));
    }

    const zScores = calculateZScores(state.processedData);

    return state.processedData.map(row => {
        let value = 0;
        state.indicators.forEach(indicator => {
            const weight = weights[indicator] / totalWeight;
            const zscore = zScores[indicator].find(z => z.date.getTime() === row.date.getTime()).value;
            const multiplier = indicator === 'Initial_Claims' ? -1 : 1;
            value += weight * zscore * multiplier;
        });
        return { date: row.date, value };
    });
}

function updateChart() {
    if (!state.processedData) return;

    const indexData = calculateIndex();
    
    if (state.chart) {
        state.chart.destroy();
    }

    const ctx = document.getElementById('indexChart').getContext('2d');
    state.chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Custom Index',
                data: indexData.map(d => ({ x: d.date, y: d.value })),
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 2,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'year'
                    }
                }
            },
            plugins: {
                annotation: {
                    annotations: {
                        ...state.recessions.reduce((acc, recession, i) => ({
                            ...acc,
                            [`recession${i}`]: {
                                type: 'box',
                                xMin: recession.start,
                                xMax: recession.end,
                                backgroundColor: 'rgba(200, 200, 200, 0.2)',
                                borderWidth: 0
                            }
                        }), {})
                    }
                }
            }
        }
    });
}

function updateRuleInputs() {
    const ruleType = document.getElementById('ruleType').value;
    document.getElementById('thresholdRule').classList.toggle('hidden', ruleType !== 'threshold');
    document.getElementById('declineRule').classList.toggle('hidden', ruleType !== 'decline');
}

function applyRule() {
    if (!state.processedData) return;

    const indexData = calculateIndex();
    const ruleType = document.getElementById('ruleType').value;
    let signals = [];

    try {
        if (ruleType === 'threshold') {
            const threshold = parseFloat(document.getElementById('threshold').value);
            signals = indexData.filter(d => d.value < threshold);
        } else {
            const declinePercent = parseFloat(document.getElementById('declinePercent').value);
            const periodMonths = parseInt(document.getElementById('periodMonths').value);
            
            for (let i = periodMonths; i < indexData.length; i++) {
                const current = indexData[i];
                const past = indexData[i - periodMonths];
                const decline = ((current.value - past.value) / Math.abs(past.value)) * 100;
                
                if (decline <= -declinePercent) {
                    signals.push(current);
                }
            }
        }

        analyzeSignals(signals);
    } catch (error) {
        console.error('Error applying rule:', error);
        showError('Failed to apply rule: ' + error.message);
    }
}

function analyzeSignals(signals) {
    const analysis = signals.map(signal => {
        const duringRecession = state.recessions.some(r => 
            signal.date >= r.start && signal.date <= r.end
        );

        if (duringRecession) {
            return { ...signal, duringRecession: true };
        }

        const nextRecession = state.recessions.find(r => r.start > signal.date);
        const leadTime = nextRecession ? 
            Math.round((nextRecession.start - signal.date) / (1000 * 60 * 60 * 24 * 30.44)) : null;
        
        return {
            ...signal,
            duringRecession: false,
            result: leadTime && leadTime <= 24 ? 'True Positive' : 'False Positive',
            leadTime
        };
    });

    updateChartWithSignals(analysis);
    updateAnalysisStats(analysis);
}

function updateChartWithSignals(signals) {
    const indexData = calculateIndex();
    
    if (state.chart) {
        state.chart.destroy();
    }

    const ctx = document.getElementById('indexChart').getContext('2d');
    state.chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Custom Index',
                data: indexData.map(d => ({ x: d.date, y: d.value })),
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 2,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'year'
                    }
                }
            },
            plugins: {
                annotation: {
                    annotations: {
                        ...state.recessions.reduce((acc, recession, i) => ({
                            ...acc,
                            [`recession${i}`]: {
                                type: 'box',
                                xMin: recession.start,
                                xMax: recession.end,
                                backgroundColor: 'rgba(200, 200, 200, 0.2)',
                                borderWidth: 0
                            }
                        }), {}),
                        ...signals.reduce((acc, signal, i) => ({
                            ...acc,
                            [`signal${i}`]: {
                                type: 'line',
                                xMin: signal.date,
                                xMax: signal.date,
                                borderColor: signal.duringRecession ? 
                                    'rgba(200, 200, 200, 0.5)' : 
                                    signal.result === 'True Positive' ? 
                                        'rgba(34, 197, 94, 0.5)' : 
                                        'rgba(239, 68, 68, 0.5)',
                                borderWidth: 2
                            }
                        }), {})
                    }
                }
            }
        }
    });
}

function updateAnalysisStats(analysis) {
    const validSignals = analysis.filter(s => !s.duringRecession);
    const truePositives = validSignals.filter(s => s.result === 'True Positive');
    
    const successRate = validSignals.length > 0 ? 
        (truePositives.length / validSignals.length * 100).toFixed(1) : 'N/A';
    
    const avgLeadTime = truePositives.length > 0 ?
        Math.round(truePositives.reduce((sum, s) => sum + s.leadTime, 0) / truePositives.length) : 'N/A';

    document.getElementById('signalAnalysis').innerHTML = `
        <div class="space-y-4">
            <div>
                <h4 class="font-medium">Signal Analysis</h4>
                <p class="mt-2">
                    Success Rate: 
                    <span class="font-medium ${
                        successRate === 'N/A' ? 'text-gray-600' :
                        parseFloat(successRate) > 70 ? 'text-green-600' :
                        parseFloat(successRate) > 40 ? 'text-yellow-600' :
                        'text-red-600'
                    }">
                        ${successRate}${successRate !== 'N/A' ? '%' : ''}
                    </span>
                </p>
                <p class="mt-1">
                    Average Lead Time: 
                    <span class="font-medium">
                        ${avgLeadTime}${avgLeadTime !== 'N/A' ? ' months' : ''}
                    </span>
                </p>
                <p class="text-sm text-gray-600 mt-1">
                    ${analysis.filter(s => s.duringRecession).length} signals occurred during recessions
                    (not counted in success rate)
                </p>
            </div>
        </div>
    `;
}

function showError(message) {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('mainContent').classList.add('hidden');
    
    const container = document.createElement('div');
    container.className = 'text-center py-12';
    container.innerHTML = `
        <div class="text-red-600 text-xl mb-4">Error</div>
        <div class="text-gray-600">${message}</div>
    `;
    
    document.querySelector('.max-w-7xl').appendChild(container);
}
