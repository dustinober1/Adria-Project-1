const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');
const csvStringify = require('csv-stringify/sync');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const EMAIL_LIST_CSV_PATH = path.join(__dirname, '..', '..', 'data', 'email_list.csv');

// Ensure data directory exists
const ensureDataDir = () => {
  const dataDir = path.dirname(EMAIL_LIST_CSV_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Get all emails from CSV
const getAllEmailsFromCSV = () => {
  try {
    ensureDataDir();
    if (!fs.existsSync(EMAIL_LIST_CSV_PATH)) {
      return [];
    }
    const fileContent = fs.readFileSync(EMAIL_LIST_CSV_PATH, 'utf-8');
    if (!fileContent.trim()) {
      return [];
    }
    return csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
  } catch (error) {
    logger.error('Error reading email list CSV:', error);
    return [];
  }
};

// Write emails to CSV
const writeEmailsToCSV = (emails) => {
  try {
    ensureDataDir();
    const output = csvStringify.stringify(emails, {
      header: true,
      columns: ['id', 'email', 'name', 'phone', 'message', 'source', 'subscribed', 'created_at']
    });
    fs.writeFileSync(EMAIL_LIST_CSV_PATH, output, 'utf-8');
  } catch (error) {
    logger.error('Error writing email list CSV:', error);
    throw error;
  }
};

class EmailList {
  // Add email to marketing list
  static async addEmail({ email, name, phone, message, source = 'homepage' }) {
    try {
      const emails = getAllEmailsFromCSV();
      
      // Check if email already exists
      const existingEmail = emails.find(e => e.email === email);
      if (existingEmail) {
        // Update existing record
        existingEmail.name = name || existingEmail.name;
        existingEmail.phone = phone || existingEmail.phone;
        existingEmail.message = message || existingEmail.message;
        existingEmail.subscribed = 'true';
        writeEmailsToCSV(emails);
        
        return {
          id: existingEmail.id,
          email: existingEmail.email,
          name: existingEmail.name,
          created_at: existingEmail.created_at
        };
      }

      // Create new email entry
      const newEmail = {
        id: uuidv4(),
        email,
        name: name || '',
        phone: phone || '',
        message: message || '',
        source,
        subscribed: 'true',
        created_at: new Date().toISOString()
      };

      emails.push(newEmail);
      writeEmailsToCSV(emails);

      return {
        id: newEmail.id,
        email: newEmail.email,
        name: newEmail.name,
        created_at: newEmail.created_at
      };
    } catch (error) {
      throw error;
    }
  }

  // Get all emails
  static async findAll() {
    const emails = getAllEmailsFromCSV();
    return emails
      .filter(e => e.subscribed === 'true')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  // Unsubscribe email
  static async unsubscribe(email) {
    const emails = getAllEmailsFromCSV();
    const emailEntry = emails.find(e => e.email === email);
    if (emailEntry) {
      emailEntry.subscribed = 'false';
      writeEmailsToCSV(emails);
    }
  }

  // Get count of subscribed emails
  static async getCount() {
    const emails = getAllEmailsFromCSV();
    return emails.filter(e => e.subscribed === 'true').length;
  }
}

module.exports = EmailList;
