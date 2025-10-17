const SecurityService = require('../services/securityService');
const logger = require('../utils/logger');

/**
 * Security middleware for enhanced security monitoring and protection
 */
class SecurityMiddleware {
  /**
   * Middleware to log security events for all requests
   */
  static securityLogger() {
    return async (req, res, next) => {
      const startTime = Date.now();
      
      // Store original end function
      const originalEnd = res.end;
      
      // Override end function to capture response
      res.end = function(chunk, encoding) {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;
        
        // Log security-relevant events
        if (statusCode >= 400 || req.path.includes('/api/')) {
          const eventType = statusCode >= 400 ? 'http_error' : 'api_request';
          const severity = statusCode >= 500 ? 'high' : statusCode >= 400 ? 'medium' : 'low';
          
          SecurityService.logSecurityEvent({
            eventType,
            severity,
            userId: req.user?.id || null,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            description: `${req.method} ${req.path} - ${statusCode}`,
            metadata: {
              method: req.method,
              path: req.path,
              statusCode,
              duration,
              query: req.query,
              body: req.method !== 'GET' ? SecurityMiddleware.sanitizeRequestBody(req.body) : undefined
            }
          }).catch(err => logger.error('Failed to log security event:', err));
        }
        
        // Call original end function
        originalEnd.call(this, chunk, encoding);
      };
      
      next();
    };
  }

  /**
   * Middleware to implement API rate limiting
   * @param {Object} options - Rate limiting options
   * @param {number} options.maxRequests - Maximum requests per window
   * @param {number} options.windowMinutes - Time window in minutes
   */
  static apiRateLimit(options = {}) {
    const { maxRequests = 100, windowMinutes = 15 } = options;
    
    return async (req, res, next) => {
      try {
        const ipAddress = req.ip || req.connection.remoteAddress;
        const endpoint = `${req.method} ${req.route?.path || req.path}`;
        
        const isLimited = await SecurityService.isApiRateLimited(
          ipAddress, 
          endpoint, 
          maxRequests, 
          windowMinutes
        );
        
        if (isLimited) {
          return res.status(429).json({
            success: false,
            message: 'Too many requests. Please try again later.',
            retryAfter: windowMinutes * 60
          });
        }
        
        next();
      } catch (error) {
        logger.error('Rate limiting error:', error);
        // Fail open - allow request if rate limiting fails
        next();
      }
    };
  }

  /**
   * Middleware to enhance login rate limiting
   */
  static loginRateLimit() {
    return async (req, res, next) => {
      try {
        const ipAddress = req.ip || req.connection.remoteAddress;
        
        const isLimited = await SecurityService.isRateLimited(ipAddress, 5, 15);
        
        if (isLimited) {
          await SecurityService.logSecurityEvent({
            eventType: 'login_rate_limit_exceeded',
            severity: 'high',
            ipAddress,
            userAgent: req.get('User-Agent'),
            description: 'Login rate limit exceeded',
            metadata: { email: req.body?.email }
          });
          
          return res.status(429).json({
            success: false,
            message: 'Too many login attempts. Please try again in 15 minutes.',
            retryAfter: 900
          });
        }
        
        next();
      } catch (error) {
        logger.error('Login rate limiting error:', error);
        // Fail secure - block if rate limiting fails
        return res.status(429).json({
          success: false,
          message: 'Service temporarily unavailable. Please try again later.'
        });
      }
    };
  }

