import { isPageEntry } from '@/lib/entryKinds';
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, LayoutTemplate } from 'lucide-react';
import { useCmsToast } from '@/hooks/useCmsToast';
import {
  BLOG_TYPES,
  BLOG_LAYOUT_OPTIONS,
  type BlogShowcaseLayout,
} from '../constants/blogTypes';
import { blogApi } from '../api/blog.api';
import { useBlogPages } from '../hooks/useBlogPages';
import { BlogTypePicker } from './BlogTypePicker';
import { CustomBlogTypeDialog } from './CustomBlogTypeDialog';
import { FeatureBlogDialog } from './FeatureBlogDialog';
import { pagesFeaturing } from '../utils/featureSection';
import type { BlogPage } from '../api/blog.api';
import { normalizeUrlPrefix } from '@/hooks/useSiteConfig';
import type { BlogSetupPanelProps } from '../types/blog.types';

/** Site Settings → Blog: see enabled blog types and add more. */
export const BlogSetupPanel: React.FC<BlogSetupPanelProps> = ({
  siteSlug,
  urlPrefix,
  onUrlPrefixChange,
  canCreateCustom,
}) => {
  const queryClient = useQueryClient();
  const toast = useCmsToast();
  const { blogPages, pages, isLoading } = useBlogPages(siteSlug);
  const [featuring, setFeaturing] = useState<BlogPage | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [showCustom, setShowCustom] = useState(false);

  const existingIds = blogPages.map((b) => b.typeId);

  const addMutation = useMutation({
    mutationFn: async (
      defs: Array<{
        id: string;
        name: string;
        postLabel: string;
        fields: (typeof BLOG_TYPES)[number]['fields'];
        layout?: BlogShowcaseLayout;
      }>,
    ) => {
      for (const def of defs) {
        await blogApi.createBlogType(
          siteSlug,
          def,
          normalizeUrlPrefix(urlPrefix),
          def.layout,
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['collection-pages', siteSlug],
      });
      setSelected([]);
      setShowCustom(false);
      toast.show({
        title: 'Blog type added',
        message:
          'Its blog page is ready and you can start writing from Posts. To show it elsewhere on your site, use “Show on a page”.',
        type: 'success',
      });
    },
    onError: () =>
      toast.show({
        title: 'Could not add the blog type',
        message: 'Please try again.',
        type: 'error',
      }),
  });

  const updateLayoutMutation = useMutation({
    mutationFn: async ({
      pageId,
      layout,
    }: {
      pageId: string;
      layout: BlogShowcaseLayout;
    }) => {
      await blogApi.updateBlogLayout(siteSlug, pageId, layout);
    },
    onSuccess: (_, { layout }) => {
      queryClient.invalidateQueries({
        queryKey: ['collection-pages', siteSlug],
      });
      queryClient.invalidateQueries({
        queryKey: ['site-preview-entries', siteSlug],
      });
      const opt = BLOG_LAYOUT_OPTIONS.find((o) => o.id === layout);
      toast.show({
        title: 'Showcase layout updated',
        message: `Blog layout switched to ${opt?.name || layout}.`,
        type: 'success',
      });
    },
    onError: () =>
      toast.show({
        title: 'Failed to update layout',
        message: 'Please try again.',
        type: 'error',
      }),
  });

  const schemaSlugOf = (b: BlogPage) =>
    (
      b.page.data?._schemas as
        | Array<{ slug: string; entryType?: string }>
        | undefined
    )?.find((x) => x.entryType === 'multi')?.slug ?? '';

  const featureMutation = useMutation({
    mutationFn: (v: { pageId: string; title: string; limit: number }) =>
      blogApi.featureOnPage(siteSlug, v.pageId, {
        schemaSlug: featuring ? schemaSlugOf(featuring) : '',
        title: v.title,
        limit: v.limit,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['collection-pages', siteSlug],
      });
      setFeaturing(null);
      toast.show({
        title: 'Section added',
        message:
          'It is saved to the page as a draft. Open the page and publish it to make it live.',
        type: 'success',
      });
    },
    onError: (err) =>
      toast.show({
        title: 'Could not add the section',
        message:
          err instanceof Error && err.message
            ? err.message
            : 'Please try again.',
        type: 'error',
      }),
  });

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div>
        <h3 className="text-xs font-semibold text-foreground">Blog types</h3>
        <p className="text-[11px] text-muted-foreground">
          Each type has its own fields and a ready-made blog page. Write posts
          from Posts / Studio.
        </p>
      </div>

      <div>
        <label
          htmlFor="blog-prefix"
          className="block text-xs font-medium text-foreground mb-1.5"
        >
          Address prefix for new blog pages
        </label>
        <input
          id="blog-prefix"
          type="text"
          value={urlPrefix}
          onChange={(e) => onUrlPrefixChange(e.target.value)}
          className="w-full max-w-xs text-xs font-mono px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : blogPages.length > 0 ? (
        <ul className="divide-y divide-border rounded-lg border border-border text-xs">
          {blogPages.map((b) => {
            const featured = pagesFeaturing(pages, schemaSlugOf(b), b.pageId);
            return (
              <li key={b.pageId} className="px-3 py-2.5 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-foreground">{b.name}</span>
                  <span className="text-muted-foreground font-mono">
                    {b.pageSlug} · {b.posts.length} post
                    {b.posts.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span
                    className={
                      featured.length > 0
                        ? 'text-muted-foreground'
                        : 'text-amber-700'
                    }
                  >
                    {featured.length > 0
                      ? `Also shown on: ${featured.map((p) => p.title || (p.data?.title as string) || 'page').join(', ')}`
                      : 'Only on its own page. Nothing else on your site shows it yet.'}
                  </span>
                  <span className="flex items-center gap-3">
                    <a
                      href={`/sites/${siteSlug}/preview${b.pageSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      Preview
                    </a>
                    <button
                      type="button"
                      onClick={() => setFeaturing(b)}
                      className="font-medium text-primary hover:underline"
                    >
                      Show on a page…
                    </button>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-border/50">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <LayoutTemplate
                        size={12}
                        className="text-muted-foreground"
                      />
                      Showcase:
                    </span>
                    {BLOG_LAYOUT_OPTIONS.map((opt) => {
                      const isCurrent =
                        ((b.page.data?.blogLayout as BlogShowcaseLayout) ||
                          'grid') === opt.id;
                      const isPending =
                        updateLayoutMutation.isPending &&
                        updateLayoutMutation.variables?.pageId === b.pageId &&
                        updateLayoutMutation.variables?.layout === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={updateLayoutMutation.isPending}
                          onClick={() => {
                            if (!isCurrent) {
                              updateLayoutMutation.mutate({
                                pageId: b.pageId,
                                layout: opt.id,
                              });
                            }
                          }}
                          className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                            isCurrent
                              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                              : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                          title={opt.description}
                        >
                          {isPending ? (
                            <Loader2
                              size={10}
                              className="animate-spin inline mr-1"
                            />
                          ) : null}
                          {opt.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">
          No blog type is set up yet. Pick one below.
        </p>
      )}

      <div className="space-y-3">
        <p className="text-xs font-medium text-foreground">Add a blog type</p>
        <BlogTypePicker
          selected={selected}
          onChange={setSelected}
          existingIds={existingIds}
        />
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            disabled={selected.length === 0 || addMutation.isPending}
            onClick={() =>
              addMutation.mutate(
                BLOG_TYPES.filter((t) => selected.includes(t.id)),
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground disabled:opacity-40"
          >
            {addMutation.isPending ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Plus size={13} />
            )}
            Add selected
          </button>
          {canCreateCustom && (
            <button
              type="button"
              onClick={() => setShowCustom(true)}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-border hover:bg-muted"
            >
              Create a custom blog type
            </button>
          )}
        </div>
        {!canCreateCustom && (
          <p className="text-[11px] text-muted-foreground">
            Need a type that is not listed? Ask a developer to create a custom
            blog type.
          </p>
        )}
      </div>

      {featuring && (
        <FeatureBlogDialog
          blogName={featuring.name}
          pages={pages.filter((p) => !p.data?.isBlogPage && isPageEntry(p))}
          isSaving={featureMutation.isPending}
          onClose={() => setFeaturing(null)}
          onConfirm={(v) => featureMutation.mutate(v)}
        />
      )}

      {showCustom && (
        <CustomBlogTypeDialog
          existingIds={existingIds}
          isSaving={addMutation.isPending}
          onClose={() => setShowCustom(false)}
          onCreate={(def) => addMutation.mutate([def])}
        />
      )}
    </div>
  );
};
