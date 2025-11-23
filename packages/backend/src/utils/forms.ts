import type { FormField } from '@adria/shared';
import { FormFieldType } from '@adria/shared';
import { z } from 'zod';

const formFieldValidationSchema = z
  .object({
    required: z.boolean().optional(),
    minLength: z.number().int().min(0).max(5000).optional(),
    maxLength: z.number().int().min(1).max(5000).optional(),
    pattern: z.string().max(200).optional(),
  })
  .refine(
    (value) =>
      value.minLength === undefined ||
      value.maxLength === undefined ||
      value.maxLength >= value.minLength,
    {
      message: 'maxLength must be greater than or equal to minLength',
      path: ['maxLength'],
    }
  );

const optionSchema = z.object({
  label: z.string().trim().min(1).max(120),
  value: z.string().trim().min(1).max(120),
});

const baseFieldSchema = z.object({
  id: z.string().trim().min(1).max(64),
  label: z.string().trim().min(1).max(120),
  type: z.nativeEnum(FormFieldType),
  placeholder: z.string().trim().max(200).optional(),
  helperText: z.string().trim().max(240).optional(),
  options: z.array(optionSchema).optional(),
  validation: formFieldValidationSchema.optional(),
});

export const formFieldSchema = baseFieldSchema.superRefine((field, ctx) => {
  if (
    (field.type === FormFieldType.SELECT ||
      field.type === FormFieldType.RADIO ||
      field.type === FormFieldType.CHECKBOX) &&
    (!field.options || field.options.length === 0)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Options are required for select, radio, and checkbox fields',
      path: ['options'],
    });
  }

  if (field.validation?.pattern) {
    try {
      // eslint-disable-next-line no-new
      new RegExp(field.validation.pattern);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid regex pattern',
        path: ['validation', 'pattern'],
      });
    }
  }
});

const uniqueFieldIds = (fields: FormField[]): boolean => {
  const ids = new Set<string>();
  for (const field of fields) {
    if (ids.has(field.id)) return false;
    ids.add(field.id);
  }
  return true;
};

const formTemplateBaseSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional(),
  serviceId: z.string().trim().uuid().optional(),
  active: z.boolean().optional(),
  fields: z
    .array(formFieldSchema)
    .min(1)
    .max(50)
    .refine(uniqueFieldIds, { message: 'Field IDs must be unique' }),
});

export const formTemplateInputSchema = formTemplateBaseSchema;

export const formTemplateUpdateSchema = formTemplateBaseSchema.partial().extend({
  fields: formTemplateBaseSchema.shape.fields.optional(),
});

export function normalizeTemplatePayload(body: unknown) {
  const asRecord = body as Record<string, unknown>;
  return {
    name:
      typeof asRecord.name === 'string' ? asRecord.name.trim() : asRecord.name,
    description:
      typeof asRecord.description === 'string'
        ? asRecord.description.trim()
        : asRecord.description,
    serviceId:
      typeof asRecord.serviceId === 'string' && asRecord.serviceId.trim().length > 0
        ? asRecord.serviceId.trim()
        : undefined,
    active: typeof asRecord.active === 'boolean' ? asRecord.active : undefined,
    fields: Array.isArray(asRecord.fields)
      ? (asRecord.fields as unknown[]).map((field) =>
          normalizeField(field as FormField)
        )
      : undefined,
  };
}

function normalizeField(field: FormField): FormField {
  return {
    ...field,
    id: typeof field.id === 'string' ? field.id.trim() : field.id,
    label: typeof field.label === 'string' ? field.label.trim() : field.label,
    placeholder:
      typeof field.placeholder === 'string'
        ? field.placeholder.trim()
        : field.placeholder,
    helperText:
      typeof field.helperText === 'string'
        ? field.helperText.trim()
        : field.helperText,
    options: field.options?.map((opt) => ({
      label: typeof opt.label === 'string' ? opt.label.trim() : opt.label,
      value: typeof opt.value === 'string' ? opt.value.trim() : opt.value,
    })),
    validation: field.validation,
  };
}

type ValidationResult = {
  valid: boolean;
  errors: Record<string, string>;
  normalized: Record<string, unknown>;
};

export function validateSubmissionResponses(
  fields: FormField[],
  rawResponses: unknown
): ValidationResult {
  const safeResponses =
    rawResponses && typeof rawResponses === 'object' && !Array.isArray(rawResponses)
      ? (rawResponses as Record<string, unknown>)
      : {};

  const errors: Record<string, string> = {};
  const normalized: Record<string, unknown> = {};

  for (const field of fields) {
    const rawValue = safeResponses[field.id];

    if (
      rawValue === undefined ||
      rawValue === null ||
      (typeof rawValue === 'string' && rawValue.trim() === '')
    ) {
      if (field.validation?.required) {
        errors[field.id] = 'This field is required';
      }
      continue;
    }

    if (field.type === FormFieldType.CHECKBOX) {
      if (!Array.isArray(rawValue)) {
        errors[field.id] = 'Expected an array of values';
        continue;
      }

      const choices = rawValue
        .map((value) => (typeof value === 'string' ? value.trim() : value))
        .filter((value): value is string => typeof value === 'string' && value.length > 0);

      if (field.validation?.required && choices.length === 0) {
        errors[field.id] = 'Please choose at least one option';
        continue;
      }

      if (field.options) {
        const allowed = new Set(field.options.map((opt) => opt.value));
        const invalid = choices.filter((choice) => !allowed.has(choice));
        if (invalid.length > 0) {
          errors[field.id] = 'Contains invalid choices';
          continue;
        }
      }

      normalized[field.id] = Array.from(new Set(choices));
      continue;
    }

    if (typeof rawValue !== 'string') {
      errors[field.id] = 'Expected a string value';
      continue;
    }

    const value = rawValue.trim();
    if (field.validation?.required && value.length === 0) {
      errors[field.id] = 'This field is required';
      continue;
    }

    if (
      field.validation?.minLength !== undefined &&
      value.length < field.validation.minLength
    ) {
      errors[field.id] = `Must be at least ${field.validation.minLength} characters`;
      continue;
    }

    if (
      field.validation?.maxLength !== undefined &&
      value.length > field.validation.maxLength
    ) {
      errors[field.id] = `Must be at most ${field.validation.maxLength} characters`;
      continue;
    }

    if (field.validation?.pattern) {
      const regex = new RegExp(field.validation.pattern);
      if (!regex.test(value)) {
        errors[field.id] = 'Invalid format';
        continue;
      }
    }

    if (
      (field.type === FormFieldType.SELECT || field.type === FormFieldType.RADIO) &&
      field.options
    ) {
      const allowed = new Set(field.options.map((opt) => opt.value));
      if (!allowed.has(value)) {
        errors[field.id] = 'Invalid option selected';
        continue;
      }
    }

    normalized[field.id] = value;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    normalized,
  };
}
