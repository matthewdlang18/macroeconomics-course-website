/**
 * Firebase Auth Configuration (Disabled)
 *
 * This file is a placeholder that disables Firebase authentication.
 * The actual authentication is now handled by Supabase exclusively.
 */

console.error('Firebase authentication is disabled. Using Supabase authentication only.');

// Show error message
document.addEventListener('DOMContentLoaded', function() {
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '0';
    errorDiv.style.left = '0';
    errorDiv.style.right = '0';
    errorDiv.style.backgroundColor = '#f44336';
    errorDiv.style.color = 'white';
    errorDiv.style.padding = '15px';
    errorDiv.style.textAlign = 'center';
    errorDiv.style.zIndex = '9999';
    errorDiv.innerHTML = `
        <strong>Error:</strong> Firebase authentication is disabled.
        The game requires Supabase authentication to function properly.
        <button onclick="this.parentNode.style.display='none'" style="margin-left: 15px; padding: 5px 10px; background: white; color: #f44336; border: none; cursor: pointer;">
            Dismiss
        </button>
    `;
    document.body.appendChild(errorDiv);
});
