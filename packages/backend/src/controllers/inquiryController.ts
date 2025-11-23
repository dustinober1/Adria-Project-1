import { InquiryStatus, Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { z } from 'zod';

import { parsePagination } from '../utils/pagination';
import prisma from '../lib/prisma';

const statusValues: Record<string, InquiryStatus> = {
  new: InquiryStatus.NEW,
  in_progress: InquiryStatus.IN_PROGRESS,
  responded: InquiryStatus.RESPONDED,
  closed: InquiryStatus.CLOSED,
};

const statusUpdateSchema = z.object({
  status: z.enum(['new', 'in_progress', 'responded', 'closed']),
  adminNotes: z.string().max(2000).optional(),
});

const allowedTransitions: Record<InquiryStatus, InquiryStatus[]> = {
  [InquiryStatus.NEW]: [
    InquiryStatus.IN_PROGRESS,
    InquiryStatus.RESPONDED,
    InquiryStatus.CLOSED,
  ],
  [InquiryStatus.IN_PROGRESS]: [InquiryStatus.RESPONDED, InquiryStatus.CLOSED],
  [InquiryStatus.RESPONDED]: [InquiryStatus.CLOSED],
  [InquiryStatus.CLOSED]: [],
};

export async function listInquiriesHandler(req: Request, res: Response) {
  const pagination = parsePagination(req.query, {
    defaultSortBy: 'createdAt',
    allowed: ['createdAt'],
  });

  const { status, dateFrom, dateTo, serviceInterest, search } = req.query;

  const where: Prisma.ContactInquiryWhereInput = {};

  if (status && typeof status === 'string') {
    const normalizedStatus = status.toLowerCase();
    if (statusValues[normalizedStatus]) {
      where.status = statusValues[normalizedStatus];
    }
  }

  if (serviceInterest && typeof serviceInterest === 'string') {
    where.serviceInterest = { equals: serviceInterest, mode: 'insensitive' };
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

  if (search && typeof search === 'string') {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [inquiries, total] = await Promise.all([
    prisma.contactInquiry.findMany({
      where,
      orderBy: { [pagination.sortBy]: pagination.sortOrder },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.contactInquiry.count({ where }),
  ]);

  return res.status(200).json({
    success: true,
    data: inquiries,
    pagination: buildPaginationMeta(pagination, total),
  });
}

export async function getInquiryHandler(req: Request, res: Response) {
  const { id } = req.params;

  const inquiry = await prisma.contactInquiry.findUnique({
    where: { id },
  });

  if (!inquiry) {
    return res.status(404).json({
      success: false,
      message: 'Inquiry not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: inquiry,
  });
}

export async function updateInquiryStatusHandler(
  req: Request,
  res: Response
) {
  const { id } = req.params;
  const parsed = statusUpdateSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input',
      errors: parsed.error.flatten(),
    });
  }

  const targetStatus = statusValues[parsed.data.status];
  const existing = await prisma.contactInquiry.findUnique({
    where: { id },
  });

  if (!existing) {
    return res.status(404).json({
      success: false,
      message: 'Inquiry not found',
    });
  }

  if (existing.status === targetStatus) {
    return res.status(200).json({
      success: true,
      data: existing,
    });
  }

  const allowed = allowedTransitions[existing.status];
  if (!allowed.includes(targetStatus)) {
    return res.status(409).json({
      success: false,
      message: `Status transition from ${existing.status.toLowerCase()} to ${parsed.data.status} is not allowed`,
    });
  }

  const updateData: Prisma.ContactInquiryUpdateInput = {
    status: targetStatus,
    adminNotes: parsed.data.adminNotes,
  };

  if (targetStatus === InquiryStatus.RESPONDED) {
    updateData.respondedAt = new Date();
  }
  if (targetStatus === InquiryStatus.CLOSED) {
    updateData.closedAt = new Date();
  }

  const updated = await prisma.contactInquiry.update({
    where: { id },
    data: updateData,
  });

  return res.status(200).json({
    success: true,
    data: updated,
  });
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
