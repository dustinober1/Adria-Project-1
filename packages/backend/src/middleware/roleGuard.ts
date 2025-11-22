import { UserRole } from '@adria/shared';
import { NextFunction, Response } from 'express';

import { hasPermission } from '../utils/permissions';
import { logger } from '../lib/logger';

import { AuthenticatedRequest } from './authMiddleware';

/**
 * Role-based access control middleware factory
 * Creates middleware that restricts access based on user roles with hierarchical permissions
 *
 * Hierarchical Role System:
 * - SUPER_ADMIN: Can access all endpoints (highest privilege)
 * - ADMIN: Can access ADMIN and CLIENT endpoints
 * - CLIENT: Can only access CLIENT endpoints (lowest privilege)
 *
 * @param allowedRoles - Array of roles that are allowed to access the resource
 * @returns Express middleware function
 *
 * @example
 * // Only admins and super admins can access
 * router.get('/admin/users', requireRole(UserRole.ADMIN), handler);
 *
 * @example
 * // Multiple specific roles
 * router.get('/resource', requireRole(UserRole.ADMIN, UserRole.CLIENT), handler);
 *
 * @example
 * // Everyone (any authenticated user)
 * router.get('/public', requireRole(UserRole.CLIENT), handler);
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Response | void => {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Authentication required',
      });
    }

    const userRole = req.user.role;

    // Check if user has permission for any of the allowed roles
    // Using hierarchical checking: higher roles can access lower role endpoints
    const hasAccess = allowedRoles.some((requiredRole) =>
      hasPermission(userRole, requiredRole)
    );

    if (!hasAccess) {
      // Log authorization failure for security monitoring
      logger.warn(
        `Authorization failed: User ${req.user.id} with role ${userRole} attempted to access endpoint requiring roles: ${allowedRoles.join(', ')}`
      );

      return res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient permissions',
        requiredRoles: allowedRoles,
        userRole: userRole,
      });
    }

    // User has permission, proceed to next middleware
    return next();
  };
}

/**
 * Convenience middleware for admin-only endpoints
 * Allows ADMIN and SUPER_ADMIN roles
 *
 * @example
 * router.delete('/users/:id', requireAdmin, deleteUserHandler);
 */
export const requireAdmin = requireRole(UserRole.ADMIN);

/**
 * Convenience middleware for super admin-only endpoints
 * Only allows SUPER_ADMIN role
 *
 * @example
 * router.post('/system/config', requireSuperAdmin, updateConfigHandler);
 */
export const requireSuperAdmin = requireRole(UserRole.SUPER_ADMIN);

/**
 * Convenience middleware for authenticated users of any role
 * Allows CLIENT, ADMIN, and SUPER_ADMIN roles
 *
 * @example
 * router.get('/profile', requireAuthenticated, getProfileHandler);
 */
export const requireAuthenticated = requireRole(UserRole.CLIENT);
