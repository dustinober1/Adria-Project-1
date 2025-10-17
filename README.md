# Adria Style Studio - FastAPI Backend

A modern, professional style consultation web application built with **FastAPI** (Python) backend and responsive HTML/CSS/JavaScript frontend.

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- pip (Python package manager)

### Installation & Setup

1. **Install Python Dependencies**
   ```bash
   pip install -r requirements-fastapi.txt
   ```

2. **Initialize Database**
   ```bash
   python -m backend.init_db
   ```
   This creates the SQLite database with tables and sample data including an admin account.

3. **Start FastAPI Server**
   ```bash
   python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
   ```

4. **Start Frontend (Node.js)** (if using old Node frontend server)
   ```bash
   npm install
   npm start
   ```

5. **Access the Application**
   - Frontend: http://localhost:3000
   - API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## 📋 Project Structure

```
Adria-Project-1/
├── backend/                    # FastAPI Python application
│   ├── main.py                # Main app with all endpoints
│   ├── models.py              # SQLAlchemy database models
│   ├── database.py            # Database configuration
│   ├── schemas.py             # Pydantic validation schemas
│   ├── security.py            # Authentication & password hashing
│   └── init_db.py             # Database initialization
├── public/                    # Frontend (HTML/CSS/JavaScript)
│   ├── index.html
│   ├── register.html
│   ├── login.html
│   ├── admin.html
│   ├── matcher.html
│   ├── blog.html
│   ├── js/                   # JavaScript files
│   │   ├── auth.js           # Authentication functions
│   │   ├── admin.js          # Admin dashboard
│   │   ├── landing.js        # Landing page
│   │   ├── matcher.js        # Style matcher
│   │   └── logger.js         # Logging utility
│   └── css/                  # Stylesheets
│       ├── admin.css
│       ├── landing.css
│       └── matcher.css
├── data/                     # Data files
│   └── users.csv
├── adria.db                  # SQLite database (auto-created)
├── requirements-fastapi.txt  # Python dependencies
└── package.json              # Node.js dependencies
```

## 🔐 Default Credentials

**Admin Account:**
- Email: `admin@adriastyle.com`
- Password: `Admin123!`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Blog (Public)
- `GET /api/blog/articles` - Get all published articles
- `GET /api/blog/articles/{slug}` - Get article by slug

### Admin (Protected)
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/{id}` - User details
- `DELETE /api/admin/users/{id}` - Delete user
- `POST /api/admin/users/{id}/promote` - Promote to admin
- `POST /api/admin/users/{id}/demote` - Demote from admin
- `PUT /api/admin/users/{id}/tier` - Update customer tier
- `PUT /api/admin/users/{id}/status` - Update customer status
- `PUT /api/admin/users/{id}/notes` - Add admin notes
- `GET /api/admin/articles` - List all articles
- `POST /api/admin/articles` - Create article
- `PUT /api/admin/articles/{id}` - Update article
- `DELETE /api/admin/articles/{id}` - Delete article

### Email
- `POST /api/email/subscribe` - Subscribe to newsletter

## 🗄️ Database

### Users Table
- id, email (unique), first_name, last_name
- hashed_password, is_admin
- customer_tier (free/paid), customer_status (green/yellow/red)
- admin_notes, last_login, created_at, updated_at

### Blog Articles Table
- id, title, slug (unique), content
- excerpt, featured_image, published
- created_at, updated_at

### Email List Table
- id, email (unique), name, phone, message
- subscribed, created_at, updated_at

## 🔑 Features

✅ User Authentication & Authorization  
✅ Admin Dashboard for User Management  
✅ Blog Article Management (Create, Update, Delete, Publish)  
✅ Email Newsletter Subscription  
✅ Customer Tier Management (Free/Paid)  
✅ Customer Status Tracking (Green/Yellow/Red)  
✅ Admin Notes for Customer Records  
✅ Secure Password Hashing (bcrypt)  
✅ JWT Token Authentication  
✅ HttpOnly Cookies for XSS Protection  
✅ Role-Based Access Control  
✅ Input Validation (Pydantic)  
✅ Auto-Generated API Documentation (Swagger UI)  
✅ CORS Support  

## 📚 Documentation

- **[FASTAPI_SETUP_COMPLETE.md](./FASTAPI_SETUP_COMPLETE.md)** - Complete setup guide with deployment info
- **[FASTAPI_BACKEND_README.md](./FASTAPI_BACKEND_README.md)** - Detailed technical documentation
- **[FASTAPI_QUICK_REFERENCE.md](./FASTAPI_QUICK_REFERENCE.md)** - Quick command reference
- **API Docs**: Available at `http://localhost:8000/docs` when server is running

## 🛠️ Development

### Run with Auto-Reload
```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### View Swagger API Documentation
```
http://localhost:8000/docs
```

### Reset Database
```bash
rm adria.db
python -m backend.init_db
```

### Check Database with SQLite
```bash
sqlite3 adria.db ".tables"
sqlite3 adria.db "SELECT * FROM users;"
```

## 🚢 Deployment

### Before Production:
1. Update `SECRET_KEY` in `.env` with a secure random value
2. Set environment variables for database and secrets
3. Consider switching from SQLite to PostgreSQL
4. Enable HTTPS and update cookie settings
5. Use Gunicorn or similar ASGI server

### Deploy with Gunicorn:
```bash
pip install gunicorn
gunicorn backend.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## 🔒 Security

- Passwords hashed with bcrypt
- JWT tokens for authentication
- HttpOnly cookies prevent XSS attacks
- CORS configured for frontend
- Input validation with Pydantic
- Admin-only endpoint protection
- Secure cookie settings (can be enhanced for HTTPS)

## 📝 Testing

### Register a User
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","firstName":"Test","lastName":"User"}'
```

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@adriastyle.com","password":"Admin123!"}'
```

### Get Current User
```bash
curl http://localhost:8000/api/auth/me \
  -H "Cookie: token=YOUR_TOKEN"
```

## 🛑 Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 8000 in use | Use different port: `--port 8001` |
| Module not found | Install dependencies: `pip install -r requirements-fastapi.txt` |
| Database locked | Delete `adria.db` and reinitialize |
| Import errors | Ensure you're in the correct directory |

## 📦 Dependencies

- **fastapi** - Modern async web framework
- **uvicorn** - ASGI server
- **sqlalchemy** - ORM for database
- **pydantic** - Data validation
- **python-jose** - JWT authentication
- **bcrypt** - Password hashing
- **email-validator** - Email validation
- **python-dotenv** - Environment variables

## 📄 License

This project is part of the Adria Style Studio application.

## 👥 Contributing

To contribute:
1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📞 Support

For issues or questions:
1. Check the documentation files in the repo
2. Review API documentation at `/docs`
3. Check the code comments in `backend/main.py`
4. Refer to FastAPI documentation: https://fastapi.tiangolo.com/

---

**Built with ❤️ using FastAPI & Python**
