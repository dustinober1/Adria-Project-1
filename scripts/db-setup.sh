#!/bin/bash

################################################################################
# Database Setup Script for Adria Cross Website
#
# This script provisions Google Cloud SQL PostgreSQL instances for
# development, staging, and production environments.
#
# Prerequisites:
#   - gcloud CLI installed and authenticated
#   - Active GCP project with billing enabled
#   - Cloud SQL Admin API enabled
#   - Appropriate IAM permissions
#
# Usage:
#   ./scripts/db-setup.sh [environment]
#
#   environment: dev | staging | prod | all (default: dev)
#
# Examples:
#   ./scripts/db-setup.sh dev       # Setup development database only
#   ./scripts/db-setup.sh all       # Setup all environments
#
# See docs/DATABASE_SETUP.md for detailed documentation
################################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable
set -o pipefail  # Exit on pipe failure

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Default configuration
ENVIRONMENT="${1:-dev}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Source .env if exists
if [ -f "$PROJECT_ROOT/.env" ]; then
    log_info "Loading configuration from .env"
    set -a
    source "$PROJECT_ROOT/.env"
    set +a
fi

# Configuration variables
GCP_PROJECT_ID="${GCP_PROJECT_ID:-}"
GCP_REGION="${GCP_REGION:-us-central1}"
DB_VERSION="POSTGRES_15"

# Validate prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check gcloud CLI
    if ! command -v gcloud &> /dev/null; then
        log_error "gcloud CLI not found. Install from: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi

    # Check authentication
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
        log_error "Not authenticated with gcloud. Run: gcloud auth login"
        exit 1
    fi

    # Check project ID
    if [ -z "$GCP_PROJECT_ID" ]; then
        log_error "GCP_PROJECT_ID not set. Set it in .env or export it"
        exit 1
    fi

    # Set project
    log_info "Setting GCP project to: $GCP_PROJECT_ID"
    gcloud config set project "$GCP_PROJECT_ID" --quiet

    # Enable required APIs
    log_info "Enabling required Google Cloud APIs..."
    gcloud services enable sqladmin.googleapis.com --quiet
    gcloud services enable compute.googleapis.com --quiet
    gcloud services enable servicenetworking.googleapis.com --quiet
    gcloud services enable secretmanager.googleapis.com --quiet

    log_success "Prerequisites check passed"
}

# Generate secure password
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Create Cloud SQL instance
create_instance() {
    local env=$1
    local instance_name="adria-db-${env}"

    log_info "Creating Cloud SQL instance: $instance_name"

    # Check if instance already exists
    if gcloud sql instances describe "$instance_name" --project="$GCP_PROJECT_ID" &> /dev/null; then
        log_warning "Instance $instance_name already exists. Skipping creation."
        return 0
    fi

    # Environment-specific configuration
    case $env in
        dev)
            TIER="db-f1-micro"
            STORAGE_SIZE="10"
            AVAILABILITY="ZONAL"
            BACKUP_ENABLED="false"
            RETAINED_BACKUPS="0"
            MAX_CONNECTIONS="50"
            DELETION_PROTECTION=""
            ;;
        staging)
            TIER="db-g1-small"
            STORAGE_SIZE="20"
            AVAILABILITY="ZONAL"
            BACKUP_ENABLED="true"
            RETAINED_BACKUPS="7"
            MAX_CONNECTIONS="100"
            DELETION_PROTECTION=""
            ;;
        prod)
            TIER="db-custom-2-8192"
            STORAGE_SIZE="50"
            AVAILABILITY="REGIONAL"
            BACKUP_ENABLED="true"
            RETAINED_BACKUPS="30"
            MAX_CONNECTIONS="200"
            DELETION_PROTECTION="--deletion-protection"
            ;;
        *)
            log_error "Unknown environment: $env"
            exit 1
            ;;
    esac

    # Build create command
    local create_cmd=(
        gcloud sql instances create "$instance_name"
        --project="$GCP_PROJECT_ID"
        --database-version="$DB_VERSION"
        --tier="$TIER"
        --region="$GCP_REGION"
        --network=default
        --availability-type="$AVAILABILITY"
        --storage-type=SSD
        --storage-size="${STORAGE_SIZE}GB"
        --storage-auto-increase
        --database-flags="max_connections=$MAX_CONNECTIONS"
        --insights-config-query-insights-enabled
    )

    # Add backup configuration if enabled
    if [ "$BACKUP_ENABLED" = "true" ]; then
        create_cmd+=(
            --backup-start-time=03:00
            --backup-location=us
            --retained-backups-count="$RETAINED_BACKUPS"
            --retained-transaction-log-days=7
        )
    else
        create_cmd+=(--no-backup)
    fi

    # Add maintenance window
    if [ "$env" = "prod" ]; then
        create_cmd+=(
            --maintenance-window-day=SUN
            --maintenance-window-hour=4
            --maintenance-release-channel=production
        )
    else
        create_cmd+=(
            --maintenance-window-day=SAT
            --maintenance-window-hour=4
        )
    fi

    # Add deletion protection for production
    if [ -n "$DELETION_PROTECTION" ]; then
        create_cmd+=($DELETION_PROTECTION)
    fi

    # Execute create command
    log_info "Provisioning instance with tier: $TIER, storage: ${STORAGE_SIZE}GB..."
    "${create_cmd[@]}"

    log_success "Instance $instance_name created successfully"
}

