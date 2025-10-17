const { run, query } = require('./sqlite');
const logger = require('../utils/logger');

// SQL schema for creating tables (SQLite compatible)
const createTables = async () => {
  try {
    logger.log('Creating database tables...');

    // Create users table
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        is_admin BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      );
    `);

    // Create index on email for faster lookups
    await run(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);

    // Create email_list table for marketing emails
    await run(`
      CREATE TABLE IF NOT EXISTS email_list (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        phone TEXT,
        message TEXT,
        subscribed BOOLEAN DEFAULT 1,
        source TEXT DEFAULT 'homepage',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create index on email for faster lookups
    await run(`
      CREATE INDEX IF NOT EXISTS idx_email_list_email ON email_list(email);
    `);

    // Create sessions table (optional, for server-side session management)
    await run(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        token TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Create blog_articles table
    await run(`
      CREATE TABLE IF NOT EXISTS blog_articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        content TEXT NOT NULL,
        excerpt TEXT,
        featured_image TEXT,
        author_id INTEGER,
        published BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    // Create index on slug for faster lookups
    await run(`
      CREATE INDEX IF NOT EXISTS idx_blog_articles_slug ON blog_articles(slug);
    `);

    // Create index on published for faster queries
    await run(`
      CREATE INDEX IF NOT EXISTS idx_blog_articles_published ON blog_articles(published);
    `);

    // Create security_events table for security monitoring
    await run(`
      CREATE TABLE IF NOT EXISTS security_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        severity TEXT NOT NULL DEFAULT 'medium',
        user_id INTEGER,
        ip_address TEXT,
        user_agent TEXT,
        description TEXT,
        metadata TEXT, -- JSON stored as text in SQLite
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    // Create indexes for security_events
    await run(`
      CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
    `);

    await run(`
      CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
    `);

    await run(`
      CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);
    `);

    await run(`
      CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
    `);

    // Create failed_login_attempts table for rate limiting and monitoring
    await run(`
      CREATE TABLE IF NOT EXISTS failed_login_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        user_agent TEXT,
        attempt_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        reason TEXT
      );
    `);

    // Create indexes for failed_login_attempts
    await run(`
      CREATE INDEX IF NOT EXISTS idx_failed_login_email ON failed_login_attempts(email);
    `);

    await run(`
      CREATE INDEX IF NOT EXISTS idx_failed_login_ip ON failed_login_attempts(ip_address);
    `);

    await run(`
      CREATE INDEX IF NOT EXISTS idx_failed_login_time ON failed_login_attempts(attempt_time);
    `);

    // Create api_rate_limits table for API rate limiting
    await run(`
      CREATE TABLE IF NOT EXISTS api_rate_limits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip_address TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        request_count INTEGER DEFAULT 1,
        window_start DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_request DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(ip_address, endpoint, window_start)
      );
    `);

    // Create indexes for api_rate_limits
    await run(`
      CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_endpoint ON api_rate_limits(ip_address, endpoint);
    `);

    await run(`
      CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON api_rate_limits(window_start);
    `);

    logger.log('✅ Database tables created successfully');
  } catch (error) {
    logger.error('❌ Error creating tables:', error);
    throw error;
  }
};

// Insert default admin user
const createDefaultAdmin = async () => {
  try {
    const bcrypt = require('bcryptjs');
    
    // Check if admin user already exists
    const existingAdmin = await query('SELECT id FROM users WHERE email = ?', ['admin@adriastudio.com']);
    
    if (existingAdmin.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await run(`
        INSERT INTO users (email, password_hash, first_name, last_name, is_admin)
        VALUES (?, ?, 'Admin', 'User', 1)
      `, ['admin@adriastudio.com', hashedPassword]);
      
      logger.log('✅ Default admin user created (admin@adriastudio.com / admin123)');
    } else {
      logger.log('ℹ️ Admin user already exists');
    }
  } catch (error) {
    logger.error('❌ Error creating default admin:', error);
    throw error;
  }
};

// Run setup
const setup = async () => {
  try {
    logger.log('🔧 Setting up SQLite database...');
    
    // Ensure data directory exists
    const fs = require('fs');
    const path = require('path');
    const dataDir = path.join(__dirname, '../../data');
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      logger.log('📁 Created data directory');
    }
    
    await createTables();
    await createDefaultAdmin();
    logger.log('🎉 SQLite database setup complete!');
    
    // Close connection after setup
    const { close } = require('./sqlite');
    await close();
    
    process.exit(0);
  } catch (error) {
    logger.error('Failed to setup database:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  setup();
}

module.exports = { createTables, createDefaultAdmin, setup };
