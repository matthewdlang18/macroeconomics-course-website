// Simple Authentication Service for Economics Games
// This is a compatibility layer between the old authentication system and the new centralized system

// Ensure EconGames namespace exists
const EconGames = window.EconGames || {};

// Simple Authentication Service
EconGames.SimpleAuth = {
    // Initialize
    init: function() {
        // Check if the main auth service is available
        if (EconGames.AuthService) {
            console.log('Using centralized authentication system');
            this.usesCentralizedAuth = true;
        } else {
            console.log('Centralized authentication system not available, using simple auth');
            this.usesCentralizedAuth = false;
        }
        
        // Check for existing session
        this.checkSession();
    },
    
    // Check if session exists and is valid
    checkSession: function() {
        if (this.usesCentralizedAuth) {
            // Use the centralized auth service
            this.currentSession = EconGames.AuthService.getSession();
            return;
        }
        
        // Legacy session check
        const sessionData = localStorage.getItem('econGamesSimpleSession');
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                const now = new Date().getTime();
                
                // Check if session is expired (24 hours)
                if (session.expiresAt && session.expiresAt > now) {
                    console.log('Valid simple session found');
                    this.currentSession = session;
                } else {
                    console.log('Simple session expired');
                    this.clearSession();
                }
            } catch (error) {
                console.error('Error parsing simple session:', error);
                this.clearSession();
            }
        }
    },
    
    // Save session to localStorage
    saveSession: function(userData, role = 'student') {
        if (this.usesCentralizedAuth) {
            // Use the centralized auth service
            return EconGames.AuthService.saveSession(userData, role);
        }
        
        // Create session with 24-hour expiration
        const expiresAt = new Date().getTime() + (24 * 60 * 60 * 1000);
        
        const session = {
            userId: userData.id || userData.studentId,
            name: userData.name || userData.studentName,
            role: role,
            expiresAt: expiresAt
        };
        
        // Add additional fields based on role
        if (role === 'student') {
            session.studentId = userData.studentId;
        }
        
        // Save to localStorage
        localStorage.setItem('econGamesSimpleSession', JSON.stringify(session));
        this.currentSession = session;
        
        return session;
    },
    
    // Clear session
    clearSession: function() {
        if (this.usesCentralizedAuth) {
            // Use the centralized auth service
            EconGames.AuthService.clearSession();
            this.currentSession = null;
            return;
        }
        
        localStorage.removeItem('econGamesSimpleSession');
        this.currentSession = null;
    },
    
    // Check if user is logged in
    isLoggedIn: function() {
        if (this.usesCentralizedAuth) {
            // Use the centralized auth service
            return EconGames.AuthService.isLoggedIn();
        }
        
        return !!this.currentSession;
    },
    
    // Get current session
    getSession: function() {
        if (this.usesCentralizedAuth) {
            // Use the centralized auth service
            return EconGames.AuthService.getSession();
        }
        
        return this.currentSession;
    },
    
    // Check if user is a TA
    isTA: function() {
        const session = this.getSession();
        return session && session.role === 'ta';
    },
    
    // Register a new student
    registerStudent: async function(name, studentId, classNumber = null) {
        if (this.usesCentralizedAuth) {
            // Use the centralized auth service
            return EconGames.AuthService.registerStudent(name, studentId, classNumber);
        }
        
        try {
            // Create user data
            const userData = {
                id: 'simple_' + Date.now(),
                name: name,
                studentId: studentId,
                role: 'student',
                createdAt: new Date().toISOString()
            };
            
            // Save session
            const session = this.saveSession(userData, 'student');
            
            return { 
                success: true, 
                data: { 
                    user: userData, 
                    session: session
                } 
            };
        } catch (error) {
            console.error('Error registering student:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Login student
    loginStudent: async function(studentId, classNumber = null) {
        if (this.usesCentralizedAuth) {
            // Use the centralized auth service
            return EconGames.AuthService.loginStudent(studentId, classNumber);
        }
        
        try {
            // Create user data (in simple mode, we just trust the input)
            const userData = {
                id: 'simple_' + studentId,
                name: 'Student ' + studentId,
                studentId: studentId,
                role: 'student',
                createdAt: new Date().toISOString()
            };
            
            // Save session
            const session = this.saveSession(userData, 'student');
            
            return { 
                success: true, 
                data: { 
                    user: userData, 
                    session: session
                } 
            };
        } catch (error) {
            console.error('Error logging in student:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Login TA
    loginTA: async function(username, passcode) {
        if (this.usesCentralizedAuth) {
            // Use the centralized auth service
            return EconGames.AuthService.loginTA(username, passcode);
        }
        
        try {
            // In simple mode, we use a hardcoded TA
            if (username === 'testTA' && passcode === '1234') {
                const userData = {
                    id: 'testTA',
                    name: 'Test TA',
                    role: 'ta',
                    createdAt: new Date().toISOString()
                };
                
                // Save session
                const session = this.saveSession(userData, 'ta');
                
                return { 
                    success: true, 
                    data: { 
                        user: userData, 
                        session: session
                    } 
                };
            } else {
                return { success: false, error: 'Invalid username or passcode' };
            }
        } catch (error) {
            console.error('Error logging in TA:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Logout
    logout: function() {
        if (this.usesCentralizedAuth) {
            // Use the centralized auth service
            return EconGames.AuthService.logout();
        }
        
        this.clearSession();
        return { success: true };
    },
    
    // Show login modal
    showLoginModal: function() {
        if (this.usesCentralizedAuth) {
            // Use the centralized auth service
            EconGames.AuthService.showLoginModal();
            return;
        }
        
        // Create modal if it doesn't exist
        if (!document.getElementById('simple-login-modal')) {
            this.createLoginModal();
        }
        
        // Show modal
        $('#simple-login-modal').modal('show');
    },
    
    // Show registration modal
    showRegistrationModal: function() {
        if (this.usesCentralizedAuth) {
            // Use the centralized auth service
            EconGames.AuthService.showRegistrationModal();
            return;
        }
        
        // Create modal if it doesn't exist
        if (!document.getElementById('simple-registration-modal')) {
            this.createRegistrationModal();
        }
        
        // Show modal
        $('#simple-registration-modal').modal('show');
    },
    
    // Create login modal
    createLoginModal: function() {
        const modalHtml = `
        <div class="modal fade" id="simple-login-modal" tabindex="-1" role="dialog" aria-labelledby="simple-login-modal-label" aria-hidden="true">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="simple-login-modal-label">Student Login</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="simple-login-form">
                            <div class="form-group">
                                <label for="simple-login-student-id">Student ID</label>
                                <input type="text" class="form-control" id="simple-login-student-id" required>
                            </div>
                            <div class="form-group">
                                <label for="simple-login-class-number">Class Number (Optional)</label>
                                <input type="text" class="form-control" id="simple-login-class-number" placeholder="Enter class number to join a class">
                            </div>
                            <div id="simple-login-error" class="alert alert-danger mt-3" style="display: none;"></div>
                            <div class="text-center mt-3">
                                <button type="submit" class="btn btn-primary">Login</button>
                            </div>
                        </form>
                        <div class="text-center mt-3">
                            <p>Don't have an account? <a href="#" id="simple-show-registration">Register</a></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Add event listeners
        document.getElementById('simple-login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const studentId = document.getElementById('simple-login-student-id').value;
            const classNumber = document.getElementById('simple-login-class-number').value;
            
            const result = await this.loginStudent(studentId, classNumber || null);
            
            if (result.success) {
                $('#simple-login-modal').modal('hide');
                window.location.reload();
            } else {
                document.getElementById('simple-login-error').textContent = result.error;
                document.getElementById('simple-login-error').style.display = 'block';
            }
        });
        
        document.getElementById('simple-show-registration').addEventListener('click', (e) => {
            e.preventDefault();
            $('#simple-login-modal').modal('hide');
            this.showRegistrationModal();
        });
    },
    
    // Create registration modal
    createRegistrationModal: function() {
        const modalHtml = `
        <div class="modal fade" id="simple-registration-modal" tabindex="-1" role="dialog" aria-labelledby="simple-registration-modal-label" aria-hidden="true">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="simple-registration-modal-label">Student Registration</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="simple-registration-form">
                            <div class="form-group">
                                <label for="simple-registration-name">Full Name</label>
                                <input type="text" class="form-control" id="simple-registration-name" required>
                            </div>
                            <div class="form-group">
                                <label for="simple-registration-student-id">Student ID</label>
                                <input type="text" class="form-control" id="simple-registration-student-id" required>
                            </div>
                            <div class="form-group">
                                <label for="simple-registration-class-number">Class Number (Optional)</label>
                                <input type="text" class="form-control" id="simple-registration-class-number" placeholder="Enter class number to join a class">
                            </div>
                            <div id="simple-registration-error" class="alert alert-danger mt-3" style="display: none;"></div>
                            <div class="text-center mt-3">
                                <button type="submit" class="btn btn-primary">Register</button>
                            </div>
                        </form>
                        <div class="text-center mt-3">
                            <p>Already have an account? <a href="#" id="simple-show-login">Login</a></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Add event listeners
        document.getElementById('simple-registration-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('simple-registration-name').value;
            const studentId = document.getElementById('simple-registration-student-id').value;
            const classNumber = document.getElementById('simple-registration-class-number').value;
            
            const result = await this.registerStudent(name, studentId, classNumber || null);
            
            if (result.success) {
                $('#simple-registration-modal').modal('hide');
                window.location.reload();
            } else {
                document.getElementById('simple-registration-error').textContent = result.error;
                document.getElementById('simple-registration-error').style.display = 'block';
            }
        });
        
        document.getElementById('simple-show-login').addEventListener('click', (e) => {
            e.preventDefault();
            $('#simple-registration-modal').modal('hide');
            this.showLoginModal();
        });
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize simple auth service
    EconGames.SimpleAuth.init();
});
