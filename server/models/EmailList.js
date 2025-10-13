const { query } = require('../database/db');

class EmailList {
  // Add email to marketing list
  static async addEmail({ email, name, phone, message, source = 'homepage' }) {
    try {
      const result = await query(
        `INSERT INTO email_list (email, name, phone, message, source) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id, email, name, created_at`,
        [email, name, phone, message, source]
      );
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        // Update existing record
        const updateResult = await query(
          `UPDATE email_list 
           SET name = COALESCE($2, name), 
               phone = COALESCE($3, phone), 
               message = COALESCE($4, message),
               subscribed = TRUE
           WHERE email = $1 
           RETURNING id, email, name, created_at`,
          [email, name, phone, message]
        );
        return updateResult.rows[0];
      }
      throw error;
    }
  }

  // Get all emails
  static async findAll() {
    const result = await query(
      'SELECT * FROM email_list WHERE subscribed = TRUE ORDER BY created_at DESC'
    );
    return result.rows;
  }

  // Unsubscribe email
  static async unsubscribe(email) {
    await query(
      'UPDATE email_list SET subscribed = FALSE WHERE email = $1',
      [email]
    );
  }

  // Get count of subscribed emails
  static async getCount() {
    const result = await query(
      'SELECT COUNT(*) as count FROM email_list WHERE subscribed = TRUE'
    );
    return parseInt(result.rows[0].count);
  }
}

module.exports = EmailList;
