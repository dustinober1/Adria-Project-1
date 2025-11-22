import { NextFunction, Request, Response } from 'express';

import type { AuthUser, Role } from '../services/authService';

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function mockAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    req.user = {
      id: 'demo-user',
      email: 'demo@adria.cross',
      role: 'client',
    };
  }

  next();
}

export function ensureAuthenticated(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  return next();
}

export function requireRole(allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    return next();
  };
}
