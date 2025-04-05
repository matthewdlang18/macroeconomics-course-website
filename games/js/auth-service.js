// Authentication Service for Economics Games
// This service handles user authentication for all games

// Ensure EconGames namespace exists
const EconGames = window.EconGames || {};

// Authentication Service
EconGames.AuthService = {
    // Initialize
    init: function() {
        this.db = firebase.firestore();
        this.usersCollection = this.db.collection('users');
        this.sessionsCollection = this.db.collection('sessions');
        
        // Check for existing session
        this.checkSession();
        
        console.log('Auth Service initialized');
    },
    
    // Check if session exists and is valid
    checkSession: function() {
        const sessionData = localStorage.getItem('econGamesSession');
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                const now = new Date().getTime();
                
                // Check if session is expired (24 hours)
                if (session.expiresAt && session.expiresAt > now) {
                    console.log('Valid session found');
                    this.currentSession = session;
                } else {
                    console.log('Session expired');
                    this.clearSession();
                }
            } catch (error) {
                console.error('Error parsing session:', error);
                this.clearSession();
            }
        }
    },
    
    // Save session to localStorage
    saveSession: function(userData, role = 'student') {
        // Create session with 24-hour expiration
        const expiresAt = new Date().getTime() + (24 * 60 * 60 * 1000);
        
        const session = {
            userId: userData.id,
            name: userData.name,
            role: role,
            expiresAt: expiresAt
        };
        
        // Add additional fields based on role
        if (role === 'student') {
            session.studentId = userData.studentId;
        }
        
        // Save to localStorage
        localStorage.setItem('econGamesSession', JSON.stringify(session));
        this.currentSession = session;
        
        return session;
    },
    
    // Clear session
    clearSession: function() {
        localStorage.removeItem('econGamesSession');
        this.currentSession = null;
    },
    
    // Check if user is logged in
    isLoggedIn: function() {
        return !!this.currentSession;
    },
    
    // Get current session
    getSession: function() {
        return this.currentSession;
    },
    
    // Register a new student
    registerStudent: async function(name, studentId, passcode = null) {
        try {
            // Check if student already exists
            const snapshot = await this.usersCollection
                .where('studentId', '==', studentId)
                .where('role', '==', 'student')
                .get();
            
            if (!snapshot.empty) {
                return { success: false, error: 'Student ID already registered' };
            }
            
            // Create new user document
            const userRef = this.usersCollection.doc();
            const userData = {
                id: userRef.id,
                name: name,
                studentId: studentId,
                role: 'student',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await userRef.set(userData);
            
            // If passcode provided, join session
            let sessionData = null;
            if (passcode) {
                const joinResult = await this.joinSession(userRef.id, passcode);
                if (joinResult.success) {
                    sessionData = joinResult.data;
                }
            }
            
            // Create session
            const session = this.saveSession(userData, 'student');
            
            return { 
                success: true, 
                data: { 
                    user: userData, 
                    session: session,
                    gameSession: sessionData
                } 
            };
        } catch (error) {
            console.error('Error registering student:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Login student
    loginStudent: async function(studentId, passcode = null) {
        try {
            // Find student
            const snapshot = await this.usersCollection
                .where('studentId', '==', studentId)
                .where('role', '==', 'student')
                .get();
            
            if (snapshot.empty) {
                return { success: false, error: 'Student not found' };
            }
            
            const userData = {
                id: snapshot.docs[0].id,
                ...snapshot.docs[0].data()
            };
            
            // If passcode provided, join session
            let sessionData = null;
            if (passcode) {
                const joinResult = await this.joinSession(userData.id, passcode);
                if (joinResult.success) {
                    sessionData = joinResult.data;
                }
            }
            
            // Create session
            const session = this.saveSession(userData, 'student');
            
            return { 
                success: true, 
                data: { 
                    user: userData, 
                    session: session,
                    gameSession: sessionData
                } 
            };
        } catch (error) {
            console.error('Error logging in student:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Login TA
    loginTA: async function(username, passcode) {
        try {
            // Find TA
            const snapshot = await this.usersCollection
                .where('username', '==', username)
                .where('role', '==', 'ta')
                .get();
            
            if (snapshot.empty) {
                return { success: false, error: 'TA not found' };
            }
            
            const userData = {
                id: snapshot.docs[0].id,
                ...snapshot.docs[0].data()
            };
            
            // Verify passcode
            if (userData.passcode !== passcode) {
                return { success: false, error: 'Invalid passcode' };
            }
            
            // Create session
            const session = this.saveSession(userData, 'ta');
            
            return { 
                success: true, 
                data: { 
                    user: userData, 
                    session: session
                } 
            };
        } catch (error) {
            console.error('Error logging in TA:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Logout
    logout: function() {
        this.clearSession();
        return { success: true };
    },
    
    // Create a game session (TA only)
    createSession: async function(gameId, sessionName) {
        try {
            // Check if user is logged in as TA
            if (!this.isLoggedIn() || this.currentSession.role !== 'ta') {
                return { success: false, error: 'Only TAs can create sessions' };
            }
            
            // Generate join code
            const joinCode = EconGames.FirebaseCore.generateJoinCode();
            
            // Create session document
            const sessionRef = this.sessionsCollection.doc();
            const sessionData = {
                id: sessionRef.id,
                gameId: gameId,
                name: sessionName,
                joinCode: joinCode,
                createdBy: this.currentSession.userId,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                active: true,
                participants: []
            };
            
            await sessionRef.set(sessionData);
            
            return { success: true, data: sessionData };
        } catch (error) {
            console.error('Error creating session:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Join a game session
    joinSession: async function(userId, joinCode) {
        try {
            // Find session
            const snapshot = await this.sessionsCollection
                .where('joinCode', '==', joinCode)
                .where('active', '==', true)
                .get();
            
            if (snapshot.empty) {
                return { success: false, error: 'Session not found or inactive' };
            }
            
            const sessionData = {
                id: snapshot.docs[0].id,
                ...snapshot.docs[0].data()
            };
            
            // Add user to participants if not already there
            if (!sessionData.participants.includes(userId)) {
                await this.sessionsCollection.doc(sessionData.id).update({
                    participants: firebase.firestore.FieldValue.arrayUnion(userId)
                });
            }
            
            return { success: true, data: sessionData };
        } catch (error) {
            console.error('Error joining session:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Get active sessions for a game
    getActiveSessions: async function(gameId) {
        try {
            const snapshot = await this.sessionsCollection
                .where('gameId', '==', gameId)
                .where('active', '==', true)
                .get();
            
            const sessions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            return { success: true, data: sessions };
        } catch (error) {
            console.error('Error getting active sessions:', error);
            return { success: false, error: error.message };
        }
    },
    
    // End a session (TA only)
    endSession: async function(sessionId) {
        try {
            // Check if user is logged in as TA
            if (!this.isLoggedIn() || this.currentSession.role !== 'ta') {
                return { success: false, error: 'Only TAs can end sessions' };
            }
            
            await this.sessionsCollection.doc(sessionId).update({
                active: false,
                endedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return { success: true };
        } catch (error) {
            console.error('Error ending session:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Show login modal
    showLoginModal: function() {
        // Create modal if it doesn't exist
        if (!document.getElementById('login-modal')) {
            this.createLoginModal();
        }
        
        // Show modal
        $('#login-modal').modal('show');
    },
    
    // Show registration modal
    showRegistrationModal: function() {
        // Create modal if it doesn't exist
        if (!document.getElementById('registration-modal')) {
            this.createRegistrationModal();
        }
        
        // Show modal
        $('#registration-modal').modal('show');
    },
    
    // Create login modal
    createLoginModal: function() {
        const modalHtml = `
        <div class="modal fade" id="login-modal" tabindex="-1" role="dialog" aria-labelledby="login-modal-label" aria-hidden="true">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="login-modal-label">Student Login</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="login-form">
                            <div class="form-group">
                                <label for="login-student-id">Student ID</label>
                                <input type="text" class="form-control" id="login-student-id" required>
                            </div>
                            <div class="form-group">
                                <label for="login-passcode">Class Passcode (Optional)</label>
                                <input type="text" class="form-control" id="login-passcode" placeholder="Enter passcode to join a class">
                            </div>
                            <div id="login-error" class="alert alert-danger mt-3" style="display: none;"></div>
                            <div class="text-center mt-3">
                                <button type="submit" class="btn btn-primary">Login</button>
                            </div>
                        </form>
                        <div class="text-center mt-3">
                            <p>Don't have an account? <a href="#" id="show-registration">Register</a></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Add event listeners
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const studentId = document.getElementById('login-student-id').value;
            const passcode = document.getElementById('login-passcode').value;
            
            const result = await this.loginStudent(studentId, passcode || null);
            
            if (result.success) {
                $('#login-modal').modal('hide');
                window.location.reload();
            } else {
                document.getElementById('login-error').textContent = result.error;
                document.getElementById('login-error').style.display = 'block';
            }
        });
        
        document.getElementById('show-registration').addEventListener('click', (e) => {
            e.preventDefault();
            $('#login-modal').modal('hide');
            this.showRegistrationModal();
        });
    },
    
    // Create registration modal
    createRegistrationModal: function() {
        const modalHtml = `
        <div class="modal fade" id="registration-modal" tabindex="-1" role="dialog" aria-labelledby="registration-modal-label" aria-hidden="true">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="registration-modal-label">Student Registration</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="registration-form">
                            <div class="form-group">
                                <label for="registration-name">Full Name</label>
                                <input type="text" class="form-control" id="registration-name" required>
                            </div>
                            <div class="form-group">
                                <label for="registration-student-id">Student ID</label>
                                <input type="text" class="form-control" id="registration-student-id" required>
                            </div>
                            <div class="form-group">
                                <label for="registration-passcode">Class Passcode (Optional)</label>
                                <input type="text" class="form-control" id="registration-passcode" placeholder="Enter passcode to join a class">
                            </div>
                            <div id="registration-error" class="alert alert-danger mt-3" style="display: none;"></div>
                            <div class="text-center mt-3">
                                <button type="submit" class="btn btn-primary">Register</button>
                            </div>
                        </form>
                        <div class="text-center mt-3">
                            <p>Already have an account? <a href="#" id="show-login">Login</a></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Add event listeners
        document.getElementById('registration-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('registration-name').value;
            const studentId = document.getElementById('registration-student-id').value;
            const passcode = document.getElementById('registration-passcode').value;
            
            const result = await this.registerStudent(name, studentId, passcode || null);
            
            if (result.success) {
                $('#registration-modal').modal('hide');
                window.location.reload();
            } else {
                document.getElementById('registration-error').textContent = result.error;
                document.getElementById('registration-error').style.display = 'block';
            }
        });
        
        document.getElementById('show-login').addEventListener('click', (e) => {
            e.preventDefault();
            $('#registration-modal').modal('hide');
            this.showLoginModal();
        });
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize auth service
    EconGames.AuthService.init();
});
