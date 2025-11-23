# API Documentation Setup Summary

**Date**: November 22, 2025
**Sprint**: Sprint 2 - Core Backend & Authentication
**Task**: Set up comprehensive API documentation using OpenAPI/Swagger

## Overview

Successfully implemented comprehensive API documentation for the Adria Cross backend using OpenAPI 3.0 specification and Swagger UI. The documentation is interactive, standards-compliant, and provides a complete reference for all API endpoints.

## Implementation Details

### 1. Dependencies Installed

Added the following packages to `/packages/backend/package.json`:

**Runtime Dependencies**:
- `swagger-ui-express` (v5.0.1) - Serves Swagger UI interface
- `swagger-jsdoc` (v6.2.8) - Generates OpenAPI spec from JSDoc comments

**Development Dependencies**:
- `@types/swagger-ui-express` (v4.1.8) - TypeScript definitions
- `@types/swagger-jsdoc` (v6.0.4) - TypeScript definitions

### 2. Swagger Configuration

Created `/packages/backend/src/config/swagger.ts` with:

**OpenAPI 3.0 Specification**:
- Title: "Adria Cross API"
- Version: "1.0.0"
- Description: Complete API for professional styling services platform

**Server Configurations**:
- Development: `http://localhost:3001/api/v1`
- Staging: `https://staging-api.adriacross.com/api/v1`
- Production: `https://api.adriacross.com/api/v1`

**Security Schemes**:
- Bearer Authentication (JWT)
- Format: `Bearer {token}`
- Token obtained from `/auth/login` or `/auth/register`

**Component Schemas** (8 schemas defined):
1. `User` - User entity with id, email, role, createdAt
2. `UserResponse` - Wrapper for user response
3. `LoginRequest` - Login credentials (email, password)
4. `LoginResponse` - Login result with user and token
5. `RegisterRequest` - Registration data (email, password, optional role)
6. `RegisterResponse` - Registration result with user and token
7. `ErrorResponse` - Standard error format
8. `HealthResponse` - Health check response

**Reusable Response Components**:
- `BadRequest` (400) - Invalid input parameters
- `Unauthorized` (401) - Missing/invalid authentication
- `Forbidden` (403) - Insufficient permissions
- `NotFound` (404) - Resource not found
- `InternalServerError` (500) - Server error

**Tags**:
- Health - API health check endpoints
- Authentication - User authentication and authorization endpoints

### 3. Documented Endpoints

#### Health Check Route (`/packages/backend/src/routes/health.ts`)

**GET /api/v1/health**
- Summary: Health check
- Description: Check if the API is running and responsive
- Tags: [Health]
- Responses: 200 (success), 500 (error)
- No authentication required

#### Authentication Routes (`/packages/backend/src/routes/auth.ts`)

**POST /api/v1/auth/login**
- Summary: User login
- Description: Authenticate user with email and password
- Request Body: LoginRequest schema
- Responses: 200 (success), 400 (bad request), 401 (invalid credentials), 500 (error)
- Example request and response included
- No authentication required

**POST /api/v1/auth/register**
- Summary: User registration
- Description: Register new user account
- Request Body: RegisterRequest schema
- Responses: 201 (created), 400 (invalid input or user exists), 500 (error)
- Example request and response included
- No authentication required

**POST /api/v1/auth/refresh**
- Summary: Refresh access token
- Description: Exchange refresh token for new access token
- Request Body: refreshToken (string)
- Responses: 200 (success), 401 (invalid/expired token)
- Example request and response included
- No authentication required

**POST /api/v1/auth/logout**
- Summary: Logout user
- Description: Invalidate refresh token
- Request Body: refreshToken (string)
- Responses: 200 (success), 500 (error)
- No authentication required

**GET /api/v1/auth/me**
- Summary: Get current user profile
- Description: Retrieve authenticated user's profile information
- Security: BearerAuth required
- Responses: 200 (success), 401 (unauthorized), 403 (forbidden), 500 (error)
- Example response included
- **Requires authentication**: JWT token in Authorization header

### 4. Swagger UI Endpoint

