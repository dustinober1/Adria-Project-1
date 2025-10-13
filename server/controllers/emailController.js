const { validationResult } = require('express-validator');
const EmailList = require('../models/EmailList');

// Add email to marketing list
const addToEmailList = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, name, phone, message } = req.body;

    const result = await EmailList.addEmail({
      email,
      name,
      phone,
      message,
      source: 'homepage'
    });

    res.status(201).json({
      success: true,
      message: 'Thank you! We\'ll be in touch soon.',
      data: result
    });
  } catch (error) {
    console.error('Email list error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add email to list'
    });
  }
};

// Get all emails (protected route - for admin)
const getAllEmails = async (req, res) => {
  try {
    const emails = await EmailList.findAll();
    const count = await EmailList.getCount();

    res.json({
      success: true,
      count,
      data: emails
    });
  } catch (error) {
    console.error('Get emails error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get email list'
    });
  }
};

// Unsubscribe from email list
const unsubscribe = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    await EmailList.unsubscribe(email);

    res.json({
      success: true,
      message: 'Successfully unsubscribed'
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unsubscribe'
    });
  }
};

module.exports = {
  addToEmailList,
  getAllEmails,
  unsubscribe
};
