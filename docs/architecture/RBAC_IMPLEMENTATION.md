# Role-Based Access Control (RBAC) Implementation

## Overview

This document describes the comprehensive Role-Based Access Control (RBAC) system implemented for the Adria Cross application. The system provides hierarchical role-based permissions with ownership-based access control.

## Role Hierarchy

The system implements three roles with hierarchical permissions:

```
SUPER_ADMIN (Level 2) - Highest privilege
    ↓ can access all ADMIN resources
ADMIN (Level 1) - Administrative privileges
    ↓ can access all CLIENT resources
CLIENT (Level 0) - Basic user privileges
```

### Role Definitions

#### CLIENT
- **Description**: Basic authenticated user
- **Permissions**:
  - Access own profile
  - Update own profile information
  - Change own password
  - Book appointments (future implementation)
  - View own bookings (future implementation)

#### ADMIN
- **Description**: Administrative user with content and user management capabilities
- **Permissions**:
  - All CLIENT permissions
  - View all users in the system
  - View individual user details
  - Manage content (blog posts, services)
  - View analytics and reports

#### SUPER_ADMIN
- **Description**: Highest privilege level with full system access
- **Permissions**:
  - All ADMIN permissions
  - Change user roles
  - Delete users
  - Modify system configuration
  - Access all system resources

## Architecture

### File Structure

```
packages/
├── shared/
│   └── src/
│       └── types/
│           └── user.types.ts          # Shared user types and roles
└── backend/
    └── src/
        ├── middleware/
        │   ├── authMiddleware.ts      # Authentication middleware
        │   ├── roleGuard.ts           # RBAC middleware
        │   └── __tests__/
        │       └── roleGuard.test.ts  # RBAC tests
        ├── utils/
        │   ├── permissions.ts         # Permission utilities
        │   └── __tests__/
        │       └── permissions.test.ts # Permission tests
        ├── controllers/
        │   ├── adminController.ts     # Admin endpoints
        │   └── profileController.ts   # Profile endpoints
        └── routes/
            ├── admin.ts               # Admin routes
            └── profile.ts             # Profile routes
```

### Core Components

#### 1. User Types (`packages/shared/src/types/user.types.ts`)

Defines the user role enum and related types:

```typescript
export enum UserRole {
  CLIENT = 'client',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export interface User {
  id: string;
  email: string;
  password: string; // Hashed
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type UserWithoutPassword = Omit<User, 'password'>;

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}
```

#### 2. Permission Utilities (`packages/backend/src/utils/permissions.ts`)

Provides role hierarchy and permission checking functions:

- **`hasPermission(userRole, requiredRole)`**: Checks hierarchical role permissions
- **`canAccessResource(userRole, resourceOwnerId, currentUserId)`**: Checks ownership-based access
- **`canModifyUserRole(currentUserRole, targetUserRole, newRole)`**: Validates role modification requests
- **`getAccessibleRoles(userRole)`**: Returns all roles accessible by a user
- **`isAdmin(userRole)`**: Checks if user is an admin (ADMIN or SUPER_ADMIN)
- **`isSuperAdmin(userRole)`**: Checks if user is a super admin

#### 3. Role Guard Middleware (`packages/backend/src/middleware/roleGuard.ts`)

Provides middleware for protecting routes:

```typescript
// Main middleware factory
requireRole(...allowedRoles: UserRole[])

// Convenience middlewares
requireAdmin           // Allows ADMIN and SUPER_ADMIN
requireSuperAdmin      // Allows only SUPER_ADMIN
requireAuthenticated   // Allows any authenticated user
```

## API Endpoints

### Profile Endpoints (All Authenticated Users)

#### GET /api/v1/profile
Get the authenticated user's profile.

- **Auth**: Required (any role)
- **Response**: User profile without password

**Example**:
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/v1/profile
```

#### PUT /api/v1/profile
Update the authenticated user's profile.

- **Auth**: Required (any role)
- **Body**: `{ name?: string, email?: string }`
- **Response**: Updated user profile

**Example**:
```bash
curl -X PUT \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Doe"}' \
  http://localhost:3001/api/v1/profile
```

#### PUT /api/v1/profile/password
Change the authenticated user's password.

- **Auth**: Required (any role)
- **Body**: `{ currentPassword: string, newPassword: string }`
- **Response**: Success message

**Example**:
```bash
curl -X PUT \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword": "old", "newPassword": "new123456"}' \
  http://localhost:3001/api/v1/profile/password
```

### Admin Endpoints

#### GET /api/v1/admin/users
List all users in the system.

- **Auth**: Required (ADMIN or SUPER_ADMIN)
- **Response**: Paginated list of users

**Example**:
```bash
curl -H "Authorization: Bearer <admin-token>" \
  http://localhost:3001/api/v1/admin/users
```

#### GET /api/v1/admin/users/:id
Get a specific user by ID.

- **Auth**: Required (ADMIN or SUPER_ADMIN)
- **Response**: User details

**Example**:
```bash
curl -H "Authorization: Bearer <admin-token>" \
  http://localhost:3001/api/v1/admin/users/user-123
```

### Super Admin Endpoints

#### POST /api/v1/admin/users/:id/role
Change a user's role.

- **Auth**: Required (SUPER_ADMIN only)
- **Body**: `{ role: 'client' | 'admin' | 'super_admin' }`
- **Response**: Updated user

**Restrictions**:
- Cannot modify SUPER_ADMIN roles (must be done manually in database)
- Cannot promote users to a role higher than SUPER_ADMIN

**Example**:
```bash
curl -X POST \
  -H "Authorization: Bearer <super-admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}' \
  http://localhost:3001/api/v1/admin/users/user-123/role
