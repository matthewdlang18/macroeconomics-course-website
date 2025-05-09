/**
 * Mathematical Economics Game Logic
 * This file contains the game logic for the mathematical economics problems
 */

// Game state
const gameState = {
    currentProblem: null,
    attempts: [],
    maxAttempts: 5,
    gameOver: false,
    problemsSolved: 0,
    streak: 0
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
    gameState.gameOver = false;
    
    // Update UI
    updateProblemUI();
    updateAttemptsUI();
    updateStatsUI();
    
    // Set up event listeners
    setupEventListeners();
}

// Set up event listeners
function setupEventListeners() {
    // Submit answer button
    const submitButton = document.getElementById('submit-answer');
    if (submitButton) {
        submitButton.addEventListener('click', submitAnswer);
    }
    
    // Answer input (Enter key)
    const answerInput = document.getElementById('answer-input');
    if (answerInput) {
        answerInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                submitAnswer();
            }
        });
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
        for (const [key, value] of Object.entries(parameters)) {
            const row = document.createElement('tr');
            
            const keyCell = document.createElement('td');
            keyCell.textContent = key;
            
            const valueCell = document.createElement('td');
            valueCell.textContent = value;
            
            row.appendChild(keyCell);
            row.appendChild(valueCell);
            
            parametersBody.appendChild(row);
        }
    }
    
    // Update answer input
    const answerInput = document.getElementById('answer-input');
    if (answerInput) {
        answerInput.value = '';
        answerInput.placeholder = `Enter your answer${gameState.currentProblem.unit ? ' in ' + gameState.currentProblem.unit : ''}`;
        answerInput.disabled = gameState.gameOver;
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
    
    gameState.attempts.forEach(attempt => {
        const attemptElement = document.createElement('div');
        attemptElement.className = `attempt attempt-${attempt.result}`;
        
        let resultText = '';
        switch (attempt.result) {
            case 'too-high':
                resultText = 'Too high';
                break;
            case 'too-low':
                resultText = 'Too low';
                break;
            case 'correct':
                resultText = 'Correct!';
                break;
        }
        
        attemptElement.textContent = `Attempt ${attempt.number}: ${attempt.value}${gameState.currentProblem.unit ? ' ' + gameState.currentProblem.unit : ''} - ${resultText}`;
        attemptsList.appendChild(attemptElement);
    });
    
    // Add remaining attempts info
    const remainingAttempts = gameState.maxAttempts - gameState.attempts.length;
    if (remainingAttempts > 0 && !gameState.gameOver) {
        const remainingElement = document.createElement('p');
        remainingElement.className = 'mt-2';
        remainingElement.textContent = `You have ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`;
        attemptsList.appendChild(remainingElement);
    }
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
    
    const answerInput = document.getElementById('answer-input');
    if (!answerInput) return;
    
    const userAnswer = parseFloat(answerInput.value);
    
    // Validate input
    if (isNaN(userAnswer)) {
        alert('Please enter a valid number');
        return;
    }
    
    // Get the correct answer
    const correctAnswer = gameState.currentProblem.answer;
    
    // Check if the answer is correct (within tolerance)
    const tolerance = gameState.currentProblem.tolerance || 0;
    const isCorrect = Math.abs(userAnswer - correctAnswer) <= tolerance;
    
    // Determine result
    let result;
    if (isCorrect) {
        result = 'correct';
    } else if (userAnswer > correctAnswer) {
        result = 'too-high';
    } else {
        result = 'too-low';
    }
    
    // Add attempt to game state
    gameState.attempts.push({
        number: gameState.attempts.length + 1,
        value: userAnswer,
        result: result
    });
    
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
    
    // Update UI
    updateAttemptsUI();
    updateStatsUI();
    updateProblemUI();
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
        // Use corrected solution if available
        const solution = gameState.currentProblem.correctedSolution || gameState.currentProblem.solution;
        solutionSteps.textContent = solution;
        
        explanationText.textContent = gameState.currentProblem.explanation;
        solutionContainer.style.display = 'block';
    }
}

// Load a new problem
function loadNewProblem() {
    // Get a random problem
    gameState.currentProblem = getRandomMathProblem();
    
    // Reset game state
    gameState.attempts = [];
    gameState.gameOver = false;
    
    // Update UI
    updateProblemUI();
    updateAttemptsUI();
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
document.addEventListener('DOMContentLoaded', initGame);
