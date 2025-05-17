/**
 * Example of handling session expiration events
 * This demonstrates how to respond to session expiration in the UI
 */

document.addEventListener('DOMContentLoaded', function() {
    // Listen for session expiration events
    window.addEventListener('econwords-session-expired', function(event) {
        console.log('Session expired event received:', event.detail.message);
        
        // Show a user-friendly notification
        showSessionExpiredMessage(event.detail.message);
        
        // Redirect to login page after a short delay
        setTimeout(() => {
            window.location.href = 'login.html?expired=true';
        }, 3000);
    });
    
    // Sample function to show a user-friendly message
    function showSessionExpiredMessage(message) {
        // Create a dismissible notification
        const notification = document.createElement('div');
        notification.className = 'session-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">⚠️</div>
                <div class="notification-message">${message}</div>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        // Add styles to the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #f8f9fa;
            border-left: 4px solid #dc3545;
            padding: 15px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            z-index: 1000;
            border-radius: 4px;
            max-width: 350px;
            animation: slideIn 0.3s ease-out;
        `;
        
        // Add the notification to the DOM
        document.body.appendChild(notification);
        
        // Add close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', function() {
            notification.remove();
        });
        
        // Automatically remove after 8 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }
        }, 8000);
    }
    
    // Add required animations to the document
    const styleSheet = document.createElement('style');
    styleSheet.innerHTML = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .notification-content {
            display: flex;
            align-items: center;
        }
        
        .notification-icon {
            margin-right: 10px;
            font-size: 1.5em;
        }
        
        .notification-message {
            flex-grow: 1;
            font-size: 14px;
        }
        
        .notification-close {
            background: none;
            border: none;
            font-size: 1.2em;
            cursor: pointer;
            padding: 0 5px;
            color: #666;
        }
        
        .notification-close:hover {
            color: #333;
        }
    `;
    document.head.appendChild(styleSheet);
});
