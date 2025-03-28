let socket;
let gameChart;
let priceHistory = [];
const MAX_HISTORY_POINTS = 20;

const ROLE_DESCRIPTIONS = {
    banker: "As a banker, you provide loans to other banks and set the bank-to-bank lending rate. Your decisions influence the overall cost of borrowing in the market.",
    mortgage_lender: "As a mortgage lender, you provide home loans to buyers. You can set interest rates and loan amounts based on borrower creditworthiness.",
    developer: "As a developer, you build new houses. You decide the location and quality of properties, which affects their value.",
    homebuyer: "As a homebuyer, you aim to purchase a property to live in. You can take out mortgages and buy available properties.",
    speculator: "As a speculator, you buy and sell properties quickly to profit from price changes. You can own multiple properties at once."
};

// Initialize Socket.IO connection
function initializeSocket() {
    socket = io({
        transports: ['websocket', 'polling'],
        autoConnect: true
    });

    socket.on('connect', () => {
        console.log('Connected to server');
    });

    socket.on('game_joined', (data) => {
        document.getElementById('welcome-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        setupRole(data.role);
        updateGameState(data.initial_state);
    });

    socket.on('player_joined', (data) => {
        addTransaction(`${data.name} joined as ${data.role}`);
    });

    socket.on('round_update', (data) => {
        updateGameState(data);
    });

    socket.on('player_acted', (data) => {
        addTransaction(data.action);
    });

    socket.on('action_result', (data) => {
        if (data.success) {
            document.getElementById('player-money').textContent = data.new_balance.toFixed(2);
            updateAssets();
        }
        alert(data.message);
    });

    socket.on('game_over', (data) => {
        showGameOver(data.scores);
    });

    socket.on('error', (data) => {
        alert(data.message);
    });
}

function setupRole(role) {
    document.getElementById('player-role').textContent = role.charAt(0).toUpperCase() + role.slice(1);
    document.getElementById('role-description').textContent = ROLE_DESCRIPTIONS[role];
    setupRoleActions(role);
}

function setupRoleActions(role) {
    const actionPanel = document.getElementById('action-panel');
    actionPanel.innerHTML = '';

    switch (role) {
        case 'banker':
            actionPanel.innerHTML = `
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">Set Bank-to-Bank Rate</label>
                        <div class="flex space-x-2">
                            <input type="number" id="bank-rate-input" min="0" max="15" step="0.25" 
                                   class="flex-1 p-2 border rounded" placeholder="Rate (%)">
                            <button onclick="setRate()" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                Set Rate
                            </button>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Lend to Bank</label>
                        <select id="target-bank" class="w-full p-2 border rounded mb-2">
                            <!-- Other banks will be populated here -->
                        </select>
                        <div class="flex space-x-2">
                            <input type="number" id="loan-amount" min="100" step="100" 
                                   class="flex-1 p-2 border rounded" placeholder="Amount">
                            <button onclick="lendToBank()" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                Lend
                            </button>
                        </div>
                    </div>
                </div>
            `;
            break;

        case 'mortgage_lender':
            actionPanel.innerHTML = `
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">Offer Mortgage</label>
                        <select id="borrower" class="w-full p-2 border rounded mb-2">
                            <!-- Borrowers will be populated here -->
                        </select>
                        <div class="flex space-x-2 mb-2">
                            <input type="number" id="mortgage-amount" min="100" step="100" 
                                   class="flex-1 p-2 border rounded" placeholder="Amount">
                            <input type="number" id="mortgage-rate" min="0" max="20" step="0.25" 
                                   class="flex-1 p-2 border rounded" placeholder="Rate (%)">
                        </div>
                        <button onclick="offerMortgage()" class="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                            Offer Mortgage
                        </button>
                    </div>
                </div>
            `;
            break;

        case 'developer':
            actionPanel.innerHTML = `
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">Build House</label>
                        <select id="location" class="w-full p-2 border rounded mb-2">
                            <option value="suburban">Suburban (1x)</option>
                            <option value="urban">Urban (1.5x)</option>
                            <option value="prime">Prime Location (2x)</option>
                        </select>
                        <div class="flex space-x-2">
                            <input type="number" id="quality" min="1" max="10" 
                                   class="flex-1 p-2 border rounded" placeholder="Quality (1-10)">
                            <button onclick="buildHouse()" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                Build
                            </button>
                        </div>
                    </div>
                </div>
            `;
            break;

        case 'homebuyer':
        case 'speculator':
            actionPanel.innerHTML = `
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">Available Properties</label>
                        <select id="property-select" class="w-full p-2 border rounded mb-2">
                            <!-- Properties will be populated here -->
                        </select>
                        <button onclick="buyProperty()" class="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-2">
                            Buy Property
                        </button>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Your Properties</label>
                        <select id="owned-property-select" class="w-full p-2 border rounded mb-2">
                            <!-- Owned properties will be populated here -->
                        </select>
                        <button onclick="sellProperty()" class="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                            Sell Property
                        </button>
                    </div>
                </div>
            `;
            break;
    }
}

function updateGameState(state) {
    if (state.market_price) {
        document.getElementById('market-price').textContent = state.market_price.toFixed(2);
        updateChart(state.market_price);
    }
    if (state.round !== undefined) {
        document.getElementById('round-number').textContent = state.round;
    }
    if (state.interest_rates) {
        document.getElementById('bank-rate').textContent = state.interest_rates.bank.toFixed(1);
        document.getElementById('mortgage-rate').textContent = state.interest_rates.mortgage.toFixed(1);
    }
    if (state.properties) {
        updatePropertyList(state.properties);
    }
    updateAssets();
}

function updatePropertyList(properties) {
    const propertyList = document.getElementById('property-list');
    propertyList.innerHTML = '';
    
    properties.forEach(prop => {
        const div = document.createElement('div');
        div.className = 'text-sm';
        div.innerHTML = `
            <p>ID: ${prop.id} - ${prop.location} (Quality: ${prop.quality})</p>
            <p class="text-gray-600">Value: $${prop.current_value.toFixed(2)}</p>
        `;
        propertyList.appendChild(div);
    });

    // Update property selectors if they exist
    const propertySelect = document.getElementById('property-select');
    const ownedPropertySelect = document.getElementById('owned-property-select');
    
    if (propertySelect) {
        propertySelect.innerHTML = '<option value="">Select a property</option>' +
            properties.filter(p => !p.owner)
                .map(p => `<option value="${p.id}">
                    ${p.location} (Quality: ${p.quality}) - $${p.current_value.toFixed(2)}
                </option>`).join('');
    }
    
    if (ownedPropertySelect) {
        ownedPropertySelect.innerHTML = '<option value="">Select a property</option>' +
            properties.filter(p => p.owner === socket.id)
                .map(p => `<option value="${p.id}">
                    ${p.location} (Quality: ${p.quality}) - $${p.current_value.toFixed(2)}
                </option>`).join('');
    }
}

function updateAssets() {
    const assetList = document.getElementById('asset-list');
    // Implementation depends on the backend data structure
}

// Action functions
function setRate() {
    const rate = parseFloat(document.getElementById('bank-rate-input').value);
    socket.emit('player_action', {
        game_id: document.getElementById('display-game-id').textContent,
        action_type: 'set_bank_rate',
        action_data: { rate }
    });
}

function lendToBank() {
    const targetBank = document.getElementById('target-bank').value;
    const amount = parseFloat(document.getElementById('loan-amount').value);
    socket.emit('player_action', {
        game_id: document.getElementById('display-game-id').textContent,
        action_type: 'lend_to_bank',
        action_data: { target_bank: targetBank, amount }
    });
}

function offerMortgage() {
    const borrower = document.getElementById('borrower').value;
    const amount = parseFloat(document.getElementById('mortgage-amount').value);
    const rate = parseFloat(document.getElementById('mortgage-rate').value);
    socket.emit('player_action', {
        game_id: document.getElementById('display-game-id').textContent,
        action_type: 'offer_mortgage',
        action_data: { borrower_id: borrower, amount, rate }
    });
}

function buildHouse() {
    const location = document.getElementById('location').value;
    const quality = parseInt(document.getElementById('quality').value);
    socket.emit('player_action', {
        game_id: document.getElementById('display-game-id').textContent,
        action_type: 'build_house',
        action_data: { location, quality }
    });
}

function buyProperty() {
    const propertyId = document.getElementById('property-select').value;
    socket.emit('player_action', {
        game_id: document.getElementById('display-game-id').textContent,
        action_type: 'buy_property',
        action_data: { property_id: parseInt(propertyId) }
    });
}

function sellProperty() {
    const propertyId = document.getElementById('owned-property-select').value;
    socket.emit('player_action', {
        game_id: document.getElementById('display-game-id').textContent,
        action_type: 'sell_property',
        action_data: { property_id: parseInt(propertyId) }
    });
}

function addTransaction(message) {
    const history = document.getElementById('transaction-history');
    const entry = document.createElement('div');
    entry.className = 'p-2 bg-gray-50 rounded';
    entry.textContent = message;
    history.insertBefore(entry, history.firstChild);
}

function showGameOver(scores) {
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.remove('hidden');

    const leaderboard = document.getElementById('leaderboard');
    leaderboard.innerHTML = '';
    
    scores.forEach((score, index) => {
        const entry = document.createElement('div');
        entry.className = 'flex justify-between items-center p-2 bg-gray-50 rounded';
        entry.innerHTML = `
            <span class="font-semibold">${index + 1}. ${score[0]}</span>
            <span>$${score[1].toFixed(2)}</span>
        `;
        leaderboard.appendChild(entry);
    });
}

// Initialize Chart.js
function initializeChart() {
    const ctx = document.getElementById('market-chart').getContext('2d');
    gameChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'House Price',
                data: [],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Price ($)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Round'
                    }
                }
            }
        }
    });
}

function updateChart(price) {
    priceHistory.push(price);
    if (priceHistory.length > MAX_HISTORY_POINTS) {
        priceHistory.shift();
    }

    gameChart.data.labels = Array.from({length: priceHistory.length}, (_, i) => i + 1);
    gameChart.data.datasets[0].data = priceHistory;
    gameChart.update();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeSocket();
    initializeChart();

    document.getElementById('join-game-btn').addEventListener('click', () => {
        const gameId = document.getElementById('game-id').value;
        const playerName = document.getElementById('player-name').value;

        if (!gameId || !playerName) {
            alert('Please enter both game code and your name');
            return;
        }

        document.getElementById('display-game-id').textContent = gameId;
        socket.emit('join', {
            game_id: gameId,
            name: playerName
        });
    });

    document.getElementById('new-game-btn').addEventListener('click', () => {
        window.location.reload();
    });
});
