#!/bin/bash

# Smoke Test Script
# Usage: ./scripts/smoke-tests.sh <environment>
# Example: ./scripts/smoke-tests.sh staging

set -e

ENVIRONMENT=${1:-staging}

echo "======================================"
echo "Running Smoke Tests"
echo "Environment: $ENVIRONMENT"
echo "======================================"

# Set the appropriate service URL based on environment
case $ENVIRONMENT in
  production)
    SERVICE_URL="https://adriacross.com"
    ;;
  production-candidate)
    # Get the latest revision URL that doesn't have traffic yet
    SERVICE_URL=$(gcloud run services describe adria-website-prod \
      --region=us-central1 \
      --format='value(status.url)')
    ;;
  staging)
    # Get staging service URL
    SERVICE_URL=$(gcloud run services describe adria-website-staging \
      --region=us-central1 \
      --format='value(status.url)')
    ;;
  *)
    echo "Error: Invalid environment. Use 'production', 'staging', or 'production-candidate'"
    exit 1
    ;;
esac

echo "Testing service at: $SERVICE_URL"

# Counter for failed tests
FAILED_TESTS=0

# Helper function to test endpoint
test_endpoint() {
  local endpoint=$1
  local expected_status=$2
  local description=$3

  echo -n "Testing $description... "

  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL$endpoint")

  if [ "$HTTP_STATUS" -eq "$expected_status" ]; then
    echo "✓ PASSED (HTTP $HTTP_STATUS)"
  else
    echo "✗ FAILED (Expected HTTP $expected_status, got $HTTP_STATUS)"
    ((FAILED_TESTS++))
  fi
}

# Test 1: Health check endpoint
echo ""
echo "Running health checks..."
test_endpoint "/health" 200 "Health endpoint"
test_endpoint "/api/health" 200 "API health endpoint"

# Test 2: Static pages
echo ""
echo "Testing static pages..."
test_endpoint "/" 200 "Homepage"
test_endpoint "/about.html" 200 "About page"
test_endpoint "/services.html" 200 "Services page"
test_endpoint "/contact.html" 200 "Contact page"
test_endpoint "/blog.html" 200 "Blog redirect"

# Test 3: Blog posts
echo ""
echo "Testing blog..."
test_endpoint "/blog/index.html" 200 "Blog index"
test_endpoint "/blog/posts/how-to-build-a-capsule-wardrobe.html" 200 "Blog post 1"

# Test 4: Static assets
echo ""
echo "Testing static assets..."
test_endpoint "/css/landing.css" 200 "CSS stylesheet"
test_endpoint "/js/logger.js" 200 "JavaScript file"
test_endpoint "/manifest.json" 200 "PWA manifest"

# Test 5: API endpoints (once backend is implemented)
echo ""
echo "Testing API endpoints..."
# Uncomment when API is ready
# test_endpoint "/api/v1/contact" 200 "Contact API"
# test_endpoint "/api/v1/services" 200 "Services API"
echo "API tests skipped (not yet implemented)"

# Test 6: Check response time
echo ""
echo "Testing response time..."
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$SERVICE_URL/")
RESPONSE_TIME_MS=$(echo "$RESPONSE_TIME * 1000" | bc)

echo "Homepage response time: ${RESPONSE_TIME_MS}ms"

# Fail if response time > 2 seconds
if (( $(echo "$RESPONSE_TIME > 2.0" | bc -l) )); then
  echo "✗ FAILED: Response time too slow (> 2000ms)"
  ((FAILED_TESTS++))
else
  echo "✓ PASSED: Response time acceptable"
fi

# Test 7: Check for critical errors in logs (for Cloud Run)
if [ "$ENVIRONMENT" != "production-candidate" ]; then
  echo ""
  echo "Checking recent logs for errors..."

  SERVICE_NAME=""
  case $ENVIRONMENT in
    production)
      SERVICE_NAME="adria-website-prod"
      ;;
    staging)
      SERVICE_NAME="adria-website-staging"
      ;;
  esac

  if [ -n "$SERVICE_NAME" ]; then
    ERROR_COUNT=$(gcloud logging read "resource.type=cloud_run_revision \
      AND resource.labels.service_name=$SERVICE_NAME \
      AND severity>=ERROR \
      AND timestamp>=\"$(date -u -d '5 minutes ago' '+%Y-%m-%dT%H:%M:%S')\"" \
      --limit=10 \
      --format="value(timestamp)" | wc -l)

    echo "Error count in last 5 minutes: $ERROR_COUNT"

    if [ "$ERROR_COUNT" -gt 5 ]; then
      echo "✗ FAILED: Too many errors in logs"
      ((FAILED_TESTS++))
    else
      echo "✓ PASSED: Error count acceptable"
    fi
  fi
fi

# Summary
echo ""
echo "======================================"
echo "Smoke Test Summary"
echo "======================================"

if [ $FAILED_TESTS -eq 0 ]; then
  echo "✓ All smoke tests passed!"
  exit 0
else
  echo "✗ $FAILED_TESTS test(s) failed"
  exit 1
fi
