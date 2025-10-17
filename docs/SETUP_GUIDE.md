# 🚀 Complete Setup Guide - Adria Style Studio

## Authentication Issue - FIXED ✅

The authentication system has been completely migrated from SQLite to PostgreSQL. All models and services now use PostgreSQL.

---

## Prerequisites

### 1. Install PostgreSQL
Choose your operating system:

#### **Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### **macOS (Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

#### **Windows:**
Download and install from: https://www.postgresql.org/download/windows/

#### **Docker (Recommended for Development):**
```bash
docker run --name adria-postgres \
  -e POSTGRES_USER=adria_user \
  -e POSTGRES_PASSWORD=adria_password \
  -e POSTGRES_DB=adria_style_studio \
  -p 5432:5432 \
  -d postgres:latest
```

---

## Setup Instructions

### Step 1: Install Node Dependencies
```bash
cd /home/dusitnober/Projects/Adria-Project-1
npm install
```

### Step 2: Create PostgreSQL Database and User

#### Option A: Using the Setup Script (Linux/macOS)
```bash
bash scripts/setup-postgresql.sh
```

#### Option B: Manual Setup
Open PostgreSQL CLI:
```bash
# Linux/macOS
sudo -u postgres psql

# Windows - use pgAdmin or PostgreSQL command prompt
```

Then run these commands:
```sql
-- Create user
CREATE ROLE adria_user WITH LOGIN PASSWORD 'adria_password';
ALTER ROLE adria_user CREATEDB;

-- Create database
CREATE DATABASE adria_style_studio OWNER adria_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE adria_style_studio TO adria_user;

-- Verify
\l  -- List databases
\du -- List users
```

### Step 3: Initialize Database Tables
```bash
node server/database/setup.js
```

This creates all necessary tables:
- `users` - User accounts
- `email_list` - Marketing emails
- `blog_articles` - Blog posts
- `sessions` - Active sessions
- `security_events` - Security audit log
- `failed_login_attempts` - Rate limiting tracking
- `api_rate_limits` - API rate limiting

### Step 4: Verify Environment Configuration
Check `.env` file (should look like this):
```properties
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=adria_style_studio
DB_USER=adria_user
DB_PASSWORD=adria_password
JWT_SECRET=test_jwt_secret_key_for_development_only_change_in_production
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

### Step 5: Start the Application
```bash
# Production mode
npm start

# Development mode (with auto-reload)
npm run dev
```

The server will start on `http://localhost:3000`

---

## Testing Account Creation & Login

### 1. Register a New Account
- Open: http://localhost:3000/register.html
- Fill in:
  - Email: test@example.com
  - Password: TestPass123!
  - First Name: Test
  - Last Name: User
- Click "Register"

### 2. Login
- Open: http://localhost:3000/login.html
- Enter credentials you just created
- Click "Login"

### 3. Verify in Admin Panel
- Open: http://localhost:3000/admin.html
- You should see your new account in the users list

---

## What Was Fixed 🔧

### Database Migration (SQLite → PostgreSQL)

**Files Updated:**
- ✅ `server/models/User.js` - User creation, authentication, profile
- ✅ `server/models/BlogArticle.js` - Blog post management
- ✅ `server/models/EmailList.js` - Newsletter subscriptions
- ✅ `server/models/Admin.js` - Admin functions
- ✅ `server/services/securityService.js` - Security logging & rate limiting
- ✅ `.env` - Database configuration

### Key Changes:
1. Changed SQL parameter syntax: `?` → `$1, $2, $3...`
2. Updated boolean values: `0/1` → `FALSE/TRUE`
3. Fixed date functions: `datetime('now')` → `NOW()`
4. Updated interval syntax: `datetime('now', '-15 minutes')` → `NOW() - INTERVAL '15 minutes'`
5. Converted table data types to PostgreSQL standards (INET for IP, JSONB for JSON)

---

## Troubleshooting

### ❌ Error: "connect ECONNREFUSED 127.0.0.1:5432"
**Solution:** PostgreSQL is not running
```bash
# Start PostgreSQL
sudo systemctl start postgresql  # Linux
brew services start postgresql  # macOS
```

### ❌ Error: "role 'adria_user' does not exist"
**Solution:** Create the user (see Step 2 above)

### ❌ Error: "database 'adria_style_studio' does not exist"
**Solution:** Create the database and run setup.js (see Step 2 & 3)

### ❌ Port 3000 already in use
**Solution:** Change PORT in `.env` or kill the existing process
```bash
# Find process using port 3000
lsof -i :3000
# Kill it
kill -9 <PID>
```

### ❌ "Cannot find module 'pg'"
**Solution:** Install dependencies
```bash
npm install
```

---

## Features Now Working ✨

- ✅ User Registration with Email Validation
- ✅ Secure Password Hashing (bcryptjs)
- ✅ User Login with JWT Authentication
- ✅ Admin User Management
- ✅ Security Event Logging
- ✅ Rate Limiting on Failed Logins
- ✅ Blog Article Management
- ✅ Email Newsletter Subscriptions
- ✅ Secure API Endpoints

---

## Development Notes

### Database Schema
All tables use PostgreSQL features:
- SERIAL for auto-increment IDs
- TIMESTAMP for dates (UTC by default)
- INET type for IP addresses
- JSONB for flexible JSON storage
- Boolean type (not 0/1)

### Security Features
- Passwords hashed with bcryptjs (salt rounds: 10)
- JWT tokens for authentication (expires in 7 days)
- Rate limiting: 5 failed attempts per 15 minutes per IP
- CORS protection
- Helmet security headers
- SQL injection prevention (parameterized queries)

---

## Additional Resources

- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Express.js Guide: https://expressjs.com/
- JWT Best Practices: https://tools.ietf.org/html/rfc7519
- bcryptjs Documentation: https://github.com/dcodeIO/bcrypt.js

---

## Support

If you encounter any issues:
1. Check the error message in the terminal
2. Review the `.env` configuration
3. Verify PostgreSQL is running: `psql -U adria_user -d adria_style_studio -c "SELECT version();"`
4. Check logs in `server/utils/logger.js`

