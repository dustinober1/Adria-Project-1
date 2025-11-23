'use client';

import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient, withAuth } from '../../../lib/api';

type Inquiry = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  serviceInterest?: string | null;
  message: string;
  status: 'NEW' | 'IN_PROGRESS' | 'RESPONDED' | 'CLOSED';
  respondedAt?: string | null;
  closedAt?: string | null;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown> | null;
};

type InquiryResponse = {
  success: boolean;
  data: Inquiry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const statusOptions: { value: Inquiry['status'] | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'NEW', label: 'New' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'RESPONDED', label: 'Responded' },
  { value: 'CLOSED', label: 'Closed' },
];

const statusUpdateSchema = z.object({
  status: z.enum(['new', 'in_progress', 'responded', 'closed']),
  adminNotes: z.string().max(2000).optional(),
});

export default function AdminInquiriesPage() {
  const [token, setToken] = useState('');
  const [filters, setFilters] = useState({
    status: '' as Inquiry['status'] | '',
    search: '',
    serviceInterest: '',
    dateFrom: '',
    dateTo: '',
  });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('adria_admin_token');
    if (saved) setToken(saved);
  }, []);

  const queryParams = useMemo(
    () => ({
      ...filters,
      page,
      limit: 10,
    }),
    [filters, page]
  );

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['inquiries', queryParams, token],
    queryFn: async () => {
      const response = await apiClient.get<InquiryResponse>(
        '/api/v1/admin/inquiries',
        {
          params: queryParams,
          ...withAuth(token),
        }
      );
      return response.data;
    },
    enabled: !!token,
    keepPreviousData: true,
  });

  useEffect(() => {
    if (!data || !selected) return;
    const updated = data.data.find((i) => i.id === selected.id);
    if (updated) setSelected(updated);
  }, [data, selected?.id]);

  const handleStatusUpdate = async (
    newStatus: z.infer<typeof statusUpdateSchema>['status'],
    notes?: string
  ) => {
    if (!selected) return;
    setStatusLoading(true);
    setStatusMessage(null);
    try {
      await apiClient.put(
        `/api/v1/admin/inquiries/${selected.id}/status`,
        { status: newStatus, adminNotes: notes || undefined },
        withAuth(token)
      );
      await refetch();
      setStatusMessage('Status updated');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Unable to update status.';
      setStatusMessage(message);
    } finally {
      setStatusLoading(false);
    }
  };

  const tokenMissing = !token;

  return (
    <main className="min-h-screen bg-[#0f0e0c] text-[#f6f0e8]">
      <div className="max-w-6xl mx-auto px-6 py-16 space-y-8">
        <header className="space-y-4">
          <p className="text-sm uppercase tracking-[0.2em] text-[#c19a5d]">
            Admin · Inquiries
          </p>
          <h1 className="text-4xl font-semibold">
            Manage contact inquiries with filters, search, and status controls.
          </h1>
          <p className="text-[#d4c5b4] max-w-3xl">
            This view reads directly from the secured admin API. Provide an admin
            or super_admin token to load data. Status transitions are guarded to
            the NEW → IN_PROGRESS → RESPONDED → CLOSED flow.
          </p>
        </header>

        <section className="bg-[#161410] border border-[#2a241b] rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="grid gap-4 md:grid-cols-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm text-[#d4c5b4] mb-1">
                Admin token
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  localStorage.setItem('adria_admin_token', e.target.value);
                }}
                placeholder="Paste your admin JWT"
                className="w-full rounded-lg border border-[#2f271b] bg-[#0f0e0c] px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c19a5d]"
              />
              <p className="text-xs text-[#9a8b78] mt-1">
                Tokens from the backend auth endpoints (`/auth/login` or `/auth/register`).
              </p>
            </div>
            <button
              onClick={() => refetch()}
              disabled={tokenMissing}
              className="h-12 rounded-lg bg-[#c19a5d] text-[#0f0e0c] font-semibold shadow-md hover:bg-[#b18846] disabled:opacity-60"
            >
              Refresh
            </button>
            <div className="text-right text-xs text-[#9a8b78]">
              {isFetching ? 'Syncing…' : 'Live data'}
            </div>
          </div>

          <Filters filters={filters} setFilters={setFilters} onApply={() => setPage(1)} />

          {tokenMissing && (
            <p className="text-[#d99058] bg-[#2a1f13] border border-[#3a2a19] rounded-lg px-4 py-3">
              Provide an admin token to load inquiries.
            </p>
          )}

          {error && (
            <p className="text-red-400 bg-red-900/30 border border-red-800 rounded-lg px-4 py-3">
              Failed to load inquiries. Check your token and network.
            </p>
          )}

          {!tokenMissing && (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center justify-between text-sm text-[#9a8b78]">
                  <span>
                    {isLoading ? 'Loading…' : `${data?.pagination.total ?? 0} inquiries`}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || isFetching}
                      className="px-3 py-2 rounded border border-[#2f271b] text-[#f6f0e8] disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() =>
                        setPage((p) =>
                          data?.pagination?.totalPages
                            ? Math.min(data.pagination.totalPages, p + 1)
                            : p + 1
                        )
                      }
                      disabled={
                        isFetching ||
                        (data?.pagination?.totalPages
                          ? page >= data.pagination.totalPages
                          : false)
                      }
                      className="px-3 py-2 rounded border border-[#2f271b] text-[#f6f0e8] disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {(data?.data || []).map((inquiry) => (
                    <article
                      key={inquiry.id}
                      className={`rounded-xl border ${
                        selected?.id === inquiry.id
                          ? 'border-[#c19a5d] bg-[#1d1912]'
                          : 'border-[#2f271b] bg-[#15120e]'
                      } p-4 cursor-pointer`}
                      onClick={() => setSelected(inquiry)}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold">{inquiry.fullName}</h3>
                          <p className="text-sm text-[#9a8b78]">{inquiry.email}</p>
                        </div>
                        <StatusPill status={inquiry.status} />
                      </div>
                      <p className="text-sm text-[#d4c5b4] mt-2 line-clamp-2">
                        {inquiry.message}
                      </p>
                      <div className="flex gap-4 text-xs text-[#9a8b78] mt-2">
                        <span>{inquiry.serviceInterest || 'General inquiry'}</span>
                        <span>Created {new Date(inquiry.createdAt).toLocaleString()}</span>
                      </div>
                    </article>
                  ))}
                  {!isLoading && (data?.data?.length ?? 0) === 0 && (
                    <p className="text-sm text-[#9a8b78]">
                      No inquiries match these filters.
                    </p>
                  )}
                </div>
              </div>

              <aside className="bg-[#15120e] border border-[#2f271b] rounded-xl p-5 space-y-4">
                <h3 className="text-xl font-semibold">Detail</h3>
                {selected ? (
                  <DetailPanel
                    inquiry={selected}
                    onStatusUpdate={handleStatusUpdate}
                    statusLoading={statusLoading}
                    statusMessage={statusMessage}
                  />
                ) : (
                  <p className="text-sm text-[#9a8b78]">
                    Select an inquiry to view details and update status.
                  </p>
                )}
              </aside>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Filters({
  filters,
  setFilters,
  onApply,
}: {
  filters: {
    status: Inquiry['status'] | '';
    search: string;
  serviceInterest: string;
  dateFrom: string;
  dateTo: string;
};
  setFilters: Dispatch<
    SetStateAction<{
      status: Inquiry['status'] | '';
      search: string;
      serviceInterest: string;
      dateFrom: string;
      dateTo: string;
    }>
  >;
  onApply: () => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-5">
      <div className="md:col-span-2">
        <label className="text-sm text-[#d4c5b4] mb-1 block">Search</label>
        <input
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          placeholder="Search by name or email"
          className="w-full rounded-lg border border-[#2f271b] bg-[#0f0e0c] px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c19a5d]"
        />
      </div>
      <div>
        <label className="text-sm text-[#d4c5b4] mb-1 block">Status</label>
        <select
          value={filters.status}
          onChange={(e) =>
            setFilters((f) => ({ ...f, status: e.target.value as Inquiry['status'] | '' }))
          }
          className="w-full rounded-lg border border-[#2f271b] bg-[#0f0e0c] px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c19a5d]"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value || 'all'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm text-[#d4c5b4] mb-1 block">Service</label>
        <input
          value={filters.serviceInterest}
          onChange={(e) =>
            setFilters((f) => ({ ...f, serviceInterest: e.target.value }))
          }
          placeholder="Service interest"
          className="w-full rounded-lg border border-[#2f271b] bg-[#0f0e0c] px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c19a5d]"
        />
      </div>
      <div className="md:col-span-1">
        <label className="text-sm text-[#d4c5b4] mb-1 block">Date range</label>
        <div className="flex gap-2">
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) =>
              setFilters((f) => ({ ...f, dateFrom: e.target.value }))
            }
            className="w-full rounded-lg border border-[#2f271b] bg-[#0f0e0c] px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c19a5d]"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
            className="w-full rounded-lg border border-[#2f271b] bg-[#0f0e0c] px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c19a5d]"
          />
        </div>
      </div>
      <div className="flex items-end">
        <button
          onClick={onApply}
          className="w-full rounded-lg bg-[#c19a5d] text-[#0f0e0c] font-semibold h-12 shadow-md hover:bg-[#b18846]"
        >
          Apply filters
        </button>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: Inquiry['status'] }) {
  const palette: Record<Inquiry['status'], string> = {
    NEW: 'bg-[#1e293b] text-[#c7d2fe]',
    IN_PROGRESS: 'bg-[#3b2f1e] text-[#f7d9a3]',
    RESPONDED: 'bg-[#1f3b2a] text-[#b6f3d0]',
    CLOSED: 'bg-[#372e37] text-[#f2c5e0]',
  };
  const labels: Record<Inquiry['status'], string> = {
    NEW: 'New',
    IN_PROGRESS: 'In progress',
    RESPONDED: 'Responded',
    CLOSED: 'Closed',
  };
  return (
    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${palette[status]}`}>
      {labels[status]}
    </span>
  );
}

function DetailPanel({
  inquiry,
  onStatusUpdate,
  statusLoading,
  statusMessage,
}: {
  inquiry: Inquiry;
  onStatusUpdate: (
    status: z.infer<typeof statusUpdateSchema>['status'],
    notes?: string
  ) => Promise<void>;
  statusLoading: boolean;
  statusMessage: string | null;
}) {
  const [adminNotes, setAdminNotes] = useState(inquiry.adminNotes || '');
  const [nextStatus, setNextStatus] = useState<z.infer<
    typeof statusUpdateSchema
  >['status']>('in_progress');

  useEffect(() => {
    setAdminNotes(inquiry.adminNotes || '');
  }, [inquiry.adminNotes]);

  return (
    <div className="space-y-4 text-sm">
      <div>
        <p className="text-[#d4c5b4] font-medium">From</p>
        <p>{inquiry.fullName}</p>
        <p className="text-[#9a8b78]">{inquiry.email}</p>
      </div>
      <div>
        <p className="text-[#d4c5b4] font-medium">Message</p>
        <p className="text-[#f6f0e8] whitespace-pre-line">{inquiry.message}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs text-[#9a8b78]">
        <div>
          <p className="text-[#d4c5b4] font-medium">Service</p>
          <p>{inquiry.serviceInterest || 'General'}</p>
        </div>
        <div>
          <p className="text-[#d4c5b4] font-medium">Created</p>
          <p>{new Date(inquiry.createdAt).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[#d4c5b4] font-medium">Responded</p>
          <p>{inquiry.respondedAt ? new Date(inquiry.respondedAt).toLocaleString() : '—'}</p>
        </div>
        <div>
          <p className="text-[#d4c5b4] font-medium">Closed</p>
          <p>{inquiry.closedAt ? new Date(inquiry.closedAt).toLocaleString() : '—'}</p>
        </div>
      </div>
      <div className="bg-[#0f0e0c] rounded-lg border border-[#2f271b] p-3">
        <p className="text-[#d4c5b4] font-medium">Spam signals</p>
        <p className="text-[#9a8b78]">
          reCAPTCHA score:{' '}
          {(inquiry.metadata as { recaptchaScore?: number } | undefined)?.recaptchaScore ??
            'n/a'}
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-[#d4c5b4] font-medium">Admin notes</label>
        <textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          className="w-full rounded-lg border border-[#2f271b] bg-[#0f0e0c] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c19a5d]"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <label className="text-[#d4c5b4] font-medium">Update status</label>
        <div className="flex gap-2">
          <select
            value={nextStatus}
            onChange={(e) =>
              setNextStatus(e.target.value as z.infer<typeof statusUpdateSchema>['status'])
            }
            className="flex-1 rounded-lg border border-[#2f271b] bg-[#0f0e0c] px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c19a5d]"
          >
            {['in_progress', 'responded', 'closed'].map((status) => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>
          <button
            disabled={statusLoading}
            onClick={() => onStatusUpdate(nextStatus, adminNotes)}
            className="px-4 py-3 rounded-lg bg-[#c19a5d] text-[#0f0e0c] font-semibold shadow-md hover:bg-[#b18846] disabled:opacity-60"
          >
            {statusLoading ? 'Updating…' : 'Update'}
          </button>
        </div>
      </div>
      {statusMessage && <p className="text-xs text-[#d4c5b4]">{statusMessage}</p>}
    </div>
  );
}
