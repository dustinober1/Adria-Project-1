# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Adria Cross is a professional personal stylist website currently in transformation from a static HTML/CSS/JavaScript site to a full-stack TypeScript application with PostgreSQL database backend. The site is designed to be responsive, SEO-friendly, and deployable to Google Cloud Run. When you are done with each iteration, git commit and git push the changes. Also update this CLAUDE.md file as needed to reflect any new instructions or architecture changes or project status changes.

## Project Status

**Current Phase**: Sprint 1 - Infrastructure Setup
**Completed User Stories**:
- US-1.2: CI/CD pipeline configuration (GitHub Actions, Cloud Build, deployment automation)
- US-1.3: PostgreSQL database setup documentation and migration strategy (Prisma)

**Next Steps**:
- US-1.1: Monorepo structure setup (packages/backend, packages/frontend, packages/shared)

## Documentation

All documentation and planning docs are in the `/docs` folder:
- `docs/TRANSFORMATION_PLAN.md` - Complete transformation roadmap
- `docs/TRANSFORMATION_SUMMARY.md` - Executive summary
- `docs/DATABASE_SETUP.md` - PostgreSQL and Prisma setup guide
- `docs/DATABASE_MIGRATIONS.md` - Database migration procedures and best practices
- `docs/ENV_MANAGEMENT.md` - Environment variable and secrets management guide
- `docs/ROLLBACK_PROCEDURES.md` - Deployment and database rollback procedures
- `docs/PLANNING_README.md` - Planning methodology
- `docs/QUICK_START_GUIDE.md` - Quick start guide
- `docs/SPRINT_TEMPLATE.md` - Sprint template

## Database Architecture

**Migration Tool**: Prisma (chosen over TypeORM for superior TypeScript support and GCP integration)

**Database Instances**:
- Development: `adria-db-dev` (db-f1-micro, 10GB, no backups)
- Staging: `adria-db-staging` (db-g1-small, 20GB, 7-day backups)
- Production: `adria-db-prod` (db-custom-2-8192, 50GB, 30-day backups, HA)

**Key Files**:
- `.env.example` - Environment variable template with database configuration
- `scripts/db-setup.sh` - Automated database provisioning script
- `docs/DATABASE_SETUP.md` - Comprehensive setup documentation

**Database Connection**:
- Local Development: Cloud SQL Proxy
- Cloud Run: Cloud SQL Connector via Unix socket
- Authentication: IAM-based (production) or password-based (dev/staging)

## Architecture

### Static Site Structure
- **Root Pages**: `index.html`, `about.html`, `services.html`, `contact.html`, `intake-form.html`, `more-information.html`
- **Blog**: `blog.html` redirects to `blog/index.html`, with individual blog posts under `blog/posts/`
- **Styling**: Single CSS file (`landing.css`) with minified version (`landing.min.css`)
- **Client Scripts**: Minimal JavaScript - `logger.js` for console output control

### Deployment Architecture
- **Container**: Nginx Alpine-based Docker image
- **Port Configuration**: Reads `PORT` environment variable at startup (default 8080)
- **Entrypoint**: `docker-entrypoint.sh` substitutes `${PORT}` into Nginx config from template
- **Target Platform**: Google Cloud Run compatible
- **CI/CD Pipeline**:
  - GitHub Actions for PR checks (testing, linting, type-checking, security scans)
  - Google Cloud Build for automated deployments
  - Staging deploys on merge to `develop` branch
  - Production deploys on merge to `main` branch with gradual rollout
- **Deployment Strategy**: Zero-downtime with health monitoring and automated rollback

### Nginx Configuration
- **Template**: `nginx.conf.template` with `${PORT}` placeholder
- **Static Asset Caching**: 1-year cache for images, CSS, JS, fonts
- **Gzip Compression**: Enabled for text assets
- **Security Headers**: Frame-options, Content-Type-Options, XSS-Protection
- **Error Handling**: 404 and 5xx error pages

