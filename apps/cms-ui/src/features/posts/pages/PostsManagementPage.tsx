import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Eye,
  Palette,
  Boxes,
  ChevronRight,
  X,
} from 'lucide-react';
import { postsApi, extractArrayPayload } from '../api/posts.api';
import type { PageEntry, ContentCollectionMeta } from '@/types/content.types';
import { PageSideDrawer } from '@/components/PageSideDrawer';
import { slugify } from '@/utils/slugify.util';
import { useToast } from '@repo/shared-ui';
import { InlineErrorAlert } from '@/components/ui/InlineErrorAlert';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { DeletePageModal } from '@/components/modals/DeletePageModal';

export const PostsManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  // Selected collection slug state (defaults to first collection or URL param)
  const [selectedCollectionSlug, setSelectedCollectionSlug] = useState<string>(
    () => searchParams.get('collection') || '',
  );

  // Search filter for collections list in left sidebar
  const [collectionSearch, setCollectionSearch] = useState('');

  // Selected page for the side drawer
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Search filter for pages in active collection
  const [search, setSearch] = useState('');

  // New Page Modal State
  const [isCreatePageOpen, setIsCreatePageOpen] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');

  // Delete Page Modal State
  const [pageToDelete, setPageToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // 1. Fetch Collections
  const collectionsQuery = useQuery({
    queryKey: ['post-collections'],
    queryFn: () => postsApi.listCollections(),
  });

  // Sort collections chronologically (earliest created collection appears first)
  const collections: ContentCollectionMeta[] = useMemo(() => {
    const list = extractArrayPayload<ContentCollectionMeta>(
      collectionsQuery.data,
    );
    return list
      .filter((c) => !c.type || c.type === 'collection')
      .sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      });
  }, [collectionsQuery.data]);

  // Filtered collections for master list
  const filteredCollections = useMemo(() => {
    if (!collectionSearch.trim()) return collections;
    const q = collectionSearch.toLowerCase().trim();
    return collections.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q),
    );
  }, [collections, collectionSearch]);

  // Determine active collection
  const activeCollection = useMemo(() => {
    if (!collections.length) return null;
    if (selectedCollectionSlug) {
      const match = collections.find((c) => c.slug === selectedCollectionSlug);
      if (match) return match;
    }
    // Default to first collection
    return collections[0] || null;
  }, [collections, selectedCollectionSlug]);

  const currentSlug = activeCollection?.slug || '';

  // 2. Fetch Pages for active collection
  const pagesQuery = useQuery({
    queryKey: ['collection-pages', currentSlug],
    queryFn: () => postsApi.listPagesForCollection(currentSlug),
    enabled: !!currentSlug,
  });

  const pages: PageEntry[] = useMemo(
    () => extractArrayPayload<PageEntry>(pagesQuery.data),
    [pagesQuery.data],
  );

  // Determine active page for side drawer
  const activePage = useMemo(() => {
    if (!pages.length || !activePageId) return null;
    return pages.find((p) => p.id === activePageId) || null;
  }, [pages, activePageId]);

  // Create page
  const createPageMutation = useMutation({
    mutationFn: async ({ title, slug }: { title: string; slug: string }) => {
      if (!currentSlug) throw new Error('No collection selected');
      return await postsApi.createEntry(currentSlug, {
        title,
        slug,
        body: [],
      });
    },
    onSuccess: (newPage) => {
      queryClient.invalidateQueries({
        queryKey: ['collection-pages', currentSlug],
      });
      queryClient.invalidateQueries({ queryKey: ['post-collections'] });
      setIsCreatePageOpen(false);
      setNewPageTitle('');
      setNewPageSlug('');
      setActivePageId(newPage.id);
      setIsDrawerOpen(true);
      toast.success(`Page "${newPage.title}" created!`);
    },
    onError: () => {
      toast.error('Failed to create page.');
    },
  });

  // Delete page
  const deletePageMutation = useMutation({
    mutationFn: async (pageId: string) => {
      if (!currentSlug) return;
      await postsApi.deleteEntry(currentSlug, pageId);
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({
        queryKey: ['collection-pages', currentSlug],
      });
      queryClient.invalidateQueries({ queryKey: ['post-collections'] });
      if (activePageId === deletedId) {
        setIsDrawerOpen(false);
        setActivePageId(null);
      }
      toast.success('Page deleted successfully.');
    },
    onError: () => {
      toast.error('Failed to delete page.');
    },
  });

  // Save / Update page data
  const updatePageMutation = useMutation({
    mutationFn: async ({
      pageId,
      data,
      publishImmediately,
    }: {
      pageId: string;
      data: Record<string, unknown>;
      publishImmediately: boolean;
    }) => {
      if (!currentSlug) throw new Error('No collection selected');
      const updated = await postsApi.updateEntry(currentSlug, pageId, {
        title: typeof data.title === 'string' ? data.title : 'Untitled',
        slug: typeof data.slug === 'string' ? data.slug : 'page',
        ...data,
      });

      if (publishImmediately) {
        await postsApi.publishEntry(currentSlug, pageId);
      }

      return { updated, publishImmediately };
    },
    onSuccess: ({ publishImmediately }) => {
      queryClient.invalidateQueries({
        queryKey: ['collection-pages', currentSlug],
      });
      toast.success(
        publishImmediately
          ? 'Page published live!'
          : 'Page draft saved successfully!',
      );
    },
    onError: () => {
      toast.error('Failed to save page data.');
    },
  });

  // Filtered pages for table
  const filteredPages = useMemo(() => {
    if (!search.trim()) return pages;
    const q = search.toLowerCase().trim();
    return pages.filter(
      (p) =>
        (p.data?.title || p.title)?.toLowerCase().includes(q) ||
        (p.data?.slug || p.slug)?.toLowerCase().includes(q),
    );
  }, [pages, search]);

  const handleOpenPageDrawer = (pageId: string) => {
    setActivePageId(pageId);
    setIsDrawerOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-[#09090b] text-zinc-100 animate-in fade-in duration-300">
      {/* Top Header - Matches Roles & Access Page layout with Dark Palette */}
      <div className="px-6 py-6 border-b border-zinc-800/80 bg-[#09090b]">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
          Posts
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Manage collections, pages, and schema dynamic bindings.
        </p>
      </div>

      {/* Split Master / Detail Layout below header */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Master List of Collections */}
        <div className="w-64 border-r border-zinc-800 bg-[#0c0c0e] flex flex-col shrink-0">
          <div className="p-4 flex items-center justify-between border-b border-zinc-800/80">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Collections
            </span>
          </div>

          {/* Quick Filter */}
          <div className="p-3 border-b border-zinc-800/60">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500" />
              <input
                type="text"
                value={collectionSearch}
                onChange={(e) => setCollectionSearch(e.target.value)}
                placeholder="Filter collections..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Collections List */}
          <div className="flex-1 overflow-y-auto py-2">
            {collectionsQuery.isError ? (
              <div className="p-3">
                <InlineErrorAlert
                  title="Failed to load"
                  message={collectionsQuery.error}
                  onRetry={() => collectionsQuery.refetch()}
                  isRetrying={collectionsQuery.isFetching}
                />
              </div>
            ) : collectionsQuery.isLoading ? (
              <div className="px-4 py-2 text-xs text-zinc-500">
                Loading collections...
              </div>
            ) : filteredCollections.length === 0 ? (
              <div className="px-4 py-2 text-xs text-zinc-500">
                {collectionSearch ? 'No collections found' : 'No collections'}
              </div>
            ) : (
              <ul className="space-y-1 px-2">
                {filteredCollections.map((col) => {
                  const isSelected = col.slug === currentSlug;
                  return (
                    <li key={col.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedCollectionSlug(col.slug)}
                        className={`w-full text-left px-3 py-2.5 text-xs rounded-xl transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-600/15 border border-indigo-500/30 text-indigo-300 font-semibold shadow-xs'
                            : 'border border-transparent hover:bg-zinc-900/80 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <span className="truncate">{col.name}</span>
                        <span className="text-xs text-zinc-400 font-mono ml-2 shrink-0 px-1.5 py-0.5 rounded bg-zinc-800/80">
                          {col.entryCount ?? 0}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Right Column: Detail Panel */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#09090b]">
          {!activeCollection ? (
            <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
              Select a collection to view pages or manage content.
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Detail Header */}
              <div className="flex items-center justify-between p-6 border-b border-zinc-800/80 bg-[#09090b]">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-bold text-zinc-100 tracking-tight">
                      {activeCollection.name}
                    </h2>
                    <span className="px-2 py-0.5 rounded-md bg-zinc-900 text-xs font-mono text-zinc-400 border border-zinc-800">
                      /{activeCollection.slug}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    {activeCollection.description ||
                      `Manage pages and content schemas for ${activeCollection.name}. Click any page to open the side drawer.`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreatePageOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all"
                  >
                    <Plus className="size-4" />
                    <span>New Page</span>
                  </button>
                </div>
              </div>

              {/* Detail Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Search & Stats Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={`Search pages in ${activeCollection.name}...`}
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-zinc-400">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800">
                      <span className="size-1.5 rounded-full bg-emerald-400" />
                      {pages.length} Pages
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800">
                      <Boxes className="size-3 text-indigo-400" />
                      {activeCollection.fields?.length || 0} Schema Slots
                    </span>
                  </div>
                </div>

                {/* Table, Error, or Empty State */}
                {pagesQuery.isError && (
                  <InlineErrorAlert
                    title="Failed to load collection pages"
                    message={pagesQuery.error}
                    onRetry={() => pagesQuery.refetch()}
                    isRetrying={pagesQuery.isFetching}
                  />
                )}

                {pagesQuery.isLoading ? (
                  <div className="py-24 flex flex-col items-center justify-center text-zinc-500 space-y-2">
                    <div className="size-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                    <p className="text-xs">Loading collection pages...</p>
                  </div>
                ) : !pagesQuery.isError && filteredPages.length === 0 ? (
                  <EmptyStateCard
                    icon={FileText}
                    title={
                      search
                        ? 'No matching pages'
                        : 'No pages in this collection yet'
                    }
                    description={
                      search
                        ? `No pages matched "${search}". Try adjusting your search term.`
                        : `There are no pages created for "${activeCollection.name}" yet.`
                    }
                    actionLabel={search ? 'Clear Search' : 'Create First Page'}
                    onAction={() => {
                      if (search) setSearch('');
                      else setIsCreatePageOpen(true);
                    }}
                    tip="Pages support dynamic schema slots, GrapesJS layouts, and instant previews"
                  />
                ) : (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-xl">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 font-medium">
                          <th className="py-3.5 px-4">Page Title & Slug</th>
                          <th className="py-3.5 px-4">Schema Status</th>
                          <th className="py-3.5 px-4">Publish Status</th>
                          <th className="py-3.5 px-4">Updated</th>
                          <th className="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {filteredPages.map((page) => {
                          const isPublished = page.status === 'published';
                          const cleanSlug = String(
                            page.data?.slug || page.slug || page.id || '',
                          ).replace(/^\/+/, '');
                          const pageTitle =
                            page.data?.title ||
                            page.title ||
                            (page.data?.name as string) ||
                            'Untitled Page';

                          return (
                            <tr
                              key={page.id}
                              onClick={() => handleOpenPageDrawer(page.id)}
                              className="hover:bg-zinc-800/40 transition-colors group cursor-pointer"
                            >
                              {/* Page Title & Slug */}
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="size-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                                    {pageTitle.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-semibold text-zinc-200 group-hover:text-indigo-300 transition-colors truncate max-w-md">
                                      {pageTitle}
                                    </span>
                                    <span className="text-[11px] font-mono text-zinc-500">
                                      /{cleanSlug}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Schema Status */}
                              <td className="py-3.5 px-4">
                                {Array.isArray(page.data?._schemas) &&
                                (page.data._schemas as unknown[]).length > 0 ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-600/10 border border-indigo-500/20 text-[11px] text-indigo-300 font-mono">
                                    <Boxes className="size-3 text-indigo-400" />
                                    <span>
                                      {(page.data._schemas as unknown[]).length}{' '}
                                      {(page.data._schemas as unknown[])
                                        .length === 1
                                        ? 'Schema'
                                        : 'Schemas'}
                                    </span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800/50 border border-zinc-700/30 text-[11px] text-zinc-500 font-mono">
                                    <span>No Schema</span>
                                  </span>
                                )}
                              </td>

                              {/* Publish Status */}
                              <td className="py-3.5 px-4">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                                    isPublished
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  }`}
                                >
                                  {isPublished ? (
                                    <CheckCircle2 className="size-2.5" />
                                  ) : (
                                    <Clock className="size-2.5" />
                                  )}
                                  <span>{isPublished ? 'Live' : 'Draft'}</span>
                                </span>
                              </td>

                              {/* Updated Date */}
                              <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px]">
                                {(() => {
                                  const dateVal =
                                    page.updatedAt || page.createdAt;
                                  return dateVal
                                    ? new Date(dateVal).toLocaleDateString()
                                    : '-';
                                })()}
                              </td>

                              {/* Actions */}
                              <td className="py-3.5 px-4 text-right">
                                <div
                                  className="flex items-center justify-end gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      window.open(
                                        `/collections/${activeCollection.slug}/preview/${cleanSlug}`,
                                        '_blank',
                                      )
                                    }
                                    className="p-1.5 rounded-lg text-zinc-400 hover:text-sky-400 hover:bg-zinc-800 transition-colors"
                                    title="Live Preview"
                                  >
                                    <Eye className="size-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      navigate(
                                        `/collections/${activeCollection.slug}/${page.id}`,
                                      )
                                    }
                                    className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800 transition-colors"
                                    title="Open Visual Builder"
                                  >
                                    <Palette className="size-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleOpenPageDrawer(page.id)
                                    }
                                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                                    title="Edit Details & Schema"
                                  >
                                    <ChevronRight className="size-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPageToDelete({
                                        id: page.id,
                                        title: pageTitle,
                                      })
                                    }
                                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                                    title="Delete Page"
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* The Page Side Drawer */}
      <PageSideDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setActivePageId(null);
        }}
        collection={activeCollection}
        page={activePage}
        onSavePage={async (pageId, data, publishImmediately) => {
          await updatePageMutation.mutateAsync({
            pageId,
            data,
            publishImmediately,
          });
        }}
        isSaving={updatePageMutation.isPending}
      />

      {/* Quick Create Page Modal */}
      {isCreatePageOpen && activeCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-100">
                New Page in {activeCollection.name}
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatePageOpen(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="size-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newPageTitle.trim() || !newPageSlug.trim()) return;
                createPageMutation.mutate({
                  title: newPageTitle.trim(),
                  slug: newPageSlug.trim(),
                });
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-zinc-300 font-medium mb-1">
                  Page Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newPageTitle}
                  onChange={(e) => {
                    setNewPageTitle(e.target.value);
                    setNewPageSlug(slugify(e.target.value).replace(/^\/+/, ''));
                  }}
                  placeholder="e.g. Summer Special 2026"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">
                  Page Slug <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newPageSlug}
                  onChange={(e) =>
                    setNewPageSlug(
                      e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
                    )
                  }
                  placeholder="summer-special"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatePageOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    createPageMutation.isPending ||
                    !newPageTitle.trim() ||
                    !newPageSlug.trim()
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium disabled:opacity-50"
                >
                  <Plus className="size-3.5" />
                  <span>
                    {createPageMutation.isPending
                      ? 'Creating...'
                      : 'Create Page'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Double-confirmation Destructive Page Delete Modal */}
      <DeletePageModal
        page={pageToDelete}
        onClose={() => setPageToDelete(null)}
        onConfirm={() => {
          if (pageToDelete) {
            deletePageMutation.mutate(pageToDelete.id);
            setPageToDelete(null);
          }
        }}
        isPending={deletePageMutation.isPending}
        isError={deletePageMutation.isError}
      />
    </div>
  );
};
