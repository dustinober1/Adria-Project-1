// Authentication utility functions
const API_BASE_URL = window.location.origin;

// Store token in localStorage (as backup to httpOnly cookie)
const setToken = (token) => {
  localStorage.setItem('authToken', token);
};

const getToken = () => {
  return localStorage.getItem('authToken');
};

const removeToken = () => {
  localStorage.removeItem('authToken');
};

// API request helper with authentication
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include' // Include cookies
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

    if (data.success && data.token) {
      setToken(data.token);
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

    if (data.success && data.token) {
      setToken(data.token);
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
    removeToken();
    window.location.href = '/index.html';
  } catch (error) {
    // Still remove token even if request fails
    removeToken();
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
    removeToken();
    return null;
  }
};

// Check if user is authenticated
const isAuthenticated = () => {
  return !!getToken();
};

// Protect page (redirect if not authenticated)
const protectPage = async () => {
  if (!isAuthenticated()) {
    window.location.href = '/index.html';
    return false;
  }

  try {
    await getCurrentUser();
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

  if (isAuthenticated()) {
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
