// Student Authentication System
// This file provides UI components and logic for student registration and login

// Create and inject the registration modal into the page
function createAuthModals() {
    // Create modal container if it doesn't exist
    if (!document.getElementById('auth-modals')) {
        const modalHTML = `
        <div id="auth-modals">
            <!-- Registration Modal -->
            <div id="registration-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 hidden">
                <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                    <div class="border-b px-6 py-4">
                        <h3 class="text-lg font-medium">New Student Registration</h3>
                    </div>
                    <div class="px-6 py-4">
                        <form id="registration-form" class="space-y-4">
                            <div>
                                <label for="reg-name" class="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                                <input type="text" id="reg-name" class="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Enter your full name" required>
                            </div>
                            <div>
                                <label for="reg-passcode" class="block text-sm font-medium text-gray-700 mb-1">Create a 4-digit Passcode</label>
                                <input type="text" id="reg-passcode" pattern="[0-9]{4}" maxlength="4" class="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Enter 4 digits (e.g., 1234)" required>
                                <small class="text-gray-500 block mt-1">
                                    <i class="fas fa-info-circle"></i> This passcode is for educational purposes only. 
                                    Do not use a code you use for important accounts.
                                </small>
                            </div>
                            <div>
                                <label for="reg-class-code" class="block text-sm font-medium text-gray-700 mb-1">Class Code (Optional)</label>
                                <input type="text" id="reg-class-code" class="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Enter class code if you have one">
                                <small class="text-gray-500 block mt-1">Ask your instructor for your class code.</small>
                            </div>
                            <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
                                <div class="flex">
                                    <div class="flex-shrink-0">
                                        <i class="fas fa-exclamation-triangle text-yellow-400"></i>
                                    </div>
                                    <div class="ml-3">
                                        <p class="text-sm text-yellow-700">
                                            This is a simple educational system. Your passcode is stored in a basic database and is not highly secure.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div id="reg-error" class="text-red-600 text-sm hidden"></div>
                            <div id="reg-success" class="text-green-600 text-sm hidden"></div>
                        </form>
                    </div>
                    <div class="bg-gray-50 px-6 py-4 flex justify-end space-x-3 rounded-b-lg">
                        <button id="reg-cancel-btn" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100">Cancel</button>
                        <button id="reg-submit-btn" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Register</button>
                    </div>
                </div>
            </div>
            
            <!-- Login Modal -->
            <div id="login-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 hidden">
                <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                    <div class="border-b px-6 py-4">
                        <h3 class="text-lg font-medium">Student Login</h3>
                    </div>
                    <div class="px-6 py-4">
                        <form id="login-form" class="space-y-4">
                            <div>
                                <label for="login-name" class="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                                <input type="text" id="login-name" class="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Enter your name" required>
                            </div>
                            <div>
                                <label for="login-passcode" class="block text-sm font-medium text-gray-700 mb-1">4-Digit Passcode</label>
                                <input type="text" id="login-passcode" pattern="[0-9]{4}" maxlength="4" class="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Enter your passcode" required>
                            </div>
                            <div>
                                <label for="login-class-code" class="block text-sm font-medium text-gray-700 mb-1">Class Code (Optional)</label>
                                <input type="text" id="login-class-code" class="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Enter class code if you have one">
                            </div>
                            <div id="login-error" class="text-red-600 text-sm hidden"></div>
                        </form>
                    </div>
                    <div class="bg-gray-50 px-6 py-4 flex justify-end space-x-3 rounded-b-lg">
                        <button id="login-cancel-btn" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100">Cancel</button>
                        <button id="login-submit-btn" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Login</button>
                    </div>
                </div>
            </div>
        </div>
        `;
        
        // Append to body
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer.firstElementChild);
        
        // Set up event listeners
        setupAuthModalListeners();
    }
}

