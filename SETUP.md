# Adria Style Studio - Dynamic Website

A full-stack web application for closet styling and wardrobe matching with user authentication and PostgreSQL database.

## Features

- **User Authentication**: Registration, login, and JWT-based authentication
- **Protected Routes**: Outfit matcher and other features require login
- **Marketing Email List**: Contact form submissions saved to PostgreSQL
- **Interactive Outfit Matcher**: Upload and match clothing items
- **Blog**: Read styling articles
- **Responsive Design**: Works on all devices

## Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **JWT** for authentication
- **bcryptjs** for password hashing
- **express-validator** for input validation

### Frontend
- HTML5, CSS3, JavaScript
- Responsive design with custom CSS
- Client-side authentication management

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v12 or higher) - [Download](https://www.postgresql.org/download/)
- **npm** (comes with Node.js)

## Installation & Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure PostgreSQL Database

First, ensure PostgreSQL is running on your system. Then create a database:

```bash
# Access PostgreSQL (adjust based on your setup)
psql -U postgres

# Create database
CREATE DATABASE adria_style_studio;

# Exit PostgreSQL
\q
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=adria_style_studio
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password

# JWT Configuration
JWT_SECRET=your_very_secure_random_jwt_secret_key_change_this_to_something_random
JWT_EXPIRE=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

**Important**: Change the `JWT_SECRET` to a long random string for security.

### 4. Initialize the Database

Run the database setup script to create tables:

```bash
npm run db:setup
```

This will create the following tables:
- `users` - User accounts
- `email_list` - Marketing email list from contact form
- `sessions` - Session management (optional)

### 5. Start the Server

For development (with auto-restart):
```bash
npm run dev
```

For production:
```bash
npm start
```

The server will start on `http://localhost:3000`

## Usage

### Accessing the Application

1. **Homepage** (`http://localhost:3000`)
   - Publicly accessible
   - Submit contact form (saves to database)
   - View blog articles
   - Login/Register buttons

2. **Register** (`http://localhost:3000/register.html`)
   - Create a new account
   - Requires email and password (min 6 characters)

3. **Login** (`http://localhost:3000/login.html`)
   - Login with email and password
   - Receives JWT token stored in cookie and localStorage

4. **Outfit Matcher** (`http://localhost:3000/matcher.html`)
   - **Requires authentication** - redirects to homepage if not logged in
   - Upload and match clothing items
   - Interactive demo

5. **Blog** (`http://localhost:3000/blog.html`)
   - Publicly accessible
   - Read styling articles

## API Endpoints

### Authentication Routes

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user (protected)

### Email List Routes

- `POST /api/email/subscribe` - Add email to marketing list
- `GET /api/email/list` - Get all subscribed emails (protected)
- `POST /api/email/unsubscribe` - Unsubscribe from list

### Health Check

- `GET /api/health` - Server health check

## Database Schema

### Users Table
```sql
- id (SERIAL PRIMARY KEY)
- email (VARCHAR(255) UNIQUE NOT NULL)
- password_hash (VARCHAR(255) NOT NULL)
- first_name (VARCHAR(100))
- last_name (VARCHAR(100))
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- last_login (TIMESTAMP)
```

### Email List Table
```sql
- id (SERIAL PRIMARY KEY)
- email (VARCHAR(255) UNIQUE NOT NULL)
- name (VARCHAR(200))
- phone (VARCHAR(50))
- message (TEXT)
- subscribed (BOOLEAN DEFAULT TRUE)
- source (VARCHAR(50))
- created_at (TIMESTAMP)
```

## Project Structure

```
.
├── server/
│   ├── server.js                 # Express server setup
│   ├── database/
│   │   ├── db.js                 # PostgreSQL connection
│   │   └── setup.js              # Database initialization
│   ├── models/
│   │   ├── User.js               # User model
│   │   └── EmailList.js          # Email list model
│   ├── controllers/
│   │   ├── authController.js     # Auth logic
│   │   └── emailController.js    # Email list logic
│   ├── middleware/
│   │   └── auth.js               # JWT authentication middleware
│   └── routes/
│       ├── auth.js               # Auth routes
│       └── email.js              # Email routes
├── js/
│   ├── auth.js                   # Client-side auth utilities
│   ├── landing.js                # Homepage functionality
│   └── matcher.js                # Outfit matcher logic
├── css/
│   ├── landing.css               # Homepage styles
│   └── styles.css                # General styles
├── index.html                    # Homepage (public)
├── login.html                    # Login page
├── register.html                 # Registration page
├── matcher.html                  # Outfit matcher (protected)
├── blog.html                     # Blog page (public)
├── package.json                  # Dependencies
├── .env                          # Environment variables (not in git)
└── .gitignore                    # Git ignore rules
```

## Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **HTTP-Only Cookies**: Tokens stored in secure cookies
- **Input Validation**: express-validator for all inputs
- **SQL Injection Protection**: Parameterized queries
- **Environment Variables**: Sensitive data in .env file

## Deployment Considerations

### For Production:

1. **Set NODE_ENV to production**:
   ```env
   NODE_ENV=production
   ```

2. **Use a production PostgreSQL instance**:
   - Consider managed services like AWS RDS, Heroku Postgres, or DigitalOcean

3. **Set secure JWT secret**:
   - Use a long, random string (at least 32 characters)

4. **Enable HTTPS**:
   - Use SSL/TLS certificates
   - Update cookie settings for secure flag

5. **Environment Variables**:
   - Never commit .env file
   - Use your hosting platform's environment variable management

6. **Database Backups**:
   - Set up regular automated backups

## Troubleshooting

### Database Connection Issues

If you get "connection refused" errors:
1. Ensure PostgreSQL is running: `sudo service postgresql status`
2. Check your DB credentials in `.env`
3. Verify database exists: `psql -l`

### Port Already in Use

If port 3000 is taken:
1. Change PORT in `.env` file
2. Or kill the process: `lsof -ti:3000 | xargs kill`

### JWT Token Errors

If authentication fails:
1. Clear browser cookies and localStorage
2. Verify JWT_SECRET is set in `.env`
3. Check token expiration time

## Development

To add new features:

1. **Backend**: Add routes in `server/routes/`, controllers in `server/controllers/`
2. **Frontend**: Update HTML files and create JS modules in `js/`
3. **Database**: Modify schema in `server/database/setup.js`

## License

Private - All rights reserved

## Contact

For questions or support, please contact through the website contact form.
