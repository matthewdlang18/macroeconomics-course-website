// Authentication Service for Economics Games
// This file provides user authentication and session management

// Ensure EconGames namespace exists
window.EconGames = window.EconGames || {};

// Authentication Service
EconGames.Auth = {
  // Current user session
  session: null,
  
  // Initialize authentication
  init: function() {
    // Check for existing session
    this.loadSession();
    
    console.log('Auth service initialized');
  },
  
  // Load session from localStorage
  loadSession: function() {
    const sessionData = localStorage.getItem('econGamesSession');
    
    if (sessionData) {
      try {
        this.session = JSON.parse(sessionData);
        console.log('Session loaded:', this.session);
      } catch (error) {
        console.error('Error parsing session data:', error);
        this.session = null;
      }
    }
  },
  
  // Save session to localStorage
  saveSession: function(session) {
    this.session = session;
    localStorage.setItem('econGamesSession', JSON.stringify(session));
  },
  
  // Clear session
  clearSession: function() {
    this.session = null;
    localStorage.removeItem('econGamesSession');
  },
  
  // Check if user is logged in
  isLoggedIn: function() {
    return this.session !== null;
  },
  
  // Check if user is a TA
  isTA: function() {
    return this.isLoggedIn() && this.session.role === 'ta';
  },
  
  // Get current session
  getSession: function() {
    return this.session;
  },
  
  // Register a new student
  registerStudent: async function(name, email = null) {
    try {
      // Generate a unique ID
      const userId = 'student_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
      
      // Create user document
      await EconGames.Firebase.db.collection('users').doc(userId).set({
        id: userId,
        name: name,
        email: email,
        role: 'student',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Create session
      const session = {
        userId: userId,
        name: name,
        email: email,
        role: 'student'
      };
      
      // Save session
      this.saveSession(session);
      
      return { success: true, data: session };
    } catch (error) {
      console.error('Error registering student:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Login as student
  loginStudent: async function(email) {
    try {
      // Find user by email
      const snapshot = await EconGames.Firebase.db.collection('users')
        .where('email', '==', email)
        .where('role', '==', 'student')
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return { success: false, error: 'No student found with this email' };
      }
      
      // Get user data
      const userData = snapshot.docs[0].data();
      
      // Create session
      const session = {
        userId: userData.id,
        name: userData.name,
        email: userData.email,
        role: 'student'
      };
      
      // Save session
      this.saveSession(session);
      
      return { success: true, data: session };
    } catch (error) {
      console.error('Error logging in student:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Login as TA
  loginTA: async function(taId, passcode) {
    try {
      // Get TA document
      const taDoc = await EconGames.Firebase.db.collection('users').doc(taId).get();
      
      if (!taDoc.exists) {
        return { success: false, error: 'TA not found' };
      }
      
      const taData = taDoc.data();
      
      // Check role
      if (taData.role !== 'ta') {
        return { success: false, error: 'Invalid credentials' };
      }
      
      // Check passcode
      if (taData.passcode !== passcode) {
        return { success: false, error: 'Invalid passcode' };
      }
      
      // Create session
      const session = {
        userId: taData.id,
        name: taData.name,
        role: 'ta',
        sections: taData.sections || []
      };
      
      // Save session
      this.saveSession(session);
      
      return { success: true, data: session };
    } catch (error) {
      console.error('Error logging in TA:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Join a game session
  joinGameSession: async function(joinCode) {
    try {
      if (!this.isLoggedIn()) {
        return { success: false, error: 'You must be logged in to join a game session' };
      }
      
      // Find session by join code
      const snapshot = await EconGames.Firebase.db.collection('gameSessions')
        .where('joinCode', '==', joinCode)
        .where('active', '==', true)
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return { success: false, error: 'Game session not found or inactive' };
      }
      
      const sessionDoc = snapshot.docs[0];
      const sessionData = sessionDoc.data();
      
      // Update session with game session info
      const updatedSession = {
        ...this.session,
        gameSession: {
          id: sessionDoc.id,
          gameId: sessionData.gameId,
          sectionId: sessionData.sectionId,
          name: sessionData.name
        }
      };
      
      // Save updated session
      this.saveSession(updatedSession);
      
      // Add user to participants if not already there
      const participantSnapshot = await EconGames.Firebase.db.collection('participants')
        .where('userId', '==', this.session.userId)
        .where('sessionId', '==', sessionDoc.id)
        .limit(1)
        .get();
      
      if (participantSnapshot.empty) {
        // Create participant
        await EconGames.Firebase.db.collection('participants').add({
          userId: this.session.userId,
          sessionId: sessionDoc.id,
          name: this.session.name,
          cash: 10000, // Initial cash
          portfolio: {},
          tradeHistory: [],
          joinedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      
      return { success: true, data: sessionData };
    } catch (error) {
      console.error('Error joining game session:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Logout
  logout: function() {
    this.clearSession();
    return { success: true };
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
                    <h5 class="modal-title" id="login-modal-label">Login</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <ul class="nav nav-tabs" id="loginTabs" role="tablist">
                        <li class="nav-item" role="presentation">
                            <a class="nav-link active" id="student-tab" data-toggle="tab" href="#student-login" role="tab" aria-controls="student-login" aria-selected="true">Student</a>
                        </li>
                        <li class="nav-item" role="presentation">
                            <a class="nav-link" id="ta-tab" data-toggle="tab" href="#ta-login" role="tab" aria-controls="ta-login" aria-selected="false">TA</a>
                        </li>
                    </ul>
                    <div class="tab-content mt-3" id="loginTabsContent">
                        <div class="tab-pane fade show active" id="student-login" role="tabpanel" aria-labelledby="student-tab">
                            <form id="student-login-form">
                                <div class="form-group">
                                    <label for="student-email">Email</label>
                                    <input type="email" class="form-control" id="student-email" required>
                                </div>
                                <div id="student-login-error" class="alert alert-danger mt-3" style="display: none;"></div>
                                <div class="text-center mt-3">
                                    <button type="submit" class="btn btn-primary">Login</button>
                                </div>
                            </form>
                            <div class="text-center mt-3">
                                <p>Don't have an account? <a href="#" id="show-registration">Register</a></p>
                            </div>
                        </div>
                        <div class="tab-pane fade" id="ta-login" role="tabpanel" aria-labelledby="ta-tab">
                            <form id="ta-login-form">
                                <div class="form-group">
                                    <label for="ta-id">TA ID</label>
                                    <select class="form-control" id="ta-id" required>
                                        <option value="">Select TA</option>
                                        <option value="akshay">Akshay</option>
                                        <option value="simran">Simran</option>
                                        <option value="camilla">Camilla</option>
                                        <option value="huiyann">Hui Yann</option>
                                        <option value="lars">Lars</option>
                                        <option value="luorao">Luorao</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="ta-passcode">Passcode</label>
                                    <input type="password" class="form-control" id="ta-passcode" required>
                                </div>
                                <div id="ta-login-error" class="alert alert-danger mt-3" style="display: none;"></div>
                                <div class="text-center mt-3">
                                    <button type="submit" class="btn btn-primary">Login</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Add event listeners
    document.getElementById('student-login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('student-email').value;
      
      const result = await this.loginStudent(email);
      
      if (result.success) {
        $('#login-modal').modal('hide');
        window.location.reload();
      } else {
        document.getElementById('student-login-error').textContent = result.error;
        document.getElementById('student-login-error').style.display = 'block';
      }
    });
    
    document.getElementById('ta-login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const taId = document.getElementById('ta-id').value;
      const passcode = document.getElementById('ta-passcode').value;
      
      const result = await this.loginTA(taId, passcode);
      
      if (result.success) {
        $('#login-modal').modal('hide');
        window.location.href = 'ta-dashboard.html';
      } else {
        document.getElementById('ta-login-error').textContent = result.error;
        document.getElementById('ta-login-error').style.display = 'block';
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
                            <label for="registration-email">Email</label>
                            <input type="email" class="form-control" id="registration-email" required>
                        </div>
                        <div class="form-group">
                            <label for="registration-join-code">Join Code (Optional)</label>
                            <input type="text" class="form-control" id="registration-join-code" placeholder="Enter if joining a class session">
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
      const email = document.getElementById('registration-email').value;
      const joinCode = document.getElementById('registration-join-code').value;
      
      const result = await this.registerStudent(name, email);
      
      if (result.success) {
        if (joinCode) {
          // Join game session if join code provided
          const joinResult = await this.joinGameSession(joinCode);
          
          if (joinResult.success) {
            $('#registration-modal').modal('hide');
            window.location.href = 'investment-odyssey/game.html';
          } else {
            document.getElementById('registration-error').textContent = joinResult.error;
            document.getElementById('registration-error').style.display = 'block';
          }
        } else {
          $('#registration-modal').modal('hide');
          window.location.reload();
        }
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

// Initialize Auth service when document is ready
document.addEventListener('DOMContentLoaded', function() {
  // Initialize Auth service
  EconGames.Auth.init();
});
