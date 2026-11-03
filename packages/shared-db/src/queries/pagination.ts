import { SQL, asc, desc, ilike, or } from 'drizzle-orm';
import type { AnyColumn } from 'drizzle-orm';
import type { BaseQueryOptions } from '@repo/types';
import type { PaginationOptions } from './pagination.types.js';

/**
 * Builds standard Drizzle pagination options for typical generic tables.
 */
export function buildPaginationOptions(
  options: BaseQueryOptions,
  columns: Record<string, AnyColumn>,
  searchableColumns: AnyColumn[],
): PaginationOptions {
  const page = options.page || 1;
  const pageSize = options.pageSize || 25;
  const limit = pageSize;
  const offset = (page - 1) * pageSize;

  const orderBy: SQL[] = [];
  if (options.sort) {
    const [key, direction] = options.sort.split(':');
    const col = key ? columns[key] : undefined;
    if (col) {
      orderBy.push(direction === 'desc' ? desc(col) : asc(col));
    }
  }
  // Provide a stable default sort if none matches
  if (orderBy.length === 0 && columns['createdAt']) {
    orderBy.push(desc(columns['createdAt']));
  } else if (orderBy.length === 0 && columns['id']) {
    orderBy.push(asc(columns['id']));
  }

  let where: SQL | undefined = undefined;
  if (options.search && searchableColumns.length > 0) {
    const searchExpr = `%${options.search}%`;
    const conditions = searchableColumns.map((col) => ilike(col, searchExpr));
    where = or(...conditions);
  }

  return { limit, offset, orderBy, where };
}
