import { ContentEntryRecord } from '@repo/shared-types';

export interface RecentActivityItem {
  entryId: string;
  title: string;
  schemaName: string;
  schemaSlug: string;
  status: ContentEntryRecord['status'];
  updatedAt: string;
}

export interface DashboardOverview {
  totalEntries: number;
  publishedEntries: number;
  draftEntries: number;
  recentActivity: RecentActivityItem[];
}
