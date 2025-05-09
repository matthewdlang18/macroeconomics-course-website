/**
 * Game logic for the Econ Words game
 * This file contains the core game logic and state management
 */

// Import dynamic terms
import {
    GAME_TYPES,
    getGameTerm,
    getDailyGameTerm,
    isValidGameTerm,
    getGameTypeName
} from './dynamic-terms.js';

// Game state
const gameState = {
    currentTerm: null,
    currentType: null,
    attempts: [],
    maxAttempts: 6,
    currentAttempt: '',
    gameOver: false,
    won: false,
    keyStates: {},
    isLoading: true
};

// Initialize the game
async function initGame() {
    // Show loading state
    gameState.isLoading = true;
    updateLoadingState();

    // Get the game type from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const gameType = urlParams.get('type') || GAME_TYPES.CONCEPT;

    // Validate the game type
    if (!Object.values(GAME_TYPES).includes(gameType)) {
        // Invalid game type, redirect to the game selection page
        window.location.href = 'index.html';
        return;
    }

    // Set the current game type
    gameState.currentType = gameType;

    try {
        // Get a term for the current game type
        // Use daily term if URL has daily=true, otherwise use random term
        const useDaily = urlParams.get('daily') === 'true';
        gameState.currentTerm = useDaily
            ? await getDailyGameTerm(gameType)
            : await getGameTerm(gameType);

        // Reset game state
        gameState.attempts = [];
        gameState.currentAttempt = '';
        gameState.gameOver = false;
        gameState.won = false;
        gameState.keyStates = {};

        // Update the UI
        updateGameTitle();
        updateGameBoard();
        updateKeyboard();
        updateGameHint();

        // Set up event listeners
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing game:', error);
        showErrorMessage('Failed to load game data. Please try again.');
    } finally {
        // Hide loading state
        gameState.isLoading = false;
        updateLoadingState();
    }
}

// Update loading state
function updateLoadingState() {
    const gameContainer = document.querySelector('.game-container');
    const loadingIndicator = document.getElementById('loading-indicator');

    if (gameState.isLoading) {
        // Show loading indicator
        if (gameContainer) {
            gameContainer.style.opacity = '0.5';
            gameContainer.style.pointerEvents = 'none';
        }

        if (!loadingIndicator) {
            const indicator = document.createElement('div');
            indicator.id = 'loading-indicator';
            indicator.innerHTML = `
                <div class="spinner-border text-primary" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
                <p class="mt-2">Loading game data...</p>
            `;
            indicator.style.position = 'fixed';
            indicator.style.top = '50%';
            indicator.style.left = '50%';
            indicator.style.transform = 'translate(-50%, -50%)';
            indicator.style.textAlign = 'center';
            indicator.style.zIndex = '1000';

            document.body.appendChild(indicator);
        }
    } else {
        // Hide loading indicator
        if (gameContainer) {
            gameContainer.style.opacity = '1';
            gameContainer.style.pointerEvents = 'auto';
        }

        if (loadingIndicator) {
            loadingIndicator.remove();
        }
    }
}

// Show error message
function showErrorMessage(message) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'alert alert-danger';
    errorContainer.style.position = 'fixed';
    errorContainer.style.top = '20px';
    errorContainer.style.left = '50%';
    errorContainer.style.transform = 'translateX(-50%)';
    errorContainer.style.zIndex = '1000';
    errorContainer.style.padding = '15px 20px';
    errorContainer.style.borderRadius = '5px';
    errorContainer.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';

    errorContainer.innerHTML = `
        <strong>Error:</strong> ${message}
        <button type="button" class="close" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    `;

    document.body.appendChild(errorContainer);

    // Add click event to close button
    const closeButton = errorContainer.querySelector('.close');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            errorContainer.remove();
        });
    }

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(errorContainer)) {
            errorContainer.remove();
        }
    }, 5000);
}

// Update the game title
function updateGameTitle() {
    const gameTypeLink = document.getElementById('game-type-link');
    const gameTitle = document.getElementById('game-title');

    if (gameTypeLink) {
        gameTypeLink.textContent = getGameTypeName(gameState.currentType);
    }

    if (gameTitle) {
        gameTitle.textContent = getGameTypeName(gameState.currentType);
    }
}

