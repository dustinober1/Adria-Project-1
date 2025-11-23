import { NextFunction, Request, Response, Router } from 'express';
import rateLimit from 'express-rate-limit';

import { env } from '../config/env';
import {
  getPublicFormTemplateHandler,
  listPublicFormTemplatesHandler,
  submitFormHandler,
} from '../controllers/formSubmissionController';
import { optionalAuth } from '../middleware/authMiddleware';

type AsyncHandler = (req: Request, res: Response) => Promise<Response | void>;

const handleAsync =
  (handler: AsyncHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res).catch(next);
  };

const formsLimiter = rateLimit({
  windowMs: env.formsRateLimitWindowMs,
  max: env.formsRateLimitMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many submissions from this IP, please try again later.',
  },
});

const router = Router();

/**
 * @swagger
 * /api/v1/forms:
 *   get:
 *     tags: [Forms]
 *     summary: List active form templates
 *     responses:
 *       200:
 *         description: Active form templates
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FormTemplate'
 */
router.get('/', handleAsync(listPublicFormTemplatesHandler));

/**
 * @swagger
 * /api/v1/forms/{id}:
 *   get:
 *     tags: [Forms]
 *     summary: Get a form template by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Form template
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/FormTemplate'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', handleAsync(getPublicFormTemplateHandler));

/**
 * @swagger
 * /api/v1/forms/{id}/submit:
 *   post:
 *     tags: [Forms]
 *     summary: Submit responses for a form template
 *     description: Public endpoint protected by rate limiting and reCAPTCHA verification.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FormSubmissionRequest'
 *     responses:
 *       201:
 *         description: Submission accepted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/FormSubmissionResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       429:
 *         description: Rate limit or reCAPTCHA failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/:id/submit',
  formsLimiter,
  optionalAuth,
  handleAsync(submitFormHandler)
);

export default router;
