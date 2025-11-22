# Environment Variables Reference

This document describes all environment variables used by the Adria Cross backend application.

## Required Variables

### Server Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Application environment | `development`, `staging`, `production` | Yes |
| `PORT` | Server port | `3001` | Yes |

### Database

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` | Yes |

**Connection String Formats:**

**Local Development (Cloud SQL Proxy):**
```env
DATABASE_URL="postgresql://adria_app_user:password@localhost:5432/adria_dev"
```

**Cloud Run (Unix Socket):**
```env
DATABASE_URL="postgresql://adria_app_user:password@/adria_prod?host=/cloudsql/PROJECT:REGION:INSTANCE"
```

**Connection Pool Parameters:**
```env
DATABASE_URL="postgresql://user:pass@host/db?connection_limit=10&pool_timeout=20"
```

### JWT Authentication

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `JWT_SECRET` | Secret key for signing JWT access & refresh tokens | `your-secret-key-min-32-chars` | Yes |
| `JWT_EXPIRES_IN` | Access token expiration time | `7d` | Yes |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh token expiration time | `30d` | Yes |
| `BCRYPT_ROUNDS` | Salt rounds for password hashing | `10` | No |

**Security Notes:**
- Use strong, random secrets (minimum 32 characters)
- Generate with: `openssl rand -base64 32`
- Rotate secrets regularly in production
- Never commit secrets to version control

**Time Formats:**
- `s` - seconds
- `m` - minutes
- `h` - hours
- `d` - days

**Recommended Settings:**
- Development: Access `7d`, Refresh `30d`
- Production: Access `15m`, Refresh `7d`

## Optional Variables

### Email (SendGrid)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `SENDGRID_API_KEY` | SendGrid API key for email sending | `SG.xxx` | No |
| `FROM_EMAIL` | Default sender email address | `noreply@adriacross.com` | No |
| `ADMIN_EMAIL` | Admin notification email | `admin@adriacross.com` | No |

### Google Cloud

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `GCP_PROJECT_ID` | Google Cloud project ID | `adria-project-123` | No |
| `GCS_BUCKET_NAME` | Cloud Storage bucket for files | `adria-files` | No |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 client ID | `xxx.apps.googleusercontent.com` | No |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 client secret | `xxx` | No |

### Frontend URLs

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `FRONTEND_URL` | Frontend application URL | `http://localhost:3000` | No |
| `BACKEND_URL` | Backend API URL | `http://localhost:3001` | No |

### Rate Limiting

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in milliseconds | `60000` (1 minute) | No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` | No |

**Default Rate Limits (if not set):**
- Window: 15 minutes (900000 ms)
- Max requests: 100

## Environment-Specific Configurations

### Development (.env.local)

```env
NODE_ENV=development
PORT=3001

# Local database via Cloud SQL Proxy
DATABASE_URL="postgresql://adria_app_user:dev_password_123@localhost:5432/adria_dev"

# JWT - use simple secrets for dev
JWT_SECRET=dev-secret-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d
BCRYPT_ROUNDS=10

# SendGrid (optional for dev)
SENDGRID_API_KEY=
FROM_EMAIL=noreply@adriacross.com
ADMIN_EMAIL=admin@adriacross.com

# Google Cloud (optional for dev)
GCP_PROJECT_ID=
GCS_BUCKET_NAME=

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001

# Rate limiting (relaxed for dev)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000
LOG_LEVEL=info
```

### Staging (Cloud Run Environment Variables)

```env
NODE_ENV=staging
PORT=8080

# Cloud SQL Unix socket connection
DATABASE_URL="postgresql://adria_app_user:STAGING_PASSWORD@/adria_staging?host=/cloudsql/PROJECT:REGION:adria-db-staging"

# JWT - use strong secrets from Secret Manager
JWT_SECRET=<from-secret-manager>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# SendGrid
SENDGRID_API_KEY=<from-secret-manager>
FROM_EMAIL=staging@adriacross.com
ADMIN_EMAIL=admin@adriacross.com

# Google Cloud
GCP_PROJECT_ID=adria-project-staging
GCS_BUCKET_NAME=adria-files-staging

