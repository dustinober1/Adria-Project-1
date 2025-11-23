# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Adria Cross is a professional personal stylist website currently in transformation from a static HTML/CSS/JavaScript site to a full-stack TypeScript application with PostgreSQL database backend. The site is designed to be responsive, SEO-friendly, and deployable to Google Cloud Run. When you are done with each iteration, git commit and git push the changes. Also update this CLAUDE.md and Agents.md file as needed to reflect any new instructions or architecture changes or project status changes.

## Project Status

**Current Phase**: Sprint 7 - COMPLETED ✅ (March 2, 2026)
**Recent Velocity**: Sprint 6 - 22 pts; Sprint 7 - 22 pts (steady)

**Completed User Stories**:
- ✅ US-1.1: Monorepo structure setup (5 points)
- ✅ US-1.2: CI/CD pipeline configuration (8 points) - GitHub Actions, Cloud Build, deployment automation
- ✅ US-1.3: PostgreSQL database setup documentation and migration strategy (5 points) - Prisma selected
- ✅ US-2.1: REST API framework setup with middleware, rate limiting, logging, and Swagger docs
- ✅ US-2.2: User authentication system with JWT, bcrypt, refresh tokens, and Prisma persistence
- ✅ US-2.3: Role-based access control (client, admin, super_admin) with admin/profile endpoints
- ✅ US-3.1: Services model + public list/detail + admin CRUD with validation/pagination
- ✅ US-3.2: Blog/content model + published-only public feeds + admin CRUD/status management
- ✅ US-3.3: Shared pagination helpers, validation, seeds, and full integration test coverage for services/posts
- ✅ US-4.1: Contact form submission with validation, rate limiting, reCAPTCHA, and notifications
- ✅ US-4.2: Admin inquiry management endpoints (list/detail/status with filters and RBAC)
- ✅ US-4.3: Email templates/transport wiring (SendGrid) with feature flag
- ✅ US-5.1: Intake form builder (FormTemplate CRUD, field schema validation, versioning/guards)
- ✅ US-5.2: Intake submission endpoint + notifications/admin linkage (public + admin flows)
- ✅ US-6.1: Email service abstraction for reliability/observability
- ✅ US-6.2: Branded email templates across flows
- ✅ US-6.3: Admin notification coverage + routing rules
- ✅ US-6.4: Email flags/secrets/operability docs
- ✅ US-7.1: Availability model + calendar wiring
- ✅ US-7.2: Booking request/confirm APIs + double-booking guard
- ✅ US-7.3: Booking UIs (client + admin) with filters/actions
- ✅ US-7.4: Notifications/reminders with ICS + status transitions

**Sprint 6 Deliverables**:
- Email adapter with retry/backoff, circuit breaker, sandbox/log-only flag, and structured metrics/logging; per-template overrides and typed results.
- Branded HTML/text templates with shared partials and previews (dev route + CLI); variables validation + snapshot coverage.
- Admin notification routing (to/cc/bcc/digest) with feature flags; submission tagging; updated env templates, Swagger, and ops runbooks (SPF/DKIM/secrets).
- Jest unit/integration coverage for adapter/templates/routing; staging verification with sandbox/live toggles.

**Sprint 7 Deliverables**:
- Prisma migration for `Availability`/`Booking` with overlap guard and seeds; transactional double-booking protection.
- Booking APIs (public request + admin approve/decline/reschedule/cancel) with validation, rate limiting, recaptcha, ICS download links, and calendar sync flag.
- Calendar service abstraction + ICS helper; Google Calendar sync mocked in dev/test and gated by `CALENDAR_SYNC_ENABLED`.
- Frontend booking request form (RHF+Zod) and admin bookings dashboard (filters/actions/status pills); notifications/reminders with ICS; tests across layers and staging smoke.

**Next Sprint**: Sprint 8 - Calendar Integration Foundation (Weeks 15-16)  
**Following**: Sprint 9 - API Testing & Documentation (Weeks 17-18)
**Next Steps**:
- US-8.1: Google Calendar API integration (auth/refresh + read/write client)
- US-8.2: Public availability endpoint with busy-time exclusion, buffers, caching
- US-8.3: Admin availability rule CRUD (recurring/overrides, service durations)
- US-9.1: API test expansion toward 80%+ coverage and CI runtime targets

