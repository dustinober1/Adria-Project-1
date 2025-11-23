'use client';

import type { FormField, FormTemplate } from '@adria/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';

import { apiClient } from '../../../lib/api';
import { useRecaptcha } from '../../../lib/useRecaptcha';

type FormValues = Record<string, unknown> & { email: string };
type FieldType = FormField['type'];

const buildSchema = (template?: FormTemplate) => {
  const shape: Record<string, z.ZodTypeAny> = {
    email: z.string().email('Provide an email so we can follow up'),
  };

  template?.fields.forEach((field) => {
    if (field.type === 'checkbox') {
      const base = z.array(z.string());
      shape[field.id] = field.validation?.required
        ? base.min(1, 'Select at least one option')
        : base.optional();
      return;
    }

    const allowEmpty = !field.validation?.required;
    let validator = z.string();
    if (field.validation?.required) {
      validator = validator.min(1, 'This field is required');
    } else {
      validator = validator.optional();
    }
    if (field.validation?.minLength) {
      validator = validator.min(field.validation.minLength);
    }
    if (field.validation?.maxLength) {
      validator = validator.max(field.validation.maxLength);
    }
    if (field.validation?.pattern) {
      validator = validator.regex(
        new RegExp(field.validation.pattern),
        'Invalid format'
      );
    }

    if (allowEmpty) {
      validator = validator.or(z.literal(''));
    }

    shape[field.id] = validator;
  });

  return z.object(shape);
};

const buildDefaults = (template?: FormTemplate): FormValues => {
  const defaults: FormValues = { email: '' };

  template?.fields.forEach((field) => {
    if (field.type === 'checkbox') {
      defaults[field.id] = [];
    } else {
      defaults[field.id] = '';
    }
  });

  return defaults;
};

