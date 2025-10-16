const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');
const csvStringify = require('csv-stringify/sync');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const USERS_CSV_PATH = path.join(__dirname, '..', '..', 'data', 'users.csv');

// Ensure data directory exists
const ensureDataDir = () => {
  const dataDir = path.dirname(USERS_CSV_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Get all users from CSV
const getAllUsersFromCSV = () => {
  try {
    ensureDataDir();
    if (!fs.existsSync(USERS_CSV_PATH)) {
      return [];
    }
    const fileContent = fs.readFileSync(USERS_CSV_PATH, 'utf-8');
    if (!fileContent.trim()) {
      return [];
    }
    return csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
  } catch (error) {
    logger.error('Error reading users CSV:', error);
    return [];
  }
};

// Write users to CSV
const writeUsersToCSV = (users) => {
  try {
    ensureDataDir();
    const output = csvStringify.stringify(users, {
      header: true,
      columns: ['id', 'email', 'password_hash', 'first_name', 'last_name', 'is_admin', 'created_at', 'last_login']
    });
    fs.writeFileSync(USERS_CSV_PATH, output, 'utf-8');
  } catch (error) {
    logger.error('Error writing users CSV:', error);
    throw error;
  }
};

class User {
  // Create a new user
  static async create({ email, password, firstName, lastName }) {
    try {
      // Check if email already exists
      const users = getAllUsersFromCSV();
      if (users.some(u => u.email === email)) {
        throw new Error('Email already exists');
      }

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create new user
      const newUser = {
        id: uuidv4(),
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        is_admin: 'false',
        created_at: new Date().toISOString(),
        last_login: null
      };

      users.push(newUser);
      writeUsersToCSV(users);

      return {
        id: newUser.id,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        created_at: newUser.created_at
      };
    } catch (error) {
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    const users = getAllUsersFromCSV();
    return users.find(u => u.email === email) || null;
  }

  // Find user by ID
  static async findById(id) {
    const users = getAllUsersFromCSV();
    const user = users.find(u => u.id === id);
    if (user) {
      return {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        is_admin: user.is_admin === 'true',
        created_at: user.created_at,
        last_login: user.last_login
      };
    }
    return null;
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Update last login time
  static async updateLastLogin(userId) {
    const users = getAllUsersFromCSV();
    const user = users.find(u => u.id === userId);
    if (user) {
      user.last_login = new Date().toISOString();
      writeUsersToCSV(users);
    }
  }

  // Get all users (admin only)
  static async findAll() {
    const users = getAllUsersFromCSV();
    return users.map(u => ({
      id: u.id,
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
      is_admin: u.is_admin === 'true',
      created_at: u.created_at,
      last_login: u.last_login
    })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  // Delete user
  static async delete(userId) {
    const users = getAllUsersFromCSV();
    const filtered = users.filter(u => u.id !== userId);
    writeUsersToCSV(filtered);
  }

  // Update user admin status
  static async updateAdminStatus(userId, isAdmin) {
    const users = getAllUsersFromCSV();
    const user = users.find(u => u.id === userId);
    if (user) {
      user.is_admin = isAdmin ? 'true' : 'false';
      writeUsersToCSV(users);
      return {
        id: user.id,
        email: user.email,
        is_admin: user.is_admin === 'true'
      };
    }
    return null;
  }
}

module.exports = User;
