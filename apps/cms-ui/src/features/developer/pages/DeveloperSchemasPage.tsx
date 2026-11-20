import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Puzzle,
  Plus,
  Edit2,
  Lock,
  Loader2,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CMS_THEME_CLASSES } from '@/tokens/colorTokens';
import { postsApi, extractArrayPayload } from '../../posts/api/posts.api';
import { collectionsApi } from '../../collections/api/collections.api';
import type {
  PageEntry,
  PageCustomSchema,
  DynamicFieldDefinition,
} from '@/types/content.types';
import { useCmsToast } from '@/hooks/useCmsToast';
import { SchemaModelBuilderDrawer } from '../components/SchemaModelBuilderDrawer';
import type {
  SchemaModelData,
  SchemaToDeleteItem,
} from '../types/developer.types';

export const DeveloperSchemasPage: React.FC = () => {
  const { siteId = '' } = useParams<{ siteId: string }>();
  const toast = useCmsToast();
  const queryClient = useQueryClient();

  const [activeSchemaForDrawer, setActiveSchemaForDrawer] =
    useState<SchemaModelData | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [schemaToDelete, setSchemaToDelete] =
    useState<SchemaToDeleteItem | null>(null);

  // Fetch real pages under this site to discover active schemas
  const { data: rawPages, isLoading } = useQuery({
    queryKey: ['site-pages', siteId],
    queryFn: () => (siteId ? postsApi.listPagesForCollection(siteId) : []),
    enabled: Boolean(siteId),
    staleTime: 5 * 60 * 1000,
  });

  const sitePages = useMemo(
    () => extractArrayPayload<PageEntry>(rawPages),
    [rawPages],
  );

  // Aggregate schemas attached to this website's pages
  const schemas = useMemo(() => {
    const schemaMap = new Map<
      string,
      {
        id: string;
        name: string;
        slug: string;
        description?: string;
        entryType: 'single' | 'multi';
        fields: DynamicFieldDefinition[];
        fieldsList: string[];
        assignedPages: string[];
      }
    >();

    for (const page of sitePages) {
      const pageTitle =
        page.title ||
        (page.data?.title as string) ||
        page.slug ||
        'Untitled Page';
      const pageSchemas: PageCustomSchema[] =
        (page.data?._schemas as PageCustomSchema[]) ||
        (page.schemas as unknown as PageCustomSchema[]) ||
        [];

      for (const s of pageSchemas) {
        if (!s || (!s.slug && !s.name && !s.id)) continue;
        const key = s.slug || s.id || s.name;

        const isMulti =
          s.entryType === 'multi' ||
          (Array.isArray(s.items) && s.items.length > 0);

        let fieldsList: string[] = [];
        if (Array.isArray(s.fields) && s.fields.length > 0) {
          fieldsList = s.fields
            .map((f) => f.displayName || f.apiId)
            .filter(Boolean);
        } else if (Array.isArray(s.items) && s.items.length > 0 && s.items[0]) {
          fieldsList = Object.keys(s.items[0])
            .filter((k) => !['_id', 'id'].includes(k))
            .map(
              (k) => k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' '),
            );
        } else {
          fieldsList = ['Title', 'Description'];
        }

        const existing = schemaMap.get(key);
        if (existing) {
          if (!existing.assignedPages.includes(pageTitle)) {
            existing.assignedPages.push(pageTitle);
          }
          if (s.fields && s.fields.length > existing.fields.length) {
            existing.fields = s.fields;
            existing.fieldsList = fieldsList;
          }
        } else {
          schemaMap.set(key, {
            id: s.id || key,
            name: s.name || s.slug || 'Custom Schema',
            slug: s.slug || key,
            description: s.description || '',
            entryType: isMulti ? 'multi' : 'single',
            fields:
              Array.isArray(s.fields) && s.fields.length > 0
                ? s.fields
                : [
                    {
                      apiId: 'title',
                      displayName: 'Title / Headline',
                      dataType: 'text',
                      isRequired: true,
                    },
                    {
                      apiId: 'description',
                      displayName: 'Description',
                      dataType: 'textarea',
                    },
                  ],
            fieldsList,
            assignedPages: [pageTitle],
          });
        }
      }
    }

    return Array.from(schemaMap.values()).map((s) => ({
      ...s,
      assignedCount: s.assignedPages.length,
      assignedDisplay:
        s.assignedPages.length > 0
          ? s.assignedPages.slice(0, 3).join(', ') +
            (s.assignedPages.length > 3
              ? ` +${s.assignedPages.length - 3} more`
              : '')
          : 'Unassigned',
    }));
  }, [sitePages]);

  // Save / Update mutation (persists schema definition into the site's pages)
  const saveMutation = useMutation({
    mutationFn: async (data: SchemaModelData) => {
      if (!siteId) throw new Error('No site selected');

      if (data.id) {
        // Updating existing schema across all pages that carry it
        let updatedAny = false;
        for (const page of sitePages) {
          const currentSchemas =
            (page.data?._schemas as PageCustomSchema[]) ||
            (page.schemas as unknown as PageCustomSchema[]) ||
            [];

          const hasSchema = currentSchemas.some(
            (s) =>
              s.id === data.id || s.slug === data.slug || s.name === data.name,
          );

          if (hasSchema) {
            const updatedSchemas = currentSchemas.map((s) => {
              if (
                s.id === data.id ||
                s.slug === data.slug ||
                s.name === data.name
              ) {
                return {
                  ...s,
                  name: data.name,
                  slug: data.slug,
                  description: data.description,
                  entryType: data.entryType,
                  fields: data.fields,
                };
              }
              return s;
            });

            await collectionsApi.updatePage(siteId, page.id, {
              title: page.title ?? '',
              slug: page.slug ?? '',
              ...page.data,
              _schemas: updatedSchemas,
            });
            updatedAny = true;
          }
        }

        // If schema wasn't yet attached to pages, attach to the first page
        if (!updatedAny && sitePages.length > 0) {
          const firstPage = sitePages[0]!;
          const currentSchemas =
            (firstPage.data?._schemas as PageCustomSchema[]) || [];
          const updatedSchemas = [
            ...currentSchemas,
            {
              id: data.slug,
              name: data.name,
              slug: data.slug,
              description: data.description,
              entryType: data.entryType,
              fields: data.fields,
              values: {},
              items: [],
            },
          ];
          await collectionsApi.updatePage(siteId, firstPage.id, {
            title: firstPage.title ?? '',
            slug: firstPage.slug ?? '',
            ...firstPage.data,
            _schemas: updatedSchemas,
          });
        }
      } else {
        // Creating a new schema: attach to first page of the site
        const newSchema: PageCustomSchema = {
          id: data.slug,
          name: data.name,
          slug: data.slug,
          description: data.description,
          entryType: data.entryType,
          fields: data.fields,
          values: {},
          items: [],
        };

        if (sitePages.length > 0) {
          const firstPage = sitePages[0]!;
          const currentSchemas =
            (firstPage.data?._schemas as PageCustomSchema[]) || [];
          await collectionsApi.updatePage(siteId, firstPage.id, {
            title: firstPage.title ?? '',
            slug: firstPage.slug ?? '',
            ...firstPage.data,
            _schemas: [...currentSchemas, newSchema],
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-pages', siteId] });
      queryClient.invalidateQueries({ queryKey: ['collection-pages', siteId] });
      toast.show({
        title: 'Schema Saved',
        message: 'Schema model definitions successfully updated.',
        type: 'success',
      });
      setIsDrawerOpen(false);
      setActiveSchemaForDrawer(null);
    },
    onError: (err: Error) => {
      toast.show({
        title: 'Error',
        message: err?.message || 'Failed to save schema definition',
        type: 'error',
      });
    },
  });

  // Delete mutation: removes schema definition from all pages in this site
  const deleteMutation = useMutation({
    mutationFn: async (schemaId: string) => {
      if (!siteId) return;
      for (const page of sitePages) {
        const currentSchemas =
          (page.data?._schemas as PageCustomSchema[]) ||
          (page.schemas as unknown as PageCustomSchema[]) ||
          [];

        const remaining = currentSchemas.filter(
          (s) => s.id !== schemaId && s.slug !== schemaId,
        );

        if (remaining.length !== currentSchemas.length) {
          await collectionsApi.updatePage(siteId, page.id, {
            title: page.title ?? '',
            slug: page.slug ?? '',
            ...page.data,
            _schemas: remaining,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-pages', siteId] });
      queryClient.invalidateQueries({ queryKey: ['collection-pages', siteId] });
      toast.show({
        title: 'Schema Removed',
        message: 'Schema removed from this site workspace.',
        type: 'success',
      });
      setSchemaToDelete(null);
    },
    onError: (err: Error) => {
      toast.show({
        title: 'Error',
        message: err?.message || 'Failed to delete schema',
        type: 'error',
      });
    },
  });

  const handleOpenCreate = () => {
    setActiveSchemaForDrawer(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (schema: (typeof schemas)[0]) => {
    setActiveSchemaForDrawer({
      id: schema.id,
      name: schema.name,
      slug: schema.slug,
      description: schema.description,
      entryType: schema.entryType,
      fields: schema.fields,
    });
    setIsDrawerOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground animate-in fade-in duration-200">
      {/* Header */}
      <header className="px-8 py-5 border-b border-border bg-card/60 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link to="/" className="hover:text-foreground transition-colors">
              Websites
            </Link>
            <span>/</span>
            <span className="capitalize">{siteId}</span>
            <span>/</span>
            <span className="text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1">
              <Lock size={11} /> Developer Studio
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Puzzle className="h-6 w-6 text-amber-700 dark:text-amber-400" />
            Schema Model Builder
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Build Single-Entry and Multi-Entry field definitions for content
            sections in {siteId}.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className={CMS_THEME_CLASSES.buttons.primary}
        >
          <Plus size={14} />
          <span>Create New Schema</span>
        </button>
      </header>

      {/* Role-Gate Developer Notice */}
      <div className="px-8 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2 font-medium">
        <Lock size={13} className="shrink-0" />
        <span>
          Developer Workshop Mode: Changes made here update the content schemas
          for authors without altering existing database records.
        </span>
      </div>

      {/* Schemas List Table */}
      <div className="flex-1 overflow-y-auto p-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-xs">Loading schema definitions...</span>
          </div>
        ) : schemas.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-xl bg-card">
            <Puzzle className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <h3 className="text-sm font-semibold text-foreground">
              No schemas defined for {siteId}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Create your first schema model to provide structured fields for
              authors.
            </p>
            <button
              type="button"
              onClick={handleOpenCreate}
              className={CMS_THEME_CLASSES.buttons.primary}
            >
              <Plus size={14} />
              <span>Create First Schema</span>
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="py-3 px-4">Schema Name</th>
                  <th className="py-3 px-4">Entry Type</th>
                  <th className="py-3 px-4">Fields Defined</th>
                  <th className="py-3 px-4">Assigned To Pages</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {schemas.map((schema) => (
                  <tr
                    key={schema.id}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <Puzzle size={15} className="text-primary shrink-0" />
                        <span>{schema.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground block mt-0.5">
                        {schema.slug}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {schema.entryType === 'multi' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                          Multi-Entry (Repeatable)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          Single-Entry
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground max-w-xs truncate">
                      {schema.fieldsList.join(', ')}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {schema.assignedDisplay}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(schema)}
                          className={CMS_THEME_CLASSES.buttons.secondary}
                          title="Edit Schema"
                        >
                          <Edit2 size={12} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setSchemaToDelete({
                              id: schema.id,
                              name: schema.name,
                              assignedCount: schema.assignedCount,
                            })
                          }
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete Schema"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Visual Field Builder Drawer */}
      <SchemaModelBuilderDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setActiveSchemaForDrawer(null);
        }}
        schema={activeSchemaForDrawer}
        onSave={async (data) => {
          await saveMutation.mutateAsync(data);
        }}
        isSaving={saveMutation.isPending}
      />

      {/* Safe Delete Confirmation Dialog */}
      {schemaToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-2xl max-w-sm w-full p-6 shadow-2xl text-card-foreground">
            <div className="flex items-center gap-2 mb-2 text-foreground font-bold">
              {schemaToDelete.assignedCount > 0 ? (
                <AlertTriangle className="size-5 text-amber-700 dark:text-amber-400 shrink-0" />
              ) : (
                <Trash2 className="size-5 text-destructive shrink-0" />
              )}
              <h3 className="text-base font-bold">Delete Schema Model</h3>
            </div>

            {schemaToDelete.assignedCount > 0 ? (
              <div className="p-3 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
                Warning: &ldquo;{schemaToDelete.name}&rdquo; is currently
                attached to{' '}
                <span className="font-bold">
                  {schemaToDelete.assignedCount} page(s)
                </span>
                . Deleting it will remove the schema structure from those pages.
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
                Are you sure you want to permanently delete{' '}
                <span className="text-foreground font-semibold">
                  &ldquo;{schemaToDelete.name}&rdquo;
                </span>
                ?
              </p>
            )}

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSchemaToDelete(null)}
                className="px-4 py-2 text-xs font-medium rounded-xl border border-border text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(schemaToDelete.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground flex items-center gap-1.5 shadow-xs transition-colors"
              >
                {deleteMutation.isPending && (
                  <Loader2 className="size-3.5 animate-spin" />
                )}
                <span>Delete Schema</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
