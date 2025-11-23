'use client';

import type { FormField, FormTemplate } from '@adria/shared';
import { slugify } from '@adria/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { apiClient, withAuth } from '../../../lib/api';

type AdminTemplate = FormTemplate & { _count?: { submissions: number } };

type AdminSubmission = {
  id: string;
  email?: string | null;
  createdAt: string;
  responses: Record<string, unknown>;
  templateVersion: number;
  formTemplate?: { id: string; name: string; version: number };
};

type TemplateDraft = {
  name: string;
  description?: string;
  active: boolean;
  fields: FormField[];
};

type FieldType = FormField['type'];

const emptyDraft: TemplateDraft = {
  name: '',
  description: '',
  active: true,
  fields: [],
};

export default function AdminFormsPage() {
  const queryClient = useQueryClient();
  const [token, setToken] = useState('');
  const [selected, setSelected] = useState<AdminTemplate | null>(null);
  const [draft, setDraft] = useState<TemplateDraft>(emptyDraft);
  const [status, setStatus] = useState<string | null>(null);
  const [newField, setNewField] = useState<{
    label: string;
    type: FieldType;
    required: boolean;
    options: string;
    helperText: string;
    minLength?: number;
    maxLength?: number;
  }>({
    label: '',
    type: 'text',
    required: true,
    options: '',
    helperText: '',
  });

  useEffect(() => {
    const saved = localStorage.getItem('adria_admin_token');
    if (saved) setToken(saved);
  }, []);

  const templatesQuery = useQuery({
    queryKey: ['admin-form-templates', token],
    queryFn: async () => {
      const response = await apiClient.get<{ data: AdminTemplate[] }>(
        '/api/v1/admin/forms/templates',
        withAuth(token)
      );
      return response.data.data;
    },
    enabled: !!token,
  });

  const submissionsQuery = useQuery({
    queryKey: ['admin-form-submissions', selected?.id, token],
    queryFn: async () => {
      const response = await apiClient.get<{
        data: AdminSubmission[];
      }>('/api/v1/admin/forms/submissions', {
        params: { templateId: selected?.id, limit: 5 },
        ...withAuth(token),
      });
      return response.data.data;
    },
    enabled: !!token && !!selected,
  });

  useEffect(() => {
    if (selected) {
      setDraft({
        name: selected.name,
        description: selected.description ?? '',
        active: selected.active,
        fields: (selected.fields as FormField[]) ?? [],
      });
    } else {
      setDraft(emptyDraft);
    }
  }, [selected]);

  const saveTemplate = useMutation({
    mutationFn: async (payload: TemplateDraft) => {
      if (!token) throw new Error('Token required');

      if (selected) {
        const response = await apiClient.put<{ data: AdminTemplate }>(
          `/api/v1/admin/forms/templates/${selected.id}`,
          payload,
          withAuth(token)
        );
        return response.data.data;
      }

      const response = await apiClient.post<{ data: AdminTemplate }>(
        '/api/v1/admin/forms/templates',
        payload,
        withAuth(token)
      );
      return response.data.data;
    },
    onSuccess: (template) => {
      setSelected(template ?? null);
      void queryClient.invalidateQueries({
        queryKey: ['admin-form-templates', token],
      });
      setStatus('Saved template changes.');
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Unable to save template.';
      setStatus(message);
    },
  });

  const deactivateTemplate = useMutation({
    mutationFn: async () => {
      if (!selected) return;
      await apiClient.delete(`/api/v1/admin/forms/templates/${selected.id}`, withAuth(token));
    },
    onSuccess: () => {
      setSelected(null);
      void queryClient.invalidateQueries({
        queryKey: ['admin-form-templates', token],
      });
      setStatus('Template deactivated.');
    },
  });

  const palette = useMemo(
    () => ({
      bg: 'bg-[#0b0a09]',
      card: 'bg-[#14100c] border border-[#241c12]',
      accent: '#c19a5d',
    }),
    []
  );

  const handleAddField = () => {
    if (!newField.label.trim()) {
      setStatus('Field label is required.');
      return;
    }

    if (
      (newField.type === 'select' ||
        newField.type === 'radio' ||
        newField.type === 'checkbox') &&
      newField.options.trim().length === 0
    ) {
      setStatus('Options are required for select, radio, and checkbox fields.');
      return;
    }

    const baseId = slugify(newField.label) || `field-${draft.fields.length + 1}`;
    const uniqueId = draft.fields.some((f) => f.id === baseId)
      ? `${baseId}-${draft.fields.length + 1}`
      : baseId;

    const options =
      newField.type === 'select' ||
      newField.type === 'radio' ||
      newField.type === 'checkbox'
        ? newField.options
            .split(',')
            .map((opt) => opt.trim())
            .filter(Boolean)
            .map((opt) => ({ label: opt, value: opt.toLowerCase().replace(/\s+/g, '-') }))
        : undefined;

    const field: FormField = {
      id: uniqueId,
      label: newField.label.trim(),
      type: newField.type,
      helperText: newField.helperText || undefined,
      options,
      validation: {
        required: newField.required,
        minLength: newField.minLength,
        maxLength: newField.maxLength,
      },
    };

    setDraft((prev) => ({ ...prev, fields: [...prev.fields, field] }));
    setNewField({
      label: '',
      type: 'text',
      required: true,
      options: '',
      helperText: '',
    });
    setStatus(null);
  };

  const handleRemoveField = (fieldId: string) => {
    setDraft((prev) => ({
      ...prev,
      fields: prev.fields.filter((field) => field.id !== fieldId),
    }));
  };

  const handleSave = () => {
    if (!draft.name.trim() || draft.fields.length === 0) {
      setStatus('Name and at least one field are required.');
      return;
    }
    saveTemplate.mutate(draft);
  };

  return (
    <main className={`${palette.bg} min-h-screen text-[#f6f0e8]`}>
      <div className="max-w-6xl mx-auto px-6 py-16 space-y-8">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.2em] text-[#c19a5d]">
            Admin · Forms
          </p>
          <h1 className="text-4xl font-semibold">
            Manage intake form templates and submissions.
          </h1>
          <p className="text-[#d4c5b4] max-w-3xl">
            Versioned templates with guarded updates. Add new fields safely, deactivate
            outdated forms, and monitor submissions in real time.
          </p>
        </header>

        <section className={`${palette.card} rounded-2xl p-6 shadow-xl space-y-6`}>
          <div className="grid gap-4 md:grid-cols-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm text-[#d4c5b4] mb-1">Admin token</label>
              <input
                type="password"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  localStorage.setItem('adria_admin_token', e.target.value);
                }}
                placeholder="Paste admin JWT"
                className="w-full rounded-lg border border-[#2f271b] bg-[#0f0d0b] px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c19a5d]"
              />
              <p className="text-xs text-[#9a8b78] mt-1">
                Tokens from /auth/login or /auth/register (admin/super_admin).
              </p>
            </div>
            <button
              onClick={() => templatesQuery.refetch()}
              disabled={!token}
              className="h-12 rounded-lg bg-[#c19a5d] text-[#0f0e0c] font-semibold shadow-md hover:bg-[#b18846] disabled:opacity-60"
            >
              Refresh
            </button>
            <div className="text-right text-xs text-[#9a8b78]">
              {templatesQuery.isFetching ? 'Syncing…' : 'Live data'}
            </div>
          </div>

          {status && (
            <p className="text-sm text-[#d4c5b4] bg-[#1c1510] border border-[#2f271b] rounded-lg px-3 py-2">
              {status}
            </p>
          )}

          {!token && (
            <p className="text-[#d99058] bg-[#2a1f13] border border-[#3a2a19] rounded-lg px-4 py-3">
              Provide an admin token to load and edit form templates.
            </p>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Templates</h3>
                <button
                  onClick={() => setSelected(null)}
                  className="text-sm text-[#c19a5d] hover:underline"
                >
                  New template
                </button>
              </div>

              <div className="space-y-2">
                {(templatesQuery.data || []).map((template) => (
                  <article
                    key={template.id}
                    className={`rounded-xl border p-4 cursor-pointer ${
                      selected?.id === template.id
                        ? 'border-[#c19a5d] bg-[#1e1912]'
                        : 'border-[#2f271b] bg-[#15110d]'
                    }`}
                    onClick={() => setSelected(template)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h4 className="font-semibold">{template.name}</h4>
                        <p className="text-xs text-[#9a8b78]">
                          v{template.version} · {template.fields.length} fields
                        </p>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-1 rounded-full font-semibold ${
                          template.active
                            ? 'bg-[#1f3b2a] text-[#b6f3d0]'
                            : 'bg-[#3b2f1e] text-[#f7d9a3]'
                        }`}
                      >
                        {template.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-[#7f715e] mt-2">
                      {(template._count?.submissions ?? 0).toLocaleString()} submissions
                    </p>
                  </article>
                ))}
                {!templatesQuery.isLoading && (templatesQuery.data?.length ?? 0) === 0 && (
                  <p className="text-sm text-[#9a8b78]">No templates yet.</p>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">
                  {selected ? 'Edit template' : 'Create template'}
                </h3>
                {selected && (
                  <button
                    onClick={() => deactivateTemplate.mutate()}
                    className="text-sm text-[#f2c5c5] border border-[#3c1c1c] bg-[#2b1515] rounded-lg px-3 py-2 hover:bg-[#3a1c1c]"
                  >
                    Deactivate
                  </button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="text-[#d4c5b4]">Name</span>
                  <input
                    value={draft.name}
                    onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-lg border border-[#2f271b] bg-[#0f0d0b] px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c19a5d]"
                    placeholder="Virtual Styling Intake"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-[#d4c5b4]">Description</span>
                  <input
                    value={draft.description}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, description: e.target.value }))
                    }
                    className="w-full rounded-lg border border-[#2f271b] bg-[#0f0d0b] px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c19a5d]"
                    placeholder="Short description"
                  />
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="active"
                  type="checkbox"
                  checked={draft.active}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, active: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-[#2f271b] bg-[#0f0d0b]"
                />
                <label htmlFor="active" className="text-sm text-[#d4c5b4]">
                  Active
                </label>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold">Fields</h4>
                  <span className="text-xs text-[#9a8b78]">
                    {draft.fields.length} configured
                  </span>
                </div>

                <div className="space-y-2">
                  {draft.fields.map((field) => (
                    <div
                      key={field.id}
                      className="flex items-center justify-between rounded-lg border border-[#2f271b] bg-[#0f0d0b] px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-semibold">{field.label}</p>
                        <p className="text-xs text-[#9a8b78]">
                          {field.type} · {field.validation?.required ? 'Required' : 'Optional'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveField(field.id)}
                        className="text-xs text-[#f2c5c5] hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {draft.fields.length === 0 && (
                    <p className="text-xs text-[#9a8b78]">No fields yet.</p>
                  )}
                </div>

                <div className="rounded-lg border border-[#2f271b] bg-[#0f0d0b] p-4 space-y-3">
                  <p className="text-sm font-semibold">Add field</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      value={newField.label}
                      onChange={(e) =>
                        setNewField((prev) => ({ ...prev, label: e.target.value }))
                      }
                      placeholder="Label"
                      className="w-full rounded-lg border border-[#2f271b] bg-[#0f0d0b] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c19a5d]"
                    />
                    <select
                      value={newField.type as string}
                      onChange={(e) =>
                        setNewField((prev) => ({
                          ...prev,
                          type: e.target.value as FieldType,
                        }))
                      }
                      className="w-full rounded-lg border border-[#2f271b] bg-[#0f0d0b] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c19a5d]"
                    >
                      {['text', 'textarea', 'select', 'radio', 'checkbox'].map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <label className="flex items-center gap-2 text-xs text-[#d4c5b4]">
                      <input
                        type="checkbox"
                        checked={newField.required}
                        onChange={(e) =>
                          setNewField((prev) => ({ ...prev, required: e.target.checked }))
                        }
                      />
                      Required
                    </label>
                    <input
                      type="number"
                      placeholder="Min length"
                      value={newField.minLength ?? ''}
                      onChange={(e) =>
                        setNewField((prev) => ({
                          ...prev,
                          minLength: e.target.value ? Number(e.target.value) : undefined,
                        }))
                      }
                      className="w-full rounded-lg border border-[#2f271b] bg-[#0f0d0b] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c19a5d]"
                    />
                    <input
                      type="number"
                      placeholder="Max length"
                      value={newField.maxLength ?? ''}
                      onChange={(e) =>
                        setNewField((prev) => ({
                          ...prev,
                          maxLength: e.target.value ? Number(e.target.value) : undefined,
                        }))
                      }
                      className="w-full rounded-lg border border-[#2f271b] bg-[#0f0d0b] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c19a5d]"
                    />
                  </div>
                  {(newField.type === 'select' ||
                    newField.type === 'radio' ||
                    newField.type === 'checkbox') && (
                    <input
                      value={newField.options}
                      onChange={(e) =>
                        setNewField((prev) => ({ ...prev, options: e.target.value }))
                      }
                      placeholder="Options (comma-separated)"
                      className="w-full rounded-lg border border-[#2f271b] bg-[#0f0d0b] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c19a5d]"
                    />
                  )}
                  <input
                    value={newField.helperText}
                    onChange={(e) =>
                      setNewField((prev) => ({ ...prev, helperText: e.target.value }))
                    }
                    placeholder="Helper text (optional)"
                    className="w-full rounded-lg border border-[#2f271b] bg-[#0f0d0b] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c19a5d]"
                  />
                  <button
                    onClick={handleAddField}
                    className="w-full md:w-auto px-4 py-2 rounded-lg bg-[#c19a5d] text-[#0f0e0c] font-semibold shadow-md hover:bg-[#b18846]"
                  >
                    Add field
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleSave}
                  disabled={saveTemplate.isLoading}
                  className="px-5 py-3 rounded-lg bg-[#c19a5d] text-[#0f0e0c] font-semibold shadow-md hover:bg-[#b18846] disabled:opacity-60"
                >
                  {saveTemplate.isLoading ? 'Saving…' : 'Save template'}
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold">Recent submissions</h4>
                  {selected && (
                    <span className="text-xs text-[#9a8b78]">
                      Template v{selected.version}
                    </span>
                  )}
                </div>
                {submissionsQuery.isFetching && <p className="text-sm">Loading…</p>}
                <div className="space-y-2">
                  {(submissionsQuery.data || []).map((submission) => (
                    <article
                      key={submission.id}
                      className="rounded-lg border border-[#2f271b] bg-[#0f0d0b] p-4"
                    >
                      <div className="flex items-center justify-between text-sm text-[#d4c5b4]">
                        <span>{submission.email ?? 'Guest'}</span>
                        <span>{new Date(submission.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-[#9a8b78] mt-2">
                        v{submission.templateVersion} ·{' '}
                        {Object.keys(submission.responses || {}).length} responses
                      </p>
                      <div className="mt-2 text-xs text-[#c7b9a6] space-y-1">
                        {Object.entries(submission.responses || {})
                          .slice(0, 3)
                          .map(([key, value]) => (
                            <div key={key} className="flex gap-2">
                              <span className="text-[#9a8b78]">{key}:</span>
                              <span>
                                {Array.isArray(value) ? value.join(', ') : String(value)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </article>
                  ))}
                  {selected && !submissionsQuery.isFetching && (submissionsQuery.data?.length ?? 0) === 0 && (
                    <p className="text-sm text-[#9a8b78]">
                      No submissions for this template yet.
                    </p>
                  )}
                  {!selected && (
                    <p className="text-sm text-[#9a8b78]">
                      Select a template to view recent submissions.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
