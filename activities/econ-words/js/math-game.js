/**
 * Mathematical Economics Game Logic
 * This file contains the game logic for the mathematical economics problems
 * with digit-by-digit guessing similar to Wordle
 */

// Game state
const gameState = {
    currentProblem: null,
    attempts: [],
    maxAttempts: 5,
    currentAttempt: [],
    gameOver: false,
    problemsSolved: 0,
    streak: 0,
    answerDigits: [],
    hasDecimal: false,
    decimalPosition: -1
};

// Initialize the game
function initGame() {
    // Load saved stats
    loadStats();

    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const problemId = urlParams.get('id');
    const isDaily = urlParams.get('daily') === 'true';

    // Load problem based on parameters
    if (problemId) {
        // Load specific problem by ID
        gameState.currentProblem = getMathProblemById(problemId);
    } else if (isDaily) {
        // Load daily problem
        gameState.currentProblem = getDailyMathProblem();
    } else {
        // Load random problem
        gameState.currentProblem = getRandomMathProblem();
    }

    // If no problem was found, load a random one
    if (!gameState.currentProblem) {
        gameState.currentProblem = getRandomMathProblem();
    }

    // Reset game state
    gameState.attempts = [];
    gameState.currentAttempt = [];
    gameState.gameOver = false;

    // Process the answer into digits
    processAnswer();

    // Update UI
    updateProblemUI();
    createDigitBoard();
    createDigitKeyboard();
    updateAttemptsUI();
    updateStatsUI();

    // Set up event listeners
    setupEventListeners();
}

// Process the answer into digits
function processAnswer() {
    // Convert the answer to a string
    const answerStr = gameState.currentProblem.answer.toString();

    // Check if the answer has a decimal point
    gameState.hasDecimal = answerStr.includes('.');

    // Split the answer into digits
    if (gameState.hasDecimal) {
        // Find the decimal position
        gameState.decimalPosition = answerStr.indexOf('.');

        // Split the answer into digits, excluding the decimal point
        gameState.answerDigits = answerStr.replace('.', '').split('').map(d => parseInt(d, 10));
    } else {
        gameState.answerDigits = answerStr.split('').map(d => parseInt(d, 10));
    }
}

// Create the digit board
function createDigitBoard() {
    const digitBoard = document.getElementById('digit-board');
    if (!digitBoard) return;

    digitBoard.innerHTML = '';

    // Create slots for each digit
    for (let i = 0; i < gameState.answerDigits.length; i++) {
        // If there's a decimal point and we're at the decimal position, add a decimal slot
        if (gameState.hasDecimal && i === gameState.decimalPosition) {
            const decimalSlot = document.createElement('div');
            decimalSlot.className = 'digit-slot decimal';
            digitBoard.appendChild(decimalSlot);
        }

        // Create a digit slot
        const digitSlot = document.createElement('div');
        digitSlot.className = 'digit-slot';
        digitSlot.dataset.index = i;
        digitBoard.appendChild(digitSlot);
    }
}

// Create the digit keyboard
function createDigitKeyboard() {
    const digitKeyboard = document.getElementById('digit-keyboard');
    if (!digitKeyboard) return;

    digitKeyboard.innerHTML = '';

    // Create keys for digits 0-9
    for (let i = 0; i <= 9; i++) {
        const digitKey = document.createElement('button');
        digitKey.className = 'digit-key';
        digitKey.textContent = i;
        digitKey.dataset.digit = i;
        digitKey.addEventListener('click', () => handleDigitInput(i));
        digitKeyboard.appendChild(digitKey);
    }
}

// Handle digit input
function handleDigitInput(digit) {
    if (gameState.gameOver) return;

    // If we've already filled all slots, do nothing
    if (gameState.currentAttempt.length >= gameState.answerDigits.length) return;

    // Add the digit to the current attempt
    gameState.currentAttempt.push(digit);

    // Update the digit board
    updateDigitBoard();
}

// Handle backspace
function handleBackspace() {
    if (gameState.gameOver) return;

    // If there are no digits to remove, do nothing
    if (gameState.currentAttempt.length === 0) return;

    // Remove the last digit
    gameState.currentAttempt.pop();

    // Update the digit board
    updateDigitBoard();
}

// Update the digit board
function updateDigitBoard() {
    const digitSlots = document.querySelectorAll('.digit-slot:not(.decimal)');

    // Clear all slots
    digitSlots.forEach(slot => {
        slot.textContent = '';
        slot.className = 'digit-slot';
    });

    // Fill in the current attempt
    for (let i = 0; i < gameState.currentAttempt.length; i++) {
        if (i < digitSlots.length) {
            digitSlots[i].textContent = gameState.currentAttempt[i];
            digitSlots[i].className = 'digit-slot filled';
        }
    }
}

