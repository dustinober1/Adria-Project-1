# FastAPI Backend Migration

## Overview

This project has been rebuilt with a **FastAPI backend** and **SQLite database** while keeping the existing HTML/CSS/JavaScript frontend. This provides a much simpler, more maintainable Python-based backend.

## Architecture

```
Adria-Project-1/
├── backend/                 # FastAPI application
│   ├── __init__.py
│   ├── main.py             # Main FastAPI app and all routes
│   ├── database.py         # Database configuration
│   ├── models.py           # SQLAlchemy ORM models
│   ├── schemas.py          # Pydantic request/response schemas
│   ├── security.py         # Authentication & password hashing
│   └── init_db.py          # Database initialization script
├── public/                 # Frontend (unchanged)
│   ├── index.html
│   ├── register.html
│   ├── login.html
│   ├── admin.html
│   ├── js/
│   │   ├── auth.js
│   │   ├── admin.js
│   │   └── landing.js
│   └── css/
├── requirements-fastapi.txt # Python dependencies
├── adria.db                # SQLite database (created on first run)
└── run_fastapi.sh          # Script to run server

```

## Setup Instructions

### 1. Install Python Dependencies

```bash
pip install -r requirements-fastapi.txt
```

### 2. Initialize Database

```bash
python backend/init_db.py
```

This will:
- Create the SQLite database (`adria.db`)
- Create all tables
- Create an admin account: `admin@adriastyle.com` / `Admin123!`
- Add sample blog articles

### 3. Start FastAPI Server

```bash
# Development mode with auto-reload
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

# Or use the shell script
bash run_fastapi.sh

# Or via npm
npm run start-fastapi
```

The server will be running at: `http://localhost:8000`

## Key Components

### Database Models (`backend/models.py`)

#### User
- Stores user account information
- Fields: email, first_name, last_name, hashed_password
- Admin features: is_admin, customer_tier, customer_status, admin_notes
- Timestamps: created_at, updated_at, last_login

#### BlogArticle
- Stores blog articles
- Fields: title, slug, content, excerpt, featured_image, published
- Supports draft/published states
- Automatically timestamps

#### EmailList
- Stores newsletter subscribers
- Fields: email, name, phone, message, subscribed
- Tracks subscription status

### API Endpoints

#### Authentication (`/api/auth/`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | Login user |
| `/api/auth/logout` | POST | Logout user |
| `/api/auth/me` | GET | Get current user |

