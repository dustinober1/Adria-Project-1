import { UserRole } from '@adria/shared';

/**
 * Role hierarchy definition
 * Higher index = higher privilege level
 */
const ROLE_HIERARCHY: UserRole[] = [
  UserRole.CLIENT,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
];

/**
 * Gets the privilege level of a role (higher = more privileges)
 * @param role - The user role to check
 * @returns The privilege level (0-based index)
 */
function getRoleLevel(role: UserRole): number {
  const level = ROLE_HIERARCHY.indexOf(role);
  return level === -1 ? -1 : level;
}

/**
 * Checks if a user's role has permission to access a resource requiring a specific role
 * Uses hierarchical role checking: higher roles can access lower role resources
 *
 * Examples:
 * - SUPER_ADMIN can access ADMIN and CLIENT resources
 * - ADMIN can access ADMIN and CLIENT resources
 * - CLIENT can only access CLIENT resources
 *
 * @param userRole - The role of the current user
 * @param requiredRole - The minimum role required to access the resource
 * @returns true if the user has permission, false otherwise
 */
export function hasPermission(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  const userLevel = getRoleLevel(userRole);
  const requiredLevel = getRoleLevel(requiredRole);

  // Invalid roles have no permissions
  if (userLevel === -1 || requiredLevel === -1) {
    return false;
  }

  // User's role level must be >= required level
  return userLevel >= requiredLevel;
}

/**
 * Checks if a user can access a specific resource based on ownership and role
 * Implements ownership-based access control with role override
 *
 * Rules:
 * - Users can always access their own resources
 * - ADMIN can access CLIENT resources
 * - SUPER_ADMIN can access all resources
 *
 * @param userRole - The role of the current user
 * @param resourceOwnerId - The ID of the user who owns the resource
 * @param currentUserId - The ID of the current user
 * @returns true if the user can access the resource, false otherwise
 */
export function canAccessResource(
  userRole: UserRole,
  resourceOwnerId: string,
  currentUserId: string
): boolean {
  // Users can always access their own resources
  if (resourceOwnerId === currentUserId) {
    return true;
  }

  // ADMIN and SUPER_ADMIN can access other users' resources
  return userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
}

/**
 * Checks if a user can modify another user's role
 * Implements role modification restrictions
 *
 * Rules:
 * - Only SUPER_ADMIN can change roles
 * - SUPER_ADMIN cannot be demoted by anyone (must be done manually in DB)
 * - Cannot promote users to a role higher than your own
 *
 * @param currentUserRole - The role of the user making the change
 * @param targetUserRole - The current role of the user being modified
 * @param newRole - The new role being assigned
 * @returns true if the role change is allowed, false otherwise
 */
export function canModifyUserRole(
  currentUserRole: UserRole,
  targetUserRole: UserRole,
  newRole: UserRole
): boolean {
  // Only SUPER_ADMIN can modify roles
  if (currentUserRole !== UserRole.SUPER_ADMIN) {
    return false;
  }

  // Cannot demote a SUPER_ADMIN (must be done manually)
  if (targetUserRole === UserRole.SUPER_ADMIN) {
    return false;
  }

  // Cannot promote to a role higher than your own (which is impossible for SUPER_ADMIN)
  const currentUserLevel = getRoleLevel(currentUserRole);
  const newRoleLevel = getRoleLevel(newRole);

  return newRoleLevel <= currentUserLevel;
}

/**
 * Gets all roles that a user has permission to access (including their own)
 * @param userRole - The role of the current user
 * @returns Array of accessible roles
 */
export function getAccessibleRoles(userRole: UserRole): UserRole[] {
  const userLevel = getRoleLevel(userRole);
  if (userLevel === -1) {
    return [];
  }

  // Return all roles up to and including the user's role level
  return ROLE_HIERARCHY.slice(0, userLevel + 1);
}

/**
 * Checks if a user is an admin (ADMIN or SUPER_ADMIN)
 * @param userRole - The role to check
 * @returns true if the user is an admin, false otherwise
 */
export function isAdmin(userRole: UserRole): boolean {
  return userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
}

/**
 * Checks if a user is a super admin
 * @param userRole - The role to check
 * @returns true if the user is a super admin, false otherwise
 */
export function isSuperAdmin(userRole: UserRole): boolean {
  return userRole === UserRole.SUPER_ADMIN;
}