# URLs
FRONTEND_URL=https://staging.adriacross.com
BACKEND_URL=https://api-staging.adriacross.com

# Rate limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

### Production (Cloud Run Environment Variables)

```env
NODE_ENV=production
PORT=8080

# Cloud SQL Unix socket connection with IAM auth
DATABASE_URL="postgresql://adria_app_user:PROD_PASSWORD@/adria_prod?host=/cloudsql/PROJECT:REGION:adria-db-prod"

# JWT - use strong secrets from Secret Manager
JWT_SECRET=<from-secret-manager>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# SendGrid
SENDGRID_API_KEY=<from-secret-manager>
FROM_EMAIL=noreply@adriacross.com
ADMIN_EMAIL=admin@adriacross.com

# Google Cloud
GCP_PROJECT_ID=adria-project-prod
GCS_BUCKET_NAME=adria-files-prod

# URLs
FRONTEND_URL=https://adriacross.com
BACKEND_URL=https://api.adriacross.com

# Rate limiting (strict for prod)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=warn
```

## Secret Management

### Local Development

Use `.env` file (never commit to Git):

```bash
cp .env.example .env
# Edit .env with your local values
```

### Cloud Run (Staging/Production)

Use Google Secret Manager for sensitive values:

```bash
# Create secret
echo -n "your-secret-value" | gcloud secrets create SECRET_NAME \
  --data-file=- \
  --replication-policy="automatic"

# Grant Cloud Run service account access
gcloud secrets add-iam-policy-binding SECRET_NAME \
  --member="serviceAccount:SERVICE_ACCOUNT@PROJECT.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Mount secret as environment variable in Cloud Run
gcloud run services update SERVICE_NAME \
  --update-secrets=JWT_SECRET=SECRET_NAME:latest
```

### Required Secrets for Production

1. `adria-jwt-secret` - JWT access token secret
2. `adria-jwt-refresh-secret` - JWT refresh token secret
3. `adria-db-prod-password` - Database password
4. `adria-sendgrid-api-key` - SendGrid API key
5. `adria-google-client-secret` - OAuth client secret (if using)

## Validation

The application validates required environment variables on startup:

```typescript
// src/config/env.ts validates:
- NODE_ENV is set
- PORT is a valid number
- DATABASE_URL is a valid PostgreSQL connection string
- JWT_SECRET and JWT_REFRESH_SECRET are at least 32 characters
- All required variables are present
```

If validation fails, the application will exit with an error message.

## Accessing Environment Variables

```typescript
// Use process.env directly
const databaseUrl = process.env.DATABASE_URL;

// Or use config module (recommended)
import config from './config/env';
const jwtSecret = config.jwt.secret;
```

## Security Checklist

- [ ] Never commit `.env` files to Git
- [ ] Use `.env.example` as a template (without real values)
- [ ] Use Secret Manager for production secrets
- [ ] Rotate JWT secrets quarterly
- [ ] Use strong, random secrets (32+ characters)
- [ ] Use different secrets for each environment
- [ ] Limit access to secrets (principle of least privilege)
- [ ] Enable Cloud Audit Logs for secret access
- [ ] Use IAM authentication for Cloud SQL in production
- [ ] Regularly review and update secrets

## Troubleshooting

### "Environment variable not found" Error

**Cause:** Required variable is missing from `.env` file

**Solution:**
1. Check `.env.example` for required variables
2. Copy missing variable to `.env`
3. Set appropriate value

### "Invalid DATABASE_URL" Error

**Cause:** Malformed connection string

**Solution:**
1. Verify format: `postgresql://user:pass@host:port/database`
2. Check special characters are URL-encoded
3. Ensure Cloud SQL Proxy is running (if using)

### "JWT secret must be at least 32 characters" Error

**Cause:** JWT secret is too short

**Solution:**
```bash
# Generate strong secret
openssl rand -base64 32

# Add to .env
JWT_SECRET=<generated-secret>
JWT_REFRESH_SECRET=<generated-secret>
```

## Resources

- [Google Secret Manager](https://cloud.google.com/secret-manager/docs)
- [Cloud Run Environment Variables](https://cloud.google.com/run/docs/configuring/environment-variables)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
