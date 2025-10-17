# 📊 Before & After Code Comparison

## Understanding the Fixes

This document shows the specific changes made to fix the authentication system.

---

## 1. User Model (User.js)

### BEFORE - SQLite Version (❌ Broken)
```javascript
const { query, run, get } = require('../database/sqlite');

class User {
  static async create({ email, password, firstName, lastName }) {
    try {
      // Check if email exists
      const existingUser = await get('SELECT id FROM users WHERE email = ?', [email]);
      if (existingUser) {
        throw new Error('Email already exists');
      }

      // Create user
      const result = await run(
        `INSERT INTO users (email, password_hash, first_name, last_name, is_admin)
         VALUES (?, ?, ?, ?, 0)`,  // ❌ SQLite uses ? placeholders
        [email, passwordHash, firstName, lastName]
      );

      return {
        id: result.lastID,  // ❌ SQLite returns lastID
        email,
        is_admin: false     // ❌ Using 0/1 for boolean
      };
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  static async findByEmail(email) {
    const user = await get('SELECT * FROM users WHERE email = ?', [email]);  // ❌ SQLite
    return user;
  }
}
```

### AFTER - PostgreSQL Version (✅ Fixed)
```javascript
const { query } = require('../database/db');  // ✅ PostgreSQL module

class User {
  static async create({ email, password, firstName, lastName }) {
    try {
      // Check if email exists
      const existingResult = await query('SELECT id FROM users WHERE email = $1', [email]);  // ✅ $1 placeholder
      if (existingResult.rows.length > 0) {  // ✅ PostgreSQL returns .rows array
        throw new Error('Email already exists');
      }

      // Create user
      const result = await query(
        `INSERT INTO users (email, password_hash, first_name, last_name, is_admin)
         VALUES ($1, $2, $3, $4, FALSE)  // ✅ PostgreSQL uses $1, $2... and TRUE/FALSE
         RETURNING id, email, first_name, last_name, is_admin, created_at`,  // ✅ RETURNING clause
        [email, passwordHash, firstName, lastName]
      );

      const user = result.rows[0];  // ✅ Access .rows[0]
      return {
        id: user.id,  // ✅ Get from returned row
        email: user.email,
        is_admin: user.is_admin  // ✅ Boolean true/false
      };
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  static async findByEmail(email) {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);  // ✅ PostgreSQL
    if (result.rows.length > 0) {  // ✅ Check .rows
      return result.rows[0];  // ✅ Return first row
    }
    return null;
  }
}
```

### Key Changes
| SQLite | PostgreSQL |
|--------|-----------|
| `await run()` / `await get()` | `await query()` |
| `?` placeholder | `$1, $2, $3...` |
| `result.lastID` | `result.rows[0].id` |
| `result.rows` | `result.rows[0]` |
| `0` / `1` | `FALSE` / `TRUE` |
| No RETURNING | `RETURNING ...` clause |

---

## 2. Security Service Changes

### BEFORE - SQLite (❌ Broken)
```javascript
const { query, run } = require('../database/sqlite');

class SecurityService {
  static async logSecurityEvent(eventData) {
    const result = await run(
      `INSERT INTO security_events 
       (event_type, severity, user_id, ip_address, user_agent, description, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,  // ❌ SQLite placeholders
      [eventType, severity, userId, ipAddress, userAgent, description, JSON.stringify(metadata)]
    );

    return { id: result.lastID, created_at: new Date().toISOString() };  // ❌ SQLite way
  }

  static async isRateLimited(ipAddress, maxAttempts = 5, windowMinutes = 15) {
    const result = await query(
      `SELECT COUNT(*) as attempt_count 
       FROM failed_login_attempts 
       WHERE ip_address = ? 
       AND attempt_time > datetime('now', '-${windowMinutes} minutes')`,  // ❌ SQLite datetime
      [ipAddress]
    );
    const attemptCount = result.rows[0].attempt_count;
    return attemptCount >= maxAttempts;
  }
}
```

### AFTER - PostgreSQL (✅ Fixed)
```javascript
const { query } = require('../database/db');

class SecurityService {
  static async logSecurityEvent(eventData) {
    const result = await query(
      `INSERT INTO security_events 
       (event_type, severity, user_id, ip_address, user_agent, description, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)  // ✅ PostgreSQL placeholders
       RETURNING id, created_at`,  // ✅ Get returned values
      [eventType, severity, userId, ipAddress, userAgent, description, JSON.stringify(metadata)]
    );

    const event = result.rows[0];  // ✅ PostgreSQL way
    return { id: event.id, created_at: event.created_at };  // ✅ Use returned timestamp
  }

