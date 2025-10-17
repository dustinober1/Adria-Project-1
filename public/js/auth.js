// Authentication utility functions
const API_BASE_URL = window.location.origin;

// API request helper with authentication
// Note: Authentication is now handled entirely through httpOnly cookies (XSS protection)
const apiRequest = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include' // Include httpOnly cookies
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
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

// Export functions
window.auth = {
  register,
  login,
  logout,
  getCurrentUser,
  isAuthenticated,
  protectPage,
  subscribeEmail,
  updateAuthUI
};
