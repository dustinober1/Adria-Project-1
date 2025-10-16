# 🚀 Admin Backend - Quick Start

## Setup (3 Steps)

```bash
# 1. Create database
npm run db:setup

# 2. Make yourself admin
psql -U postgres -d adria_style_studio
UPDATE users SET is_admin = true WHERE email = 'your@email.com';

# 3. Access dashboard
npm start
# Visit: http://localhost:3000/admin.html
```

## What You Have

✅ Admin dashboard (`/admin.html`)  
✅ User management (view, promote, delete)  
✅ Blog management (create, edit, publish)  
✅ Public blog API (`/api/blog`)  
✅ Security (JWT + role-based)  

## Files Created

**Backend:**
- `server/models/Admin.js` - Admin operations
- `server/models/BlogArticle.js` - Article model
- `server/controllers/adminController.js` - Admin logic
- `server/controllers/blogController.js` - Article logic
- `server/routes/admin.js` - Protected routes
- `server/routes/blog.js` - Public routes

**Frontend:**
- `admin.html` - Dashboard UI
- `css/admin.css` - Styling
- `js/admin.js` - JavaScript

**Updated:**
- `server/server.js` - Added routes
- `server/models/User.js` - Added is_admin
- `server/middleware/auth.js` - Added admin check
- `server/database/setup.js` - Added tables

## API Endpoints

**Admin (Protected):**
```
GET    /api/admin/stats
GET    /api/admin/users
POST   /api/admin/users/:id/promote
POST   /api/admin/users/:id/demote
DELETE /api/admin/users/:id
GET    /api/admin/articles
POST   /api/admin/articles
PUT    /api/admin/articles/:id
DELETE /api/admin/articles/:id
```

**Public:**
```
GET /api/blog
GET /api/blog/:slug
```

## Database

**New Table:** `blog_articles`
- id, title, slug, content, excerpt, featured_image, author_id, published, created_at, updated_at

**Updated:** `users` table
- Added: `is_admin` column

## Features

- Dashboard with statistics
- User management
- Article CRUD operations
- Publish/unpublish control
- Search and filtering
- Responsive design
- Mobile-friendly

## Documentation

- `ADMIN_SETUP.md` - Detailed setup & troubleshooting
- `QUICK_REFERENCE.txt` - Quick lookup

**Status**: ✅ Production Ready
