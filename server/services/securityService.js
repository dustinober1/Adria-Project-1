const { query, run } = require('../database/sqlite');
const logger = require('../utils/logger');

class SecurityService {
  /**
   * Log a security event to the database
   * @param {Object} eventData - Security event data
   * @param {string} eventData.eventType - Type of security event
   * @param {string} eventData.severity - Severity level (low, medium, high, critical)
   * @param {number} eventData.userId - User ID if applicable
   * @param {string} eventData.ipAddress - IP address
   * @param {string} eventData.userAgent - User agent string
   * @param {string} eventData.description - Event description
   * @param {Object} eventData.metadata - Additional metadata as JSON
   */
  static async logSecurityEvent(eventData) {
    try {
      const {
        eventType,
        severity = 'medium',
        userId = null,
        ipAddress = null,
        userAgent = null,
        description = '',
        metadata = {}
      } = eventData;

      const result = await run(
        `INSERT INTO security_events 
         (event_type, severity, user_id, ip_address, user_agent, description, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [eventType, severity, userId, ipAddress, userAgent, description, JSON.stringify(metadata)]
      );

      logger.log(`Security event logged: ${eventType} - ${severity}`, {
        eventId: result.lastID,
        userId,
        ipAddress
      });

      return { id: result.lastID, created_at: new Date().toISOString() };
    } catch (error) {
      logger.error('Failed to log security event:', error);
      throw error;
    }
  }

  /**
   * Log a failed login attempt
   * @param {string} email - Email address used for login attempt
   * @param {string} ipAddress - IP address of the attempt
   * @param {string} userAgent - User agent string
   * @param {string} reason - Reason for failure
   */
  static async logFailedLogin(email, ipAddress, userAgent, reason = 'invalid_credentials') {
    try {
      await run(
        `INSERT INTO failed_login_attempts 
         (email, ip_address, user_agent, reason)
         VALUES (?, ?, ?, ?)`,
        [email, ipAddress, userAgent, reason]
      );

      // Also log as a security event
      await this.logSecurityEvent({
        eventType: 'failed_login',
        severity: 'medium',
        ipAddress,
        userAgent,
        description: `Failed login attempt for email: ${email}`,
        metadata: { email, reason }
      });

      logger.log(`Failed login attempt logged: ${email} from ${ipAddress}`);
    } catch (error) {
      logger.error('Failed to log failed login attempt:', error);
      throw error;
    }
  }

  /**
   * Check if IP address has exceeded rate limit for failed logins
   * @param {string} ipAddress - IP address to check
   * @param {number} maxAttempts - Maximum allowed attempts (default: 5)
   * @param {number} windowMinutes - Time window in minutes (default: 15)
   * @returns {Promise<boolean>} - True if rate limited
   */
  static async isRateLimited(ipAddress, maxAttempts = 5, windowMinutes = 15) {
    try {
      const result = await query(
        `SELECT COUNT(*) as attempt_count 
         FROM failed_login_attempts 
         WHERE ip_address = ? 
         AND attempt_time > datetime('now', '-${windowMinutes} minutes')`,
        [ipAddress]
      );

      const attemptCount = result.rows[0].attempt_count;
      return attemptCount >= maxAttempts;
    } catch (error) {
      logger.error('Failed to check rate limit:', error);
      // Fail secure - if we can't check, assume rate limited
      return true;
    }
  }

  /**
   * Check API rate limit for an endpoint
   * @param {string} ipAddress - IP address
   * @param {string} endpoint - API endpoint
   * @param {number} maxRequests - Maximum requests per window
   * @param {number} windowMinutes - Time window in minutes
   * @returns {Promise<boolean>} - True if rate limited
   */
  static async isApiRateLimited(ipAddress, endpoint, maxRequests = 100, windowMinutes = 15) {
    try {
      // Clean old entries first
      await run(
        `DELETE FROM api_rate_limits 
         WHERE window_start < datetime('now', '-${windowMinutes} minutes')`
      );

      // Check current window
      const result = await query(
        `SELECT request_count, window_start 
         FROM api_rate_limits 
         WHERE ip_address = ? AND endpoint = ? 
         AND window_start > datetime('now', '-${windowMinutes} minutes')`,
        [ipAddress, endpoint]
      );

      if (result.rows.length === 0) {
        // First request in window
        await run(
          `INSERT INTO api_rate_limits 
           (ip_address, endpoint, request_count, window_start)
           VALUES (?, ?, 1, datetime('now'))`,
          [ipAddress, endpoint]
        );
        return false;
      }

      const currentCount = result.rows[0].request_count;
      if (currentCount >= maxRequests) {
        // Log rate limit exceeded
        await this.logSecurityEvent({
          eventType: 'rate_limit_exceeded',
          severity: 'medium',
          ipAddress,
          description: `API rate limit exceeded for ${endpoint}`,
          metadata: { endpoint, currentCount, maxRequests }
        });
        return true;
      }

      // Increment counter
      await run(
        `UPDATE api_rate_limits 
         SET request_count = request_count + 1, 
             last_request = datetime('now')
         WHERE ip_address = ? AND endpoint = ?`,
        [ipAddress, endpoint]
      );

      return false;
    } catch (error) {
      logger.error('Failed to check API rate limit:', error);
      // Fail secure
      return true;
    }
  }

  /**
   * Get security events with filtering options
   * @param {Object} filters - Filter options
   * @param {string} filters.eventType - Filter by event type
   * @param {string} filters.severity - Filter by severity
   * @param {number} filters.userId - Filter by user ID
   * @param {string} filters.ipAddress - Filter by IP address
   * @param {Date} filters.startDate - Start date filter
   * @param {Date} filters.endDate - End date filter
   * @param {number} filters.limit - Limit results
   * @param {number} filters.offset - Offset for pagination
   * @returns {Promise<Array>} - Array of security events
   */
  static async getSecurityEvents(filters = {}) {
    try {
      let queryText = `
        SELECT se.*, u.email as user_email 
        FROM security_events se 
        LEFT JOIN users u ON se.user_id = u.id 
        WHERE 1=1
      `;
      const queryParams = [];

      if (filters.eventType) {
        queryText += ` AND se.event_type = ?`;
        queryParams.push(filters.eventType);
      }

      if (filters.severity) {
        queryText += ` AND se.severity = ?`;
        queryParams.push(filters.severity);
      }

      if (filters.userId) {
        queryText += ` AND se.user_id = ?`;
        queryParams.push(filters.userId);
      }

      if (filters.ipAddress) {
        queryText += ` AND se.ip_address = ?`;
        queryParams.push(filters.ipAddress);
      }

      if (filters.startDate) {
        queryText += ` AND se.created_at >= ?`;
        queryParams.push(filters.startDate);
      }

      if (filters.endDate) {
        queryText += ` AND se.created_at <= ?`;
        queryParams.push(filters.endDate);
      }

      queryText += ` ORDER BY se.created_at DESC`;

      if (filters.limit) {
        queryText += ` LIMIT ?`;
        queryParams.push(filters.limit);
      }

      if (filters.offset) {
        queryText += ` OFFSET ?`;
        queryParams.push(filters.offset);
      }

      const result = await query(queryText, queryParams);
      return result.rows.map(event => ({
        ...event,
        metadata: event.metadata ? JSON.parse(event.metadata) : null
      }));
    } catch (error) {
      logger.error('Failed to get security events:', error);
      throw error;
    }
  }

  /**
   * Get security statistics for dashboard
   * @param {number} days - Number of days to look back
   * @returns {Promise<Object>} - Security statistics
   */
  static async getSecurityStats(days = 7) {
    try {
      const result = await query(
        `SELECT 
          COUNT(*) as total_events,
          COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_events,
          COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_events,
          COUNT(CASE WHEN severity = 'medium' THEN 1 END) as medium_events,
          COUNT(CASE WHEN severity = 'low' THEN 1 END) as low_events,
          COUNT(CASE WHEN event_type = 'failed_login' THEN 1 END) as failed_logins,
          COUNT(CASE WHEN event_type = 'rate_limit_exceeded' THEN 1 END) as rate_limit_hits,
          COUNT(DISTINCT ip_address) as unique_ips
         FROM security_events 
         WHERE created_at > datetime('now', '-${days} days')`
      );

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get security stats:', error);
      throw error;
    }
  }

  /**
   * Clean old security data to prevent database bloat
   * @param {number} daysToKeep - Number of days to keep data
   */
  static async cleanupOldData(daysToKeep = 90) {
    try {
      const result = await run(
        `DELETE FROM security_events 
         WHERE created_at < datetime('now', '-${daysToKeep} days')`
      );

      await run(
        `DELETE FROM failed_login_attempts 
         WHERE attempt_time < datetime('now', '-${daysToKeep} days')`
      );

      await run(
        `DELETE FROM api_rate_limits 
         WHERE window_start < datetime('now', '-1 hour')`
      );

      logger.log(`Cleaned up old security data. Removed ${result.changes} security events.`);
      return result.changes;
    } catch (error) {
      logger.error('Failed to cleanup old security data:', error);
      throw error;
    }
  }
}

module.exports = SecurityService;
