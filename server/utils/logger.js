/**
 * Logger utility for secure logging
 * Disables console output in production to prevent information leakage
 */

const isProduction = process.env.NODE_ENV === 'production';

const logger = {
  log: (...args) => {
    if (!isProduction) {
      console.log(...args);
    }
  },
  error: (...args) => {
    if (!isProduction) {
      console.error(...args);
    } else {
      // In production, only log errors to a file or monitoring service
      // For now, we'll just suppress them to prevent information leakage
    }
  },
  warn: (...args) => {
    if (!isProduction) {
      console.warn(...args);
    }
  },
  info: (...args) => {
    if (!isProduction) {
      console.info(...args);
    }
  },
  debug: (...args) => {
    if (!isProduction) {
      console.debug(...args);
    }
  }
};

module.exports = logger;
