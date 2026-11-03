import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditLogPage } from '../../../../src/features/audit/pages/AuditLogPage';

vi.mock('../../../../src/features/audit/api/audit.api', () => ({
  auditApi: {
    getLogs: vi.fn(),
    getLogById: vi.fn(),
  },
  useAuditLogs: vi.fn(),
}));

import { useAuditLogs } from '../../../../src/features/audit/api/audit.api';

const mockLogs = [
  {
    id: 'log-1',
    applicationId: 'app-default',
    actorType: 'user',
    actorUserId: 'usr-1',
    actorEmail: 'jane@example.com',
    actorFirstName: 'Jane',
    actorLastName: 'Doe',
    action: 'publish',
    resourceType: 'content',
    resourceId: 'content-12345678',
    timestamp: '2026-10-14T08:00:00.000Z',
    beforeState: { status: 'draft', title: 'New Launch Post' },
    afterState: { status: 'published', title: 'New Launch Post' },
    context: { ip: '10.0.0.1', userAgent: 'HeadlessAgent/1.0' },
  },
  {
    id: 'log-2',
    applicationId: 'app-default',
    actorType: 'agent',
    actorAgentId: 'agent-optim',
    action: 'update',
    resourceType: 'schema',
    resourceId: 'schema-87654321',
    timestamp: '2026-10-14T08:30:00.000Z',
    beforeState: { fields: ['title'] },
    afterState: { fields: ['title', 'seoMeta'] },
    context: { ip: '127.0.0.1' },
  },
];

const renderComponent = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuditLogPage />
    </QueryClientProvider>,
  );
};

describe('AuditLogPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuditLogs).mockReturnValue({
      data: {
        data: {
          data: mockLogs,
          total: 2,
          page: 1,
          limit: 15,
          totalPages: 1,
        },
      },
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useAuditLogs>);
  });

  it('renders page header and metric summary cards', () => {
    renderComponent();

    expect(
      screen.getByRole('heading', { level: 1, name: /audit logs/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/total recorded events/i)).toBeInTheDocument();
    expect(screen.getByText(/content & schema changes/i)).toBeInTheDocument();
    expect(screen.getByText(/ai & automated operations/i)).toBeInTheDocument();
  });

  it('renders audit logs in the table view', () => {
    renderComponent();

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getAllByText(/published/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('New Launch Post')).toBeInTheDocument();
    expect(screen.getByText('AI Agent (agent-op)')).toBeInTheDocument();
  });

  it('opens technical drawer when row details are clicked', async () => {
    renderComponent();

    const detailButtons = screen.getAllByRole('button', { name: /details/i });
    expect(detailButtons.length).toBeGreaterThan(0);
    fireEvent.click(detailButtons[0]!);

    // Drawer should open showing State Diff tab by default
    expect(screen.getByText(/state diff/i)).toBeInTheDocument();
    expect(screen.getByText(/technical context/i)).toBeInTheDocument();
    expect(screen.getByText(/raw json/i)).toBeInTheDocument();

    // Verify technical tabs are interactive
    const techContextTab = screen.getByRole('button', {
      name: /technical context/i,
    });
    fireEvent.click(techContextTab);
    expect(screen.getByText(/identities & coordinates/i)).toBeInTheDocument();
    expect(screen.getByText(/event uuid:/i)).toBeInTheDocument();
  });
});
