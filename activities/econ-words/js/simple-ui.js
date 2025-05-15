/**
 * Simple UI for Econ Words
 * This file contains the UI-related functions without using ES modules
 */

// Update the keyboard
function updateKeyboard() {
    const keyboard = document.getElementById('keyboard');
    if (!keyboard) return;

    // Clear the keyboard
    keyboard.innerHTML = '';

    // Define the keyboard layout
    const keyboardLayout = [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
        ['SPACE'] // Add a space key
    ];

    // Create rows for the keyboard
    keyboardLayout.forEach(row => {
        const keyboardRow = document.createElement('div');
        keyboardRow.className = 'keyboard-row';

        // Create keys for each letter in the row
        row.forEach(key => {
            const keyElement = document.createElement('div');
            keyElement.className = 'key';

            // Add wide class for Enter, Backspace, and Space keys
            if (key === 'ENTER' || key === 'BACKSPACE') {
                keyElement.classList.add('wide');
            } else if (key === 'SPACE') {
                keyElement.classList.add('extra-wide');
            }

            // Set the key text
            if (key === 'BACKSPACE') {
                keyElement.innerHTML = '<i class="fas fa-backspace"></i>';
            } else if (key === 'SPACE') {
                keyElement.innerHTML = '&nbsp;'; // Space character
                keyElement.classList.add('space-key'); // Add the space-key class
            } else {
                keyElement.textContent = key;
            }

            // Add the appropriate class based on the key's state
            if (gameState.keyStates[key]) {
                keyElement.classList.add(gameState.keyStates[key]);
            }

            // Add click event listener
            keyElement.addEventListener('click', () => {
                // Add press animation
                keyElement.classList.add('press-animation');
                setTimeout(() => {
                    keyElement.classList.remove('press-animation');
                }, 200);

                handleKeyPress(key);
            });

            keyboardRow.appendChild(keyElement);
        });

        keyboard.appendChild(keyboardRow);
    });
}

// Initialize user info
function initUserInfo() {
    const userNameDisplay = document.getElementById('user-name-display');

    if (userNameDisplay) {
        // Get user name from localStorage
        const userName = localStorage.getItem('userName') || 'Guest';
        userNameDisplay.textContent = userName;
    }
}

// Update game stats display
function updateGameStats() {
    // Update current streak
    const currentStreakElement = document.getElementById('current-streak');
    if (currentStreakElement) {
        currentStreakElement.textContent = gameState.streak;
    }

    // Update high score for current game type
    const highScoreElement = document.getElementById('high-score');
    if (highScoreElement) {
        const highScore = getHighScore('econ');
        highScoreElement.textContent = highScore;
    }

    // Update game count
    const gameCountElement = document.getElementById('game-count');
    if (gameCountElement) {
        gameCountElement.textContent = gameState.gameCount;
    }

    // Update progress bar
    updateProgressBar();

    // Update high scores for all categories
    updateCategoryHighScores();
}

// Update the progress bar based on current attempts
function updateProgressBar() {
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    if (progressBar && progressText) {
        const currentRound = gameState.attempts.length;
        const maxRounds = gameState.maxAttempts;
        const progressPercentage = (currentRound / maxRounds) * 100;

        progressBar.style.width = `${progressPercentage}%`;
        progressBar.setAttribute('aria-valuenow', progressPercentage);

        progressText.textContent = `Round ${currentRound} of ${maxRounds}`;

        // Change progress bar color based on progress
        if (progressPercentage < 33) {
            progressBar.className = 'progress-bar bg-success';
        } else if (progressPercentage < 66) {
            progressBar.className = 'progress-bar bg-warning';
        } else {
            progressBar.className = 'progress-bar bg-danger';
        }
    }
}

// Update high scores for all categories
function updateCategoryHighScores() {
    // Update economics high score
    const econHighScoreElement = document.getElementById('high-score-econ');
    if (econHighScoreElement) {
        const econHighScore = getHighScore('econ');
        econHighScoreElement.textContent = econHighScore;
    }
}

// Update game banner
function updateGameBanner() {
    const urlParams = new URLSearchParams(window.location.search);
    const isDaily = urlParams.get('daily') === 'true';
    const gameBanner = document.getElementById('game-banner');

    if (gameBanner) {
        // Use a default banner
        gameBanner.src = 'https://via.placeholder.com/1200x300/007bff/ffffff?text=Econ+Words';
    }
}

// Submit the current attempt
function submitAttempt() {
    // Check if the current attempt is valid
    if (!isValidAttempt()) {
        showInvalidAttemptMessage();
        return;
    }

    // Add the current attempt to the attempts array
    gameState.attempts.push(gameState.currentAttempt);

    // Check if the attempt is correct
    const correct = gameState.currentAttempt === gameState.currentTerm.term;

    // Update key states
    updateKeyStates();

    // Update the game board with the result
    updateGameBoard();

    // Update the progress bar
    updateProgressBar();

    // Check if the game is over
    if (correct) {
        gameState.gameOver = true;
        gameState.won = true;
        gameState.endTime = new Date();

        // Calculate score based on attempts and time
        calculateScore();

        // Update streak
        gameState.streak++;
        localStorage.setItem('econWordsStreak', gameState.streak.toString());

        // Update game stats display
        updateGameStats();

        setTimeout(() => {
            showGameOverMessage();
        }, 1500);
    } else if (gameState.attempts.length >= gameState.maxAttempts) {
        gameState.gameOver = true;
        gameState.endTime = new Date();

        // Reset streak on loss
        gameState.streak = 0;
        localStorage.setItem('econWordsStreak', '0');

        // Update game stats display
        updateGameStats();

        setTimeout(() => {
            showGameOverMessage();
        }, 1500);
    }

    // Reset the current attempt
    gameState.currentAttempt = '';

    // Update the hint based on the current attempt count
    updateGameHint();
}

