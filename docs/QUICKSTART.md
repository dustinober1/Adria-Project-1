# Quick Start Guide - Adria Style Studio

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Up Database
```bash
# Create PostgreSQL database
createdb adria_style_studio

# Or using psql
psql -U postgres
CREATE DATABASE adria_style_studio;
\q
```

### Step 3: Configure Environment
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your settings
nano .env  # or use your preferred editor
```

**Required settings in .env:**
- `DB_USER` - Your PostgreSQL username (often 'postgres')
- `DB_PASSWORD` - Your PostgreSQL password
- `JWT_SECRET` - A random secure string (e.g., run `openssl rand -base64 32`)

### Step 4: Initialize Database Tables
```bash
npm run db:setup
```

### Step 5: Start the Server
```bash
npm run dev
```

Visit `http://localhost:3000` 🎉

---

## 📋 What Changed?

### New Features
✅ **User Authentication** - Users must register/login to access protected features  
✅ **PostgreSQL Database** - All data now stored in database  
✅ **Protected Routes** - Outfit matcher requires login  
✅ **Marketing Email List** - Contact form saves to database  
✅ **JWT Tokens** - Secure authentication with tokens  

### New Pages
- `/login.html` - User login page
- `/register.html` - User registration page

### Public Pages (No Login Required)
- `/` or `/index.html` - Homepage
- `/blog.html` - Blog articles

### Protected Pages (Login Required)
- `/matcher.html` - Outfit matcher

### API Endpoints
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get user info
- `POST /api/email/subscribe` - Save contact form

---

## 🔑 User Flow

1. **New User**: Visit homepage → Click "Sign Up" → Fill form → Access matcher
2. **Returning User**: Visit homepage → Click "Login" → Access matcher
3. **Contact Form**: Anyone can submit (saves to `email_list` table)

---

## 🗄️ Database Tables

### `users` table
Stores user accounts with hashed passwords

### `email_list` table  
Stores contact form submissions for marketing

---

## 🛠️ Common Commands

```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start

# Reset database
npm run db:setup

# Check server health
curl http://localhost:3000/api/health
```

---

## 🔐 Security Notes

- Passwords are hashed with bcrypt (never stored in plain text)
- JWT tokens stored in HTTP-only cookies + localStorage
- SQL injection protection via parameterized queries
- Input validation on all endpoints
- Change `JWT_SECRET` to a secure random value!

---

## 📞 Support

If you encounter issues:

1. **Database connection errors**: Check PostgreSQL is running and credentials in `.env`
2. **Port in use**: Change `PORT` in `.env` or stop other services
3. **Authentication issues**: Clear browser cookies/localStorage
4. **Detailed setup**: See `SETUP.md` for comprehensive guide

---

## 🎨 Customization

### Change Port
Edit `.env`:
```
PORT=8080
```

### Change Token Expiration
Edit `.env`:
```
JWT_EXPIRE=30d  # 30 days instead of 7
```

### Add More Protected Routes
1. Add auth check in HTML file:
```javascript
document.addEventListener('DOMContentLoaded', async () => {
  await auth.protectPage();
});
```

---

**Happy Styling! 👗✨**
