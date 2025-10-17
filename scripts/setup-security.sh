#!/bin/bash

# Security Setup Script for Adria Style Studio
# This script sets up the security database and configurations

echo "🔒 Setting up security features for Adria Style Studio..."

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed or not in PATH"
    echo "Please install PostgreSQL and ensure it's running"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update the .env file with your database credentials"
    echo "   - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD"
    echo "   - JWT_SECRET (generate a strong secret)"
    echo "   - FRONTEND_URL"
    read -p "Press Enter after updating .env file..."
fi

# Load environment variables
source .env

# Test database connection
echo "🔗 Testing database connection..."
if ! PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" &> /dev/null; then
    echo "❌ Cannot connect to database. Please check your .env configuration:"
    echo "   DB_HOST=$DB_HOST"
    echo "   DB_PORT=$DB_PORT"
    echo "   DB_NAME=$DB_NAME"
    echo "   DB_USER=$DB_USER"
    exit 1
fi

echo "✅ Database connection successful"

# Run database setup
echo "🗄️  Setting up security database tables..."
node server/database/setup.js

if [ $? -eq 0 ]; then
    echo "✅ Security database tables created successfully"
else
    echo "❌ Failed to create security database tables"
    exit 1
fi

# Generate secure JWT secret if not set
if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "your_very_secure_random_jwt_secret_key_change_this" ]; then
    echo "🔐 Generating secure JWT secret..."
    NEW_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    
    # Update .env file
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/JWT_SECRET=.*/JWT_SECRET=$NEW_SECRET/" .env
    else
        # Linux
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=$NEW_SECRET/" .env
    fi
    
    echo "✅ JWT secret updated in .env file"
fi

# Set appropriate file permissions
echo "🔒 Setting file permissions..."
chmod 600 .env
chmod 700 server/database/
chmod 644 server/database/*.js
chmod 700 server/services/
chmod 644 server/services/*.js
chmod 700 server/middleware/
chmod 644 server/middleware/*.js
chmod 700 server/controllers/
chmod 644 server/controllers/*.js

echo "✅ File permissions set"

# Create security logs directory
echo "📁 Creating security logs directory..."
mkdir -p logs/security
chmod 700 logs/security

echo "✅ Security logs directory created"

# Verify security features
echo "🔍 Verifying security features..."

# Check if security service is available
if node -e "require('./server/services/securityService')" 2>/dev/null; then
    echo "✅ Security service loaded successfully"
else
    echo "❌ Failed to load security service"
    exit 1
fi

# Check if validation service is available
if node -e "require('./server/services/validationService')" 2>/dev/null; then
    echo "✅ Validation service loaded successfully"
else
    echo "❌ Failed to load validation service"
    exit 1
fi

# Check if security middleware is available
if node -e "require('./server/middleware/security')" 2>/dev/null; then
    echo "✅ Security middleware loaded successfully"
else
    echo "❌ Failed to load security middleware"
    exit 1
fi

echo ""
echo "🎉 Security setup completed successfully!"
echo ""
echo "📋 Summary of security features implemented:"
echo "   ✅ Local security database with event logging"
echo "   ✅ Enhanced security headers (CSP, HSTS, etc.)"
echo "   ✅ Secure input validation with Joi"
echo "   ✅ Rate limiting and suspicious activity detection"
echo "   ✅ Failed login attempt tracking"
echo "   ✅ Admin security dashboard endpoints"
echo "   ✅ Dependency vulnerability fixes"
echo "   ✅ Secure file permissions"
echo ""
echo "🚀 Next steps:"
echo "   1. Start the server: npm run dev"
echo "   2. Test authentication endpoints"
echo "   3. Access security dashboard at /api/security/* (admin only)"
echo "   4. Monitor security events in the database"
echo ""
echo "📚 Security endpoints available:"
echo "   GET /api/security/stats - Security statistics"
echo "   GET /api/security/events - Security events"
echo "   GET /api/security/alerts - Recent security alerts"
echo "   GET /api/security/failed-login-analysis - Failed login analysis"
echo "   GET /api/security/ip-analysis/:ipAddress - IP reputation analysis"
echo "   POST /api/security/cleanup - Clean old security data"
echo "   GET /api/security/export - Export security events"
echo ""
echo "🔐 Remember to:"
echo "   - Keep your JWT secret secure"
echo "   - Regularly review security events"
echo "   - Update dependencies regularly"
echo "   - Monitor the security dashboard"
echo "   - Set up automated backups for production"
