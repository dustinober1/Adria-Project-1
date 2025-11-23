# Database Migration Guide

## Initial Setup (First Time)

### 1. Prerequisites

Before running migrations, ensure you have:

- PostgreSQL database instance running (local or Cloud SQL)
- `DATABASE_URL` configured in `.env` file
- Cloud SQL Proxy running (if using Cloud SQL for local development)

### 2. Apply Initial Migration

```bash
# Navigate to backend package
cd packages/backend

# Apply the initial auth and RBAC migration
npm run prisma:migrate:deploy

# Seed the database with test users
npm run db:seed
```

This will create:
- `users` table with authentication fields
- `refresh_tokens` table for JWT refresh tokens
- `UserRole` enum (CLIENT, ADMIN, SUPER_ADMIN)
- Indexes for performance optimization
- Test users for development

## Running Migrations

### Development Workflow

```bash
# 1. Make changes to prisma/schema.prisma
# 2. Create a new migration
npm run prisma:migrate:dev --name describe_your_change

# This will:
# - Generate SQL migration files
# - Apply migrations to your dev database
# - Regenerate Prisma Client
```

### Production/Staging Deployment

Migrations are automatically run during CI/CD deployment via Cloud Build:

```bash
# In cloudbuild.yaml, migrations run before deployment:
npm run prisma:migrate:deploy
```

Manual deployment (if needed):
```bash
# Apply pending migrations
npm run prisma:migrate:deploy

# Check migration status
npm run prisma:migrate:status
```

## Migration Files

### Current Migrations

1. **20251122000000_init_auth_and_rbac** - Initial authentication and RBAC setup
   - Creates User model with email, password, role, etc.
   - Creates RefreshToken model for JWT refresh tokens
   - Adds indexes for email, role, isActive, createdAt
   - Sets up foreign key relationship with CASCADE delete

### Migration Structure

```
prisma/migrations/
├── migration_lock.toml          # Prisma provider lock
└── 20251122000000_init_auth_and_rbac/
    └── migration.sql            # SQL migration script
```

## Environment-Specific Databases

### Development
```env
DATABASE_URL="postgresql://adria_app_user:dev_password_123@localhost:5432/adria_dev"
```

### Staging
```env
DATABASE_URL="postgresql://adria_app_user:staging_password@/adria_staging?host=/cloudsql/PROJECT:REGION:adria-db-staging"
```

### Production
```env
DATABASE_URL="postgresql://adria_app_user:prod_password@/adria_prod?host=/cloudsql/PROJECT:REGION:adria-db-prod"
```

## Common Migration Scenarios

### Adding a New Field

```prisma
// In schema.prisma
model User {
  // ... existing fields
  phoneNumber String? @map("phone_number")
}
```

```bash
npm run prisma:migrate:dev --name add_user_phone_number
```

### Adding a New Table

```prisma
model Profile {
  id     String @id @default(uuid())
  userId String @unique @map("user_id")
  bio    String?
  user   User   @relation(fields: [userId], references: [id])
}
```

```bash
npm run prisma:migrate:dev --name add_profile_table
```

### Adding an Index

```prisma
model User {
  // ... existing fields

  @@index([email, role]) // Composite index
}
```

```bash
npm run prisma:migrate:dev --name add_email_role_index
```

## Migration Rollback

### Development (Local)

```bash
# Reset database and reapply all migrations
npx prisma migrate reset

# This will:
# - Drop the database
# - Create a new database
# - Apply all migrations
# - Run seed script
```

### Production/Staging

For production, use the rollback procedures documented in `/docs/operations/ROLLBACK_PROCEDURES.md`:

1. Create a backup before major migrations
2. Test migration on staging first
3. Use database backups for rollback if needed

```bash
# Check migration status
npm run prisma:migrate:status

# Mark a migration as rolled back (manual SQL required)
npx prisma migrate resolve --rolled-back "migration_name"
```

## Troubleshooting

### Migration Already Applied

```
Error: Migration `xxx` has already been applied
```

**Solution:**
```bash
npx prisma migrate resolve --applied "migration_name"
```

### Migration Failed

```
Error: Migration failed to apply
```

**Solution:**
1. Check the error message for SQL issues
2. Fix the schema.prisma file
3. Delete the failed migration folder
4. Recreate the migration

### Schema Drift Detected

```
Error: The database schema is not in sync with the migration history
```

**Solution:**
```bash
# Option 1: Create a new migration to fix drift
npx prisma migrate dev --create-only
# Review the generated SQL
npx prisma migrate dev

# Option 2: Reset and reapply (dev only)
npx prisma migrate reset
```

### Connection Issues

```
Error: Can't reach database server
```

**Solution:**
1. Verify DATABASE_URL in .env
2. Check Cloud SQL Proxy is running
3. Test connection: `npx prisma db pull`

## Best Practices

1. **Always use migrations** - Never modify the database schema manually
2. **Test on staging** - Apply migrations to staging before production
3. **Review SQL** - Use `--create-only` to review generated SQL before applying
4. **Backup first** - Create manual backup before major migrations
5. **Small migrations** - Keep migrations small and focused
6. **Descriptive names** - Use clear migration names (e.g., `add_user_avatar_field`)
7. **Version control** - Always commit migration files to Git
8. **No edits** - Never edit applied migration files, create new ones

## CI/CD Integration

Migrations are automatically run during deployment:

### GitHub Actions (PR Checks)
```yaml
- name: Check migrations
  run: npm run prisma:migrate:status
```

### Cloud Build (Staging/Production)
```yaml
- name: 'Run database migrations'
  env:
    - 'DATABASE_URL=${_DATABASE_URL}'
  script: |
    cd packages/backend
    npm run prisma:migrate:deploy
```

## Security Considerations

1. **Use different users** - Separate migration user from application user
2. **Least privilege** - App user should have SELECT, INSERT, UPDATE, DELETE only
3. **Migration user** - Migration user needs DDL permissions
4. **Rotate credentials** - Rotate database passwords quarterly
5. **Audit logs** - Enable Cloud SQL audit logging for production

## Resources

- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Migration Troubleshooting](https://www.prisma.io/docs/guides/database/troubleshooting-orm)
- [Production Best Practices](https://www.prisma.io/docs/guides/deployment/deployment)
- [Cloud SQL Migration Guide](https://cloud.google.com/sql/docs/postgres/import-export)

## Next Steps

After applying migrations:

1. ✅ Verify migration status: `npm run prisma:migrate:status`
2. ✅ Seed database: `npm run db:seed`
3. ✅ Test authentication endpoints with seeded users
4. ✅ Verify indexes are created: Check in Prisma Studio
5. ✅ Monitor query performance in Cloud SQL Console
