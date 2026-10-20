import { requestHandler } from '@/api/requestHandler';
import { ENDPOINTS } from '@/api/endpoints';
import type { PageEntry } from '@/types/content.types';
import {
  DynamicSchemaDefinition,
  ContentCollectionMeta,
  DynamicContentEntry,
  CrossSiteSharedTemplate,
  DynamicFieldDefinition,
  SchemaLineage,
  SchemaMetadata,
} from '../types/posts.types';
import { FORKABLE_SHARED_TEMPLATES } from '../constants/posts.constants';

export function extractArrayPayload<T>(payload: unknown): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as T[];
  if (typeof payload === 'object' && payload !== null) {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.data)) return record.data as T[];
    if (
      record.data &&
      typeof record.data === 'object' &&
      record.data !== null
    ) {
      const nested = record.data as Record<string, unknown>;
      if (Array.isArray(nested.data)) return nested.data as T[];
    }
    if (Array.isArray(record.items)) return record.items as T[];
    if (Array.isArray(record.entries)) return record.entries as T[];
  }
  return [];
}

export const postsApi = {
  // Collections & Schema Explorer
  listCollections: async (): Promise<ContentCollectionMeta[]> => {
    const res = await requestHandler.get<{
      data: Array<
        Record<string, unknown> & {
          id: string;
          name: string;
          slug: string;
          description?: string;
          type: 'collection' | 'single_type' | 'component';
          status?: string;
          entryCount?: number;
          fields?: unknown[];
          definition?: {
            fields?: unknown[];
            metadata?: SchemaMetadata;
          };
          metadata?: SchemaMetadata;
          createdAt: string;
          updatedAt: string;
        }
      >;
      meta?: { pagination?: { total?: number } };
    }>(ENDPOINTS.SCHEMAS.BASE, { params: { pageSize: 100 } });

    const rawSchemas = extractArrayPayload<
      Record<string, unknown> & {
        id: string;
        name: string;
        slug: string;
        description?: string;
        type: 'collection' | 'single_type' | 'component';
        status?: string;
        entryCount?: number;
        fields?: unknown[];
        definition?: {
          fields?: unknown[];
          metadata?: SchemaMetadata;
        };
        metadata?: SchemaMetadata;
        createdAt: string;
        updatedAt: string;
      }
    >(res.data ?? res);

    const schemas = rawSchemas.filter(
      (s) => !s.type || s.type === 'collection',
    );

    const collectionsWithStats: ContentCollectionMeta[] = await Promise.all(
      schemas.map(async (s) => {
        let entryCount = s.entryCount || 0;
        let linkedPagesCount = 0;
        try {
          const entriesRes = await requestHandler.get<{
            data?: unknown[];
            meta?: { pagination?: { total?: number } };
          }>(ENDPOINTS.CONTENT.BY_SCHEMA(s.slug), {
            params: { pageSize: 1, status: 'all' },
          });
          const rawEntriesData = (entriesRes.data ?? entriesRes) as {
            meta?: { pagination?: { total?: number } };
          };
          const totalFromMeta = rawEntriesData?.meta?.pagination?.total;
          if (typeof totalFromMeta === 'number') {
            entryCount = totalFromMeta;
          }
          linkedPagesCount = entryCount;
        } catch {
          // Fallback if content query fails
        }

        const def =
          (s.definition as {
            fields?: unknown[];
            metadata?: SchemaMetadata;
          }) || {};
        const schemaFields = (
          Array.isArray(s.fields) && s.fields.length > 0
            ? s.fields
            : Array.isArray(def.fields)
              ? def.fields
              : []
        ) as DynamicFieldDefinition[];

        const schemaMeta = (def.metadata || s.metadata || {}) as SchemaMetadata;
        const isPublic = !!schemaMeta.is_public;

        const lineage: SchemaLineage = {
          isForked: !!schemaMeta.parent_schema_id,
          forkedFrom: schemaMeta.parent_schema_id
            ? {
                schemaId: schemaMeta.parent_schema_id,
                schemaSlug: schemaMeta.parent_schema_slug || '',
                schemaName:
                  schemaMeta.parent_schema_name || 'Original Template',
                forkedAt: (schemaMeta.forked_at as string) || s.createdAt,
              }
            : undefined,
          forkCount: schemaMeta.fork_count || 0,
        };

        return {
          id: s.id,
          name: s.name,
          slug: s.slug,
          description: s.description,
          type: s.type || 'collection',
          status: s.status,
          entryCount,
          linkedPagesCount,
          fields: schemaFields,
          metadata: schemaMeta,
          isPublic,
          lineage,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        };
      }),
    );

    return collectionsWithStats;
  },

  // List Pages / Layouts under a Collection
  listPagesForCollection: async (schemaSlug: string): Promise<PageEntry[]> => {
    try {
      const res = await requestHandler.get<{ data: PageEntry[] }>(
        ENDPOINTS.CONTENT.BY_SCHEMA(schemaSlug),
        { params: { pageSize: 100, status: 'all' } },
      );
      const rawEntries = extractArrayPayload<PageEntry>(res.data ?? res);
      return rawEntries.map((entry) => {
        const title =
          entry.title ||
          (entry.data?.title as string) ||
          (entry.data?.name as string) ||
          'Untitled Page';
        const slug = entry.slug || (entry.data?.slug as string) || entry.id;
        return {
          ...entry,
          title,
          slug,
          data: {
            ...entry.data,
            title: (entry.data?.title as string) || title,
            slug: (entry.data?.slug as string) || slug,
          },
        };
      });
    } catch {
      return [];
    }
  },

  // Create Custom Dynamic Schema
  createDynamicSchema: async (
    schema: DynamicSchemaDefinition,
  ): Promise<ContentCollectionMeta> => {
    const meta: SchemaMetadata = {
      is_public: !!schema.isPublic || !!schema.metadata?.is_public,
      parent_schema_id:
        schema.metadata?.parent_schema_id ||
        schema.lineage?.forkedFrom?.schemaId,
      parent_schema_name:
        schema.metadata?.parent_schema_name ||
        schema.lineage?.forkedFrom?.schemaName,
      parent_schema_slug:
        schema.metadata?.parent_schema_slug ||
        schema.lineage?.forkedFrom?.schemaSlug,
      fork_count: schema.metadata?.fork_count ?? schema.lineage?.forkCount ?? 0,
      category: schema.metadata?.category || 'custom',
      ...(schema.metadata || {}),
    };

    const res = await requestHandler.post<{
      id: string;
      name: string;
      slug: string;
      description?: string;
      type: 'collection';
      fields: DynamicFieldDefinition[];
      definition?: {
        fields: DynamicFieldDefinition[];
        metadata?: SchemaMetadata;
      };
      metadata?: SchemaMetadata;
      createdAt: string;
      updatedAt: string;
    }>(ENDPOINTS.SCHEMAS.BASE, {
      name: schema.name,
      slug: schema.slug,
      description: schema.description || undefined,
      type: schema.type,
      fields: schema.fields.map((f, idx) => ({
        apiId: f.apiId.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        displayName: f.displayName,
        dataType: f.dataType,
        isRequired: !!f.isRequired,
        isUnique: !!f.isUnique,
        isLocalized: !!f.isLocalized,
        isRepeatable: !!f.isRepeatable,
        sortOrder: f.sortOrder ?? idx,
        validation: f.validation || null,
        config: f.config || null,
      })),
      metadata: meta,
    });

    const rawCreated = res.data ?? res;
    const data = ((rawCreated as { data?: typeof res.data })?.data ||
      rawCreated) as {
      id: string;
      name: string;
      slug: string;
      description?: string;
      type: 'collection';
      fields: DynamicFieldDefinition[];
      definition?: {
        fields: DynamicFieldDefinition[];
        metadata?: SchemaMetadata;
      };
      metadata?: SchemaMetadata;
      createdAt: string;
      updatedAt: string;
    };

    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      type: 'collection',
      entryCount: 0,
      linkedPagesCount: 0,
      fields: data.fields || schema.fields,
      metadata: meta,
      isPublic: meta.is_public,
      lineage: {
        isForked: !!meta.parent_schema_id,
        forkCount: meta.fork_count || 0,
      },
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  },

  // Toggle Public Status in Schema Metadata
  toggleSchemaPublic: async (
    schemaId: string,
    currentMeta?: SchemaMetadata,
  ): Promise<void> => {
    const isPublic = !currentMeta?.is_public;
    await requestHandler.put(`${ENDPOINTS.SCHEMAS.BASE}/${schemaId}`, {
      metadata: {
        ...(currentMeta || {}),
        is_public: isPublic,
      },
    });
  },

  // List Entries for any Schema
  listEntries: async (
    schemaSlug: string,
    params?: {
      page?: number;
      pageSize?: number;
      search?: string;
      status?: string;
    },
  ): Promise<{
    entries: DynamicContentEntry[];
    total: number;
    page: number;
    pageSize: number;
  }> => {
    const res = await requestHandler.get<{
      data: PageEntry[];
      meta?: {
        pagination?: { total?: number; page?: number; pageSize?: number };
      };
    }>(ENDPOINTS.CONTENT.BY_SCHEMA(schemaSlug), {
      params: { status: 'all', ...params },
    });
    const rawList = extractArrayPayload<PageEntry>(res.data ?? res);
    const entries: DynamicContentEntry[] = rawList.map((p) => {
      const title = p.title || (p.data?.title as string) || 'Untitled';
      const slug = p.slug || (p.data?.slug as string) || '';
      return {
        id: p.id,
        schemaId: p.schemaId || '',
        schemaSlug,
        locale: p.locale || 'en',
        status: (p.status === 'published' ? 'published' : 'draft') as
          | 'draft'
          | 'published',
        title,
        slug,
        data: {
          title,
          slug,
          ...p.data,
        },
        updatedBy: p.updatedBy,
        createdAt: p.createdAt || new Date().toISOString(),
        updatedAt: p.updatedAt || new Date().toISOString(),
      };
    });

    const metaObj = (res.data ?? res) as {
      meta?: {
        pagination?: { total?: number; page?: number; pageSize?: number };
      };
    };

    return {
      entries,
      total: metaObj?.meta?.pagination?.total ?? entries.length,
      page: metaObj?.meta?.pagination?.page ?? 1,
      pageSize: metaObj?.meta?.pagination?.pageSize ?? 20,
    };
  },

  // Create Content Entry
  createEntry: async (
    schemaSlug: string,
    data: Record<string, unknown>,
  ): Promise<DynamicContentEntry> => {
    const { title: rawTitle, slug: rawSlug, ...rest } = data;
    const title =
      typeof rawTitle === 'string' && rawTitle.trim()
        ? rawTitle.trim()
        : 'Untitled';
    const slug =
      typeof rawSlug === 'string' && rawSlug.trim()
        ? rawSlug.trim()
        : `entry-${Math.random().toString(36).substring(2, 8)}`;
    const payload = {
      ...rest,
      title,
      slug,
    };

    const res = await requestHandler.post<PageEntry>(
      ENDPOINTS.CONTENT.BY_SCHEMA(schemaSlug),
      payload,
    );

    const rawCreated = res.data ?? res;
    const created = ((rawCreated as { data?: PageEntry })?.data ||
      rawCreated) as PageEntry;
    const entryTitle =
      created.title || (created.data?.title as string) || title;
    const entrySlug = created.slug || (created.data?.slug as string) || slug;
    return {
      id: created.id,
      schemaId: created.schemaId || '',
      schemaSlug,
      locale: created.locale || 'en',
      status: (created.status === 'published' ? 'published' : 'draft') as
        | 'draft'
        | 'published',
      title: entryTitle,
      slug: entrySlug,
      data: {
        title: entryTitle,
        slug: entrySlug,
        ...created.data,
      },
      updatedBy: created.updatedBy,
      createdAt: created.createdAt || new Date().toISOString(),
      updatedAt: created.updatedAt || new Date().toISOString(),
    };
  },

  // Update Content Entry
  updateEntry: async (
    schemaSlug: string,
    entryId: string,
    data: Record<string, unknown>,
  ): Promise<DynamicContentEntry> => {
    const { title: rawTitle, slug: rawSlug, ...rest } = data;
    const title =
      typeof rawTitle === 'string' && rawTitle.trim()
        ? rawTitle.trim()
        : 'Untitled';
    const slug =
      typeof rawSlug === 'string' && rawSlug.trim() ? rawSlug.trim() : 'entry';
    const payload = {
      ...rest,
      title,
      slug,
    };

    const res = await requestHandler.put<PageEntry>(
      ENDPOINTS.CONTENT.ENTRY(schemaSlug, entryId),
      payload,
    );

    const rawUpdated = res.data ?? res;
    const updated = ((rawUpdated as { data?: PageEntry })?.data ||
      rawUpdated) as PageEntry;
    const entryTitle =
      updated.title || (updated.data?.title as string) || title;
    const entrySlug = updated.slug || (updated.data?.slug as string) || slug;
    return {
      id: updated.id,
      schemaId: updated.schemaId || '',
      schemaSlug,
      locale: updated.locale || 'en',
      status: (updated.status === 'published' ? 'published' : 'draft') as
        | 'draft'
        | 'published',
      title: entryTitle,
      slug: entrySlug,
      data: {
        title: entryTitle,
        slug: entrySlug,
        ...updated.data,
      },
      updatedBy: updated.updatedBy,
      createdAt: updated.createdAt || new Date().toISOString(),
      updatedAt: updated.updatedAt || new Date().toISOString(),
    };
  },

  // Delete Content Entry
  deleteEntry: async (schemaSlug: string, entryId: string): Promise<void> => {
    await requestHandler.delete(ENDPOINTS.CONTENT.ENTRY(schemaSlug, entryId));
  },

  // Publish Content Entry
  publishEntry: async (schemaSlug: string, entryId: string): Promise<void> => {
    await requestHandler.post(
      `${ENDPOINTS.CONTENT.ENTRY(schemaSlug, entryId)}/publish`,
    );
  },

  // Batch Import Entries
  batchImportEntries: async (
    schemaSlug: string,
    entries: Array<Record<string, unknown>>,
  ): Promise<{ importedCount: number; errors: string[] }> => {
    let importedCount = 0;
    const errors: string[] = [];

    for (const entry of entries) {
      try {
        await postsApi.createEntry(schemaSlug, entry);
        importedCount++;
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : `Failed to import entry ${entry.title || 'untitled'}`;
        errors.push(msg);
      }
    }

    return { importedCount, errors };
  },

  // Shared Template Hub (Reads from built-in + live public schemas in DB metadata)
  getSharedTemplates: (
    collections: ContentCollectionMeta[] = [],
  ): CrossSiteSharedTemplate[] => {
    const publicCollectionTemplates: CrossSiteSharedTemplate[] = collections
      .filter((c) => c.metadata?.is_public || c.isPublic)
      .map((c) => ({
        id: `public-${c.id}`,
        title: c.name,
        category: c.metadata?.category || 'custom',
        description:
          c.description ||
          'Community-published dynamic schema with reusable fields & visual bindings.',
        schema: {
          name: c.name,
          slug: c.slug,
          type: 'collection',
          fields: c.fields,
          metadata: c.metadata,
        },
        slots: [
          {
            slotId: 'slot-title',
            label: 'Title',
            fieldApiId: 'title',
            fieldType: 'text',
          },
          {
            slotId: 'slot-body',
            label: 'Body Container',
            fieldApiId: 'body',
            fieldType: 'json',
          },
        ],
        isPublic: true,
        forkCount: c.metadata?.fork_count || 0,
        authorSite: 'Universal Registry',
      }));

    return [...FORKABLE_SHARED_TEMPLATES, ...publicCollectionTemplates];
  },

  // Fork a template to this site
  forkTemplate: async (
    template: CrossSiteSharedTemplate,
    customName?: string,
    customSlug?: string,
  ): Promise<ContentCollectionMeta> => {
    const meta: SchemaMetadata = {
      is_public: false,
      parent_schema_id: template.id,
      parent_schema_name: template.title,
      parent_schema_slug: template.schema.slug,
      fork_count: 0,
      category: template.category,
      forked_at: new Date().toISOString(),
    };

    const schemaToCreate: DynamicSchemaDefinition = {
      name: customName || `${template.title} (Forked)`,
      slug:
        customSlug ||
        `${template.schema.slug}-forked-${Math.random().toString(36).substring(2, 6)}`,
      description: `Forked from ${template.authorSite}: ${template.description}`,
      type: 'collection',
      fields: template.schema.fields,
      metadata: meta,
    };

    return await postsApi.createDynamicSchema(schemaToCreate);
  },

  // Fork any existing collection schema with complete lineage tracking in metadata
  forkSchema: async (
    sourceCollection: ContentCollectionMeta,
    newName?: string,
    newSlug?: string,
  ): Promise<ContentCollectionMeta> => {
    const finalName = newName || `${sourceCollection.name} (Forked)`;
    const finalSlug =
      newSlug ||
      `${sourceCollection.slug}-fork-${Math.random().toString(36).substring(2, 6)}`;

    const meta: SchemaMetadata = {
      is_public: false,
      parent_schema_id: sourceCollection.id,
      parent_schema_name: sourceCollection.name,
      parent_schema_slug: sourceCollection.slug,
      fork_count: 0,
      category: sourceCollection.metadata?.category || 'custom',
      forked_at: new Date().toISOString(),
    };

    const created = await postsApi.createDynamicSchema({
      name: finalName,
      slug: finalSlug,
      description: `Forked from schema ${sourceCollection.name} (${sourceCollection.slug})`,
      type: 'collection',
      fields: sourceCollection.fields,
      metadata: meta,
    });

    // Increment fork_count on parent schema via metadata update
    try {
      const nextForkCount = (sourceCollection.metadata?.fork_count || 0) + 1;
      await requestHandler.put(
        `${ENDPOINTS.SCHEMAS.BASE}/${sourceCollection.id}`,
        {
          metadata: {
            ...(sourceCollection.metadata || {}),
            fork_count: nextForkCount,
          },
        },
      );
    } catch {
      // Non-blocking
    }

    return created;
  },
};
