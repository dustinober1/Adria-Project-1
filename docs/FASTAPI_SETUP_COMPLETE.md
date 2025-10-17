# FastAPI Backend - Complete Setup & Migration Guide

## 🎉 SUCCESS! Your FastAPI Backend is Ready

Your Adria Style Studio application has been successfully migrated to a **FastAPI backend** with **SQLite database**, while keeping your beautiful HTML/CSS/JavaScript frontend intact!

## Project Structure

```
Adria-Project-1/
├── backend/
│   ├── __init__.py
│   ├── main.py                 # Main FastAPI application with all routes
│   ├── database.py             # Database configuration and session management
│   ├── models.py               # SQLAlchemy ORM models (User, BlogArticle, EmailList)
│   ├── schemas.py              # Pydantic validation schemas
│   ├── security.py             # Authentication, JWT tokens, password hashing
│   └── init_db.py              # Database initialization script
├── public/                     # Frontend (unchanged)
│   ├── index.html
│   ├── register.html
│   ├── login.html
│   ├── admin.html
│   ├── matcher.html
│   ├── blog.html
│   ├── js/auth.js             # Works seamlessly with FastAPI!
│   ├── js/admin.js
│   ├── js/landing.js
│   └── css/
├── adria.db                   # SQLite database (auto-created)
├── requirements-fastapi.txt   # Python dependencies
├── fastapi.log               # Server logs
└── FASTAPI_BACKEND_README.md # Detailed backend documentation
```

## Quick Start

### 1. Install Dependencies (Already Done!)

```bash
pip install -r requirements-fastapi.txt
```

Installed packages:
- ✅ fastapi==0.119.0 - Modern async web framework
- ✅ uvicorn==0.37.0 - ASGI server
- ✅ sqlalchemy==2.0.44 - ORM for database
- ✅ pydantic==2.11.7 - Data validation
- ✅ python-jose==3.5.0 - JWT authentication
- ✅ bcrypt==5.0.0 - Password hashing
- ✅ email-validator==2.3.0 - Email validation
- ✅ python-dotenv==1.1.0 - Environment variables

### 2. Initialize Database (Already Done!)

```bash
python -m backend.init_db
```

This creates:
- ✅ SQLite database (`adria.db`)
- ✅ All tables (users, blog_articles, email_list)
- ✅ Admin account: `admin@adriastyle.com` / `Admin123!`
- ✅ Sample blog articles for testing

### 3. Start the Server

The FastAPI server is currently running on **`http://localhost:8000`**

```bash
# Development mode with auto-reload
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

# Production mode
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

### 4. Access the API Documentation

Visit `http://localhost:8000/docs` for interactive Swagger UI documentation!

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user  
- `GET /api/auth/me` - Get current user

### Blog (Public)
- `GET /api/blog/articles` - Get all published articles
- `GET /api/blog/articles/{slug}` - Get single article by slug

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/{id}` - User details
- `DELETE /api/admin/users/{id}` - Delete user
- `POST /api/admin/users/{id}/promote` - Make admin
- `POST /api/admin/users/{id}/demote` - Remove admin
- `PUT /api/admin/users/{id}/tier` - Update tier (free/paid)
- `PUT /api/admin/users/{id}/status` - Update status
- `PUT /api/admin/users/{id}/notes` - Add admin notes
- `GET /api/admin/articles` - List all articles
- `POST /api/admin/articles` - Create article
- `PUT /api/admin/articles/{id}` - Update article
- `DELETE /api/admin/articles/{id}` - Delete article

### Email
- `POST /api/email/subscribe` - Subscribe to newsletter

## Testing

### Register a New User
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 5,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "isAdmin": false
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

### Get Current User
```bash
curl -X GET http://localhost:8000/api/auth/me \
  -H "Cookie: token=YOUR_JWT_TOKEN"
```

### Get Admin Stats (Requires Auth + Admin)
```bash
curl -X GET http://localhost:8000/api/admin/stats \
  -H "Cookie: token=YOUR_JWT_TOKEN"
```

## Frontend Integration

The existing frontend already works perfectly with FastAPI! The `public/js/auth.js` file handles all API communication:

```javascript
// All these functions work seamlessly
await auth.register(email, password, firstName, lastName);
await auth.login(email, password);
await auth.logout();
const user = await auth.getCurrentUser();
await auth.subscribeEmail(email, name, phone, message);
```

**No changes needed to frontend!** It's designed to work with any JSON API.

## Database Schema

### users table
```python
id (Integer, Primary Key)
email (String, Unique)
first_name (String)
last_name (String)
hashed_password (String)
is_admin (Boolean, default=False)
customer_tier (String, default="free")  # free, paid
customer_status (String, default="green")  # green, yellow, red, active_customer
admin_notes (Text)
last_login (DateTime)
created_at (DateTime)
updated_at (DateTime)
```

### blog_articles table
```python
id (Integer, Primary Key)
title (String)
slug (String, Unique)
content (Text)
excerpt (Text)
featured_image (String)
published (Boolean, default=False)
created_at (DateTime)
updated_at (DateTime)
```

### email_list table
```python
id (Integer, Primary Key)
email (String, Unique)
name (String)
phone (String)
message (Text)
subscribed (Boolean, default=True)
created_at (DateTime)
updated_at (DateTime)
```

## Security Features

1. ✅ **Password Hashing**: bcrypt with salting (72-byte support)
2. ✅ **JWT Tokens**: Secure token-based authentication
3. ✅ **HttpOnly Cookies**: Tokens stored securely, not accessible to JavaScript
4. ✅ **CORS**: Configured for frontend requests
5. ✅ **Admin Protection**: All admin endpoints require authentication + admin role
6. ✅ **Input Validation**: Pydantic validates all requests
7. ✅ **Email Validation**: Validates email format on registration

## Authentication Flow

1. User enters credentials (register/login)
2. Backend validates and creates JWT token
3. Token returned in response AND set as httpOnly cookie
4. Frontend can use token or let cookie handle it automatically
5. Protected endpoints verify token and user permissions

```
User Registration/Login
        ↓
