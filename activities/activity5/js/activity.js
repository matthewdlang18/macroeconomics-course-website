// Activity 5 - AI Exam Generator Main Logic
class Activity5 {
    constructor() {
        this.currentTab = 'solo';
        this.conversationHistory = [];
        this.groupResponses = [];
        this.studyGuideQuestions = [];
        this.sessionStartTime = null;
        this.activityProgress = {
            soloCompleted: false,
            groupCompleted: false,
            studyGuideCompleted: false
        };
    }

    initialize() {
        console.log('Activity5.initialize() called');
        try {
            this.sessionStartTime = new Date();
            this.setupTabNavigation();
            this.setupSoloChat();
            this.setupGroupReflection();
            this.setupStudyGuide();
            this.loadExistingProgress();
            this.showTab('solo'); // Start with solo tab
            console.log('Activity5 initialization completed successfully');
        } catch (error) {
            console.error('Error during Activity5 initialization:', error);
        }
    }

    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.showTab(tabName);
            });
        });
    }

    showTab(tabName) {
        console.log(`Showing tab: ${tabName}`);
        try {
            // Update tab buttons
            const tabButtons = document.querySelectorAll('.tab-button');
            console.log(`Found ${tabButtons.length} tab buttons`);
            tabButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            
            const activeTabButton = document.querySelector(`[data-tab="${tabName}"]`);
            if (activeTabButton) {
                activeTabButton.classList.add('active');
                console.log(`Activated tab button for: ${tabName}`);
            } else {
                console.error(`Tab button not found for: ${tabName}`);
            }

            // Update tab content
            const tabContents = document.querySelectorAll('.tab-content');
            console.log(`Found ${tabContents.length} tab contents`);
            tabContents.forEach(content => {
                content.classList.remove('active');
            });
            
            const activeTabContent = document.getElementById(`${tabName}Tab`);
            if (activeTabContent) {
                activeTabContent.classList.add('active');
                console.log(`Activated tab content for: ${tabName}Tab`);
            } else {
                console.error(`Tab content not found for: ${tabName}Tab`);
            }

            this.currentTab = tabName;
            this.saveProgress();
        } catch (error) {
            console.error('Error in showTab:', error);
        }
    }

    setupSoloChat() {
        const chatForm = document.getElementById('chatForm');
        const userInput = document.getElementById('userInput');
        const sendButton = document.getElementById('sendButton');

        if (chatForm) {
            chatForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const message = userInput.value.trim();
                
                if (!message) return;
                
                await this.sendMessage(message);
                userInput.value = '';
            });
        }

        // Auto-resize textarea
        if (userInput) {
            userInput.addEventListener('input', () => {
                userInput.style.height = 'auto';
                userInput.style.height = userInput.scrollHeight + 'px';
            });
        }
    }

    async sendMessage(message) {
        try {
            // Add user message to chat
            this.addMessageToChat('user', message);
            
            // Show typing indicator
            this.showTypingIndicator();
            
            // Save user message to conversation history
            const userMessageData = {
                role: 'user',
                content: message,
                timestamp: new Date().toISOString()
            };
            this.conversationHistory.push(userMessageData);
            
            // Simulate AI response (in a real implementation, this would call an AI API)
            const aiResponse = await this.generateAIResponse(message);
            
            // Remove typing indicator
            this.hideTypingIndicator();
            
            // Add AI response to chat
            this.addMessageToChat('ai', aiResponse);
            
            // Save AI response to conversation history
            const aiMessageData = {
                role: 'assistant',
                content: aiResponse,
                timestamp: new Date().toISOString()
            };
            this.conversationHistory.push(aiMessageData);
            
            // Save to database
            await this.saveConversationToDatabase();
            
            // Update progress
            this.updateSoloProgress();
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.hideTypingIndicator();
            this.addMessageToChat('system', 'Sorry, there was an error processing your message. Please try again.');
        }
    }

    addMessageToChat(sender, message) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = message;
        
        const timestamp = document.createElement('div');
        timestamp.className = 'message-timestamp';
        timestamp.textContent = new Date().toLocaleTimeString();
        
        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(timestamp);
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    showTypingIndicator() {
        const chatMessages = document.getElementById('chatMessages');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typingIndicator';
        typingDiv.className = 'message ai-message typing';
        typingDiv.innerHTML = '<div class="message-content">AI is thinking...</div>';
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    async generateAIResponse(userMessage) {
        // This is a simplified AI response generator
        // In a real implementation, this would call an actual AI API
        
        const responses = [
            "Great question! Let me help you understand this macroeconomic concept. When we think about GDP, it's important to consider both the expenditure and income approaches.",
            "That's an excellent point to explore for your exam preparation. Monetary policy tools like interest rates have complex effects on the economy.",
            "For your exam, you should focus on understanding the relationship between inflation and unemployment, particularly the Phillips Curve.",
            "Let's break this down step by step. Fiscal policy involves government spending and taxation, which directly affects aggregate demand.",
            "This is a key concept that often appears on exams. The multiplier effect shows how initial spending changes can have amplified effects on the economy."
        ];
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Return a random response (in reality, this would be based on the user's message)
        return responses[Math.floor(Math.random() * responses.length)];
    }

    async saveConversationToDatabase() {
        try {
            if (!window.authService.isAuthenticated()) return;
            
            const conversationData = {
                student_id: window.authService.getCurrentUser().studentName,
                section: window.authService.getCurrentSection(),
                conversation_data: this.conversationHistory,
                last_updated: new Date().toISOString()
            };

            // First, try to update existing record
            const { data: existingData, error: selectError } = await supabase
                .from('activity5_conversations')
                .select('id')
                .eq('student_id', conversationData.student_id)
                .eq('section', conversationData.section)
                .maybeSingle();

            if (selectError && selectError.code !== 'PGRST116') {
                throw selectError;
            }

            let result;
            if (existingData) {
                // Update existing record
                result = await supabase
                    .from('activity5_conversations')
                    .update({
                        conversation_data: conversationData.conversation_data,
                        last_updated: conversationData.last_updated
                    })
                    .eq('id', existingData.id);
            } else {
                // Insert new record
                result = await supabase
                    .from('activity5_conversations')
                    .insert([conversationData]);
            }

            if (result.error) throw result.error;
            
        } catch (error) {
            console.error('Error saving conversation:', error);
        }
    }

    setupGroupReflection() {
        const reflectionForm = document.getElementById('reflectionForm');
        if (reflectionForm) {
            reflectionForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.submitGroupReflection();
            });
        }
    }

    async submitGroupReflection() {
        try {
            const insights = document.getElementById('aiInsights').value.trim();
            const challenges = document.getElementById('challenges').value.trim();
            const improvements = document.getElementById('improvements').value.trim();
            
            if (!insights || !challenges || !improvements) {
                alert('Please fill in all reflection fields.');
                return;
            }
            
            const reflectionData = {
                student_id: window.authService.getCurrentUser().studentName,
                section: window.authService.getCurrentSection(),
                ai_insights: insights,
                challenges: challenges,
                improvements: improvements,
                submitted_at: new Date().toISOString()
            };
            
            // Check if reflection already exists
            const { data: existingData, error: selectError } = await supabase
                .from('activity5_group_reflections')
                .select('id')
                .eq('student_id', reflectionData.student_id)
                .eq('section', reflectionData.section)
                .maybeSingle();

            if (selectError && selectError.code !== 'PGRST116') {
                throw selectError;
            }

            let result;
            if (existingData) {
                // Update existing record
                result = await supabase
                    .from('activity5_group_reflections')
                    .update({
                        ai_insights: reflectionData.ai_insights,
                        challenges: reflectionData.challenges,
                        improvements: reflectionData.improvements,
                        submitted_at: reflectionData.submitted_at
                    })
                    .eq('id', existingData.id);
            } else {
                // Insert new record
                result = await supabase
                    .from('activity5_group_reflections')
                    .insert([reflectionData]);
            }
            
            if (result.error) throw result.error;
            
            // Update progress
            this.activityProgress.groupCompleted = true;
            this.saveProgress();
            this.updateProgressDisplay();
            
            // Show success message
            document.getElementById('reflectionSuccess').style.display = 'block';
            document.getElementById('reflectionForm').style.display = 'none';
            
        } catch (error) {
            console.error('Error submitting reflection:', error);
            alert('Error submitting reflection. Please try again.');
        }
    }

    setupStudyGuide() {
        const addQuestionBtn = document.getElementById('addQuestionBtn');
        const saveStudyGuideBtn = document.getElementById('saveStudyGuideBtn');
        
        if (addQuestionBtn) {
            addQuestionBtn.addEventListener('click', () => {
                this.addStudyGuideQuestion();
            });
        }
        
        if (saveStudyGuideBtn) {
            saveStudyGuideBtn.addEventListener('click', async () => {
                await this.saveStudyGuide();
            });
        }
    }

    addStudyGuideQuestion() {
        const questionsList = document.getElementById('studyGuideQuestions');
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-item';
        
        questionDiv.innerHTML = `
            <div class="question-input-group">
                <textarea 
                    class="question-input" 
                    placeholder="Enter your exam question..."
                    rows="2"
                ></textarea>
                <textarea 
                    class="answer-input" 
                    placeholder="Enter the answer or key points..."
                    rows="3"
                ></textarea>
                <button type="button" class="remove-question-btn" onclick="this.parentElement.parentElement.remove()">Remove</button>
            </div>
        `;
        
        questionsList.appendChild(questionDiv);
        
        // Auto-resize textareas
        const textareas = questionDiv.querySelectorAll('textarea');
        textareas.forEach(textarea => {
            textarea.addEventListener('input', () => {
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
            });
        });
    }

    async saveStudyGuide() {
        try {
            const questionItems = document.querySelectorAll('.question-item');
            const questions = [];
            
            questionItems.forEach((item, index) => {
                const questionText = item.querySelector('.question-input').value.trim();
                const answerText = item.querySelector('.answer-input').value.trim();
                
                if (questionText && answerText) {
                    questions.push({
                        question: questionText,
                        answer: answerText,
                        order: index + 1
                    });
                }
            });
            
            if (questions.length === 0) {
                alert('Please add at least one question and answer.');
                return;
            }
            
            const studyGuideData = {
                student_id: window.authService.getCurrentUser().studentName,
                section: window.authService.getCurrentSection(),
                questions_data: questions,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // Check if study guide already exists
            const { data: existingData, error: selectError } = await supabase
                .from('activity5_study_guides')
                .select('id')
                .eq('student_id', studyGuideData.student_id)
                .eq('section', studyGuideData.section)
                .maybeSingle();

            if (selectError && selectError.code !== 'PGRST116') {
                throw selectError;
            }

            let result;
            if (existingData) {
                // Update existing record
                result = await supabase
                    .from('activity5_study_guides')
                    .update({
                        questions_data: studyGuideData.questions_data,
                        updated_at: studyGuideData.updated_at
                    })
                    .eq('id', existingData.id);
            } else {
                // Insert new record
                result = await supabase
                    .from('activity5_study_guides')
                    .insert([studyGuideData]);
            }
            
            if (result.error) throw result.error;
            
            // Update progress
            this.activityProgress.studyGuideCompleted = true;
            this.saveProgress();
            this.updateProgressDisplay();
            
            // Show success message
            alert('Study guide saved successfully!');
            
        } catch (error) {
            console.error('Error saving study guide:', error);
            alert('Error saving study guide. Please try again.');
        }
    }

    updateSoloProgress() {
        if (this.conversationHistory.length >= 5) { // Require at least 5 exchanges
            this.activityProgress.soloCompleted = true;
            this.saveProgress();
            this.updateProgressDisplay();
        }
    }

    updateProgressDisplay() {
        const progressItems = document.querySelectorAll('.progress-item');
        
        progressItems.forEach(item => {
            const step = item.dataset.step;
            if (this.activityProgress[step + 'Completed']) {
                item.classList.add('completed');
            }
        });
        
        // Enable next tabs when previous steps are completed
        const groupTab = document.querySelector('[data-tab="group"]');
        const studyTab = document.querySelector('[data-tab="study"]');
        
        if (this.activityProgress.soloCompleted) {
            groupTab.disabled = false;
            groupTab.style.opacity = '1';
        }
        
        if (this.activityProgress.groupCompleted) {
            studyTab.disabled = false;
            studyTab.style.opacity = '1';
        }
    }

    async loadExistingProgress() {
        try {
            if (!window.authService || !window.authService.isAuthenticated()) {
                console.log('Cannot load progress: not authenticated');
                return;
            }
            
            const currentUser = window.authService.getCurrentUser();
            const currentSection = window.authService.getCurrentSection();
            
            if (!currentUser || !currentUser.studentName || !currentSection) {
                console.log('Cannot load progress: invalid user or section data');
                return;
            }
            
            const studentId = currentUser.studentName;
            const section = currentSection;
            
            // Load conversation history
            const { data: conversationData } = await supabase
                .from('activity5_conversations')
                .select('conversation_data')
                .eq('student_id', studentId)
                .eq('section', section)
                .maybeSingle();
            
            if (conversationData && conversationData.conversation_data) {
                this.conversationHistory = conversationData.conversation_data;
                this.displayConversationHistory();
            }
            
            // Load group reflection status
            const { data: reflectionData } = await supabase
                .from('activity5_group_reflections')
                .select('*')
                .eq('student_id', studentId)
                .eq('section', section)
                .maybeSingle();
            
            if (reflectionData) {
                this.activityProgress.groupCompleted = true;
                this.displayReflectionData(reflectionData);
            }
            
            // Load study guide
            const { data: studyGuideData } = await supabase
                .from('activity5_study_guides')
                .select('questions_data')
                .eq('student_id', studentId)
                .eq('section', section)
                .maybeSingle();
            
            if (studyGuideData && studyGuideData.questions_data) {
                this.studyGuideQuestions = studyGuideData.questions_data;
                this.displayStudyGuideQuestions();
                this.activityProgress.studyGuideCompleted = true;
            }
            
            // Update solo progress based on conversation length
            if (this.conversationHistory.length >= 5) {
                this.activityProgress.soloCompleted = true;
            }
            
            this.updateProgressDisplay();
            
        } catch (error) {
            console.error('Error loading existing progress:', error);
        }
    }

    displayConversationHistory() {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';
        
        this.conversationHistory.forEach(message => {
            this.addMessageToChat(message.role === 'user' ? 'user' : 'ai', message.content);
        });
    }

    displayReflectionData(data) {
        document.getElementById('aiInsights').value = data.ai_insights;
        document.getElementById('challenges').value = data.challenges;
        document.getElementById('improvements').value = data.improvements;
        document.getElementById('reflectionForm').style.display = 'none';
        document.getElementById('reflectionSuccess').style.display = 'block';
    }

    displayStudyGuideQuestions() {
        const questionsList = document.getElementById('studyGuideQuestions');
        questionsList.innerHTML = '';
        
        this.studyGuideQuestions.forEach(item => {
            this.addStudyGuideQuestion();
            const questionItems = document.querySelectorAll('.question-item');
            const lastItem = questionItems[questionItems.length - 1];
            lastItem.querySelector('.question-input').value = item.question;
            lastItem.querySelector('.answer-input').value = item.answer;
        });
    }

    saveProgress() {
        try {
            if (window.authService && window.authService.isAuthenticated()) {
                const currentUser = window.authService.getCurrentUser();
                if (currentUser && currentUser.studentName) {
                    const progressKey = `activity5_progress_${currentUser.studentName}`;
                    localStorage.setItem(progressKey, JSON.stringify({
                        currentTab: this.currentTab,
                        progress: this.activityProgress,
                        timestamp: new Date().toISOString()
                    }));
                    console.log('Progress saved successfully');
                } else {
                    console.log('Cannot save progress: invalid user data');
                }
            } else {
                console.log('Cannot save progress: not authenticated');
            }
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    }

    reset() {
        this.conversationHistory = [];
        this.groupResponses = [];
        this.studyGuideQuestions = [];
        this.activityProgress = {
            soloCompleted: false,
            groupCompleted: false,
            studyGuideCompleted: false
        };
        
        // Clear UI
        document.getElementById('chatMessages').innerHTML = '';
        document.getElementById('studyGuideQuestions').innerHTML = '';
        
        // Reset forms
        const forms = document.querySelectorAll('form');
        forms.forEach(form => form.reset());
    }
}

// Initialize activity when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.activity = new Activity5();
        console.log('Activity5 instance created successfully');
        
        // Initialize if already authenticated
        if (window.authService && window.authService.isAuthenticated()) {
            console.log('Auth service available and authenticated, initializing activity');
            window.activity.initialize();
        } else {
            console.log('Auth service not ready yet or not authenticated');
        }
    } catch (error) {
        console.error('Error creating Activity5 instance:', error);
    }
});
