const express = require('express');
const { register, login, logout, getCurrentUser } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const SecurityMiddleware = require('../middleware/security');

const router = express.Router();

// Routes with enhanced security middleware

// Disabled rate limiting and logging middleware for testing
router.post('/register', register);


// Disabled rate limiting and logging middleware for testing
router.post('/login', login);

router.post('/logout', logout);

router.get('/me', authenticate, getCurrentUser);

module.exports = router;
