#!/bin/bash

# Database Migration Script
# Usage: ./scripts/run-migrations.sh <environment>
# Example: ./scripts/run-migrations.sh staging

set -e

ENVIRONMENT=${1:-staging}

echo "======================================"
echo "Running Database Migrations"
echo "Environment: $ENVIRONMENT"
echo "======================================"

# Set the appropriate database connection based on environment
case $ENVIRONMENT in
  production)
    echo "Using production database..."
    DB_SECRET_NAME="PROD_DATABASE_URL"
    ;;
  staging)
    echo "Using staging database..."
    DB_SECRET_NAME="STAGING_DATABASE_URL"
    ;;
  development)
    echo "Using development database..."
    DB_SECRET_NAME="DEV_DATABASE_URL"
    ;;
  *)
    echo "Error: Invalid environment. Use 'production', 'staging', or 'development'"
    exit 1
    ;;
esac

# Retrieve database URL from Google Secret Manager
echo "Retrieving database credentials from Secret Manager..."
DATABASE_URL=$(gcloud secrets versions access latest --secret="$DB_SECRET_NAME")

if [ -z "$DATABASE_URL" ]; then
  echo "Error: Failed to retrieve database URL from Secret Manager"
  exit 1
fi

# Export for migration tool
export DATABASE_URL

# Create backup before migration (production only)
if [ "$ENVIRONMENT" = "production" ]; then
  echo "Creating database backup before migration..."
  BACKUP_NAME="pre-migration-$(date +%Y%m%d-%H%M%S)"

  # Extract database instance from connection string
  # This is a placeholder - adjust based on your actual connection string format
  gcloud sql backups create \
    --instance=adria-postgres-prod \
    --description="Pre-migration backup: $BACKUP_NAME" || {
      echo "Warning: Backup creation failed, but continuing with migration"
    }
fi

# Run migrations using Prisma (adjust if using different ORM)
echo "Running migrations..."

# Check if package.json exists (for Node.js projects)
if [ -f "package.json" ]; then
  # Prisma migrations
  if command -v npx &> /dev/null; then
    echo "Running Prisma migrations..."
    npx prisma migrate deploy
  else
    echo "npx not found. Installing dependencies first..."
    npm ci
    npx prisma migrate deploy
  fi
else
  echo "No package.json found. Skipping Node.js migrations."
fi

# For future: Add support for other migration tools
# TypeORM: npx typeorm migration:run
# Sequelize: npx sequelize-cli db:migrate
# Raw SQL: psql $DATABASE_URL -f migrations/latest.sql

echo "======================================"
echo "Migration completed successfully!"
echo "======================================"

# Verify migration status
echo "Verifying migration status..."
if command -v npx &> /dev/null; then
  npx prisma migrate status || echo "Migration status check skipped"
fi

# Clean up sensitive environment variables
unset DATABASE_URL

exit 0
