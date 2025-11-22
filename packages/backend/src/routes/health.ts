import { Router, Request, Response } from 'express';

import { env } from '../config/env';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     description: Check if the API is running and responsive. Returns server status, timestamp, and environment information.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy and running
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *             example:
 *               success: true
 *               message: Backend API is running
 *               timestamp: 2025-01-15T10:30:00.000Z
 *               environment: development
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Backend API is running',
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv,
  });
});

export default router;
