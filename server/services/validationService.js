const Joi = require('joi');

/**
 * Secure validation service using Joi as an alternative to validator package
 */
class ValidationService {
  /**
   * User registration validation schema
   */
  static userRegistrationSchema = Joi.object({
    email: Joi.string()
      .email({ 
        minDomainSegments: 2, 
        tlds: { allow: ['com', 'org', 'net', 'edu', 'gov', 'mil', 'int', 'io', 'co', 'us', 'uk', 'ca', 'au'] }
      })
      .max(254)
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'string.max': 'Email address must be less than 254 characters',
        'any.required': 'Email is required'
      }),
    
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password must be less than 128 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'Password is required'
      }),
    
    firstName: Joi.string()
      .trim()
      .min(1)
      .max(50)
      .pattern(/^[a-zA-Z\s'-]+$/)
      .required()
      .messages({
        'string.min': 'First name cannot be empty',
        'string.max': 'First name must be less than 50 characters',
        'string.pattern.base': 'First name can only contain letters, spaces, hyphens, and apostrophes',
        'any.required': 'First name is required'
      }),
    
    lastName: Joi.string()
      .trim()
      .min(1)
      .max(50)
      .pattern(/^[a-zA-Z\s'-]+$/)
      .required()
      .messages({
        'string.min': 'Last name cannot be empty',
        'string.max': 'Last name must be less than 50 characters',
        'string.pattern.base': 'Last name can only contain letters, spaces, hyphens, and apostrophes',
        'any.required': 'Last name is required'
      })
  });

  /**
   * User login validation schema
   */
  static userLoginSchema = Joi.object({
    email: Joi.string()
      .email({ 
        minDomainSegments: 2, 
        tlds: { allow: ['com', 'org', 'net', 'edu', 'gov', 'mil', 'int', 'io', 'co', 'us', 'uk', 'ca', 'au'] }
      })
      .max(254)
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'string.max': 'Email address must be less than 254 characters',
        'any.required': 'Email is required'
      }),
    
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required'
      })
  });

  /**
   * Email list subscription validation schema
   */
  static emailListSchema = Joi.object({
    email: Joi.string()
      .email({ 
        minDomainSegments: 2, 
        tlds: { allow: ['com', 'org', 'net', 'edu', 'gov', 'mil', 'int', 'io', 'co', 'us', 'uk', 'ca', 'au'] }
      })
      .max(254)
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'string.max': 'Email address must be less than 254 characters',
        'any.required': 'Email is required'
      }),
    
    name: Joi.string()
      .trim()
      .min(1)
      .max(100)
      .pattern(/^[a-zA-Z\s'-]+$/)
      .optional()
      .messages({
        'string.min': 'Name cannot be empty',
        'string.max': 'Name must be less than 100 characters',
        'string.pattern.base': 'Name can only contain letters, spaces, hyphens, and apostrophes'
      }),
    
    phone: Joi.string()
      .pattern(/^[+]?[\d\s\-\(\)]+$/)
      .max(20)
      .optional()
      .messages({
        'string.pattern.base': 'Please provide a valid phone number',
        'string.max': 'Phone number must be less than 20 characters'
      }),
    
    message: Joi.string()
      .trim()
      .max(1000)
      .optional()
      .messages({
        'string.max': 'Message must be less than 1000 characters'
      })
  });

  /**
   * Blog article validation schema
   */
  static blogArticleSchema = Joi.object({
    title: Joi.string()
      .trim()
      .min(1)
      .max(255)
      .required()
      .messages({
        'string.min': 'Title cannot be empty',
        'string.max': 'Title must be less than 255 characters',
        'any.required': 'Title is required'
      }),
    
    slug: Joi.string()
      .trim()
      .min(1)
      .max(255)
      .pattern(/^[a-z0-9-]+$/)
      .required()
      .messages({
        'string.min': 'Slug cannot be empty',
        'string.max': 'Slug must be less than 255 characters',
        'string.pattern.base': 'Slug can only contain lowercase letters, numbers, and hyphens',
        'any.required': 'Slug is required'
      }),
    
    content: Joi.string()
      .trim()
      .min(10)
      .max(100000)
      .required()
      .messages({
        'string.min': 'Content must be at least 10 characters long',
        'string.max': 'Content must be less than 100,000 characters',
        'any.required': 'Content is required'
      }),
    
    excerpt: Joi.string()
      .trim()
      .max(500)
      .optional()
      .messages({
        'string.max': 'Excerpt must be less than 500 characters'
      }),
    
    featuredImage: Joi.string()
      .uri()
      .max(500)
      .optional()
      .messages({
        'string.uri': 'Featured image must be a valid URL',
        'string.max': 'Featured image URL must be less than 500 characters'
      }),
    
    published: Joi.boolean()
      .default(false)
      .optional()
  });

  /**
   * Security event query validation schema
   */
  static securityEventQuerySchema = Joi.object({
    eventType: Joi.string()
      .valid('login', 'logout', 'failed_login', 'admin_action', 'api_request', 'http_error', 'suspicious_activity', 'rate_limit_exceeded')
      .optional(),
    
    severity: Joi.string()
      .valid('low', 'medium', 'high', 'critical')
      .optional(),
    
    userId: Joi.number()
      .integer()
      .positive()
      .optional(),
    
    ipAddress: Joi.string()
      .ip({ version: ['ipv4', 'ipv6'] })
      .optional(),
    
    startDate: Joi.date()
      .iso()
      .optional(),
    
    endDate: Joi.date()
      .iso()
      .min(Joi.ref('startDate'))
      .optional(),
    
    limit: Joi.number()
      .integer()
      .min(1)
      .max(1000)
      .default(50)
      .optional(),
    
    offset: Joi.number()
      .integer()
      .min(0)
      .default(0)
      .optional()
  });

  /**
   * Validate data against a schema
   * @param {Object} data - Data to validate
   * @param {Object} schema - Joi validation schema
   * @returns {Object} - Validation result
   */
  static validate(data, schema) {
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return {
        isValid: false,
        errors,
        data: null
      };
    }

    return {
      isValid: true,
      errors: [],
      data: value
    };
  }

  /**
   * Sanitize HTML content (basic XSS prevention)
   * @param {string} content - Content to sanitize
   * @returns {string} - Sanitized content
   */
  static sanitizeHtml(content) {
    if (typeof content !== 'string') {
      return content;
    }

    return content
      // Remove script tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove on* attributes (onclick, onload, etc.)
      .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
      // Remove javascript: URLs
      .replace(/javascript:/gi, '')
      // Remove vbscript: URLs
      .replace(/vbscript:/gi, '')
      // Remove data: URLs that could contain scripts
      .replace(/data:(?!image\/)/gi, '')
      // Remove iframe tags
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      // Remove object tags
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      // Remove embed tags
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      // Remove form tags
      .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
      // Remove input tags
      .replace(/<input[^>]*>/gi, '')
      // Remove style tags with potentially malicious content
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  }

  /**
   * Validate and sanitize user input
   * @param {Object} data - Input data
   * @param {Array} sanitizeFields - Fields to sanitize for HTML
   * @param {Object} schema - Joi schema for validation
   * @returns {Object} - Validation and sanitization result
   */
  static validateAndSanitize(data, sanitizeFields = [], schema) {
    // First sanitize specified fields
    const sanitizedData = { ...data };
    sanitizeFields.forEach(field => {
      if (sanitizedData[field]) {
        sanitizedData[field] = this.sanitizeHtml(sanitizedData[field]);
      }
    });

    // Then validate against schema
    return this.validate(sanitizedData, schema);
  }

  /**
   * Validate URL safely without the vulnerable validator package
   * @param {string} url - URL to validate
   * @returns {boolean} - True if valid URL
   */
  static isValidUrl(url) {
    if (typeof url !== 'string') {
      return false;
    }

    try {
      // Basic URL structure validation
      const urlPattern = /^https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)?$/;
      
      if (!urlPattern.test(url)) {
        return false;
      }

      // Additional security checks
      const parsedUrl = new URL(url);
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return false;
      }

      // Prevent localhost in production
      if (process.env.NODE_ENV === 'production') {
        const hostname = parsedUrl.hostname.toLowerCase();
        if (hostname === 'localhost' || hostname.startsWith('127.') || hostname.startsWith('192.168.')) {
          return false;
        }
      }

      // Prevent javascript: and data: URLs
      if (url.toLowerCase().includes('javascript:') || url.toLowerCase().includes('data:')) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate file upload safely
   * @param {Object} file - File object
   * @param {Array} allowedTypes - Allowed MIME types
   * @param {number} maxSize - Maximum file size in bytes
   * @returns {Object} - Validation result
   */
  static validateFile(file, allowedTypes = [], maxSize = 5 * 1024 * 1024) {
    if (!file) {
      return {
        isValid: false,
        errors: [{ message: 'No file provided' }]
      };
    }

    const errors = [];

    // Check file size
    if (file.size > maxSize) {
      errors.push({ 
        message: `File size exceeds maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB` 
      });
    }

    // Check file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
      errors.push({ 
        message: `File type ${file.mimetype} is not allowed. Allowed types: ${allowedTypes.join(', ')}` 
      });
    }

    // Check for dangerous file extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.js', '.vbs', '.jar', '.app', '.deb', '.pkg', '.dmg'];
    const fileExtension = file.originalname?.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (dangerousExtensions.includes(fileExtension)) {
      errors.push({ message: 'Dangerous file type not allowed' });
    }

    return {
      isValid: errors.length === 0,
      errors,
      file
    };
  }
}

module.exports = ValidationService;
