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

// Update customer tier (free or paid)
const updateCustomerTier = async (req, res) => {
  try {
    const { id } = req.params;
    const { tier } = req.body;

    // Validate tier
    const validTiers = ['free', 'paid'];
    if (!validTiers.includes(tier)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tier. Must be "free" or "paid"'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updated = await User.updateCustomerTier(id, tier);

    res.json({
      success: true,
      message: `User tier updated to ${tier}`,
      user: updated
    });
  } catch (error) {
    logger.error('Update customer tier error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update customer tier'
    });
  }
};

// Update customer status (prospect ranking)
const updateCustomerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['green', 'yellow', 'red', 'active_customer'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "green", "yellow", "red", or "active_customer"'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updated = await User.updateCustomerStatus(id, status);

    res.json({
      success: true,
      message: `User status updated to ${status}`,
      user: updated
    });
  } catch (error) {
    logger.error('Update customer status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update customer status'
    });
  }
};

// Update admin notes for a customer
const updateAdminNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updated = await User.updateAdminNotes(id, notes || '');

    res.json({
      success: true,
      message: 'Admin notes updated',
      user: updated
    });
  } catch (error) {
    logger.error('Update admin notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update admin notes'
    });
  }
};

module.exports = {
  getAllUsers,
  getUser,
  deleteUser,
  promoteToAdmin,
  demoteFromAdmin,
  updateCustomerTier,
  updateCustomerStatus,
  updateAdminNotes,
  getDashboardStats
};
