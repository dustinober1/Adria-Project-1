import { UserRole } from '@adria/shared';
import type { NextFunction, Response } from 'express';

import type { AuthenticatedRequest } from '../authMiddleware';
import { ensureAuthenticated, mockAuth, requireRole } from '../authMiddleware';

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  describe('mockAuth', () => {
    it('sets user when Bearer token is present', () => {
      mockRequest.headers = {
        authorization: 'Bearer mock-token',
      };

      mockAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.id).toBe('demo-user');
      expect(mockRequest.user?.email).toBe('demo@adria.cross');
      expect(mockRequest.user?.role).toBe('client');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('does not set user when no authorization header', () => {
      mockAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.user).toBeUndefined();
      expect(nextFunction).toHaveBeenCalled();
    });

    it('does not set user when authorization header is empty', () => {
      mockRequest.headers = {
        authorization: '',
      };

      mockAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.user).toBeUndefined();
      expect(nextFunction).toHaveBeenCalled();
    });

    it('does not set user when authorization header does not start with Bearer', () => {
      mockRequest.headers = {
        authorization: 'Basic dXNlcjpwYXNz',
      };

      mockAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.user).toBeUndefined();
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('ensureAuthenticated', () => {
    it('calls next when user is authenticated', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.CLIENT,
      };

      ensureAuthenticated(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('returns 401 when user is not authenticated', () => {
      ensureAuthenticated(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized - Authentication required',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('returns 401 when user is null', () => {
      mockRequest.user = undefined;

      ensureAuthenticated(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('allows access when user has required role', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      };

      const middleware = requireRole([UserRole.ADMIN]);
      middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('allows access when user has one of multiple allowed roles', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'client@example.com',
        role: UserRole.CLIENT,
      };

      const middleware = requireRole([UserRole.CLIENT, UserRole.ADMIN]);
      middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('blocks access when user does not have required role', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'client@example.com',
        role: UserRole.CLIENT,
      };

      const middleware = requireRole([UserRole.ADMIN]);
      middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Forbidden - Insufficient permissions',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('returns 401 when user is not authenticated', () => {
      const middleware = requireRole([UserRole.ADMIN]);
      middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized - Authentication required',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('blocks client from admin-only endpoint', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'client@example.com',
        role: UserRole.CLIENT,
      };

      const middleware = requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
      middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('allows super_admin to access admin endpoint', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'superadmin@example.com',
        role: UserRole.SUPER_ADMIN,
      };

      const middleware = requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
      middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('handles empty allowed roles array', () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'client@example.com',
        role: UserRole.CLIENT,
      };

      const middleware = requireRole([]);
      middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});
