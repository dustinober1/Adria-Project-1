// Authentication utility functions
// When the frontend is served from the static server (port 3000) we must
// point API requests at the FastAPI backend (port 8000). Using the
// frontend origin (window.location.origin) will cause fetch to hit the
// static file server and return HTML ("Unexpected token '<'" JSON parse error).
// Resolve API base lazily at request time to avoid timing issues when pages
// set `window.__API_BASE__` after this script loads.
const resolveApiBase = () => {
  if (window.__API_BASE__ && typeof window.__API_BASE__ === 'string') {
    return window.__API_BASE__;
  }

  try {
    const origin = window.location.origin || '';
    if (window.location.port === '3000' || origin.includes(':3000')) {
      return 'http://127.0.0.1:8000';
    }
    return origin;
  } catch (e) {
    return 'http://127.0.0.1:8000';
  }
};

// API request helper with authentication
// Note: Authentication is now handled entirely through httpOnly cookies (XSS protection)
const apiRequest = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  try {
    const apiBase = resolveApiBase();
    const response = await fetch(`${apiBase}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include' // Include httpOnly cookies
    });

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // If response is not JSON, try to get text for error reporting
      const text = await response.text();
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${text.substring(0, 100)}`);
      }
      throw new Error('Response is not JSON');
    }

    if (!response.ok) {
      throw new Error(data.detail || data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// Register user
const register = async (email, password, firstName, lastName) => {
  try {
    const data = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, firstName, lastName })
    });

    if (data.success) {
      return data;
    }
    throw new Error(data.message || 'Registration failed');
  } catch (error) {
    throw error;
  }
};

// Login user
const login = async (email, password) => {
  try {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (data.success) {
      return data;
    }
    throw new Error(data.message || 'Login failed');
  } catch (error) {
    throw error;
  }
};

// Logout user
const logout = async () => {
  try {
    await apiRequest('/api/auth/logout', {
      method: 'POST'
    });
    window.location.href = '/index.html';
  } catch (error) {
    // Still redirect even if request fails
    window.location.href = '/index.html';
  }
};

// Get current user
const getCurrentUser = async () => {
  try {
    const data = await apiRequest('/api/auth/me', {
      method: 'GET'
    });
    return data.user;
  } catch (error) {
    return null;
  }
};

// Check if user is authenticated
// This checks by attempting to fetch the current user (relies on httpOnly cookie)
const isAuthenticated = async () => {
  try {
    const user = await getCurrentUser();
    return !!user;
  } catch {
    return false;
  }
};

// Export auth functions as an object for use in HTML
const auth = {
  register,
  login,
  logout,
  getCurrentUser,
  isAuthenticated
};

// Protect page (redirect if not authenticated)
const protectPage = async () => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      window.location.href = '/index.html';
      return false;
    }
    return true;
  } catch (error) {
    window.location.href = '/index.html';
    return false;
  }
};

// Add email to marketing list
const subscribeEmail = async (email, name, phone, message) => {
  try {
    const data = await apiRequest('/api/email/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email, name, phone, message })
    });
    return data;
  } catch (error) {
    throw error;
  }
};

// Update UI based on auth state
const updateAuthUI = async () => {
  const authButtons = document.getElementById('authButtons');
  const userMenu = document.getElementById('userMenu');

  if (!authButtons) return;

  try {
    const user = await getCurrentUser();
    if (user) {
      authButtons.style.display = 'none';
      if (userMenu) {
        userMenu.style.display = 'flex';
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
          userNameElement.textContent = user.firstName || user.email;
        }
      }
      return;
    }
  } catch (error) {
    console.error('Error fetching user:', error);
  }

  // Not authenticated
  if (authButtons) authButtons.style.display = 'flex';
  if (userMenu) userMenu.style.display = 'none';
};

// Forgot password
const forgotPassword = async (email) => {
  try {
    const data = await apiRequest('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });

    return data;
  } catch (error) {
    throw error;
  }
};

// Reset password
const resetPassword = async (token, newPassword) => {
  try {
    const data = await apiRequest('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword })
    });

    return data;
  } catch (error) {
    throw error;
  }
};

// Export functions
window.auth = {
  register,
  login,
  logout,
  getCurrentUser,
  isAuthenticated,
  protectPage,
  subscribeEmail,
  updateAuthUI,
  forgotPassword,
  resetPassword
};
