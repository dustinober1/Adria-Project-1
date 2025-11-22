#!/bin/bash

# Health Monitoring Script for Cloud Run
# Usage: ./scripts/monitor-health.sh <service-name> <region> <duration-seconds>
# Example: ./scripts/monitor-health.sh adria-website-prod us-central1 300

set -e

SERVICE_NAME=${1:-adria-website-prod}
REGION=${2:-us-central1}
DURATION=${3:-300}

echo "======================================"
echo "Monitoring Deployment Health"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo "Duration: ${DURATION}s"
echo "======================================"

# Get service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
  --region="$REGION" \
  --format='value(status.url)')

echo "Service URL: $SERVICE_URL"
echo ""

# Calculate monitoring intervals
INTERVAL=30
ITERATIONS=$((DURATION / INTERVAL))

echo "Monitoring will run $ITERATIONS checks at ${INTERVAL}s intervals"
echo ""

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Start time
START_TIME=$(date +%s)
START_TIME_ISO=$(date -u '+%Y-%m-%dT%H:%M:%S')

# Monitoring loop
for i in $(seq 1 $ITERATIONS); do
  ELAPSED=$((i * INTERVAL))
  echo "[$ELAPSED/${DURATION}s] Health Check $i/$ITERATIONS"

  # HTTP Status Check
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/" || echo "000")
  RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$SERVICE_URL/" || echo "0")
  RESPONSE_TIME_MS=$(echo "$RESPONSE_TIME * 1000" | bc)

  echo "  HTTP Status: $HTTP_STATUS"
  echo "  Response Time: ${RESPONSE_TIME_MS}ms"

  ((TOTAL_CHECKS++))

  # Evaluate health
  HEALTH_PASSED=true

  if [ "$HTTP_STATUS" != "200" ]; then
    echo "  ✗ Status check failed"
    HEALTH_PASSED=false
  fi

  if (( $(echo "$RESPONSE_TIME > 3.0" | bc -l) )); then
    echo "  ✗ Response time too slow (> 3000ms)"
    HEALTH_PASSED=false
  fi

  # Check error logs
  ERROR_COUNT=$(gcloud logging read "resource.type=cloud_run_revision \
    AND resource.labels.service_name=$SERVICE_NAME \
    AND severity>=ERROR \
    AND timestamp>=\"$(date -u -d '1 minute ago' '+%Y-%m-%dT%H:%M:%S')\"" \
    --limit=10 \
    --format="value(timestamp)" 2>/dev/null | wc -l || echo "0")

  echo "  Recent errors: $ERROR_COUNT"

  if [ "$ERROR_COUNT" -gt 3 ]; then
    echo "  ✗ Too many errors in logs"
    HEALTH_PASSED=false
  fi

  # Update counters
  if [ "$HEALTH_PASSED" = true ]; then
    echo "  ✓ Health check passed"
    ((PASSED_CHECKS++))
  else
    echo "  ✗ Health check failed"
    ((FAILED_CHECKS++))

    # If we have too many failures, exit early
    if [ $FAILED_CHECKS -gt 2 ]; then
      echo ""
      echo "⚠️  Too many health check failures. Aborting monitoring."
      echo "Failed checks: $FAILED_CHECKS/$TOTAL_CHECKS"
      exit 1
    fi
  fi

  echo ""

  # Sleep before next iteration (unless it's the last one)
  if [ $i -lt $ITERATIONS ]; then
    sleep $INTERVAL
  fi
done

# Calculate final statistics
END_TIME=$(date +%s)
ACTUAL_DURATION=$((END_TIME - START_TIME))

SUCCESS_RATE=$(echo "scale=2; ($PASSED_CHECKS * 100) / $TOTAL_CHECKS" | bc)

echo "======================================"
echo "Health Monitoring Summary"
echo "======================================"
echo "Duration: ${ACTUAL_DURATION}s"
echo "Total checks: $TOTAL_CHECKS"
echo "Passed: $PASSED_CHECKS"
echo "Failed: $FAILED_CHECKS"
echo "Success rate: ${SUCCESS_RATE}%"
echo ""

# Determine overall health
if (( $(echo "$SUCCESS_RATE >= 90" | bc -l) )); then
  echo "✓ Overall health: EXCELLENT"

  # Get aggregate metrics
  echo ""
  echo "Aggregate Metrics:"

  # Count total requests
  REQUEST_COUNT=$(gcloud logging read "resource.type=cloud_run_revision \
    AND resource.labels.service_name=$SERVICE_NAME \
    AND httpRequest.status>=200 \
    AND timestamp>=\"$START_TIME_ISO\"" \
    --limit=1000 \
    --format="value(timestamp)" 2>/dev/null | wc -l || echo "0")

  echo "  Total requests: $REQUEST_COUNT"

  # Count 5xx errors
  ERROR_5XX_COUNT=$(gcloud logging read "resource.type=cloud_run_revision \
    AND resource.labels.service_name=$SERVICE_NAME \
    AND httpRequest.status>=500 \
    AND timestamp>=\"$START_TIME_ISO\"" \
    --limit=100 \
    --format="value(timestamp)" 2>/dev/null | wc -l || echo "0")

  echo "  5xx errors: $ERROR_5XX_COUNT"

  # Calculate error rate
  if [ "$REQUEST_COUNT" -gt 0 ]; then
    ERROR_RATE=$(echo "scale=4; ($ERROR_5XX_COUNT * 100) / $REQUEST_COUNT" | bc)
    echo "  Error rate: ${ERROR_RATE}%"
  fi

  exit 0
elif (( $(echo "$SUCCESS_RATE >= 70" | bc -l) )); then
  echo "⚠️  Overall health: DEGRADED"
  echo "Consider investigating recent changes"
  exit 1
else
  echo "✗ Overall health: CRITICAL"
  echo "Immediate action required"
  exit 1
fi