// Check if the current attempt is valid
function isValidAttempt() {
    // Check if the attempt is empty
    if (gameState.currentAttempt.length === 0) {
        return false;
    }

    // Check if the attempt has the same length as the current term
    if (gameState.currentAttempt.length !== gameState.currentTerm.term.length) {
        const termWithoutSpaces = gameState.currentTerm.term.replace(/\s/g, '');
        showToast(`Your guess must be ${termWithoutSpaces.length} letters (with spaces)`);
        return false;
    }

    // Check if the attempt contains only letters and spaces
    if (!/^[A-Z\s]+$/.test(gameState.currentAttempt)) {
        return false;
    }

    return true;
}

// Show invalid attempt message
function showInvalidAttemptMessage() {
    // Add shake animation to the current row
    const currentRow = document.querySelector(`.game-row[data-row="${gameState.attempts.length}"]`);
    if (currentRow) {
        currentRow.classList.add('shake-animation');
        setTimeout(() => {
            currentRow.classList.remove('shake-animation');
        }, 500);
    }

    // Show toast message if the attempt is not empty but not the right length
    if (gameState.currentAttempt.length > 0 &&
        gameState.currentAttempt.length !== gameState.currentTerm.term.length) {
        // Get the word structure for multi-word terms
        const wordStructure = gameState.currentTerm.term.split(' ').map(word => word.length).join('-');

        if (gameState.currentTerm.term.includes(' ')) {
            showToast(`Your guess must be a ${wordStructure}-letter term with spaces`);
        } else {
            showToast(`Your guess must be ${gameState.currentTerm.term.length} letters`);
        }
    } else {
        showToast('Not a valid term');
    }
}

// Update key states based on the current attempt
function updateKeyStates() {
    const attempt = gameState.currentAttempt;
    const answer = gameState.currentTerm.term;

    // Create a map of the answer letters for easier lookup
    const answerMap = {};
    for (let i = 0; i < answer.length; i++) {
        const letter = answer[i];
        if (!answerMap[letter]) {
            answerMap[letter] = 0;
        }
        answerMap[letter]++;
    }

    // First pass: Mark correct letters
    for (let i = 0; i < attempt.length; i++) {
        const letter = attempt[i];
        if (letter === answer[i]) {
            gameState.keyStates[letter] = 'correct';
            answerMap[letter]--;
        }
    }

    // Second pass: Mark present or absent letters
    for (let i = 0; i < attempt.length; i++) {
        const letter = attempt[i];
        if (letter !== answer[i]) {
            if (answerMap[letter] && answerMap[letter] > 0) {
                gameState.keyStates[letter] = gameState.keyStates[letter] === 'correct' ? 'correct' : 'present';
                answerMap[letter]--;
            } else {
                gameState.keyStates[letter] = gameState.keyStates[letter] === 'correct' || gameState.keyStates[letter] === 'present' ?
                    gameState.keyStates[letter] : 'absent';
            }
        }
    }

    // Update the keyboard UI
    updateKeyboard();
}

// Show toast message
function showToast(message) {
    // Check if toast container exists, if not create it
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    // Add toast to container
    toastContainer.appendChild(toast);

    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Set up event listeners
function setupEventListeners() {
    // Keyboard event listener
    document.addEventListener('keydown', (event) => {
        if (gameState.gameOver) {
            return;
        }

        const key = event.key.toUpperCase();

        if (key === 'ENTER') {
            handleKeyPress('ENTER');
        } else if (key === 'BACKSPACE' || key === 'DELETE') {
            handleKeyPress('BACKSPACE');
        } else if (key === ' ') {
            handleKeyPress('SPACE');
        } else if (/^[A-Z]$/.test(key)) {
            handleKeyPress(key);
        }
    });

    // Play again button in the modal
    const playAgainBtn = document.getElementById('play-again-btn');
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => {
            // Close the modal using jQuery
            $('#resultModal').modal('hide');

            // Start a new game without reloading
            startNewGame();
        });
    }

    // New game button in the main interface
    const newGameBtn = document.getElementById('new-game-btn');
    if (newGameBtn) {
        newGameBtn.addEventListener('click', () => {
            // If a game is in progress, confirm before starting a new one
            if (!gameState.gameOver && gameState.attempts.length > 0) {
                if (confirm('Are you sure you want to start a new game? Your current progress will be lost.')) {
                    startNewGame();
                }
            } else {
                startNewGame();
            }
        });
    }
}
