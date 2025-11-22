import { UserRole } from '@adria/shared';
import { Response } from 'express';

import { AuthenticatedRequest } from '../authMiddleware';
import {
  requireAdmin,
  requireAuthenticated,
  requireRole,
  requireSuperAdmin,
} from '../roleGuard';

describe('roleGuard middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  describe('requireRole', () => {
    it('should return 401 if user is not authenticated', () => {
      const middleware = requireRole(UserRole.CLIENT);

      middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized: Authentication required',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should allow CLIENT to access CLIENT endpoints', () => {
      mockRequest.user = {
        id: 'user-1',
        email: 'client@test.com',
        role: UserRole.CLIENT,
      };

      const middleware = requireRole(UserRole.CLIENT);

      middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should allow ADMIN to access CLIENT endpoints (hierarchical)', () => {
      mockRequest.user = {
        id: 'user-1',
        email: 'admin@test.com',
        role: UserRole.ADMIN,
      };

      const middleware = requireRole(UserRole.CLIENT);

      middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should allow SUPER_ADMIN to access all endpoints', () => {
      mockRequest.user = {
        id: 'user-1',
        email: 'superadmin@test.com',
        role: UserRole.SUPER_ADMIN,
      };

      const clientMiddleware = requireRole(UserRole.CLIENT);
      clientMiddleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );
      expect(nextFunction).toHaveBeenCalledTimes(1);

      const adminMiddleware = requireRole(UserRole.ADMIN);
      adminMiddleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );
      expect(nextFunction).toHaveBeenCalledTimes(2);

      const superAdminMiddleware = requireRole(UserRole.SUPER_ADMIN);
      superAdminMiddleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );
      expect(nextFunction).toHaveBeenCalledTimes(3);
    });

    it('should deny CLIENT access to ADMIN endpoints', () => {
      mockRequest.user = {
        id: 'user-1',
        email: 'client@test.com',
        role: UserRole.CLIENT,
      };

      const middleware = requireRole(UserRole.ADMIN);

      middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Forbidden: Insufficient permissions',
        requiredRoles: [UserRole.ADMIN],
        userRole: UserRole.CLIENT,
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should deny ADMIN access to SUPER_ADMIN endpoints', () => {
      mockRequest.user = {
        id: 'user-1',
        email: 'admin@test.com',
        role: UserRole.ADMIN,
      };

      const middleware = requireRole(UserRole.SUPER_ADMIN);

      middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should support multiple allowed roles', () => {
      mockRequest.user = {
        id: 'user-1',
        email: 'admin@test.com',
        role: UserRole.ADMIN,
      };

      const middleware = requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN);

      middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('convenience middlewares', () => {
    it('requireAdmin should allow ADMIN', () => {
      mockRequest.user = {
        id: 'user-1',
        email: 'admin@test.com',
        role: UserRole.ADMIN,
      };

      requireAdmin(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });

    it('requireAdmin should allow SUPER_ADMIN', () => {
      mockRequest.user = {
        id: 'user-1',
        email: 'superadmin@test.com',
        role: UserRole.SUPER_ADMIN,
      };

      requireAdmin(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });

    it('requireAdmin should deny CLIENT', () => {
      mockRequest.user = {
        id: 'user-1',
        email: 'client@test.com',
        role: UserRole.CLIENT,
      };

      requireAdmin(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('requireSuperAdmin should only allow SUPER_ADMIN', () => {
      const superAdminUser = {
        id: 'user-1',
        email: 'superadmin@test.com',
        role: UserRole.SUPER_ADMIN,
      };

      mockRequest.user = superAdminUser;

      requireSuperAdmin(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('requireSuperAdmin should deny ADMIN', () => {
      mockRequest.user = {
        id: 'user-1',
        email: 'admin@test.com',
        role: UserRole.ADMIN,
      };

      requireSuperAdmin(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('requireAuthenticated should allow any authenticated user', () => {
      const roles = [UserRole.CLIENT, UserRole.ADMIN, UserRole.SUPER_ADMIN];

      roles.forEach((role) => {
        mockRequest.user = {
          id: 'user-1',
          email: `${role}@test.com`,
          role,
        };

        const newNextFunction = jest.fn();

        requireAuthenticated(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          newNextFunction
        );

        expect(newNextFunction).toHaveBeenCalled();
      });
    });
  });
});
