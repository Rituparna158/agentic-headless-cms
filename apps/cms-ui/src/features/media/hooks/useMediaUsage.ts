import { useQuery } from '@tanstack/react-query';
import { postsApi } from '@/features/posts/api/posts.api';
import type { MediaAsset } from '../types/media.types';

export interface SiteMediaUsage {
  usageMap: Record<string, string[]>;
  siteCollections: Array<{ id: string; name: string; slug: string }>;
  getAssetSites: (asset: MediaAsset) => string[];
  isLoading: boolean;
}

export function useMediaUsage(): SiteMediaUsage {
  const { data: usageData, isLoading } = useQuery({
    queryKey: ['media-sites-usage'],
    queryFn: async () => {
      try {
        const collections = await postsApi.listCollections();
        const usageMap: Record<string, Set<string>> = {};

        // Fetch pages and entries across all sites to determine real usage
        await Promise.all(
          collections.map(async (col) => {
            const siteLabel = col.name || col.slug;
            try {
              const [pages, entries] = await Promise.all([
                postsApi.listPagesForCollection(col.slug).catch(() => []),
                postsApi.listEntries(col.slug).catch(() => []),
              ]);

              const combinedContentStr = JSON.stringify({ pages, entries });

              // Helper to check if an asset identifier appears in the site's content
              return { siteLabel, contentStr: combinedContentStr };
            } catch {
              return { siteLabel, contentStr: '' };
            }
          }),
        ).then((siteContents) => {
          siteContents.forEach(({ siteLabel, contentStr }) => {
            if (!contentStr) return;
            // We store the siteContent strings for lazy lookup or we scan known assets
            // To make lookup instantaneous, we attach siteContent strings to the returned result
            (usageMap as unknown as Record<string, string>)[siteLabel] =
              contentStr;
          });
        });

        return {
          collections: collections.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
          })),
          siteContents: usageMap as unknown as Record<string, string>,
        };
      } catch {
        return { collections: [], siteContents: {} };
      }
    },
    staleTime: 3 * 60 * 1000,
  });

  const siteCollections = usageData?.collections || [];
  const siteContents = usageData?.siteContents || {};

  const getAssetSites = (asset: MediaAsset): string[] => {
    if (!asset) return [];
    const usedSites: string[] = [];

    const idStr = asset.id ? String(asset.id) : '';
    const filenameStr = asset.filename ? asset.filename : '';
    const urlStr = asset.url ? asset.url : '';

    for (const [siteLabel, contentStr] of Object.entries(siteContents)) {
      if (!contentStr) continue;
      // Check if this site contains the asset's id, url, or filename
      if (
        (idStr && contentStr.includes(idStr)) ||
        (urlStr && contentStr.includes(urlStr)) ||
        (filenameStr && contentStr.includes(filenameStr))
      ) {
        usedSites.push(siteLabel);
      }
    }

    return usedSites;
  };

  return {
    usageMap: {},
    siteCollections,
    getAssetSites,
    isLoading,
  };
}
