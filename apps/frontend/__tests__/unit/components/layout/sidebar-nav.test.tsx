import type { MouseEvent, ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SidebarNav } from '@/components/layout/sidebar-nav';
import { useAuthStore } from '@/stores/auth-store';

interface MockLinkProps {
  href: string;
  children: ReactNode;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
  className?: string;
}

const mockPush = vi.fn();
const mockPathname = vi.fn();
const mockSearchParamsGet = vi.fn();
const mockGetPendingReviews = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: mockSearchParamsGet }),
}));

vi.mock('@/lib/api/schemas', () => ({
  listSchemas: vi.fn(() => Promise.resolve({ data: [] })),
}));

vi.mock('@/lib/api/workflows', () => ({
  getPendingReviews: () => mockGetPendingReviews(),
}));

vi.mock(
  'next/link',
  () =>
    ({
      default: ({ href, children, onClick, className }: MockLinkProps) => (
        <a
          href={href}
          className={className}
          onClick={(e) => {
            e.preventDefault();
            onClick?.(e);
          }}
        >
          {children}
        </a>
      ),
    }) satisfies Record<string, unknown>,
);

function renderSidebarNav(onNavigate?: () => void) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SidebarNav onNavigate={onNavigate} />
    </QueryClientProvider>,
  );
}

describe('SidebarNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        mfaEnabled: false,
        roles: ['admin'],
        permissions: [{ action: '*', schemaId: null, effect: 'allow' }],
      },
      status: 'authenticated',
    });
    mockPathname.mockReturnValue('/content');
    mockSearchParamsGet.mockImplementation((key: string) =>
      key === 'type' ? 'articles' : null,
    );
    mockGetPendingReviews.mockResolvedValue({ total: 0, items: [] });
  });

  it('renders primary navigation items and coming-soon badges', () => {
    renderSidebarNav();

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Content Manager')).toBeInTheDocument();
    expect(screen.getByText('Content Type Builder')).toBeInTheDocument();
    expect(screen.getByText('Media Library')).toBeInTheDocument();
    expect(screen.getByText('Agents')).toBeInTheDocument();
    expect(screen.getAllByText('Soon').length).toBeGreaterThan(0);
    expect(screen.getByText('Audit Log')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('toggles content types section when chevron is clicked', () => {
    renderSidebarNav();

    const toggleButton = screen.getByRole('button', {
      name: 'Collapse Content Types',
    });
    fireEvent.click(toggleButton);

    expect(
      screen.getByRole('button', { name: 'Expand Content Types' }),
    ).toBeInTheDocument();
  });

  it('navigates when a primary navigation link is clicked', () => {
    const onNavigate = vi.fn();
    renderSidebarNav(onNavigate);

    const dashboardLink = screen.getByRole('link', { name: 'Dashboard' });
    fireEvent.click(dashboardLink);

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('navigates to /content when clicking Content header from outside content section', () => {
    mockPathname.mockReturnValue('/content-types');

    renderSidebarNav();

    const contentItem = screen.getByText('Content Manager');
    fireEvent.click(contentItem);

    expect(mockPush).toHaveBeenCalledWith('/content');
  });

  it('renders unfrozen Approvals navigation item linking to /approvals for reviewers', () => {
    renderSidebarNav();

    const approvalsLink = screen.getByRole('link', { name: /Approvals/i });
    expect(approvalsLink).toBeInTheDocument();
    expect(approvalsLink).toHaveAttribute('href', '/approvals');
  });

  it('renders Workflows navigation item linking to /workflows for admin', () => {
    renderSidebarNav();

    const workflowsLink = screen.getByRole('link', { name: /Workflows/i });
    expect(workflowsLink).toBeInTheDocument();
    expect(workflowsLink).toHaveAttribute('href', '/workflows');
  });

  it('hides Workflows navigation item for non-admin user', () => {
    useAuthStore.setState({
      user: {
        id: 'author-1',
        email: 'author@example.com',
        firstName: 'Author',
        lastName: 'User',
        mfaEnabled: false,
        roles: ['author'],
        permissions: [{ action: 'create', schemaId: null, effect: 'allow' }],
      },
      status: 'authenticated',
    });

    renderSidebarNav();

    expect(
      screen.queryByRole('link', { name: /Workflows/i }),
    ).not.toBeInTheDocument();
  });

  it('hides Approvals navigation item for pure Author role', () => {
    useAuthStore.setState({
      user: {
        id: 'author-1',
        email: 'author@example.com',
        firstName: 'Author',
        lastName: 'User',
        mfaEnabled: false,
        roles: ['author'],
        permissions: [{ action: 'create', schemaId: null, effect: 'allow' }],
      },
      status: 'authenticated',
    });

    renderSidebarNav();

    expect(
      screen.queryByRole('link', { name: /Approvals/i }),
    ).not.toBeInTheDocument();
  });

  it('displays real-time pending review badge count when items await approval', async () => {
    mockGetPendingReviews.mockResolvedValue({
      total: 5,
      items: [
        { entryId: '1' },
        { entryId: '2' },
        { entryId: '3' },
        { entryId: '4' },
        { entryId: '5' },
      ],
    });

    renderSidebarNav();

    const badge = await screen.findByTestId('approvals-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('5');
  });

  it('excludes self-authored submissions from the sidebar pending approvals badge count', async () => {
    mockGetPendingReviews.mockResolvedValue({
      total: 3,
      items: [
        { entryId: '1', authorEmail: 'other1@example.com' },
        { entryId: '2', authorEmail: 'admin@example.com' }, // Self-authored (admin is logged in)
        { entryId: '3', authorEmail: 'other2@example.com' },
      ],
    });

    renderSidebarNav();

    const badge = await screen.findByTestId('approvals-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('2'); // Only 2 actionable reviews
  });

  it('displays collapsed notification dot when sidebar is collapsed and pending reviews exist', async () => {
    mockGetPendingReviews.mockResolvedValue({
      total: 3,
      items: [{ entryId: '1' }, { entryId: '2' }, { entryId: '3' }],
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <SidebarNav isCollapsed={true} />
      </QueryClientProvider>,
    );

    const dot = await screen.findByTestId('approvals-badge-collapsed');
    expect(dot).toBeInTheDocument();
  });
});
