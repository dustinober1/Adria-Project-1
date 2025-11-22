# Database Migration Guide

This document provides comprehensive guidance on managing database schema changes and migrations for the Adria Cross website.

## Table of Contents

1. [Overview](#overview)
2. [Migration Tools](#migration-tools)
3. [Creating Migrations](#creating-migrations)
4. [Running Migrations](#running-migrations)
5. [Migration Best Practices](#migration-best-practices)
6. [Rollback Procedures](#rollback-procedures)
7. [Troubleshooting](#troubleshooting)

---

## Overview

Database migrations are version-controlled, incremental changes to the database schema. They allow us to:

- Track all database changes in Git
- Apply schema changes consistently across environments
- Safely roll back problematic changes
- Collaborate on database schema development

### Migration Strategy

- **Development:** Migrations run manually or via npm scripts
- **Staging:** Automated migrations during Cloud Build deployment
- **Production:** Automated with database backup before migration

---

## Migration Tools

We use **Prisma Migrate** as the primary migration tool for this project.

### Prisma Migrate

Prisma provides declarative schema management with automatic migration generation.

**Installation:**
```bash
npm install -D prisma
npm install @prisma/client
```

**Configuration:**
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

---

## Creating Migrations

### Development Workflow

#### 1. Modify Prisma Schema

Edit `prisma/schema.prisma`:

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  password  String
  role      Role     @default(CLIENT)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  CLIENT
  ADMIN
}
```

#### 2. Create Migration

```bash
# Create a new migration with a descriptive name
npx prisma migrate dev --name add_user_role_field

# This will:
# 1. Generate migration SQL files
# 2. Apply migration to development database
# 3. Generate Prisma Client
```

#### 3. Review Generated Migration

Check `prisma/migrations/<timestamp>_add_user_role_field/migration.sql`:

```sql
-- AlterTable
ALTER TABLE "User" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'CLIENT';
```

#### 4. Commit Migration to Git

```bash
git add prisma/
git commit -m "Add role field to User model"
```

### Migration Naming Conventions

Use descriptive names that indicate what the migration does:

**Good:**
- `add_user_role_field`
- `create_booking_table`
- `add_index_to_email`
- `remove_deprecated_status_field`

**Bad:**
- `migration_1`
- `update`
- `changes`

---

## Running Migrations

### Local Development

```bash
# Run all pending migrations
npx prisma migrate dev

# Reset database and run all migrations (destructive!)
npx prisma migrate reset

# Apply migrations without generating Prisma Client
npx prisma migrate deploy
```

### Staging Environment

Migrations run automatically during Cloud Build deployment:

```yaml
# cloudbuild-staging.yaml
steps:
  - name: 'gcr.io/cloud-builders/gcloud'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        chmod +x ./scripts/run-migrations.sh
        ./scripts/run-migrations.sh staging
```

**Script:** `scripts/run-migrations.sh`

### Production Environment

Production migrations include additional safety measures:

1. **Automatic database backup before migration**
2. **Migration execution**
3. **Verification of migration success**

```yaml
# cloudbuild-production.yaml
steps:
  - name: 'gcr.io/cloud-builders/gcloud'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        chmod +x ./scripts/run-migrations.sh
        ./scripts/run-migrations.sh production
```

### Manual Migration (Emergency)

If automated migrations fail, run manually:

```bash
# 1. Connect to Cloud SQL via proxy
cloud_sql_proxy -instances=PROJECT_ID:REGION:INSTANCE_NAME=tcp:5432

# 2. Set DATABASE_URL
export DATABASE_URL="postgresql://user:password@localhost:5432/adria_prod"

# 3. Run migrations
npx prisma migrate deploy

# 4. Verify migration status
npx prisma migrate status
```

---

## Migration Best Practices

### 1. Always Test Migrations

**Test in this order:**
1. Local development database
2. Staging database
3. Production database

```bash
# Test migration locally first
npx prisma migrate dev --name test_migration

# Verify data integrity
npm run test:integration
```

### 2. Make Migrations Reversible

When possible, design migrations that can be reversed:

```sql
-- Good: Can be reversed by dropping column
ALTER TABLE "User" ADD COLUMN "phone" TEXT;

-- Better: Include explicit rollback instruction
-- Rollback: ALTER TABLE "User" DROP COLUMN "phone";
```

### 3. Handle Data Migrations Carefully

For complex data transformations, create a separate data migration script:

```sql
-- migration.sql
-- Add new column
ALTER TABLE "User" ADD COLUMN "full_name" TEXT;

-- Populate from existing data
UPDATE "User" SET "full_name" = CONCAT("first_name", ' ', "last_name");

-- Make it required after population
ALTER TABLE "User" ALTER COLUMN "full_name" SET NOT NULL;
```

### 4. Avoid Destructive Operations in Production

**Dangerous operations:**
- `DROP TABLE`
- `DROP COLUMN` (data loss)
- `ALTER COLUMN ... TYPE` (potential data loss)

**Safer approach:**
1. Add new column
2. Copy data
3. Deprecate old column
4. Remove old column in future migration (after verification)

### 5. Use Transactions

Ensure migrations are atomic:

```sql
BEGIN;

ALTER TABLE "User" ADD COLUMN "email_verified" BOOLEAN DEFAULT false;
UPDATE "User" SET "email_verified" = true WHERE "email" IS NOT NULL;

COMMIT;
```

Prisma migrations automatically wrap changes in transactions.

### 6. Add Indexes for Performance

```prisma
model User {
  id    String @id @default(uuid())
  email String @unique
  name  String

  @@index([email])
  @@index([name])
}
```

### 7. Document Breaking Changes

Add comments to migration files:

```sql
-- BREAKING CHANGE: Removes deprecated 'status' field
-- Action required: Update client code to use 'state' instead

ALTER TABLE "Booking" DROP COLUMN "status";
```

---

## Rollback Procedures

### Automatic Rollback (Production)

If migration fails during Cloud Build, the deployment is aborted and database remains unchanged.

### Manual Rollback

#### Option 1: Restore from Backup

```bash
# 1. List available backups
gcloud sql backups list --instance=adria-db-prod

# 2. Restore from specific backup
gcloud sql backups restore BACKUP_ID \
  --backup-instance=adria-db-prod \
  --backup-instance=adria-db-prod

# Note: This creates a new instance, you'll need to point your app to it
```

#### Option 2: Create Reverse Migration

```bash
# 1. Create new migration that reverses changes
npx prisma migrate dev --name revert_problematic_change

# 2. Manually edit migration SQL to reverse previous migration
```

Example reverse migration:

```sql
-- Original migration added column
-- ALTER TABLE "User" ADD COLUMN "middle_name" TEXT;

-- Reverse migration removes column
ALTER TABLE "User" DROP COLUMN "middle_name";
```

#### Option 3: Mark Migration as Rolled Back

```bash
# Mark migration as rolled back (without applying it)
npx prisma migrate resolve --rolled-back MIGRATION_NAME
```

### Testing Rollback Procedures

**Quarterly rollback drills:**

1. Create database backup
2. Apply migration
3. Verify application works
4. Perform rollback
5. Verify rollback success
6. Document any issues

---

## Troubleshooting

### Issue: Migration fails with "relation already exists"

**Cause:** Migration was partially applied or ran multiple times

**Solution:**
```bash
# Check migration status
npx prisma migrate status

# Mark problematic migration as applied (if schema is correct)
npx prisma migrate resolve --applied MIGRATION_NAME

# Or rollback and reapply
npx prisma migrate resolve --rolled-back MIGRATION_NAME
npx prisma migrate deploy
```

### Issue: Schema drift detected

**Cause:** Manual database changes outside of migrations

**Solution:**
```bash
# Generate migration to match current database state
npx prisma db pull
npx prisma migrate dev --name sync_schema_drift
```

### Issue: Migration timeout

**Cause:** Migration takes too long (e.g., adding index to large table)

**Solution:**
1. Run migration manually during maintenance window
2. Use `CONCURRENTLY` for index creation:

```sql
-- Standard (locks table)
CREATE INDEX "User_email_idx" ON "User"("email");

-- Concurrent (doesn't lock table, but slower)
CREATE INDEX CONCURRENTLY "User_email_idx" ON "User"("email");
```

### Issue: Cannot connect to database during migration

**Cause:** Database credentials or network issues

**Solutions:**

1. **Verify DATABASE_URL:**
   ```bash
   echo $DATABASE_URL
   ```

2. **Test connection:**
   ```bash
   psql "$DATABASE_URL" -c "SELECT 1;"
   ```

3. **Check Cloud SQL Proxy:**
   ```bash
   # Start proxy
   cloud_sql_proxy -instances=PROJECT:REGION:INSTANCE=tcp:5432
   ```

4. **Verify IAM permissions:**
   ```bash
   gcloud projects get-iam-policy PROJECT_ID \
     --flatten="bindings[].members" \
     --filter="bindings.members:serviceAccount:YOUR_SA_EMAIL"
   ```

---

## Migration Checklist

Use this checklist before running production migrations:

- [ ] Migration tested in local development
- [ ] Migration tested in staging environment
- [ ] Database backup verified (production only)
- [ ] Migration is reversible or rollback plan documented
- [ ] No destructive operations (or approved by team)
- [ ] Performance impact assessed for large tables
- [ ] Application code compatible with schema changes
- [ ] Monitoring alerts configured for migration
- [ ] Team notified of maintenance window (if applicable)

---

## Alternative Migration Tools

If migrating away from Prisma in the future, consider:

### TypeORM Migrations

```bash
# Generate migration
npm run typeorm migration:generate -- -n MigrationName

# Run migrations
npm run typeorm migration:run

# Revert migration
npm run typeorm migration:revert
```

### Sequelize Migrations

```bash
# Create migration
npx sequelize-cli migration:generate --name migration-name

# Run migrations
npx sequelize-cli db:migrate

# Rollback
npx sequelize-cli db:migrate:undo
```

### Raw SQL Migrations

For projects preferring SQL-first approach:

```bash
# Create migration file
touch migrations/$(date +%Y%m%d%H%M%S)_migration_name.sql

# Run with psql
psql $DATABASE_URL -f migrations/TIMESTAMP_migration_name.sql
```

---

## References

- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [Database Migration Best Practices](https://www.prisma.io/dataguide/types/relational/migration-best-practices)
- [Cloud SQL Backup and Recovery](https://cloud.google.com/sql/docs/postgres/backup-recovery/backups)

---

## Quick Reference

```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Apply pending migrations
npx prisma migrate deploy

# Check migration status
npx prisma migrate status

# Reset database (dev only!)
npx prisma migrate reset

# Resolve migration conflicts
npx prisma migrate resolve --applied MIGRATION_NAME
npx prisma migrate resolve --rolled-back MIGRATION_NAME

# Generate Prisma Client
npx prisma generate

# Pull schema from database
npx prisma db pull

# Push schema without migrations (dev only!)
npx prisma db push
```
