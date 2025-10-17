const express = require('express');
const SecurityController = require('../controllers/securityController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const SecurityMiddleware = require('../middleware/security');

const router = express.Router();

// All security routes require authentication and admin privileges
router.use(authenticate);
router.use(authorizeAdmin);
router.use(SecurityMiddleware.adminActionLogger());

// Security dashboard endpoints
router.get('/stats', SecurityController.getSecurityStats);
router.get('/events', SecurityController.getSecurityEvents);
router.get('/alerts', SecurityController.getSecurityAlerts);
router.get('/failed-login-analysis', SecurityController.getFailedLoginAnalysis);
router.get('/ip-analysis/:ipAddress', SecurityController.getIPAnalysis);

// Security management endpoints
router.post('/cleanup', SecurityController.cleanupOldData);
router.get('/export', SecurityController.exportSecurityEvents);

module.exports = router;
