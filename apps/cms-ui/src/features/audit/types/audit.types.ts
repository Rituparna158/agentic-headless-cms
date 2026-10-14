import type {
  AuditLogRecord,
  GetAuditLogsQuery,
  PaginatedAuditLogsResponse,
} from '@repo/types';

export type { AuditLogRecord, GetAuditLogsQuery, PaginatedAuditLogsResponse };

export interface AuditFilters {
  page: number;
  limit: number;
  action: string;
  resourceType: string;
  actorType: 'all' | 'user' | 'agent' | 'system';
  actorUserId?: string;
  startDate?: string;
  endDate?: string;
  search: string;
}

export type DiffChangeType = 'added' | 'removed' | 'modified';

export interface DiffEntry {
  path: string;
  changeType: DiffChangeType;
  beforeValue?: unknown;
  afterValue?: unknown;
}

export interface HumanReadableSummary {
  headline: string;
  subtext: string;
  actorDisplayName: string;
  actorInitials: string;
  actorType: 'user' | 'agent' | 'system';
  resourceTypeDisplayName: string;
  resourceDisplayName: string;
  actionDisplayName: string;
  actionBadgeColor: string;
  actionBadgeVariant:
    | 'success'
    | 'info'
    | 'purple'
    | 'warning'
    | 'destructive'
    | 'default'
    | 'secondary';
  timeAgo: string;
  formattedDate: string;
  keyChanges: string[];
}
