const { query } = require('../database/db');

class Admin {
  // Check if user is admin
  static async isAdmin(userId) {
    const result = await query(
      'SELECT is_admin FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0]?.is_admin || false;
  }

  // Promote user to admin
  static async promoteToAdmin(userId) {
    const result = await query(
      'UPDATE users SET is_admin = true WHERE id = $1 RETURNING id, email, is_admin',
      [userId]
    );
    return result.rows[0];
  }

  // Demote admin to regular user
  static async demoteFromAdmin(userId) {
    const result = await query(
      'UPDATE users SET is_admin = false WHERE id = $1 RETURNING id, email, is_admin',
      [userId]
    );
    return result.rows[0];
  }

  // Get all admin users
  static async findAllAdmins() {
    const result = await query(
      'SELECT id, email, first_name, last_name, is_admin, created_at FROM users WHERE is_admin = true ORDER BY created_at DESC'
    );
    return result.rows;
  }

  // Get admin statistics
  static async getStatistics() {
    const stats = {};
    
    // Total users
    const usersResult = await query('SELECT COUNT(*) as count FROM users');
    stats.totalUsers = parseInt(usersResult.rows[0].count);

    // Total articles
    const articlesResult = await query('SELECT COUNT(*) as count FROM blog_articles');
    stats.totalArticles = parseInt(articlesResult.rows[0].count);

    // Published articles
    const publishedResult = await query('SELECT COUNT(*) as count FROM blog_articles WHERE published = true');
    stats.publishedArticles = parseInt(publishedResult.rows[0].count);

    // Draft articles
    const draftResult = await query('SELECT COUNT(*) as count FROM blog_articles WHERE published = false');
    stats.draftArticles = parseInt(draftResult.rows[0].count);

    // Total admins
    const adminsResult = await query('SELECT COUNT(*) as count FROM users WHERE is_admin = true');
    stats.totalAdmins = parseInt(adminsResult.rows[0].count);

    return stats;
  }
}

module.exports = Admin;
