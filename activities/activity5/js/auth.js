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

    async login(studentId, passcode, selectedSection) {
        try {
            // Validate student credentials
            const isValidStudent = await this.validateStudent(studentId, passcode, selectedSection);
            
            if (isValidStudent) {
                this.currentUser = {
                    studentId: studentId,
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
            this.showError('Invalid student ID, passcode, or section. Please try again.');
            return false;
        }
    }

    async validateStudent(studentId, passcode, selectedSection) {
        try {
            // Query the students table to validate credentials
            const { data: student, error: studentError } = await supabase
                .from('students')
                .select('*')
                .eq('student_id', studentId)
                .eq('passcode', passcode)
                .single();

            if (studentError || !student) {
                console.error('Student validation error:', studentError);
                return false;
            }

            // Validate that the student belongs to the selected section
            const { data: sectionData, error: sectionError } = await supabase
                .from('ta_sections')
                .select('*')
                .eq('section_name', selectedSection)
                .single();

            if (sectionError || !sectionData) {
                console.error('Section validation error:', sectionError);
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
            // Log the student access for analytics
            const { error } = await supabase
                .from('activity5_access_log')
                .insert([{
                    student_id: this.currentUser.studentId,
                    section: this.currentSection,
                    access_time: new Date().toISOString(),
                    activity_type: 'login'
                }]);

            if (error) {
                console.error('Access log error:', error);
            }
        } catch (error) {
            console.error('Log access error:', error);
        }
    }

    async loadSections() {
        try {
            const { data: sections, error } = await supabase
                .from('ta_sections')
                .select('section_name')
                .order('section_name');

            if (error) throw error;

            const sectionSelect = document.getElementById('sectionSelect');
            sectionSelect.innerHTML = '<option value="">Select your section...</option>';
            
            sections.forEach(section => {
                const option = document.createElement('option');
                option.value = section.section_name;
                option.textContent = section.section_name;
                sectionSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading sections:', error);
            this.showError('Failed to load sections. Please refresh the page.');
        }
    }

    showAuthForm() {
        document.getElementById('authContainer').style.display = 'block';
        document.getElementById('activityContent').style.display = 'none';
        this.loadSections();
    }

    showActivityContent() {
        document.getElementById('authContainer').style.display = 'none';
        document.getElementById('activityContent').style.display = 'block';
        
        // Update welcome message
        const welcomeElement = document.getElementById('welcomeMessage');
        if (welcomeElement && this.currentUser) {
            welcomeElement.textContent = `Welcome, ${this.currentUser.studentId}! Section: ${this.currentSection}`;
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

// Initialize auth service when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for Supabase to be available
    if (typeof supabase === 'undefined') {
        console.error('Supabase not available');
        return;
    }

    window.authService = new AuthService();
    await window.authService.initialize();

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
});
