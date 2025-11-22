export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

type AllowedSort = {
  defaultSortBy: string;
  allowed: string[];
};

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export function parsePagination(query: unknown, allowedSort: AllowedSort): PaginationParams {
  const q = query as Record<string, unknown>;
  const pageRaw = Array.isArray(q.page) ? q.page[0] : q.page;
  const limitRaw = Array.isArray(q.limit) ? q.limit[0] : q.limit;
  const sortRaw = Array.isArray(q.sortBy) ? q.sortBy[0] : q.sortBy;
  const orderRaw = Array.isArray(q.sortOrder) ? q.sortOrder[0] : q.sortOrder;

  const page = Math.max(1, Number(pageRaw) || 1);
  const limit = clamp(Number(limitRaw) || DEFAULT_LIMIT, 1, MAX_LIMIT);
  const sortBy = allowedSort.allowed.includes(sortRaw ?? '')
    ? (sortRaw as string)
    : allowedSort.defaultSortBy;
  const sortOrder =
    orderRaw === 'asc' || orderRaw === 'desc' ? orderRaw : 'desc';

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    sortBy,
    sortOrder,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
