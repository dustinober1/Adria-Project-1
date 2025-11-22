import { NextFunction, Request, Response, Router } from 'express';

import {
  authenticateToken,
  ensureAuthenticated,
} from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/roleGuard';
import {
  adminListPostsHandler,
  createPostHandler,
  deletePostHandler,
  getPublishedPostHandler,
  listPublishedPostsHandler,
  updatePostHandler,
  updatePostStatusHandler,
} from '../controllers/postController';

type AsyncHandler = (req: Request, res: Response) => Promise<Response | void>;

const handleAsync =
  (handler: AsyncHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res).catch(next);
  };

const router = Router();

// Admin endpoints
router.get(
  '/admin/list',
  authenticateToken,
  ensureAuthenticated,
  requireAdmin,
  handleAsync(adminListPostsHandler)
);

router.post(
  '/',
  authenticateToken,
  ensureAuthenticated,
  requireAdmin,
  handleAsync(createPostHandler)
);

router.put(
  '/:id',
  authenticateToken,
  ensureAuthenticated,
  requireAdmin,
  handleAsync(updatePostHandler)
);

router.patch(
  '/:id/status',
  authenticateToken,
  ensureAuthenticated,
  requireAdmin,
  handleAsync(updatePostStatusHandler)
);

router.delete(
  '/:id',
  authenticateToken,
  ensureAuthenticated,
  requireAdmin,
  handleAsync(deletePostHandler)
);

// Public endpoints
router.get('/', handleAsync(listPublishedPostsHandler));
router.get('/:slug', handleAsync(getPublishedPostHandler));

export default router;
