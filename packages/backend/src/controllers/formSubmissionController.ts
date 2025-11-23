import type { FormField } from '@adria/shared';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { z } from 'zod';

import { logger } from '../lib/logger';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { sendFormSubmissionNotifications } from '../services/emailService';
import {
  validateSubmissionResponses,
} from '../utils/forms';
import { parsePagination } from '../utils/pagination';
import { verifyRecaptcha } from '../utils/recaptcha';

const submissionSchema = z.object({
  email: z.string().trim().email().optional(),
  responses: z.record(z.any()),
  recaptchaToken: z.string().min(10),
});

const DUPLICATE_WINDOW_MS = 5 * 60 * 1000;

export async function listPublicFormTemplatesHandler(
  _req: Request,
  res: Response
) {
  const templates = await prisma.formTemplate.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      description: true,
      version: true,
      fields: true,
    },
  });

  return res.status(200).json({
    success: true,
    data: templates,
  });
}

export async function getPublicFormTemplateHandler(
  req: Request,
  res: Response
) {
  const { id } = req.params;

  const template = await prisma.formTemplate.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      version: true,
      fields: true,
      active: true,
    },
  });

  if (!template || !template.active) {
    return res.status(404).json({
      success: false,
      message: 'Form template not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: template,
  });
}

export async function submitFormHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  const { id } = req.params;
  const parsed = submissionSchema.safeParse(normalizeSubmissionPayload(req.body));

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid submission payload',
      errors: parsed.error.flatten(),
    });
  }

  const template = await prisma.formTemplate.findUnique({
    where: { id },
  });

  if (!template || !template.active) {
    return res.status(404).json({
      success: false,
      message: 'Form template not found or inactive',
    });
  }

  const email = (parsed.data.email ?? req.user?.email)?.toLowerCase();
  if (!email && !req.user) {
    return res.status(400).json({
      success: false,
      message: 'Email is required for guest submissions',
    });
  }

  const recaptcha = await verifyRecaptcha(parsed.data.recaptchaToken, req.ip);
  if (!recaptcha.success) {
    return res.status(429).json({
      success: false,
      message: 'Failed reCAPTCHA verification',
      score: recaptcha.score,
      errors: recaptcha.errors,
    });
  }

  const fieldValidation = validateSubmissionResponses(
    template.fields as unknown as FormField[],
    parsed.data.responses
  );

  if (!fieldValidation.valid) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed for one or more fields',
      errors: fieldValidation.errors,
    });
  }

  const duplicateWhere: Prisma.FormSubmissionWhereInput = {
    formTemplateId: id,
    createdAt: {
      gte: new Date(Date.now() - DUPLICATE_WINDOW_MS),
    },
  };

  if (req.user) {
    duplicateWhere.userId = req.user.id;
  } else if (email) {
    duplicateWhere.email = email;
  }

  const duplicate = await prisma.formSubmission.findFirst({
    where: duplicateWhere,
  });

  if (duplicate) {
    return res.status(429).json({
      success: false,
      message: 'Please wait before submitting another entry for this form.',
    });
  }

  const created = await prisma.formSubmission.create({
    data: {
      formTemplateId: template.id,
      templateVersion: template.version,
      userId: req.user?.id,
      email,
      responses: fieldValidation.normalized as Prisma.InputJsonValue,
      metadata: {
        recaptchaScore: recaptcha.score,
        recaptchaAction: recaptcha.action,
        ip: req.ip,
        userAgent: req.get('user-agent') ?? 'unknown',
      } as Prisma.InputJsonValue,
    },
  });

  const notifications = await sendFormSubmissionNotifications(created, template).catch(
    (error) => {
      logger.error('Failed to send form submission notifications', {
        error,
        submissionId: created.id,
      });
      return { visitor: { sent: false }, admin: { sent: false } };
    }
  );

  logger.info('Form submission received', {
    templateId: template.id,
    submissionId: created.id,
    recaptchaScore: recaptcha.score,
    userId: req.user?.id,
  });

  return res.status(201).json({
    success: true,
    data: {
      id: created.id,
      templateId: template.id,
      status: 'received',
      createdAt: created.createdAt,
      notifications: {
        visitor: notifications.visitor.sent,
        admin: notifications.admin.sent,
      },
    },
  });
}

export async function listFormSubmissionsHandler(req: Request, res: Response) {
  const pagination = parsePagination(req.query, {
    defaultSortBy: 'createdAt',
    allowed: ['createdAt'],
  });

  const { templateId, email, dateFrom, dateTo } = req.query;

  const where: Prisma.FormSubmissionWhereInput = {};

  if (templateId && typeof templateId === 'string') {
    where.formTemplateId = templateId;
  }

  if (email && typeof email === 'string') {
    where.email = { contains: email, mode: 'insensitive' };
  }

  const parsedDateFrom = parseDate(dateFrom);
  const parsedDateTo = parseDate(dateTo);

  if (parsedDateFrom || parsedDateTo) {
    where.createdAt = {};
    if (parsedDateFrom) {
      where.createdAt.gte = parsedDateFrom;
    }
    if (parsedDateTo) {
      where.createdAt.lte = parsedDateTo;
    }
  }

  const [submissions, total] = await Promise.all([
    prisma.formSubmission.findMany({
      where,
      orderBy: { [pagination.sortBy]: pagination.sortOrder },
      skip: pagination.skip,
      take: pagination.limit,
      include: {
        formTemplate: {
          select: { id: true, name: true, version: true },
        },
      },
    }),
    prisma.formSubmission.count({ where }),
  ]);

  return res.status(200).json({
    success: true,
    data: submissions,
    pagination: buildPaginationMeta(pagination, total),
  });
}

export async function getFormSubmissionHandler(req: Request, res: Response) {
  const { id } = req.params;
  const submission = await prisma.formSubmission.findUnique({
    where: { id },
    include: {
      formTemplate: {
        select: { id: true, name: true, version: true, fields: true },
      },
      user: { select: { id: true, email: true } },
    },
  });

  if (!submission) {
    return res.status(404).json({
      success: false,
      message: 'Form submission not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: submission,
  });
}

function normalizeSubmissionPayload(body: unknown) {
  const asRecord = body as Record<string, unknown>;
  return {
    email:
      typeof asRecord.email === 'string'
        ? asRecord.email.trim().toLowerCase()
        : asRecord.email,
    recaptchaToken:
      typeof asRecord.recaptchaToken === 'string'
        ? asRecord.recaptchaToken
        : asRecord.recaptchaToken,
    responses: asRecord.responses ?? {},
  };
}

function parseDate(value: unknown): Date | undefined {
  if (typeof value !== 'string') return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function buildPaginationMeta(
  pagination: ReturnType<typeof parsePagination>,
  total: number
) {
  const totalPages = Math.max(1, Math.ceil(total / pagination.limit));
  return {
    page: pagination.page,
    limit: pagination.limit,
    total,
    totalPages,
  };
}
