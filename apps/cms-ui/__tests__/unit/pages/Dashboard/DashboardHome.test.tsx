import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@repo/shared-ui';
import { DashboardHome } from '@/pages/Dashboard/DashboardHome';

vi.mock('@/features/posts/api/posts.api', async () => {
  const actual = await vi.importActual<Record<string, unknown>>(
    '@/features/posts/api/posts.api',
  );
  return {
    ...actual,
    postsApi: {
      ...(actual.postsApi as Record<string, unknown>),
      getSharedTemplates: vi.fn().mockReturnValue([]),
      listCollections: vi.fn().mockResolvedValue([
        {
          id: 'col-1',
          name: 'Corporate Site',
          slug: 'corporate-site',
          description: 'Main landing page',
          pageCount: 5,
          updatedAt: '2026-11-20T10:00:00Z',
        },
      ]),
    },
    extractArrayPayload: (data: unknown) => (Array.isArray(data) ? data : []),
  };
});

vi.mock('@/features/auth/store/auth.store', () => ({
  useAuthStore: (
    selector: (state: { user: { email: string; role: string } }) => unknown,
  ) => selector({ user: { email: 'admin@example.com', role: 'admin' } }),
}));

describe('DashboardHome', () => {
  const queryClient = new QueryClient();

  it('renders dashboard with collections list and handles search filter', async () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <BrowserRouter>
            <DashboardHome />
          </BrowserRouter>
        </ToastProvider>
      </QueryClientProvider>,
    );

    expect(screen.getByText(/All Websites/i)).toBeInTheDocument();
    expect(screen.getByText('Mindfire digital LLP')).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
