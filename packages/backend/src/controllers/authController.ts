import { Request, Response } from 'express';

import type { AuthenticatedRequest } from '../middleware/authMiddleware';
import {
  getProfile,
  login,
  logout,
  refreshAccessToken,
  register,
} from '../services/authService';
import type { Role } from '../services/authService';

type LoginBody = {
  email?: unknown;
  password?: unknown;
};

type RegisterBody = {
  email?: unknown;
  password?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  role?: unknown;
};

type RefreshBody = {
  refreshToken?: unknown;
};

type LogoutBody = {
  refreshToken?: unknown;
};

const ALLOWED_ROLES: Role[] = ['client', 'admin', 'super_admin'];

/**
 * Login handler
 * POST /api/v1/auth/login
 */
export async function loginHandler(req: Request, res: Response) {
  try {
    const { email, password } = req.body as LoginBody;

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const result = await login(email, password);

    return res.status(200).json({
      success: true,
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return res.status(401).json({
      success: false,
      message,
    });
  }
}

/**
 * Register handler
 * POST /api/v1/auth/register
 */
export async function registerHandler(req: Request, res: Response) {
  try {
    const { email, password, firstName, lastName, role } =
      req.body as RegisterBody;

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    if (typeof firstName !== 'string' || typeof lastName !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'First name and last name are required',
      });
    }

    if (!firstName.trim() || !lastName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'First name and last name cannot be empty',
      });
    }

    const parsedRole =
      typeof role === 'string' && (ALLOWED_ROLES as string[]).includes(role)
        ? (role as Role)
        : 'client';

    const result = await register({
      email,
      password,
      firstName,
      lastName,
      role: parsedRole,
    });

    return res.status(201).json({
      success: true,
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Registration failed';
    return res.status(400).json({
      success: false,
      message,
    });
  }
}

/**
 * Get current user profile handler
 * GET /api/v1/auth/me
 */
export async function meHandler(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const profile = await getProfile(req.user);

    return res.status(200).json({
      success: true,
      user: profile,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to get profile';
    return res.status(500).json({
      success: false,
      message,
    });
  }
}

/**
 * Refresh token handler
 * POST /api/v1/auth/refresh
 */
export async function refreshHandler(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body as RefreshBody;

    if (typeof refreshToken !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    const result = await refreshAccessToken(refreshToken);

    return res.status(200).json({
      success: true,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Token refresh failed';
    return res.status(401).json({
      success: false,
      message,
    });
  }
}

/**
 * Logout handler
 * POST /api/v1/auth/logout
 */
export async function logoutHandler(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body as LogoutBody;

    if (typeof refreshToken !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    await logout(refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Logout failed';
    return res.status(500).json({
      success: false,
      message,
    });
  }
}