export default function DynamicFormPage({
  params,
}: {
  params: { id: string };
}) {
  const { ready, error: recaptchaError, executeRecaptcha } = useRecaptcha();
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(
    null
  );

  const { data: template, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['form-template', params.id],
    queryFn: async () => {
      const response = await apiClient.get<{ data: FormTemplate }>(
        `/api/v1/forms/${params.id}`
      );
      return response.data.data;
    },
  });

  const schema = useMemo(() => buildSchema(template), [template]);
  const defaults = useMemo(() => buildDefaults(template), [template]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  const onSubmit = async (values: FormValues) => {
    setStatus(null);
    try {
      const recaptchaToken = await executeRecaptcha('form_submit');
      const { email, ...responses } = values;

      const sanitizedResponses = Object.fromEntries(
        Object.entries(responses).filter(([, value]) => {
          if (Array.isArray(value)) {
            return value.length > 0;
          }
          return typeof value === 'string' ? value.trim().length > 0 : true;
        })
      );

      await apiClient.post(`/api/v1/forms/${params.id}/submit`, {
        email,
        responses: sanitizedResponses,
        recaptchaToken,
      });

      setStatus({
        ok: true,
        message: 'Submission received. We will follow up shortly.',
      });
      reset(defaults);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Unable to submit right now. Please try again soon.';
      setStatus({ ok: false, message });
    }
  };

  const palette = {
    bg: 'bg-gradient-to-br from-[#fdf9f3] via-[#f6f0e6] to-[#e9ddc8]',
    panel: 'bg-white/90 border border-[#e6d9c7]',
    text: 'text-[#2f261c]',
    accent: '#c19a5d',
  };

  if (isLoading) {
    return (
      <main className={`min-h-screen ${palette.bg} ${palette.text}`}>
        <div className="max-w-5xl mx-auto px-6 py-20">
          <p className="text-lg">Loading form…</p>
        </div>
      </main>
    );
  }

  if (error || !template) {
    return (
      <main className={`min-h-screen ${palette.bg} ${palette.text}`}>
        <div className="max-w-5xl mx-auto px-6 py-20 space-y-4">
          <h1 className="text-4xl font-semibold">Form unavailable</h1>
          <p className="text-lg text-[#6c5f4b]">
            We could not load this form. Please refresh or try again later.
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded-lg bg-[#2f261c] text-white hover:bg-[#1f1912]"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className={`min-h-screen ${palette.bg} ${palette.text}`}>
      <div className="max-w-5xl mx-auto px-6 py-16 space-y-8">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.18em] text-[#a0742a]">
            Intake · {template.name}
          </p>
          <h1 className="text-4xl font-semibold leading-tight">
            {template.name}
          </h1>
          {template.description && (
            <p className="text-lg text-[#574b3a] max-w-3xl">
              {template.description}
            </p>
          )}
          <div className="flex gap-3 text-sm text-[#7a6c58]">
            <span>Version {template.version}</span>
            <span aria-hidden="true">•</span>
            <span>{ready ? 'reCAPTCHA ready' : 'Loading reCAPTCHA…'}</span>
            {isFetching && (
              <>
                <span aria-hidden="true">•</span>
                <span>Syncing template</span>
              </>
            )}
          </div>
        </header>

        <section
          className={`${palette.panel} backdrop-blur-sm rounded-2xl shadow-xl p-6 md:p-8 space-y-6`}
        >
          {recaptchaError && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
              {recaptchaError}
            </p>
          )}
          {status && (
            <p
              className={`rounded-lg px-3 py-2 text-sm border ${
                status.ok
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {status.message}
            </p>
          )}
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <Field
              label="Contact email"
              required
              error={errors.email?.message as string | undefined}
              input={
                <input
                  type="email"
                  className="w-full rounded-lg border border-[#e6d9c7] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c19a5d]"
                  placeholder="you@example.com"
                  {...register('email')}
                />
              }
            />

            <div className="grid gap-4">
              {template.fields.map((field) => (
                <Field
                  key={field.id}
                  label={field.label}
                  required={!!field.validation?.required}
                  helper={field.helperText}
                  error={
                    (errors as Record<string, { message?: string }>)[field.id]?.message
                  }
                  input={
                    <FormFieldInput
                      field={field}
                      register={register}
                      control={control}
                    />
                  }
                />
              ))}
            </div>

            <div className="flex items-center justify-between text-sm text-[#6c5f4b]">
              <span>We keep your responses private and secure.</span>
              <span className="text-[#a0742a]">
                Version {template.version} · reCAPTCHA protected
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !ready}
              className="w-full bg-[#2f261c] text-white py-3 rounded-xl font-semibold shadow-md hover:bg-[#1f1912] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Sending…' : 'Submit intake'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  required,
  helper,
  error,
  input,
}: {
  label: string;
  required?: boolean;
  helper?: string;
  error?: string;
  input: React.ReactNode;
}) {
  return (
    <label className="block text-sm space-y-2">
      <div className="flex items-center gap-2 font-semibold text-[#2f261c]">
        <span>{label}</span>
        {required && (
          <span className="text-[10px] uppercase tracking-[0.08em] text-[#a0742a]">
            Required
          </span>
        )}
      </div>
      {input}
      {helper && <p className="text-xs text-[#7a6c58]">{helper}</p>}
      {error && <p className="text-xs text-red-700">{error}</p>}
    </label>
  );
}

function FormFieldInput({
  field,
  register,
  control,
}: {
  field: FormField;
  register: ReturnType<typeof useForm>['register'];
  control: ReturnType<typeof useForm>['control'];
}) {
  const baseClasses =
    'w-full rounded-lg border border-[#e6d9c7] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c19a5d]';

  if (
    field.type === 'select' ||
    field.type === 'radio'
  ) {
    return (
      <div className="space-y-2">
        {field.type === 'select' ? (
          <select className={baseClasses} {...register(field.id)}>
            <option value="">Choose an option</option>
            {(field.options || []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <div className="space-y-2">
            {(field.options || []).map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-3 rounded-lg border border-[#e6d9c7] bg-white px-3 py-2 text-sm"
              >
                <input
                  type="radio"
                  value={option.value}
                  {...register(field.id)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (field.type === 'checkbox') {
    return (
      <Controller
        name={field.id}
        control={control}
        defaultValue={[]}
        render={({ field: controllerField }) => (
          <div className="space-y-2">
            {(field.options || []).map((option) => {
              const selected = (controllerField.value as string[]).includes(
                option.value
              );
              return (
                <label
                  key={option.value}
                  className="flex items-center gap-3 rounded-lg border border-[#e6d9c7] bg-white px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(e) => {
                      const current = new Set(controllerField.value as string[]);
                      if (e.target.checked) {
                        current.add(option.value);
                      } else {
                        current.delete(option.value);
                      }
                      controllerField.onChange(Array.from(current));
                    }}
                  />
                  <span>{option.label}</span>
                </label>
              );
            })}
          </div>
        )}
      />
    );
  }

  if (field.type === 'textarea') {
    return (
      <textarea
        className={`${baseClasses} min-h-[140px]`}
        placeholder={field.placeholder}
        {...register(field.id)}
      />
    );
  }

  return (
    <input
      type="text"
      className={baseClasses}
      placeholder={field.placeholder}
      {...register(field.id)}
    />
  );
}
