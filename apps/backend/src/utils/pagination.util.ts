import { BadRequestError } from '@repo/utils';
import type { BaseQueryOptions } from '@repo/types';

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

export function parseQueryOptions(
  query: Record<string, unknown>,
): BaseQueryOptions {
  const page = parsePositiveInt(query.page, 1, 'page');
  const pageSize = Math.min(
    parsePositiveInt(query.pageSize, DEFAULT_PAGE_SIZE, 'pageSize'),
    MAX_PAGE_SIZE,
  );

  const search = typeof query.search === 'string' ? query.search : undefined;

  let sort: string | undefined;
  if (typeof query.sort === 'string') {
    sort = query.sort;
  } else if (Array.isArray(query.sort)) {
    sort = query.sort.join(',');
  }

  return { page, pageSize, search, sort };
}

function parsePositiveInt(
  value: unknown,
  fallback: number,
  paramName: string,
): number {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new BadRequestError(`'${paramName}' must be a positive integer.`);
  }
  return parsed;
}

export function formatPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
) {
  return {
    data,
    meta: {
      pagination: {
        page,
        pageSize,
        total,
        pageCount: Math.ceil(total / pageSize),
      },
    },
  };
}
