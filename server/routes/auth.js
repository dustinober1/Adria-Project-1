const express = require('express');
const { register, login, logout, getCurrentUser } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const SecurityMiddleware = require('../middleware/security');

const router = express.Router();

// Routes with enhanced security middleware
router.post('/register', 
  SecurityMiddleware.loginRateLimit(),
  SecurityMiddleware.authSuccessLogger(),
  register
);

router.post('/login', 
  SecurityMiddleware.loginRateLimit(),
  SecurityMiddleware.authSuccessLogger(),
  login
);

router.post('/logout', logout);

router.get('/me', authenticate, getCurrentUser);

module.exports = router;
