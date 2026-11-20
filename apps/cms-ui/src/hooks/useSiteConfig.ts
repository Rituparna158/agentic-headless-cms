import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { postsApi, extractArrayPayload } from '@/features/posts/api/posts.api';
import type { ContentCollectionMeta } from '@/types/content.types';
import type { ArticleSettings, SiteConfig } from './types/siteConfig.types';
import { DEFAULT_ARTICLE_SETTINGS } from './constants/siteConfig.constants';

export type { ArticleSettings, SiteConfig };
export { DEFAULT_ARTICLE_SETTINGS };

/** Normalises a URL prefix to "/something" with no trailing slash. */
export const normalizeUrlPrefix = (value: string): string => {
  const cleaned = value
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^a-zA-Z0-9-_/]/g, '-');
  return cleaned ? `/${cleaned}` : '/blog';
};

/** Reads a website's configuration (saved at creation time and in Site Settings). */
export const useSiteConfig = (siteId: string | undefined): SiteConfig => {
  const { data, isLoading } = useQuery({
    queryKey: ['post-collections'],
    queryFn: () => postsApi.listCollections(),
    staleTime: 5 * 60 * 1000,
  });

  return useMemo(() => {
    const collections = extractArrayPayload<ContentCollectionMeta>(data);
    const site =
      collections.find((c) => c.slug === siteId || c.id === siteId) ?? null;
    const meta = (site?.metadata ?? {}) as Record<string, unknown>;
    const art = (meta.articles ?? {}) as Partial<ArticleSettings>;

    return {
      site,
      isLoading,
      domain:
        typeof meta.domain === 'string' && meta.domain
          ? meta.domain
          : `${siteId ?? 'site'}.acme.com`,
      environment: meta.status === 'staging' ? 'staging' : 'live',
      articlesEnabled: meta.hasArticles !== false,
      maintenanceMode: meta.maintenanceMode === true,
      article: {
        sectionName: art.sectionName || DEFAULT_ARTICLE_SETTINGS.sectionName,
        urlPrefix: art.urlPrefix || DEFAULT_ARTICLE_SETTINGS.urlPrefix,
        defaultAuthor:
          art.defaultAuthor ?? DEFAULT_ARTICLE_SETTINGS.defaultAuthor,
        categories:
          Array.isArray(art.categories) && art.categories.length > 0
            ? art.categories
            : DEFAULT_ARTICLE_SETTINGS.categories,
      },
    };
  }, [data, siteId, isLoading]);
};
