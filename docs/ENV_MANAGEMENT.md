# Environment Variable Management Guide

This document outlines the strategy for managing environment variables across development, staging, and production environments for the Adria Cross website.

## Table of Contents

1. [Overview](#overview)
2. [Environment Files](#environment-files)
3. [Google Secret Manager Setup](#google-secret-manager-setup)
4. [Environment-Specific Configuration](#environment-specific-configuration)
5. [CI/CD Integration](#cicd-integration)
6. [Security Best Practices](#security-best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The Adria Cross application uses environment variables to configure different aspects of the application across various environments. We use a combination of:

- **Local Development**: `.env` files (not committed to git)
- **Staging/Production**: Google Secret Manager for sensitive values
- **CI/CD**: Cloud Build substitutions and Secret Manager integration

---

## Environment Files

### File Structure

```
/
├── .env.example              # Template for all environments
├── .env                      # Local development (gitignored)
├── .env.test                 # Test environment (gitignored)
└── packages/
    └── backend/
        └── .env.example      # Backend-specific variables
```

### Creating Your Local .env File

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Fill in the required values for local development

3. **Never commit the .env file** - it's already in `.gitignore`

### Required Variables

**Minimum required for local development:**
- `NODE_ENV=development`
- `PORT=3000`
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Generate with `openssl rand -base64 64`

**Required for staging/production:**
- All of the above plus:
- `SENDGRID_API_KEY` - Email service
- `STRIPE_SECRET_KEY` - Payment processing
- `GOOGLE_CALENDAR_CLIENT_ID` - Calendar integration
- `GCP_PROJECT_ID` - Google Cloud project
- `SENDGRID_FROM_EMAIL` / `SENDGRID_ADMIN_EMAIL` / `SENDGRID_REPLY_TO` - Email sender + notifications
- `EMAIL_ENABLED` - Toggle to disable sending in non-prod
- `RECAPTCHA_SITE_KEY` and `RECAPTCHA_SECRET_KEY` - Contact form spam protection
- `RECAPTCHA_MIN_SCORE` - Threshold for v3 score (default 0.5)
- `CONTACT_RATE_LIMIT_MAX` / `CONTACT_RATE_LIMIT_WINDOW_MS` - Per-IP contact submission rate limits
- `ADMIN_DASHBOARD_URL` - Deep-link for admin notifications

---

## Google Secret Manager Setup

Google Secret Manager is used to store sensitive configuration in staging and production environments.

### Creating Secrets

#### 1. Install Google Cloud SDK

```bash
# Check if installed
gcloud --version

# If not installed, visit: https://cloud.google.com/sdk/docs/install
```

#### 2. Set Your Project

```bash
gcloud config set project YOUR_PROJECT_ID
```

#### 3. Create Secrets

```bash
# Database password for staging
gcloud secrets create STAGING_DATABASE_URL \
  --replication-policy="automatic"

# Add the secret value
echo -n "postgresql://user:password@host:5432/adria_staging" | \
  gcloud secrets versions add STAGING_DATABASE_URL --data-file=-

# JWT secret for staging
gcloud secrets create STAGING_JWT_SECRET \
  --replication-policy="automatic"

openssl rand -base64 64 | \
  gcloud secrets versions add STAGING_JWT_SECRET --data-file=-

# Repeat for production secrets (use PROD_ prefix)
gcloud secrets create PROD_DATABASE_URL --replication-policy="automatic"
gcloud secrets create PROD_JWT_SECRET --replication-policy="automatic"
gcloud secrets create PROD_SENDGRID_API_KEY --replication-policy="automatic"
gcloud secrets create PROD_STRIPE_SECRET_KEY --replication-policy="automatic"
```

#### 4. Grant Access to Cloud Run Service Account

```bash
# Get your Cloud Run service account
SERVICE_ACCOUNT=$(gcloud iam service-accounts list \
  --filter="displayName:Compute Engine default service account" \
  --format="value(email)")

# Grant access to secrets
gcloud secrets add-iam-policy-binding STAGING_DATABASE_URL \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding PROD_DATABASE_URL \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor"

# Repeat for all secrets
```

### Listing Secrets

```bash
# List all secrets
gcloud secrets list

# View a specific secret value (requires permission)
gcloud secrets versions access latest --secret="STAGING_DATABASE_URL"
```

### Updating Secrets

```bash
# Add a new version (recommended - keeps history)
echo -n "new-secret-value" | \
  gcloud secrets versions add SECRET_NAME --data-file=-

# Or update inline
printf "new-secret-value" | \
  gcloud secrets versions add SECRET_NAME --data-file=-
```

---

## Environment-Specific Configuration

### Development

**File:** `.env` (local)

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/adria_dev
JWT_SECRET=local-dev-secret-not-for-production
DEBUG=true
```

**Database:** Local PostgreSQL or Cloud SQL with proxy

**Services:** Mock services or test credentials

### Staging

**Source:** Google Secret Manager + Cloud Build substitutions

**Database:** Cloud SQL (staging instance)

**Services:** Test/sandbox API keys (SendGrid, Stripe test mode)

**Deployment:** Automatic on merge to `develop` branch

### Production

**Source:** Google Secret Manager + Cloud Build substitutions

**Database:** Cloud SQL (production instance with HA)

**Services:** Production API keys

**Deployment:** Automatic on merge to `main` branch (with gradual rollout)

---

## CI/CD Integration

### GitHub Actions

Environment variables are passed via GitHub Secrets for PR checks:

```yaml
# .github/workflows/pr-checks.yml
env:
  NODE_ENV: test
  DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
```

#### Setting GitHub Secrets

1. Go to repository Settings > Secrets and variables > Actions
2. Click "New repository secret"
3. Add required secrets:
   - `TEST_DATABASE_URL`
   - `SNYK_TOKEN` (for security scans)

### Cloud Build (Staging)

```yaml
# cloudbuild-staging.yaml
steps:
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'adria-website-staging'
      - '--set-secrets'
      - 'DATABASE_URL=STAGING_DATABASE_URL:latest'
      - '--set-env-vars'
      - 'NODE_ENV=staging,PORT=8080'
```

### Cloud Build (Production)

```yaml
# cloudbuild-production.yaml
steps:
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'adria-website-prod'
      - '--set-secrets'
      - 'DATABASE_URL=PROD_DATABASE_URL:latest,JWT_SECRET=PROD_JWT_SECRET:latest'
      - '--set-env-vars'
      - 'NODE_ENV=production,PORT=8080'
```

### Cloud Build Triggers Setup

1. **Create Staging Trigger**
   ```bash
   gcloud builds triggers create github \
     --name="staging-deployment" \
     --repo-name="Adria-Project-1" \
     --repo-owner="YOUR_GITHUB_USERNAME" \
     --branch-pattern="^develop$" \
     --build-config="cloudbuild-staging.yaml"
   ```

2. **Create Production Trigger**
   ```bash
   gcloud builds triggers create github \
     --name="production-deployment" \
     --repo-name="Adria-Project-1" \
     --repo-owner="YOUR_GITHUB_USERNAME" \
     --branch-pattern="^main$" \
     --build-config="cloudbuild-production.yaml"
   ```

---

## Security Best Practices

### 1. Never Commit Secrets

- `.env` files are in `.gitignore`
- Use `.env.example` as a template only
- Never hardcode secrets in application code

### 2. Rotate Secrets Regularly

**Rotation Schedule:**
- JWT secrets: Every 90 days
- Database passwords: Every 90 days
- API keys: When compromised or annually

**Rotation Process:**
```bash
# 1. Create new secret version
echo -n "new-password" | gcloud secrets versions add PROD_DATABASE_URL --data-file=-

# 2. Update database with new password
# 3. Deploy application with new secret
# 4. Verify application works
# 5. Disable old secret version
gcloud secrets versions disable VERSION_NUMBER --secret="PROD_DATABASE_URL"
```

### 3. Use Least Privilege

- Service accounts should only access secrets they need
- Use separate service accounts for staging and production
- Regularly audit IAM permissions

### 4. Enable Audit Logging

```bash
# Enable Secret Manager audit logging
gcloud logging read "protoPayload.serviceName=\"secretmanager.googleapis.com\"" \
  --limit=10 \
  --format=json
```

### 5. Secret Naming Convention

- **Development:** No prefix or `DEV_`
- **Staging:** `STAGING_` prefix
- **Production:** `PROD_` prefix

Examples:
- `PROD_DATABASE_URL`
- `STAGING_JWT_SECRET`
- `PROD_STRIPE_SECRET_KEY`

---

## Troubleshooting

### Issue: Secret not found during deployment

**Error:**
```
Error: Failed to retrieve secret: Secret [SECRET_NAME] not found
```

**Solutions:**
1. Verify secret exists:
   ```bash
   gcloud secrets list | grep SECRET_NAME
   ```

2. Check service account has access:
   ```bash
   gcloud secrets get-iam-policy SECRET_NAME
   ```

3. Ensure correct secret name in deployment config

### Issue: Database connection fails

**Error:**
```
Error: Connection to database failed
```

**Solutions:**
1. Verify DATABASE_URL format:
   ```
   postgresql://USER:PASSWORD@HOST:PORT/DATABASE
   ```

2. Check Cloud SQL instance is running:
   ```bash
   gcloud sql instances describe INSTANCE_NAME
   ```

3. Verify Cloud SQL connector enabled:
   ```bash
   gcloud services list | grep sqladmin
   ```

### Issue: Secret version mismatch

**Error:**
```
Error: Using outdated secret version
```

**Solutions:**
1. Force Cloud Run to use latest:
   ```bash
   gcloud run services update SERVICE_NAME \
     --update-secrets=DATABASE_URL=PROD_DATABASE_URL:latest
   ```

2. Verify latest version number:
   ```bash
   gcloud secrets versions list PROD_DATABASE_URL
   ```

### Viewing Logs for Secret Access

```bash
# View secret access logs
gcloud logging read "resource.type=secret_manager_secret \
  AND resource.labels.secret_id=PROD_DATABASE_URL" \
  --limit=20 \
  --format=json
```

---

## References

- [Google Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)
- [Cloud Run Environment Variables](https://cloud.google.com/run/docs/configuring/environment-variables)
- [Cloud Build Substitutions](https://cloud.google.com/build/docs/configuring-builds/substitute-variable-values)
- [.env.example file](../.env.example)

---

## Quick Reference Commands

```bash
# Create secret
gcloud secrets create SECRET_NAME --replication-policy="automatic"

# Add secret value
echo -n "value" | gcloud secrets versions add SECRET_NAME --data-file=-

# View secret
gcloud secrets versions access latest --secret="SECRET_NAME"

# Grant access
gcloud secrets add-iam-policy-binding SECRET_NAME \
  --member="serviceAccount:EMAIL" \
  --role="roles/secretmanager.secretAccessor"

# List all secrets
gcloud secrets list

# Delete secret
gcloud secrets delete SECRET_NAME
```
