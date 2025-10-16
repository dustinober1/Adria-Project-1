// Admin Dashboard JavaScript

const API_BASE = '/api';
let currentUser = null;
let currentSection = 'dashboard';

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication
  await checkAuthentication();
  
  // Setup event listeners
  setupEventListeners();
  
  // Load initial data
  loadDashboard();
});

// Check if user is authenticated and is admin
async function checkAuthentication() {
  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      credentials: 'include'
    });

    if (!response.ok) {
      window.location.href = 'login.html';
      return;
    }

    const data = await response.json();
    currentUser = data.user;

    if (!currentUser.isAdmin) {
      showMessage('You do not have admin privileges', 'error');
      window.location.href = 'index.html';
      return;
    }

    document.getElementById('adminName').textContent = currentUser.email;
  } catch (error) {
    logger.error('Auth check failed:', error);
    window.location.href = 'login.html';
  }
}

// Setup event listeners
function setupEventListeners() {
  // Navigation links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.dataset.section;
      switchSection(section);
    });
  });

  // Logout button
  document.getElementById('logoutBtn').addEventListener('click', logout);

  // Dashboard
  // (loads automatically)

  // Users section
  document.getElementById('refreshUsersBtn').addEventListener('click', loadUsers);
  document.getElementById('userSearchInput').addEventListener('input', filterUsers);

  // Articles section
  document.getElementById('refreshArticlesBtn').addEventListener('click', loadArticles);
  document.getElementById('articleSearchInput').addEventListener('input', filterArticles);
  document.getElementById('articleStatusFilter').addEventListener('change', filterArticles);

  // New article form
  document.getElementById('articleForm').addEventListener('submit', createArticle);
  document.getElementById('articleTitle').addEventListener('change', generateSlug);

  // Edit article modal
  setupModalListeners();
}

// Switch between sections
function switchSection(section) {
  // Hide all sections
  document.querySelectorAll('.content-section').forEach(sec => {
    sec.classList.remove('active');
  });

  // Remove active class from all nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });

  // Show selected section
  document.getElementById(section).classList.add('active');
  document.querySelector(`[data-section="${section}"]`).classList.add('active');

  currentSection = section;

  // Load data based on section
  if (section === 'users' && !document.getElementById('usersList').textContent.includes('No users')) {
    loadUsers();
  } else if (section === 'articles') {
    loadArticles();
  }
}

// ============ DASHBOARD ============
async function loadDashboard() {
  try {
    const response = await fetch(`${API_BASE}/admin/stats`, {
      credentials: 'include'
    });

    if (!response.ok) throw new Error('Failed to load stats');

    const data = await response.json();
    const stats = data.stats;

    document.getElementById('totalUsers').textContent = stats.totalUsers;
    document.getElementById('totalArticles').textContent = stats.totalArticles;
    document.getElementById('publishedArticles').textContent = stats.publishedArticles;
    document.getElementById('draftArticles').textContent = stats.draftArticles;
    document.getElementById('totalAdmins').textContent = stats.totalAdmins;
  } catch (error) {
    logger.error('Failed to load dashboard:', error);
    showMessage('Failed to load dashboard statistics', 'error');
  }
}

