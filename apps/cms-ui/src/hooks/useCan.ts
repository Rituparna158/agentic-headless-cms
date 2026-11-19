import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { postsApi, extractArrayPayload } from '@/features/posts/api/posts.api';
import type { ContentCollectionMeta } from '@/types/content.types';
import { userCan, type Capability } from '@/lib/capabilities';

/** Permissions of the signed-in user on a website (slug or id). */
export function useSiteAccess(siteSlugOrId?: string) {
  const user = useAuthStore((s) => s.user);
  const { data } = useQuery({
    queryKey: ['post-collections'],
    queryFn: () => postsApi.listCollections(),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(siteSlugOrId),
  });
  const siteId = useMemo(() => {
    if (!siteSlugOrId) return undefined;
    const site = extractArrayPayload<ContentCollectionMeta>(data).find(
      (c) => c.slug === siteSlugOrId || c.id === siteSlugOrId,
    );
    return site?.id;
  }, [data, siteSlugOrId]);

  const can = useCallback(
    (cap: Capability | Capability[] | string | string[]) =>
      userCan(user, cap, siteId),
    [user, siteId],
  );
  // With a website in the address, wait until it is known before deciding
  const ready = !siteSlugOrId || siteId !== undefined || data !== undefined;
  return { can, ready };
}

/** `can('publish_content')` for the signed-in user on a website (slug or id). */
export const useCan = (siteSlugOrId?: string) =>
  useSiteAccess(siteSlugOrId).can;
