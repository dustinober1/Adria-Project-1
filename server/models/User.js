const bcrypt = require('bcryptjs');
const { query } = require('../database/db');
const logger = require('../utils/logger');

class User {
  // Create a new user
  static async create({ email, password, firstName, lastName }) {
    try {
      // Check if email already exists
      const existingResult = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingResult.rows.length > 0) {
        throw new Error('Email already exists');
      }

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create new user
      const result = await query(
        `INSERT INTO users (email, password_hash, first_name, last_name, is_admin)
         VALUES ($1, $2, $3, $4, FALSE)
         RETURNING id, email, first_name, last_name, is_admin, created_at`,
        [email, passwordHash, firstName, lastName]
      );

      const user = result.rows[0];
      return {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        is_admin: user.is_admin,
        created_at: user.created_at
      };
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const result = await query('SELECT * FROM users WHERE email = $1', [email]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        return {
          id: user.id,
          email: user.email,
          password_hash: user.password_hash,
          first_name: user.first_name,
          last_name: user.last_name,
          is_admin: user.is_admin,
          created_at: user.created_at,
          last_login: user.last_login
        };
      }
      return null;
    } catch (error) {
      logger.error('Error finding user by email:', error);
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const result = await query('SELECT * FROM users WHERE id = $1', [id]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        return {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          is_admin: user.is_admin,
          created_at: user.created_at,
          last_login: user.last_login
        };
      }
      return null;
    } catch (error) {
      logger.error('Error finding user by ID:', error);
      throw error;
    }
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Update last login time
  static async updateLastLogin(userId) {
    try {
      await query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [userId]
      );
    } catch (error) {
      logger.error('Error updating last login:', error);
      throw error;
    }
  }

  // Get all users (admin only)
  static async findAll() {
    try {
      const result = await query('SELECT * FROM users ORDER BY created_at DESC');
      return result.rows.map(user => ({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        is_admin: user.is_admin,
        created_at: user.created_at,
        last_login: user.last_login
      }));
    } catch (error) {
      logger.error('Error finding all users:', error);
      throw error;
    }
  }

  // Delete user
  static async delete(userId) {
    try {
      await query('DELETE FROM users WHERE id = $1', [userId]);
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  // Update user admin status
  static async updateAdminStatus(userId, isAdmin) {
    try {
      await query(
        'UPDATE users SET is_admin = $1 WHERE id = $2',
        [isAdmin, userId]
      );
      
      const result = await query('SELECT id, email, is_admin FROM users WHERE id = $1', [userId]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        return {
          id: user.id,
          email: user.email,
          is_admin: user.is_admin
        };
      }
      return null;
    } catch (error) {
      logger.error('Error updating admin status:', error);
      throw error;
    }
  }

  // Update customer tier (free or paid)
  static async updateCustomerTier(userId, tier) {
    try {
      // Note: This would require adding a customer_tier column to the users table
      // For now, we'll just return the user info
      const user = await User.findById(userId);
      if (user) {
        return {
          id: user.id,
          email: user.email,
          customer_tier: tier
        };
      }
      return null;
    } catch (error) {
      logger.error('Error updating customer tier:', error);
      throw error;
    }
  }

  // Update customer status (prospect ranking or active customer)
  static async updateCustomerStatus(userId, status) {
    try {
      // Note: This would require adding a customer_status column to the users table
      // For now, we'll just return the user info
      const user = await User.findById(userId);
      if (user) {
        return {
          id: user.id,
          email: user.email,
          customer_status: status
        };
      }
      return null;
    } catch (error) {
      logger.error('Error updating customer status:', error);
      throw error;
    }
  }

  // Update admin notes for a customer
  static async updateAdminNotes(userId, notes) {
    try {
      // Note: This would require adding an admin_notes column to the users table
      // For now, we'll just return the user info
      const user = await User.findById(userId);
      if (user) {
        return {
          id: user.id,
          email: user.email,
          admin_notes: notes
        };
      }
      return null;
    } catch (error) {
      logger.error('Error updating admin notes:', error);
      throw error;
    }
  }
}

module.exports = User;
