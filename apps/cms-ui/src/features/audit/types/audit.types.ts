import type { ComponentType } from 'react';
import type {
  AuditLogRecord,
  GetAuditLogsQuery,
  PaginatedAuditLogsResponse,
} from '@repo/types';

export type { AuditLogRecord, GetAuditLogsQuery, PaginatedAuditLogsResponse };

export type ActorFilterType = 'all' | 'user' | 'agent' | 'system';

export interface AuditFilters {
  page: number;
  limit: number;
  action: string;
  resourceType: string;
  actorType: ActorFilterType;
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

export interface SelectOption<T = string> {
  value: T;
  label: string;
}

export interface AuditSummaryCardsProps {
  logs: AuditLogRecord[];
  totalCount: number;
}

export interface AuditTableViewProps {
  logs: AuditLogRecord[];
  onSelectLog: (log: AuditLogRecord) => void;
}

export interface AuditDetailDrawerProps {
  log: AuditLogRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export type DrawerTabType = 'diff' | 'tech' | 'raw';

export type DiffViewMode = 'changes-only' | 'full';

export interface SummaryMetricCard {
  title: string;
  value: string;
  subtext: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  color: string;
}