// Set up event listeners for the auth modals
function setupAuthModalListeners() {
    // Registration modal
    const regModal = document.getElementById('registration-modal');
    const regForm = document.getElementById('registration-form');
    const regCancelBtn = document.getElementById('reg-cancel-btn');
    const regSubmitBtn = document.getElementById('reg-submit-btn');
    
    regCancelBtn.addEventListener('click', () => {
        regModal.classList.add('hidden');
    });
    
    regSubmitBtn.addEventListener('click', async () => {
        const nameInput = document.getElementById('reg-name');
        const passcodeInput = document.getElementById('reg-passcode');
        const classCodeInput = document.getElementById('reg-class-code');
        const errorDiv = document.getElementById('reg-error');
        const successDiv = document.getElementById('reg-success');
        
        // Reset messages
        errorDiv.classList.add('hidden');
        successDiv.classList.add('hidden');
        
        // Validate inputs
        const name = nameInput.value.trim();
        const passcode = passcodeInput.value.trim();
        const classCode = classCodeInput.value.trim();
        
        if (!name) {
            errorDiv.textContent = 'Please enter your name';
            errorDiv.classList.remove('hidden');
            return;
        }
        
        if (!/^\d{4}$/.test(passcode)) {
            errorDiv.textContent = 'Passcode must be exactly 4 digits';
            errorDiv.classList.remove('hidden');
            return;
        }
        
        try {
            // Register student
            const result = await StudentService.registerStudent(name, passcode);
            
            if (!result.success) {
                errorDiv.textContent = result.error || 'Registration failed';
                errorDiv.classList.remove('hidden');
                return;
            }
            
            // Save session
            SessionManager.saveSession(result.data);
            
            // Enroll in class if class code provided
            if (classCode) {
                const enrollResult = await StudentService.enrollInClass(result.data.studentId, classCode);
                if (!enrollResult.success) {
                    // Show warning but continue
                    errorDiv.textContent = 'Note: ' + (enrollResult.error || 'Class enrollment failed');
                    errorDiv.classList.remove('hidden');
                } else {
                    // Update session with class
                    SessionManager.saveSession(result.data, enrollResult.data.classId);
                }
            }
            
            // Show success message
            successDiv.textContent = result.message || 'Registration successful!';
            successDiv.classList.remove('hidden');
            
            // Close modal after a delay
            setTimeout(() => {
                regModal.classList.add('hidden');
                
                // Trigger success callback if defined
                if (window.onAuthSuccess) {
                    window.onAuthSuccess(result.data);
                }
                
                // Reload page to reflect logged in state
                window.location.reload();
            }, 1500);
        } catch (error) {
            console.error('Registration error:', error);
            errorDiv.textContent = error.message || 'An unexpected error occurred';
            errorDiv.classList.remove('hidden');
        }
    });
    
    // Login modal
    const loginModal = document.getElementById('login-modal');
    const loginForm = document.getElementById('login-form');
    const loginCancelBtn = document.getElementById('login-cancel-btn');
    const loginSubmitBtn = document.getElementById('login-submit-btn');
    
    loginCancelBtn.addEventListener('click', () => {
        loginModal.classList.add('hidden');
    });
    
    loginSubmitBtn.addEventListener('click', async () => {
        const nameInput = document.getElementById('login-name');
        const passcodeInput = document.getElementById('login-passcode');
        const classCodeInput = document.getElementById('login-class-code');
        const errorDiv = document.getElementById('login-error');
        
        // Reset messages
        errorDiv.classList.add('hidden');
        
        // Validate inputs
        const name = nameInput.value.trim();
        const passcode = passcodeInput.value.trim();
        const classCode = classCodeInput.value.trim();
        
        if (!name || !passcode) {
            errorDiv.textContent = 'Please enter both name and passcode';
            errorDiv.classList.remove('hidden');
            return;
        }
        
        try {
            // Login student
            const result = await StudentService.loginStudent(name, passcode);
            
            if (!result.success) {
                errorDiv.textContent = result.error || 'Login failed';
                errorDiv.classList.remove('hidden');
                return;
            }
            
            // Save session
            SessionManager.saveSession(result.data);
            
            // Enroll in class if class code provided
            if (classCode) {
                const enrollResult = await StudentService.enrollInClass(result.data.studentId, classCode);
                if (!enrollResult.success) {
                    // Show warning but continue
                    errorDiv.textContent = 'Note: ' + (enrollResult.error || 'Class enrollment failed');
                    errorDiv.classList.remove('hidden');
                    
                    // Delay closing to show the message
                    setTimeout(() => {
                        loginModal.classList.add('hidden');
                        
                        // Trigger success callback if defined
                        if (window.onAuthSuccess) {
                            window.onAuthSuccess(result.data);
                        }
                        
                        // Reload page to reflect logged in state
                        window.location.reload();
                    }, 1500);
                    
                    return;
                } else {
                    // Update session with class
                    SessionManager.saveSession(result.data, enrollResult.data.classId);
                }
            }
            
            // Close modal
            loginModal.classList.add('hidden');
            
            // Trigger success callback if defined
            if (window.onAuthSuccess) {
                window.onAuthSuccess(result.data);
            }
            
            // Reload page to reflect logged in state
            window.location.reload();
        } catch (error) {
            console.error('Login error:', error);
            errorDiv.textContent = error.message || 'An unexpected error occurred';
            errorDiv.classList.remove('hidden');
        }
    });
}

// Show registration modal
function showRegistrationModal() {
    createAuthModals();
    document.getElementById('registration-modal').classList.remove('hidden');
}

// Show login modal
function showLoginModal() {
    createAuthModals();
    document.getElementById('login-modal').classList.remove('hidden');
}

// Check if user is logged in
function isLoggedIn() {
    return SessionManager.isSessionValid();
}

// Get current user
function getCurrentUser() {
    return SessionManager.getSession();
}

// Logout user
function logout() {
    SessionManager.clearSession();
    window.location.reload();
}

// Export functions
window.StudentAuth = {
    showRegistrationModal,
    showLoginModal,
    isLoggedIn,
    getCurrentUser,
    logout
};
