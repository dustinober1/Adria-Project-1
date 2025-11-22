import { NextFunction, Request, Response, Router } from 'express';

import {
  changePasswordHandler,
  getProfileHandler,
  updateProfileHandler,
} from '../controllers/profileController';
import {
  authenticateToken,
  ensureAuthenticated,
} from '../middleware/authMiddleware';
import { requireAuthenticated } from '../middleware/roleGuard';

type AsyncHandler = (req: Request, res: Response) => Promise<Response | void>;

const handleAsync =
  (handler: AsyncHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res).catch(next);
  };

const router = Router();

// All profile routes require authentication
router.use(authenticateToken);
router.use(ensureAuthenticated);
router.use(requireAuthenticated); // Ensures user has at least CLIENT role

/**
 * GET /api/v1/profile
 * Get the authenticated user's own profile
 * Available to all authenticated users
 */
router.get('/', handleAsync(getProfileHandler));

/**
 * PUT /api/v1/profile
 * Update the authenticated user's profile information
 * Available to all authenticated users
 * Body: { name?: string, email?: string }
 */
router.put('/', handleAsync(updateProfileHandler));

/**
 * PUT /api/v1/profile/password
 * Change the authenticated user's password
 * Available to all authenticated users
 * Body: { currentPassword: string, newPassword: string }
 */
router.put('/password', handleAsync(changePasswordHandler));

export default router;
