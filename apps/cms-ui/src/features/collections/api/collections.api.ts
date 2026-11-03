import { z } from 'zod';
import type { SchemaField } from '@repo/types';
import { requestHandler } from '@/api/requestHandler';
import { ENDPOINTS } from '@/api/endpoints';
import type { ContentVersionRecord } from '../types/template.types';
import type {
  SchemaEntry,
  PageEntry,
  PaginatedResponse,
} from '../types/collections.types';
import { DEFAULT_PAGE_FIELDS } from '../constants/collections.constants';

export type {
  SchemaEntry,
  PageEntry,
  PaginatedResponse,
  PageBodyData,
  PageEntryData,
} from '../types/collections.types';

import type { RequestOptions } from '@/types/api';
import {
  schemaFieldContractSchema,
  schemaEntryContractSchema,
  paginationMetaContractSchema,
  paginatedSchemasContractSchema,
  pageEntryContractSchema,
  paginatedPagesContractSchema,
} from '../validate/collections.validate';

export type { RequestOptions };
export {
  schemaFieldContractSchema,
  schemaEntryContractSchema,
  paginationMetaContractSchema,
  paginatedSchemasContractSchema,
  pageEntryContractSchema,
  paginatedPagesContractSchema,
};

export const collectionsApi = {
  listSchemas: async (
    params?: {
      page?: number;
      pageSize?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
    options?: RequestOptions,
  ): Promise<PaginatedResponse<SchemaEntry>> => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

    const res = await requestHandler.get<PaginatedResponse<SchemaEntry>>(
      `${ENDPOINTS.SCHEMAS.BASE}?${query.toString()}`,
      {
        signal: options?.signal,
        schema: paginatedSchemasContractSchema as unknown as z.ZodType<
          PaginatedResponse<SchemaEntry>
        >,
        endpointLabel: 'collectionsApi.listSchemas',
      },
    );
    return res.data;
  },

  createSchema: async (
    data: {
      name: string;
      slug: string;
      description?: string;
    },
    options?: RequestOptions,
  ): Promise<SchemaEntry> => {
    const res = await requestHandler.post<SchemaEntry>(
      ENDPOINTS.SCHEMAS.BASE,
      {
        ...data,
        type: 'collection',
        fields: DEFAULT_PAGE_FIELDS,
      },
      {
        signal: options?.signal,
        schema: schemaEntryContractSchema as unknown as z.ZodType<SchemaEntry>,
        endpointLabel: 'collectionsApi.createSchema',
      },
    );
    return res.data;
  },

  updateSchema: async (
    id: string,
    data: {
      name?: string;
      description?: string;
      fields?: SchemaField[];
      metadata?: Record<string, unknown>;
    },
    options?: RequestOptions,
  ): Promise<SchemaEntry> => {
    const res = await requestHandler.put<SchemaEntry>(
      `${ENDPOINTS.SCHEMAS.BASE}/${id}`,
      data,
      {
        signal: options?.signal,
        schema: schemaEntryContractSchema as unknown as z.ZodType<SchemaEntry>,
        endpointLabel: 'collectionsApi.updateSchema',
      },
    );
    return res.data;
  },

  deleteSchema: async (
    id: string,
    force: boolean = false,
    options?: RequestOptions,
  ): Promise<void> => {
    await requestHandler.delete(
      `${ENDPOINTS.SCHEMAS.BASE}/${id}?force=${force}`,
      {
        signal: options?.signal,
        endpointLabel: 'collectionsApi.deleteSchema',
      },
    );
  },

  listPages: async (
    schemaSlug: string,
    params?: {
      page?: number;
      pageSize?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
    options?: RequestOptions,
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
      {
        signal: options?.signal,
        schema: paginatedPagesContractSchema as unknown as z.ZodType<
          PaginatedResponse<PageEntry>
        >,
        endpointLabel: `collectionsApi.listPages(${schemaSlug})`,
      },
    );
    return res.data;
  },

  getPage: async (
    schemaSlug: string,
    entryId: string,
    options?: RequestOptions,
  ): Promise<PageEntry> => {
    const res = await requestHandler.get<PageEntry>(
      ENDPOINTS.CONTENT.ENTRY(schemaSlug, entryId),
      {
        signal: options?.signal,
        schema: pageEntryContractSchema as unknown as z.ZodType<PageEntry>,
        endpointLabel: `collectionsApi.getPage(${schemaSlug}/${entryId})`,
      },
    );
    return res.data;
  },

  createPage: async (
    schemaSlug: string,
    data: {
      title: string;
      slug: string;
      description?: string;
      body?: unknown;
      [key: string]: unknown;
    },
    options?: RequestOptions,
  ): Promise<PageEntry> => {
    const res = await requestHandler.post<PageEntry>(
      ENDPOINTS.CONTENT.BY_SCHEMA(schemaSlug),
      data,
      {
        signal: options?.signal,
        schema: pageEntryContractSchema as unknown as z.ZodType<PageEntry>,
        endpointLabel: `collectionsApi.createPage(${schemaSlug})`,
      },
    );
    return res.data;
  },

  updatePage: async (
    schemaSlug: string,
    entryId: string,
    data: {
      title: string;
      slug: string;
      description?: string;
      body?: unknown;
      [key: string]: unknown;
    },
    options?: RequestOptions,
  ): Promise<PageEntry> => {
    const res = await requestHandler.put<PageEntry>(
      ENDPOINTS.CONTENT.ENTRY(schemaSlug, entryId),
      data,
      {
        signal: options?.signal,
        schema: pageEntryContractSchema as unknown as z.ZodType<PageEntry>,
        endpointLabel: `collectionsApi.updatePage(${schemaSlug}/${entryId})`,
      },
    );
    return res.data;
  },

  deletePage: async (
    schemaSlug: string,
    entryId: string,
    options?: RequestOptions,
  ): Promise<void> => {
    await requestHandler.delete(ENDPOINTS.CONTENT.ENTRY(schemaSlug, entryId), {
      signal: options?.signal,
      endpointLabel: `collectionsApi.deletePage(${schemaSlug}/${entryId})`,
    });
  },

  publishPage: async (
    schemaSlug: string,
    entryId: string,
    options?: RequestOptions,
  ): Promise<PageEntry> => {
    const res = await requestHandler.post<PageEntry>(
      `${ENDPOINTS.CONTENT.ENTRY(schemaSlug, entryId)}/publish`,
      {},
      {
        signal: options?.signal,
        schema: pageEntryContractSchema as unknown as z.ZodType<PageEntry>,
        endpointLabel: `collectionsApi.publishPage(${schemaSlug}/${entryId})`,
      },
    );
    return res.data;
  },

  unpublishPage: async (
    schemaSlug: string,
    entryId: string,
    options?: RequestOptions,
  ): Promise<PageEntry> => {
    const res = await requestHandler.post<PageEntry>(
      `${ENDPOINTS.CONTENT.ENTRY(schemaSlug, entryId)}/unpublish`,
      {},
      {
        signal: options?.signal,
        schema: pageEntryContractSchema as unknown as z.ZodType<PageEntry>,
        endpointLabel: `collectionsApi.unpublishPage(${schemaSlug}/${entryId})`,
      },
    );
    return res.data;
  },

  getSchemaBySlug: async (
    schemaSlug: string,
    options?: RequestOptions,
  ): Promise<SchemaEntry> => {
    const res = await requestHandler.get<SchemaEntry>(
      ENDPOINTS.SCHEMAS.BY_SLUG(schemaSlug),
      {
        signal: options?.signal,
        schema: schemaEntryContractSchema as unknown as z.ZodType<SchemaEntry>,
        endpointLabel: `collectionsApi.getSchemaBySlug(${schemaSlug})`,
      },
    );
    return res.data;
  },

  getPageBySlug: async (
    schemaSlug: string,
    slug: string,
    options?: RequestOptions,
  ): Promise<PageEntry> => {
    const cleanSlug = slug.replace(/^\/+/, '');
    const withSlash = `/${cleanSlug}`;

    // 1. Try formatted with slash
    try {
      const res = await requestHandler.get<PaginatedResponse<PageEntry>>(
        `${ENDPOINTS.CONTENT.BY_SCHEMA(schemaSlug)}?filters[slug][$eq]=${encodeURIComponent(withSlash)}&status=all`,
        {
          signal: options?.signal,
          schema: paginatedPagesContractSchema as unknown as z.ZodType<
            PaginatedResponse<PageEntry>
          >,
          endpointLabel: `collectionsApi.getPageBySlug(filters[slug]=${withSlash})`,
        },
      );
      if (res.data?.data && res.data.data.length > 0) {
        return res.data.data[0] as PageEntry;
      }
    } catch {
      // Continue to next attempt
    }

    // 2. Try raw without slash
    try {
      const resRaw = await requestHandler.get<PaginatedResponse<PageEntry>>(
        `${ENDPOINTS.CONTENT.BY_SCHEMA(schemaSlug)}?filters[slug][$eq]=${encodeURIComponent(cleanSlug)}&status=all`,
        {
          signal: options?.signal,
          schema: paginatedPagesContractSchema as unknown as z.ZodType<
            PaginatedResponse<PageEntry>
          >,
          endpointLabel: `collectionsApi.getPageBySlug(filters[slug]=${cleanSlug})`,
        },
      );
      if (resRaw.data?.data && resRaw.data.data.length > 0) {
        return resRaw.data.data[0] as PageEntry;
      }
    } catch {
      // Continue to fallback search
    }

    // 3. Fallback: list all pages and match slug or id locally
    try {
      const listRes = await requestHandler.get<PaginatedResponse<PageEntry>>(
        `${ENDPOINTS.CONTENT.BY_SCHEMA(schemaSlug)}?pageSize=50&status=all`,
        {
          signal: options?.signal,
          schema: paginatedPagesContractSchema as unknown as z.ZodType<
            PaginatedResponse<PageEntry>
          >,
          endpointLabel: `collectionsApi.getPageBySlug(fallback-list)`,
        },
      );
      const match = listRes.data?.data?.find(
        (p) =>
          p.id === slug ||
          p.id === cleanSlug ||
          p.data.slug === withSlash ||
          p.data.slug === cleanSlug ||
          p.data.slug?.replace(/^\/+/, '') === cleanSlug,
      );
      if (match) return match as PageEntry;
    } catch {
      // Fallback exhausted
    }

    // 4. Try fetching directly by entry ID
    try {
      const directRes = await requestHandler.get<PageEntry>(
        `${ENDPOINTS.CONTENT.BY_SCHEMA(schemaSlug)}/${slug}`,
        {
          signal: options?.signal,
          schema: pageEntryContractSchema as unknown as z.ZodType<PageEntry>,
          endpointLabel: `collectionsApi.getPageBySlug(directId)`,
        },
      );
      if (directRes.data && directRes.data.id) {
        return directRes.data;
      }
    } catch {
      // Not found by ID
    }

    throw new Error(
      `Page with slug or ID "${slug}" not found in ${schemaSlug}`,
    );
  },

  getVersions: async (
    schemaSlug: string,
    entryId: string,
    options?: RequestOptions,
  ): Promise<ContentVersionRecord[]> => {
    const res = await requestHandler.get<ContentVersionRecord[]>(
      ENDPOINTS.CONTENT.VERSIONS(schemaSlug, entryId),
      {
        signal: options?.signal,
        endpointLabel: `collectionsApi.getVersions(${schemaSlug}/${entryId})`,
      },
    );
    return res.data;
  },

  revertVersion: async (
    schemaSlug: string,
    entryId: string,
    versionNo: number,
    options?: RequestOptions,
  ): Promise<PageEntry> => {
    const res = await requestHandler.post<PageEntry>(
      ENDPOINTS.CONTENT.REVERT(schemaSlug, entryId),
      { versionNo },
      {
        signal: options?.signal,
        schema: pageEntryContractSchema as unknown as z.ZodType<PageEntry>,
        endpointLabel: `collectionsApi.revertVersion(${schemaSlug}/${entryId})`,
      },
    );
    return res.data;
  },
};
