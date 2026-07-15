import { SQL } from 'drizzle-orm';

export interface ContentQueryOptions {
  where: SQL | undefined;
  orderBy: SQL[];
  limit: number;
  offset: number;
  page: number;
  pageSize: number;
}
