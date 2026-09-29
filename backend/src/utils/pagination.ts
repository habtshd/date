export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function getPaginationOffsets(params?: PaginationParams, defaultLimit = 20) {
  const page = Math.max(1, params?.page || 1);
  const limit = Math.min(100, Math.max(1, params?.limit || defaultLimit));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function buildPaginatedResult<T>(items: T[], total: number, page: number, limit: number): PaginatedResult<T> {
  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