// ============ USERS MANAGEMENT ============
async function loadUsers() {
  try {
    const response = await fetch(`${API_BASE}/admin/users`, {
      credentials: 'include'
    });

    if (!response.ok) throw new Error('Failed to load users');

    const data = await response.json();
    const users = data.users;

    const usersList = document.getElementById('usersList');
    if (users.length === 0) {
      usersList.innerHTML = '<tr><td colspan="7" class="loading">No users found</td></tr>';
      return;
    }

    // Status badge helper
    const getStatusBadge = (status) => {
      const statusMap = {
        'active_customer': '🟢 Active',
        'green': '🟢 Green',
        'yellow': '🟡 Yellow',
        'red': '🔴 Red'
      };
      return statusMap[status] || status;
    };

    // Tier badge helper
    const getTierBadge = (tier) => {
      return tier === 'paid' ? '💎 Paid' : '📝 Free';
    };

    usersList.innerHTML = users.map(user => `
      <tr>
        <td>${escapeHtml(user.email)}</td>
        <td>${escapeHtml(user.first_name || '')} ${escapeHtml(user.last_name || '')}</td>
        <td>${getTierBadge(user.customer_tier)}</td>
        <td>${getStatusBadge(user.customer_status)}</td>
        <td>
          ${user.is_admin ? '<span class="status-badge status-admin">Admin</span>' : '<span style="color: var(--text-light);">User</span>'}
        </td>
        <td>${new Date(user.created_at).toLocaleDateString()}</td>
        <td>
          <div class="action-buttons">
            <button class="btn-primary btn-small" onclick="viewUserDetails('${user.id}')">View</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    logger.error('Failed to load users:', error);
    showMessage('Failed to load users', 'error');
  }
}

async function viewUserDetails(userId) {
  try {
    const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
      credentials: 'include'
    });

    if (!response.ok) throw new Error('Failed to load user details');

    const data = await response.json();
    const user = data.user;

    // Store current user ID for save changes
    window.currentEditingUserId = user.id;

    const userDetailsContent = document.getElementById('userDetailsContent');
    userDetailsContent.innerHTML = `
      <div class="detail-row">
        <span class="detail-label">Email:</span>
        <span class="detail-value">${escapeHtml(user.email)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Name:</span>
        <span class="detail-value">${escapeHtml(user.firstName || '')} ${escapeHtml(user.lastName || '')}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Admin:</span>
        <span class="detail-value">${user.isAdmin ? 'Yes' : 'No'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Created:</span>
        <span class="detail-value">${new Date(user.createdAt).toLocaleString()}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Last Login:</span>
        <span class="detail-value">${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</span>
      </div>
    `;

    // Populate dropdown fields
    document.getElementById('userTierSelect').value = user.customer_tier || 'free';
    document.getElementById('userStatusSelect').value = user.customer_status || 'green';
    document.getElementById('userAdminNotes').value = user.admin_notes || '';

    // Setup action buttons
    const promoteBtn = document.getElementById('promoteUserBtn');
    const demoteBtn = document.getElementById('demoteUserBtn');
    const deleteBtn = document.getElementById('deleteUserBtn');
    const saveChangesBtn = document.getElementById('saveUserChangesBtn');

    promoteBtn.style.display = user.isAdmin ? 'none' : 'block';
    demoteBtn.style.display = user.isAdmin ? 'block' : 'none';

    promoteBtn.onclick = () => promoteUser(user.id);
    demoteBtn.onclick = () => demoteUser(user.id);
    deleteBtn.onclick = () => deleteUser(user.id);
    saveChangesBtn.onclick = () => saveUserChanges(user.id);
    demoteBtn.onclick = () => demoteUser(userId);
    deleteBtn.onclick = () => deleteUser(userId);

    // Show modal
    document.getElementById('userDetailsModal').classList.add('show');
  } catch (error) {
    logger.error('Failed to load user details:', error);
    showMessage('Failed to load user details', 'error');
  }
}

async function promoteUser(userId) {
  try {
    const response = await fetch(`${API_BASE}/admin/users/${userId}/promote`, {
      method: 'POST',
      credentials: 'include'
    });

    if (!response.ok) throw new Error('Failed to promote user');

    showMessage('User promoted to admin successfully', 'success');
    closeModal('userDetailsModal');
    loadUsers();
  } catch (error) {
    logger.error('Failed to promote user:', error);
    showMessage('Failed to promote user', 'error');
  }
}

async function demoteUser(userId) {
  try {
    const response = await fetch(`${API_BASE}/admin/users/${userId}/demote`, {
      method: 'POST',
      credentials: 'include'
    });

    if (!response.ok) throw new Error('Failed to demote user');

    showMessage('User demoted from admin successfully', 'success');
    closeModal('userDetailsModal');
    loadUsers();
  } catch (error) {
    logger.error('Failed to demote user:', error);
    showMessage('Failed to demote user', 'error');
  }
}

async function deleteUser(userId) {
  if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) throw new Error('Failed to delete user');

    showMessage('User deleted successfully', 'success');
    closeModal('userDetailsModal');
    loadUsers();
  } catch (error) {
    logger.error('Failed to delete user:', error);
    showMessage('Failed to delete user', 'error');
  }
}

// Save customer tier, status, and notes
async function saveUserChanges(userId) {
  try {
    const tier = document.getElementById('userTierSelect').value;
    const status = document.getElementById('userStatusSelect').value;
    const notes = document.getElementById('userAdminNotes').value;

    // Update tier
    if (tier) {
      const tierResponse = await fetch(`${API_BASE}/admin/users/${userId}/tier`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
        credentials: 'include'
      });
      if (!tierResponse.ok) throw new Error('Failed to update tier');
    }

    // Update status
    if (status) {
      const statusResponse = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
        credentials: 'include'
      });
      if (!statusResponse.ok) throw new Error('Failed to update status');
    }

    // Update notes
    const notesResponse = await fetch(`${API_BASE}/admin/users/${userId}/notes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
      credentials: 'include'
    });
    if (!notesResponse.ok) throw new Error('Failed to update notes');

    showMessage('Customer information updated successfully', 'success');
    closeModal('userDetailsModal');
    loadUsers();
  } catch (error) {
    logger.error('Failed to save user changes:', error);
    showMessage('Failed to save changes', 'error');
  }
}

function filterUsers() {
  const searchTerm = document.getElementById('userSearchInput').value.toLowerCase();
  const rows = document.querySelectorAll('#usersList tr');

  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchTerm) ? '' : 'none';
  });
}

// ============ BLOG ARTICLES ============
async function loadArticles() {
  try {
    const response = await fetch(`${API_BASE}/admin/articles`, {
      credentials: 'include'
    });

    if (!response.ok) throw new Error('Failed to load articles');

    const data = await response.json();
    let articles = data.articles;

    // Apply status filter
    const statusFilter = document.getElementById('articleStatusFilter').value;
    if (statusFilter === 'published') {
      articles = articles.filter(a => a.published);
    } else if (statusFilter === 'draft') {
      articles = articles.filter(a => !a.published);
    }

    displayArticles(articles);
  } catch (error) {
    logger.error('Failed to load articles:', error);
    showMessage('Failed to load articles', 'error');
  }
}