// Set up event listeners
function setupEventListeners() {
    // Submit answer button
    const submitButton = document.getElementById('submit-answer');
    if (submitButton) {
        submitButton.addEventListener('click', submitAnswer);
    }

    // Backspace button
    const backspaceButton = document.getElementById('backspace');
    if (backspaceButton) {
        backspaceButton.addEventListener('click', handleBackspace);
    }

    // Show hint button
    const hintButton = document.getElementById('show-hint');
    if (hintButton) {
        hintButton.addEventListener('click', showHint);
    }

    // New problem button
    const newProblemButton = document.getElementById('new-problem');
    if (newProblemButton) {
        newProblemButton.addEventListener('click', loadNewProblem);
    }

    // Keyboard event listener
    document.addEventListener('keydown', handleKeyDown);
}

// Handle keyboard input
function handleKeyDown(event) {
    if (gameState.gameOver) return;

    // If the key is a digit, add it to the current attempt
    if (/^[0-9]$/.test(event.key)) {
        handleDigitInput(parseInt(event.key, 10));
    }

    // If the key is backspace, remove the last digit
    if (event.key === 'Backspace') {
        handleBackspace();
    }

    // If the key is Enter, submit the answer
    if (event.key === 'Enter') {
        submitAnswer();
    }
}

// Update the problem UI
function updateProblemUI() {
    if (!gameState.currentProblem) return;

    // Update problem title
    const titleElement = document.getElementById('problem-title');
    if (titleElement) {
        titleElement.textContent = gameState.currentProblem.title;
    }

    // Update difficulty badge
    const difficultyBadge = document.getElementById('difficulty-badge');
    if (difficultyBadge) {
        const difficulty = gameState.currentProblem.difficulty;
        difficultyBadge.className = `difficulty-badge difficulty-${difficulty}`;

        let difficultyText = 'Unknown';
        switch (difficulty) {
            case 1: difficultyText = 'Easy'; break;
            case 2: difficultyText = 'Medium'; break;
            case 3: difficultyText = 'Challenging'; break;
            case 4: difficultyText = 'Hard'; break;
            case 5: difficultyText = 'Expert'; break;
        }

        difficultyBadge.textContent = difficultyText;
    }

    // Update problem question
    const questionElement = document.getElementById('problem-question');
    if (questionElement) {
        questionElement.textContent = gameState.currentProblem.question;
    }

    // Update parameters table
    const parametersBody = document.getElementById('parameters-body');
    if (parametersBody) {
        parametersBody.innerHTML = '';

        const parameters = gameState.currentProblem.parameters;

        // Determine if we should hide some parameters to increase difficulty
        // Higher difficulty = higher chance of hiding parameters
        const difficulty = gameState.currentProblem.difficulty;
        const hideChance = Math.min(0.1 * difficulty, 0.4); // 10-40% chance based on difficulty

        // Get all parameter keys
        const paramKeys = Object.keys(parameters);

        // Randomly select parameters to hide (max 1 for difficulty 1-2, max 2 for difficulty 3+)
        const maxHidden = difficulty <= 2 ? 1 : 2;
        const parametersToHide = new Set();

        // Only hide parameters if there are more than 2 parameters
        if (paramKeys.length > 2 && Math.random() < hideChance) {
            // Randomly select parameters to hide
            while (parametersToHide.size < maxHidden && parametersToHide.size < paramKeys.length - 1) {
                const randomIndex = Math.floor(Math.random() * paramKeys.length);
                parametersToHide.add(paramKeys[randomIndex]);
            }
        }

        // Display parameters, hiding some based on difficulty
        for (const [key, value] of Object.entries(parameters)) {
            const row = document.createElement('tr');

            const keyCell = document.createElement('td');
            keyCell.textContent = key;

            const valueCell = document.createElement('td');

            // If this parameter is hidden, show "???"
            if (parametersToHide.has(key)) {
                valueCell.textContent = "???";
                valueCell.className = "text-danger";
            } else {
                valueCell.textContent = value;
            }

            row.appendChild(keyCell);
            row.appendChild(valueCell);

            parametersBody.appendChild(row);
        }

        // If any parameters are hidden, add a hint
        if (parametersToHide.size > 0) {
            const hintRow = document.createElement('tr');
            const hintCell = document.createElement('td');
            hintCell.colSpan = 2;
            hintCell.className = "text-info small";
            hintCell.textContent = "Some values are hidden! Try to solve with the available information.";
            hintRow.appendChild(hintCell);
            parametersBody.appendChild(hintRow);
        }
    }

    // Update answer hint
    const answerHint = document.getElementById('answer-hint');
    if (answerHint) {
        if (gameState.currentProblem.tolerance > 0) {
            answerHint.textContent = `Your answer will be accepted if it's within ${gameState.currentProblem.tolerance} ${gameState.currentProblem.unit} of the correct answer`;
        } else {
            answerHint.textContent = `Enter your answer with appropriate precision${gameState.currentProblem.unit ? ' in ' + gameState.currentProblem.unit : ''}`;
        }
    }

    // Hide hint container
    const hintContainer = document.getElementById('hint-container');
    if (hintContainer) {
        hintContainer.style.display = 'none';
    }

    // Hide solution container
    const solutionContainer = document.getElementById('solution-container');
    if (solutionContainer) {
        solutionContainer.style.display = 'none';
    }

    // Update buttons
    const submitButton = document.getElementById('submit-answer');
    const newProblemButton = document.getElementById('new-problem');

    if (submitButton) {
        submitButton.disabled = gameState.gameOver;
    }

    if (newProblemButton) {
        newProblemButton.style.display = gameState.gameOver ? 'inline-block' : 'none';
    }
}