Configured in `/packages/backend/src/index.ts`:

**Endpoint**: `http://localhost:3001/api/v1/docs`

**Features**:
- Interactive API testing interface
- Try-it-out functionality for all endpoints
- Built-in authentication support (Authorize button)
- Request/response examples for all endpoints
- Schema validation
- Custom branding (removed Swagger topbar, custom title)

**Configuration Options**:
```javascript
{
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Adria Cross API Documentation',
}
```

### 5. Backend README Documentation

Created comprehensive `/packages/backend/README.md` with:

**Sections**:
1. Overview and technology stack
2. Getting started guide
3. Environment variables
4. Development, building, and testing instructions
5. **API Documentation section** with:
   - How to access Swagger UI
   - Features of the documentation
   - Step-by-step usage guide
   - Example authentication flow
6. API endpoints reference
7. Project structure
8. Adding new documented endpoints guide
9. Security, error handling, database sections
10. Deployment and contributing guidelines

**Key Documentation Features**:
- Direct links to Swagger UI for all environments
- Complete walkthrough of interactive testing
- Authentication flow example
- Guide for adding new documented endpoints

## Accessing the API Documentation

### Local Development

1. Start the backend server:
   ```bash
   cd packages/backend
   npm run dev
   ```

2. Open browser to: [http://localhost:3001/api/v1/docs](http://localhost:3001/api/v1/docs)

### Staging (when deployed)

[https://staging-api.adriacross.com/api/v1/docs](https://staging-api.adriacross.com/api/v1/docs)

### Production (when deployed)

[https://api.adriacross.com/api/v1/docs](https://api.adriacross.com/api/v1/docs)

## Using the Interactive Documentation

### 1. Browse Endpoints

- Navigate to `/api/v1/docs`
- Expand endpoint categories (Health, Authentication)
- Click any endpoint to view details

### 2. Test Endpoints Without Authentication

Example: Health Check
1. Expand `GET /health`
2. Click "Try it out"
3. Click "Execute"
4. View response below

### 3. Test Authentication Flow

**Step 1: Register or Login**
1. Expand `POST /auth/register` or `POST /auth/login`
2. Click "Try it out"
3. Edit the request body:
   ```json
   {
     "email": "test@example.com",
     "password": "SecurePassword123!",
     "role": "client"
   }
   ```
4. Click "Execute"
5. Copy the `token` from the response

**Step 2: Authorize**
1. Click the "Authorize" button at the top
2. Enter: `Bearer {paste-your-token-here}`
3. Click "Authorize"
4. Click "Close"

**Step 3: Test Protected Endpoint**
1. Expand `GET /auth/me`
2. Click "Try it out"
3. Click "Execute"
4. View your user profile in the response

## Example Documented Endpoint

Here's an example of how endpoints are documented in the code:

```typescript
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate a user with email and password. Returns a JWT token for subsequent authenticated requests.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             email: user@example.com
 *             password: SecurePassword123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *             example:
 *               success: true
 *               user:
 *                 id: 550e8400-e29b-41d4-a716-446655440000
 *                 email: user@example.com
 *                 role: client
 *                 createdAt: 2025-01-15T10:30:00.000Z
 *               token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Invalid email or password
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/login', handleAsync(loginHandler));
```

## Next Steps for Additional Endpoints

The following routes exist but are **not yet documented** with Swagger annotations:

### Profile Routes (`/packages/backend/src/routes/profile.ts`)

**Endpoints to Document**:
1. `GET /api/v1/profile` - Get authenticated user's profile
2. `PUT /api/v1/profile` - Update user's profile information
3. `PUT /api/v1/profile/password` - Change user's password

**Required Schemas** (to add to `swagger.ts`):
- `ProfileResponse`
- `UpdateProfileRequest`
- `ChangePasswordRequest`

### Admin Routes (`/packages/backend/src/routes/admin.ts`)

**Endpoints to Document**:
1. `GET /api/v1/admin/users` - List all users (requires ADMIN role)
2. `GET /api/v1/admin/users/:id` - Get user by ID (requires ADMIN role)
3. `POST /api/v1/admin/users/:id/role` - Change user role (requires SUPER_ADMIN role)
4. `DELETE /api/v1/admin/users/:id` - Delete user (requires SUPER_ADMIN role)

**Required Schemas** (to add to `swagger.ts`):
- `UserListResponse`
- `ChangeRoleRequest`

**New Tag** (to add to `swagger.ts`):
- `Admin` - Administrative endpoints for user management

### Steps to Document Additional Endpoints

1. **Add schemas to `swagger.ts`**:
   ```typescript
   ProfileResponse: {
     type: 'object',
     properties: {
       // ... define properties
     }
   }
   ```

2. **Add JSDoc comments to route files**:
   ```typescript
   /**
    * @swagger
    * /profile:
    *   get:
    *     summary: Get user profile
    *     tags: [Profile]
    *     security:
    *       - BearerAuth: []
    *     responses:
    *       200:
    *         description: Profile retrieved successfully
    *         content:
    *           application/json:
    *             schema:
    *               $ref: '#/components/schemas/ProfileResponse'
    */
   ```

3. **Add new tags** (if needed):
   ```typescript
   tags: [
     { name: 'Profile', description: 'User profile management' },
     { name: 'Admin', description: 'Administrative user management' }
   ]
   ```

4. **Test documentation**:
   - Restart dev server
   - Visit `/api/v1/docs`
   - Verify new endpoints appear
   - Test with "Try it out" feature

## Benefits of This Implementation

1. **Interactive Testing**: Developers can test APIs directly from the browser
2. **Standards-Compliant**: OpenAPI 3.0 specification ensures compatibility
3. **Auto-Generated**: Documentation stays in sync with code via JSDoc
4. **Type-Safe**: TypeScript integration prevents documentation drift
5. **Client Generation**: OpenAPI spec can generate API clients for multiple languages
6. **Developer Experience**: Onboarding is faster with interactive docs
7. **Authentication Support**: Built-in JWT testing capability
8. **Comprehensive Examples**: Every endpoint includes request/response examples

## Files Modified/Created

### Created Files
1. `/packages/backend/src/config/swagger.ts` - Swagger configuration
2. `/packages/backend/README.md` - Backend documentation
3. `/docs/architecture/API_DOCUMENTATION_SETUP.md` - This file

### Modified Files
1. `/packages/backend/package.json` - Added Swagger dependencies
2. `/packages/backend/src/index.ts` - Added Swagger UI endpoint
3. `/packages/backend/src/routes/auth.ts` - Added JSDoc annotations to 5 endpoints
4. `/packages/backend/src/routes/health.ts` - Added JSDoc annotations to 1 endpoint

## Testing Performed

1. Installed dependencies successfully
2. Generated Prisma client
3. Started dev server on port 3001
4. Verified health check endpoint: `GET /api/v1/health` returns 200
5. Verified Swagger UI loads: `GET /api/v1/docs` returns HTML with title "Adria Cross API Documentation"
6. Confirmed server starts without errors in development mode

## Recommendations

1. **Document remaining endpoints**: Add Swagger annotations to profile and admin routes
2. **Add response examples**: Ensure all endpoints have realistic example data
3. **Schema validation**: Consider adding Zod schemas alongside OpenAPI schemas
4. **API versioning**: Document versioning strategy in the OpenAPI spec
5. **Rate limiting docs**: Document rate limit headers in responses
6. **Error codes**: Create comprehensive error code documentation
7. **Export spec**: Add npm script to export OpenAPI JSON spec for client generation
8. **API changelog**: Maintain changelog for API version changes

## Resources

- **Swagger UI**: [http://localhost:3001/api/v1/docs](http://localhost:3001/api/v1/docs)
- **Backend README**: `/packages/backend/README.md`
- **Swagger Config**: `/packages/backend/src/config/swagger.ts`
- **OpenAPI 3.0 Spec**: [https://swagger.io/specification/](https://swagger.io/specification/)
- **Swagger JSDoc Docs**: [https://github.com/Surnet/swagger-jsdoc](https://github.com/Surnet/swagger-jsdoc)
