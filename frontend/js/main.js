// Main application entry point
document.addEventListener('DOMContentLoaded', function() {
  console.log('Farm Management Platform - Initializing...');

  try {
    // Initialize authentication
    window.auth = new Auth();

    // Initialize dashboard
    window.dashboard = new Dashboard();

    console.log('Application initialized successfully');

    // Add some global error handling
    window.addEventListener('error', function(e) {
      console.error('Global error:', e.error);
    });

    window.addEventListener('unhandledrejection', function(e) {
      console.error('Unhandled promise rejection:', e.reason);
    });

  } catch (error) {
    console.error('Failed to initialize application:', error);

    // Show error message to user
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `
        <div class="auth-container">
          <div class="auth-card">
            <div class="auth-header">
              <i class="fas fa-exclamation-triangle" style="color: var(--error-color);"></i>
              <h1>Initialization Error</h1>
              <p>Failed to start the application</p>
            </div>
            <div class="message error">
              ${error.message}
            </div>
            <button class="btn btn-primary" onclick="location.reload()">
              <i class="fas fa-redo"></i> Reload Page
            </button>
          </div>
        </div>
      `;
    }
  }
});

// Global utility functions
window.utils = {
  // Format currency
  formatCurrency: function(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  },

  // Format date
  formatDate: function(date) {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  },

  // Show notification
  showNotification: function(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `message ${type}`;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '1000';
    notification.style.maxWidth = '300px';
    notification.style.boxShadow = 'var(--shadow-heavy)';
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, duration);
  },

  // Debounce function
  debounce: function(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Validate email
  isValidEmail: function(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Generate random ID
  generateId: function() {
    return Math.random().toString(36).substr(2, 9);
  }
};

// Global API client
window.api = {
  baseURL: window.location.origin,

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = window.auth ? window.auth.getToken() : null;

    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    const finalOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, finalOptions);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  },

  // GET request
  async get(endpoint) {
    return this.request(endpoint);
  },

  // POST request
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // PUT request
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }
};

console.log('Farm Management Platform - Ready!');