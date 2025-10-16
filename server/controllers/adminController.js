const { validationResult } = require('express-validator');
const logger = require('../utils/logger');
const User = require('../models/User');
const Admin = require('../models/Admin');

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json({
      success: true,
      users
    });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users'
    });
  }
};

// Get single user details
const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

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
        isAdmin: user.is_admin,
        createdAt: user.created_at,
        lastLogin: user.last_login
      }
    });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user'
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting self
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await User.delete(id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
};

// Promote user to admin
const promoteToAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updatedUser = await Admin.promoteToAdmin(id);

    res.json({
      success: true,
      message: 'User promoted to admin successfully',
      user: updatedUser
    });
  } catch (error) {
    logger.error('Promote user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to promote user'
    });
  }
};

// Demote admin to regular user
const demoteFromAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent demoting self
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot demote yourself from admin'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updatedUser = await Admin.demoteFromAdmin(id);

    res.json({
      success: true,
      message: 'User demoted from admin successfully',
      user: updatedUser
    });
  } catch (error) {
    logger.error('Demote user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to demote user'
    });
  }
};

// Get admin dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const stats = await Admin.getStatistics();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics'
    });
  }
};

module.exports = {
  getAllUsers,
  getUser,
  deleteUser,
  promoteToAdmin,
  demoteFromAdmin,
  getDashboardStats
};
