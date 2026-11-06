import type { MouseEvent, ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SidebarNav } from '@/components/layout/sidebar-nav';

interface MockLinkProps {
  href: string;
  children: ReactNode;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
  className?: string;
}

const { mockUsePathname, mockUseRouter, mockUseSearchParams } = vi.hoisted(
  () => ({
    mockUsePathname: vi.fn(),
    mockUseRouter: vi.fn(() => ({ push: vi.fn() })),
    mockUseSearchParams: vi.fn(() => ({ get: vi.fn() })),
  }),
);

vi.mock('next/navigation', () => ({
  usePathname: mockUsePathname,
  useRouter: mockUseRouter,
  useSearchParams: mockUseSearchParams,
}));

vi.mock('@/lib/api/schemas', () => ({
  listSchemas: vi.fn(() => Promise.resolve({ data: [] })),
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
    mockUsePathname.mockReturnValue('/content');
    mockUseSearchParams.mockReturnValue(new URLSearchParams('type=articles'));
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
    mockUsePathname.mockReturnValue('/content-types');
    const pushMock = vi.fn();
    mockUseRouter.mockReturnValue({ push: pushMock });

    renderSidebarNav();

    const contentItem = screen.getByText('Content Manager');
    fireEvent.click(contentItem);

    expect(pushMock).toHaveBeenCalledWith('/content');
  });
});
