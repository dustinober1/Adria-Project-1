const User = require('./User');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');
const logger = require('../utils/logger');

const ARTICLES_CSV_PATH = path.join(__dirname, '..', '..', 'data', 'blog_articles.csv');

// Get all articles from CSV
const getAllArticlesFromCSV = () => {
  try {
    if (!fs.existsSync(ARTICLES_CSV_PATH)) {
      return [];
    }
    const fileContent = fs.readFileSync(ARTICLES_CSV_PATH, 'utf-8');
    if (!fileContent.trim()) {
      return [];
    }
    return csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
  } catch (error) {
    logger.error('Error reading articles CSV:', error);
    return [];
  }
};

class Admin {
  // Check if user is admin
  static async isAdmin(userId) {
    const user = await User.findById(userId);
    return user?.is_admin || false;
  }

  // Promote user to admin
  static async promoteToAdmin(userId) {
    const result = await User.updateAdminStatus(userId, true);
    return result;
  }

  // Demote admin to regular user
  static async demoteFromAdmin(userId) {
    const result = await User.updateAdminStatus(userId, false);
    return result;
  }

  // Get all admin users
  static async findAllAdmins() {
    const users = await User.findAll();
    return users.filter(u => u.is_admin);
  }

  // Get admin statistics
  static async getStatistics() {
    const stats = {};
    
    // Total users
    const allUsers = await User.findAll();
    stats.totalUsers = allUsers.length;

    // Total articles
    const articles = getAllArticlesFromCSV();
    stats.totalArticles = articles.length;

    // Published articles
    stats.publishedArticles = articles.filter(a => a.published === 'true').length;

    // Draft articles
    stats.draftArticles = articles.filter(a => a.published !== 'true').length;

    // Total admins
    stats.totalAdmins = allUsers.filter(u => u.is_admin).length;

    return stats;
  }
}

module.exports = Admin;
