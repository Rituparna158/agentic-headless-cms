import { requestHandler } from '../../../api/requestHandler';
import { ENDPOINTS } from '../../../api/endpoints';
import type { ContentVersionRecord } from '../types/template.types';

export interface SchemaEntry {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  type: 'collection' | 'single_type' | 'component';
  status?: string;
  entryCount?: number;
  lastUpdatedBy?: string | null;
  fields: unknown[];
  createdAt: string;
  updatedAt: string;
}

export interface PageEntry {
  id: string;
  schemaId: string;
  locale: string;
  status: 'draft' | 'published';
  data: {
    title: string;
    slug: string;
    body?: unknown;
    [key: string]: unknown;
  };
  updatedBy?: string | null;
  collaborators?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      pageCount: number;
    };
  };
}

const DEFAULT_PAGE_FIELDS = [
  {
    apiId: 'title',
    displayName: 'Title',
    dataType: 'text',
    isRequired: true,
    isUnique: false,
    isLocalized: true,
    isRepeatable: false,
    sortOrder: 0,
  },
  {
    apiId: 'slug',
    displayName: 'Slug',
    dataType: 'text',
    isRequired: true,
    isUnique: true,
    isLocalized: false,
    isRepeatable: false,
    sortOrder: 1,
  },
  {
    apiId: 'description',
    displayName: 'Description',
    dataType: 'text',
    isRequired: false,
    isUnique: false,
    isLocalized: true,
    isRepeatable: false,
    sortOrder: 2,
  },
  {
    apiId: 'body',
    displayName: 'Body',
    dataType: 'json',
    isRequired: false,
    isUnique: false,
    isLocalized: true,
    isRepeatable: false,
    sortOrder: 4,
  },
];

export const collectionsApi = {
  listSchemas: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<SchemaEntry>> => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

    const res = await requestHandler.get<PaginatedResponse<SchemaEntry>>(
      `${ENDPOINTS.SCHEMAS.BASE}?${query.toString()}`,
    );
    return res.data;
  },

  createSchema: async (data: {
    name: string;
    slug: string;
    description?: string;
  }): Promise<SchemaEntry> => {
    const res = await requestHandler.post<SchemaEntry>(ENDPOINTS.SCHEMAS.BASE, {
      ...data,
      type: 'collection',
      fields: DEFAULT_PAGE_FIELDS,
    });
    return res.data;
  },

  updateSchema: async (
    id: string,
    data: { name?: string; description?: string },
  ): Promise<SchemaEntry> => {
    const res = await requestHandler.put<SchemaEntry>(
      `${ENDPOINTS.SCHEMAS.BASE}/${id}`,
      data,
    );
    return res.data;
  },

  deleteSchema: async (id: string, force: boolean = false): Promise<void> => {
    await requestHandler.delete(
      `${ENDPOINTS.SCHEMAS.BASE}/${id}?force=${force}`,
    );
  },

  // Content Operations (Pages inside a Collection)
  listPages: async (
    schemaSlug: string,
    params?: {
      page?: number;
      pageSize?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<PaginatedResponse<PageEntry>> => {
    const searchParams = new URLSearchParams();
    searchParams.set('status', 'all');
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize)
      searchParams.set('pageSize', params.pageSize.toString());
    if (params?.search && params.search.trim()) {
      searchParams.set('search', params.search.trim());
    }
    if (params?.sortBy) {
      const order = params.sortOrder || 'asc';
      searchParams.set('sort', `${params.sortBy}:${order}`);
    }
    const res = await requestHandler.get<PaginatedResponse<PageEntry>>(
      `${ENDPOINTS.CONTENT.BY_SCHEMA(schemaSlug)}?${searchParams.toString()}`,
    );
    return res.data;
  },

  getPage: async (schemaSlug: string, entryId: string): Promise<PageEntry> => {
    const res = await requestHandler.get<PageEntry>(
      ENDPOINTS.CONTENT.ENTRY(schemaSlug, entryId),
    );
    return res.data;
  },

  createPage: async (
    schemaSlug: string,
    data: { title: string; slug: string; body?: unknown },
  ): Promise<PageEntry> => {
    const res = await requestHandler.post<PageEntry>(
      ENDPOINTS.CONTENT.BY_SCHEMA(schemaSlug),
      data,
    );
    return res.data;
  },

  updatePage: async (
    schemaSlug: string,
    entryId: string,
    data: { title: string; slug: string; body?: unknown },
  ): Promise<PageEntry> => {
    const res = await requestHandler.put<PageEntry>(
      ENDPOINTS.CONTENT.ENTRY(schemaSlug, entryId),
      data,
    );
    return res.data;
  },

  deletePage: async (schemaSlug: string, entryId: string): Promise<void> => {
    await requestHandler.delete(ENDPOINTS.CONTENT.ENTRY(schemaSlug, entryId));
  },

  publishPage: async (
    schemaSlug: string,
    entryId: string,
  ): Promise<PageEntry> => {
    const res = await requestHandler.post<PageEntry>(
      `${ENDPOINTS.CONTENT.ENTRY(schemaSlug, entryId)}/publish`,
      {},
    );
    return res.data;
  },

  unpublishPage: async (
    schemaSlug: string,
    entryId: string,
  ): Promise<PageEntry> => {
    const res = await requestHandler.post<PageEntry>(
      `${ENDPOINTS.CONTENT.ENTRY(schemaSlug, entryId)}/unpublish`,
      {},
    );
    return res.data;
  },

  getSchemaBySlug: async (schemaSlug: string): Promise<SchemaEntry> => {
    const res = await requestHandler.get<SchemaEntry>(
      ENDPOINTS.SCHEMAS.BY_SLUG(schemaSlug),
    );
    return res.data;
  },

  getPageBySlug: async (
    schemaSlug: string,
    slug: string,
  ): Promise<PageEntry> => {
    const formattedSlug = slug.startsWith('/') ? slug : `/${slug}`;
    const res = await requestHandler.get<PaginatedResponse<PageEntry>>(
      `${ENDPOINTS.CONTENT.BY_SCHEMA(schemaSlug)}?filters[slug][$eq]=${formattedSlug}&status=all`,
    );
    if (!res.data.data.length) {
      throw new Error(`Page with slug ${slug} not found in ${schemaSlug}`);
    }
    return res.data.data[0] as PageEntry;
  },

  getVersions: async (
    schemaSlug: string,
    entryId: string,
  ): Promise<ContentVersionRecord[]> => {
    const res = await requestHandler.get<ContentVersionRecord[]>(
      ENDPOINTS.CONTENT.VERSIONS(schemaSlug, entryId),
    );
    return res.data;
  },

  revertVersion: async (
    schemaSlug: string,
    entryId: string,
    versionNo: number,
  ): Promise<PageEntry> => {
    const res = await requestHandler.post<PageEntry>(
      ENDPOINTS.CONTENT.REVERT(schemaSlug, entryId),
      { versionNo },
    );
    return res.data;
  },
};
