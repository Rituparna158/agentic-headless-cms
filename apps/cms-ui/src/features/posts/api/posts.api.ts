import { requestHandler } from '../../../api/requestHandler';
import { ENDPOINTS } from '../../../api/endpoints';
import {
  collectionsApi,
  PageEntry,
} from '../../collections/api/collections.api';
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

export const postsApi = {
  // Collections & Schema Explorer
  listCollections: async (): Promise<ContentCollectionMeta[]> => {
    const res = await collectionsApi.listSchemas({ pageSize: 50 });
    const schemas = (res.data || []) as Array<
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

    const collectionsWithStats: ContentCollectionMeta[] = await Promise.all(
      schemas.map(async (s) => {
        let entryCount = s.entryCount || 0;
        let linkedPagesCount = 0;
        try {
          const entriesRes = await collectionsApi.listPages(s.slug, {
            pageSize: 1,
          });
          entryCount = entriesRes.meta?.pagination?.total ?? entryCount;
          linkedPagesCount = entryCount;
        } catch {
          // Fallback if content query fails
        }

        const def = s.definition || {};
        const schemaFields = (
          Array.isArray(s.fields)
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
          type: s.type,
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
      const res = await collectionsApi.listPages(schemaSlug, { pageSize: 50 });
      return res.data || [];
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

    const data = res.data;
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
    params?: { page?: number; pageSize?: number; search?: string },
  ): Promise<{
    entries: DynamicContentEntry[];
    total: number;
    page: number;
    pageSize: number;
  }> => {
    const res = await collectionsApi.listPages(schemaSlug, params);
    const entries: DynamicContentEntry[] = (res.data || []).map((p) => ({
      id: p.id,
      schemaId: p.schemaId,
      schemaSlug,
      locale: p.locale,
      status: p.status,
      data: p.data,
      updatedBy: p.updatedBy,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return {
      entries,
      total: res.meta?.pagination?.total ?? entries.length,
      page: res.meta?.pagination?.page ?? 1,
      pageSize: res.meta?.pagination?.pageSize ?? 20,
    };
  },

  // Create Content Entry
  createEntry: async (
    schemaSlug: string,
    data: Record<string, unknown>,
  ): Promise<DynamicContentEntry> => {
    const res = await collectionsApi.createPage(schemaSlug, {
      title: typeof data.title === 'string' ? data.title : 'Untitled',
      slug:
        typeof data.slug === 'string' && data.slug
          ? data.slug
          : `entry-${Math.random().toString(36).substring(2, 8)}`,
      ...data,
    });

    return {
      id: res.id,
      schemaId: res.schemaId,
      schemaSlug,
      locale: res.locale,
      status: res.status,
      data: res.data,
      updatedBy: res.updatedBy,
      createdAt: res.createdAt,
      updatedAt: res.updatedAt,
    };
  },

  // Update Content Entry
  updateEntry: async (
    schemaSlug: string,
    entryId: string,
    data: Record<string, unknown>,
  ): Promise<DynamicContentEntry> => {
    const res = await collectionsApi.updatePage(schemaSlug, entryId, {
      title: typeof data.title === 'string' ? data.title : 'Untitled',
      slug: typeof data.slug === 'string' && data.slug ? data.slug : 'entry',
      ...data,
    });

    return {
      id: res.id,
      schemaId: res.schemaId,
      schemaSlug,
      locale: res.locale,
      status: res.status,
      data: res.data,
      updatedBy: res.updatedBy,
      createdAt: res.createdAt,
      updatedAt: res.updatedAt,
    };
  },

  // Delete Content Entry
  deleteEntry: async (schemaSlug: string, entryId: string): Promise<void> => {
    await collectionsApi.deletePage(schemaSlug, entryId);
  },

  // Publish Content Entry
  publishEntry: async (schemaSlug: string, entryId: string): Promise<void> => {
    await collectionsApi.publishPage(schemaSlug, entryId);
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
