import { slugify } from '@adria/shared';
import { Request, Response } from 'express';
import { z } from 'zod';

import prisma from '../lib/prisma';
import type { AuthenticatedRequest } from '../middleware/authMiddleware';
import { parsePagination } from '../utils/pagination';

const serviceSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().min(10).max(2000),
  durationMinutes: z.number().int().min(15).max(480),
  priceCents: z.number().int().min(0),
  active: z.boolean().optional(),
});

const serviceUpdateSchema = serviceSchema.partial();

export async function listServicesHandler(req: Request, res: Response) {
  const pagination = parsePagination(req.query, {
    defaultSortBy: 'createdAt',
    allowed: ['createdAt', 'name'],
  });

  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where: { active: true },
      orderBy: { [pagination.sortBy]: pagination.sortOrder },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.service.count({ where: { active: true } }),
  ]);

  return res.status(200).json({
    success: true,
    data: services,
    pagination: buildPaginationMeta(pagination, total),
  });
}

export async function getServiceByIdHandler(req: Request, res: Response) {
  const { id } = req.params;

  const service = await prisma.service.findUnique({
    where: { id },
  });

  if (!service || !service.active) {
    return res.status(404).json({
      success: false,
      message: 'Service not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: service,
  });
}

export async function getServiceBySlugHandler(req: Request, res: Response) {
  const { slug } = req.params;

  const service = await prisma.service.findUnique({
    where: { slug },
  });

  if (!service || !service.active) {
    return res.status(404).json({
      success: false,
      message: 'Service not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: service,
  });
}

export async function createServiceHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  const parseResult = serviceSchema.safeParse(normalizeServiceBody(req.body));
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input',
      errors: parseResult.error.flatten(),
    });
  }

  const data = parseResult.data;
  const newSlug = slugify(data.name);

  const existing = await prisma.service.findUnique({ where: { slug: newSlug } });
  if (existing) {
    return res.status(409).json({
      success: false,
      message: 'A service with this name/slug already exists',
    });
  }

  const created = await prisma.service.create({
    data: {
      name: data.name,
      slug: newSlug,
      description: data.description,
      durationMinutes: data.durationMinutes,
      priceCents: data.priceCents,
      active: data.active ?? true,
    },
  });

  return res.status(201).json({
    success: true,
    data: created,
  });
}

export async function updateServiceHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  const { id } = req.params;
  const parseResult = serviceUpdateSchema.safeParse(
    normalizeServiceBody(req.body)
  );
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input',
      errors: parseResult.error.flatten(),
    });
  }

  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({
      success: false,
      message: 'Service not found',
    });
  }

  let newSlug = existing.slug;
  if (parseResult.data.name) {
    newSlug = slugify(parseResult.data.name);
    const conflict = await prisma.service.findUnique({ where: { slug: newSlug } });
    if (conflict && conflict.id !== id) {
      return res.status(409).json({
        success: false,
        message: 'A service with this name/slug already exists',
      });
    }
  }

  const updated = await prisma.service.update({
    where: { id },
    data: {
      ...parseResult.data,
      slug: newSlug,
    },
  });

  return res.status(200).json({
    success: true,
    data: updated,
  });
}

export async function deleteServiceHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  const { id } = req.params;

  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({
      success: false,
      message: 'Service not found',
    });
  }

  await prisma.service.delete({ where: { id } });

  return res.status(200).json({
    success: true,
    message: 'Service deleted',
  });
}

function normalizeServiceBody(body: unknown) {
  const asRecord = body as Record<string, unknown>;
  return {
    name: typeof asRecord.name === 'string' ? asRecord.name.trim() : asRecord.name,
    description:
      typeof asRecord.description === 'string'
        ? asRecord.description.trim()
        : asRecord.description,
    durationMinutes: coerceNumber(asRecord.durationMinutes),
    priceCents: coerceNumber(asRecord.priceCents),
    active: typeof asRecord.active === 'boolean' ? asRecord.active : undefined,
  };
}

function coerceNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = Number(value);
    return Number.isFinite(num) ? num : undefined;
  }
  return undefined;
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
