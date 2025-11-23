# Rollback Procedures

This document provides step-by-step instructions for rolling back deployments and database changes in the Adria Cross website.

## Table of Contents

1. [Overview](#overview)
2. [Rollback Types](#rollback-types)
3. [Application Rollback](#application-rollback)
4. [Database Rollback](#database-rollback)
5. [Complete System Rollback](#complete-system-rollback)
6. [Emergency Procedures](#emergency-procedures)
7. [Post-Rollback Checklist](#post-rollback-checklist)

---

## Overview

Rollbacks are critical procedures to revert the system to a previous stable state when:

- New deployment causes critical bugs
- Performance degradation detected
- Database migration fails
- Security vulnerability introduced
- Data integrity issues arise

**Rollback Philosophy:**
- Fast recovery over root cause analysis
- Communication before action
- Document everything
- Learn from incidents

---

## Rollback Types

### 1. Application-Only Rollback
- Reverts code changes only
- Database schema unchanged
- Fastest recovery (2-5 minutes)
- **Use when:** Code bug without schema changes

### 2. Database-Only Rollback
- Reverts database schema or data
- Application code unchanged
- Medium recovery time (10-20 minutes)
- **Use when:** Migration causes issues

### 3. Complete System Rollback
- Reverts both application and database
- Longest recovery time (15-30 minutes)
- **Use when:** Both application and database changes problematic

---

## Application Rollback

### Quick Rollback (Automated Script)

#### Staging Environment

```bash
# Using the rollback script
./scripts/rollback.sh staging

# This will:
# 1. Show available revisions
# 2. Prompt for confirmation
# 3. Route 100% traffic to selected revision
# 4. Monitor health
```

#### Production Environment

```bash
# Production rollback (requires manual confirmation)
./scripts/rollback.sh production

# For urgent rollback to specific revision:
./scripts/rollback.sh production adria-website-prod-00042-xyz
```

### Manual Rollback via gcloud

#### Step 1: List Available Revisions

```bash
# List recent revisions
gcloud run revisions list \
  --service=adria-website-prod \
  --region=us-central1 \
  --format='table(name,created,traffic,status)' \
  --limit=10
```

Output example:
```
NAME                              CREATED              TRAFFIC  STATUS
adria-website-prod-00045-abc      2024-01-15 14:30:00  100      READY
adria-website-prod-00044-def      2024-01-15 10:00:00  0        READY
adria-website-prod-00043-ghi      2024-01-14 16:00:00  0        READY
```

#### Step 2: Identify Target Revision

Choose the last known good revision (usually the previous one).

#### Step 3: Route Traffic to Target Revision

```bash
# Route 100% traffic to specific revision
gcloud run services update-traffic adria-website-prod \
  --region=us-central1 \
  --to-revisions=adria-website-prod-00044-def=100
```

#### Step 4: Verify Rollback

```bash
# Check current traffic distribution
gcloud run services describe adria-website-prod \
  --region=us-central1 \
  --format='value(status.traffic)'

# Test the service
curl https://adriacross.com/health
```

#### Step 5: Monitor for 15 Minutes

```bash
# Monitor logs for errors
gcloud logging read "resource.type=cloud_run_revision \
  AND resource.labels.service_name=adria-website-prod \
  AND severity>=ERROR" \
  --limit=50 \
  --format=json

# Or use the monitoring script
./scripts/monitor-health.sh adria-website-prod us-central1 900
```

### Rollback via Cloud Console

1. Navigate to [Cloud Run Console](https://console.cloud.google.com/run)
2. Select `adria-website-prod` service
3. Click on "REVISIONS" tab
4. Find the last known good revision
5. Click "MANAGE TRAFFIC"
6. Set traffic to 100% for target revision
7. Click "SAVE"
8. Monitor the service for 15 minutes

---

## Database Rollback

### Option 1: Restore from Automated Backup

**Best for:** Recent backups (< 24 hours old)

#### Step 1: List Available Backups

```bash
gcloud sql backups list \
  --instance=adria-db-prod \
  --limit=10
```

Output:
```
ID                    WINDOW_START_TIME    TYPE       STATUS
1234567890123         2024-01-15T03:00:00  AUTOMATED  SUCCESSFUL
1234567890122         2024-01-14T03:00:00  AUTOMATED  SUCCESSFUL
1234567890121         2024-01-13T03:00:00  AUTOMATED  SUCCESSFUL
```

#### Step 2: Identify Target Backup

Choose a backup from before the problematic migration.

#### Step 3: Create Restore Point (Safety)

```bash
# Create manual backup before restore
gcloud sql backups create \
  --instance=adria-db-prod \
  --description="Pre-rollback backup $(date +%Y-%m-%d-%H-%M)"
```

#### Step 4: Restore from Backup

**Option A: Clone to New Instance (Recommended for Production)**

```bash
# Create new instance from backup
gcloud sql backups restore 1234567890122 \
  --backup-instance=adria-db-prod \
  --target-instance=adria-db-prod-rollback
```

**Option B: In-Place Restore (Staging Only)**

```bash
# WARNING: This will overwrite current database
gcloud sql backups restore 1234567890122 \
  --backup-instance=adria-db-prod
```

#### Step 5: Update Application Connection

If using clone method, update DATABASE_URL to point to new instance:

```bash
# Update Cloud Run secret
gcloud secrets versions add PROD_DATABASE_URL \
  --data-file=- <<EOF
postgresql://user:password@new-instance-ip:5432/adria_prod
EOF

# Redeploy application
gcloud run services update adria-website-prod \
  --region=us-central1 \
  --update-secrets=DATABASE_URL=PROD_DATABASE_URL:latest
```

### Option 2: Reverse Migration

**Best for:** Simple schema changes without data loss

#### Step 1: Create Reverse Migration

```bash
# Connect to database
cloud_sql_proxy -instances=PROJECT_ID:REGION:adria-db-prod=tcp:5432 &

# Set DATABASE_URL
export DATABASE_URL="postgresql://user:password@localhost:5432/adria_prod"
```

#### Step 2: Write Reverse Migration

Create file: `prisma/migrations/<timestamp>_revert_problematic_change/migration.sql`

```sql
-- Example: Reverting added column
BEGIN;

-- Drop the problematic column
ALTER TABLE "User" DROP COLUMN "middle_name";

COMMIT;
```

#### Step 3: Apply Reverse Migration

```bash
# Apply migration
npx prisma migrate deploy

# Verify schema
npx prisma migrate status
```

#### Step 4: Update Prisma Schema

Edit `prisma/schema.prisma` to match reverted state.

### Option 3: Point-in-Time Recovery (PITR)

**Best for:** Recovering to specific timestamp

```bash
# Clone instance to specific point in time
gcloud sql instances clone adria-db-prod adria-db-prod-pitr \
  --point-in-time='2024-01-15T10:00:00Z'

# Verify data in cloned instance
# Update application to use cloned instance if verified
```

---

## Complete System Rollback

When both application and database need rollback:

### Step 1: Assess Situation

**Questions to answer:**
- What is the current system state?
- When did the issue start?
- What was the last known good state?
- Is this a code, schema, or data issue?

### Step 2: Create Backup

```bash
# Backup current state for investigation
./scripts/backup-deployment.sh production
```

### Step 3: Rollback Database First

```bash
# Restore database from backup
gcloud sql backups restore BACKUP_ID \
  --backup-instance=adria-db-prod
```

**Wait for completion** (5-15 minutes)

### Step 4: Rollback Application

```bash
# Rollback to matching application version
./scripts/rollback.sh production PREVIOUS_REVISION
```

### Step 5: Verify Complete System

```bash
# Run comprehensive smoke tests
./scripts/smoke-tests.sh production

# Monitor for 30 minutes
./scripts/monitor-health.sh adria-website-prod us-central1 1800
```

---

## Emergency Procedures

### Critical Production Outage

**Situation:** Site is completely down, users cannot access

#### Immediate Actions (0-5 minutes)

1. **Notify team:**
   ```bash
   # Send alert to team (configure your notification method)
   echo "CRITICAL: Production down, initiating rollback" | mail -s "PROD OUTAGE" team@company.com
   ```

2. **Quick rollback to last known good:**
   ```bash
   # Get last working revision
   LAST_GOOD=$(gcloud run revisions list \
     --service=adria-website-prod \
     --region=us-central1 \
     --format='value(name)' \
     --limit=2 | tail -n 1)

   # Immediate rollback
   gcloud run services update-traffic adria-website-prod \
     --region=us-central1 \
     --to-revisions=$LAST_GOOD=100 \
     --quiet
   ```

3. **Verify recovery:**
   ```bash
   curl https://adriacross.com/health
   ```

#### Follow-up Actions (5-30 minutes)

1. Verify all functionality works
2. Monitor error rates and performance
3. Document incident timeline
4. Begin root cause analysis

### Partial Outage

**Situation:** Some features broken, site partially accessible

#### Immediate Actions

1. **Assess impact:**
   - Which features are affected?
   - How many users impacted?
   - Is data integrity at risk?

2. **Decision tree:**
   ```
   Is it customer-facing?
     YES → Rollback immediately
     NO → Can we disable feature flag?
       YES → Disable feature, monitor
       NO → Rollback
   ```

3. **Execute appropriate action:**
   ```bash
   # Option 1: Disable feature flag
   gcloud run services update adria-website-prod \
     --region=us-central1 \
     --update-env-vars FEATURE_BOOKING_ENABLED=false

   # Option 2: Full rollback
   ./scripts/rollback.sh production
   ```

### Database Corruption

**Situation:** Data integrity issues detected

#### Critical Steps

1. **Stop writes immediately:**
   ```bash
   # Enable read-only mode
   gcloud sql instances patch adria-db-prod \
     --database-flags=default_transaction_read_only=on
   ```

2. **Assess corruption:**
   ```sql
   -- Connect to database
   -- Run integrity checks
   SELECT * FROM pg_stat_database WHERE datname = 'adria_prod';
   ```

3. **Restore from last known good backup:**
   ```bash
   # Find last verified backup
   gcloud sql backups list --instance=adria-db-prod

   # Clone from backup
   gcloud sql instances clone adria-db-prod adria-db-prod-restored \
     --backup-id=BACKUP_ID
   ```

4. **Verify restored data:**
   ```bash
   # Run data validation scripts
   npm run validate:data
   ```

5. **Switch application to restored database**

---

## Post-Rollback Checklist

After any rollback, complete this checklist:

### Immediate (0-1 hour)

- [ ] Service is fully operational
- [ ] Health checks passing
- [ ] Error rates normal (< 0.1%)
- [ ] Response times acceptable (< 500ms p95)
- [ ] Database queries successful
- [ ] Team notified of rollback completion
- [ ] Users notified if customer-facing outage occurred

### Short-term (1-4 hours)

- [ ] Incident timeline documented
- [ ] Root cause identified (preliminary)
- [ ] Monitoring alerts reviewed
- [ ] Logs archived for investigation
- [ ] Stakeholders updated

### Follow-up (1-3 days)

- [ ] Post-mortem meeting scheduled
- [ ] Root cause analysis completed
- [ ] Action items identified
- [ ] Prevention measures planned
- [ ] Documentation updated
- [ ] Tests added to prevent recurrence
- [ ] Rollback procedure evaluated for improvements

---

## Rollback Decision Matrix

| Issue Type | Severity | Rollback Type | Timeline | Approval Needed |
|------------|----------|---------------|----------|-----------------|
| Site completely down | Critical | Full application | Immediate | No - rollback first |
| Data corruption | Critical | Database restore | 15 min | Yes - CTO/Lead |
| Feature broken | High | Application or feature flag | 30 min | Yes - Tech Lead |
| Performance degraded | Medium | Application | 1 hour | Yes - Team discussion |
| Minor bug | Low | Scheduled fix | Next release | No rollback |

---

## Testing Rollback Procedures

**Quarterly Rollback Drills:**

1. **Schedule drill** during low-traffic period
2. **Deploy test change** to staging
3. **Execute rollback** using procedures
4. **Measure recovery time**
5. **Document issues** encountered
6. **Update procedures** based on learnings

**Drill Checklist:**
```bash
# 1. Deploy test change
gcloud run deploy adria-website-staging --image=test-image

# 2. Execute rollback
./scripts/rollback.sh staging

# 3. Measure time (should be < 5 minutes)

# 4. Verify functionality

# 5. Document results
```

---

## Communication Templates

### Team Alert Template

```
SUBJECT: [ALERT] Production Rollback Initiated

Team,

Initiating production rollback due to: [ISSUE DESCRIPTION]

Timeline:
- Issue detected: [TIME]
- Rollback initiated: [TIME]
- Expected completion: [TIME]

Impact: [USER IMPACT DESCRIPTION]

Action: [WHAT WE'RE DOING]

Status updates will follow every 15 minutes.

[YOUR NAME]
```

### User Communication Template

```
We're currently experiencing technical difficulties and are working
to restore service. We apologize for the inconvenience and expect
to have everything working normally within [TIMEFRAME].

Updates: https://status.adriacross.com
```

---

## Quick Reference Commands

```bash
# List revisions
gcloud run revisions list --service=SERVICE_NAME --region=REGION

# Rollback application
gcloud run services update-traffic SERVICE_NAME \
  --to-revisions=REVISION_NAME=100 --region=REGION

# List database backups
gcloud sql backups list --instance=INSTANCE_NAME

# Restore database
gcloud sql backups restore BACKUP_ID --backup-instance=INSTANCE_NAME

# Monitor health
./scripts/monitor-health.sh SERVICE_NAME REGION DURATION

# Run smoke tests
./scripts/smoke-tests.sh ENVIRONMENT
```

---

## References

- [Cloud Run Rollback Documentation](https://cloud.google.com/run/docs/rollouts-rollbacks-traffic-migration)
- [Cloud SQL Backup and Recovery](https://cloud.google.com/sql/docs/postgres/backup-recovery/backups)
- [Incident Response Best Practices](https://cloud.google.com/blog/products/management-tools/sre-error-budgets-and-maintenance-windows)
- [Database Migration Rollback](./DATABASE_MIGRATIONS.md#rollback-procedures)

---

## Contact Information

**Emergency Contacts:**
- Tech Lead: [CONTACT INFO]
- DevOps: [CONTACT INFO]
- On-Call: [PAGER/PHONE]

**Escalation Path:**
1. Engineering Team
2. Tech Lead
3. CTO
4. CEO (customer-impacting outages only)
