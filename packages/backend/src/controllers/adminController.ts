import { UserRole } from '@adria/shared';
import { Response } from 'express';

import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { canModifyUserRole } from '../utils/permissions';

type UserResponse = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * GET /api/v1/admin/users
 * List all users (admin and super_admin only)
 */
export async function listAllUsersHandler(
  _req: AuthenticatedRequest,
  res: Response
): Promise<Response> {
  const users = await prisma.user.findMany({
    select: userSelect,
    orderBy: { createdAt: 'desc' },
  });

  return res.status(200).json({
    success: true,
    data: users.map(mapUserToResponse),
  });
}

/**
 * GET /api/v1/admin/users/:id
 * Get a specific user by ID (admin and super_admin only)
 */
export async function getUserByIdHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
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
    data: mapUserToResponse(user),
  });
}

/**
 * POST /api/v1/admin/users/:id/role
 * Change a user's role (super_admin only)
 * Request body: { role: UserRole }
 */
export async function changeUserRoleHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> {
  const { id } = req.params;
  const { role: newRole } = req.body as { role: UserRole };

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  // Validate the new role
  if (!Object.values(UserRole).includes(newRole)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role. Must be one of: client, admin, super_admin',
    });
  }

  const targetUser = await prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });

  if (!targetUser) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  const targetUserRole = targetUser.role.toLowerCase() as UserRole;
  const canModify = canModifyUserRole(req.user.role, targetUserRole, newRole);

  if (!canModify) {
    return res.status(403).json({
      success: false,
      message:
        "Forbidden: Cannot modify this user's role. Only SUPER_ADMIN can change roles, and SUPER_ADMIN roles cannot be modified.",
    });
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      role: newRole.toUpperCase() as 'CLIENT' | 'ADMIN' | 'SUPER_ADMIN',
    },
    select: userSelect,
  });

  return res.status(200).json({
    success: true,
    data: mapUserToResponse(updatedUser),
    message: `User role updated to ${newRole}`,
  });
}

/**
 * DELETE /api/v1/admin/users/:id
 * Delete a user (super_admin only)
 */
export async function deleteUserHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> {
  const { id } = req.params;

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  if (id === req.user.id) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete your own account',
    });
  }

  const targetUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });

  if (!targetUser) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  if (targetUser.role === 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Cannot delete SUPER_ADMIN accounts',
    });
  }

  await prisma.refreshToken.deleteMany({ where: { userId: id } });
  await prisma.user.delete({ where: { id } });

  return res.status(200).json({
    success: true,
    message: `User ${id} has been deleted`,
  });
}

function mapUserToResponse(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): UserResponse {
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