# Create database and user
setup_database_and_user() {
    local env=$1
    local instance_name="adria-db-${env}"
    local database_name="adria_${env}"
    local db_user="adria_app_user"

    log_info "Setting up database and user for $instance_name"

    # Wait for instance to be ready
    log_info "Waiting for instance to be ready..."
    gcloud sql operations wait \
        "$(gcloud sql operations list --instance="$instance_name" --limit=1 --format="value(name)")" \
        --project="$GCP_PROJECT_ID" || true

    # Create database
    log_info "Creating database: $database_name"
    if gcloud sql databases describe "$database_name" --instance="$instance_name" --project="$GCP_PROJECT_ID" &> /dev/null; then
        log_warning "Database $database_name already exists"
    else
        gcloud sql databases create "$database_name" \
            --instance="$instance_name" \
            --project="$GCP_PROJECT_ID"
        log_success "Database $database_name created"
    fi

    # Generate password
    local password
    if [ "$env" = "dev" ]; then
        password="dev_password_123"  # Simple password for dev
        log_warning "Using simple password for development environment"
    else
        password=$(generate_password)
        log_success "Generated secure password for $env environment"
    fi

    # Create database user
    log_info "Creating database user: $db_user"
    if gcloud sql users describe "$db_user" --instance="$instance_name" --project="$GCP_PROJECT_ID" &> /dev/null; then
        log_warning "User $db_user already exists, updating password..."
        gcloud sql users set-password "$db_user" \
            --instance="$instance_name" \
            --password="$password" \
            --project="$GCP_PROJECT_ID"
    else
        gcloud sql users create "$db_user" \
            --instance="$instance_name" \
            --password="$password" \
            --project="$GCP_PROJECT_ID"
        log_success "User $db_user created"
    fi

    # Store password in Secret Manager (staging and prod)
    if [ "$env" != "dev" ]; then
        local secret_name="adria-db-${env}-password"
        log_info "Storing password in Secret Manager: $secret_name"

        # Check if secret exists
        if gcloud secrets describe "$secret_name" --project="$GCP_PROJECT_ID" &> /dev/null; then
            log_info "Secret exists, adding new version..."
            echo -n "$password" | gcloud secrets versions add "$secret_name" --data-file=- --project="$GCP_PROJECT_ID"
        else
            log_info "Creating new secret..."
            echo -n "$password" | gcloud secrets create "$secret_name" \
                --data-file=- \
                --replication-policy="automatic" \
                --project="$GCP_PROJECT_ID"
        fi
        log_success "Password stored in Secret Manager"
        log_warning "Access password with: gcloud secrets versions access latest --secret='$secret_name'"
    else
        log_info "Development password: $password"
    fi

    # Get connection information
    local connection_name
    connection_name=$(gcloud sql instances describe "$instance_name" \
        --project="$GCP_PROJECT_ID" \
        --format="value(connectionName)")

    local ip_address
    ip_address=$(gcloud sql instances describe "$instance_name" \
        --project="$GCP_PROJECT_ID" \
        --format="value(ipAddresses[0].ipAddress)")

    # Print connection details
    echo ""
    log_success "=========================================="
    log_success "Database Setup Complete: $env"
    log_success "=========================================="
    echo ""
    echo "Instance Name:       $instance_name"
    echo "Connection Name:     $connection_name"
    echo "IP Address:          $ip_address"
    echo "Database:            $database_name"
    echo "User:                $db_user"
    echo ""
    echo "Connection String (Cloud SQL Proxy):"
    echo "DATABASE_URL=\"postgresql://${db_user}:${password}@localhost:5432/${database_name}\""
    echo ""
    echo "Connection String (Cloud Run):"
    echo "DATABASE_URL=\"postgresql://${db_user}:${password}@/${database_name}?host=/cloudsql/${connection_name}\""
    echo ""
    if [ "$env" != "dev" ]; then
        echo "Password stored in Secret Manager: $secret_name"
        echo "Retrieve with: gcloud secrets versions access latest --secret='$secret_name' --project='$GCP_PROJECT_ID'"
    fi
    echo ""
    log_success "=========================================="
    echo ""
}

