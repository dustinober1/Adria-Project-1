# 🎯 Quick Start Reference

## The Problem (FIXED ✅)
- Account creation wasn't working
- SQLite and PostgreSQL were mixed in the code
- Database configuration was incorrect

## What Was Fixed
✅ Migrated all database models from SQLite to PostgreSQL
✅ Updated SQL syntax in all files (parameter placeholders: `?` → `$1, $2...`)
✅ Updated `.env` with correct PostgreSQL configuration
✅ Security services now use PostgreSQL

## Quick Setup (5 Minutes)

### Using Docker (Easiest - No PostgreSQL Installation Needed)
```bash
# Start PostgreSQL in Docker
docker-compose up -d

# Install dependencies
npm install

# Initialize database tables
node server/database/setup.js

# Start the app
npm start
```

### Manual PostgreSQL Setup
```bash
# 1. Create database and user
sudo -u postgres psql <<EOF
CREATE ROLE adria_user WITH LOGIN PASSWORD 'adria_password';
CREATE DATABASE adria_style_studio OWNER adria_user;
GRANT ALL PRIVILEGES ON DATABASE adria_style_studio TO adria_user;
EOF

# 2. Install and initialize
npm install
node server/database/setup.js
npm start
```

## Testing
1. Go to: http://localhost:3000/register.html
2. Create account: test@example.com / TestPass123!
3. Login at: http://localhost:3000/login.html
4. Success! ✅

## Files Changed
- `server/models/User.js`
- `server/models/BlogArticle.js`
- `server/models/EmailList.js`
- `server/models/Admin.js`
- `server/services/securityService.js`
- `.env` (configuration)

## Environment Variables Needed
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=adria_style_studio
DB_USER=adria_user
DB_PASSWORD=adria_password
JWT_SECRET=your_secret_key
PORT=3000
```

## Troubleshooting
- **Error: "connect ECONNREFUSED"** → Start PostgreSQL or run `docker-compose up -d`
- **Error: "database does not exist"** → Run `node server/database/setup.js`
- **Port 3000 in use** → Change PORT in `.env` or stop the process using it

## Security Features Enabled
✅ Password hashing (bcryptjs)
✅ JWT token authentication
✅ Rate limiting on failed logins
✅ Security event logging
✅ SQL injection prevention
✅ CORS protection

---
**All systems ready!** Follow the Quick Setup steps above to get started.