// Update the attempts UI
function updateAttemptsUI() {
    const attemptsList = document.getElementById('attempts-list');
    if (!attemptsList) return;

    attemptsList.innerHTML = '';

    if (gameState.attempts.length === 0) {
        const noAttemptsMessage = document.createElement('p');
        noAttemptsMessage.textContent = 'No attempts yet. You have ' + gameState.maxAttempts + ' attempts to solve this problem.';
        attemptsList.appendChild(noAttemptsMessage);
        return;
    }

    // Add remaining attempts info
    const remainingAttempts = gameState.maxAttempts - gameState.attempts.length;
    const remainingElement = document.createElement('p');
    remainingElement.className = 'mt-2';
    remainingElement.textContent = `You have ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`;
    attemptsList.appendChild(remainingElement);
}

// Update the previous attempts display
function updatePreviousAttemptsUI() {
    const previousAttemptsContainer = document.getElementById('previous-attempts');
    if (!previousAttemptsContainer) return;

    previousAttemptsContainer.innerHTML = '';

    // Display each attempt
    gameState.attempts.forEach(attempt => {
        const attemptContainer = document.createElement('div');
        attemptContainer.className = 'previous-attempt';

        // Create a digit element for each digit in the attempt
        for (let i = 0; i < attempt.digits.length; i++) {
            // If there's a decimal point and we're at the decimal position, add a decimal element
            if (gameState.hasDecimal && i === gameState.decimalPosition) {
                const decimalElement = document.createElement('div');
                decimalElement.className = 'attempt-digit decimal';
                attemptContainer.appendChild(decimalElement);
            }

            // Create a digit element
            const digitElement = document.createElement('div');
            digitElement.className = `attempt-digit ${attempt.results[i]}`;
            digitElement.textContent = attempt.digits[i];
            attemptContainer.appendChild(digitElement);
        }

        previousAttemptsContainer.appendChild(attemptContainer);
    });
}

// Update the stats UI
function updateStatsUI() {
    // Update problems solved
    const problemsSolvedElement = document.getElementById('problems-solved');
    if (problemsSolvedElement) {
        problemsSolvedElement.textContent = gameState.problemsSolved;
    }

    // Update current streak
    const currentStreakElement = document.getElementById('current-streak');
    if (currentStreakElement) {
        currentStreakElement.textContent = gameState.streak;
    }
}

