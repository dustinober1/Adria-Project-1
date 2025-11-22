import { UserRole } from '@adria/shared';
import { Response } from 'express';

import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { comparePassword, hashPassword, validateEmail, validatePassword } from '../utils/auth';

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

/**
 * GET /api/v1/profile
 * Get the authenticated user's profile
 */
export async function getProfileHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: userSelect,
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: mapUser(user),
  });
}

/**
 * PUT /api/v1/profile
 * Update the authenticated user's profile
 * Request body: { firstName?: string, lastName?: string, email?: string }
 */
export async function updateProfileHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  const { firstName, lastName, email } = req.body as {
    firstName?: string;
    lastName?: string;
    email?: string;
  };

  if (!firstName && !lastName && !email) {
    return res.status(400).json({
      success: false,
      message:
        'At least one field (firstName, lastName, or email) must be provided',
    });
  }

  if (email && !validateEmail(email.trim())) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format',
    });
  }

  const normalizedEmail = email ? email.trim().toLowerCase() : undefined;

  if (normalizedEmail) {
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser && existingUser.id !== req.user.id) {
      return res.status(409).json({
        success: false,
        message: 'Email is already in use by another account',
      });
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      email: normalizedEmail,
    },
    select: userSelect,
  });

  return res.status(200).json({
    success: true,
    data: mapUser(updatedUser),
    message: 'Profile updated successfully',
  });
}

/**
 * PUT /api/v1/profile/password
 * Change the authenticated user's password
 * Request body: { currentPassword: string, newPassword: string }
 */
export async function changePasswordHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Both currentPassword and newPassword are required',
    });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({
      success: false,
      message: 'New password must be different from current password',
    });
  }

  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: passwordValidation.error,
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  const isCurrentValid = await comparePassword(currentPassword, user.password);
  if (!isCurrentValid) {
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect',
    });
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: hashedPassword },
  });

  await prisma.refreshToken.deleteMany({
    where: { userId: req.user.id },
  });

  return res.status(200).json({
    success: true,
    message: 'Password changed successfully',
  });
}

function mapUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role.toLowerCase() as UserRole,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
