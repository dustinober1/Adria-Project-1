import { Request, Response } from 'express';

import type { AuthenticatedRequest } from '../middleware/authMiddleware';
import { getProfile, login, register } from '../services/authService';
import type { Role } from '../services/authService';

type AuthBody = {
  email?: unknown;
  password?: unknown;
  role?: unknown;
};

const ALLOWED_ROLES: Role[] = ['client', 'admin', 'super_admin'];

export async function loginHandler(req: Request, res: Response) {
  const { email, password } = req.body as AuthBody;

  if (typeof email !== 'string' || typeof password !== 'string') {
    return res
      .status(400)
      .json({ success: false, message: 'Email and password are required' });
  }

  const result = await login(email, password);

  return res.status(200).json({
    success: true,
    user: result.user,
    token: result.token,
  });
}

export async function registerHandler(req: Request, res: Response) {
  const { email, password, role } = req.body as AuthBody;

  if (typeof email !== 'string' || typeof password !== 'string') {
    return res
      .status(400)
      .json({ success: false, message: 'Email and password are required' });
  }

  const parsedRole =
    typeof role === 'string' && (ALLOWED_ROLES as string[]).includes(role)
      ? (role as Role)
      : 'client';

  const result = await register(email, password, parsedRole);

  return res.status(201).json({
    success: true,
    user: result.user,
    token: result.token,
  });
}

export async function meHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const profile = await getProfile(req.user);

  return res.status(200).json({
    success: true,
    user: profile,
  });
}