function displayArticles(articles) {
  const articlesList = document.getElementById('articlesList');
  if (articles.length === 0) {
    articlesList.innerHTML = '<tr><td colspan="6" class="loading">No articles found</td></tr>';
    return;
  }

  articlesList.innerHTML = articles.map(article => `
    <tr>
      <td>${escapeHtml(article.title)}</td>
      <td>${escapeHtml(article.slug)}</td>
      <td>
        <span class="status-badge ${article.published ? 'status-published' : 'status-draft'}">
          ${article.published ? 'Published' : 'Draft'}
        </span>
      </td>
      <td>${escapeHtml(article.first_name || '')} ${escapeHtml(article.last_name || '')}</td>
      <td>${new Date(article.created_at).toLocaleDateString()}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-primary btn-small" onclick="editArticle(${article.id})">Edit</button>
          <button class="btn-danger btn-small" onclick="deleteArticle(${article.id})">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterArticles() {
  loadArticles();
}

async function createArticle(e) {
  e.preventDefault();

  const formData = {
    title: document.getElementById('articleTitle').value,
    slug: document.getElementById('articleSlug').value,
    content: document.getElementById('articleContent').value,
    excerpt: document.getElementById('articleExcerpt').value,
    featured_image: document.getElementById('articleImage').value,
    published: document.getElementById('articlePublished').checked
  };

  try {
    const response = await fetch(`${API_BASE}/admin/articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create article');
    }

    showMessage('Article created successfully!', 'success');
    document.getElementById('articleForm').reset();
    switchSection('articles');
    loadArticles();
  } catch (error) {
    logger.error('Failed to create article:', error);
    showMessage(error.message || 'Failed to create article', 'error');
  }
}

async function editArticle(articleId) {
  try {
    const response = await fetch(`${API_BASE}/admin/articles/${articleId}`, {
      credentials: 'include'
    });

    if (!response.ok) throw new Error('Failed to load article');

    const data = await response.json();
    const article = data.article;

    document.getElementById('editArticleId').value = article.id;
    document.getElementById('editArticleTitle').value = article.title;
    document.getElementById('editArticleSlug').value = article.slug;
    document.getElementById('editArticleExcerpt').value = article.excerpt || '';
    document.getElementById('editArticleContent').value = article.content;
    document.getElementById('editArticleImage').value = article.featured_image || '';
    document.getElementById('editArticlePublished').checked = article.published;

    document.getElementById('editArticleModal').classList.add('show');
  } catch (error) {
    logger.error('Failed to load article:', error);
    showMessage('Failed to load article', 'error');
  }
}

document.getElementById('editArticleForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const articleId = document.getElementById('editArticleId').value;
  const formData = {
    title: document.getElementById('editArticleTitle').value,
    slug: document.getElementById('editArticleSlug').value,
    content: document.getElementById('editArticleContent').value,
    excerpt: document.getElementById('editArticleExcerpt').value,
    featured_image: document.getElementById('editArticleImage').value,
    published: document.getElementById('editArticlePublished').checked
  };

  try {
    const response = await fetch(`${API_BASE}/admin/articles/${articleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update article');
    }

    showMessage('Article updated successfully!', 'success');
    closeModal('editArticleModal');
    loadArticles();
  } catch (error) {
    logger.error('Failed to update article:', error);
    showMessage(error.message || 'Failed to update article', 'error');
  }
});

async function deleteArticle(articleId) {
  if (!confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/admin/articles/${articleId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) throw new Error('Failed to delete article');

    showMessage('Article deleted successfully', 'success');
    loadArticles();
  } catch (error) {
    logger.error('Failed to delete article:', error);
    showMessage('Failed to delete article', 'error');
  }
}

// Generate slug from title
function generateSlug() {
  const title = document.getElementById('articleTitle').value;
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  document.getElementById('articleSlug').value = slug;
}

// ============ MODALS ============
function setupModalListeners() {
  // Close buttons
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.target.closest('.modal').classList.remove('show');
    });
  });

  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.target.closest('.modal').classList.remove('show');
    });
  });

  // Close when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.classList.remove('show');
    }
  });
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('show');
}

// ============ UTILITIES ============
function showMessage(message, type = 'info') {
  const container = document.getElementById('messageContainer');
  const messageEl = document.createElement('div');
  messageEl.className = `message ${type}`;
  messageEl.textContent = message;

  container.appendChild(messageEl);

  setTimeout(() => {
    messageEl.remove();
  }, 4000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function logout() {
  try {
    const response = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });

    if (response.ok) {
      window.location.href = 'index.html';
    }
  } catch (error) {
    logger.error('Logout failed:', error);
    window.location.href = 'index.html';
  }
}
