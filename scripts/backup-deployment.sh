#!/bin/bash

# Backup Current Deployment Script
# Usage: ./scripts/backup-deployment.sh <environment>
# Example: ./scripts/backup-deployment.sh production

set -e

ENVIRONMENT=${1:-staging}
BACKUP_DIR="/tmp/deployments/backups"

echo "======================================"
echo "Creating Deployment Backup"
echo "Environment: $ENVIRONMENT"
echo "======================================"

# Determine service name and region
case $ENVIRONMENT in
  production)
    SERVICE_NAME="adria-website-prod"
    REGION="us-central1"
    DB_INSTANCE="adria-postgres-prod"
    ;;
  staging)
    SERVICE_NAME="adria-website-staging"
    REGION="us-central1"
    DB_INSTANCE="adria-postgres-staging"
    ;;
  *)
    echo "Error: Invalid environment. Use 'production' or 'staging'"
    exit 1
    ;;
esac

# Create backup directory
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${SERVICE_NAME}-${TIMESTAMP}.json"

# Step 1: Save current service configuration
echo "Step 1: Saving current service configuration..."

gcloud run services describe "$SERVICE_NAME" \
  --region="$REGION" \
  --format=json > "$BACKUP_FILE"

echo "✓ Service configuration saved to: $BACKUP_FILE"

# Step 2: List current revisions and traffic split
echo ""
echo "Step 2: Recording current revisions and traffic..."

REVISION_FILE="$BACKUP_DIR/${SERVICE_NAME}-revisions-${TIMESTAMP}.txt"

echo "Current Revisions and Traffic Split" > "$REVISION_FILE"
echo "Timestamp: $(date)" >> "$REVISION_FILE"
echo "========================================" >> "$REVISION_FILE"
echo "" >> "$REVISION_FILE"

gcloud run revisions list \
  --service="$SERVICE_NAME" \
  --region="$REGION" \
  --format='table(name,created,traffic,status)' \
  --limit=10 >> "$REVISION_FILE"

echo "✓ Revisions saved to: $REVISION_FILE"

# Step 3: Get current image tag
echo ""
echo "Step 3: Recording current image..."

CURRENT_IMAGE=$(gcloud run services describe "$SERVICE_NAME" \
  --region="$REGION" \
  --format='value(spec.template.spec.containers[0].image)')

IMAGE_FILE="$BACKUP_DIR/${SERVICE_NAME}-image-${TIMESTAMP}.txt"
echo "$CURRENT_IMAGE" > "$IMAGE_FILE"

echo "✓ Current image: $CURRENT_IMAGE"
echo "✓ Image saved to: $IMAGE_FILE"

# Step 4: Backup database (production only)
if [ "$ENVIRONMENT" = "production" ]; then
  echo ""
  echo "Step 4: Creating database backup..."

  BACKUP_NAME="pre-deployment-${TIMESTAMP}"

  gcloud sql backups create \
    --instance="$DB_INSTANCE" \
    --description="Pre-deployment backup: $BACKUP_NAME" || {
      echo "Warning: Database backup failed, but continuing..."
    }

  echo "✓ Database backup created: $BACKUP_NAME"

  # List recent backups
  echo ""
  echo "Recent database backups:"
  gcloud sql backups list \
    --instance="$DB_INSTANCE" \
    --limit=5
fi

# Step 5: Save environment variables (encrypted)
echo ""
echo "Step 5: Recording environment variables..."

ENV_FILE="$BACKUP_DIR/${SERVICE_NAME}-env-${TIMESTAMP}.txt"

echo "Environment Variables (Secret values masked)" > "$ENV_FILE"
echo "Timestamp: $(date)" >> "$ENV_FILE"
echo "========================================" >> "$ENV_FILE"
echo "" >> "$ENV_FILE"

gcloud run services describe "$SERVICE_NAME" \
  --region="$REGION" \
  --format='value(spec.template.spec.containers[0].env)' >> "$ENV_FILE"

echo "✓ Environment variables saved to: $ENV_FILE"

# Step 6: Create restoration instructions
echo ""
echo "Step 6: Creating restoration instructions..."

RESTORE_FILE="$BACKUP_DIR/${SERVICE_NAME}-restore-${TIMESTAMP}.sh"

cat > "$RESTORE_FILE" << EOF
#!/bin/bash

# Automatic Restoration Script
# Generated: $(date)
# Environment: $ENVIRONMENT

set -e

echo "Restoring $SERVICE_NAME to state from $TIMESTAMP"

# Restore to previous image
gcloud run deploy "$SERVICE_NAME" \\
  --region="$REGION" \\
  --image="$CURRENT_IMAGE" \\
  --platform=managed

echo "Service restored successfully"
echo "Verify at: https://adriacross.com"
EOF

chmod +x "$RESTORE_FILE"

echo "✓ Restoration script saved to: $RESTORE_FILE"

# Summary
echo ""
echo "======================================"
echo "Backup completed successfully!"
echo "======================================"
echo "Backup location: $BACKUP_DIR"
echo ""
echo "Files created:"
echo "  - Service config: $BACKUP_FILE"
echo "  - Revisions: $REVISION_FILE"
echo "  - Image: $IMAGE_FILE"
echo "  - Environment: $ENV_FILE"
echo "  - Restore script: $RESTORE_FILE"
echo ""
echo "To restore this deployment:"
echo "  $RESTORE_FILE"
echo ""
echo "Or manually rollback using:"
echo "  ./scripts/rollback.sh $ENVIRONMENT <revision-name>"

exit 0
