import { InquiryStatus } from '@prisma/client';
import { Request, Response } from 'express';
import { z } from 'zod';

import { logger } from '../lib/logger';
import prisma from '../lib/prisma';
import { sendInquiryNotifications } from '../services/emailService';
import { verifyRecaptcha } from '../utils/recaptcha';

const contactSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+()\-\s.]{7,20}$/)
    .optional(),
  message: z.string().trim().min(10).max(4000),
  serviceInterest: z.string().trim().max(120).optional(),
  recaptchaToken: z.string().min(10),
});

const DUPLICATE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export async function submitContactHandler(req: Request, res: Response) {
  const parseResult = contactSchema.safeParse(normalizePayload(req.body));
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input',
      errors: parseResult.error.flatten(),
    });
  }

  const { recaptchaToken, ...payload } = parseResult.data;

  const recaptcha = await verifyRecaptcha(recaptchaToken, req.ip);
  if (!recaptcha.success) {
    return res.status(429).json({
      success: false,
      message: 'Failed reCAPTCHA verification',
      score: recaptcha.score,
      errors: recaptcha.errors,
    });
  }

  const recentDuplicate = await prisma.contactInquiry.findFirst({
    where: {
      email: payload.email,
      message: payload.message,
      createdAt: {
        gte: new Date(Date.now() - DUPLICATE_WINDOW_MS),
      },
    },
  });

  if (recentDuplicate) {
    return res.status(429).json({
      success: false,
      message: 'Please wait before submitting another inquiry.',
    });
  }

  const created = await prisma.contactInquiry.create({
    data: {
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      serviceInterest: payload.serviceInterest,
      message: payload.message,
      status: InquiryStatus.NEW,
      metadata: {
        recaptchaScore: recaptcha.score,
        recaptchaAction: recaptcha.action,
        ip: req.ip,
        userAgent: req.get('user-agent') ?? 'unknown',
      },
    },
  });

  const notifications = await sendInquiryNotifications(created).catch(
    (error) => {
      logger.error('Failed to send inquiry notifications', {
        error,
        inquiryId: created.id,
      });
      return { visitor: { sent: false }, admin: { sent: false } };
    }
  );

  logger.info('Contact inquiry created', {
    inquiryId: created.id,
    status: created.status,
    recaptchaScore: recaptcha.score,
    recaptchaAction: recaptcha.action,
    notifications: {
      visitor: notifications.visitor.sent,
      admin: notifications.admin.sent,
    },
  });

  return res.status(201).json({
    success: true,
    data: {
      id: created.id,
      status: created.status,
      createdAt: created.createdAt,
      notifications: {
        visitor: notifications.visitor.sent,
        admin: notifications.admin.sent,
      },
    },
  });
}

function normalizePayload(body: unknown) {
  const asRecord = body as Record<string, unknown>;
  return {
    fullName:
      typeof asRecord.fullName === 'string'
        ? asRecord.fullName.trim()
        : asRecord.fullName,
    email:
      typeof asRecord.email === 'string'
        ? asRecord.email.trim().toLowerCase()
        : asRecord.email,
    phone:
      typeof asRecord.phone === 'string'
        ? asRecord.phone.trim()
        : asRecord.phone,
    message:
      typeof asRecord.message === 'string'
        ? asRecord.message.trim()
        : asRecord.message,
    serviceInterest:
      typeof asRecord.serviceInterest === 'string'
        ? asRecord.serviceInterest.trim()
        : asRecord.serviceInterest,
    recaptchaToken:
      typeof asRecord.recaptchaToken === 'string'
        ? asRecord.recaptchaToken
        : asRecord.recaptchaToken,
  };
}