  /**
   * Middleware to detect suspicious activity patterns
   */
  static suspiciousActivityDetection() {
    const requestPatterns = new Map();
    
    return async (req, res, next) => {
      const ipAddress = req.ip || req.connection.remoteAddress;
      const now = Date.now();
      
      // Track request patterns
      if (!requestPatterns.has(ipAddress)) {
        requestPatterns.set(ipAddress, []);
      }
      
      const userRequests = requestPatterns.get(ipAddress);
      userRequests.push({ time: now, path: req.path, method: req.method });
      
      // Clean old requests (older than 1 minute)
      const oneMinuteAgo = now - 60000;
      const recentRequests = userRequests.filter(req => req.time > oneMinuteAgo);
      requestPatterns.set(ipAddress, recentRequests);
      
      // Detect suspicious patterns
      const suspiciousPatterns = [
        // Too many requests in short time
        recentRequests.length > 50,
        // Rapid path traversal attempts
        recentRequests.filter(req => req.path.includes('../')).length > 3,
        // SQL injection attempts
        recentRequests.filter(req => 
          req.path.toLowerCase().includes('select') || 
          req.path.toLowerCase().includes('union') ||
          req.path.toLowerCase().includes('drop')
        ).length > 2,
        // XSS attempts
        recentRequests.filter(req => 
          req.path.toLowerCase().includes('<script') ||
          req.path.toLowerCase().includes('javascript:')
        ).length > 2
      ];
      
      if (suspiciousPatterns.some(pattern => pattern)) {
        await SecurityService.logSecurityEvent({
          eventType: 'suspicious_activity',
          severity: 'high',
          ipAddress,
          userAgent: req.get('User-Agent'),
          description: 'Suspicious activity pattern detected',
          metadata: {
            recentRequests: recentRequests.slice(-10),
            totalRecentRequests: recentRequests.length
          }
        });
        
        // Optionally block the request
        if (recentRequests.length > 100) {
          return res.status(429).json({
            success: false,
            message: 'Suspicious activity detected. Please slow down your requests.'
          });
        }
      }
      
      next();
    };
  }

  /**
   * Middleware to validate and sanitize request headers
   */
  static headerValidation() {
    return (req, res, next) => {
      // Check for suspicious headers
      const suspiciousHeaders = [
        'x-forwarded-for',
        'x-real-ip',
        'x-originating-ip',
        'x-remote-ip',
        'x-remote-addr'
      ];
      
      const suspiciousValues = [];
      suspiciousHeaders.forEach(header => {
        const value = req.get(header);
        if (value) {
          // Check for IP spoofing attempts
          if (value.includes(',') || value.includes(' ') || value.length > 45) {
            suspiciousValues.push({ header, value });
          }
        }
      });
      
      if (suspiciousValues.length > 0) {
        SecurityService.logSecurityEvent({
          eventType: 'suspicious_headers',
          severity: 'medium',
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          description: 'Suspicious request headers detected',
          metadata: { suspiciousHeaders: suspiciousValues }
        }).catch(err => logger.error('Failed to log suspicious headers:', err));
      }
      
      // Validate Content-Type for POST/PUT requests
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const contentType = req.get('Content-Type');
        if (contentType && !contentType.includes('application/json') && !contentType.includes('multipart/form-data') && !contentType.includes('application/x-www-form-urlencoded')) {
          SecurityService.logSecurityEvent({
            eventType: 'invalid_content_type',
            severity: 'low',
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            description: `Invalid Content-Type: ${contentType}`,
            metadata: { method: req.method, contentType }
          }).catch(err => logger.error('Failed to log invalid content type:', err));
        }
      }
      
      next();
    };
  }

  /**
   * Helper method to sanitize request body for logging
   * @param {Object} body - Request body
   * @returns {Object} - Sanitized body
   */
  static sanitizeRequestBody(body) {
    if (!body || typeof body !== 'object') {
      return body;
    }
    
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  /**
   * Middleware to log successful authentication
   */
  static authSuccessLogger() {
    return async (req, res, next) => {
      // Store original json function
      const originalJson = res.json;
      
      res.json = function(data) {
        // Log successful authentication
        if (res.statusCode === 200 && req.path.includes('/login') && data.success) {
          SecurityService.logSecurityEvent({
            eventType: 'successful_login',
            severity: 'low',
            userId: req.user?.id || null,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            description: `Successful login for user: ${req.body?.email || 'unknown'}`,
            metadata: { email: req.body?.email }
          }).catch(err => logger.error('Failed to log successful login:', err));
        }
        
        // Call original json function
        return originalJson.call(this, data);
      };
      
      next();
    };
  }

  /**
   * Middleware to log admin actions
   */
  static adminActionLogger() {
    return async (req, res, next) => {
      if (req.user && req.user.is_admin && req.path.startsWith('/api/admin')) {
        await SecurityService.logSecurityEvent({
          eventType: 'admin_action',
          severity: 'medium',
          userId: req.user.id,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          description: `Admin action: ${req.method} ${req.path}`,
          metadata: {
            method: req.method,
            path: req.path,
            query: req.query,
            body: SecurityMiddleware.sanitizeRequestBody(req.body)
          }
        });
      }
      
      next();
    };
  }
}

module.exports = SecurityMiddleware;
