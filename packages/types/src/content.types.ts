import { SQL } from 'drizzle-orm';

export interface ContentQueryOptions {
  where: SQL | undefined;
  orderBy: SQL[];
  limit: number;
  offset: number;
  search?: string;
  page: number;
  pageSize: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
}

export interface ContentEntryRecord {
  id: string;
  status: 'draft' | 'published';
  data: Record<string, unknown>;
  publishedData: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContentVersionRecord {
  id: string;
  entryId: string;
  locale: string;
  versionNo: number;
  status: 'draft' | 'published';
  data: Record<string, unknown>;
  actorType: 'user' | 'agent' | 'system';
  createdByUserId?: string | null;
  createdByAgentId?: string | null;
  comment?: string | null;
  createdAt: string;
}

export interface ListContentEntriesOptions {
  page?: number;
  pageSize?: number;
  sort?: string;
  locale?: string;
  filters?: Record<string, Record<string, string>>;
}

export interface ListContentEntriesResult {
  data: ContentEntryRecord[];
  meta: { pagination: PaginationMeta };
}
