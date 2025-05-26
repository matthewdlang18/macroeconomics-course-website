// Authentication service for Activity 5 - AI Exam Generator
class AuthService {
    constructor() {
        this.currentUser = null;
        this.currentSection = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        
        try {
            // Check if user is already logged in
            const savedUser = localStorage.getItem('activity5_user');
            const savedSection = localStorage.getItem('activity5_section');
            
            if (savedUser && savedSection) {
                this.currentUser = JSON.parse(savedUser);
                this.currentSection = JSON.parse(savedSection);
                this.showActivityContent();
            } else {
                this.showAuthForm();
            }
            
            this.initialized = true;
        } catch (error) {
            console.error('Auth initialization error:', error);
            this.showAuthForm();
        }
    }

    async login(studentName, passcode, selectedSection) {
        try {
            // Validate student credentials
            const isValidStudent = await this.validateStudent(studentName, passcode, selectedSection);
            
            if (isValidStudent) {
                this.currentUser = {
                    studentName: studentName,
                    timestamp: new Date().toISOString()
                };
                this.currentSection = selectedSection;
                
                // Save to localStorage
                localStorage.setItem('activity5_user', JSON.stringify(this.currentUser));
                localStorage.setItem('activity5_section', JSON.stringify(this.currentSection));
                
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
        try {
            // Check if we're using mock Supabase
            if (window.usingMockSupabase) {
                console.log('Using mock validation for testing');
                // For mock mode, accept any credentials for testing
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
                console.error('Student validation error:', studentError);
                return false;
            }

            // For now, accept any section since we don't have strict section validation
            // In the future, this could be enhanced to validate against a sections table
            if (!selectedSection) {
                console.error('Section is required');
                return false;
            }

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
                console.log('Skipping access log in mock mode');
                return;
            }

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
            }
        } catch (error) {
            console.error('Log access error:', error);
            // Don't throw error - logging failure shouldn't prevent login
        }
    }

    async loadSections() {
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
                console.log('Loading mock sections for testing');
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

            console.log(`Loaded ${sections.length} sections successfully`);
        } catch (error) {
            console.error('Error loading sections:', error);
            this.showError('Failed to load sections. Please refresh the page.');
        }
    }

    showAuthForm() {
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
        
        authContainer.style.display = 'block';
        activityContent.style.display = 'none';
        this.loadSections();
    }

    showActivityContent() {
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
        
        authContainer.style.display = 'none';
        activityContent.style.display = 'block';
        
        // Update welcome message - FIXED: use studentName instead of studentId
        const welcomeElement = document.getElementById('welcomeMessage');
        if (welcomeElement && this.currentUser) {
            welcomeElement.textContent = `Welcome, ${this.currentUser.studentName}! Section: ${this.currentSection}`;
        }
        
        // Initialize activity content
        if (window.activity && typeof window.activity.initialize === 'function') {
            window.activity.initialize();
        }
    }

    showError(message) {
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
        // Clear stored data
        localStorage.removeItem('activity5_user');
        localStorage.removeItem('activity5_section');
        
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
    console.log('Initializing auth service');
    
    // Check if already initialized
    if (window.authService) {
        console.log('Auth service already initialized');
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
        window.authService = new AuthService();
        await window.authService.initialize();
        console.log('Auth service initialized successfully');
        setupEventListeners();
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
    initializeAuth();
}

// Also try after window load as fallback
window.addEventListener('load', () => {
    if (!window.authService) {
        console.log('Fallback: initializing auth service after window load');
        initializeAuth();
    }
});