**Request Example:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Blog (`/api/blog/`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/blog/articles` | GET | Get all published articles |
| `/api/blog/articles/{slug}` | GET | Get article by slug |

#### Admin (`/api/admin/`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/stats` | GET | Get dashboard statistics |
| `/api/admin/users` | GET | List all users |
| `/api/admin/users/{id}` | GET | Get user details |
| `/api/admin/users/{id}` | DELETE | Delete user |
| `/api/admin/users/{id}/promote` | POST | Make user admin |
| `/api/admin/users/{id}/demote` | POST | Remove admin status |
| `/api/admin/users/{id}/tier` | PUT | Update customer tier |
| `/api/admin/users/{id}/status` | PUT | Update customer status |
| `/api/admin/users/{id}/notes` | PUT | Add admin notes |
| `/api/admin/articles` | GET | Get all articles (admin) |
| `/api/admin/articles` | POST | Create article |
| `/api/admin/articles/{id}` | PUT | Update article |
| `/api/admin/articles/{id}` | DELETE | Delete article |

#### Email (`/api/email/`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/email/subscribe` | POST | Subscribe to mailing list |

### Security Features

1. **Password Hashing**: Uses bcrypt with salting
2. **JWT Tokens**: Secure token-based authentication
3. **HttpOnly Cookies**: Tokens stored in secure, httpOnly cookies
4. **CORS**: Configured to allow frontend requests
5. **Admin Protection**: All admin endpoints require authentication + admin status

### Authentication Flow

1. User registers or logs in
2. Server validates credentials
3. JWT token is created
4. Token is returned in response AND set as httpOnly cookie
5. Frontend uses token in Authorization header or cookie is automatically included
6. Protected endpoints verify token and user permissions

## Frontend Integration

The existing frontend (`public/js/auth.js`) already works with this backend:

### Key JavaScript Functions

```javascript
// Register
await auth.register(email, password, firstName, lastName);

// Login
await auth.login(email, password);

// Logout
await auth.logout();

// Get current user
const user = await auth.getCurrentUser();

// Subscribe to email list
await auth.subscribeEmail(email, name, phone, message);
```

## Database Schema

### users table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  first_name VARCHAR,
  last_name VARCHAR,
  hashed_password VARCHAR NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  customer_tier VARCHAR DEFAULT 'free',
  customer_status VARCHAR DEFAULT 'green',
  admin_notes TEXT,
  last_login DATETIME,
  created_at DATETIME,
  updated_at DATETIME
);
```

### blog_articles table
```sql
CREATE TABLE blog_articles (
  id INTEGER PRIMARY KEY,
  title VARCHAR NOT NULL,
  slug VARCHAR UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image VARCHAR,
  published BOOLEAN DEFAULT FALSE,
  created_at DATETIME,
  updated_at DATETIME
);
```

### email_list table
```sql
CREATE TABLE email_list (
  id INTEGER PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR,
  phone VARCHAR,
  message TEXT,
  subscribed BOOLEAN DEFAULT TRUE,
  created_at DATETIME,
  updated_at DATETIME
);
```

## Environment Variables

Create a `.env` file in the project root (optional):

```env
DATABASE_URL=sqlite:///./adria.db
SECRET_KEY=your-super-secret-key-change-in-production
```

## Testing

### Test Registration
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

### Test Protected Endpoint
```bash
curl -X GET http://localhost:8000/api/admin/stats \
  -H "Cookie: token=YOUR_JWT_TOKEN"
```

## Development Tips

1. **Auto-reload**: Changes to Python files automatically reload the server
2. **Interactive API Docs**: Visit `http://localhost:8000/docs` for Swagger UI
3. **Debug**: Set `echo=True` in `database.py` to see SQL queries
4. **Database Reset**: Delete `adria.db` and run `python backend/init_db.py` to start fresh

## Troubleshooting

### Import Errors
If you see import errors, ensure you've installed dependencies:
```bash
pip install -r requirements-fastapi.txt
```

### Port Already in Use
If port 8000 is in use:
```bash
# Use a different port
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8001 --reload
```

### Database Errors
Reset database:
```bash
rm adria.db
python backend/init_db.py
```

## Next Steps

1. ✅ Backend set up and running
2. ✅ Database initialized
3. ✅ All core endpoints working
4. Test frontend authentication flow
5. Deploy to production (update SECRET_KEY, use HTTPS)

## Production Deployment

Before deploying to production:

1. **Update SECRET_KEY** in `.env`:
   ```env
   SECRET_KEY=generate-a-random-secure-key
   ```

2. **Set secure cookie flags** in `main.py`:
   ```python
   json_response.set_cookie(
       key="token",
       value=token,
       httponly=True,
       secure=True,  # Set to True for HTTPS
       samesite="strict"
   )
   ```

3. **Use PostgreSQL** instead of SQLite for production:
   ```bash
   pip install psycopg2-binary
   # Update DATABASE_URL in .env
   ```

4. **Run with Gunicorn**:
   ```bash
   pip install gunicorn
   gunicorn backend.main:app -w 4 -k uvicorn.workers.UvicornWorker
   ```

## Support

For questions or issues with the FastAPI backend, refer to:
- FastAPI docs: https://fastapi.tiangolo.com/
- SQLAlchemy docs: https://docs.sqlalchemy.org/
- Pydantic docs: https://docs.pydantic.dev/
