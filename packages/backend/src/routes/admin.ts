import { NextFunction, Request, Response, Router } from 'express';

import {
  changeUserRoleHandler,
  deleteUserHandler,
  getUserByIdHandler,
  listAllUsersHandler,
} from '../controllers/adminController';
import {
  authenticateToken,
  ensureAuthenticated,
} from '../middleware/authMiddleware';
import { requireAdmin, requireSuperAdmin } from '../middleware/roleGuard';

type AsyncHandler = (req: Request, res: Response) => Promise<Response | void>;

const handleAsync =
  (handler: AsyncHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res).catch(next);
  };

const router = Router();

// All admin routes require authentication
router.use(authenticateToken);
router.use(ensureAuthenticated);

/**
 * GET /api/v1/admin/users
 * List all users in the system
 * Required role: ADMIN or SUPER_ADMIN
 */
router.get(
  '/users',
  requireAdmin,
  handleAsync(listAllUsersHandler)
);

/**
 * GET /api/v1/admin/users/:id
 * Get a specific user by ID
 * Required role: ADMIN or SUPER_ADMIN
 */
router.get(
  '/users/:id',
  requireAdmin,
  handleAsync(getUserByIdHandler)
);

/**
 * POST /api/v1/admin/users/:id/role
 * Change a user's role
 * Required role: SUPER_ADMIN only
 * Body: { role: 'client' | 'admin' | 'super_admin' }
 */
router.post(
  '/users/:id/role',
  requireSuperAdmin,
  handleAsync(changeUserRoleHandler)
);

/**
 * DELETE /api/v1/admin/users/:id
 * Delete a user from the system
 * Required role: SUPER_ADMIN only
 */
router.delete('/users/:id', requireSuperAdmin, handleAsync(deleteUserHandler));

export default router;
