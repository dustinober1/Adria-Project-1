import { NextFunction, Request, Response, Router } from 'express';

import {
  authenticateToken,
  ensureAuthenticated,
} from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/roleGuard';
import {
  createServiceHandler,
  deleteServiceHandler,
  getServiceByIdHandler,
  getServiceBySlugHandler,
  listServicesHandler,
  updateServiceHandler,
} from '../controllers/serviceController';

type AsyncHandler = (req: Request, res: Response) => Promise<Response | void>;

const handleAsync =
  (handler: AsyncHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res).catch(next);
  };

const router = Router();

// Public endpoints
router.get('/', handleAsync(listServicesHandler));
router.get('/slug/:slug', handleAsync(getServiceBySlugHandler));
router.get('/:id', handleAsync(getServiceByIdHandler));

// Admin-protected endpoints
router.post(
  '/',
  authenticateToken,
  ensureAuthenticated,
  requireAdmin,
  handleAsync(createServiceHandler)
);

router.put(
  '/:id',
  authenticateToken,
  ensureAuthenticated,
  requireAdmin,
  handleAsync(updateServiceHandler)
);

router.delete(
  '/:id',
  authenticateToken,
  ensureAuthenticated,
  requireAdmin,
  handleAsync(deleteServiceHandler)
);

export default router;