// Submit an answer
function submitAnswer() {
    if (gameState.gameOver) return;

    // If the attempt is not complete, do nothing
    if (gameState.currentAttempt.length < gameState.answerDigits.length) {
        alert('Please enter all digits before submitting');
        return;
    }

    // Check each digit and determine if it's correct, present, or absent
    const results = [];

    // Create a copy of the answer digits to track which ones have been matched
    const remainingAnswerDigits = [...gameState.answerDigits];

    // First pass: check for correct digits
    for (let i = 0; i < gameState.currentAttempt.length; i++) {
        const digit = gameState.currentAttempt[i];

        if (digit === gameState.answerDigits[i]) {
            results[i] = 'correct';
            remainingAnswerDigits[i] = null; // Mark this digit as matched
        } else {
            results[i] = null; // Placeholder for now
        }
    }

    // Second pass: check for present digits
    for (let i = 0; i < gameState.currentAttempt.length; i++) {
        if (results[i] !== null) continue; // Skip already matched digits

        const digit = gameState.currentAttempt[i];
        const indexInRemaining = remainingAnswerDigits.indexOf(digit);

        if (indexInRemaining !== -1) {
            results[i] = 'present';
            remainingAnswerDigits[indexInRemaining] = null; // Mark this digit as matched
        } else {
            results[i] = 'absent';
        }
    }

    // Add the attempt to the game state
    gameState.attempts.push({
        digits: [...gameState.currentAttempt],
        results: results
    });

    // Check if the answer is correct
    const isCorrect = results.every(result => result === 'correct');

    // Update the keyboard
    updateKeyboard(gameState.currentAttempt, results);

    // Check if game is over
    if (isCorrect || gameState.attempts.length >= gameState.maxAttempts) {
        gameState.gameOver = true;

        // Update stats
        if (isCorrect) {
            gameState.problemsSolved++;
            gameState.streak++;
        } else {
            gameState.streak = 0;
        }

        // Save stats
        saveStats();

        // Show solution
        showSolution();
    }

    // Reset current attempt
    gameState.currentAttempt = [];

    // Update UI
    updateDigitBoard();
    updateAttemptsUI();
    updatePreviousAttemptsUI();
    updateStatsUI();
    updateProblemUI();
}

// Update the keyboard based on the results
function updateKeyboard(digits, results) {
    for (let i = 0; i < digits.length; i++) {
        const digit = digits[i];
        const result = results[i];

        // Find the key for this digit
        const key = document.querySelector(`.digit-key[data-digit="${digit}"]`);
        if (!key) continue;

        // Update the key's class based on the result
        if (result === 'correct') {
            key.className = 'digit-key correct';
        } else if (result === 'present' && !key.classList.contains('correct')) {
            key.className = 'digit-key present';
        } else if (result === 'absent' && !key.classList.contains('correct') && !key.classList.contains('present')) {
            key.className = 'digit-key absent';
        }
    }
}

// Show the hint
function showHint() {
    const hintContainer = document.getElementById('hint-container');
    const hintText = document.getElementById('hint-text');

    if (hintContainer && hintText && gameState.currentProblem) {
        hintText.textContent = gameState.currentProblem.hint;
        hintContainer.style.display = 'block';
    }
}

// Show the solution
function showSolution() {
    const solutionContainer = document.getElementById('solution-container');
    const solutionSteps = document.getElementById('solution-steps');
    const explanationText = document.getElementById('explanation-text');

    if (solutionContainer && solutionSteps && explanationText && gameState.currentProblem) {
        solutionSteps.textContent = gameState.currentProblem.solution;
        explanationText.textContent = gameState.currentProblem.explanation;
        solutionContainer.style.display = 'block';
    }
}

// Load a new problem
function loadNewProblem() {
    // Get a random problem
    gameState.currentProblem = getRandomMathProblem();

    // Process the answer into digits
    processAnswer();

    // Reset game state
    gameState.attempts = [];
    gameState.currentAttempt = [];
    gameState.gameOver = false;

    // Update UI
    updateProblemUI();
    createDigitBoard();
    createDigitKeyboard();
    updateAttemptsUI();
    updatePreviousAttemptsUI();
}

// Save stats to localStorage
function saveStats() {
    localStorage.setItem('mathGameProblemsSolved', gameState.problemsSolved.toString());
    localStorage.setItem('mathGameStreak', gameState.streak.toString());
}

// Load stats from localStorage
function loadStats() {
    const problemsSolved = localStorage.getItem('mathGameProblemsSolved');
    const streak = localStorage.getItem('mathGameStreak');

    if (problemsSolved) {
        gameState.problemsSolved = parseInt(problemsSolved, 10);
    }

    if (streak) {
        gameState.streak = parseInt(streak, 10);
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initGame();

    // Add event listener for the regenerate problems button
    const regenerateButton = document.getElementById('regenerate-problems');
    if (regenerateButton) {
        regenerateButton.addEventListener('click', function() {
            // Regenerate problems with new random values
            if (typeof window.regenerateProblems === 'function') {
                window.regenerateProblems();

                // Load a new problem
                loadNewProblem();

                // Show a toast notification
                showToast('New problems generated!', 'success');
            }
        });
    }
});

// Function to show a toast notification
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    toast.setAttribute('id', toastId);

    // Create toast content
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    // Add toast to container
    toastContainer.appendChild(toast);

    // Initialize and show the toast
    const bsToast = new bootstrap.Toast(toast, {
        autohide: true,
        delay: 3000
    });
    bsToast.show();

    // Remove toast after it's hidden
    toast.addEventListener('hidden.bs.toast', function() {
        toast.remove();
    });
}
