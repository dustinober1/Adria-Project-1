const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const User = require('../models/User');
const ValidationService = require('../services/validationService');
const SecurityService = require('../services/securityService');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Register a new user
const register = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Validate request using secure validation service
    const validation = ValidationService.validate(req.body, ValidationService.userRegistrationSchema);
    if (!validation.isValid) {
      await SecurityService.logSecurityEvent({
        eventType: 'registration_validation_failed',
        severity: 'medium',
        ipAddress,
        userAgent,
        description: 'User registration validation failed',
        metadata: { validationErrors: validation.errors, email: req.body.email }
      });

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    const { email, password, firstName, lastName } = validation.data;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      await SecurityService.logSecurityEvent({
        eventType: 'duplicate_registration_attempt',
        severity: 'medium',
        ipAddress,
        userAgent,
        description: 'Attempt to register with existing email',
        metadata: { email }
      });

      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName
    });

    // Log successful registration
    await SecurityService.logSecurityEvent({
      eventType: 'user_registered',
      severity: 'low',
      userId: user.id,
      ipAddress,
      userAgent,
      description: `New user registered: ${email}`,
      metadata: { email, userId: user.id }
    });

    // Generate token
    const token = generateToken(user.id);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      },
      token
    });
  } catch (error) {
    logger.error('Registration error:', error);
    
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    await SecurityService.logSecurityEvent({
      eventType: 'registration_error',
      severity: 'medium',
      ipAddress,
      userAgent,
      description: 'Registration process failed',
      metadata: { error: error.message, email: req.body.email }
    });

    res.status(400).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'Registration failed' : error.message || 'Registration failed'
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Validate request using secure validation service
    const validation = ValidationService.validate(req.body, ValidationService.userLoginSchema);
    if (!validation.isValid) {
      await SecurityService.logSecurityEvent({
        eventType: 'login_validation_failed',
        severity: 'medium',
        ipAddress,
        userAgent,
        description: 'Login validation failed',
        metadata: { validationErrors: validation.errors, email: req.body.email }
      });

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    const { email, password } = validation.data;

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      await SecurityService.logFailedLogin(email, ipAddress, userAgent, 'user_not_found');
      
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isValidPassword = await User.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      await SecurityService.logFailedLogin(email, ipAddress, userAgent, 'invalid_password');
      
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await User.updateLastLogin(user.id);

    // Log successful login
    await SecurityService.logSecurityEvent({
      eventType: 'successful_login',
      severity: 'low',
      userId: user.id,
      ipAddress,
      userAgent,
      description: `User logged in: ${email}`,
      metadata: { email, userId: user.id }
    });

    // Generate token
    const token = generateToken(user.id);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        isAdmin: user.is_admin === true || user.is_admin === 'true'
      },
      token
    });
  } catch (error) {
    logger.error('Login error:', error);
    
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    await SecurityService.logSecurityEvent({
      eventType: 'login_error',
      severity: 'medium',
      ipAddress,
      userAgent,
      description: 'Login process failed',
      metadata: { error: error.message, email: req.body.email }
    });

    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Log logout event if user is authenticated
    if (req.user) {
      await SecurityService.logSecurityEvent({
        eventType: 'user_logout',
        severity: 'low',
        userId: req.user.id,
        ipAddress,
        userAgent,
        description: `User logged out: ${req.user.email || req.user.id}`,
        metadata: { userId: req.user.id }
      });
    }

    // Clear cookie
    res.clearCookie('token');
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        isAdmin: user.is_admin === true || user.is_admin === 'true',
        createdAt: user.created_at,
        lastLogin: user.last_login
      }
    });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user information'
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  getCurrentUser
};
