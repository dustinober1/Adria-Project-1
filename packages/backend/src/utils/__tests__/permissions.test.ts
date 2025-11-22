import { UserRole } from '@adria/shared';

import {
  canAccessResource,
  canModifyUserRole,
  getAccessibleRoles,
  hasPermission,
  isAdmin,
  isSuperAdmin,
} from '../permissions';

describe('permissions utilities', () => {
  describe('hasPermission', () => {
    it('should allow SUPER_ADMIN to access all roles', () => {
      expect(hasPermission(UserRole.SUPER_ADMIN, UserRole.CLIENT)).toBe(true);
      expect(hasPermission(UserRole.SUPER_ADMIN, UserRole.ADMIN)).toBe(true);
      expect(hasPermission(UserRole.SUPER_ADMIN, UserRole.SUPER_ADMIN)).toBe(
        true
      );
    });

    it('should allow ADMIN to access ADMIN and CLIENT roles', () => {
      expect(hasPermission(UserRole.ADMIN, UserRole.CLIENT)).toBe(true);
      expect(hasPermission(UserRole.ADMIN, UserRole.ADMIN)).toBe(true);
      expect(hasPermission(UserRole.ADMIN, UserRole.SUPER_ADMIN)).toBe(false);
    });

    it('should only allow CLIENT to access CLIENT role', () => {
      expect(hasPermission(UserRole.CLIENT, UserRole.CLIENT)).toBe(true);
      expect(hasPermission(UserRole.CLIENT, UserRole.ADMIN)).toBe(false);
      expect(hasPermission(UserRole.CLIENT, UserRole.SUPER_ADMIN)).toBe(false);
    });
  });

  describe('canAccessResource', () => {
    const userId = 'user-123';
    const otherUserId = 'user-456';

    it('should allow users to access their own resources', () => {
      expect(canAccessResource(UserRole.CLIENT, userId, userId)).toBe(true);
      expect(canAccessResource(UserRole.ADMIN, userId, userId)).toBe(true);
      expect(canAccessResource(UserRole.SUPER_ADMIN, userId, userId)).toBe(
        true
      );
    });

    it('should not allow CLIENT to access other users resources', () => {
      expect(canAccessResource(UserRole.CLIENT, otherUserId, userId)).toBe(
        false
      );
    });

    it('should allow ADMIN to access other users resources', () => {
      expect(canAccessResource(UserRole.ADMIN, otherUserId, userId)).toBe(true);
    });

    it('should allow SUPER_ADMIN to access other users resources', () => {
      expect(canAccessResource(UserRole.SUPER_ADMIN, otherUserId, userId)).toBe(
        true
      );
    });
  });

  describe('canModifyUserRole', () => {
    it('should not allow CLIENT to modify any roles', () => {
      expect(
        canModifyUserRole(UserRole.CLIENT, UserRole.CLIENT, UserRole.ADMIN)
      ).toBe(false);
    });

    it('should not allow ADMIN to modify any roles', () => {
      expect(
        canModifyUserRole(UserRole.ADMIN, UserRole.CLIENT, UserRole.ADMIN)
      ).toBe(false);
    });

    it('should allow SUPER_ADMIN to modify CLIENT and ADMIN roles', () => {
      expect(
        canModifyUserRole(UserRole.SUPER_ADMIN, UserRole.CLIENT, UserRole.ADMIN)
      ).toBe(true);
      expect(
        canModifyUserRole(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT)
      ).toBe(true);
    });

    it('should not allow SUPER_ADMIN to modify SUPER_ADMIN roles', () => {
      expect(
        canModifyUserRole(
          UserRole.SUPER_ADMIN,
          UserRole.SUPER_ADMIN,
          UserRole.ADMIN
        )
      ).toBe(false);
    });

    it('should allow SUPER_ADMIN to promote to SUPER_ADMIN', () => {
      expect(
        canModifyUserRole(
          UserRole.SUPER_ADMIN,
          UserRole.ADMIN,
          UserRole.SUPER_ADMIN
        )
      ).toBe(true);
    });
  });

  describe('getAccessibleRoles', () => {
    it('should return only CLIENT for CLIENT role', () => {
      expect(getAccessibleRoles(UserRole.CLIENT)).toEqual([UserRole.CLIENT]);
    });

    it('should return CLIENT and ADMIN for ADMIN role', () => {
      expect(getAccessibleRoles(UserRole.ADMIN)).toEqual([
        UserRole.CLIENT,
        UserRole.ADMIN,
      ]);
    });

    it('should return all roles for SUPER_ADMIN', () => {
      expect(getAccessibleRoles(UserRole.SUPER_ADMIN)).toEqual([
        UserRole.CLIENT,
        UserRole.ADMIN,
        UserRole.SUPER_ADMIN,
      ]);
    });
  });

  describe('isAdmin', () => {
    it('should return true for ADMIN and SUPER_ADMIN', () => {
      expect(isAdmin(UserRole.ADMIN)).toBe(true);
      expect(isAdmin(UserRole.SUPER_ADMIN)).toBe(true);
    });

    it('should return false for CLIENT', () => {
      expect(isAdmin(UserRole.CLIENT)).toBe(false);
    });
  });

  describe('isSuperAdmin', () => {
    it('should return true only for SUPER_ADMIN', () => {
      expect(isSuperAdmin(UserRole.SUPER_ADMIN)).toBe(true);
    });

    it('should return false for other roles', () => {
      expect(isSuperAdmin(UserRole.ADMIN)).toBe(false);
      expect(isSuperAdmin(UserRole.CLIENT)).toBe(false);
    });
  });
});
