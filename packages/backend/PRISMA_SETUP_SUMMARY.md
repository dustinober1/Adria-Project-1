# Prisma Setup Summary - Sprint 2

This document provides a complete summary of the Prisma database setup for the Adria Cross authentication and RBAC system.

## What Was Created

### 1. Prisma Schema (`prisma/schema.prisma`)

**Database Models:**

#### User Model
- **Purpose:** Core user authentication and authorization
- **Fields:**
  - `id` (UUID) - Primary key
  - `email` (String, unique) - User email address
  - `password` (String) - Bcrypt hashed password
  - `firstName` (String) - User's first name
  - `lastName` (String) - User's last name
  - `role` (UserRole enum) - User role for RBAC
  - `isActive` (Boolean) - Account active status
  - `createdAt` (DateTime) - Account creation timestamp
  - `updatedAt` (DateTime) - Last update timestamp
- **Indexes:**
  - Unique index on `email`
  - Regular indexes on `email`, `role`, `isActive`, `createdAt`
- **Relations:**
  - One-to-many with RefreshToken

#### RefreshToken Model
- **Purpose:** JWT refresh token management
- **Fields:**
  - `id` (UUID) - Primary key
  - `token` (String, unique) - Refresh token string
  - `userId` (String) - Foreign key to User
  - `expiresAt` (DateTime) - Token expiration timestamp
  - `createdAt` (DateTime) - Token creation timestamp
- **Indexes:**
  - Unique index on `token`
  - Regular indexes on `userId`, `token`, `expiresAt`
- **Relations:**
  - Many-to-one with User (CASCADE on delete)

#### UserRole Enum
- `CLIENT` - Regular client users (default)
- `ADMIN` - Admin users with elevated privileges
- `SUPER_ADMIN` - Super admin with full system access

### 2. Database Migration (`prisma/migrations/20251122000000_init_auth_and_rbac/`)

**Migration Name:** `init_auth_and_rbac`
**Created:** November 22, 2025

**SQL Operations:**
1. Creates `UserRole` enum type
2. Creates `users` table with all fields and constraints
3. Creates `refresh_tokens` table with foreign key
4. Creates all indexes for performance optimization
5. Sets up CASCADE delete for refresh tokens when user is deleted

**Migration Files:**
- `migration.sql` - SQL schema changes
- `migration_lock.toml` - Provider lock (PostgreSQL)

### 3. Database Seed Script (`prisma/seed.ts`)

**Purpose:** Populate database with initial test users

**Created Users:**

1. **Super Admin**
   - Email: `admin@adriacross.com`
   - Password: `Admin123!`
   - Role: `SUPER_ADMIN`
   - Name: Adria Cross

2. **Regular Admin**
   - Email: `admin@test.com`
   - Password: `Admin123!`
   - Role: `ADMIN`
   - Name: Admin User

3. **Test Client**
   - Email: `client@test.com`
   - Password: `Test123!`
   - Role: `CLIENT`
   - Name: Test Client

**Features:**
- Uses `upsert` to prevent duplicate users on re-runs
- Bcrypt password hashing (10 rounds)
- Displays created users with credentials after seeding

### 4. Prisma Client Singleton (`src/lib/prisma.ts`)

**Purpose:** Provide a singleton instance of PrismaClient to prevent multiple connections

**Features:**
- Prevents multiple instances in development (hot reload)
- Configures connection pooling
- Environment-specific logging:
  - Development: `query`, `error`, `warn`
  - Production: `error` only
- Global instance management
- Graceful shutdown helper

**Connection Pool:**
- Development: 5 connections per instance
- Staging: 10 connections per instance
- Production: 10 connections per instance

### 5. Package.json Scripts

**Added Scripts:**
```json
{
  "build": "tsc && prisma generate",
  "prisma:generate": "prisma generate",
  "prisma:migrate:dev": "prisma migrate dev",
  "prisma:migrate:deploy": "prisma migrate deploy",
  "prisma:migrate:status": "prisma migrate status",
  "prisma:studio": "prisma studio",
  "prisma:seed": "tsx prisma/seed.ts",
  "db:seed": "prisma db seed"
}
```