  static async isRateLimited(ipAddress, maxAttempts = 5, windowMinutes = 15) {
    const result = await query(
      `SELECT COUNT(*) as attempt_count 
       FROM failed_login_attempts 
       WHERE ip_address = $1 
       AND attempt_time > NOW() - INTERVAL '${windowMinutes} minutes'`,  // ✅ PostgreSQL interval
      [ipAddress]
    );
    const attemptCount = parseInt(result.rows[0].attempt_count, 10);  // ✅ Parse count
    return attemptCount >= maxAttempts;
  }
}
```

### Key Changes for Security Service
| SQLite | PostgreSQL |
|--------|-----------|
| `await run()` | `await query()` |
| `result.lastID` | `result.rows[0].id` |
| `datetime('now')` | `NOW()` |
| `datetime('now', '-15 minutes')` | `NOW() - INTERVAL '15 minutes'` |
| No RETURNING | `RETURNING id, created_at` |

---

## 3. Rate Limiting Query

### BEFORE - SQLite (❌ Broken)
```javascript
// Clean old entries first
await run(
  `DELETE FROM api_rate_limits 
   WHERE window_start < datetime('now', '-${windowMinutes} minutes')`
);

// Check current window
const result = await query(
  `SELECT request_count, window_start 
   FROM api_rate_limits 
   WHERE ip_address = ? AND endpoint = ? 
   AND window_start > datetime('now', '-${windowMinutes} minutes')`,
  [ipAddress, endpoint]
);

// Insert if not exists
await run(
  `INSERT INTO api_rate_limits 
   (ip_address, endpoint, request_count, window_start)
   VALUES (?, ?, 1, datetime('now'))`,
  [ipAddress, endpoint]
);

// Update counter
await run(
  `UPDATE api_rate_limits 
   SET request_count = request_count + 1, 
       last_request = datetime('now')
   WHERE ip_address = ? AND endpoint = ?`,
  [ipAddress, endpoint]
);
```

### AFTER - PostgreSQL (✅ Fixed)
```javascript
// Clean old entries first
await query(
  `DELETE FROM api_rate_limits 
   WHERE window_start < NOW() - INTERVAL '${windowMinutes} minutes'`  // ✅ PostgreSQL interval
);

// Check current window
const result = await query(
  `SELECT request_count, window_start 
   FROM api_rate_limits 
   WHERE ip_address = $1 AND endpoint = $2 
   AND window_start > NOW() - INTERVAL '${windowMinutes} minutes'`,  // ✅ $1, $2 placeholders
  [ipAddress, endpoint]
);

// Insert if not exists
await query(
  `INSERT INTO api_rate_limits 
   (ip_address, endpoint, request_count, window_start)
   VALUES ($1, $2, 1, NOW())`,  // ✅ Now() instead of datetime
  [ipAddress, endpoint]
);

// Update counter
await query(
  `UPDATE api_rate_limits 
   SET request_count = request_count + 1, 
       last_request = NOW()
   WHERE ip_address = $1 AND endpoint = $2`,  // ✅ $1, $2 placeholders
  [ipAddress, endpoint]
);
```

---

## 4. Blog Article Model

### BEFORE - SQLite (❌ Broken)
```javascript
const { query, run, get } = require('../database/sqlite');

