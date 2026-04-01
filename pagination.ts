interface PaginationOptions {
  page: number;
  pageSize: number;
}

interface PaginatedResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

function paginate<T>(items: T[], options: PaginationOptions): PaginatedResult<T> {
  const { page, pageSize } = options;
  const total = items.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const data = items.slice(start, start + pageSize);

  return {
    data,
    page,
    pageSize,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

function paginateCursor<T>(
  items: T[],
  cursor: number | null,
  limit: number
): { data: T[]; nextCursor: number | null } {
  const start = cursor ?? 0;
  const data = items.slice(start, start + limit);
  const nextCursor = start + limit < items.length ? start + limit : null;
  return { data, nextCursor };
}

export { paginate, paginateCursor, PaginationOptions, PaginatedResult };
