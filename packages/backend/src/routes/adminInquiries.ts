import { NextFunction, Request, Response, Router } from 'express';

import {
  authenticateToken,
  ensureAuthenticated,
} from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/roleGuard';
import {
  getInquiryHandler,
  listInquiriesHandler,
  updateInquiryStatusHandler,
} from '../controllers/inquiryController';

type AsyncHandler = (req: Request, res: Response) => Promise<Response | void>;

const handleAsync =
  (handler: AsyncHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res).catch(next);
  };

const router = Router();

router.use(authenticateToken);
router.use(ensureAuthenticated);
router.use(requireAdmin);

/**
 * @swagger
 * /api/v1/admin/inquiries:
 *   get:
 *     tags: ['Admin - Inquiries']
 *     summary: List contact inquiries
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [new, in_progress, responded, closed]
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: serviceInterest
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated list of inquiries
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
 *                     $ref: '#/components/schemas/ContactInquiry'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', handleAsync(listInquiriesHandler));

/**
 * @swagger
 * /api/v1/admin/inquiries/{id}:
 *   get:
 *     tags: ['Admin - Inquiries']
 *     summary: Get inquiry detail
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Inquiry detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ContactInquiry'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/:id', handleAsync(getInquiryHandler));

/**
 * @swagger
 * /api/v1/admin/inquiries/{id}/status:
 *   put:
 *     tags: ['Admin - Inquiries']
 *     summary: Update inquiry status
 *     security:
 *       - BearerAuth: []
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
 *             $ref: '#/components/schemas/InquiryStatusUpdateRequest'
 *     responses:
 *       200:
 *         description: Updated inquiry
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ContactInquiry'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Invalid status transition
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/:id/status', handleAsync(updateInquiryStatusHandler));

export default router;
