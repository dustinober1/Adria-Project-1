import { NextFunction, Request, Response, Router } from 'express';

import {
  loginHandler,
  meHandler,
  registerHandler,
} from '../controllers/authController';
import {
  ensureAuthenticated,
  mockAuth,
  requireRole,
} from '../middleware/authMiddleware';

type AsyncHandler = (req: Request, res: Response) => Promise<Response | void>;

const handleAsync =
  (handler: AsyncHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res).catch(next);
  };

const router = Router();

router.post('/login', handleAsync(loginHandler));
router.post('/register', handleAsync(registerHandler));
router.get(
  '/me',
  mockAuth,
  ensureAuthenticated,
  requireRole(['client', 'admin', 'super_admin']),
  handleAsync(meHandler)
);

export default router;