## Recent Updates (Sprints 6-7 completion)
- Email adapter hardened with retry/backoff/circuit breaker, sandbox/log-only flag, structured metrics/logs, and branded templates/partials plus preview surfaces.
- Admin notification routing (to/cc/bcc/digest) added with feature flags; env templates, Swagger, and ops runbooks updated; staging verification completed.
- Booking migration/models/seeds delivered with overlap guard; booking APIs (public + admin) include recaptcha, rate limits, status machine, ICS download links, and calendar sync flag.
- Calendar service abstraction + ICS helper shipped with Google Calendar mock in dev/test; notifications/reminders wired for request/approval/reschedule/cancel.
- Frontend booking form (RHF + Zod) and admin bookings dashboard (filters/status actions) live; test suites cover adapter/templates/routing, booking flows, ICS, and calendar mock paths.

## Documentation

All documentation and planning docs are in the `/docs` folder:
- `docs/overview/TRANSFORMATION_SUMMARY.md` - Executive summary with budget and metrics
- `docs/overview/QUICK_START_GUIDE.md` - Quick start guide for new team members
- `docs/roadmap/TRANSFORMATION_PLAN.md` - Complete transformation roadmap (52 sprints, 156 user stories)
- `docs/roadmap/PLANNING_README.md` - Planning methodology
- `docs/roadmap/SPRINT_TEMPLATE.md` - Sprint tracking template
- `docs/operations/ENV_MANAGEMENT.md` - Environment variable and secrets management guide
- `docs/operations/DATABASE_SETUP.md` - PostgreSQL and Prisma setup guide
- `docs/operations/DATABASE_MIGRATIONS.md` - Database migration procedures and best practices
- `docs/operations/ROLLBACK_PROCEDURES.md` - Deployment and database rollback procedures
- `docs/operations/CICD_SETUP_SUMMARY.md` - CI/CD pipeline documentation
- `docs/architecture/API_DOCUMENTATION_SETUP.md` - API documentation setup
- `docs/architecture/RBAC_IMPLEMENTATION.md` - RBAC implementation notes
- `docs/sprints/` - Sprint logs (01-07 completed)

## Database Architecture

**Migration Tool**: Prisma (chosen over TypeORM for superior TypeScript support and GCP integration)

**Database Instances**:
- Development: `adria-db-dev` (db-f1-micro, 10GB, no backups)
- Staging: `adria-db-staging` (db-g1-small, 20GB, 7-day backups)
- Production: `adria-db-prod` (db-custom-2-8192, 50GB, 30-day backups, HA)

**Key Files**:
- `.env.example` - Environment variable template with database configuration
- `scripts/db-setup.sh` - Automated database provisioning script
- `docs/operations/DATABASE_SETUP.md` - Comprehensive setup documentation

**Database Connection**:
- Local Development: Cloud SQL Proxy
- Cloud Run: Cloud SQL Connector via Unix socket
- Authentication: IAM-based (production) or password-based (dev/staging)

## Architecture

### Monorepo Structure (Current)

The project is now organized as a monorepo with npm workspaces:

- **packages/backend**: Express.js REST API with TypeScript
- **packages/frontend**: Next.js 14+ application with App Router
- **packages/shared**: Shared TypeScript types, constants, and utilities
- **legacy-static-site**: Original static HTML site (preserved for reference)

### Technology Stack

#### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt
- **Validation**: Zod schemas
- **Security**: Helmet, CORS, rate limiting
- **Logging**: Winston + Morgan

#### Frontend
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **UI**: Tailwind CSS
- **State Management**: React Query + Context API
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios

#### Development Environment
- **Local Setup**: Docker Compose with postgres, backend, frontend services
- **Database**: PostgreSQL 15
- **Code Quality**: ESLint + Prettier with unified configuration
- **Type Checking**: TypeScript strict mode

