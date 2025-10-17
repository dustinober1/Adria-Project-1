const SecurityService = require('../services/securityService');
const logger = require('../utils/logger');

/**
 * Security Controller for admin security monitoring
 */
class SecurityController {
  /**
   * Get security statistics for dashboard
   */
  static async getSecurityStats(req, res) {
    try {
      const { days = 7 } = req.query;
      const stats = await SecurityService.getSecurityStats(parseInt(days));

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Failed to get security stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve security statistics'
      });
    }
  }

  /**
   * Get security events with filtering
   */
  static async getSecurityEvents(req, res) {
    try {
      const filters = {
        eventType: req.query.eventType,
        severity: req.query.severity,
        userId: req.query.userId ? parseInt(req.query.userId) : undefined,
        ipAddress: req.query.ipAddress,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        limit: req.query.limit ? parseInt(req.query.limit) : 50,
        offset: req.query.offset ? parseInt(req.query.offset) : 0
      };

      // Validate query parameters
      const validation = require('../services/validationService').validate(
        filters, 
        require('../services/validationService').securityEventQuerySchema
      );

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: validation.errors
        });
      }

      const events = await SecurityService.getSecurityEvents(validation.data);

      res.json({
        success: true,
        data: events,
        pagination: {
          limit: validation.data.limit,
          offset: validation.data.offset,
          total: events.length
        }
      });
    } catch (error) {
      logger.error('Failed to get security events:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve security events'
      });
    }
  }

  /**
   * Get recent security alerts (high and critical severity)
   */
  static async getSecurityAlerts(req, res) {
    try {
      const { hours = 24 } = req.query;
      const hoursAgo = new Date(Date.now() - (parseInt(hours) * 60 * 60 * 1000));

      const alerts = await SecurityService.getSecurityEvents({
        severity: ['high', 'critical'],
        startDate: hoursAgo,
        limit: 100
      });

      res.json({
        success: true,
        data: alerts,
        count: alerts.length
      });
    } catch (error) {
      logger.error('Failed to get security alerts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve security alerts'
      });
    }
  }

  /**
   * Get failed login attempts analysis
   */
  static async getFailedLoginAnalysis(req, res) {
    try {
      const { hours = 24 } = req.query;
      const hoursAgo = new Date(Date.now() - (parseInt(hours) * 60 * 60 * 1000));

      // Get failed login events
      const failedLogins = await SecurityService.getSecurityEvents({
        eventType: 'failed_login',
        startDate: hoursAgo,
        limit: 1000
      });

      // Analyze patterns
      const ipAnalysis = {};
      const emailAnalysis = {};

      failedLogins.forEach(event => {
        const ip = event.ip_address;
        const email = event.metadata?.email;

        if (ip) {
          ipAnalysis[ip] = (ipAnalysis[ip] || 0) + 1;
        }

        if (email) {
          emailAnalysis[email] = (emailAnalysis[email] || 0) + 1;
        }
      });

      // Sort by frequency
      const topIPs = Object.entries(ipAnalysis)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([ip, count]) => ({ ip, count }));

      const topEmails = Object.entries(emailAnalysis)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([email, count]) => ({ email, count }));

      res.json({
        success: true,
        data: {
          totalFailedLogins: failedLogins.length,
          timeRange: `${hours} hours`,
          topIPs,
          topEmails,
          uniqueIPs: Object.keys(ipAnalysis).length,
          uniqueEmails: Object.keys(emailAnalysis).length
        }
      });
    } catch (error) {
      logger.error('Failed to get failed login analysis:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve failed login analysis'
      });
    }
  }

  /**
   * Get IP reputation analysis
   */
  static async getIPAnalysis(req, res) {
    try {
      const { ipAddress } = req.params;
      
      if (!ipAddress) {
        return res.status(400).json({
          success: false,
          message: 'IP address is required'
        });
      }

      // Get all events for this IP
      const events = await SecurityService.getSecurityEvents({
        ipAddress,
        limit: 100
      });

      // Analyze IP behavior
      const analysis = {
        ipAddress,
        totalEvents: events.length,
        eventTypes: {},
        severityBreakdown: {
          low: 0,
          medium: 0,
          high: 0,
          critical: 0
        },
        firstSeen: events.length > 0 ? events[events.length - 1].created_at : null,
        lastSeen: events.length > 0 ? events[0].created_at : null,
        recentActivity: events.slice(0, 10)
      };

      events.forEach(event => {
        // Count event types
        analysis.eventTypes[event.event_type] = (analysis.eventTypes[event.event_type] || 0) + 1;
        
        // Count severity levels
        analysis.severityBreakdown[event.severity] = (analysis.severityBreakdown[event.severity] || 0) + 1;
      });

      // Determine risk level
      const highRiskEvents = analysis.severityBreakdown.high + analysis.severityBreakdown.critical;
      const totalEvents = analysis.totalEvents;
      
      if (highRiskEvents > 5 || totalEvents > 50) {
        analysis.riskLevel = 'high';
      } else if (highRiskEvents > 2 || totalEvents > 20) {
        analysis.riskLevel = 'medium';
      } else {
        analysis.riskLevel = 'low';
      }

      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      logger.error('Failed to get IP analysis:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve IP analysis'
      });
    }
  }

  /**
   * Clean up old security data
   */
  static async cleanupOldData(req, res) {
    try {
      const { daysToKeep = 90 } = req.body;
      
      const deletedCount = await SecurityService.cleanupOldData(parseInt(daysToKeep));

      res.json({
        success: true,
        message: `Successfully cleaned up ${deletedCount} old security events`,
        deletedCount
      });
    } catch (error) {
      logger.error('Failed to cleanup old security data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cleanup old security data'
      });
    }
  }

  /**
   * Export security events as CSV
   */
  static async exportSecurityEvents(req, res) {
    try {
      const filters = {
        eventType: req.query.eventType,
        severity: req.query.severity,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        limit: 10000 // Limit for export
      };

      const events = await SecurityService.getSecurityEvents(filters);

      // Convert to CSV
      const csvHeader = 'ID,Event Type,Severity,User ID,IP Address,User Agent,Description,Created At\n';
      const csvData = events.map(event => [
        event.id,
        event.event_type,
        event.severity,
        event.user_id || '',
        event.ip_address || '',
        `"${(event.user_agent || '').replace(/"/g, '""')}"`, // Escape quotes
        `"${(event.description || '').replace(/"/g, '""')}"`,
        event.created_at
      ].join(',')).join('\n');

      const csv = csvHeader + csvData;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="security-events-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } catch (error) {
      logger.error('Failed to export security events:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export security events'
      });
    }
  }
}

module.exports = SecurityController;