```

#### DELETE /api/v1/admin/users/:id
Delete a user from the system.

- **Auth**: Required (SUPER_ADMIN only)
- **Response**: Success message

**Example**:
```bash
curl -X DELETE \
  -H "Authorization: Bearer <super-admin-token>" \
  http://localhost:3001/api/v1/admin/users/user-123
```

## Usage Examples

### Protecting Routes

#### Basic Role Protection
```typescript
import { requireRole } from '../middleware/roleGuard';
import { UserRole } from '@adria/shared';

// Only admins can access
router.get('/admin/dashboard',
  requireRole(UserRole.ADMIN),
  dashboardHandler
);

// Only super admins can access
router.post('/system/config',
  requireRole(UserRole.SUPER_ADMIN),
  configHandler
);

// Any authenticated user can access
router.get('/profile',
  requireRole(UserRole.CLIENT),
  profileHandler
);
```

#### Using Convenience Middlewares
```typescript
import {
  requireAdmin,
  requireSuperAdmin,
  requireAuthenticated
} from '../middleware/roleGuard';

// Admin or super admin only
router.get('/admin/users', requireAdmin, listUsersHandler);

// Super admin only
router.delete('/users/:id', requireSuperAdmin, deleteUserHandler);

// Any authenticated user
router.get('/profile', requireAuthenticated, getProfileHandler);
```

### Permission Checking in Controllers

```typescript
import { hasPermission, canAccessResource } from '../utils/permissions';

export async function getResource(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const resource = await fetchResource(id);

  // Check if user can access this resource
  if (!canAccessResource(req.user.role, resource.ownerId, req.user.id)) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Cannot access this resource'
    });
  }

  return res.json({ success: true, data: resource });
}
```

## Authentication in Production

All admin and profile routes are now protected with real JWT authentication using the `authenticateToken` middleware. The legacy `mockAuth` helper remains available for isolated unit tests but is **not** wired into any production routes.

## Security Considerations

### 1. Role Modification Protection
- Only SUPER_ADMIN can modify user roles
- SUPER_ADMIN roles cannot be modified through API (requires manual database update)
- Prevents privilege escalation attacks

### 2. Ownership-Based Access Control
- Users can always access their own resources
- Higher roles can access lower role resources
- Prevents unauthorized data access

### 3. Authorization Logging
- All authorization failures are logged with:
  - User ID
  - User role
  - Required roles
  - Endpoint accessed
- Enables security monitoring and audit trails

### 4. Hierarchical Permissions
- Higher roles inherit lower role permissions
- Prevents need for duplicate permission checks
- Simplifies permission management

## Testing

The RBAC system includes comprehensive test coverage:

### Permission Tests (`permissions.test.ts`)
- ✅ 19 tests covering all permission utilities
- Tests hierarchical role checking
- Tests ownership-based access control
- Tests role modification rules

### Role Guard Tests (`roleGuard.test.ts`)
- ✅ 13 tests covering middleware functionality
- Tests authentication requirements
- Tests hierarchical role access
- Tests authorization failures

Run tests:
```bash
# All RBAC tests
npm test -- --testPathPattern="(permissions|roleGuard).test"

# Permission utilities only
npm test -- --testPathPattern="permissions.test"

# Role guard middleware only
npm test -- --testPathPattern="roleGuard.test"
```

## Future Enhancements

### 1. Permission-Based Access Control (PBAC)
Extend RBAC with granular permissions:
```typescript
enum Permission {
  READ_USERS = 'users:read',
  WRITE_USERS = 'users:write',
  DELETE_USERS = 'users:delete',
  MANAGE_ROLES = 'roles:manage',
}
```

### 2. Resource-Specific Permissions
Add resource-level permissions:
```typescript
canAccessBooking(userId, bookingOwnerId, userRole)
canModifyBlogPost(userId, postAuthorId, userRole)
```

### 3. Audit Trail
Track all permission checks and role changes:
```typescript
interface AuditLog {
  userId: string;
  action: string;
  resource: string;
  timestamp: Date;
  result: 'allowed' | 'denied';
}
```

### 4. Role Assignment History
Track role changes over time:
```typescript
interface RoleHistory {
  userId: string;
  oldRole: UserRole;
  newRole: UserRole;
  changedBy: string;
  changedAt: Date;
}
```

## Migration Notes

When migrating existing routes to use the new RBAC system:

1. Replace `requireRole` from `authMiddleware` with `requireRole` from `roleGuard`
2. Update role string literals to use `UserRole` enum
3. Use convenience middlewares (`requireAdmin`, `requireSuperAdmin`) where appropriate
4. Add ownership checks in controllers using `canAccessResource`

**Before**:
```typescript
import { requireRole } from '../middleware/authMiddleware';
router.get('/admin/users', requireRole(['admin', 'super_admin']), handler);
```

**After**:
```typescript
import { requireAdmin } from '../middleware/roleGuard';
router.get('/admin/users', requireAdmin, handler);
```

## References

- User Types: `/packages/shared/src/types/user.types.ts`
- Permission Utils: `/packages/backend/src/utils/permissions.ts`
- Role Guard: `/packages/backend/src/middleware/roleGuard.ts`
- Admin Routes: `/packages/backend/src/routes/admin.ts`
- Profile Routes: `/packages/backend/src/routes/profile.ts`
- Tests: `/packages/backend/src/**/__tests__/*.test.ts`