### Deployment Architecture
- **Container**: Docker images for backend and frontend
- **Target Platform**: Google Cloud Run
- **Database**: Google Cloud SQL (PostgreSQL)
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

### Monorepo Development

```bash
# Install all dependencies
npm install

# Start all services with Docker Compose
npm run docker:up

# View logs from all services
npm run docker:logs

# Stop all services
npm run docker:down

# Run linting across all packages
npm run lint

# Format all code
npm run format

# Type check all packages
npm run typecheck

# Build all packages
npm run build

# Run tests in all packages
npm run test
```

### Package-Specific Commands

```bash
# Backend
cd packages/backend
npm run dev          # Start development server
npm run build        # Build TypeScript
npm run test         # Run tests
npm run lint         # Lint code

# Frontend
cd packages/frontend
npm run dev          # Start Next.js dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Lint code

# Shared
cd packages/shared
npm run build        # Build shared package
npm run dev          # Watch mode for development
```

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
│   ├── overview/
│   │   ├── TRANSFORMATION_SUMMARY.md
│   │   └── QUICK_START_GUIDE.md
│   ├── roadmap/
│   │   ├── TRANSFORMATION_PLAN.md
│   │   ├── PLANNING_README.md
│   │   └── SPRINT_TEMPLATE.md
│   ├── operations/
│   │   ├── ENV_MANAGEMENT.md
│   │   ├── DATABASE_SETUP.md
│   │   ├── DATABASE_MIGRATIONS.md
│   │   ├── ROLLBACK_PROCEDURES.md
│   │   └── CICD_SETUP_SUMMARY.md
│   ├── architecture/
│   │   ├── API_DOCUMENTATION_SETUP.md
│   │   └── RBAC_IMPLEMENTATION.md
│   └── sprints/
│       ├── sprint-01.md
│       ├── sprint-02.md
│       └── ...
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

## Monorepo Development Guide

### Getting Started with the Monorepo

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp packages/backend/.env.example packages/backend/.env
   cp packages/frontend/.env.example packages/frontend/.env
   ```

3. **Start development environment**:
   ```bash
   npm run docker:up
   ```

4. **Access applications**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Health Check: http://localhost:3001/api/v1/health

### Package Structure

#### Backend Package (`packages/backend`)
- Express.js REST API with TypeScript
- Health check endpoint at `/api/v1/health`
- Middleware: error handling, CORS, helmet, rate limiting
- Environment variables managed via `.env` file
- Hot-reloading with `tsx watch` in development

#### Frontend Package (`packages/frontend`)
- Next.js 14+ with App Router
- Tailwind CSS for styling
- TypeScript strict mode
- Responsive design with mobile-first approach
- Environment variables prefixed with `NEXT_PUBLIC_`

#### Shared Package (`packages/shared`)
- Common TypeScript types and interfaces
- Shared constants (API routes, pagination, rate limits, etc.)
- Utility functions (slugify, formatCurrency, validation, etc.)
- No runtime dependencies except Zod for schema validation

### Code Quality Tools

All packages share unified ESLint and Prettier configurations:

- **ESLint**: TypeScript-aware linting with import ordering
- **Prettier**: Consistent code formatting
- **TypeScript**: Strict mode with comprehensive type checking

Run from root:
```bash
npm run lint      # Lint all packages
npm run format    # Format all code
npm run typecheck # Type check all packages
```

### Adding New Features

1. **API Endpoints** (Backend):
   - Create route file in `packages/backend/src/routes/`
   - Add controller in `packages/backend/src/controllers/`
   - Register route in `packages/backend/src/index.ts`

2. **Pages** (Frontend):
   - Create page in `packages/frontend/src/app/`
   - Add components in `packages/frontend/src/components/`

3. **Shared Types**:
   - Add interfaces to `packages/shared/src/types/`
   - Export from `packages/shared/src/index.ts`

### Legacy Static Site

The original static HTML site is preserved in `legacy-static-site/` for:
- Reference during development
- Content migration to CMS
- Rollback capability if needed
- Historical record

Do not modify files in this directory.
