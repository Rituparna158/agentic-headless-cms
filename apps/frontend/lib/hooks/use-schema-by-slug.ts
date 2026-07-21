import { useQuery } from '@tanstack/react-query';

import { listSchemas } from '@/lib/api/schemas';

/**
 * There is no `GET /schemas/:slug` endpoint (only the list route exists —
 * see packages backend schema.router.ts), so resolving a single schema by
 * slug means fetching the full list and finding it client-side. Shares the
 * `['schemas']` query key with schema-list.tsx so navigating between the
 * content-types list and a content editor doesn't refetch.
 */
export function useSchemaBySlug(slug: string) {
  const query = useQuery({ queryKey: ['schemas'], queryFn: listSchemas });
  const schema = query.data?.find((s) => s.slug === slug);

  return { ...query, schema };
}
