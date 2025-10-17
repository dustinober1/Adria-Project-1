const { query, run, get } = require('../database/sqlite');
const logger = require('../utils/logger');

class EmailList {
  // Add email to marketing list
  static async addEmail({ email, name, phone, message, source = 'homepage' }) {
    try {
      // Check if email already exists
      const existingEmail = await get('SELECT id, name, phone, message, created_at FROM email_list WHERE email = ?', [email]);
      
      if (existingEmail) {
        // Update existing record
        await run(
          `UPDATE email_list 
           SET name = ?, phone = ?, message = ?, subscribed = 1 
           WHERE email = ?`,
          [name || existingEmail.name, phone || existingEmail.phone, message || existingEmail.message, email]
        );
        
        return {
          id: existingEmail.id,
          email,
          name: name || existingEmail.name,
          created_at: existingEmail.created_at
        };
      }

      // Create new email entry
      const result = await run(
        `INSERT INTO email_list (email, name, phone, message, source, subscribed)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [email, name || '', phone || '', message || '', source]
      );

      return {
        id: result.lastID,
        email,
        name: name || '',
        created_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error adding email to list:', error);
      throw error;
    }
  }

  // Get all emails
  static async findAll() {
    try {
      const result = await query('SELECT * FROM email_list WHERE subscribed = 1 ORDER BY created_at DESC');
      return result.rows.map(email => ({
        id: email.id,
        email: email.email,
        name: email.name,
        phone: email.phone,
        message: email.message,
        source: email.source,
        subscribed: Boolean(email.subscribed),
        created_at: email.created_at
      }));
    } catch (error) {
      logger.error('Error finding all emails:', error);
      throw error;
    }
  }

  // Unsubscribe email
  static async unsubscribe(email) {
    try {
      await run('UPDATE email_list SET subscribed = 0 WHERE email = ?', [email]);
    } catch (error) {
      logger.error('Error unsubscribing email:', error);
      throw error;
    }
  }

  // Get count of subscribed emails
  static async getCount() {
    try {
      const result = await get('SELECT COUNT(*) as count FROM email_list WHERE subscribed = 1');
      return result.count;
    } catch (error) {
      logger.error('Error getting email count:', error);
      throw error;
    }
  }

  // Get all emails (including unsubscribed) for admin view
  static async findAllAdmin() {
    try {
      const result = await query('SELECT * FROM email_list ORDER BY created_at DESC');
      return result.rows.map(email => ({
        id: email.id,
        email: email.email,
        name: email.name,
        phone: email.phone,
        message: email.message,
        source: email.source,
        subscribed: Boolean(email.subscribed),
        created_at: email.created_at
      }));
    } catch (error) {
      logger.error('Error finding all emails for admin:', error);
      throw error;
    }
  }

  // Delete email from list
  static async delete(id) {
    try {
      await run('DELETE FROM email_list WHERE id = ?', [id]);
    } catch (error) {
      logger.error('Error deleting email from list:', error);
      throw error;
    }
  }

  // Subscribe email (resubscribe)
  static async subscribe(email) {
    try {
      await run('UPDATE email_list SET subscribed = 1 WHERE email = ?', [email]);
    } catch (error) {
      logger.error('Error subscribing email:', error);
      throw error;
    }
  }
}

module.exports = EmailList;
