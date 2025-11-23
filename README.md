# Adria Cross - Professional Personal Stylist Platform

A modern, full-stack web application for professional personal styling services, built with a monorepo architecture.

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Development](#development)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Contributing](#contributing)

## Project Overview

Adria Cross is transforming from a static HTML site to a dynamic, full-stack application with:

- Modern Next.js frontend with React 18+
- Express.js REST API backend
- PostgreSQL database with Prisma ORM
- Monorepo structure for better code organization
- Docker-based development environment
- Google Cloud Run deployment ready

## Architecture

### Monorepo Structure

```
adria-cross-monorepo/
├── packages/
│   ├── backend/          # Express.js API server
│   ├── frontend/         # Next.js application
│   └── shared/           # Shared types, utilities, constants
├── legacy-static-site/   # Original static HTML site (preserved)
├── docs/                 # Project documentation
├── docker-compose.yml    # Local development environment
└── package.json          # Root workspace configuration
```

### Technology Stack

#### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT with bcrypt
- **Validation:** Zod
- **Logging:** Winston + Morgan

#### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** React Query + Context API
- **Forms:** React Hook Form + Zod
- **HTTP Client:** Axios

#### Shared
- **Types:** TypeScript interfaces and types
- **Constants:** Shared configuration values
- **Utilities:** Common helper functions

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js:** v18.0.0 or higher ([Download](https://nodejs.org/))
- **npm:** v9.0.0 or higher (comes with Node.js)
- **Docker:** Latest version ([Download](https://www.docker.com/get-started))
- **Docker Compose:** v2.0 or higher (included with Docker Desktop)
- **Git:** Latest version

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Adria-Project-1
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
npm install
```

### 3. Set Up Environment Variables

Create `.env` files in each package from the examples:

```bash
# Backend
cp packages/backend/.env.example packages/backend/.env

# Frontend
cp packages/frontend/.env.example packages/frontend/.env
```

Edit the `.env` files with your configuration.

### 4. Start Development Environment

Using Docker Compose (Recommended):

```bash
# Start all services (postgres, backend, frontend)
npm run docker:up

# View logs
npm run docker:logs

# Stop all services
npm run docker:down
```

Or run services individually:

```bash
# Terminal 1: Start database
docker-compose up postgres

# Terminal 2: Start backend
cd packages/backend
npm run dev

# Terminal 3: Start frontend
cd packages/frontend
npm run dev
```

### 5. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Health Check:** http://localhost:3001/api/v1/health
- **PostgreSQL:** localhost:5432

## Development

### Code Quality

The project uses ESLint and Prettier for code quality and formatting:

```bash
# Lint all packages
npm run lint

# Format all files
npm run format

# Check formatting without changes
npm run format:check

# Type checking
npm run typecheck
```

### Building

```bash
# Build all packages
npm run build

# Build individual package
cd packages/backend
npm run build
```

### Testing

```bash
# Run tests for all packages
npm run test

# Run tests in watch mode
cd packages/backend
npm run test:watch
```

## Project Structure

### Backend (`packages/backend`)

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Express middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── index.ts         # Entry point
├── .env.example         # Environment variables template
├── Dockerfile           # Docker configuration
├── package.json
└── tsconfig.json
```

### Frontend (`packages/frontend`)

```
frontend/
├── src/
│   ├── app/             # Next.js App Router pages
│   ├── components/      # React components
│   ├── lib/             # Libraries and configurations
│   ├── styles/          # Global styles
│   └── types/           # TypeScript types
├── public/              # Static assets
├── .env.example
├── next.config.js
├── tailwind.config.ts
└── package.json
```

### Shared (`packages/shared`)

```
shared/
├── src/
│   ├── types/           # Shared TypeScript types
│   ├── constants/       # Shared constants
│   └── utils/           # Shared utilities
└── package.json
```

## Available Scripts

### Root Level

- `npm run dev` - Start all packages in development mode
- `npm run build` - Build all packages
- `npm run test` - Run tests in all packages
- `npm run lint` - Lint all packages
- `npm run format` - Format all files with Prettier
- `npm run typecheck` - Type check all packages
- `npm run docker:up` - Start Docker Compose services
- `npm run docker:down` - Stop Docker Compose services
- `npm run docker:logs` - View Docker logs

### Package-Specific Scripts

Each package has its own scripts. Navigate to the package directory and run:

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Lint code

## Environment Variables

### Backend (`packages/backend/.env`)

```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/adria_dev
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
```

### Frontend (`packages/frontend/.env`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NODE_ENV=development
```

See `.env.example` files in each package for complete list of variables.

## Deployment

### Google Cloud Run

The application is designed for Google Cloud Run deployment:

1. **Build production images:**
   ```bash
   docker build -t gcr.io/PROJECT_ID/adria-backend ./packages/backend
   docker build -t gcr.io/PROJECT_ID/adria-frontend ./packages/frontend
   ```

2. **Push to Google Container Registry:**
   ```bash
   docker push gcr.io/PROJECT_ID/adria-backend
   docker push gcr.io/PROJECT_ID/adria-frontend
   ```

3. **Deploy to Cloud Run:**
   ```bash
   gcloud run deploy adria-backend --image gcr.io/PROJECT_ID/adria-backend
   gcloud run deploy adria-frontend --image gcr.io/PROJECT_ID/adria-frontend
   ```

See `docs/operations/CICD_SETUP_SUMMARY.md` for deployment pipeline steps and `docs/operations/ROLLBACK_PROCEDURES.md` for rollback guidance.

## Database

### Migrations

```bash
cd packages/backend

# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

### Seed Data

```bash
cd packages/backend
npm run seed
```

## Contributing

### Branch Strategy

- `main` - Production branch
- `develop` - Development branch
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches

### Development Workflow

1. Create a feature branch from `develop`
2. Make your changes
3. Run tests and linting
4. Submit a pull request to `develop`

### Code Style

- Follow TypeScript best practices
- Use ESLint and Prettier configurations
- Write meaningful commit messages
- Add tests for new features

## Documentation

- [Documentation Index](docs/README.md) - Overview of the curated documentation subdirectories
- [Transformation Plan](docs/roadmap/TRANSFORMATION_PLAN.md) - Complete 2-year roadmap
- [Sprint Guide](docs/roadmap/PLANNING_README.md) - Sprint planning documentation
- [Quick Start](docs/overview/QUICK_START_GUIDE.md) - Quick reference guide
- [Legacy Site](legacy-static-site/README.md) - Original static site

## Support

For questions or issues:
- Check existing documentation in the `docs/` folder
- Review the transformation plan
- Create an issue in the repository

## License

UNLICENSED - Private project for Adria Cross

---

**Current Status:** Sprint 7 - Booking & Calendar Sync Completed

Built with by Adria Cross Team
