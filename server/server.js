const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');
const logger = require('./utils/logger');
const SecurityMiddleware = require('./middleware/security');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const emailRoutes = require('./routes/email');
const adminRoutes = require('./routes/admin');
const blogRoutes = require('./routes/blog');
const wardrobeRoutes = require('./routes/wardrobe');
const securityRoutes = require('./routes/security');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Enhanced Security Headers with environment-specific configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

app.use(helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'", 
        isDevelopment ? "'unsafe-inline'" : '', 
        "https://fonts.googleapis.com"
      ].filter(Boolean),
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: [
        "'self'",
        isDevelopment ? "'unsafe-eval'" : ''
      ].filter(Boolean),
      connectSrc: ["'self'", frontendUrl, "https://fonts.googleapis.com"],
      frameSrc: ["'none'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"],
      workerSrc: ["'self'"]
    }
  },
  // Additional security headers
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Custom security headers
app.use((req, res, next) => {
  // X-Content-Type-Options: nosniff
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Referrer-Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions-Policy
  res.setHeader('Permissions-Policy', 
    'geolocation=(), ' +
    'microphone=(), ' +
    'camera=(), ' +
    'payment=(), ' +
    'usb=(), ' +
    'magnetometer=(), ' +
    'gyroscope=(), ' +
    'accelerometer=()'
  );
  
  // X-Permitted-Cross-Domain-Policies
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  
  // X-Frame-Options (additional clickjacking protection)
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Clear-Site-Data on logout
  if (req.path.includes('/logout')) {
    res.setHeader('Clear-Site-Data', '"cache", "cookies", "storage", "executionContexts"');
  }
  
  next();
});

// Security Middleware
app.use(SecurityMiddleware.securityLogger());
app.use(SecurityMiddleware.suspiciousActivityDetection());
app.use(SecurityMiddleware.headerValidation());

// Middleware - CORS and Parsing
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Serve static files (HTML, CSS, JS, images)
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/wardrobe', wardrobeRoutes);
app.use('/api/security', securityRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Serve index.html for the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : err.message || 'Internal Server Error'
  });
});

// Start server
app.listen(PORT, () => {
  logger.log(`Server is running on http://localhost:${PORT}`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