**Prisma Seed Configuration:**
```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

### 6. Environment Variables (`.env.example`)

**Updated/Added Variables:**
```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/adria_dev

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRY=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRY=7d
```

**Key Changes:**
- `JWT_EXPIRY` changed from `7d` to `15m` (more secure)
- Added `JWT_REFRESH_SECRET` for refresh token signing
- Added `JWT_REFRESH_EXPIRY` (7 days for refresh tokens)

### 7. Documentation Files

Created comprehensive documentation:

1. **`prisma/README.md`** - Prisma setup and usage guide
   - Database schema documentation
   - Setup instructions
   - Common commands
   - Connection pooling configuration
   - Troubleshooting

2. **`prisma/MIGRATION_GUIDE.md`** - Migration procedures
   - Initial setup steps
   - Development workflow
   - Production deployment
   - Migration rollback procedures
   - Best practices

3. **`ENV_VARIABLES.md`** - Environment variable reference
   - Complete variable listing
   - Environment-specific configurations
   - Secret management guide
   - Security checklist
   - Troubleshooting

4. **`PRISMA_SETUP_SUMMARY.md`** - This file

## Directory Structure

```
packages/backend/
├── prisma/
│   ├── migrations/
│   │   ├── 20251122000000_init_auth_and_rbac/
│   │   │   └── migration.sql
│   │   └── migration_lock.toml
│   ├── README.md
│   ├── MIGRATION_GUIDE.md
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   └── lib/
│       └── prisma.ts
├── ENV_VARIABLES.md
├── PRISMA_SETUP_SUMMARY.md
├── .env.example (updated)
└── package.json (updated)
```

## Required Environment Variables

To run migrations and seed the database, you need:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
JWT_SECRET=min-32-character-secret-key
JWT_EXPIRY=15m
JWT_REFRESH_SECRET=min-32-character-refresh-secret-key
JWT_REFRESH_EXPIRY=7d
```

**Generate Secrets:**
```bash
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For JWT_REFRESH_SECRET
```

## Next Steps to Run Migrations

### 1. Set Up Database Connection

**Option A: Local PostgreSQL**
```bash
# Install PostgreSQL
brew install postgresql@15

# Start PostgreSQL
brew services start postgresql@15

# Create database
createdb adria_dev

# Update .env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/adria_dev"
```

**Option B: Cloud SQL with Proxy**
```bash
# Start Cloud SQL Proxy
cloud-sql-proxy PROJECT:REGION:INSTANCE --port 5432

# Update .env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE"
```

### 2. Copy Environment Variables

```bash
cd packages/backend
cp .env.example .env

# Edit .env with your actual values
# Especially DATABASE_URL, JWT_SECRET, and JWT_REFRESH_SECRET
```

### 3. Apply Migration

```bash
cd packages/backend

# Apply the migration
npm run prisma:migrate:deploy

# This will create:
# - users table
# - refresh_tokens table
# - UserRole enum
# - All indexes
```

### 4. Seed the Database

```bash
npm run db:seed

# This creates test users:
# - admin@adriacross.com (SUPER_ADMIN)
# - admin@test.com (ADMIN)
# - client@test.com (CLIENT)
```

### 5. Generate Prisma Client

```bash
npm run prisma:generate

# This generates TypeScript types in node_modules/@prisma/client
```

### 6. Verify Setup

```bash
# Check migration status
npm run prisma:migrate:status

# Open Prisma Studio to view data
npm run prisma:studio
# Opens at http://localhost:5555
```

## Using Prisma Client in Code

```typescript
// Import Prisma Client singleton
import prisma from './lib/prisma';

// Query users
const users = await prisma.user.findMany({
  where: {
    isActive: true,
  },
  select: {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    role: true,
  },
});

// Find user by email
const user = await prisma.user.findUnique({
  where: {
    email: 'admin@adriacross.com',
  },
});

// Create user
const newUser = await prisma.user.create({
  data: {
    email: 'newuser@example.com',
    password: hashedPassword,
    firstName: 'John',
    lastName: 'Doe',
    role: 'CLIENT',
  },
});

// Create refresh token
const refreshToken = await prisma.refreshToken.create({
  data: {
    token: 'unique-refresh-token-string',
    userId: user.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  },
});

// Delete expired tokens
await prisma.refreshToken.deleteMany({
  where: {
    expiresAt: {
      lt: new Date(),
    },
  },
});
```

## CI/CD Integration

### GitHub Actions (Already Configured)

The existing `pr-checks.yml` workflow will:
- Install dependencies (includes Prisma)
- Run type checking (validates Prisma Client)
- Run tests

**No changes needed** - Prisma is already included in dependencies.

### Cloud Build (Needs Update)

Update `cloudbuild-staging.yaml` and `cloudbuild-production.yaml` to run migrations:

