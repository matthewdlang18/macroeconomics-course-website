/**
 * Auth Status Display for Econ Words Game
 * This file creates a small, unobtrusive banner showing auth status
 */

(function() {
  // Create the auth status banner
  function createAuthStatusBanner() {
    // Check if Auth is available
    if (!window.Auth) {
      console.warn('Shared Auth system not available for status banner');
      return;
    }
    
    // Create the banner element
    const banner = document.createElement('div');
    banner.id = 'auth-status-banner';
    banner.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      background-color: rgba(33, 150, 243, 0.9);
      color: white;
      padding: 7px 14px;
      border-radius: 4px;
      font-size: 12px;
      font-family: Arial, sans-serif;
      z-index: 10000;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    
    // Add hover effect
    banner.addEventListener('mouseenter', () => {
      banner.style.backgroundColor = 'rgba(33, 150, 243, 1)';
      banner.style.boxShadow = '0 3px 8px rgba(0,0,0,0.3)';
    });
    
    banner.addEventListener('mouseleave', () => {
      banner.style.backgroundColor = 'rgba(33, 150, 243, 0.9)';
      banner.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    });
    
    // Add click handler
    banner.addEventListener('click', () => {
      const user = window.Auth.getCurrentUser();
      if (!user || user.isGuest) {
        window.location.href = 'test-auth.html';
      } else {
        // For signed in users, show a dropdown with options
        toggleAuthDropdown();
      }
    });
    
    // Add to the document
    document.body.appendChild(banner);
    
    // Update the banner with current status
    updateAuthBanner();
    
    return banner;
  }
  
  // Update the banner content based on current auth state
  function updateAuthBanner() {
    const banner = document.getElementById('auth-status-banner');
    if (!banner) return;
    
    // Get current user
    const user = window.Auth?.getCurrentUser();
    
    if (!user) {
      // No user info available
      banner.innerHTML = '⚠️ Auth not initialized';
      banner.style.backgroundColor = 'rgba(255, 152, 0, 0.9)'; // Orange
    } else if (user.isGuest) {
      // Guest user
      banner.innerHTML = '👤 Guest Mode (Click to Sign In)';
      banner.style.backgroundColor = 'rgba(255, 152, 0, 0.9)'; // Orange
    } else {
      // Authenticated user
      const displayName = user.name || user.email || 'User';
      banner.innerHTML = `✓ Signed in as ${displayName}`;
      banner.style.backgroundColor = 'rgba(76, 175, 80, 0.9)'; // Green
    }
  }
  
  // Create and toggle the dropdown menu for signed-in users
  function toggleAuthDropdown() {
    // Check if dropdown already exists
    let dropdown = document.getElementById('auth-dropdown');
    
    if (dropdown) {
      // If it exists, remove it
      dropdown.remove();
      return;
    }
    
    // Create the dropdown
    dropdown = document.createElement('div');
    dropdown.id = 'auth-dropdown';
    dropdown.style.cssText = `
      position: fixed;
      bottom: 45px;
      right: 10px;
      background-color: white;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      overflow: hidden;
      z-index: 10001;
      font-family: Arial, sans-serif;
      font-size: 14px;
    `;
    
    // Get user info
    const user = window.Auth?.getCurrentUser();
    const userName = user?.name || user?.email || 'User';
    
    // Add dropdown content
    dropdown.innerHTML = `
      <div style="padding: 15px; border-bottom: 1px solid #eee;">
        <strong>${userName}</strong>
        ${user?.email ? `<div style="color: #666; font-size: 12px;">${user.email}</div>` : ''}
      </div>
      <div class="dropdown-item" id="view-profile" style="padding: 10px 15px; cursor: pointer; hover: background-color: #f5f5f5;">View Profile</div>
      <div class="dropdown-item" id="sign-out" style="padding: 10px 15px; cursor: pointer; hover: background-color: #f5f5f5; color: #f44336;">Sign Out</div>
    `;
    
    // Add hover effects to dropdown items
    dropdown.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('mouseenter', () => {
        item.style.backgroundColor = '#f5f5f5';
      });
      item.addEventListener('mouseleave', () => {
        item.style.backgroundColor = 'white';
      });
    });
    
    // Add click handlers
    dropdown.querySelector('#view-profile').addEventListener('click', () => {
      window.location.href = 'test-auth.html';
    });
    
    dropdown.querySelector('#sign-out').addEventListener('click', async () => {
      if (confirm('Are you sure you want to sign out?')) {
        window.Auth.logout();
        updateAuthBanner();
        dropdown.remove();
      }
    });
    
    // Add click outside handler to close dropdown
    function handleOutsideClick(event) {
      if (dropdown && !dropdown.contains(event.target) && event.target.id !== 'auth-status-banner') {
        dropdown.remove();
        document.removeEventListener('click', handleOutsideClick);
      }
    }
    
    // Add to document and set up outside click handler
    document.body.appendChild(dropdown);
    setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 0);
  }
  
  // Initialize when DOM is loaded
  function initAuthStatusDisplay() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', createAuthStatusBanner);
    } else {
      createAuthStatusBanner();
    }
    
    // Listen for auth changes
    document.addEventListener('DOMContentLoaded', updateAuthBanner);
  }
  
  // Start the initialization
  initAuthStatusDisplay();
})();
