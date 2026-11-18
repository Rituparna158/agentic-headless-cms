import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { postsApi, extractArrayPayload } from '@/features/posts/api/posts.api';
import type { ContentCollectionMeta } from '@/types/content.types';
import { getMediaFileUrl } from '@/features/media/utils/media.util';
import type { SiteInfo } from './seo';

/** Reads a website's name, logo and SEO defaults from its settings. */
export const siteInfoFrom = (
  site: Pick<ContentCollectionMeta, 'name' | 'metadata'> | undefined,
  fallbackName: string,
): SiteInfo => {
  const meta = (site?.metadata ?? {}) as Record<string, unknown>;
  const domain = typeof meta.domain === 'string' ? meta.domain.trim() : '';
  return {
    name: site?.name || fallbackName,
    logoUrl:
      typeof meta.logoUrl === 'string' && meta.logoUrl
        ? getMediaFileUrl(meta.logoUrl)
        : undefined,
    seo: (meta.seo ?? undefined) as SiteInfo['seo'],
    baseUrl: domain
      ? `https://${domain.replace(/^https?:\/\//, '')}`
      : undefined,
  };
};

export function useSiteInfo(siteSlug: string): SiteInfo {
  const { data } = useQuery({
    queryKey: ['post-collections'],
    queryFn: () => postsApi.listCollections(),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(siteSlug),
  });
  return useMemo(() => {
    const site = extractArrayPayload<ContentCollectionMeta>(data).find(
      (c) => c.slug === siteSlug || c.id === siteSlug,
    );
    return siteInfoFrom(site, siteSlug);
  }, [data, siteSlug]);
}
