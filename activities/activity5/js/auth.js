// Authentication service for Activity 5 - AI Exam Generator
class AuthService {
    constructor() {
        this.currentUser = null;
        this.currentSection = null;
        this.initialized = false;
        this.debugMode = true; // Enable debug logging
        
        // Check for URL parameters immediately in constructor
        this.checkForForceLogout();
    }

    checkForForceLogout() {
        const urlParams = new URLSearchParams(window.location.search);
        const forceLogout = urlParams.get('logout') === 'true' || urlParams.get('reset') === 'true';
        
        if (forceLogout) {
            this.log('Force logout/reset requested via URL parameter');
            this.clearSavedCredentials();
            // Clean up URL
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
            return true;
        }
        return false;
    }

    log(message, data = null) {
        if (this.debugMode) {
            console.log(`[AuthService] ${message}`, data || '');
        }
    }

    async initialize() {
        this.log('Initializing auth service...');
        
        if (this.initialized) {
            this.log('Already initialized, skipping');
            return;
        }
        
        try {
            // Check if user is already logged in (after potential URL parameter clearing)
            const savedUser = localStorage.getItem('activity5_user');
            const savedSection = localStorage.getItem('activity5_section');
            
            this.log('Checking saved credentials', { 
                hasUser: !!savedUser, 
                hasSection: !!savedSection 
            });
            
            if (savedUser && savedSection) {
                this.log('Found saved credentials, attempting auto-login');
                try {
                    this.currentUser = JSON.parse(savedUser);
                    this.currentSection = JSON.parse(savedSection);
                    this.log('Parsed saved credentials', { 
                        user: this.currentUser, 
                        section: this.currentSection 
                    });
                    
                    // Wait a moment to ensure DOM is ready, then show activity content
                    setTimeout(() => {
                        this.showActivityContent();
                    }, 100);
                } catch (parseError) {
                    this.log('Error parsing saved credentials, clearing them', parseError);
                    this.clearSavedCredentials();
                    this.showAuthForm();
                }
            } else {
                this.log('No saved credentials found, showing auth form');
                this.showAuthForm();
            }
            
            this.initialized = true;
            this.log('Auth service initialization complete');
        } catch (error) {
            console.error('Auth initialization error:', error);
            this.showAuthForm();
        }
    }

