#!/bin/bash

# Gradual Traffic Rollout Script for Cloud Run
# Usage: ./scripts/gradual-rollout.sh <service-name> <region>
# Example: ./scripts/gradual-rollout.sh adria-website-prod us-central1

set -e

SERVICE_NAME=${1:-adria-website-prod}
REGION=${2:-us-central1}

echo "======================================"
echo "Starting Gradual Traffic Rollout"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo "======================================"

# Get the latest revision (currently has no traffic)
LATEST_REVISION=$(gcloud run services describe "$SERVICE_NAME" \
  --region="$REGION" \
  --format='value(status.latestReadyRevisionName)')

# Get the current active revision (has 100% traffic)
CURRENT_REVISION=$(gcloud run services describe "$SERVICE_NAME" \
  --region="$REGION" \
  --format='value(status.traffic[0].revisionName)')

echo "Current revision: $CURRENT_REVISION (100% traffic)"
echo "Latest revision: $LATEST_REVISION (0% traffic)"
echo ""

if [ "$LATEST_REVISION" = "$CURRENT_REVISION" ]; then
  echo "Latest revision is already receiving all traffic. No rollout needed."
  exit 0
fi

# Helper function to update traffic
update_traffic() {
  local new_revision=$1
  local new_percent=$2
  local old_revision=$3
  local old_percent=$4

  echo "Setting traffic: $new_revision=$new_percent%, $old_revision=$old_percent%"

  gcloud run services update-traffic "$SERVICE_NAME" \
    --region="$REGION" \
    --to-revisions="$new_revision=$new_percent,$old_revision=$old_percent" \
    --quiet
}

# Helper function to monitor health
check_health() {
  local duration=$1
  echo "Monitoring health for ${duration} seconds..."

  # Get service URL
  SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
    --region="$REGION" \
    --format='value(status.url)')

  # Monitor error rate
  START_TIME=$(date -u '+%Y-%m-%dT%H:%M:%S')
  sleep "$duration"
  END_TIME=$(date -u '+%Y-%m-%dT%H:%M:%S')

  ERROR_COUNT=$(gcloud logging read "resource.type=cloud_run_revision \
    AND resource.labels.service_name=$SERVICE_NAME \
    AND resource.labels.revision_name=$LATEST_REVISION \
    AND severity>=ERROR \
    AND timestamp>=\"$START_TIME\" \
    AND timestamp<=\"$END_TIME\"" \
    --limit=100 \
    --format="value(timestamp)" | wc -l)

  echo "Errors detected: $ERROR_COUNT"

  # Check if error rate is acceptable (< 5 errors in monitoring period)
  if [ "$ERROR_COUNT" -gt 5 ]; then
    echo "✗ Health check failed: Too many errors"
    return 1
  fi

  echo "✓ Health check passed"
  return 0
}

# Stage 1: 25% traffic to new revision
echo ""
echo "Stage 1: Routing 25% traffic to new revision..."
update_traffic "$LATEST_REVISION" 25 "$CURRENT_REVISION" 75

if ! check_health 60; then
  echo "Health check failed at 25%. Rolling back..."
  update_traffic "$CURRENT_REVISION" 100 "$LATEST_REVISION" 0
  exit 1
fi

# Stage 2: 50% traffic to new revision
echo ""
echo "Stage 2: Routing 50% traffic to new revision..."
update_traffic "$LATEST_REVISION" 50 "$CURRENT_REVISION" 50

if ! check_health 120; then
  echo "Health check failed at 50%. Rolling back..."
  update_traffic "$CURRENT_REVISION" 100 "$LATEST_REVISION" 0
  exit 1
fi

# Stage 3: 75% traffic to new revision
echo ""
echo "Stage 3: Routing 75% traffic to new revision..."
update_traffic "$LATEST_REVISION" 75 "$CURRENT_REVISION" 25

if ! check_health 120; then
  echo "Health check failed at 75%. Rolling back..."
  update_traffic "$CURRENT_REVISION" 100 "$LATEST_REVISION" 0
  exit 1
fi

# Stage 4: 100% traffic to new revision
echo ""
echo "Stage 4: Routing 100% traffic to new revision..."
update_traffic "$LATEST_REVISION" 100 "$CURRENT_REVISION" 0

if ! check_health 180; then
  echo "Health check failed at 100%. Rolling back..."
  update_traffic "$CURRENT_REVISION" 100 "$LATEST_REVISION" 0
  exit 1
fi

echo ""
echo "======================================"
echo "✓ Gradual rollout completed successfully!"
echo "New revision: $LATEST_REVISION (100% traffic)"
echo "======================================"

exit 0
