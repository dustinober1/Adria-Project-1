#!/bin/bash
# Quick Start Guide for Admin Backend

echo "🚀 Admin Backend - Quick Start Guide"
echo "===================================="
echo ""

echo "Step 1: Set up the database"
echo "Run: npm run db:setup"
echo ""

echo "Step 2: Start your server"
echo "Run: npm start"
echo "Server will run at http://localhost:3000"
echo ""

echo "Step 3: Register a user"
echo "1. Go to http://localhost:3000/register.html"
echo "2. Create a new account"
echo "3. Remember the email you use"
echo ""

echo "Step 4: Make that user an admin"
echo "Run the following PostgreSQL command:"
echo ""
echo "psql -U postgres -d adria_style_studio"
echo "Then type:"
echo ""
echo "UPDATE users SET is_admin = true WHERE email = 'your@email.com';"
echo ""
echo "Replace 'your@email.com' with the email you registered"
echo ""

echo "Step 5: Log in"
echo "Go to http://localhost:3000/login.html"
echo "Enter your credentials"
echo ""

echo "Step 6: Access admin dashboard"
echo "Go to http://localhost:3000/admin.html"
echo ""

echo "✅ You're ready to manage users and create blog articles!"
echo ""
echo "For full documentation, see: ADMIN_SETUP.md"
