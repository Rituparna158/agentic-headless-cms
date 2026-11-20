import { NON_PAGE_KIND_PARAM, isPageEntry } from '@/lib/entryKinds';
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Clock,
  Trash2,
  PenTool,
  Filter,
  Loader2,
} from 'lucide-react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { useConfirm } from '@/hooks/useConfirm';
import { useCmsToast } from '@/hooks/useCmsToast';
import { DeletePageModal } from '@/components/modals/DeletePageModal';
import { CMS_THEME_CLASSES } from '@/tokens/colorTokens';
import type { PageEntry } from '@/types/content.types';
import { postsApi, extractArrayPayload } from '../api/posts.api';
import { WhatToPostDispatcherModal } from '../components/WhatToPostDispatcherModal';
import { useBlogPages } from '@/features/blog/hooks/useBlogPages';
import { blogApi, type BlogPost } from '@/features/blog/api/blog.api';
import type { PostStatusFilter as StatusFilter } from '../types/posts.types';
import { POSTS_PAGE_SIZE as PAGE_SIZE } from '../constants/posts.constants';

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString() : 'Recent';

const StatusBadge: React.FC<{ live: boolean }> = ({ live }) =>
  live ? (
    <span className={CMS_THEME_CLASSES.badges.live}>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      Live
    </span>
  ) : (
    <span className={CMS_THEME_CLASSES.badges.draft}>
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      Draft
    </span>
  );

const Pager: React.FC<{
  total: number;
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  noun: string;
}> = ({ total, page, totalPages, onPrev, onNext, noun }) => (
  <div className="flex items-center justify-between gap-3 px-6 py-2.5 border-t border-border bg-muted/30 text-xs text-muted-foreground">
    <span>
      {total} {noun}
      {total === 1 ? '' : 's'} · Page {page} of {totalPages}
    </span>
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        disabled={page <= 1}
        onClick={onPrev}
        className={`${CMS_THEME_CLASSES.buttons.secondary} disabled:opacity-40`}
      >
        Previous
      </button>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={onNext}
        className={`${CMS_THEME_CLASSES.buttons.secondary} disabled:opacity-40`}
      >
        Next
      </button>
    </div>
  </div>
);

