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
    updateChart();
}

function applyRule() {
    const ruleType = document.getElementById('signalType').value;
    const indexData = calculateIndex();
    let signals = [];

    if (ruleType === 'threshold') {
        const direction = document.getElementById('thresholdDirection').value;
        const threshold = parseFloat(document.getElementById('thresholdValue').value);
        
        signals = indexData.map((point, i) => {
            const isSignal = direction === 'below' ? 
                point.value < threshold :
                point.value > threshold;
            return isSignal ? { date: point.date, value: point.value } : null;
        }).filter(s => s);
    } else {
        const direction = document.getElementById('changeDirection').value;
        const changeValue = parseFloat(document.getElementById('changeValue').value);
        const period = parseInt(document.getElementById('changePeriod').value);

        for (let i = period; i < indexData.length; i++) {
            const change = indexData[i].value - indexData[i - period].value;
            const isSignal = direction === 'decrease' ?
                change < -Math.abs(changeValue) :
                change > Math.abs(changeValue);
            
            if (isSignal) {
                signals.push({
                    date: indexData[i].date,
                    value: indexData[i].value
                });
            }
        }
    }

    analyzeSignals(signals);
}

function analyzeSignals(signals) {
    if (!signals || signals.length === 0) return;

    const analysis = {
        signals: signals.map(signal => {
            const signalDate = new Date(signal.date);
            const nextRecession = state.recessions.find(r => 
                new Date(r.start) > signalDate
            );

            if (!nextRecession) return {
                date: signalDate,
                value: signal.value,
                result: 'False Positive',
                leadTime: null,
                recessionStart: null
            };

            const recessionStart = new Date(nextRecession.start);
            const leadTime = Math.round((recessionStart - signalDate) / (30 * 24 * 60 * 60 * 1000));

            return {
                date: signalDate,
                value: signal.value,
                result: leadTime <= 24 ? 'True Positive' : 'False Positive',
                leadTime: leadTime,
                recessionStart: recessionStart
            };
        }),
        stats: {}
    };

    // Calculate statistics
    const validSignals = analysis.signals.filter(s => s.result === 'True Positive');
    analysis.stats = {
        totalSignals: analysis.signals.length,
        truePositives: validSignals.length,
        truePositiveRate: Math.round((validSignals.length / analysis.signals.length) * 100),
        falsePositiveRate: Math.round(((analysis.signals.length - validSignals.length) / analysis.signals.length) * 100),
        avgLeadTime: validSignals.length > 0 ? 
            Math.round(validSignals.reduce((sum, s) => sum + s.leadTime, 0) / validSignals.length) :
            0
    };

    updateAnalysis(analysis);
}

function updateAnalysis(analysis) {
    // Update statistics
    document.getElementById('avgLeadTime').textContent = `${analysis.stats.avgLeadTime} months`;
    document.getElementById('truePositiveRate').textContent = `${analysis.stats.truePositiveRate}%`;
    document.getElementById('falsePositiveRate').textContent = `${analysis.stats.falsePositiveRate}%`;

    // Update signals table
    const signalsList = document.getElementById('signalsList');
    signalsList.innerHTML = analysis.signals.map(signal => `
        <tr>
            <td class="px-6 py-4">${signal.date.toLocaleDateString()}</td>
            <td class="px-6 py-4">${signal.recessionStart ? signal.recessionStart.toLocaleDateString() : 'N/A'}</td>
            <td class="px-6 py-4">${signal.leadTime || 'N/A'}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 text-sm rounded ${
                    signal.result === 'True Positive' ? 
                    'bg-green-100 text-green-800' : 
                    'bg-red-100 text-red-800'
                }">
                    ${signal.result}
                </span>
            </td>
        </tr>
    `).join('');
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
