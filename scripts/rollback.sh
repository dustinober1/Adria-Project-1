#!/bin/bash

# Rollback Script for Cloud Run Deployments
# Usage: ./scripts/rollback.sh <environment> [revision]
# Example: ./scripts/rollback.sh production
# Example: ./scripts/rollback.sh staging adria-website-staging-00042-abc

set -e

ENVIRONMENT=${1:-staging}
TARGET_REVISION=$2

echo "======================================"
echo "Cloud Run Deployment Rollback"
echo "Environment: $ENVIRONMENT"
echo "======================================"

# Determine service name and region based on environment
case $ENVIRONMENT in
  production)
    SERVICE_NAME="adria-website-prod"
    REGION="us-central1"
    ;;
  staging)
    SERVICE_NAME="adria-website-staging"
    REGION="us-central1"
    ;;
  *)
    echo "Error: Invalid environment. Use 'production' or 'staging'"
    exit 1
    ;;
esac

# Get current revision
CURRENT_REVISION=$(gcloud run services describe "$SERVICE_NAME" \
  --region="$REGION" \
  --format='value(status.latestReadyRevisionName)')

echo "Current revision: $CURRENT_REVISION"
echo ""

# If no target revision specified, list available revisions
if [ -z "$TARGET_REVISION" ]; then
  echo "Available revisions for rollback:"
  echo ""

  gcloud run revisions list \
    --service="$SERVICE_NAME" \
    --region="$REGION" \
    --format='table(name,created,traffic,status)' \
    --limit=10

  echo ""
  echo "Usage: ./scripts/rollback.sh $ENVIRONMENT <revision-name>"
  echo "Example: ./scripts/rollback.sh $ENVIRONMENT adria-website-${ENVIRONMENT}-00042-abc"
  exit 0
fi

# Verify target revision exists
REVISION_EXISTS=$(gcloud run revisions describe "$TARGET_REVISION" \
  --region="$REGION" \
  --format='value(metadata.name)' 2>/dev/null || echo "")

if [ -z "$REVISION_EXISTS" ]; then
  echo "Error: Revision '$TARGET_REVISION' not found"
  exit 1
fi

# Confirm rollback
echo "You are about to rollback from:"
echo "  Current: $CURRENT_REVISION"
echo "  Target:  $TARGET_REVISION"
echo ""

if [ "$ENVIRONMENT" = "production" ]; then
  echo "⚠️  WARNING: This is a PRODUCTION rollback!"
  echo ""
fi

read -p "Are you sure you want to proceed? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Rollback cancelled"
  exit 0
fi

echo ""
echo "Starting rollback process..."

# Create a backup record before rollback
BACKUP_FILE="/tmp/rollback-backup-$(date +%Y%m%d-%H%M%S).txt"
echo "Creating rollback record at: $BACKUP_FILE"
echo "Rollback from $CURRENT_REVISION to $TARGET_REVISION at $(date)" > "$BACKUP_FILE"

# Step 1: Route 100% traffic to target revision
echo ""
echo "Step 1: Routing 100% traffic to $TARGET_REVISION..."

gcloud run services update-traffic "$SERVICE_NAME" \
  --region="$REGION" \
  --to-revisions="$TARGET_REVISION=100" \
  --quiet

echo "✓ Traffic routed to target revision"

# Step 2: Wait and monitor
echo ""
echo "Step 2: Monitoring rollback health (60 seconds)..."
sleep 10

# Get service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
  --region="$REGION" \
  --format='value(status.url)')

# Perform health checks
HEALTH_CHECK_PASSED=true

for i in {1..5}; do
  echo -n "Health check $i/5... "

  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/")

  if [ "$HTTP_STATUS" -eq 200 ]; then
    echo "✓ PASSED (HTTP $HTTP_STATUS)"
  else
    echo "✗ FAILED (HTTP $HTTP_STATUS)"
    HEALTH_CHECK_PASSED=false
    break
  fi

  sleep 10
done

# Step 3: Verify logs
echo ""
echo "Step 3: Checking error logs..."

ERROR_COUNT=$(gcloud logging read "resource.type=cloud_run_revision \
  AND resource.labels.service_name=$SERVICE_NAME \
  AND resource.labels.revision_name=$TARGET_REVISION \
  AND severity>=ERROR \
  AND timestamp>=\"$(date -u -d '2 minutes ago' '+%Y-%m-%dT%H:%M:%S')\"" \
  --limit=10 \
  --format="value(timestamp)" | wc -l)

echo "Errors in last 2 minutes: $ERROR_COUNT"

# Step 4: Rollback assessment
echo ""
echo "======================================"

if [ "$HEALTH_CHECK_PASSED" = true ] && [ "$ERROR_COUNT" -lt 5 ]; then
  echo "✓ Rollback completed successfully!"
  echo ""
  echo "Service: $SERVICE_NAME"
  echo "Region: $REGION"
  echo "Active revision: $TARGET_REVISION"
  echo "Previous revision: $CURRENT_REVISION"
  echo ""
  echo "Monitor the service at: $SERVICE_URL"

  # Optionally delete the problematic revision (only if not in production)
  if [ "$ENVIRONMENT" = "staging" ]; then
    echo ""
    read -p "Delete problematic revision $CURRENT_REVISION? (yes/no): " DELETE_CONFIRM

    if [ "$DELETE_CONFIRM" = "yes" ]; then
      gcloud run revisions delete "$CURRENT_REVISION" \
        --region="$REGION" \
        --quiet
      echo "✓ Problematic revision deleted"
    fi
  fi

  exit 0
else
  echo "⚠️  Rollback completed but health checks indicate issues"
  echo "Please investigate manually"
  echo ""
  echo "Service logs:"
  echo "gcloud logging read \"resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME\" --limit=50"
  exit 1
fi