```yaml
# Add before deployment step
- name: 'node:18'
  id: 'run-migrations'
  entrypoint: 'bash'
  args:
    - '-c'
    - |
      cd packages/backend
      npm install
      npm run prisma:migrate:deploy
  env:
    - 'DATABASE_URL=${_DATABASE_URL}'
```

## Database Indexes for Performance

The schema includes indexes on commonly queried fields:

**Users Table:**
- `email` (unique) - Used for login lookups
- `role` - Used for RBAC filtering
- `isActive` - Used to filter active users
- `createdAt` - Used for sorting and date filtering

**Refresh Tokens Table:**
- `token` (unique) - Used for token validation
- `userId` - Used for user's token lookups
- `expiresAt` - Used for expired token cleanup

These indexes will significantly improve query performance as the database grows.

## Security Features

1. **Password Hashing:** Bcrypt with 10 rounds (configurable)
2. **JWT Tokens:** Separate secrets for access and refresh tokens
3. **Short-lived Access Tokens:** 15 minutes (reduces exposure window)
4. **Refresh Token Rotation:** 7-day expiry with database tracking
5. **Cascade Delete:** Refresh tokens automatically deleted when user is deleted
6. **Account Status:** `isActive` flag for soft account disabling
7. **Unique Constraints:** Prevent duplicate emails and tokens

## Testing Considerations

For testing with Prisma:

1. **Unit Tests:** Mock Prisma Client
   ```typescript
   jest.mock('./lib/prisma', () => ({
     default: {
       user: {
         findUnique: jest.fn(),
         create: jest.fn(),
       },
     },
   }));
   ```

2. **Integration Tests:** Use test database
   ```env
   DATABASE_URL="postgresql://test:test@localhost:5432/adria_test"
   ```

3. **Test Cleanup:** Reset database between tests
   ```typescript
   beforeEach(async () => {
     await prisma.refreshToken.deleteMany();
     await prisma.user.deleteMany();
   });
   ```

## Performance Considerations

1. **Connection Pooling:** Configured via `DATABASE_URL` query params
   ```
   ?connection_limit=10&pool_timeout=20
   ```

2. **Query Optimization:** Use Prisma's `select` to fetch only needed fields
   ```typescript
   const user = await prisma.user.findUnique({
     where: { email },
     select: { id: true, email: true, password: true, role: true },
   });
   ```

3. **Batch Operations:** Use `createMany`, `updateMany`, `deleteMany` for bulk ops
   ```typescript
   await prisma.refreshToken.deleteMany({
     where: { expiresAt: { lt: new Date() } },
   });
   ```

4. **Monitoring:** Enable Prisma metrics and tracing
   ```prisma
   generator client {
     provider        = "prisma-client-js"
     previewFeatures = ["metrics", "tracing"]
   }
   ```

## Maintenance Tasks

### Daily
- Monitor query performance in Cloud SQL Console
- Review error logs for database connection issues

### Weekly
- Clean up expired refresh tokens (can be automated)
  ```typescript
  await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  ```

### Monthly
- Review and optimize slow queries
- Check database size and storage usage
- Verify backup retention policies

### Quarterly
- Rotate JWT secrets (requires coordinated deployment)
- Review user accounts and remove inactive ones
- Performance testing and capacity planning

## Troubleshooting

### Common Issues

1. **"Environment variable not found: DATABASE_URL"**
   - Solution: Create `.env` file with `DATABASE_URL`

2. **"Can't reach database server"**
   - Solution: Start Cloud SQL Proxy or local PostgreSQL

3. **"Migration has already been applied"**
   - Solution: Run `npm run prisma:migrate:status` to check

4. **"Prisma Client not found"**
   - Solution: Run `npm run prisma:generate`

See `prisma/MIGRATION_GUIDE.md` for detailed troubleshooting.

## Resources

- **Prisma Docs:** https://www.prisma.io/docs
- **Cloud SQL Guide:** `/docs/DATABASE_SETUP.md`
- **Migration Guide:** `prisma/MIGRATION_GUIDE.md`
- **Env Variables:** `ENV_VARIABLES.md`

## Summary

✅ Prisma schema created with User and RefreshToken models
✅ Initial migration generated for auth and RBAC
✅ Database seed script with test users created
✅ Prisma Client singleton configured
✅ Package.json scripts added for Prisma operations
✅ Environment variables updated with JWT config
✅ Comprehensive documentation created

**Status:** Ready for migration deployment
**Next Sprint:** US-2.2 - Implement authentication endpoints using Prisma