class BlogArticle {
  static async create({ title, slug, content, excerpt, authorId, featured_image }) {
    const existingArticle = await get('SELECT id FROM blog_articles WHERE slug = ?', [slug]);
    if (existingArticle) {
      throw new Error('Article slug already exists');
    }

    const result = await run(
      `INSERT INTO blog_articles (title, slug, content, excerpt, author_id, featured_image, published)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,  // ❌ SQLite syntax
      [title, slug, content, excerpt, authorId || null, featured_image || '']
    );

    return {
      id: result.lastID,  // ❌ SQLite lastID
      published: false    // ❌ SQLite 0/1
    };
  }

  static async findPublished() {
    const result = await query('SELECT * FROM blog_articles WHERE published = 1 ORDER BY created_at DESC');
    // ❌ SQLite: published = 1
    return result.rows.map(article => ({
      ...article,
      published: Boolean(article.published)  // ❌ Convert 0/1 to boolean
    }));
  }
}
```

### AFTER - PostgreSQL (✅ Fixed)
```javascript
const { query } = require('../database/db');

class BlogArticle {
  static async create({ title, slug, content, excerpt, authorId, featured_image }) {
    const existingResult = await query('SELECT id FROM blog_articles WHERE slug = $1', [slug]);
    if (existingResult.rows.length > 0) {  // ✅ Check .rows array
      throw new Error('Article slug already exists');
    }

    const result = await query(
      `INSERT INTO blog_articles (title, slug, content, excerpt, author_id, featured_image, published)
       VALUES ($1, $2, $3, $4, $5, $6, FALSE)  // ✅ PostgreSQL syntax with $1, $2... and FALSE
       RETURNING id, title, slug, excerpt, author_id, featured_image, published, created_at, updated_at`,  // ✅ RETURNING
      [title, slug, content, excerpt, authorId || null, featured_image || '']
    );

    const article = result.rows[0];  // ✅ Get from result.rows[0]
    return {
      id: article.id,  // ✅ From returned data
      published: article.published  // ✅ Already boolean
    };
  }

  static async findPublished() {
    const result = await query('SELECT * FROM blog_articles WHERE published = TRUE ORDER BY created_at DESC');
    // ✅ PostgreSQL: published = TRUE
    return result.rows.map(article => ({
      ...article,
      published: article.published  // ✅ Already boolean, no conversion needed
    }));
  }
}
```

---

## 5. Parameter Counting in Dynamic Queries

### BEFORE - SQLite (❌ Broken)
```javascript
let queryText = `UPDATE blog_articles SET `;
const updateFields = [];
const updateValues = [];

if (title !== undefined) {
  updateFields.push('title = ?');  // ❌ Can't track parameter number
  updateValues.push(title);
}
if (slug !== undefined) {
  updateFields.push('slug = ?');  // ❌ All placeholders are ?
  updateValues.push(slug);
}

queryText += updateFields.join(', ') + ' WHERE id = ?';
updateValues.push(id);

await run(queryText, updateValues);  // ❌ This works in SQLite but is confusing
```

### AFTER - PostgreSQL (✅ Fixed)
```javascript
let queryText = `UPDATE blog_articles SET `;
const updateFields = [];
const updateValues = [];
let paramCount = 1;  // ✅ Track parameter number

if (title !== undefined) {
  updateFields.push(`title = $${paramCount}`);  // ✅ Use $1, $2, $3...
  updateValues.push(title);
  paramCount++;  // ✅ Increment counter
}
if (slug !== undefined) {
  updateFields.push(`slug = $${paramCount}`);  // ✅ $2, $3...
  updateValues.push(slug);
  paramCount++;
}

queryText += updateFields.join(', ') + ` WHERE id = $${paramCount}`;  // ✅ Final parameter number
updateValues.push(id);

await query(queryText, updateValues);  // ✅ Now parameters are correctly numbered
```

---

## Summary Table

| Aspect | SQLite | PostgreSQL |
|--------|--------|-----------|
| **Import** | `require('../database/sqlite')` | `require('../database/db')` |
| **Query Function** | `query()`, `run()`, `get()` | `query()` only |
| **Placeholders** | `?` | `$1, $2, $3...` |
| **Return Value** | `result.lastID` | `result.rows[0].id` |
| **Boolean** | `0` / `1` | `FALSE` / `TRUE` |
| **Date Functions** | `datetime('now')` | `NOW()` |
| **Intervals** | `datetime('now', '-7 days')` | `NOW() - INTERVAL '7 days'` |
| **Returning Data** | No native support | `RETURNING` clause |
| **Counter Types** | Returned as is | Parse to int: `parseInt()` |
| **IP Addresses** | VARCHAR | INET type |
| **JSON** | TEXT | JSONB type |

---

## Testing Changes

### Before Fix (❌ Would Fail)
```bash
# Registration would fail with:
# Error: database query error: no such table: users
# OR
# Error: ENOTDIR: not a directory, open './data/adria_style_studio.db'
```

### After Fix (✅ Works)
```bash
# Registration succeeds with:
# User created successfully with ID: 1
# JWT token generated and returned
# Login uses the stored password hash for verification
```

---

## Conclusion

The migration from SQLite to PostgreSQL required:
1. ✅ Changing all parameter placeholders (`?` → `$1, $2...`)
2. ✅ Updating boolean values (`0/1` → `TRUE/FALSE`)
3. ✅ Fixing date/time functions (`datetime()` → `NOW()`)
4. ✅ Using proper interval syntax for time calculations
5. ✅ Leveraging PostgreSQL's RETURNING clause
6. ✅ Using PostgreSQL-specific data types (INET, JSONB)
7. ✅ Tracking parameter counts in dynamic queries

All changes maintain the same functionality while using proper PostgreSQL syntax and best practices.
