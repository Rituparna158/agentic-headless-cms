import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { API_PATHS } from '@/lib/constants/api-paths';
import type {
  GetAuditLogsQuery,
  PaginatedAuditLogsResponse,
  AuditLogRecord,
} from '@repo/types';

export function buildAuditQueryString(options?: GetAuditLogsQuery): string {
  if (!options) return '';
  const params = new URLSearchParams();
  if (options.page) params.append('page', options.page.toString());
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.action) params.append('action', options.action);
  if (options.resourceType) params.append('resourceType', options.resourceType);
  if (options.actorUserId) params.append('actorUserId', options.actorUserId);
  if (options.startDate) params.append('startDate', options.startDate);
  if (options.endDate) params.append('endDate', options.endDate);
  if (options.search) params.append('search', options.search);
  const str = params.toString();
  return str ? `?${str}` : '';
}

export function listAuditLogs(
  options?: GetAuditLogsQuery,
): Promise<PaginatedAuditLogsResponse> {
  const qs = buildAuditQueryString(options);
  return apiFetch<PaginatedAuditLogsResponse>(
    `${API_PATHS.AUDIT_LOGS.BASE}${qs}`,
  );
}

export function getAuditLog(id: string): Promise<AuditLogRecord> {
  return apiFetch<AuditLogRecord>(API_PATHS.AUDIT_LOGS.BY_ID(id));
}

export function useAuditLogs(query?: GetAuditLogsQuery) {
  return useQuery({
    queryKey: ['audit-logs', query],
    queryFn: () => listAuditLogs(query),
    placeholderData: (previousData) => previousData,
  });
}

export function useAuditLogDetail(id?: string) {
  return useQuery({
    queryKey: ['audit-log', id],
    queryFn: () => getAuditLog(id!),
    enabled: Boolean(id),
  });
}