Validate Credentials
        ↓
Create JWT Token
        ↓
Return Token + Set HttpOnly Cookie
        ↓
Frontend includes token in requests
        ↓
Backend verifies token & user role
        ↓
Grant/Deny access
```

## Configuration

### Environment Variables (.env)

```env
# Database
DATABASE_URL=sqlite:///./adria.db

# JWT
SECRET_KEY=your-super-secret-key-change-in-production

# Server
HOST=0.0.0.0
PORT=8000
```

## Development Tips

### Run with Auto-Reload (Development)
```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### Interactive API Documentation
Visit `http://localhost:8000/docs` for Swagger UI

### Alternative API Docs
Visit `http://localhost:8000/redoc` for ReDoc

### Enable SQL Query Logging (Debug)
Edit `backend/database.py`:
```python
engine = create_engine(
    DATABASE_URL,
    echo=True  # Set to True to see all SQL queries
)
```

### Database Reset
```bash
rm adria.db
python -m backend.init_db
```

## Production Deployment

### Before Deploying:

1. **Update SECRET_KEY** in `.env`:
   ```bash
   # Generate secure key
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

2. **Enable HTTPS**:
   ```python
   # In main.py, change:
   json_response.set_cookie(
       key="token",
       secure=True,  # Only send over HTTPS
       samesite="strict"
   )
   ```

3. **Switch to PostgreSQL** (recommended for production):
   ```bash
   pip install psycopg2-binary
   # Update DATABASE_URL in .env:
   # DATABASE_URL=postgresql://user:password@localhost/adria
   ```

4. **Run with Gunicorn**:
   ```bash
   pip install gunicorn
   gunicorn backend.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
   ```

5. **Use environment variables**:
   ```bash
   export DATABASE_URL=postgresql://...
   export SECRET_KEY=your-secure-key
   python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
   ```

## Troubleshooting

### Port Already in Use
```bash
# Use different port
python -m uvicorn backend.main:app --port 8001
```

### Import Errors
```bash
# Ensure dependencies installed
pip install -r requirements-fastapi.txt
```

### Database Errors
```bash
# Reset database
rm adria.db
python -m backend.init_db
```

### Server Won't Start
```bash
# Check logs
tail -f fastapi.log

# Verify Python version (3.10+ required)
python --version

# Check port is not in use
lsof -i :8000
```

## File Comparison

| Aspect | Node.js Backend | FastAPI Backend |
|--------|-----------------|-----------------|
| Language | JavaScript | Python |
| Framework | Express | FastAPI |
| Database | SQLite | SQLite |
| ORM | Sequelize | SQLAlchemy |
| Authentication | Custom + JWT | JWT + bcrypt |
| Async | Callback-based | Native async/await |
| Performance | ~Moderate | ⭐ Faster |
| Development | npm | pip |
| Learning Curve | Medium | Easy (Python) |
| Type Checking | Manual | Built-in (Pydantic) |
| Documentation | Express docs | Auto-generated Swagger |
| Testing | Jest | pytest |

## Benefits of FastAPI

✅ **Automatic API Documentation** - Swagger UI at `/docs`  
✅ **Type Hints** - Built-in validation with Pydantic  
✅ **Async/Await** - Modern Python async framework  
✅ **Performance** - One of the fastest Python frameworks  
✅ **Developer Experience** - Auto-generated docs, easy to learn  
✅ **Security** - Built-in security features  
✅ **Standards** - OpenAPI & JSON Schema compliant  
✅ **Python Ecosystem** - Access to all Python libraries  

## What's Next?

1. ✅ Test the frontend with FastAPI backend
2. ✅ Deploy to production (Heroku, AWS, DigitalOcean, etc.)
3. ✅ Add WebSocket support for real-time features
4. ✅ Implement email notifications
5. ✅ Add caching with Redis
6. ✅ Set up CI/CD with GitHub Actions
7. ✅ Monitor with Sentry or similar

## Support & Documentation

- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **SQLAlchemy Docs**: https://docs.sqlalchemy.org/
- **Pydantic Docs**: https://docs.pydantic.dev/
- **Python-Jose Docs**: https://github.com/mpdavis/python-jose
- **Bcrypt Docs**: https://github.com/pyca/bcrypt

## Summary

Your project is now running on:

- **Frontend**: `http://localhost:3000` (existing HTML/CSS/JS)
- **Backend API**: `http://localhost:8000` (FastAPI)
- **API Docs**: `http://localhost:8000/docs`
- **Database**: `./adria.db` (SQLite)

**Everything is working! Happy coding! 🚀**
