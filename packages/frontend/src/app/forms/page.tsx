'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../../lib/api';
import type { FormTemplate } from '@adria/shared';

export default function FormsLandingPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['forms'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: FormTemplate[] }>('/api/v1/forms');
      return response.data.data;
    },
  });

  const palette = {
    bg: 'bg-gradient-to-br from-[#0f0e0c] via-[#1b1610] to-[#2a241c]',
    card: 'bg-white/5 border border-[#2f271c]',
    accent: '#c19a5d',
  };

  return (
    <main className={`min-h-screen ${palette.bg} text-[#f6f0e8]`}>
      <div className="max-w-6xl mx-auto px-6 py-16 space-y-10">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.22em] text-[#c19a5d]">
            Intake Forms
          </p>
          <h1 className="text-4xl font-semibold">
            Choose a tailored intake to share your styling needs.
          </h1>
          <p className="text-[#d4c5b4] max-w-3xl">
            Each form routes directly to the Adria Cross team with spam protection,
            versioned templates, and admin follow-up workflows.
          </p>
        </header>

        {isLoading && <p>Loading forms…</p>}
        {error && (
          <p className="text-red-200">
            Unable to load forms right now. Please refresh in a moment.
          </p>
        )}

        <section className="grid gap-6 md:grid-cols-2">
          {(data || []).map((template) => (
            <article
              key={template.id}
              className={`${palette.card} rounded-2xl p-6 shadow-lg hover:border-[#c19a5d] transition-colors`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold">{template.name}</h2>
                  {template.description && (
                    <p className="text-sm text-[#c7b9a6]">{template.description}</p>
                  )}
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-[#c19a5d]/15 text-[#f6f0e8] border border-[#c19a5d]/30">
                  v{template.version}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-[#c7b9a6]">
                <span>{template.fields.length} inputs</span>
                <Link
                  href={`/forms/${template.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#c19a5d] text-[#0f0e0c] font-semibold shadow-md hover:bg-[#b18746]"
                >
                  Start form
                </Link>
              </div>
            </article>
          ))}
          {!isLoading && (data?.length ?? 0) === 0 && (
            <p className="text-sm text-[#c7b9a6]">No active forms are available.</p>
          )}
        </section>
      </div>
    </main>
  );
}
