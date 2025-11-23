'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { apiClient } from '../../lib/api';
import { useRecaptcha } from '../../lib/useRecaptcha';

const formSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  phone: z
    .string()
    .regex(/^[0-9+()\-\s.]{7,20}$/, 'Enter a valid phone number')
    .optional()
    .or(z.literal('')),
  serviceInterest: z.string().max(120).optional(),
  message: z.string().min(10, 'Tell us a bit more (10+ characters)'),
});

type FormValues = z.infer<typeof formSchema>;

const serviceOptions = [
  'Wardrobe Overhaul',
  'Closet Edit',
  'Event Styling',
  'Virtual Styling',
  'Not sure yet',
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#fdfcfb] via-[#f8f3e7] to-[#f1e7d9] text-[#2e2a25]">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-2 items-start">
          <div className="space-y-6">
            <p className="uppercase tracking-[0.2em] text-sm text-[#a0742a]">
              Sprint 4 · Contact & Inquiry
            </p>
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight text-[#2d261c]">
              Start the conversation with a tailored styling intake.
            </h1>
            <p className="text-lg text-[#4c4337] leading-relaxed">
              Tell us what you&apos;re looking for, and we&apos;ll respond within one
              business day. All submissions are protected with reCAPTCHA and rate
              limiting to keep your experience smooth.
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                'Spam-safe (reCAPTCHA + rate limits)',
                'Secure API + encrypted transport',
                'Admin follow-up workflow',
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-white/80 px-4 py-2 text-sm shadow-sm border border-[#e6d9c7]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
          <ContactForm />
        </div>
      </div>
    </main>
  );
}

function ContactForm() {
  const inputClasses =
    'w-full rounded-lg border border-[#e6d9c7] bg-white/90 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c19a5d] focus:border-[#c19a5d] placeholder:text-[#a08f7c]';
  const { ready, error: recaptchaError, executeRecaptcha } = useRecaptcha();
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(
    null
  );
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      serviceInterest: 'Wardrobe Overhaul',
      message: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setStatus(null);
    try {
      const recaptchaToken = await executeRecaptcha('contact_submit');
      await apiClient.post('/api/v1/contact/submit', {
        ...values,
        phone: values.phone || undefined,
        recaptchaToken,
      });
      setStatus({
        ok: true,
        message: 'Thanks! Your inquiry was received. Expect a reply within one business day.',
      });
      reset({
        fullName: '',
        email: '',
        phone: '',
        serviceInterest: 'Wardrobe Overhaul',
        message: '',
      });
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Unable to submit right now. Please try again shortly.';
      setStatus({ ok: false, message });
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-[#e6d9c7] p-6 md:p-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-[#a0742a]">
            Contact
          </p>
          <h2 className="text-2xl font-semibold text-[#2d261c]">
            Tell us about your styling needs
          </h2>
        </div>
        <div className="text-xs text-[#7a715f]">
          {ready ? 'reCAPTCHA ready' : 'Loading reCAPTCHA…'}
        </div>
      </div>
      {recaptchaError && (
        <p className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
          {recaptchaError}
        </p>
      )}
      {status && (
        <p
          className={`mb-4 text-sm rounded px-3 py-2 border ${
            status.ok
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}
        >
          {status.message}
        </p>
      )}
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Full name"
            error={errors.fullName?.message}
            input={
              <input
                type="text"
                className={inputClasses}
                placeholder="Jordan Parker"
                {...register('fullName')}
              />
            }
          />
          <Field
            label="Email"
            error={errors.email?.message}
            input={
              <input
                type="email"
                className={inputClasses}
                placeholder="you@example.com"
                {...register('email')}
              />
            }
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Phone (optional)"
            error={errors.phone?.message}
            input={
              <input
                type="tel"
                className={inputClasses}
                placeholder="+1 555-123-4567"
                {...register('phone')}
              />
            }
          />
          <Field
            label="Service interest"
            error={errors.serviceInterest?.message}
            input={
              <select className={inputClasses} {...register('serviceInterest')}>
                {serviceOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            }
          />
        </div>
        <Field
          label="How can we help?"
          error={errors.message?.message}
          input={
            <textarea
              className={`${inputClasses} min-h-[140px]`}
              placeholder="Share a bit about your goals, timeline, and any preferences."
              {...register('message')}
            />
          }
        />
        <div className="flex items-center justify-between text-sm text-[#6c6353]">
          <span>We respond within one business day. All fields are encrypted in transit.</span>
          <span className="text-[#a0742a]">Rate limit: 3 submissions/hour</span>
        </div>
        <button
          type="submit"
          disabled={isSubmitting || !ready || !!recaptchaError}
          className="w-full bg-[#2d261c] text-white py-3 rounded-xl font-semibold shadow-md hover:bg-[#1f1912] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Sending…' : 'Submit inquiry'}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  error,
  input,
}: {
  label: string;
  error?: string;
  input: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-[#2d261c] space-y-2">
      <span>{label}</span>
      {input}
      {error && <p className="text-xs text-red-700">{error}</p>}
    </label>
  );
}
