import { useQuery } from '@tanstack/react-query';
import { listContentEntries } from '@/lib/api/content';
import { listSchemas } from '@/lib/api/schemas';
import { RecentActivityItem, DashboardOverview } from '@/types/hook.types';

const ENTRIES_PER_SCHEMA = 100; // the backend's MAX_PAGE_SIZE (content-query.util.ts)

/**
 * There's no cross-schema "all content" or stats/analytics endpoint (content
 * is always scoped to one schema slug — see lib/api/content.ts) — so this
 * fans out one list call per schema and tallies client-side.
 *
 * `total` in each response IS the full per-schema DB count regardless of
 * pageSize, so totalEntries is always exact. The published/draft split and
 * the recent-activity feed, however, are derived from the returned page of
 * entries itself, capped at the backend's max pageSize (100) per schema —
 * exact for any schema with <=100 entries, an approximation beyond that.
 * Good enough for a dashboard overview; a real breakdown would need a
 * backend status-aggregation endpoint, which is out of scope for this
 * (frontend-only) issue.
 */
export function useDashboardOverview() {
  const schemasQuery = useQuery({
    queryKey: ['schemas'],
    queryFn: () => listSchemas(),
  });
  const schemas = schemasQuery.isSuccess ? schemasQuery.data.data : [];

  const entriesQuery = useQuery({
    queryKey: ['dashboard-overview', schemas.map((s) => s.slug)],
    enabled: schemasQuery.isSuccess && schemas.length > 0,
    queryFn: async () => {
      const perSchema = await Promise.all(
        schemas.map((schema) =>
          listContentEntries(schema.slug, {
            page: 1,
            pageSize: ENTRIES_PER_SCHEMA,
            sort: 'updatedAt:desc',
          }).then((result) => ({ schema, result })),
        ),
      );

      let totalEntries = 0;
      let publishedEntries = 0;
      let draftEntries = 0;
      const activity: RecentActivityItem[] = [];

      for (const { schema, result } of perSchema) {
        totalEntries += result.meta.pagination.total;

        for (const entry of result.data) {
          if (entry.status === 'published') publishedEntries += 1;
          else draftEntries += 1;

          if (entry.updatedAt) {
            const titleField = schema.definition.fields.find(
              (f) => f.dataType === 'text' || f.dataType === 'richtext',
            );
            const title =
              titleField && typeof entry.data[titleField.apiId] === 'string'
                ? (entry.data[titleField.apiId] as string)
                : entry.id;

            activity.push({
              entryId: entry.id,
              title,
              schemaName: schema.name,
              schemaSlug: schema.slug,
              status: entry.status,
              updatedAt: entry.updatedAt,
            });
          }
        }
      }

      activity.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );

      const overview: DashboardOverview = {
        totalEntries,
        publishedEntries,
        draftEntries,
        recentActivity: activity.slice(0, 8),
      };
      return overview;
    },
  });

  return {
    isLoading: schemasQuery.isLoading || entriesQuery.isLoading,
    isError: schemasQuery.isError || entriesQuery.isError,
    data: entriesQuery.data,
  };
}
