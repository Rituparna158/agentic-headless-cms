import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { postsApi, extractArrayPayload } from '@/features/posts/api/posts.api';
import type { PageEntry } from '@/types/content.types';
import { toBlogPages, type BlogPage } from '../api/blog.api';

/** The blog types set up on a website (each is a page with a post schema). */
export const useBlogPages = (siteSlug: string | undefined) => {
  const query = useQuery({
    // Same key and loader as the other page lists so the cache is shared
    queryKey: ['collection-pages', siteSlug],
    queryFn: () => postsApi.listPagesForCollection(siteSlug ?? ''),
    enabled: Boolean(siteSlug),
    staleTime: 5 * 60 * 1000,
  });

  const pages: PageEntry[] = useMemo(
    () => extractArrayPayload<PageEntry>(query.data),
    [query.data],
  );
  const blogPages: BlogPage[] = useMemo(() => toBlogPages(pages), [pages]);

  const legacyCount = useMemo(
    () =>
      blogPages.reduce((n, b) => n + b.posts.filter((p) => p.legacy).length, 0),
    [blogPages],
  );

  return { blogPages, pages, isLoading: query.isLoading, legacyCount };
};
