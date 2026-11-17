import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const rh = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/api/requestHandler', () => ({ requestHandler: rh }));

import {
  auditApi,
  buildAuditQueryString,
  useAuditLogs,
  useAuditLogDetail,
} from '../../../../src/features/audit/api/audit.api';

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    {children}
  </QueryClientProvider>
);

describe('buildAuditQueryString', () => {
  it('returns empty string with no filters', () => {
    expect(buildAuditQueryString()).toBe('');
    expect(buildAuditQueryString({ page: 1 })).toBe('');
  });
  it('serialises every filter and trims search', () => {
    const qs = buildAuditQueryString({
      page: 2,
      limit: 25,
      action: 'create',
      resourceType: 'page',
      actorUserId: 'u1',
      startDate: '2026-01-01',
      endDate: '2026-02-01',
      search: '  hello  ',
    } as never);
    const p = new URLSearchParams(qs.slice(1));
    expect(Object.fromEntries(p)).toEqual({
      page: '2',
      limit: '25',
      action: 'create',
      resourceType: 'page',
      actorUserId: 'u1',
      startDate: '2026-01-01',
      endDate: '2026-02-01',
      search: 'hello',
    });
  });
  it('skips blank search', () => {
    expect(buildAuditQueryString({ search: '   ' } as never)).toBe('');
  });
});

describe('auditApi + hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rh.get.mockResolvedValue({ data: [] });
  });

  it('getLogs / getLogById hit the right URLs', async () => {
    await auditApi.getLogs({ limit: 5 } as never);
    await auditApi.getLogById('abc');
    expect(rh.get).toHaveBeenNthCalledWith(1, '/audit-logs?limit=5');
    expect(rh.get).toHaveBeenNthCalledWith(2, '/audit-logs/abc');
  });

  it('useAuditLogs fetches', async () => {
    const { result } = renderHook(() => useAuditLogs({}), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(rh.get).toHaveBeenCalledWith('/audit-logs');
  });

  it('useAuditLogDetail is disabled without an id', () => {
    renderHook(() => useAuditLogDetail(null), { wrapper });
    expect(rh.get).not.toHaveBeenCalled();
  });

  it('useAuditLogDetail fetches with an id', async () => {
    const { result } = renderHook(() => useAuditLogDetail('x1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(rh.get).toHaveBeenCalledWith('/audit-logs/x1');
  });
});
