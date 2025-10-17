const { pool } = require('./db');

// SQL schema for creating tables
const createTables = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      );
    `);

    // Create index on email for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);

    // Create email_list table for marketing emails
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_list (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(200),
        phone VARCHAR(50),
        message TEXT,
        subscribed BOOLEAN DEFAULT TRUE,
        source VARCHAR(50) DEFAULT 'homepage',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create index on email for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_email_list_email ON email_list(email);
    `);

    // Create sessions table (optional, for server-side session management)
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(500) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create blog_articles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS blog_articles (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        content TEXT NOT NULL,
        excerpt VARCHAR(500),
        featured_image VARCHAR(500),
        author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        published BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create index on slug for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_blog_articles_slug ON blog_articles(slug);
    `);

    // Create index on published for faster queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_blog_articles_published ON blog_articles(published);
    `);

    // Create security_events table for security monitoring
    await client.query(`
      CREATE TABLE IF NOT EXISTS security_events (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) NOT NULL DEFAULT 'medium',
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        ip_address INET,
        user_agent TEXT,
        description TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for security_events
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
    `);

    // Create failed_login_attempts table for rate limiting and monitoring
    await client.query(`
      CREATE TABLE IF NOT EXISTS failed_login_attempts (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        ip_address INET NOT NULL,
        user_agent TEXT,
        attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reason VARCHAR(100)
      );
    `);

    // Create indexes for failed_login_attempts
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_failed_login_email ON failed_login_attempts(email);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_failed_login_ip ON failed_login_attempts(ip_address);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_failed_login_time ON failed_login_attempts(attempt_time);
    `);

    // Create api_rate_limits table for API rate limiting
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_rate_limits (
        id SERIAL PRIMARY KEY,
        ip_address INET NOT NULL,
        endpoint VARCHAR(255) NOT NULL,
        request_count INTEGER DEFAULT 1,
        window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_request TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(ip_address, endpoint, window_start)
      );
    `);

    // Create indexes for api_rate_limits
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_endpoint ON api_rate_limits(ip_address, endpoint);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON api_rate_limits(window_start);
    `);

    await client.query('COMMIT');
    console.log('✅ Database tables created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run setup
const setup = async () => {
  try {
    console.log('🔧 Setting up database...');
    await createTables();
    console.log('🎉 Database setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to setup database:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  setup();
}

module.exports = { createTables, setup };
