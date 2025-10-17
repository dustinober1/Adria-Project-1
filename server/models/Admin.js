const User = require('./User');
const { query, get } = require('../database/sqlite');
const logger = require('../utils/logger');

class Admin {
  // Check if user is admin
  static async isAdmin(userId) {
    try {
      const user = await User.findById(userId);
      return user?.is_admin || false;
    } catch (error) {
      logger.error('Error checking admin status:', error);
      return false;
    }
  }

  // Promote user to admin
  static async promoteToAdmin(userId) {
    try {
      const result = await User.updateAdminStatus(userId, true);
      return result;
    } catch (error) {
      logger.error('Error promoting user to admin:', error);
      throw error;
    }
  }

  // Demote admin to regular user
  static async demoteFromAdmin(userId) {
    try {
      const result = await User.updateAdminStatus(userId, false);
      return result;
    } catch (error) {
      logger.error('Error demoting admin from admin:', error);
      throw error;
    }
  }

  // Get all admin users
  static async findAllAdmins() {
    try {
      const users = await User.findAll();
      return users.filter(u => u.is_admin);
    } catch (error) {
      logger.error('Error finding all admins:', error);
      throw error;
    }
  }

  // Get admin statistics
  static async getStatistics() {
    try {
      const stats = {};
      
      // Total users
      const allUsers = await User.findAll();
      stats.totalUsers = allUsers.length;

      // Total articles
      const articlesResult = await query('SELECT COUNT(*) as count FROM blog_articles');
      stats.totalArticles = articlesResult.rows[0].count;

      // Published articles
      const publishedResult = await query('SELECT COUNT(*) as count FROM blog_articles WHERE published = 1');
      stats.publishedArticles = publishedResult.rows[0].count;

      // Draft articles
      stats.draftArticles = stats.totalArticles - stats.publishedArticles;

      // Total admins
      stats.totalAdmins = allUsers.filter(u => u.is_admin).length;

      // Total email subscribers
      const emailResult = await query('SELECT COUNT(*) as count FROM email_list WHERE subscribed = 1');
      stats.totalEmailSubscribers = emailResult.rows[0].count;

      // Security events in last 24 hours
      const securityResult = await query(
        'SELECT COUNT(*) as count FROM security_events WHERE created_at > datetime("now", "-1 day")'
      );
      stats.recentSecurityEvents = securityResult.rows[0].count;

      // Failed login attempts in last 24 hours
      const failedLoginResult = await query(
        'SELECT COUNT(*) as count FROM failed_login_attempts WHERE attempt_time > datetime("now", "-1 day")'
      );
      stats.recentFailedLogins = failedLoginResult.rows[0].count;

      return stats;
    } catch (error) {
      logger.error('Error getting admin statistics:', error);
      throw error;
    }
  }

  // Get recent security events
  static async getRecentSecurityEvents(limit = 50) {
    try {
      const result = await query(
        `SELECT se.*, u.email as user_email 
         FROM security_events se 
         LEFT JOIN users u ON se.user_id = u.id 
         ORDER BY se.created_at DESC 
         LIMIT ?`,
        [limit]
      );
      
      return result.rows.map(event => ({
        ...event,
        metadata: event.metadata ? JSON.parse(event.metadata) : null
      }));
    } catch (error) {
      logger.error('Error getting recent security events:', error);
      throw error;
    }
  }

  // Get recent failed login attempts
  static async getRecentFailedLogins(limit = 50) {
    try {
      const result = await query(
        'SELECT * FROM failed_login_attempts ORDER BY attempt_time DESC LIMIT ?',
        [limit]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error getting recent failed logins:', error);
      throw error;
    }
  }

  // Clear old security events
  static async clearOldSecurityEvents(daysOld = 30) {
    try {
      const result = await query(
        'DELETE FROM security_events WHERE created_at < datetime("now", "-' + daysOld + ' days")'
      );
      return result.changes || 0;
    } catch (error) {
      logger.error('Error clearing old security events:', error);
      throw error;
    }
  }

  // Clear old failed login attempts
  static async clearOldFailedLogins(daysOld = 30) {
    try {
      const result = await query(
        'DELETE FROM failed_login_attempts WHERE attempt_time < datetime("now", "-' + daysOld + ' days")'
      );
      return result.changes || 0;
    } catch (error) {
      logger.error('Error clearing old failed logins:', error);
      throw error;
    }
  }
}

module.exports = Admin;
