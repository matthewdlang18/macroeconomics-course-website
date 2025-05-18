/**
 * Game Logic for Econ Words
 * A simple word guessing game for economics terms using localStorage
 */

// Game state
const gameState = {
    currentWord: '',
    attempts: [],
    maxAttempts: 6,
    currentAttempt: '',
    gameOver: false,
    keyStates: {}
};

// Initialize game board
function initializeGame() {
    // Select random word
    gameState.currentWord = selectRandomWord().toUpperCase();
    gameState.attempts = [];
    gameState.currentAttempt = '';
    gameState.gameOver = false;
    gameState.keyStates = {};
    
    createGameBoard();
    updateGameHint();
    updateStats();
}

// Select a random word
function selectRandomWord() {
    if (!window.ECON_TERMS || !window.ECON_TERMS.length) {
        return 'ECONOMICS';
    }
    return window.ECON_TERMS[Math.floor(Math.random() * window.ECON_TERMS.length)];
}

// Create game board
function createGameBoard() {
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = '';
    
    const wordLength = gameState.currentWord.length;
    
    for (let i = 0; i < gameState.maxAttempts; i++) {
        const row = document.createElement('div');
        row.className = 'board-row';
        
        for (let j = 0; j < wordLength; j++) {
            const cell = document.createElement('div');
            cell.className = 'board-cell';
            row.appendChild(cell);
        }
        
        gameBoard.appendChild(row);
    }
}

// Handle keyboard input
function handleKeyPress(key) {
    if (gameState.gameOver) return;
    
    if (key === 'ENTER') {
        submitGuess();
    } else if (key === 'BACKSPACE') {
        deleteLastLetter();
    } else if (key === ' ') {
        addLetter(' ');
    } else if (/^[A-Z]$/.test(key)) {
        addLetter(key);
    }
}

// Add letter to current attempt
function addLetter(letter) {
    if (gameState.currentAttempt.length < gameState.currentWord.length) {
        gameState.currentAttempt += letter;
        updateDisplay();
    }
}

// Delete last letter
function deleteLastLetter() {
    if (gameState.currentAttempt.length > 0) {
        gameState.currentAttempt = gameState.currentAttempt.slice(0, -1);
        updateDisplay();
    }
}

// Submit guess
function submitGuess() {
    if (gameState.currentAttempt.length !== gameState.currentWord.length) {
        showNotification('Word is not complete!');
        return;
    }

    gameState.attempts.push(gameState.currentAttempt);
    gameState.currentAttempt = '';
    updateDisplay();

    // Check win/lose conditions
    if (gameState.attempts[gameState.attempts.length - 1] === gameState.currentWord) {
        gameWon();
    } else if (gameState.attempts.length >= gameState.maxAttempts) {
        gameLost();
    }
}

// Update display
function updateDisplay() {
    const rows = document.querySelectorAll('.board-row');
    
    // Update current row
    const currentAttempt = gameState.attempts.length;
    const cells = rows[currentAttempt].querySelectorAll('.board-cell');
    
    for (let i = 0; i < cells.length; i++) {
        cells[i].textContent = i < gameState.currentAttempt.length ? gameState.currentAttempt[i] : '';
    }

    // Update completed rows
    for (let i = 0; i < gameState.attempts.length; i++) {
        const row = rows[i];
        const guess = gameState.attempts[i];
        const cells = row.querySelectorAll('.board-cell');
        
        cells.forEach((cell, j) => {
            cell.textContent = guess[j];
            const result = checkLetter(guess[j], j);
            cell.className = 'board-cell ' + result;
            updateKeyState(guess[j], result);
        });
    }

    // Update keyboard
    updateKeyboard();
}

// Update game hint
function updateGameHint() {
    const hint = document.getElementById('game-hint');
    hint.textContent = `The word has ${gameState.currentWord.length} letters`;
}

// Check letter against solution
function checkLetter(letter, position) {
    if (letter === gameState.currentWord[position]) {
        return 'correct';
    } else if (gameState.currentWord.includes(letter)) {
        return 'present';
    } else {
        return 'absent';
    }
}

// Update keyboard display
function updateKeyboard() {
    document.querySelectorAll('.key').forEach(key => {
        const keyValue = key.getAttribute('data-key');
        key.className = 'key' + (gameState.keyStates[keyValue] ? ' ' + gameState.keyStates[keyValue] : '');
    });
}

// Update key state
function updateKeyState(key, result) {
    if (!gameState.keyStates[key] || 
        (result === 'correct') || 
        (result === 'present' && gameState.keyStates[key] === 'absent')) {
        gameState.keyStates[key] = result;
    }
}

// Calculate score
function calculateScore() {
    const baseScore = gameState.currentWord.length * 10;
    const attemptsLeft = gameState.maxAttempts - gameState.attempts.length;
    const attemptMultiplier = (attemptsLeft + 1) / gameState.maxAttempts;
    const wordSpaces = (gameState.currentWord.match(/ /g) || []).length;
    const multiWordBonus = wordSpaces > 0 ? wordSpaces * 20 : 0;
    
    return Math.round((baseScore * attemptMultiplier) + multiWordBonus);
}

// Game won
function gameWon() {
    gameState.gameOver = true;
    const score = calculateScore();
    window.UserStats.updateStats(true, score);
    updateStats();
    showResultModal(true, score);
}

// Game lost
function gameLost() {
    gameState.gameOver = true;
    window.UserStats.updateStats(false, 0);
    updateStats();
    showResultModal(false, 0);
}

// Update stats display
function updateStats() {
    const stats = window.UserStats.getStats();
    document.getElementById('user-best-score').textContent = stats.bestScore;
    document.getElementById('user-current-streak').textContent = stats.currentStreak;
    document.getElementById('user-games-played').textContent = stats.gamesPlayed;
}

// Show notification
function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 2000);
}

// Show result modal
function showResultModal(won, score) {
    const modal = document.getElementById('resultModal');
    const messageElement = document.getElementById('result-message');
    const explanationElement = document.getElementById('explanation');
    
    if (won) {
        messageElement.innerHTML = `
            <h4 class="text-success">Congratulations!</h4>
            <p>You won with ${gameState.attempts.length} attempts!</p>
            <p>Score: ${score} points</p>
        `;
    } else {
        messageElement.innerHTML = `
            <h4 class="text-danger">Game Over</h4>
            <p>The word was: ${gameState.currentWord}</p>
        `;
    }
    
    explanationElement.textContent = '';
    $(modal).modal('show');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the game
    initializeGame();

    // Keyboard input
    document.addEventListener('keydown', (e) => {
        const key = e.key.toUpperCase();
        if (key === 'ENTER' || key === 'BACKSPACE' || key === ' ' || /^[A-Z]$/.test(key)) {
            handleKeyPress(key);
        }
    });

    // On-screen keyboard
    document.querySelectorAll('.key').forEach(key => {
        key.addEventListener('click', () => {
            const keyValue = key.getAttribute('data-key');
            handleKeyPress(keyValue);
        });
    });

    // Play again button
    document.getElementById('play-again-btn').addEventListener('click', () => {
        $('#resultModal').modal('hide');
        initializeGame();
    });
});
