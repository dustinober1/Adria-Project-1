# Admin Backend Setup Guide

## Overview
The admin backend provides a complete management system for site owners to:
- View and manage all users
- Create, edit, and publish blog articles
- Manage admin privileges
- View dashboard statistics

## Database Setup

### New Tables Created

1. **Updated `users` table**
   - Added `is_admin` column (BOOLEAN, default: FALSE)
   - Used for role-based access control

2. **New `blog_articles` table**
   - `id`: Primary key
   - `title`: Article title
   - `slug`: URL-friendly identifier (unique)
   - `content`: Article body (markdown supported)
   - `excerpt`: Brief summary
   - `featured_image`: URL to featured image
   - `author_id`: References user who created it
   - `published`: Boolean to draft/publish articles
   - `created_at`, `updated_at`: Timestamps

### Running Database Setup

```bash
npm run db:setup
```

This will:
- Create the `blog_articles` table
- Add the `is_admin` column to `users` table
- Create indexes for faster queries

## API Endpoints

### Admin Routes (Require Authentication + Admin Privileges)
Base URL: `/api/admin`

#### Dashboard
- `GET /admin/stats` - Get dashboard statistics

#### User Management
- `GET /admin/users` - Get all users
- `GET /admin/users/:id` - Get user details
- `DELETE /admin/users/:id` - Delete a user
- `POST /admin/users/:id/promote` - Promote user to admin
- `POST /admin/users/:id/demote` - Demote admin to user

#### Blog Management
- `GET /admin/articles` - Get all articles (admin view, includes drafts)
- `POST /admin/articles` - Create new article
- `GET /admin/articles/:id` - Get single article
- `PUT /admin/articles/:id` - Update article
- `DELETE /admin/articles/:id` - Delete article
- `PATCH /admin/articles/:id/publish` - Toggle publish status

### Public Blog Routes
Base URL: `/api/blog`

- `GET /blog` - Get all published articles
- `GET /blog/:slug` - Get published article by slug

## Access Control

### Admin Dashboard
- URL: `/admin.html`
- Access: Must be authenticated AND have admin privileges
- Automatic redirect to login if not authenticated
- Automatic redirect to homepage if not admin

### Admin Privileges
- Only admins can:
  - Access `/admin.html`
  - Use admin API routes
  - Create/edit/delete articles
  - Manage users
  - Promote/demote admins

## Features

### Dashboard
- Total users count
- Total articles count
- Published articles count
- Draft articles count
- Total admin users count

### User Management
- View all users
- Search users by email or name
- View detailed user information
- Promote regular users to admin
- Demote admins to regular users
- Delete users
- Prevents self-deletion and self-demotion

### Blog Article Management
- Create articles with:
  - Title and URL slug
  - Content (markdown)
  - Excerpt
  - Featured image
  - Publish/draft toggle
- Edit existing articles
- Delete articles
- Filter articles by:
  - Publication status
  - Search by title
- Auto-generate slugs from titles
- Track article author
- Display creation/update timestamps

## First Time Admin Setup

To make a user an admin, you have two options:

### Option 1: Using the API directly
```bash
# First, register a user account normally at /register.html
# Then use SQL to make them admin:

psql -U your_db_user -d adria_style_studio -c "UPDATE users SET is_admin = true WHERE email = 'admin@example.com';"
```

### Option 2: Using the admin dashboard
1. An existing admin promotes a regular user to admin via the Users section

## Security Considerations

1. **Authentication**: All admin routes require valid JWT token
2. **Authorization**: All admin routes verify `is_admin` privilege
3. **SQL Injection**: Uses parameterized queries
4. **Password Hashing**: Passwords hashed with bcryptjs
5. **CORS**: Configured for production
6. **HTTP Only Cookies**: JWT tokens stored in secure cookies

## Frontend Components

### Admin Dashboard (`/admin.html`)
- Responsive sidebar navigation
- Dashboard with statistics
- User management interface
- Article management interface
- Article creation form
- User details modal
- Article edit modal
- Real-time search and filtering

### Styling (`/css/admin.css`)
- Professional admin UI
- Responsive design (mobile-friendly)
- Status badges for articles and users
- Modal dialogs for detailed views
- Notification system

### JavaScript (`/js/admin.js`)
- Authentication check
- Section navigation
- Data loading and display
- Form submissions
- Modal management
- Real-time filtering
- Error handling

## Testing the Admin Panel

1. Start the server:
   ```bash
   npm start
   ```

2. Register a new user at `http://localhost:3000/register.html`

3. Make that user an admin:
   ```bash
   psql -U postgres -d adria_style_studio -c "UPDATE users SET is_admin = true WHERE email = 'your@email.com';"
   ```

4. Log in at `http://localhost:3000/login.html`

5. Navigate to `http://localhost:3000/admin.html`

## Troubleshooting

### Admin page shows "You do not have admin privileges"
- Ensure your account has `is_admin = true` in the database
- Check the users table: `SELECT * FROM users;`

### Articles not showing
- Verify articles table was created: `\dt blog_articles` in psql
- Check that articles are in the database

### Changes not reflecting
- Try refreshing the page (Refresh button in toolbar)
- Clear browser cache
- Check browser console for errors

### Database connection errors
- Verify PostgreSQL is running
- Check `.env` file for correct database credentials
- Ensure database name matches config

## Next Steps

1. Set up your first admin account
2. Create some blog articles
3. Publish articles to make them public
4. Manage users through the admin panel
5. Customize the CSS to match your brand
