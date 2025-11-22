# Database Setup Guide

## Overview

This guide provides comprehensive instructions for setting up PostgreSQL databases for the Adria Cross website transformation. The database infrastructure uses Google Cloud SQL with separate instances for development, staging, and production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Google Cloud SQL Provisioning](#google-cloud-sql-provisioning)
3. [Connection Pooling Setup](#connection-pooling-setup)
4. [Automated Backups Configuration](#automated-backups-configuration)
5. [Database Migration Strategy](#database-migration-strategy)
6. [Security Best Practices](#security-best-practices)
7. [Connection Management](#connection-management)
8. [Local Development Setup](#local-development-setup)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before provisioning databases, ensure you have:

- **Google Cloud Project**: Active GCP project with billing enabled
- **gcloud CLI**: Installed and authenticated (`gcloud auth login`)
- **Permissions**: Cloud SQL Admin role or equivalent permissions
- **Network Planning**: VPC network configuration if using private IP
- **Budget**: Understanding of Cloud SQL pricing (see [GCP Pricing Calculator](https://cloud.google.com/products/calculator))

### Required Tools

```bash
# Install Google Cloud SDK
# Visit: https://cloud.google.com/sdk/docs/install

# Verify installation
gcloud --version

# Install Cloud SQL Proxy (for local development)
# macOS
brew install cloud-sql-proxy

# Linux
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.linux.amd64
chmod +x cloud-sql-proxy

# Verify installation
cloud-sql-proxy --version
```

---

## Google Cloud SQL Provisioning

### Environment Configuration

We'll create three PostgreSQL instances:

| Environment | Instance Name | Purpose | Tier | Storage |
|-------------|--------------|---------|------|---------|
| Development | adria-db-dev | Local dev testing | db-f1-micro | 10 GB |
| Staging | adria-db-staging | Pre-production testing | db-g1-small | 20 GB |
| Production | adria-db-prod | Live application | db-custom-2-8192 | 50 GB (auto-increase) |

### Step 1: Production Instance

Production database with high availability and automated backups:

```bash
# Set project variables
export GCP_PROJECT_ID="your-project-id"
export GCP_REGION="us-central1"  # Choose region closest to your users
export DB_VERSION="POSTGRES_15"   # PostgreSQL 15 (latest stable)

# Create production instance
gcloud sql instances create adria-db-prod \
  --project=$GCP_PROJECT_ID \
  --database-version=$DB_VERSION \
  --tier=db-custom-2-8192 \
  --region=$GCP_REGION \
  --network=default \
  --enable-bin-log \
  --backup-start-time=03:00 \
  --backup-location=us \
  --retained-backups-count=30 \
  --retained-transaction-log-days=7 \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=4 \
  --maintenance-release-channel=production \
  --availability-type=REGIONAL \
  --storage-type=SSD \
  --storage-size=50GB \
  --storage-auto-increase \
  --storage-auto-increase-limit=500 \
  --database-flags=max_connections=200,shared_buffers=2GB \
  --insights-config-query-insights-enabled \
  --insights-config-query-string-length=1024 \
  --insights-config-record-application-tags \
  --deletion-protection

# Enable Cloud SQL Admin API if not already enabled
gcloud services enable sqladmin.googleapis.com --project=$GCP_PROJECT_ID
```

**Configuration Explanation:**
- `--tier=db-custom-2-8192`: 2 vCPUs, 8 GB RAM (adjust based on load testing)
- `--availability-type=REGIONAL`: High availability with automatic failover
- `--backup-start-time=03:00`: Daily backups at 3 AM (adjust to low-traffic period)
- `--retained-backups-count=30`: Keep 30 daily backups (30-day retention)
- `--storage-auto-increase`: Automatically increase storage when 90% full
- `--deletion-protection`: Prevents accidental deletion
- `--insights-config-*`: Enable Query Insights for performance monitoring

### Step 2: Staging Instance

Staging environment for pre-production testing:

```bash
gcloud sql instances create adria-db-staging \
  --project=$GCP_PROJECT_ID \
  --database-version=$DB_VERSION \
  --tier=db-g1-small \
  --region=$GCP_REGION \
  --network=default \
  --backup-start-time=04:00 \
  --retained-backups-count=7 \
  --retained-transaction-log-days=3 \
  --maintenance-window-day=SAT \
  --maintenance-window-hour=4 \
  --availability-type=ZONAL \
  --storage-type=SSD \
  --storage-size=20GB \
  --storage-auto-increase \
  --database-flags=max_connections=100 \
  --insights-config-query-insights-enabled

# Staging has no deletion protection for easier teardown/rebuild
```

### Step 3: Development Instance

Lightweight development instance:

```bash
gcloud sql instances create adria-db-dev \
  --project=$GCP_PROJECT_ID \
  --database-version=$DB_VERSION \
  --tier=db-f1-micro \
  --region=$GCP_REGION \
  --network=default \
  --no-backup \
  --availability-type=ZONAL \
  --storage-type=SSD \
  --storage-size=10GB \
  --database-flags=max_connections=50

# Development instance: no backups, minimal resources, can be deleted/recreated
```

### Step 4: Create Databases and Users

```bash
# For each environment, create the database and users

# Production
gcloud sql databases create adria_prod \
  --instance=adria-db-prod \
  --project=$GCP_PROJECT_ID

gcloud sql users create adria_app_user \
  --instance=adria-db-prod \
  --password=$(openssl rand -base64 32) \
  --project=$GCP_PROJECT_ID

# Staging
gcloud sql databases create adria_staging \
  --instance=adria-db-staging \
  --project=$GCP_PROJECT_ID

gcloud sql users create adria_app_user \
  --instance=adria-db-staging \
  --password=$(openssl rand -base64 32) \
  --project=$GCP_PROJECT_ID

# Development
gcloud sql databases create adria_dev \
  --instance=adria-db-dev \
  --project=$GCP_PROJECT_ID

gcloud sql users create adria_app_user \
  --instance=adria-db-dev \
  --password="dev_password_123" \
  --project=$GCP_PROJECT_ID
```

**Security Note**: Store production and staging passwords in Google Secret Manager (see [Security Best Practices](#security-best-practices)).

### Step 5: Retrieve Connection Information

```bash
# Get instance connection names (needed for Cloud SQL Proxy)
gcloud sql instances describe adria-db-prod \
  --project=$GCP_PROJECT_ID \
  --format="value(connectionName)"

# Output: your-project-id:us-central1:adria-db-prod

# Store this in .env as DATABASE_INSTANCE_CONNECTION_NAME
```

---

## Connection Pooling Setup

Connection pooling is critical for managing database connections efficiently and preventing connection exhaustion.

### Why Connection Pooling?

- **Resource Efficiency**: Reuse connections instead of creating new ones
- **Performance**: Reduce connection overhead (handshake, authentication)
- **Scalability**: Handle more concurrent requests with fewer database connections
- **Reliability**: Automatic connection recovery and health checks

### PgBouncer vs Cloud SQL Proxy

| Feature | PgBouncer | Cloud SQL Proxy |
|---------|-----------|-----------------|
| Connection Pooling | ✅ Yes | ❌ No (1:1 passthrough) |
| SSL/TLS | Manual setup | ✅ Automatic |
| IAM Authentication | ❌ No | ✅ Yes |
| Use Case | Application-side pooling | Secure connectivity |
| **Recommendation** | **Use both together** | **Use both together** |

### Recommended Architecture

```
Application → Application-side Pool (Prisma/TypeORM) → Cloud SQL Proxy → Cloud SQL Instance
```

**Why this approach:**
1. **Prisma/TypeORM** provides application-level connection pooling
2. **Cloud SQL Proxy** provides secure, authenticated connections
3. **Cloud SQL** handles high availability and backups

### Cloud SQL Proxy Setup

Cloud SQL Proxy is the recommended connection method for Google Cloud SQL.

#### Installation (Already covered in Prerequisites)

```bash
# macOS
brew install cloud-sql-proxy

# Linux
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.linux.amd64
chmod +x cloud-sql-proxy
sudo mv cloud-sql-proxy /usr/local/bin/
```

#### Running Cloud SQL Proxy (Local Development)

```bash
# Start proxy for all three environments
cloud-sql-proxy \
  --port 5432 your-project-id:us-central1:adria-db-prod \
  --port 5433 your-project-id:us-central1:adria-db-staging \
  --port 5434 your-project-id:us-central1:adria-db-dev

# Now connect to:
# Production: localhost:5432
# Staging: localhost:5433
# Development: localhost:5434
```

#### Cloud SQL Proxy in Docker (Recommended for Local Dev)

Add to `docker-compose.yml`:

```yaml
services:
  cloud-sql-proxy:
    image: gcr.io/cloud-sql-connectors/cloud-sql-proxy:latest
    command:
      - "--port=5432"
      - "your-project-id:us-central1:adria-db-dev"
    ports:
      - "5432:5432"
    volumes:
      - ~/.config/gcloud:/config
    environment:
      GOOGLE_APPLICATION_CREDENTIALS: /config/application_default_credentials.json
    restart: unless-stopped
```

### Application-Level Connection Pooling

Both Prisma and TypeORM provide built-in connection pooling. Configuration in next section.

---

## Automated Backups Configuration

Automated backups are already configured during instance creation. This section covers verification and management.

### Backup Configuration Summary

| Environment | Backup Time | Retention | Transaction Logs |
|-------------|-------------|-----------|------------------|
| Production | 3:00 AM daily | 30 days | 7 days |
| Staging | 4:00 AM daily | 7 days | 3 days |
| Development | None | N/A | N/A |

### Verify Backup Configuration

```bash
# Check backup configuration
gcloud sql instances describe adria-db-prod \
  --project=$GCP_PROJECT_ID \
  --format="table(settings.backupConfiguration)"

# List backups
gcloud sql backups list \
  --instance=adria-db-prod \
  --project=$GCP_PROJECT_ID

# Describe specific backup
gcloud sql backups describe <backup-id> \
  --instance=adria-db-prod \
  --project=$GCP_PROJECT_ID
```

### Manual Backup (Before Major Changes)

```bash
# Create on-demand backup
gcloud sql backups create \
  --instance=adria-db-prod \
  --description="Pre-migration backup for v2.0" \
  --project=$GCP_PROJECT_ID
```

### Restore from Backup

```bash
# List available backups
gcloud sql backups list --instance=adria-db-prod --project=$GCP_PROJECT_ID

# Restore to existing instance (DESTRUCTIVE - creates downtime)
gcloud sql backups restore <backup-id> \
  --backup-instance=adria-db-prod \
  --restore-instance=adria-db-prod \
  --project=$GCP_PROJECT_ID

# Restore to NEW instance (RECOMMENDED - zero downtime)
gcloud sql backups restore <backup-id> \
  --backup-instance=adria-db-prod \
  --restore-instance=adria-db-prod-restored \
  --project=$GCP_PROJECT_ID

# Then manually verify and switch application to new instance
```

### Point-in-Time Recovery (PITR)

Production instance has binary logging enabled for PITR:

```bash
# Restore to specific point in time
gcloud sql instances clone adria-db-prod adria-db-prod-pitr \
  --point-in-time '2025-11-22T10:30:00.000Z' \
  --project=$GCP_PROJECT_ID

# Verify data on cloned instance before switching
```

### Backup Best Practices

1. **Test Restores**: Quarterly restore testing to staging environment
2. **Monitor Backup Success**: Set up Cloud Monitoring alerts for failed backups
3. **Export Critical Data**: Monthly exports to Cloud Storage for disaster recovery
4. **Document Recovery Procedures**: RTO (Recovery Time Objective) and RPO (Recovery Point Objective)

```bash
# Export database to Cloud Storage (monthly archival)
gcloud sql export sql adria-db-prod gs://adria-db-backups/monthly/adria_prod_$(date +%Y%m%d).sql \
  --database=adria_prod \
  --project=$GCP_PROJECT_ID
```

---

## Database Migration Strategy

After researching both Prisma and TypeORM for this use case, **Prisma is the recommended migration tool**.

### Migration Tool Comparison

| Criteria | Prisma | TypeORM | Winner |
|----------|--------|---------|--------|
| **Developer Experience** | Excellent (type-safe, intuitive) | Good (Java-like decorators) | Prisma |
| **TypeScript Support** | First-class, generated types | Good, manual types | Prisma |
| **Migration System** | Declarative schema + SQL migrations | Code-first or schema-first | Prisma |
| **Cloud SQL Compatibility** | Excellent (official support) | Good | Prisma |
| **Performance** | Optimized queries, connection pooling | Good, requires tuning | Prisma |
| **Documentation** | Excellent, comprehensive | Good but scattered | Prisma |
| **Community & Ecosystem** | Large, active, growing | Large, mature | Tie |
| **Google Cloud Integration** | Native Cloud SQL Proxy support | Requires manual config | Prisma |
| **Schema Introspection** | Built-in, excellent | Available | Prisma |
| **Monorepo Support** | Excellent | Good | Prisma |
| **Learning Curve** | Gentle | Moderate (decorator patterns) | Prisma |
| **Migration Safety** | Excellent (dry-run, preview) | Good | Prisma |

### Why Prisma?

1. **Type Safety**: Prisma generates a fully type-safe client based on your schema
2. **Google Cloud Native**: Official Cloud SQL support with automatic SSL/TLS
3. **Developer Experience**: Intuitive schema language, excellent error messages
4. **Migration Workflow**: Preview migrations before applying, automatic SQL generation
5. **Monorepo Friendly**: Works seamlessly in NX/Turborepo monorepos
6. **Active Development**: Regular updates, backed by venture funding
7. **Performance**: Automatic query optimization and connection pooling

### Prisma Setup

#### 1. Install Prisma

```bash
# In your backend package
cd packages/backend

# Install Prisma CLI (dev dependency)
npm install -D prisma

# Install Prisma Client (runtime dependency)
npm install @prisma/client

# Initialize Prisma
npx prisma init
```

This creates:
- `prisma/schema.prisma` - Your database schema
- `.env` - Environment variables (add to .gitignore)

#### 2. Configure Prisma Schema

Edit `packages/backend/prisma/schema.prisma`:

```prisma
// Prisma Schema for Adria Cross Website

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["metrics", "tracing"]
  binaryTargets   = ["native", "debian-openssl-3.0.x"] // For Docker compatibility
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// User model for authentication
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String    @map("password_hash")
  name          String?
  role          UserRole  @default(CLIENT)
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  // Relations
  profile       Profile?
  bookings      Booking[]
  intakeForms   IntakeForm[]

  @@map("users")
  @@index([email])
}

enum UserRole {
  ADMIN
  STYLIST
  CLIENT
}

// Profile model for user details
model Profile {
  id          String   @id @default(uuid())
  userId      String   @unique @map("user_id")
  phone       String?
  avatar      String?
  preferences Json?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("profiles")
}

// Booking model for appointments
model Booking {
  id            String        @id @default(uuid())
  userId        String        @map("user_id")
  serviceType   String        @map("service_type")
  scheduledAt   DateTime      @map("scheduled_at")
  status        BookingStatus @default(PENDING)
  notes         String?
  createdAt     DateTime      @default(now()) @map("created_at")
  updatedAt     DateTime      @updatedAt @map("updated_at")

  // Relations
  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("bookings")
  @@index([userId])
  @@index([scheduledAt])
  @@index([status])
}

enum BookingStatus {
  PENDING
  CONFIRMED
  COMPLETED
  CANCELLED
}

// IntakeForm model for client questionnaires
model IntakeForm {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  responses   Json
  submittedAt DateTime @default(now()) @map("submitted_at")

  // Relations
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("intake_forms")
  @@index([userId])
}

// Add more models as needed (BlogPost, Gallery, etc.)
```

#### 3. Configure Database Connection

Prisma uses environment variables for database connection. See [Connection Management](#connection-management) section.

#### 4. Create Initial Migration

```bash
# Generate migration from schema
npx prisma migrate dev --name init

# This will:
# 1. Create SQL migration file in prisma/migrations/
# 2. Apply migration to database
# 3. Generate Prisma Client
```

#### 5. Generate Prisma Client

```bash
# Generate TypeScript client (run after schema changes)
npx prisma generate

# Now you can import and use:
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
```

### Migration Workflow

#### Development Environment

```bash
# 1. Update schema.prisma with changes
# 2. Create and apply migration
npx prisma migrate dev --name add_blog_posts

# 3. Prisma will:
#    - Generate SQL migration
#    - Apply to dev database
#    - Regenerate Prisma Client
```

#### Staging/Production Environment

```bash
# 1. Deploy migration (no dev features)
npx prisma migrate deploy

# 2. This applies pending migrations without prompts
# Safe for CI/CD pipelines
```

#### Migration Commands Reference

```bash
# Create migration without applying (preview SQL)
npx prisma migrate dev --create-only

# Apply pending migrations (production)
npx prisma migrate deploy

# Reset database (DESTRUCTIVE - dev only)
npx prisma migrate reset

# Check migration status
npx prisma migrate status

# Resolve migration conflicts
npx prisma migrate resolve --applied "20250101000000_migration_name"
```

### Prisma Studio (Database GUI)

```bash
# Launch Prisma Studio (visual database editor)
npx prisma studio

# Opens browser at http://localhost:5555
# View/edit data in all tables
```

---

## Security Best Practices

### 1. Authentication & Authorization

#### Use IAM Authentication (Recommended for Production)

```bash
# Create service account for application
gcloud iam service-accounts create adria-backend \
  --display-name="Adria Backend Service Account" \
  --project=$GCP_PROJECT_ID

# Grant Cloud SQL Client role
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:adria-backend@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

# Create IAM database user
gcloud sql users create adria-backend@$GCP_PROJECT_ID.iam.gserviceaccount.com \
  --instance=adria-db-prod \
  --type=CLOUD_IAM_SERVICE_ACCOUNT \
  --project=$GCP_PROJECT_ID
```

**Benefits of IAM Authentication:**
- No password management
- Automatic credential rotation
- Centralized access control
- Audit logging via Cloud Logging

#### Secure Password Management

For environments using password authentication:

```bash
# Generate secure passwords
openssl rand -base64 32

# Store in Google Secret Manager
gcloud secrets create adria-db-prod-password \
  --data-file=- \
  --replication-policy="automatic" \
  --project=$GCP_PROJECT_ID
# Paste password when prompted

# Grant application access to secret
gcloud secrets add-iam-policy-binding adria-db-prod-password \
  --member="serviceAccount:adria-backend@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=$GCP_PROJECT_ID
```

### 2. Network Security

#### Private IP (Recommended for Production)

```bash
# Enable Service Networking API
gcloud services enable servicenetworking.googleapis.com --project=$GCP_PROJECT_ID

# Allocate IP range for private connection
gcloud compute addresses create google-managed-services-default \
  --global \
  --purpose=VPC_PEERING \
  --prefix-length=16 \
  --network=default \
  --project=$GCP_PROJECT_ID

# Create private connection
gcloud services vpc-peerings connect \
  --service=servicenetworking.googleapis.com \
  --ranges=google-managed-services-default \
  --network=default \
  --project=$GCP_PROJECT_ID

# Update instance to use private IP
gcloud sql instances patch adria-db-prod \
  --network=default \
  --no-assign-ip \
  --project=$GCP_PROJECT_ID
```

#### Authorized Networks (Public IP Alternative)

If using public IP, restrict access:

```bash
# Add authorized network (your Cloud Run region)
gcloud sql instances patch adria-db-prod \
  --authorized-networks=0.0.0.0/0 \
  --project=$GCP_PROJECT_ID

# Note: In production, use specific IP ranges or VPC connector
```

### 3. Encryption

Cloud SQL automatically provides:
- **Encryption at Rest**: All data encrypted with AES-256
- **Encryption in Transit**: TLS 1.2+ for all connections
- **Customer-Managed Encryption Keys (CMEK)**: Optional, for compliance requirements

To enable CMEK:

```bash
# Create KMS key ring and key
gcloud kms keyrings create adria-db-keyring \
  --location=us-central1 \
  --project=$GCP_PROJECT_ID

gcloud kms keys create adria-db-key \
  --keyring=adria-db-keyring \
  --location=us-central1 \
  --purpose=encryption \
  --project=$GCP_PROJECT_ID

# Grant Cloud SQL service account access to key
# (Follow GCP documentation for service account email)
```

### 4. SSL/TLS Certificates

```bash
# Download server CA certificate
gcloud sql ssl-certs create client-cert client-key \
  --instance=adria-db-prod \
  --project=$GCP_PROJECT_ID

# Download certificates
gcloud sql ssl-certs describe client-cert \
  --instance=adria-db-prod \
  --format="get(cert)" \
  --project=$GCP_PROJECT_ID > client-cert.pem

# Use in connection string
DATABASE_URL="postgresql://user:password@host/db?sslmode=require&sslcert=client-cert.pem"
```

### 5. Least Privilege Access

Create separate database users with minimal permissions:

```sql
-- Read-only user for analytics
CREATE USER adria_readonly WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE adria_prod TO adria_readonly;
GRANT USAGE ON SCHEMA public TO adria_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO adria_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO adria_readonly;

-- Application user (no DDL permissions)
CREATE USER adria_app_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE adria_prod TO adria_app_user;
GRANT USAGE ON SCHEMA public TO adria_app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO adria_app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO adria_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO adria_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO adria_app_user;

-- Migration user (DDL permissions - use only for migrations)
CREATE USER adria_migration_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE adria_prod TO adria_migration_user;
```

### 6. Audit Logging

Enable Cloud SQL audit logs:

```bash
# Enable audit logging
gcloud sql instances patch adria-db-prod \
  --database-flags=cloudsql.enable_pgaudit=on,pgaudit.log=all \
  --project=$GCP_PROJECT_ID

# View logs in Cloud Logging
gcloud logging read "resource.type=cloudsql_database" \
  --project=$GCP_PROJECT_ID \
  --limit=50
```

### 7. Regular Security Practices

- **Rotate Passwords**: Quarterly password rotation for non-IAM users
- **Review Access**: Monthly review of IAM permissions and database users
- **Monitor Connections**: Set up alerts for unusual connection patterns
- **Update Dependencies**: Keep Prisma and database drivers up to date
- **Vulnerability Scanning**: Use `npm audit` and Dependabot
- **Penetration Testing**: Annual security audits

---

## Connection Management

### Environment Variables Structure

Database connections are managed via environment variables. Each environment (dev, staging, prod) uses a different database.

#### Connection String Format

```bash
# Standard format
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"

# With Cloud SQL Proxy (recommended for local dev)
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE"

# With Cloud SQL Connector (Cloud Run)
DATABASE_URL="postgresql://USER:PASSWORD@/DATABASE?host=/cloudsql/PROJECT:REGION:INSTANCE"

# With IAM authentication
DATABASE_URL="postgresql://USER@/DATABASE?host=/cloudsql/PROJECT:REGION:INSTANCE&sslmode=require"
```

### Google Secret Manager Integration

Store sensitive credentials in Secret Manager:

```bash
# Create secrets for each environment
echo -n "postgresql://user:pass@host/db" | gcloud secrets create adria-db-prod-url \
  --data-file=- \
  --replication-policy="automatic" \
  --project=$GCP_PROJECT_ID

echo -n "postgresql://user:pass@host/db" | gcloud secrets create adria-db-staging-url \
  --data-file=- \
  --replication-policy="automatic" \
  --project=$GCP_PROJECT_ID

# Grant Cloud Run service account access
gcloud secrets add-iam-policy-binding adria-db-prod-url \
  --member="serviceAccount:adria-backend@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=$GCP_PROJECT_ID
```

### Cloud Run Configuration

Mount secrets as environment variables in Cloud Run:

```bash
gcloud run services update adria-backend \
  --update-secrets=DATABASE_URL=adria-db-prod-url:latest \
  --project=$GCP_PROJECT_ID \
  --region=$GCP_REGION
```

Or in Cloud Run YAML:

```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: adria-backend
spec:
  template:
    metadata:
      annotations:
        run.googleapis.com/cloudsql-instances: your-project:us-central1:adria-db-prod
    spec:
      containers:
      - image: gcr.io/your-project/adria-backend
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: adria-db-prod-url
              key: latest
```

### Prisma Connection Configuration

Configure Prisma Client for connection pooling:

```typescript
// packages/backend/src/db/prisma.ts
import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

export default prisma;
```

Configure connection pool in `schema.prisma` or via URL params:

```bash
# Option 1: In DATABASE_URL
DATABASE_URL="postgresql://user:password@host/db?connection_limit=10&pool_timeout=20"

# Option 2: In schema.prisma (not recommended, use env vars)
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  relationMode = "prisma"
}
```

### Connection Pool Sizing

Recommended pool sizes per Cloud Run instance:

| Environment | Cloud Run Instances | Connections per Instance | Total Connections | Cloud SQL Max |
|-------------|---------------------|-------------------------|-------------------|---------------|
| Development | 1 | 5 | 5 | 50 |
| Staging | 1-5 | 10 | 50 | 100 |
| Production | 5-50 | 10 | 500 | 200 (scaled) |

**Formula**: `Total Connections = Cloud Run Instances * Connections per Instance`

Ensure Cloud SQL `max_connections` > Total Connections.

---

## Local Development Setup

### Option 1: Cloud SQL Proxy (Recommended)

Safest method - connects to actual Cloud SQL instances:

```bash
# 1. Authenticate with Google Cloud
gcloud auth application-default login

# 2. Start Cloud SQL Proxy
cloud-sql-proxy your-project-id:us-central1:adria-db-dev --port 5432

# 3. Set environment variable in .env
DATABASE_URL="postgresql://adria_app_user:dev_password_123@localhost:5432/adria_dev"

# 4. Run Prisma migrations
npx prisma migrate dev

# 5. Start your application
npm run dev
```

### Option 2: Docker Compose with Cloud SQL Proxy

Add to `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # Cloud SQL Proxy for database connection
  cloud-sql-proxy:
    image: gcr.io/cloud-sql-connectors/cloud-sql-proxy:latest
    command:
      - "--port=5432"
      - "your-project-id:us-central1:adria-db-dev"
    ports:
      - "5432:5432"
    volumes:
      - ~/.config/gcloud:/config
    environment:
      GOOGLE_APPLICATION_CREDENTIALS: /config/application_default_credentials.json
    restart: unless-stopped
    networks:
      - adria-network

  # Backend application
  backend:
    build:
      context: ./packages/backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: "postgresql://adria_app_user:dev_password_123@cloud-sql-proxy:5432/adria_dev"
      NODE_ENV: development
    depends_on:
      - cloud-sql-proxy
    networks:
      - adria-network
    volumes:
      - ./packages/backend:/app
      - /app/node_modules

networks:
  adria-network:
    driver: bridge
```

Start services:

```bash
docker-compose up -d
docker-compose logs -f backend
```

### Option 3: Local PostgreSQL (Alternative)

For completely offline development:

```bash
# 1. Install PostgreSQL locally
brew install postgresql@15  # macOS
# Or use Docker: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:15

# 2. Create local database
createdb adria_local

# 3. Update .env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/adria_local"

# 4. Run migrations
npx prisma migrate dev
```

**Note**: Local PostgreSQL may have version/feature differences from Cloud SQL.

---

## Troubleshooting

### Common Issues

#### 1. "Connection refused" Error

**Symptoms**: Application can't connect to database

**Solutions**:
```bash
# Check Cloud SQL Proxy is running
ps aux | grep cloud-sql-proxy

# Verify instance connection name
gcloud sql instances describe adria-db-dev --format="value(connectionName)"

# Check authentication
gcloud auth application-default login

# Test connection with psql
psql "postgresql://adria_app_user:password@localhost:5432/adria_dev"
```

#### 2. "Too many connections" Error

**Symptoms**: `FATAL: sorry, too many clients already`

**Solutions**:
```bash
# Check current connections
gcloud sql instances describe adria-db-prod --format="value(settings.databaseFlags)"

# Increase max_connections
gcloud sql instances patch adria-db-prod \
  --database-flags=max_connections=300 \
  --project=$GCP_PROJECT_ID

# Reduce application pool size in DATABASE_URL
DATABASE_URL="postgresql://user:pass@host/db?connection_limit=5"
```

#### 3. Prisma Migration Conflicts

**Symptoms**: "Prisma Migrate found ... changes"

**Solutions**:
```bash
# View migration status
npx prisma migrate status

# Option 1: Reset database (dev only - DESTRUCTIVE)
npx prisma migrate reset

# Option 2: Mark migration as applied
npx prisma migrate resolve --applied "20250101000000_migration_name"

# Option 3: Create new migration from current schema
npx prisma migrate dev --create-only
# Review generated SQL, then apply:
npx prisma migrate dev
```

#### 4. SSL/TLS Errors

**Symptoms**: "SSL connection error" or "certificate verify failed"

**Solutions**:
```bash
# Disable SSL for local dev (not recommended for prod)
DATABASE_URL="postgresql://user:pass@localhost:5432/db?sslmode=disable"

# Or require SSL
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# Download and use server CA cert
gcloud sql ssl-certs describe server-ca --instance=adria-db-prod
```

#### 5. Slow Queries

**Symptoms**: Database operations taking too long

**Solutions**:
```bash
# Enable Query Insights in Cloud Console
# Or check slow queries:
gcloud sql operations list --instance=adria-db-prod --limit=10

# Connect to database and analyze:
psql "postgresql://..."
# Run: EXPLAIN ANALYZE SELECT ...;

# Add indexes in schema.prisma:
@@index([email])
@@index([createdAt])
```

### Monitoring & Alerts

Set up Cloud Monitoring alerts:

```bash
# CPU utilization alert
gcloud alpha monitoring policies create \
  --notification-channels=YOUR_CHANNEL_ID \
  --display-name="High CPU - adria-db-prod" \
  --condition-display-name="CPU > 80%" \
  --condition-threshold-value=0.8 \
  --condition-threshold-duration=300s

# Disk utilization alert
# Storage auto-increase alert
# Connection count alert
# Failed connection alert
```

### Support Resources

- **Google Cloud SQL Documentation**: https://cloud.google.com/sql/docs
- **Prisma Documentation**: https://www.prisma.io/docs
- **Cloud SQL Proxy**: https://cloud.google.com/sql/docs/postgres/sql-proxy
- **Prisma Community**: https://www.prisma.io/community
- **Stack Overflow**: Tag `google-cloud-sql`, `prisma`

---

## Next Steps

After completing database setup:

1. **Test Connections**: Verify all environments connect successfully
2. **Run Initial Migrations**: Apply base schema from Prisma
3. **Set Up CI/CD**: Integrate `prisma migrate deploy` into deployment pipeline
4. **Configure Monitoring**: Set up Cloud Monitoring dashboards and alerts
5. **Document Runbooks**: Create operational procedures for common tasks
6. **Security Review**: Audit IAM permissions and network configurations
7. **Load Testing**: Test connection pooling and performance under load

---

## Appendix

### Quick Reference Commands

```bash
# Instance Management
gcloud sql instances list --project=$GCP_PROJECT_ID
gcloud sql instances describe INSTANCE_NAME --project=$GCP_PROJECT_ID
gcloud sql instances patch INSTANCE_NAME --database-flags=key=value

# Database Management
gcloud sql databases list --instance=INSTANCE_NAME
gcloud sql databases create DB_NAME --instance=INSTANCE_NAME

# User Management
gcloud sql users list --instance=INSTANCE_NAME
gcloud sql users create USERNAME --instance=INSTANCE_NAME --password=PASSWORD
gcloud sql users set-password USERNAME --instance=INSTANCE_NAME --password=NEW_PASSWORD

# Backup Management
gcloud sql backups list --instance=INSTANCE_NAME
gcloud sql backups create --instance=INSTANCE_NAME
gcloud sql backups restore BACKUP_ID --backup-instance=INSTANCE_NAME

# Prisma Commands
npx prisma init                    # Initialize Prisma
npx prisma generate                # Generate Prisma Client
npx prisma migrate dev             # Create and apply migration (dev)
npx prisma migrate deploy          # Apply migrations (prod)
npx prisma migrate status          # Check migration status
npx prisma studio                  # Open database GUI
npx prisma db pull                 # Introspect existing database
npx prisma db push                 # Push schema without migration (dev)
```

### Cost Estimation

Estimated monthly costs (subject to GCP pricing changes):

| Resource | Configuration | Monthly Cost (USD) |
|----------|---------------|-------------------|
| Production Instance | db-custom-2-8192, 50GB SSD, HA | $250-350 |
| Staging Instance | db-g1-small, 20GB SSD | $50-75 |
| Development Instance | db-f1-micro, 10GB SSD | $15-25 |
| Storage (100GB total) | SSD | $17 |
| Backups (30 days retention) | ~150GB | $15 |
| Network Egress | ~100GB | $12 |
| **Total** | | **~$360-495/month** |

Use [GCP Pricing Calculator](https://cloud.google.com/products/calculator) for accurate estimates.

### Additional Resources

- **Prisma Best Practices**: https://www.prisma.io/docs/guides/performance-and-optimization
- **Cloud SQL Best Practices**: https://cloud.google.com/sql/docs/postgres/best-practices
- **PostgreSQL Performance Tuning**: https://wiki.postgresql.org/wiki/Performance_Optimization
- **Monorepo Database Strategies**: https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-google-cloud-run

---

**Document Version**: 1.0
**Last Updated**: November 22, 2025
**Maintained By**: Adria Cross Development Team
**Next Review**: Sprint 2 Completion
