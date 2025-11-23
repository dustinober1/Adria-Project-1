import { NextFunction, Request, Response, Router } from 'express';
import rateLimit from 'express-rate-limit';

import { env } from '../config/env';
import { submitContactHandler } from '../controllers/contactController';

type AsyncHandler = (req: Request, res: Response) => Promise<Response | void>;

const handleAsync =
  (handler: AsyncHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res).catch(next);
  };

const contactLimiter = rateLimit({
  windowMs: env.contactRateLimitWindowMs,
  max: env.contactRateLimitMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many contact submissions from this IP, please try again later.',
  },
});

const router = Router();

/**
 * @swagger
 * /api/v1/contact/submit:
 *   post:
 *     tags: [Contact]
 *     summary: Submit a contact inquiry
 *     description: Public endpoint protected by rate limiting and reCAPTCHA verification.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContactSubmissionRequest'
 *     responses:
 *       201:
 *         description: Inquiry created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContactSubmissionResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         description: Rate limit or reCAPTCHA failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/submit', contactLimiter, handleAsync(submitContactHandler));

export default router;
