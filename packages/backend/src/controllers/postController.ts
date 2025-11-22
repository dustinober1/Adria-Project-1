import { slugify } from '@adria/shared';
import { Request, Response } from 'express';
import { BlogPostStatus } from '@prisma/client';
import { z } from 'zod';

import prisma from '../lib/prisma';
import type { AuthenticatedRequest } from '../middleware/authMiddleware';
import { parsePagination } from '../utils/pagination';

const statusEnum = z.enum(['draft', 'published', 'archived']);

const postSchema = z.object({
  title: z.string().min(2).max(180),
  excerpt: z.string().min(10).max(300),
  content: z.string().min(20),
  featuredImage: z.string().url().optional().or(z.literal('').transform(() => undefined)),
  status: statusEnum.optional(),
});

const postUpdateSchema = postSchema.partial();

export async function listPublishedPostsHandler(req: Request, res: Response) {
  const pagination = parsePagination(req.query, {
    defaultSortBy: 'publishedAt',
    allowed: ['publishedAt', 'createdAt', 'title'],
  });

  const where = { status: BlogPostStatus.PUBLISHED };

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: {
        [pagination.sortBy]: pagination.sortOrder,
      },
      skip: pagination.skip,
      take: pagination.limit,
      include: { author: { select: { id: true, email: true, firstName: true, lastName: true } } },
    }),
    prisma.blogPost.count({ where }),
  ]);

  return res.status(200).json({
    success: true,
    data: posts,
    pagination: buildPaginationMeta(pagination, total),
  });
}

export async function adminListPostsHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  const pagination = parsePagination(req.query, {
    defaultSortBy: 'createdAt',
    allowed: ['createdAt', 'publishedAt', 'title'],
  });
  const rawStatus = Array.isArray(req.query.status)
    ? req.query.status[0]
    : (req.query.status as unknown);
  const status = typeof rawStatus === 'string' ? rawStatus : undefined;

  const where =
    status && statusEnum.safeParse(status).success
      ? { status: toStatusEnum(status) }
      : undefined;

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { [pagination.sortBy]: pagination.sortOrder },
      skip: pagination.skip,
      take: pagination.limit,
      include: { author: { select: { id: true, email: true, firstName: true, lastName: true } } },
    }),
    prisma.blogPost.count({ where }),
  ]);

  return res.status(200).json({
    success: true,
    data: posts,
    pagination: buildPaginationMeta(pagination, total),
  });
}

export async function getPublishedPostHandler(req: Request, res: Response) {
  const { slug } = req.params;

  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: { author: { select: { id: true, email: true, firstName: true, lastName: true } } },
  });

  if (!post || post.status !== BlogPostStatus.PUBLISHED) {
    return res.status(404).json({
      success: false,
      message: 'Post not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: post,
  });
}

export async function createPostHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const parseResult = postSchema.safeParse(normalizePostBody(req.body));
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input',
      errors: parseResult.error.flatten(),
    });
  }

  const data = parseResult.data;
  const newSlug = slugify(data.title);

  const conflict = await prisma.blogPost.findUnique({ where: { slug: newSlug } });
  if (conflict) {
    return res.status(409).json({
      success: false,
      message: 'A post with this title/slug already exists',
    });
  }

  const status = toStatusEnum(data.status ?? 'draft');
  const created = await prisma.blogPost.create({
    data: {
      title: data.title,
      slug: newSlug,
      excerpt: data.excerpt,
      content: data.content,
      featuredImage: data.featuredImage,
      status,
      publishedAt: status === BlogPostStatus.PUBLISHED ? new Date() : null,
      authorId: req.user.id,
    },
    include: { author: { select: { id: true, email: true, firstName: true, lastName: true } } },
  });

  return res.status(201).json({
    success: true,
    data: created,
  });
}

export async function updatePostHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { id } = req.params;
  const parseResult = postUpdateSchema.safeParse(normalizePostBody(req.body));
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input',
      errors: parseResult.error.flatten(),
    });
  }

  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({
      success: false,
      message: 'Post not found',
    });
  }

  let newSlug = existing.slug;
  if (parseResult.data.title) {
    newSlug = slugify(parseResult.data.title);
    const conflict = await prisma.blogPost.findUnique({ where: { slug: newSlug } });
    if (conflict && conflict.id !== id) {
      return res.status(409).json({
        success: false,
        message: 'A post with this title/slug already exists',
      });
    }
  }

  const newStatus = parseResult.data.status
    ? toStatusEnum(parseResult.data.status)
    : existing.status;
  const publishedAt =
    newStatus === BlogPostStatus.PUBLISHED
      ? existing.publishedAt ?? new Date()
      : null;

  const updated = await prisma.blogPost.update({
    where: { id },
    data: {
      ...parseResult.data,
      slug: newSlug,
      status: newStatus,
      publishedAt,
    },
    include: { author: { select: { id: true, email: true, firstName: true, lastName: true } } },
  });

  return res.status(200).json({
    success: true,
    data: updated,
  });
}

export async function updatePostStatusHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  const { id } = req.params;
  const statusInput = (req.body as { status?: string }).status;
  const parsedStatus = statusEnum.safeParse(statusInput);
  if (!parsedStatus.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status',
    });
  }

  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Post not found',
    });
  }

  const newStatus = toStatusEnum(parsedStatus.data);
  const publishedAt =
    newStatus === BlogPostStatus.PUBLISHED
      ? post.publishedAt ?? new Date()
      : null;

  const updated = await prisma.blogPost.update({
    where: { id },
    data: { status: newStatus, publishedAt },
    include: { author: { select: { id: true, email: true, firstName: true, lastName: true } } },
  });

  return res.status(200).json({
    success: true,
    data: updated,
  });
}

export async function deletePostHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  const { id } = req.params;

  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({
      success: false,
      message: 'Post not found',
    });
  }

  await prisma.blogPost.delete({ where: { id } });

  return res.status(200).json({
    success: true,
    message: 'Post deleted',
  });
}

function normalizePostBody(body: unknown) {
  const asRecord = body as Record<string, unknown>;
  return {
    title: typeof asRecord.title === 'string' ? asRecord.title.trim() : asRecord.title,
    excerpt:
      typeof asRecord.excerpt === 'string'
        ? asRecord.excerpt.trim()
        : asRecord.excerpt,
    content:
      typeof asRecord.content === 'string'
        ? asRecord.content.trim()
        : asRecord.content,
    featuredImage:
      typeof asRecord.featuredImage === 'string'
        ? asRecord.featuredImage.trim()
        : undefined,
    status:
      typeof asRecord.status === 'string'
        ? (asRecord.status.toLowerCase() as string)
        : undefined,
  };
}

function toStatusEnum(status: string): BlogPostStatus {
  switch (status.toLowerCase()) {
    case 'published':
      return BlogPostStatus.PUBLISHED;
    case 'archived':
      return BlogPostStatus.ARCHIVED;
    default:
      return BlogPostStatus.DRAFT;
  }
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
