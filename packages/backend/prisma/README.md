# Prisma Database Configuration

This directory contains the Prisma schema, migrations, and seed data for the Adria Cross authentication and RBAC system.

## Files

- **schema.prisma** - Database schema definition with User and RefreshToken models
- **seed.ts** - Database seeding script with default users
- **migrations/** - Database migration files (tracked in Git)

## Database Schema

### User Model
- `id` - UUID primary key
- `email` - Unique email address (indexed)
- `password` - Bcrypt hashed password
- `firstName` - User's first name
- `lastName` - User's last name
- `role` - User role (CLIENT, ADMIN, SUPER_ADMIN)
- `isActive` - Account active status
- `createdAt` - Timestamp of account creation
- `updatedAt` - Timestamp of last update

### RefreshToken Model
- `id` - UUID primary key
- `token` - Unique refresh token string (indexed)
- `userId` - Foreign key to User (cascades on delete)
- `expiresAt` - Token expiration timestamp
- `createdAt` - Timestamp of token creation

### User Roles (RBAC)
- **CLIENT** - Regular client users (default)
- **ADMIN** - Admin users with elevated privileges
- **SUPER_ADMIN** - Super admin with full system access

## Setup Instructions

### 1. Environment Configuration

Copy `.env.example` to `.env` and configure your database connection:

```bash
cp .env.example .env
```

Update the `DATABASE_URL` in `.env`:
```env
DATABASE_URL="postgresql://user:password@host:port/database"
```

### 2. Generate Prisma Client

```bash
npm run prisma:generate
```

This generates the TypeScript types and Prisma Client based on your schema.

### 3. Run Migrations

**Development:**
```bash
npm run prisma:migrate:dev
```

This will:
1. Apply pending migrations to your database
2. Generate Prisma Client
3. Prompt to create a new migration if schema changed

**Production/Staging:**
```bash
npm run prisma:migrate:deploy
```

This applies pending migrations without prompts (safe for CI/CD).

### 4. Seed the Database

```bash
npm run db:seed
```

This creates the following test users:

**Super Admin:**
- Email: `admin@adriacross.com`
- Password: `Admin123!`
- Role: `SUPER_ADMIN`

**Regular Admin:**
- Email: `admin@test.com`
- Password: `Admin123!`
- Role: `ADMIN`

**Test Client:**
- Email: `client@test.com`
- Password: `Test123!`
- Role: `CLIENT`

## Common Commands

```bash
# Generate Prisma Client (run after schema changes)
npm run prisma:generate

# Create and apply migration (development)
npm run prisma:migrate:dev

# Apply migrations (production)
npm run prisma:migrate:deploy

# Check migration status
npm run prisma:migrate:status

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Seed database
npm run db:seed
```

## Database Connection

### Local Development (Cloud SQL Proxy)

1. Start Cloud SQL Proxy:
```bash
cloud-sql-proxy your-project-id:us-central1:adria-db-dev --port 5432
```

2. Update `.env`:
```env
DATABASE_URL="postgresql://adria_app_user:password@localhost:5432/adria_dev"
```

### Cloud Run (Production)

Use Cloud SQL Connector via Unix socket:
```env
DATABASE_URL="postgresql://user:password@/database?host=/cloudsql/PROJECT:REGION:INSTANCE"
```

## Schema Changes

When modifying the schema:

1. Edit `schema.prisma`
2. Create migration: `npm run prisma:migrate:dev --name describe_your_change`
3. Review generated SQL in `migrations/` directory
4. Apply migration: `npm run prisma:migrate:dev`
5. Commit schema and migration files to Git

## Connection Pooling

Prisma Client is configured with connection pooling via the singleton pattern in `src/lib/prisma.ts`.

Default pool sizes:
- **Development**: 5 connections
- **Staging**: 10 connections
- **Production**: 10 connections per Cloud Run instance

Adjust pool size via connection string:
```env
DATABASE_URL="postgresql://user:pass@host/db?connection_limit=10&pool_timeout=20"
```

## Troubleshooting

### Migration Conflicts

```bash
# Check migration status
npm run prisma:migrate:status

# Reset database (DESTRUCTIVE - dev only)
npx prisma migrate reset

# Mark migration as applied manually
npx prisma migrate resolve --applied "migration_name"
```

### Connection Issues

```bash
# Test database connection
npx prisma db pull

# Check Prisma Client version
npx prisma --version
```

### Generate Client After Schema Changes

```bash
# Regenerate Prisma Client
npm run prisma:generate
```

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Cloud SQL with Prisma](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-google-cloud-run)

## Security Notes

- **Never commit `.env` files** - They contain sensitive credentials
- **Use strong JWT secrets** - Generate with `openssl rand -base64 32`
- **Hash all passwords** - Use bcrypt with 10+ rounds
- **Rotate secrets regularly** - Especially for production
- **Use IAM authentication** - For Cloud SQL in production (recommended)

## Next Steps

After setting up Prisma:

1. Run migrations: `npm run prisma:migrate:dev`
2. Seed database: `npm run db:seed`
3. Implement authentication endpoints using Prisma Client
4. Create user service layer in `src/services/user.service.ts`
5. Add refresh token rotation logic
6. Set up automated token cleanup (expired tokens)
