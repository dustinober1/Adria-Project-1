const { query } = require('../database/db');
const bcrypt = require('bcryptjs');

class User {
  // Create a new user
  static async create({ email, password, firstName, lastName }) {
    try {
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const result = await query(
        `INSERT INTO users (email, password_hash, first_name, last_name) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, email, first_name, last_name, created_at`,
        [email, passwordHash, firstName, lastName]
      );

      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Email already exists');
      }
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  // Find user by ID
  static async findById(id) {
    const result = await query(
      'SELECT id, email, first_name, last_name, is_admin, created_at, last_login FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Update last login time
  static async updateLastLogin(userId) {
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );
  }

  // Get all users (admin only)
  static async findAll() {
    const result = await query(
      'SELECT id, email, first_name, last_name, is_admin, created_at, last_login FROM users ORDER BY created_at DESC'
    );
    return result.rows;
  }

  // Delete user
  static async delete(userId) {
    await query('DELETE FROM users WHERE id = $1', [userId]);
  }
}

module.exports = User;
