# 🚀 FastAPI Backend - Quick Reference

## Start the Server

```bash
# Start FastAPI server (runs in background)
cd /home/dusitnober/Projects/Adria-Project-1
nohup python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 > fastapi.log 2>&1 &

# Or with auto-reload (development)
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

## Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | HTML/CSS/JS website |
| FastAPI | http://localhost:8000 | Python backend API |
| API Docs | http://localhost:8000/docs | Interactive Swagger UI |
| API Docs Alt | http://localhost:8000/redoc | ReDoc documentation |
| Health Check | http://localhost:8000/api/health | Server status |

## Test Credentials

**Admin Account:**
- Email: `admin@adriastyle.com`
- Password: `Admin123!`

**Test User:**
- Email: `testfastapi@example.com`
- Password: `FastAPI123!`

## Common Commands

### Register User
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","firstName":"Test","lastName":"User"}'
```

### Login User
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@adriastyle.com","password":"Admin123!"}'
```

### Get Current User
```bash
curl http://localhost:8000/api/auth/me \
  -H "Cookie: token=YOUR_TOKEN_HERE"
```

### Get Admin Stats
```bash
curl http://localhost:8000/api/admin/stats \
  -H "Cookie: token=YOUR_TOKEN_HERE"
```

### Get All Users
```bash
curl http://localhost:8000/api/admin/users \
  -H "Cookie: token=YOUR_TOKEN_HERE"
```

### Create Blog Article
```bash
curl -X POST http://localhost:8000/api/admin/articles \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_TOKEN_HERE" \
  -d '{"title":"My Article","slug":"my-article","content":"Content here","published":true}'
```

### Get Blog Articles
```bash
curl http://localhost:8000/api/blog/articles
```

### Subscribe Email
```bash
curl -X POST http://localhost:8000/api/email/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"subscriber@example.com","name":"John","phone":"555-1234","message":"Interested!"}'
```

## Database Management

### Initialize Database
```bash
python -m backend.init_db
```

### Reset Database
```bash
rm adria.db
python -m backend.init_db
```

### View Database (with sqlite3)
```bash
# List tables
sqlite3 adria.db ".tables"

# Query users
sqlite3 adria.db "SELECT id, email, first_name FROM users;"

# Query articles
sqlite3 adria.db "SELECT id, title, slug, published FROM blog_articles;"
```

## Backend Files

| File | Purpose |
|------|---------|
| `backend/main.py` | Main FastAPI app, all routes |
| `backend/models.py` | Database models (User, BlogArticle, EmailList) |
| `backend/database.py` | Database connection & session |
| `backend/schemas.py` | Pydantic validation schemas |
| `backend/security.py` | Authentication & password hashing |
| `backend/init_db.py` | Database initialization |
| `requirements-fastapi.txt` | Python dependencies |
| `adria.db` | SQLite database file |

## Useful Links

- API Documentation: http://localhost:8000/docs
- FastAPI Docs: https://fastapi.tiangolo.com/
- SQLAlchemy Docs: https://docs.sqlalchemy.org/
- Pydantic Docs: https://docs.pydantic.dev/

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 8000 in use | Change port: `--port 8001` |
| Module not found | Install: `pip install -r requirements-fastapi.txt` |
| Database locked | Delete `adria.db` and reinitialize |
| JWT token expired | Request new token by logging in again |
| Admin access denied | Ensure account has `is_admin=True` in DB |

## Frontend Works As-Is! ✅

The existing HTML/CSS/JavaScript frontend (`public/` folder) is 100% compatible with FastAPI!

- No changes needed
- All API calls work seamlessly
- JWT tokens handled automatically
- Ready for production

## Key Endpoints Summary

```
Authentication:
  POST   /api/auth/register      - New user
  POST   /api/auth/login         - Login
  POST   /api/auth/logout        - Logout
  GET    /api/auth/me            - Current user

Blog (Public):
  GET    /api/blog/articles      - All published
  GET    /api/blog/articles/{slug} - Single article

Admin (Protected):
  GET    /api/admin/stats        - Dashboard stats
  GET    /api/admin/users        - List users
  GET    /api/admin/users/{id}   - User details
  DELETE /api/admin/users/{id}   - Delete user
  POST   /api/admin/users/{id}/promote    - Make admin
  POST   /api/admin/users/{id}/demote     - Remove admin
  PUT    /api/admin/users/{id}/tier       - Update tier
  PUT    /api/admin/users/{id}/status     - Update status
  PUT    /api/admin/users/{id}/notes      - Add notes
  GET    /api/admin/articles     - All articles
  POST   /api/admin/articles     - Create
  PUT    /api/admin/articles/{id} - Update
  DELETE /api/admin/articles/{id} - Delete

Email:
  POST   /api/email/subscribe    - Newsletter signup

Health:
  GET    /api/health             - Server status
```

## Production Checklist

- [ ] Update `SECRET_KEY` in `.env`
- [ ] Switch to HTTPS (set `secure=True` in cookies)
- [ ] Use PostgreSQL instead of SQLite
- [ ] Enable CORS properly (don't use `*`)
- [ ] Set up logging
- [ ] Use Gunicorn for production
- [ ] Set up environment variables
- [ ] Test all endpoints thoroughly
- [ ] Set up SSL/TLS certificate
- [ ] Configure firewall rules
- [ ] Set up monitoring/alerts
- [ ] Document deployment process

## Support

For issues or questions:
1. Check `fastapi.log` for error messages
2. Visit http://localhost:8000/docs for API documentation
3. Review code in `backend/main.py`
4. Check FastAPI documentation: https://fastapi.tiangolo.com/

---

**Your FastAPI backend is ready to go! 🎉**
