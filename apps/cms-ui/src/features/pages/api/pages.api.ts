import { requestHandler } from '../../../api/requestHandler';
import { ENDPOINTS } from '../../../api/endpoints';

export interface PageEntry {
  id: string;
  schemaId: string;
  locale: string;
  status: 'draft' | 'published';
  data: {
    title: string;
    slug: string;
    body?: unknown;
  };
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

const PAGE_SCHEMA_PAYLOAD = {
  name: 'Page',
  slug: 'page',
  type: 'single_type' as const,
  fields: [
    {
      apiId: 'title',
      displayName: 'Title',
      dataType: 'text' as const,
      isRequired: true,
      isUnique: false,
      isLocalized: true,
      isRepeatable: false,
      sortOrder: 0,
    },
    {
      apiId: 'slug',
      displayName: 'Slug',
      dataType: 'text' as const,
      isRequired: true,
      isUnique: true,
      isLocalized: false,
      isRepeatable: false,
      sortOrder: 1,
    },
    {
      apiId: 'body',
      displayName: 'Body',
      dataType: 'json' as const,
      isRequired: false,
      isUnique: false,
      isLocalized: true,
      isRepeatable: false,
      sortOrder: 2,
    },
  ],
};

export const pagesApi = {
  ensurePageSchema: async (): Promise<{ id: string }> => {
    try {
      const res = await requestHandler.get<{ id: string }>(
        ENDPOINTS.SCHEMAS.BY_SLUG('page'),
      );
      return res.data;
    } catch (err: unknown) {
      if ((err as { status?: number }).status === 404) {
        const res = await requestHandler.post<{ id: string }>(
          ENDPOINTS.SCHEMAS.BASE,
          PAGE_SCHEMA_PAYLOAD,
        );
        return res.data;
      }
      throw err;
    }
  },

  listPages: async (
    page = 1,
    pageSize = 20,
  ): Promise<PaginatedResponse<PageEntry>> => {
    const res = await requestHandler.get<PaginatedResponse<PageEntry>>(
      `${ENDPOINTS.CONTENT.BY_SCHEMA('page')}?page=${page}&pageSize=${pageSize}`,
    );
    return res.data;
  },

  getPage: async (entryId: string): Promise<PageEntry> => {
    const res = await requestHandler.get<PageEntry>(
      ENDPOINTS.CONTENT.ENTRY('page', entryId),
    );
    return res.data;
  },

  createPage: async (data: {
    title: string;
    slug: string;
    body?: unknown;
  }): Promise<PageEntry> => {
    const res = await requestHandler.post<PageEntry>(
      ENDPOINTS.CONTENT.BY_SCHEMA('page'),
      data,
    );
    return res.data;
  },

  updatePage: async (
    entryId: string,
    data: { title: string; slug: string; body?: unknown },
  ): Promise<PageEntry> => {
    const res = await requestHandler.put<PageEntry>(
      ENDPOINTS.CONTENT.ENTRY('page', entryId),
      data,
    );
    return res.data;
  },

  deletePage: async (entryId: string): Promise<void> => {
    await requestHandler.delete(ENDPOINTS.CONTENT.ENTRY('page', entryId));
  },

  getPageBySlug: async (slug: string): Promise<PageEntry> => {
    const formattedSlug = slug.startsWith('/') ? slug : `/${slug}`;
    const res = await requestHandler.get<PaginatedResponse<PageEntry>>(
      `${ENDPOINTS.CONTENT.BY_SCHEMA('page')}?filters[slug][$eq]=${formattedSlug}`,
    );
    if (!res.data.data.length) {
      throw new Error(`Page with slug ${slug} not found`);
    }
    return res.data.data[0] as PageEntry;
  },
};
