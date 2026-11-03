import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MfaRequestsPage } from '../../../../../src/features/access/pages/MfaRequestsPage';
import { accessApi } from '../../../../../src/features/access/api/access.api';

vi.mock('../../../../../src/features/access/api/access.api', () => ({
  accessApi: {
    getMfaRequests: vi.fn(),
    approveMfaRequest: vi.fn(),
    rejectMfaRequest: vi.fn(),
  },
}));

const pendingRequest = {
  id: 'req-1',
  userId: 'u1',
  status: 'pending',
  createdAt: '2026-08-20T10:00:00.000Z',
  user: { email: 'user@example.com', firstName: 'John', lastName: 'Doe' },
};

const historyRequest = {
  id: 'req-2',
  userId: 'u2',
  status: 'approved',
  createdAt: '2026-08-19T10:00:00.000Z',
  user: { email: 'history@example.com', firstName: null, lastName: null },
  admin: { email: 'admin@example.com', firstName: 'Ada', lastName: 'Admin' },
};

const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MfaRequestsPage />
    </QueryClientProvider>,
  );
};

describe('MfaRequestsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(accessApi.getMfaRequests).mockImplementation(async (status) => {
      if (status === 'pending') {
        return {
          data: {
            data: [pendingRequest],
            meta: {
              pagination: { page: 1, pageSize: 10, total: 1, pageCount: 1 },
            },
          },
          success: true,
        } as never;
      }
      if (status === 'rejected') {
        return {
          data: {
            data: [],
            meta: {
              pagination: { page: 1, pageSize: 1, total: 0, pageCount: 0 },
            },
          },
          success: true,
        } as never;
      }
      return {
        data: {
          data: [historyRequest],
          meta: {
            pagination: { page: 1, pageSize: 10, total: 1, pageCount: 1 },
          },
        },
        success: true,
      } as never;
    });
  });

  it('renders pending requests with approve and reject actions', async () => {
    renderPage();
    expect(await screen.findByText('user@example.com')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Approve/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reject/i })).toBeInTheDocument();
  });

  it('calls approveMfaRequest when Approve is clicked', async () => {
    vi.mocked(accessApi.approveMfaRequest).mockResolvedValue({
      success: true,
    } as never);
    renderPage();
    await screen.findByText('user@example.com');
    fireEvent.click(screen.getByRole('button', { name: /Approve/i }));
    await waitFor(() => {
      expect(accessApi.approveMfaRequest).toHaveBeenCalledWith('req-1');
    });
  });

  it('shows history with status and admin when switching to History tab', async () => {
    renderPage();
    await screen.findByText('user@example.com');
    fireEvent.click(screen.getByRole('button', { name: 'History' }));
    expect(await screen.findByText('history@example.com')).toBeInTheDocument();
    expect(screen.getAllByText('Approved').length).toBeGreaterThan(0);
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
  });
});