### Manifest & PWA
- **Service Configuration**: `manifest.json` defines PWA metadata and app icons
- **Theme Colors**: Primary gold (#c19a5d), background (#fdfcfb)

## Commands

### CI/CD Operations

```bash
# Run migrations (used by Cloud Build)
./scripts/run-migrations.sh staging     # Run staging migrations
./scripts/run-migrations.sh production  # Run production migrations

# Deployment scripts
./scripts/backup-deployment.sh production  # Backup current deployment
./scripts/gradual-rollout.sh SERVICE_NAME REGION  # Gradual traffic rollout
./scripts/monitor-health.sh SERVICE_NAME REGION DURATION  # Monitor deployment

# Rollback procedures
./scripts/rollback.sh staging              # List staging revisions
./scripts/rollback.sh production           # List production revisions
./scripts/rollback.sh production REVISION  # Rollback to specific revision

# Smoke tests
./scripts/smoke-tests.sh staging      # Test staging environment
./scripts/smoke-tests.sh production   # Test production environment
```

### Database Operations

```bash
# Provision database instances (requires gcloud CLI and authentication)
./scripts/db-setup.sh dev       # Setup development database
./scripts/db-setup.sh staging   # Setup staging database
./scripts/db-setup.sh prod      # Setup production database
./scripts/db-setup.sh all       # Setup all environments

# Start Cloud SQL Proxy (local development)
cloud-sql-proxy your-project-id:us-central1:adria-db-dev --port 5432

# Prisma commands (will be used in packages/backend)
npx prisma init                 # Initialize Prisma
npx prisma migrate dev          # Create and apply migration (development)
npx prisma migrate deploy       # Apply migrations (production)
npx prisma generate             # Generate Prisma Client
npx prisma studio               # Open database GUI
npx prisma db pull              # Introspect existing database
```

### Docker Operations
```bash
# Build the Docker image
docker build -t adria-website .

# Run the container locally on port 8080
docker run -p 8080:8080 adria-website

# Run with custom port (e.g., 3000)
docker run -p 3000:3000 -e PORT=3000 adria-website
```

### Link Checking
```bash
# Validate all internal and external links
node link-checker.js
```

This script:
- Checks all `.html` files listed in the configuration
- Validates internal relative links exist
- Whitelists allowed external domains (Google Fonts, Instagram, docs.google.com, calendar.google.com)
- Warns about external domains not on the whitelist
- Verifies expected local resources and directories exist

## File Organization

```
root/
├── index.html              # Homepage (current static site)
├── about.html
├── services.html
├── contact.html
├── intake-form.html
├── more-information.html
├── blog.html              # Redirect to blog/index.html
├── blog/
│   ├── index.html
│   └── posts/
│       ├── how-to-build-a-capsule-wardrobe.html
│       ├── mixing-patterns-like-a-pro.html
│       └── seasonal-color-trends-2025.html
├── css/
│   ├── landing.css       # Main stylesheet
│   └── landing.min.css   # Minified version
├── js/
│   ├── logger.js         # Client-side logging utility
│   └── logger.min.js     # Minified version
├── images/               # Static images (empty directory in repo)
├── docs/                 # Documentation
│   ├── TRANSFORMATION_PLAN.md
│   ├── TRANSFORMATION_SUMMARY.md
│   ├── DATABASE_SETUP.md
│   ├── DATABASE_MIGRATIONS.md
│   ├── ENV_MANAGEMENT.md
│   ├── ROLLBACK_PROCEDURES.md
│   ├── PLANNING_README.md
│   ├── QUICK_START_GUIDE.md
│   └── SPRINT_TEMPLATE.md
├── scripts/              # Automation scripts
│   ├── db-setup.sh      # Database provisioning script
│   ├── run-migrations.sh  # Database migration runner
│   ├── backup-deployment.sh  # Deployment backup
│   ├── gradual-rollout.sh    # Traffic gradual rollout
│   ├── monitor-health.sh     # Health monitoring
│   ├── rollback.sh           # Deployment rollback
│   └── smoke-tests.sh        # Smoke testing
├── .github/
│   └── workflows/
│       └── pr-checks.yml     # GitHub Actions PR checks
├── cloudbuild-staging.yaml   # Cloud Build config for staging
├── cloudbuild-production.yaml # Cloud Build config for production
├── .env.example         # Environment variable template
├── Dockerfile           # Nginx Alpine container definition
├── docker-entrypoint.sh # Port substitution at startup
├── nginx.conf.template  # Nginx config with ${PORT} placeholder
├── manifest.json        # PWA manifest
├── link-checker.js      # Node.js script to validate links
└── CLAUDE.md           # This file - AI assistant guidance
```

### Future Structure (After Monorepo Setup)

```
root/
├── packages/
│   ├── backend/         # Express.js + Prisma backend
│   │   ├── src/
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── frontend/        # React/Next.js frontend
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── shared/          # Shared TypeScript types
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── docs/
├── scripts/
└── [root config files]
```

## Development Notes

### Adding New HTML Pages
1. Create `.html` file in root or appropriate subdirectory
2. Include proper meta tags (description, keywords, author, robots)
3. Include Open Graph and Twitter Card meta tags for social sharing
4. Link to `css/landing.css` for styling
5. Include optional `js/logger.js` for client logging
6. Run `link-checker.js` to validate all links before deploying
7. Update `link-checker.js` `filesToCheck` array if it's a new page to monitor

### Styling
- All styling uses a single `landing.css` file
- Uses CSS Grid/Flexbox for layout
- Color scheme: gold accents (#c19a5d), light backgrounds (#fdfcfb), dark text (#4a4a4a)
- Font: Montserrat from Google Fonts with weights 300, 400, 600, 700
- Media queries support responsive design

### External Integrations
- **Google Fonts**: Preconnected for performance
- **Google Calendar**: Embedded calendar widgets
- **Google Docs**: Embedded documents
- **Instagram**: Social media links
- All external domains must be whitelisted in `link-checker.js`

### Environment Variables
- `PORT`: Nginx listen port (default 8080, required for Cloud Run)

## Common Tasks

### Validate the Entire Site
```bash
node link-checker.js
```

### Build and Run Locally
```bash
docker build -t adria-website .
docker run -p 8080:8080 adria-website
# Visit http://localhost:8080
```

### Add New External Domain
1. Update `allowedExternalDomains` array in `link-checker.js`
2. Run link checker to verify no warnings
3. Test the link in browser before deploying

### Deploy to Google Cloud Run
The Dockerfile is optimized for Cloud Run. Set the `PORT` environment variable during deployment (Cloud Run sets this automatically).
