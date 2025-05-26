// Fixed Authentication service for Activity 5 - AI Exam Generator
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

    async login(studentName, passcode) {
        try {
            // Validate student credentials using correct table and columns
            const validationResult = await this.validateStudent(studentName, passcode);
            
            if (validationResult) {
                this.currentUser = {
                    studentName: studentName,
                    timestamp: new Date().toISOString()
                };
                this.currentSection = validationResult.section; // Get section from validation
                
                // Save to localStorage
                localStorage.setItem('activity5_user', JSON.stringify(this.currentUser));
                localStorage.setItem('activity5_section', JSON.stringify(this.currentSection));
                
                // Log the login attempt
                await this.logStudentAccess();
                
                this.showActivityContent();
                return true;
            } else {
                throw new Error('Invalid credentials');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Invalid name or passcode. Please try again.');
            return false;
        }
    }

    async validateStudent(studentName, passcode) {
        try {
            // Query the profiles table to validate credentials
            const { data: student, error: studentError } = await supabase
                .from('profiles')
                .select(`
                    id,
                    name,
                    passcode,
                    role,
                    section_id,
                    sections(
                        id,
                        day,
                        time,
                        location
                    )
                `)
                .eq('name', studentName)
                .eq('passcode', passcode)
                .eq('role', 'student')
                .single();

            if (studentError || !student) {
                console.error('Student validation error:', studentError);
                return false;
            }

            // Return student data with section info
            return {
                student: student,
                section: student.sections ? `${student.sections.day} ${student.sections.time}` : 'No section assigned'
            };
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
                    student_id: this.currentUser.studentName,
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

    showAuthForm() {
        document.getElementById('auth-container').style.display = 'block';
        document.getElementById('main-content').style.display = 'none';
    }

    showActivityContent() {
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
        
        // Update welcome message
        const nameDisplay = document.getElementById('student-name-display');
        const sectionDisplay = document.getElementById('student-section-display');
        
        if (nameDisplay && this.currentUser) {
            nameDisplay.textContent = this.currentUser.studentName;
        }
        
        if (sectionDisplay && this.currentSection) {
            sectionDisplay.textContent = this.currentSection;
        }
        
        // Initialize activity content
        if (window.activity && typeof window.activity.initialize === 'function') {
            window.activity.initialize();
        }
    }

    showError(message) {
        const errorElement = document.getElementById('auth-error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
            
            // Hide error after 5 seconds
            setTimeout(() => {
                errorElement.classList.add('hidden');
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
    const authForm = document.getElementById('auth-form');
    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const studentName = document.getElementById('student-name').value.trim();
            const passcode = document.getElementById('student-passcode').value.trim();
            
            if (!studentName || !passcode) {
                window.authService.showError('Please fill in all fields');
                return;
            }
            
            const submitButton = authForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Logging in...';
            submitButton.disabled = true;
            
            const success = await window.authService.login(studentName, passcode);
            
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            
            if (!success) {
                document.getElementById('student-passcode').value = '';
            }
        });
    }
});
