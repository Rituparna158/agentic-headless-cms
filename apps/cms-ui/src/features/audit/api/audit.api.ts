import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { requestHandler } from '../../../api/requestHandler';
import { ENDPOINTS } from '../../../api/endpoints';
import type {
  AuditLogRecord,
  PaginatedAuditLogsResponse,
  AuditFilters,
} from '../types/audit.types';

export function buildAuditQueryString(
  options: Partial<AuditFilters> = {},
): string {
  const params = new URLSearchParams();
  if (options.page && options.page > 1) {
    params.append('page', String(options.page));
  }
  if (options.limit) {
    params.append('limit', String(options.limit));
  }
  if (options.action) {
    params.append('action', options.action);
  }
  if (options.resourceType) {
    params.append('resourceType', options.resourceType);
  }
  if (options.actorUserId) {
    params.append('actorUserId', options.actorUserId);
  }
  if (options.startDate) {
    params.append('startDate', options.startDate);
  }
  if (options.endDate) {
    params.append('endDate', options.endDate);
  }
  if (options.search && options.search.trim()) {
    params.append('search', options.search.trim());
  }

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const auditApi = {
  getLogs: async (filters: Partial<AuditFilters> = {}) => {
    const qs = buildAuditQueryString(filters);
    return requestHandler.get<PaginatedAuditLogsResponse>(
      `${ENDPOINTS.AUDIT_LOGS.BASE}${qs}`,
    );
  },

  getLogById: async (id: string) => {
    return requestHandler.get<AuditLogRecord>(ENDPOINTS.AUDIT_LOGS.BY_ID(id));
  },
};

export function useAuditLogs(filters: Partial<AuditFilters>) {
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => auditApi.getLogs(filters),
    placeholderData: keepPreviousData,
  });
}

export function useAuditLogDetail(id: string | null) {
  return useQuery({
    queryKey: ['audit-log', id],
    queryFn: () => auditApi.getLogById(id!),
    enabled: Boolean(id),
  });
}
