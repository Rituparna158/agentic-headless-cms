import type { SQL } from 'drizzle-orm';

export interface PaginationOptions {
  limit: number;
  offset: number;
  orderBy: SQL[];
  where: SQL | undefined;
}
