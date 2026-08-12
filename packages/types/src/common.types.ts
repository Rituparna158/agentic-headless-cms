import { PaginationMeta } from './content.types.js';

export interface BaseQueryOptions {
  page?: number;
  pageSize?: number;
  sort?: string;
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: { pagination: PaginationMeta };
}
