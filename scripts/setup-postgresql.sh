#!/bin/bash

# PostgreSQL Setup Script for Adria Project
# This script helps set up the PostgreSQL database and user

set -e

echo "🔧 PostgreSQL Database Setup for Adria Style Studio"
echo "=================================================="
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    echo "   Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
    echo "   macOS: brew install postgresql"
    exit 1
fi

echo "✓ PostgreSQL found"
echo ""

# Database credentials from .env
DB_USER="adria_user"
DB_PASSWORD="adria_password"
DB_NAME="adria_style_studio"
DB_HOST="localhost"

echo "📋 Using the following configuration:"
echo "   Database User: $DB_USER"
echo "   Database Name: $DB_NAME"
echo "   Database Host: $DB_HOST"
echo ""

# Create the database user and database
echo "🔑 Creating PostgreSQL user and database..."

sudo -u postgres psql <<EOF
-- Drop existing user and database if they exist
DROP DATABASE IF EXISTS $DB_NAME;
DROP ROLE IF EXISTS $DB_USER;

-- Create new role/user
CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$DB_PASSWORD';
ALTER ROLE $DB_USER CREATEDB;

-- Create database
CREATE DATABASE $DB_NAME OWNER $DB_USER;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Display confirmation
\echo '✓ Database and user created successfully!'
EOF

echo ""
echo "✅ PostgreSQL setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Verify .env file contains correct credentials"
echo "   2. Run: npm install"
echo "   3. Run: node server/database/setup.js (to create tables)"
echo "   4. Run: npm start (to start the server)"
echo ""
echo "🌐 Access the application at: http://localhost:3000"
