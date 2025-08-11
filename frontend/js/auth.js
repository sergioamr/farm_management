class Auth {
  constructor() {
    // Use current domain instead of hardcoded localhost
    this.baseURL = window.location.origin;
    this.token = localStorage.getItem('authToken');
    this.user = JSON.parse(localStorage.getItem('user'));

    this.init();
  }

  init() {
    this.bindEvents();
    this.checkAuthStatus();
  }

  bindEvents() {
    const loginForm = document.getElementById('loginFormElement');
    const logoutBtn = document.getElementById('logoutBtn');

    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }
  }

  async handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('loginMessage');

    try {
      this.showLoading();

      // Use current domain for API calls
      const response = await fetch(`${this.baseURL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        this.setAuthData(data.token, data.user);
        this.showMessage('Login successful!', 'success');
        setTimeout(() => this.showDashboard(), 1000);
      } else {
        this.showMessage(data.error || 'Login failed', 'error');
      }
    } catch (error) {
      this.showMessage('Network error. Please try again.', 'error');
    } finally {
      this.hideLoading();
    }
  }

  async handleLogout() {
    try {
      await fetch(`${this.baseURL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuthData();
      this.showLogin();
    }
  }

  setAuthData(token, user) {
    this.token = token;
    this.user = user;
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  clearAuthData() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  checkAuthStatus() {
    if (this.token && this.user) {
      this.showDashboard();
    } else {
      this.showLogin();
    }
  }

  showLogin() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('dashboard').classList.add('hidden');
  }

  showDashboard() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');

    // Update user info
    if (this.user) {
      const userInfo = document.getElementById('userInfo');
      if (userInfo) {
        userInfo.textContent = `${this.user.firstName} ${this.user.lastName} (${this.user.role})`;
      }
    }
  }

  showMessage(message, type = 'info') {
    const messageDiv = document.getElementById('loginMessage');
    if (messageDiv) {
      messageDiv.textContent = message;
      messageDiv.className = `message ${type}`;
      messageDiv.style.display = 'block';
    }
  }

  showLoading() {
    const submitBtn = document.querySelector('#loginFormElement button[type="submit"]');
    if (submitBtn) {
      submitBtn.innerHTML = '<span class="loading"></span> Signing In...';
      submitBtn.disabled = true;
    }
  }

  hideLoading() {
    const submitBtn = document.querySelector('#loginFormElement button[type="submit"]');
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
      submitBtn.disabled = false;
    }
  }

  // Getter for token (used by other modules)
  getToken() {
    return this.token;
  }

  // Getter for user (used by other modules)
  getUser() {
    return this.user;
  }

  // Check if user is admin
  isAdmin() {
    return this.user && this.user.role === 'admin';
  }
}

// Export for use in other modules
window.Auth = Auth;