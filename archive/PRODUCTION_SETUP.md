# Production Setup Guide for Adria Style Studio

This guide will help you set up your Adria Style Studio application for production with PostgreSQL and HTTPS.

## 1. PostgreSQL Database Setup

### Prerequisites
- PostgreSQL installed and running on your system
- Sudo access to run PostgreSQL commands as the postgres user

### Creating the Database and User

1. Switch to the postgres user and access PostgreSQL:
   ```bash
   sudo -u postgres psql
   ```

2. In the PostgreSQL prompt, run these commands:
   ```sql
   CREATE USER adria_user WITH PASSWORD 'adria_password';
   CREATE DATABASE adria_style_studio OWNER adria_user;
   GRANT ALL PRIVILEGES ON DATABASE adria_style_studio TO adria_user;
   \q
   ```

3. Update your `.env` file with the correct database credentials:
   ```env
   DATABASE_URL=postgresql://adria_user:adria_password@localhost/adria_style_studio
   ```

### Alternative: Using Default PostgreSQL User
If you prefer to use the default postgres user (not recommended for production):
1. Update your `.env` file:
   ```env
   DATABASE_URL=postgresql://postgres:your_postgres_password@localhost/adria_style_studio
   ```

## 2. Environment Configuration

Update your `.env` file with production-appropriate values:

```env
# Server Configuration
PORT=8000
HOST=0.0.0.0

# Database Configuration
DATABASE_URL=postgresql://adria_user:adria_password@localhost/adria_style_studio

# JWT Configuration
SECRET_KEY=your_very_secure_random_jwt_secret_key_change_this_in_production_with_a_long_random_string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200  # 30 days

# CORS Configuration
FRONTEND_URL=https://yourdomain.com
FRONTEND_URL_DEV=http://localhost:3000,http://localhost:8000

# Security
SECURE_COOKIES=true
DEBUG=false

# Database
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=10
```

**Important**: Generate a secure SECRET_KEY for production:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## 3. HTTPS Setup

### For Development (Self-Signed Certificates)
Run the provided script to generate self-signed certificates:
```bash
./setup_https.sh
```

### For Production (Recommended)
1. Obtain SSL certificates from a Certificate Authority (e.g., Let's Encrypt)
2. Install Certbot for automatic certificate management:
   ```bash
   sudo apt-get install certbot  # On Ubuntu/Debian
   # or
   sudo yum install certbot      # On CentOS/RHEL
   ```

3. Obtain certificates:
   ```bash
   sudo certbot certonly --standalone -d yourdomain.com
   ```

## 4. Running the Application

### Using Gunicorn (Recommended for Production)
```bash
# Install production dependencies
pip install -r requirements-production.txt

# Initialize the database
python -m backend.init_db

# Start with Gunicorn
gunicorn backend.main_https:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### With HTTPS Support
```bash
# Using self-signed certificates
SSL_KEYFILE=ssl/server.key SSL_CERTFILE=ssl/server.crt gunicorn backend.main_https:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8443
```

### Using Docker (Recommended for Production)
```bash
# Build and run with Docker Compose
docker-compose up --build
```

## 5. Production Best Practices

### Security
- Use strong, unique passwords for database users
- Enable SSL/TLS for all database connections
- Regularly update dependencies
- Implement rate limiting
- Use environment variables for sensitive data
- Set SECURE_COOKIES=true in production

### Performance
- Use a reverse proxy (like Nginx) in front of the application
- Implement caching (Redis) for frequently accessed data
- Use a CDN for static assets
- Monitor application performance

### Monitoring
- Implement structured logging
- Set up health checks
- Monitor database performance
- Set up alerts for critical issues

## 6. Deployment Checklist

- [ ] PostgreSQL database created and configured
- [ ] Environment variables properly set
- [ ] SSL certificates obtained and configured
- [ ] Production dependencies installed
- [ ] Database initialized with `python -m backend.init_db`
- [ ] Application tested with production configuration
- [ ] Backup strategy implemented
- [ ] Monitoring and logging configured

## 7. Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check credentials in your `.env` file
- Ensure the database user has proper permissions

### SSL Certificate Issues
- Verify certificate files exist and have correct permissions
- Check that the certificate matches your domain
- For self-signed certificates, browsers will show warnings (expected)

### Application Startup Issues
- Check logs for specific error messages
- Verify all required environment variables are set
- Ensure dependencies are installed with `pip install -r requirements-production.txt`