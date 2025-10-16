const express = require('express');
const { body } = require('express-validator');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const blogController = require('../controllers/blogController');

const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(authenticate, authorizeAdmin);

// ============ DASHBOARD STATS ============
router.get('/stats', adminController.getDashboardStats);

// ============ USER MANAGEMENT ============
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUser);
router.delete('/users/:id', adminController.deleteUser);
router.post('/users/:id/promote', adminController.promoteToAdmin);
router.post('/users/:id/demote', adminController.demoteFromAdmin);

// ============ BLOG ARTICLE MANAGEMENT ============

// Validation rules for articles
const articleValidation = [
  body('title')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Title must be at least 3 characters long'),
  body('slug')
    .trim()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
  body('content')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long'),
  body('excerpt')
    .optional()
    .trim(),
  body('featured_image')
    .optional()
    .isURL()
    .withMessage('Featured image must be a valid URL')
];

router.get('/articles', blogController.getAllArticles);
router.post('/articles', articleValidation, blogController.createArticle);
router.get('/articles/:id', blogController.getArticle);
router.put('/articles/:id', articleValidation, blogController.updateArticle);
router.delete('/articles/:id', blogController.deleteArticle);
router.patch('/articles/:id/publish', blogController.togglePublishArticle);

module.exports = router;
