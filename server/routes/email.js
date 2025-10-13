const express = require('express');
const { body } = require('express-validator');
const { addToEmailList, getAllEmails, unsubscribe } = require('../controllers/emailController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const emailValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('name')
    .optional()
    .trim(),
  body('phone')
    .optional()
    .trim(),
  body('message')
    .optional()
    .trim()
];

// Routes
router.post('/subscribe', emailValidation, addToEmailList);
router.get('/list', authenticate, getAllEmails); // Protected - requires authentication
router.post('/unsubscribe', unsubscribe);

module.exports = router;