export const PostsManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const toast = useCmsToast();
  const confirmAction = useConfirm();
  const { siteId } = useParams<{ siteId?: string }>();

  const collectionsQuery = useQuery({
    queryKey: ['post-collections'],
    queryFn: () => postsApi.listCollections(),
    staleTime: 5 * 60 * 1000,
  });
  const collections = useMemo(
    () =>
      extractArrayPayload<{ slug: string; id: string; name: string }>(
        collectionsQuery.data,
      ),
    [collectionsQuery.data],
  );
  const activeCollection = useMemo(() => {
    if (!collections.length) return null;
    return (
      collections.find((c) => c.slug === siteId || c.id === siteId) ??
      collections[0] ??
      null
    );
  }, [collections, siteId]);
  const currentSlug = activeCollection?.slug || siteId || '';
  const activeSiteName = activeCollection?.name || siteId || 'Current Website';
  const siteConfig = useSiteConfig(currentSlug);

  const { blogPages, legacyCount } = useBlogPages(currentSlug);
  const migrateMutation = useMutation({
    mutationFn: async () => {
      for (const b of blogPages) await blogApi.migratePosts(currentSlug, b);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['collection-pages', currentSlug],
      });
      toast.show({
        title: 'Posts updated',
        message: 'Your posts now have their own entries.',
        type: 'success',
      });
    },
    onError: () =>
      toast.show({
        title: 'Could not update posts',
        message: 'Some posts were not moved. Please try again.',
        type: 'error',
      }),
  });

  // 'pages' or the pageId of a blog type
  const [tab, setTab] = useState<string>('pages');
  const activeBlog = blogPages.find((b) => b.pageId === tab) ?? null;
  const effectiveTab = activeBlog ? tab : 'pages';

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 350);
  const [pageNumber, setPageNumber] = useState(1);
  const [isDispatcherOpen, setIsDispatcherOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    setPageNumber(1);
  }, [debouncedSearch, statusFilter, effectiveTab, currentSlug]);

  // ---- Page content: server-side search, status filter and pagination ----
  const pagesQuery = useQuery({
    queryKey: [
      'collection-pages',
      currentSlug,
      'posts-hub',
      pageNumber,
      debouncedSearch,
      statusFilter,
    ],
    queryFn: () =>
      postsApi.listPagesPaged(currentSlug, {
        page: pageNumber,
        pageSize: PAGE_SIZE,
        search: debouncedSearch,
        status: statusFilter,
        excludeKind: NON_PAGE_KIND_PARAM,
      }),
    enabled: Boolean(currentSlug) && effectiveTab === 'pages',
    placeholderData: (prev) => prev,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });
  const pageItems: PageEntry[] = useMemo(
    () =>
      (pagesQuery.data?.items ?? []).filter(
        (p) => p.data?.isBlogPage !== true && isPageEntry(p),
      ),
    [pagesQuery.data],
  );
  const pagesTotal = pagesQuery.data?.total ?? 0;
  const pagesTotalPages = Math.max(1, Math.ceil(pagesTotal / PAGE_SIZE));

  // Page list for the dispatcher's "target page" dropdown (no blog pages)
  const allPagesQuery = useQuery({
    queryKey: ['collection-pages', currentSlug],
    queryFn: () => postsApi.listPagesForCollection(currentSlug),
    enabled: Boolean(currentSlug),
    staleTime: 5 * 60 * 1000,
  });
  const selectablePages = useMemo(
    () =>
      extractArrayPayload<PageEntry>(allPagesQuery.data).filter(
        (p) => p.data?.isBlogPage !== true && isPageEntry(p),
      ),
    [allPagesQuery.data],
  );

  // ---- Blog posts: live inside the blog page, so filtering runs in the browser ----
  const filteredPosts = useMemo(() => {
    if (!activeBlog) return [];
    const q = debouncedSearch.trim().toLowerCase();
    return activeBlog.posts.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        String(p.author ?? '')
          .toLowerCase()
          .includes(q)
      );
    });
  }, [activeBlog, debouncedSearch, statusFilter]);
  const postsTotalPages = Math.max(
    1,
    Math.ceil(filteredPosts.length / PAGE_SIZE),
  );
  const visiblePosts = filteredPosts.slice(
    (pageNumber - 1) * PAGE_SIZE,
    pageNumber * PAGE_SIZE,
  );

  const deletePageMutation = useMutation({
    mutationFn: async (pageId: string) => {
      await postsApi.deleteEntry(currentSlug, pageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['collection-pages', currentSlug],
      });
      queryClient.invalidateQueries({ queryKey: ['post-collections'] });
      toast.show({
        title: 'Page deleted',
        message: 'The page was removed.',
        type: 'success',
      });
    },
    onError: () =>
      toast.show({
        title: 'Error',
        message: 'Failed to delete page.',
        type: 'error',
      }),
  });

  const deletePostMutation = useMutation({
    mutationFn: async (post: BlogPost) => {
      if (!activeBlog) return;
      await blogApi.deletePost(currentSlug, activeBlog.pageId, post);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['collection-pages', currentSlug],
      });
      toast.show({
        title: 'Post deleted',
        message: 'The post was removed.',
        type: 'success',
      });
    },
    onError: () =>
      toast.show({
        title: 'Error',
        message: 'Failed to delete the post.',
        type: 'error',
      }),
  });

  const handleDeletePost = async (post: BlogPost) => {
    const ok = await confirmAction({
      title: 'Delete this post?',
      message: `"${post.title}" will be removed${post.status === 'published' ? ' from your live site' : ''}. This cannot be undone.`,
      confirmText: 'Delete post',
    });
    if (ok) deletePostMutation.mutate(post);
  };

  const noun = activeBlog ? 'post' : 'page';
  const isLoading = effectiveTab === 'pages' ? pagesQuery.isLoading : false;

  const tabClass = (active: boolean) =>
    `px-4 py-2 rounded-xl text-xs transition-colors whitespace-nowrap ${
      active
        ? 'bg-card text-foreground font-semibold shadow-xs border border-border'
        : 'text-muted-foreground hover:text-foreground'
    }`;

  return (
    <div className="flex flex-col h-full bg-background text-foreground animate-in fade-in duration-200">
      <header className="px-8 py-6 border-b border-border bg-card/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span className="font-medium text-foreground">
              {activeSiteName}
            </span>
            <span>/</span>
            <span>Posts &amp; Publishing Studio</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Posts / Publishing Studio
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Update page content and publish blog posts for this website.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsDispatcherOpen(true)}
          className={`${CMS_THEME_CLASSES.buttons.primary} text-sm py-2.5 px-4 shadow-sm`}
        >
          <Plus size={16} />
          <span>Create New Post</span>
        </button>
      </header>

      {legacyCount > 0 && (
        <div className="px-8 py-2.5 bg-amber-500/10 border-b border-border flex items-center justify-between gap-3 text-xs">
          <span>
            {legacyCount} post{legacyCount === 1 ? ' is' : 's are'} saved the
            older way. Update them so each post can be edited and published on
            its own.
          </span>
          <button
            type="button"
            disabled={migrateMutation.isPending}
            onClick={() => migrateMutation.mutate()}
            className={`${CMS_THEME_CLASSES.buttons.primary} text-xs py-1.5 px-3`}
          >
            {migrateMutation.isPending ? 'Updating…' : 'Update posts'}
          </button>
        </div>
      )}

      <div className="px-8 py-3 bg-muted/30 border-b border-border flex items-center gap-2 overflow-x-auto shrink-0">
        <button
          type="button"
          onClick={() => setTab('pages')}
          className={tabClass(effectiveTab === 'pages')}
        >
          Page Content
        </button>
        {blogPages.map((b) => (
          <button
            key={b.pageId}
            type="button"
            onClick={() => setTab(b.pageId)}
            className={tabClass(effectiveTab === b.pageId)}
          >
            {b.name} ({b.posts.length})
          </button>
        ))}
      </div>

      <div className="px-8 py-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="relative w-full sm:w-96">
          <Search
            size={14}
            className="absolute left-3 top-2.5 text-muted-foreground"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              activeBlog ? 'Search posts by title or author…' : 'Search pages…'
            }
            aria-label="Search"
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-muted-foreground flex items-center gap-1">
            <Filter size={13} />
            <span>Status:</span>
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            aria-label="Filter by status"
            className="bg-card border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All statuses</option>
            <option value="published">Live</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-xs">Loading…</span>
          </div>
        ) : (
            activeBlog ? visiblePosts.length === 0 : pageItems.length === 0
          ) ? (
          <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-card">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <h3 className="text-sm font-semibold text-foreground">
              {search ? `No ${noun}s match your search` : `No ${noun}s yet`}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-sm mx-auto">
              {activeBlog
                ? `Write your first ${activeBlog.postLabel.toLowerCase()} to see it here.`
                : 'Pages you add appear here so you can edit their content.'}
            </p>
            {activeBlog && (
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/sites/${currentSlug}/posts/blog/${activeBlog.pageId}/new`,
                  )
                }
                className={CMS_THEME_CLASSES.buttons.primary}
              >
                <Plus size={14} />
                <span>New {activeBlog.postLabel}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="py-3.5 px-6">
                    {activeBlog ? 'POST' : 'PAGE'}
                  </th>
                  <th className="py-3.5 px-4">
                    {activeBlog ? 'AUTHOR' : 'TYPE'}
                  </th>
                  <th className="py-3.5 px-4">URL</th>
                  <th className="py-3.5 px-4">LAST UPDATED</th>
                  <th className="py-3.5 px-4">STATUS</th>
                  <th className="py-3.5 px-6 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {activeBlog
                  ? visiblePosts.map((post) => {
                      const open = () =>
                        navigate(
                          `/sites/${currentSlug}/posts/blog/${activeBlog.pageId}/${post.id}`,
                        );
                      return (
                        <tr
                          key={post.id}
                          onClick={open}
                          className="hover:bg-muted/30 transition-colors group cursor-pointer"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-xl border shrink-0 bg-indigo-500/10 text-indigo-500 border-indigo-500/20">
                                <PenTool size={18} />
                              </div>
                              <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                                {post.title}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-muted-foreground">
                            {String(post.author ?? '—')}
                          </td>
                          <td className="py-4 px-4 font-mono text-[11px] text-foreground">
                            {activeBlog.pageSlug}#{post.slug}
                          </td>
                          <td className="py-4 px-4 text-muted-foreground text-[11px]">
                            <span className="inline-flex items-center gap-1.5">
                              <Clock
                                size={12}
                                className="text-muted-foreground/60"
                              />
                              {formatDate(post.updatedAt)}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <StatusBadge live={post.status === 'published'} />
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div
                              role="presentation"
                              className="inline-flex items-center gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={open}
                                className={`${CMS_THEME_CLASSES.buttons.primary} text-xs py-1.5 px-3`}
                              >
                                Edit post
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePost(post)}
                                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                title="Delete post"
                                aria-label={`Delete ${post.title}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  : pageItems.map((p) => {
                      const title =
                        p.title || (p.data?.title as string) || 'Untitled Page';
                      const slug = p.slug
                        ? p.slug.startsWith('/')
                          ? p.slug
                          : `/${p.slug}`
                        : '/';
                      const open = () =>
                        navigate(`/sites/${currentSlug}/posts/editor/${p.id}`);
                      return (
                        <tr
                          key={p.id}
                          onClick={open}
                          className="hover:bg-muted/30 transition-colors group cursor-pointer"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-xl border shrink-0 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                <FileText size={18} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                                  {slug === '/'
                                    ? 'Homepage Content'
                                    : `${title} Content`}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  Form schema sections
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="inline-flex px-2.5 py-1 rounded-md text-[11px] font-medium bg-muted text-foreground border border-border">
                              Page sections
                            </span>
                          </td>
                          <td className="py-4 px-4 font-mono text-[11px] text-foreground">
                            {slug === '/' ? '/ (Home)' : slug}
                          </td>
                          <td className="py-4 px-4 text-muted-foreground text-[11px]">
                            <span className="inline-flex items-center gap-1.5">
                              <Clock
                                size={12}
                                className="text-muted-foreground/60"
                              />
                              {formatDate(p.updatedAt || p.createdAt)}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <StatusBadge live={p.status === 'published'} />
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div
                              role="presentation"
                              className="inline-flex items-center gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={open}
                                className={`${CMS_THEME_CLASSES.buttons.primary} text-xs py-1.5 px-3`}
                              >
                                Edit content &amp; sections
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setPageToDelete({ id: p.id, title })
                                }
                                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                title="Delete page"
                                aria-label={`Delete ${title}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
            <Pager
              noun={noun}
              page={pageNumber}
              total={activeBlog ? filteredPosts.length : pagesTotal}
              totalPages={activeBlog ? postsTotalPages : pagesTotalPages}
              onPrev={() => setPageNumber((n) => Math.max(1, n - 1))}
              onNext={() => setPageNumber((n) => n + 1)}
            />
          </div>
        )}
      </div>

      <WhatToPostDispatcherModal
        isOpen={isDispatcherOpen}
        onClose={() => setIsDispatcherOpen(false)}
        siteName={activeSiteName}
        pages={selectablePages}
        blogs={blogPages.map((b) => ({
          pageId: b.pageId,
          name: b.name,
          postLabel: b.postLabel,
        }))}
        blogEnabled={siteConfig.articlesEnabled}
        settingsHref={`/sites/${currentSlug}/settings`}
        onSelectBlog={(pageId) =>
          navigate(`/sites/${currentSlug}/posts/blog/${pageId}/new`)
        }
        onSelectPageForm={(targetPageId) =>
          navigate(`/sites/${currentSlug}/posts/editor/${targetPageId}`)
        }
      />

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