    clearSavedCredentials() {
        this.log('Clearing saved credentials');
        localStorage.removeItem('activity5_user');
        localStorage.removeItem('activity5_section');
        // Also clear any progress data
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes('activity5')) {
                keys.push(key);
            }
        }
        keys.forEach(key => localStorage.removeItem(key));
        this.log(`Cleared ${keys.length} activity5 items from localStorage`);
    }

    async login(studentName, passcode, selectedSection) {
        this.log('Attempting login', { studentName, selectedSection });
        
        try {
            // Validate student credentials
            const isValidStudent = await this.validateStudent(studentName, passcode, selectedSection);
            
            if (isValidStudent) {
                this.log('Validation successful, setting up user session');
                
                this.currentUser = {
                    studentName: studentName,
                    timestamp: new Date().toISOString()
                };
                this.currentSection = selectedSection;
                
                // Save to localStorage
                localStorage.setItem('activity5_user', JSON.stringify(this.currentUser));
                localStorage.setItem('activity5_section', JSON.stringify(this.currentSection));
                
                this.log('User session saved to localStorage');
                
                // Log the login attempt
                await this.logStudentAccess();
                
                this.showActivityContent();
                return true;
            } else {
                throw new Error('Invalid credentials or section');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Invalid student name, passcode, or section. Please try again.');
            return false;
        }
    }

    async validateStudent(studentName, passcode, selectedSection) {
        this.log('Validating student credentials');
        
        try {
            // Check if we're using mock Supabase
            if (window.usingMockSupabase) {
                this.log('Using mock validation for testing');
                return true;
            }

            // Query the profiles table to validate credentials
            const { data: student, error: studentError } = await supabase
                .from('profiles')
                .select('*')
                .eq('name', studentName)
                .eq('passcode', passcode)
                .eq('role', 'student')
                .single();

            if (studentError || !student) {
                this.log('Student validation failed', studentError);
                return false;
            }

            this.log('Student found in database', { name: student.name, role: student.role });

            // For now, accept any section since we don't have strict section validation
            if (!selectedSection) {
                this.log('Section is required');
                return false;
            }

            this.log('Validation successful');
            return true;
        } catch (error) {
            console.error('Validation error:', error);
            return false;
        }
    }

    async logStudentAccess() {
        try {
            // Skip logging if using mock Supabase
            if (window.usingMockSupabase) {
                this.log('Skipping access log in mock mode');
                return;
            }

            this.log('Logging student access');

            // Log the student access for analytics
            const { error } = await supabase
                .from('activity5_access_log')
                .insert([{
                    student_id: this.currentUser.studentName,
                    section: this.currentSection,
                    access_time: new Date().toISOString(),
                    activity_type: 'login'
                }]);

            if (error) {
                console.error('Access log error:', error);
                // Don't throw error - logging failure shouldn't prevent login
            } else {
                this.log('Access logged successfully');
            }
        } catch (error) {
            console.error('Log access error:', error);
            // Don't throw error - logging failure shouldn't prevent login
        }
    }

    async loadSections() {
        this.log('Loading sections from database');
        
        try {
            const sectionSelect = document.getElementById('sectionSelect');
            if (!sectionSelect) {
                console.error('Section select element not found');
                return;
            }

            // Clear existing options
            sectionSelect.innerHTML = '<option value="">Select your section...</option>';

            // Check if we're using mock Supabase
            if (window.usingMockSupabase) {
                this.log('Loading mock sections for testing');
                const mockSections = [
                    { id: '1', display_name: 'Monday 10:00-11:30 - Room 101' },
                    { id: '2', display_name: 'Tuesday 13:00-14:30 - Room 102' },
                    { id: '3', display_name: 'Wednesday 15:00-16:30 - Room 103' },
                    { id: '4', display_name: 'Thursday 10:00-11:30 - Room 104' },
                    { id: '5', display_name: 'Friday 13:00-14:30 - Room 105' }
                ];
                
                mockSections.forEach(section => {
                    const option = document.createElement('option');
                    option.value = section.id;
                    option.textContent = section.display_name;
                    sectionSelect.appendChild(option);
                });
                this.log('Mock sections loaded');
                return;
            }

            // Load real sections from database
            const { data: sections, error } = await supabase
                .from('sections')
                .select(`
                    id,
                    day,
                    time,
                    location,
                    profiles!fk_ta (
                        name
                    )
                `)
                .order('day')
                .order('time');

            if (error) {
                console.error('Error loading sections:', error);
                this.showError('Failed to load sections. Please refresh the page.');
                return;
            }

            if (!sections || sections.length === 0) {
                console.warn('No sections found in database');
                this.showError('No sections available. Please contact your instructor.');
                return;
            }

            // Populate section dropdown
            sections.forEach(section => {
                const option = document.createElement('option');
                option.value = section.id;
                
                // Create display name: "Day Time - Location (TA: Name)"
                let displayName = `${section.day} ${section.time}`;
                if (section.location) {
                    displayName += ` - ${section.location}`;
                }
                if (section.profiles && section.profiles.name) {
                    displayName += ` (TA: ${section.profiles.name})`;
                }
                
                option.textContent = displayName;
                sectionSelect.appendChild(option);
            });

            this.log(`Loaded ${sections.length} sections successfully`);
        } catch (error) {
            console.error('Error loading sections:', error);
            this.showError('Failed to load sections. Please refresh the page.');
        }
    }

    showAuthForm() {
        this.log('Showing auth form');
        
        const authContainer = document.getElementById('authContainer');
        const activityContent = document.getElementById('activityContent');
        
        if (!authContainer) {
            console.error('authContainer element not found');
            return;
        }
        if (!activityContent) {
            console.error('activityContent element not found');
            return;
        }
        
        // Make sure we show the auth form and hide activity content
        authContainer.style.display = 'block';
        activityContent.style.display = 'none';
        
        this.log('Auth form displayed, loading sections...');
        this.loadSections();
    }

    showActivityContent() {
        this.log('Showing activity content');
        
        const authContainer = document.getElementById('authContainer');
        const activityContent = document.getElementById('activityContent');
        
        if (!authContainer) {
            console.error('authContainer element not found');
            return;
        }
        if (!activityContent) {
            console.error('activityContent element not found');
            return;
        }
        
        // Hide auth form and show activity content
        authContainer.style.display = 'none';
        activityContent.style.display = 'block';
        
        // Update welcome message
        const welcomeElement = document.getElementById('welcomeMessage');
        if (welcomeElement && this.currentUser) {
            welcomeElement.textContent = `Welcome, ${this.currentUser.studentName}! Section: ${this.currentSection}`;
        }
        
        this.log('Activity content displayed');
        
        // Initialize activity content
        if (window.activity && typeof window.activity.initialize === 'function') {
            this.log('Initializing activity');
            window.activity.initialize();
        } else {
            this.log('Activity not ready yet, will initialize when available');
        }
    }

    showError(message) {
        this.log('Showing error message', message);
        
        const errorElement = document.getElementById('authError');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            
            // Hide error after 5 seconds
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 5000);
        }
    }

    logout() {
        this.log('Logging out user');
        
        // Clear stored data
        this.clearSavedCredentials();
        
        // Reset state
        this.currentUser = null;
        this.currentSection = null;
        
        // Show auth form
        this.showAuthForm();
        
        // Clear any activity data
        if (window.activity && typeof window.activity.reset === 'function') {
            window.activity.reset();
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getCurrentSection() {
        return this.currentSection;
    }

    isAuthenticated() {
        return this.currentUser !== null && this.currentSection !== null;
    }
}

// Initialize auth service when everything is ready
async function initializeAuth() {
    console.log('Starting auth initialization process...');
    
    // Check if already initialized
    if (window.authService) {
        console.log('Auth service already exists');
        return true;
    }
    
    // Check if required DOM elements exist
    const authContainer = document.getElementById('authContainer');
    const activityContent = document.getElementById('activityContent');
    
    if (!authContainer) {
        console.error('authContainer element not found in DOM');
        return false;
    }
    if (!activityContent) {
        console.error('activityContent element not found in DOM');
        return false;
    }
    
    console.log('Required DOM elements found');
    
    // Wait for Supabase to be available with retries
    let supabaseReady = false;
    let retries = 0;
    const maxRetries = 20;
    
    while (!supabaseReady && retries < maxRetries) {
        if (typeof supabase !== 'undefined' && window.supabase) {
            supabaseReady = true;
            console.log('Supabase is available');
        } else {
            console.log(`Waiting for Supabase... (attempt ${retries + 1})`);
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
        }
    }
    
    if (!supabaseReady) {
        console.error('Supabase not available after maximum retries');
        // Show error message to user
        const authError = document.getElementById('authError');
        if (authError) {
            authError.textContent = 'Database connection failed. Please refresh the page or contact support.';
            authError.style.display = 'block';
        }
        return false;
    }

    try {
        console.log('Creating auth service instance...');
        window.authService = new AuthService();
        
        console.log('Setting up event listeners...');
        setupEventListeners();
        
        console.log('Initializing auth service...');
        await window.authService.initialize();
        
        console.log('Auth service fully initialized');
        return true;
    } catch (error) {
        console.error('Failed to initialize auth service:', error);
        return false;
    }
}

function setupEventListeners() {
    // Set up login form handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const studentId = document.getElementById('studentId').value.trim();
            const passcode = document.getElementById('passcode').value.trim();
            const section = document.getElementById('sectionSelect').value;
            
            if (!studentId || !passcode || !section) {
                window.authService.showError('Please fill in all fields');
                return;
            }
            
            const loginButton = document.getElementById('loginButton');
            const originalText = loginButton.textContent;
            loginButton.textContent = 'Logging in...';
            loginButton.disabled = true;
            
            const success = await window.authService.login(studentId, passcode, section);
            
            loginButton.textContent = originalText;
            loginButton.disabled = false;
            
            if (!success) {
                document.getElementById('passcode').value = '';
            }
        });
    }

    // Set up logout button handler
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            window.authService.logout();
        });
    }
}

// Try multiple initialization strategies
if (document.readyState === 'loading') {
    // Document is still loading
    document.addEventListener('DOMContentLoaded', initializeAuth);
} else {
    // Document is already loaded
    setTimeout(initializeAuth, 100); // Small delay to ensure everything is ready
}

// Also try after window load as fallback
window.addEventListener('load', () => {
    if (!window.authService) {
        console.log('Fallback: initializing auth service after window load');
        setTimeout(initializeAuth, 200);
    }
});
