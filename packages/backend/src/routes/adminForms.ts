import { NextFunction, Request, Response, Router } from 'express';

import {
  authenticateToken,
  ensureAuthenticated,
} from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/roleGuard';
import {
  createFormTemplateHandler,
  deleteFormTemplateHandler,
  getFormTemplateHandler,
  listFormTemplatesHandler,
  updateFormTemplateHandler,
} from '../controllers/formTemplateController';
import {
  getFormSubmissionHandler,
  listFormSubmissionsHandler,
} from '../controllers/formSubmissionController';

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
 * /api/v1/admin/forms/templates:
 *   get:
 *     tags: ['Admin - Forms']
 *     summary: List form templates
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of templates
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
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/templates', handleAsync(listFormTemplatesHandler));

/**
 * @swagger
 * /api/v1/admin/forms/templates:
 *   post:
 *     tags: ['Admin - Forms']
 *     summary: Create a new form template
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FormTemplateRequest'
 *     responses:
 *       201:
 *         description: Created template
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/FormTemplate'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/templates', handleAsync(createFormTemplateHandler));

/**
 * @swagger
 * /api/v1/admin/forms/templates/{id}:
 *   get:
 *     tags: ['Admin - Forms']
 *     summary: Get template detail
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
 *         description: Template detail
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
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/templates/:id', handleAsync(getFormTemplateHandler));

/**
 * @swagger
 * /api/v1/admin/forms/templates/{id}:
 *   put:
 *     tags: ['Admin - Forms']
 *     summary: Update a form template
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
 *             $ref: '#/components/schemas/FormTemplateRequest'
 *     responses:
 *       200:
 *         description: Updated template
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/FormTemplate'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Update not allowed due to existing submissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/templates/:id', handleAsync(updateFormTemplateHandler));

/**
 * @swagger
 * /api/v1/admin/forms/templates/{id}:
 *   delete:
 *     tags: ['Admin - Forms']
 *     summary: Deactivate a form template
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
 *         description: Template deactivated
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
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.delete('/templates/:id', handleAsync(deleteFormTemplateHandler));

/**
 * @swagger
 * /api/v1/admin/forms/submissions:
 *   get:
 *     tags: ['Admin - Forms']
 *     summary: List form submissions
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: templateId
 *         schema:
 *           type: string
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: Paginated submissions
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
 *                     $ref: '#/components/schemas/FormSubmission'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/submissions', handleAsync(listFormSubmissionsHandler));

/**
 * @swagger
 * /api/v1/admin/forms/submissions/{id}:
 *   get:
 *     tags: ['Admin - Forms']
 *     summary: Get a submission
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
 *         description: Submission detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/FormSubmission'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/submissions/:id', handleAsync(getFormSubmissionHandler));

export default router;
