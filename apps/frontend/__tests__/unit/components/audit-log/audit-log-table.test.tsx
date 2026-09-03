import type { AuditLogRecord, GetAuditLogsQuery } from '@repo/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuditLogTable } from '@/components/audit-log/audit-log-table';

const { mockListAuditLogs } = vi.hoisted(() => ({
  mockListAuditLogs: vi.fn(),
}));

vi.mock('@/lib/api/audit', () => ({
  listAuditLogs: mockListAuditLogs,
  useAuditLogs: (query?: GetAuditLogsQuery) => ({
    data: mockListAuditLogs(query),
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

const sampleLog: AuditLogRecord = {
  id: 'log-001',
  applicationId: 'app-001',
  actorType: 'user',
  actorUserId: 'user-001',
  action: 'create',
  resourceType: 'content',
  resourceId: 'article-123',
  beforeState: null,
  afterState: { title: 'New Post' },
  context: { ip: '127.0.0.1' },
  timestamp: new Date().toISOString(),
  actorEmail: 'admin@example.com',
  actorFirstName: 'Admin',
  actorLastName: 'User',
};

function renderComponent() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuditLogTable />
    </QueryClientProvider>,
  );
}

describe('AuditLogTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the table with audit records', async () => {
    mockListAuditLogs.mockImplementation(() => ({
      data: [sampleLog],
      total: 1,
      page: 1,
      limit: 15,
      totalPages: 1,
    }));

    renderComponent();

    expect(await screen.findByText('CREATE')).toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();
    expect(screen.getByText('article-123')).toBeInTheDocument();
    expect(screen.getByText('Admin User')).toBeInTheDocument();
  });

  it('renders an empty state when no logs match initial fetch', () => {
    mockListAuditLogs.mockImplementation(() => ({
      data: [],
      total: 0,
      page: 1,
      limit: 15,
      totalPages: 0,
    }));

    renderComponent();

    expect(screen.getByText('No audit logs found')).toBeInTheDocument();
  });

  it('filters by search input matching and non-matching queries', async () => {
    mockListAuditLogs.mockImplementation((query?: GetAuditLogsQuery) => {
      if (query?.search === 'non-matching-term') {
        return {
          data: [],
          total: 0,
          page: 1,
          limit: 15,
          totalPages: 0,
        };
      }
      return {
        data: [sampleLog],
        total: 1,
        page: 1,
        limit: 15,
        totalPages: 1,
      };
    });

    renderComponent();

    const searchInput = screen.getByPlaceholderText(/search by resource/i);

    // Type non-matching term
    fireEvent.change(searchInput, { target: { value: 'non-matching-term' } });
    expect(
      await screen.findByText(
        'No audit logs match your search or filter criteria.',
      ),
    ).toBeInTheDocument();

    // Type matching term
    fireEvent.change(searchInput, { target: { value: 'user' } });
    expect(await screen.findByText('CREATE')).toBeInTheDocument();
  });

  it('opens details drawer when details button is clicked', async () => {
    mockListAuditLogs.mockImplementation(() => ({
      data: [sampleLog],
      total: 1,
      page: 1,
      limit: 15,
      totalPages: 1,
    }));

    renderComponent();

    const detailsButton = screen.getByTitle('View details');
    fireEvent.click(detailsButton);

    expect(await screen.findByText(/Audit Event Details/i)).toBeInTheDocument();
  });
});
