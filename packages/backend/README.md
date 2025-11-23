# Adria Cross Backend API

Express.js REST API backend for the Adria Cross professional styling services platform.

## Overview

This backend service provides RESTful API endpoints for user authentication, client management, styling services, appointments, and content management. Built with TypeScript, Express.js, and PostgreSQL (via Prisma ORM).

## Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt
- **Validation**: Zod schemas
- **Security**: Helmet, CORS, rate limiting
- **Logging**: Winston + Morgan
- **Documentation**: OpenAPI 3.0 / Swagger
- **Security**: JWT auth, bcrypt hashing, helmet, CORS, rate limiting

## Getting Started

### Prerequisites

- Node.js 18 or higher
- PostgreSQL database (local or Cloud SQL)
- npm or yarn package manager

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials and JWT secret
```

### Environment Variables

Create a `.env` file in the `packages/backend` directory with the following variables:

```env
# Server
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/adria_db

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d
BCRYPT_ROUNDS=10
LOG_LEVEL=info

# Contact & Email
EMAIL_ENABLED=true
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@adriacross.com
SENDGRID_ADMIN_EMAIL=admin@adriacross.com
SENDGRID_REPLY_TO=support@adriacross.com
RECAPTCHA_SECRET_KEY=your-recaptcha-secret
RECAPTCHA_MIN_SCORE=0.5
CONTACT_RATE_LIMIT_MAX=3
CONTACT_RATE_LIMIT_WINDOW_MS=3600000
ADMIN_DASHBOARD_URL=http://localhost:3000/admin/inquiries

# Logging
LOG_LEVEL=info
```

### Development

```bash
# Start development server with hot-reload
npm run dev

# Run in watch mode (auto-restart on file changes)
npm run dev
```

The server will start on `http://localhost:3001` (or the port specified in `.env`).

### Building

```bash
# Compile TypeScript to JavaScript
npm run build

# Start production server
npm run start
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Code Quality

```bash
# Lint code
npm run lint

# Type check
npm run typecheck
```

## API Documentation

### Interactive API Documentation

The backend provides comprehensive interactive API documentation using Swagger UI, accessible at:

**Local Development**: [http://localhost:3001/api/v1/docs](http://localhost:3001/api/v1/docs)

**Staging**: [https://staging-api.adriacross.com/api/v1/docs](https://staging-api.adriacross.com/api/v1/docs)

**Production**: [https://api.adriacross.com/api/v1/docs](https://api.adriacross.com/api/v1/docs)

### Features of API Documentation

- **Interactive Testing**: Try out API endpoints directly from the browser
- **Request/Response Schemas**: Detailed schema definitions for all endpoints
- **Authentication Support**: Built-in JWT token authentication testing
- **Example Requests**: Pre-populated example payloads
- **Error Documentation**: Complete error response documentation
- **OpenAPI 3.0 Specification**: Standards-compliant API specification

### Using the API Documentation

1. **Navigate to the Swagger UI**:
   - Open [http://localhost:3001/api/v1/docs](http://localhost:3001/api/v1/docs) in your browser

2. **Explore Available Endpoints**:
   - Endpoints are organized by tags (Health, Authentication, etc.)
   - Click on any endpoint to expand its details

3. **Test Endpoints**:
   - Click the "Try it out" button
   - Fill in required parameters
   - Click "Execute" to send the request
   - View the response below

4. **Authenticate Requests**:
   - First, register or login using `/auth/register` or `/auth/login`
   - Copy the JWT token from the response
   - Click the "Authorize" button at the top of the page
   - Enter `Bearer {your-token}` in the value field
   - Click "Authorize"
   - All subsequent requests will include the authentication token

### Example: Testing Authentication Flow

1. **Register a new user**:
   ```
   POST /api/v1/auth/register
   {
     "email": "test@example.com",
     "password": "SecurePassword123!",
     "role": "client"
   }
   ```

2. **Copy the JWT token** from the response

3. **Authorize**: Click "Authorize" and enter `Bearer {token}`

4. **Get user profile**:
   ```
   GET /api/v1/auth/me
   ```

## API Endpoints

### Health Check

- **GET** `/api/v1/health` - Check API status

### Authentication

- **POST** `/api/v1/auth/register` - Register new user
- **POST** `/api/v1/auth/login` - Login user
- **GET** `/api/v1/auth/me` - Get current user profile (requires authentication)
- **POST** `/api/v1/auth/refresh` - Refresh access token
- **POST** `/api/v1/auth/logout` - Revoke refresh token

### Profile (authenticated)

- **GET** `/api/v1/profile` - Get current user profile
- **PUT** `/api/v1/profile` - Update first name, last name, or email
- **PUT** `/api/v1/profile/password` - Change password

### Admin (admin/super_admin)

- **GET** `/api/v1/admin/users` - List users
- **GET** `/api/v1/admin/users/:id` - Get user by ID
- **POST** `/api/v1/admin/users/:id/role` - Change user role (super_admin only)
- **DELETE** `/api/v1/admin/users/:id` - Delete user (super_admin only)

### Services

- **GET** `/api/v1/services` - Public list of active services (paginated)
- **GET** `/api/v1/services/:id` and `/slug/:slug` - Public service detail
- **POST/PUT/DELETE** `/api/v1/services` - Admin-only CRUD for services

### Blog / Posts

- **GET** `/api/v1/posts` - Public list of published posts (paginated)
- **GET** `/api/v1/posts/:slug` - Public post detail by slug (published only)
- **GET** `/api/v1/posts/admin/list` - Admin list (all statuses, paginated)
- **POST/PUT/DELETE/PATCH status** `/api/v1/posts` - Admin-only CRUD + status changes

### Contact & Inquiries

- **POST** `/api/v1/contact/submit` - Public contact form with validation, per-IP rate limiting (3/hour), and reCAPTCHA v3 verification
- **GET** `/api/v1/admin/inquiries` - Admin list with filters (status, date range, service interest, search), pagination, and sorting
- **GET** `/api/v1/admin/inquiries/:id` - Admin inquiry detail
- **PUT** `/api/v1/admin/inquiries/:id/status` - Admin status update with guarded transitions (new → in_progress → responded → closed) and admin notes

## Project Structure

```
packages/backend/
├── src/
│   ├── config/
│   │   └── swagger.ts          # Swagger/OpenAPI configuration
│   ├── controllers/
│   │   └── authController.ts   # Authentication request handlers
│   ├── middleware/
│   │   ├── authMiddleware.ts   # JWT authentication middleware
│   │   ├── errorHandler.ts     # Global error handler
│   │   └── notFoundHandler.ts  # 404 handler
│   ├── routes/
│   │   ├── auth.ts             # Auth routes with Swagger docs
│   │   └── health.ts           # Health check routes
│   ├── services/
│   │   └── authService.ts      # Authentication business logic
│   └── index.ts                # Application entry point
├── tests/
│   └── setup.ts                # Test configuration
├── .env.example                # Environment variable template
├── package.json
├── tsconfig.json
└── README.md                   # This file
```

## Adding New API Endpoints

When adding new endpoints, follow these steps to maintain comprehensive documentation:

### 1. Create the Route File

Create a new route file in `src/routes/`:

```typescript
import { Router } from 'express';

