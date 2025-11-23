import type { FormField } from '@adria/shared';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

import prisma from '../lib/prisma';
import {
  formTemplateInputSchema,
  formTemplateUpdateSchema,
  normalizeTemplatePayload,
} from '../utils/forms';

export async function listFormTemplatesHandler(req: Request, res: Response) {
  const { active } = req.query;
  const where: Prisma.FormTemplateWhereInput = {};

  if (typeof active === 'string') {
    if (active.toLowerCase() === 'true') where.active = true;
    if (active.toLowerCase() === 'false') where.active = false;
  }

  const templates = await prisma.formTemplate.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { submissions: true } } },
  });

  return res.status(200).json({
    success: true,
    data: templates,
  });
}

export async function getFormTemplateHandler(req: Request, res: Response) {
  const { id } = req.params;

  const template = await prisma.formTemplate.findUnique({
    where: { id },
    include: { _count: { select: { submissions: true } } },
  });

  if (!template) {
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

export async function createFormTemplateHandler(req: Request, res: Response) {
  const parsed = formTemplateInputSchema.safeParse(
    normalizeTemplatePayload(req.body)
  );

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid template payload',
      errors: parsed.error.flatten(),
    });
  }

  if (parsed.data.serviceId) {
    const service = await prisma.service.findUnique({
      where: { id: parsed.data.serviceId },
    });
    if (!service) {
      return res.status(400).json({
        success: false,
        message: 'Service not found for provided serviceId',
      });
    }
  }

  const created = await prisma.formTemplate.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      serviceId: parsed.data.serviceId,
      fields: parsed.data.fields as Prisma.InputJsonValue,
      active: parsed.data.active ?? true,
    },
  });

  return res.status(201).json({
    success: true,
    data: created,
  });
}

export async function updateFormTemplateHandler(req: Request, res: Response) {
  const { id } = req.params;
  const parsed = formTemplateUpdateSchema.safeParse(
    normalizeTemplatePayload(req.body)
  );

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid template payload',
      errors: parsed.error.flatten(),
    });
  }

  const existing = await prisma.formTemplate.findUnique({
    where: { id },
  });

  if (!existing) {
    return res.status(404).json({
      success: false,
      message: 'Form template not found',
    });
  }

  if (parsed.data.serviceId) {
    const service = await prisma.service.findUnique({
      where: { id: parsed.data.serviceId },
    });
    if (!service) {
      return res.status(400).json({
        success: false,
        message: 'Service not found for provided serviceId',
      });
    }
  }

  const existingFields = (existing.fields as unknown as FormField[]) ?? [];
  let nextVersion = existing.version;

  if (parsed.data.fields) {
    const hasSubmissions =
      (await prisma.formSubmission.count({
        where: { formTemplateId: id },
      })) > 0;

    if (hasSubmissions) {
      const existingIds = new Set(existingFields.map((f) => f.id));
      const incomingIds = new Set(parsed.data.fields.map((f) => f.id));
      const removed = Array.from(existingIds).filter(
        (fieldId: string) => !incomingIds.has(fieldId)
      );

      if (removed.length > 0) {
        return res.status(409).json({
          success: false,
          message:
            'Cannot remove existing fields from a template that already has submissions',
          removed,
        });
      }
    }

    const fieldsChanged =
      JSON.stringify(parsed.data.fields) !== JSON.stringify(existing.fields);
    if (fieldsChanged) {
      nextVersion = existing.version + 1;
    }
  }

  const updated = await prisma.formTemplate.update({
    where: { id },
    data: {
      name: parsed.data.name ?? existing.name,
      description: parsed.data.description ?? existing.description,
      serviceId:
        parsed.data.serviceId === undefined
          ? existing.serviceId
          : parsed.data.serviceId,
      fields:
        (parsed.data.fields as Prisma.InputJsonValue | undefined) ??
        (existing.fields as Prisma.InputJsonValue),
      active: parsed.data.active ?? existing.active,
      version: nextVersion,
    },
  });

  return res.status(200).json({
    success: true,
    data: updated,
  });
}

export async function deleteFormTemplateHandler(req: Request, res: Response) {
  const { id } = req.params;

  const existing = await prisma.formTemplate.findUnique({
    where: { id },
  });

  if (!existing) {
    return res.status(404).json({
      success: false,
      message: 'Form template not found',
    });
  }

  const updated = await prisma.formTemplate.update({
    where: { id },
    data: { active: false },
  });

  return res.status(200).json({
    success: true,
    data: updated,
  });
}