# Create service account for backend
create_service_account() {
    local sa_name="adria-backend"
    local sa_email="${sa_name}@${GCP_PROJECT_ID}.iam.gserviceaccount.com"

    log_info "Creating service account: $sa_name"

    # Check if service account exists
    if gcloud iam service-accounts describe "$sa_email" --project="$GCP_PROJECT_ID" &> /dev/null; then
        log_warning "Service account $sa_email already exists"
    else
        gcloud iam service-accounts create "$sa_name" \
            --display-name="Adria Backend Service Account" \
            --project="$GCP_PROJECT_ID"
        log_success "Service account created: $sa_email"
    fi

    # Grant Cloud SQL Client role
    log_info "Granting Cloud SQL Client role..."
    gcloud projects add-iam-policy-binding "$GCP_PROJECT_ID" \
        --member="serviceAccount:$sa_email" \
        --role="roles/cloudsql.client" \
        --quiet

    # Grant Secret Manager accessor role
    log_info "Granting Secret Manager Secret Accessor role..."
    gcloud projects add-iam-policy-binding "$GCP_PROJECT_ID" \
        --member="serviceAccount:$sa_email" \
        --role="roles/secretmanager.secretAccessor" \
        --quiet

    log_success "Service account configured with necessary permissions"
    echo ""
    echo "Service Account: $sa_email"
    echo "Roles: Cloud SQL Client, Secret Manager Secret Accessor"
    echo ""
}

# Main setup function
setup_environment() {
    local env=$1

    log_info "=========================================="
    log_info "Setting up $env environment"
    log_info "=========================================="

    create_instance "$env"
    setup_database_and_user "$env"
}

# Main script execution
main() {
    echo ""
    log_info "=========================================="
    log_info "Adria Cross - Database Setup Script"
    log_info "=========================================="
    echo ""

    check_prerequisites

    case $ENVIRONMENT in
        dev|development)
            setup_environment "dev"
            ;;
        staging)
            setup_environment "staging"
            ;;
        prod|production)
            setup_environment "prod"
            ;;
        all)
            create_service_account
            setup_environment "dev"
            sleep 5
            setup_environment "staging"
            sleep 5
            setup_environment "prod"
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT"
            echo ""
            echo "Usage: $0 [dev|staging|prod|all]"
            echo ""
            echo "Examples:"
            echo "  $0 dev      # Setup development database only"
            echo "  $0 staging  # Setup staging database only"
            echo "  $0 prod     # Setup production database only"
            echo "  $0 all      # Setup all environments"
            echo ""
            exit 1
            ;;
    esac

    # Create service account (if not already done in 'all')
    if [ "$ENVIRONMENT" != "all" ]; then
        create_service_account
    fi

    echo ""
    log_success "=========================================="
    log_success "Database setup completed successfully!"
    log_success "=========================================="
    echo ""
    log_info "Next steps:"
    echo "  1. Install Cloud SQL Proxy: brew install cloud-sql-proxy"
    echo "  2. Start proxy: See docs/DATABASE_SETUP.md"
    echo "  3. Update .env with DATABASE_URL"
    echo "  4. Install Prisma: cd packages/backend && npm install prisma @prisma/client"
    echo "  5. Initialize Prisma: npx prisma init"
    echo "  6. Run migrations: npx prisma migrate dev"
    echo ""
    log_info "For detailed instructions, see: docs/DATABASE_SETUP.md"
    echo ""
}

# Run main function
main