const router = Router();

/**
 * @swagger
 * /your-endpoint:
 *   get:
 *     summary: Brief description
 *     description: Detailed description of what this endpoint does
 *     tags: [YourTag]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource ID
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/YourSchema'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/your-endpoint', yourHandler);

export default router;
```

### 2. Add Schema Definitions

Add your schemas to `src/config/swagger.ts` under `components.schemas`:

```typescript
YourSchema: {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    // ... more properties
  },
  required: ['id', 'name'],
}
```

### 3. Register the Route

Add the route to `src/index.ts`:

```typescript
import yourRoutes from './routes/your-routes';
app.use('/api/v1/your-resource', yourRoutes);
```

### 4. Test the Documentation

1. Start the dev server: `npm run dev`
2. Open [http://localhost:3001/api/v1/docs](http://localhost:3001/api/v1/docs)
3. Verify your new endpoint appears with complete documentation
4. Test the endpoint using the "Try it out" feature

## Security

- **Helmet**: Sets security-related HTTP headers
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Prevents abuse and DDoS attacks
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Zod schema validation
- **Environment Variables**: Sensitive data in .env files (never committed)

## Error Handling

The API uses consistent error response formats:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "ERROR_CODE",
  "details": {}
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Database

The backend uses Prisma ORM with PostgreSQL. See the main project documentation for database setup instructions.

### Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create migration (development)
npx prisma migrate dev --name your_migration_name

# Apply migrations (production)
npx prisma migrate deploy

# Open Prisma Studio (database GUI)
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## Deployment

The backend is containerized with Docker and deployed to Google Cloud Run.

### Docker

```bash
# Build image
docker build -t adria-backend .

# Run container
docker run -p 3001:3001 --env-file .env adria-backend
```

### Google Cloud Run

Deployment is automated via Cloud Build when changes are pushed to `develop` (staging) or `main` (production) branches. See the root project documentation for CI/CD details.

## Contributing

1. Create a feature branch from `develop`
2. Make your changes
3. Add tests for new functionality
4. Update Swagger documentation for API changes
5. Run linting and type checking: `npm run lint && npm run typecheck`
6. Run tests: `npm test`
7. Create a pull request

## Support

For questions or issues, contact the development team or refer to the main project documentation at `/docs/`.

## License

Proprietary - Adria Cross
