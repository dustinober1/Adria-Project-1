const { query } = require('../database/db');
const logger = require('../utils/logger');

class EmailList {
  // Add email to marketing list
  static async addEmail({ email, name, phone, message, source = 'homepage' }) {
    try {
      // Check if email already exists
      const existingResult = await query('SELECT id, name, phone, message, created_at FROM email_list WHERE email = $1', [email]);
      
      if (existingResult.rows.length > 0) {
        const existingEmail = existingResult.rows[0];
        // Update existing record
        await query(
          `UPDATE email_list 
           SET name = $1, phone = $2, message = $3, subscribed = TRUE 
           WHERE email = $4`,
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
      const result = await query(
        `INSERT INTO email_list (email, name, phone, message, source, subscribed)
         VALUES ($1, $2, $3, $4, $5, TRUE)
         RETURNING id, email, name, created_at`,
        [email, name || '', phone || '', message || '', source]
      );

      const emailRecord = result.rows[0];
      return {
        id: emailRecord.id,
        email: emailRecord.email,
        name: emailRecord.name,
        created_at: emailRecord.created_at
      };
    } catch (error) {
      logger.error('Error adding email to list:', error);
      throw error;
    }
  }

  // Get all emails
  static async findAll() {
    try {
      const result = await query('SELECT * FROM email_list WHERE subscribed = TRUE ORDER BY created_at DESC');
      return result.rows.map(email => ({
        id: email.id,
        email: email.email,
        name: email.name,
        phone: email.phone,
        message: email.message,
        source: email.source,
        subscribed: email.subscribed,
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
      await query('UPDATE email_list SET subscribed = FALSE WHERE email = $1', [email]);
    } catch (error) {
      logger.error('Error unsubscribing email:', error);
      throw error;
    }
  }

  // Get count of subscribed emails
  static async getCount() {
    try {
      const result = await query('SELECT COUNT(*) as count FROM email_list WHERE subscribed = TRUE');
      return parseInt(result.rows[0].count, 10);
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
        subscribed: email.subscribed,
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
      await query('DELETE FROM email_list WHERE id = $1', [id]);
    } catch (error) {
      logger.error('Error deleting email from list:', error);
      throw error;
    }
  }

  // Subscribe email (resubscribe)
  static async subscribe(email) {
    try {
      await query('UPDATE email_list SET subscribed = TRUE WHERE email = $1', [email]);
    } catch (error) {
      logger.error('Error subscribing email:', error);
      throw error;
    }
  }
}

module.exports = EmailList;