// Update the game hint
function updateGameHint() {
    const gameHint = document.getElementById('game-hint');
    const gameInstruction = document.getElementById('game-instruction');

    if (gameHint && gameState.currentTerm) {
        gameHint.textContent = gameState.currentTerm.definition;
    }

    if (gameInstruction && gameState.currentTerm) {
        gameInstruction.textContent = `Guess the ${gameState.currentTerm.term.length}-letter ${getGameTypeName(gameState.currentType).toLowerCase()}`;

        // Add chapter reference if available
        if (gameState.currentTerm.chapter) {
            const chapterRef = document.createElement('small');
            chapterRef.className = 'text-muted d-block mt-1';
            chapterRef.textContent = `From: ${gameState.currentTerm.chapter}`;

            // Remove any existing chapter reference
            const existingRef = gameInstruction.nextElementSibling;
            if (existingRef && existingRef.classList.contains('text-muted')) {
                existingRef.remove();
            }

            // Add the new chapter reference
            gameInstruction.parentNode.insertBefore(chapterRef, gameInstruction.nextSibling);
        }
    }
}

// Handle key press
function handleKeyPress(key) {
    if (gameState.gameOver) {
        return;
    }

    // Get the actual length of the current term
    const termLength = gameState.currentTerm.term.length;

    if (key === 'ENTER') {
        submitAttempt();
    } else if (key === 'BACKSPACE') {
        // Remove the last character from the current attempt
        if (gameState.currentAttempt.length > 0) {
            gameState.currentAttempt = gameState.currentAttempt.slice(0, -1);
            updateGameBoard();
        }
    } else if (/^[A-Z]$/.test(key)) {
        // Add the letter to the current attempt if it's not at the term's length
        if (gameState.currentAttempt.length < termLength) {
            gameState.currentAttempt += key;
            updateGameBoard();
        }
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

    // Check if the game is over
    if (correct) {
        gameState.gameOver = true;
        gameState.won = true;
        setTimeout(() => {
            showGameOverMessage();
        }, 1500);
    } else if (gameState.attempts.length >= gameState.maxAttempts) {
        gameState.gameOver = true;
        setTimeout(() => {
            showGameOverMessage();
        }, 1500);
    }

    // Reset the current attempt
    gameState.currentAttempt = '';
}

// Check if the current attempt is valid
function isValidAttempt() {
    // Check if the attempt is empty
    if (gameState.currentAttempt.length === 0) {
        return false;
    }

    // Check if the attempt has the same length as the current term
    if (gameState.currentAttempt.length !== gameState.currentTerm.term.length) {
        showToast(`Your guess must be ${gameState.currentTerm.term.length} letters`);
        return false;
    }

    // Check if the attempt contains only letters
    if (!/^[A-Z]+$/.test(gameState.currentAttempt)) {
        return false;
    }

    // Use the dynamic validation function
    if (!isValidGameTerm(gameState.currentAttempt, gameState.currentType)) {
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
        showToast(`Your guess must be ${gameState.currentTerm.term.length} letters`);
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

// Show game over message
function showGameOverMessage() {
    const resultModal = new bootstrap.Modal(document.getElementById('resultModal'));
    const resultMessage = document.getElementById('result-message');
    const explanation = document.getElementById('explanation');

    if (resultMessage) {
        if (gameState.won) {
            resultMessage.innerHTML = `
                <div class="alert alert-success">
                    <h4>Congratulations!</h4>
                    <p>You guessed the correct term: <strong>${gameState.currentTerm.term}</strong></p>
                    <p>You solved it in ${gameState.attempts.length} ${gameState.attempts.length === 1 ? 'attempt' : 'attempts'}.</p>
                </div>
            `;
        } else {
            resultMessage.innerHTML = `
                <div class="alert alert-danger">
                    <h4>Game Over</h4>
                    <p>The correct term was: <strong>${gameState.currentTerm.term}</strong></p>
                </div>
            `;
        }
    }

    if (explanation) {
        let chapterInfo = '';

        if (gameState.currentTerm.chapter) {
            chapterInfo += `From: ${gameState.currentTerm.chapter}`;

            if (gameState.currentTerm.page) {
                chapterInfo += `, page ${gameState.currentTerm.page}`;
            }
        }

        explanation.innerHTML = `
            <h5>${gameState.currentTerm.term}</h5>
            <p>${gameState.currentTerm.definition}</p>
            ${chapterInfo ? `<p class="chapter-reference">${chapterInfo}</p>` : ''}
        `;
    }

    resultModal.show();
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
        } else if (/^[A-Z]$/.test(key)) {
            handleKeyPress(key);
        }
    });

    // Play again button
    const playAgainBtn = document.getElementById('play-again-btn');
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => {
            // Close the modal
            const resultModal = bootstrap.Modal.getInstance(document.getElementById('resultModal'));
            if (resultModal) {
                resultModal.hide();
            }

            // Reload the page to start a new game
            window.location.reload();
        });
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', initGame);

// Export gameState and functions for use in other modules
export { gameState, updateGameBoard, updateKeyboard, handleKeyPress };
