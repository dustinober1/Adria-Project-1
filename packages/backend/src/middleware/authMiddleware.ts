import { AuthUser, UserRole } from '@adria/shared';
import { NextFunction, Request, Response } from 'express';

import { extractTokenFromHeader, verifyAccessToken } from '../utils/auth';

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

/**
 * Middleware to authenticate requests using JWT from Authorization header
 * Extracts and verifies the token, then attaches user info to req.user
 */
export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - No token provided',
    });
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - Invalid or expired token',
    });
  }

  // Attach user info to request
  req.user = {
    id: payload.userId,
    email: payload.email,
    role: payload.role as UserRole,
  };

  return next();
}

/**
 * Optional authentication - attaches user if valid token is provided
 * Does not fail if no token is present
 */
export function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (token) {
    const payload = verifyAccessToken(token);
    if (payload) {
      req.user = {
        id: payload.userId,
        email: payload.email,
        role: payload.role as UserRole,
      };
    }
  }

  next();
}

/**
 * Middleware to ensure user is authenticated
 * Should be used after authenticateToken
 */
export function ensureAuthenticated(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - Authentication required',
    });
  }

  return next();
}

/**
 * Middleware to require specific roles
 * Should be used after authenticateToken
 * @param allowedRoles - Array of roles that are allowed to access the route
 * @deprecated Use roleGuard.requireRole instead for hierarchical role checking
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Authentication required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden - Insufficient permissions',
      });
    }

    return next();
  };
}

/**
 * Mock authentication middleware for development/testing
 * Simulates JWT authentication by checking Bearer token
 *
 * Token format for testing different roles:
 * - Bearer mock-token-client (CLIENT role)
 * - Bearer mock-token-admin (ADMIN role)
 * - Bearer mock-token-super (SUPER_ADMIN role)
 *
 * @deprecated This is for development only. Use authenticateToken in production.
 */
export function mockAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    let role: UserRole = UserRole.CLIENT;

    // Allow testing different roles by encoding them in the token
    if (token.includes('admin')) {
      role = UserRole.ADMIN;
    } else if (token.includes('super')) {
      role = UserRole.SUPER_ADMIN;
    }

    req.user = {
      id: 'demo-user',
      email: 'demo@adria.cross',
      role,
    };
  }

  next();
}
