const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../utils/logger');

// Database file path - will be created in the project root
const DB_PATH = path.join(__dirname, '../../data/adria_style_studio.db');

// Create database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    logger.error('Error opening database:', err.message);
  } else {
    logger.log('Connected to SQLite database');
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');
  }
});

// Query helper function that returns promises
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    
    db.all(sql, params, (err, rows) => {
      const duration = Date.now() - start;
      
      if (err) {
        logger.error('Database query error:', err);
        reject(err);
      } else {
        logger.log('Executed query', { sql, duration, rows: rows.length });
        resolve({ rows, rowCount: rows.length });
      }
    });
  });
};

// Run query helper for INSERT/UPDATE/DELETE operations
const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    
    db.run(sql, params, function(err) {
      const duration = Date.now() - start;
      
      if (err) {
        logger.error('Database run error:', err);
        reject(err);
      } else {
        logger.log('Executed run', { sql, duration, changes: this.changes, lastID: this.lastID });
        resolve({ changes: this.changes, lastID: this.lastID });
      }
    });
  });
};

// Get single row helper
const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    
    db.get(sql, params, (err, row) => {
      const duration = Date.now() - start;
      
      if (err) {
        logger.error('Database get error:', err);
        reject(err);
      } else {
        logger.log('Executed get', { sql, duration, hasRow: !!row });
        resolve(row);
      }
    });
  });
};

// Close database connection
const close = () => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        logger.error('Error closing database:', err.message);
        reject(err);
      } else {
        logger.log('Database connection closed');
        resolve();
      }
    });
  });
};

module.exports = {
  db,
  query,
  run,
  get,
  close,
  DB_PATH
};
