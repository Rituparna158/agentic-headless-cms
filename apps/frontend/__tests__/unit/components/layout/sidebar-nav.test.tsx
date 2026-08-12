import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AnchorHTMLAttributes } from 'react';

import { SidebarNav } from '@/components/layout/sidebar-nav';

const { mockUsePathname } = vi.hoisted(() => ({
  mockUsePathname: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: mockUsePathname,
}));

vi.mock(
  'next/link',
  () =>
    ({
      default: ({
        href,
        children,
        onClick,
        ...rest
      }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
        <a
          href={href}
          onClick={(e) => {
            e.preventDefault();
            onClick?.(e);
          }}
          {...rest}
        >
          {children}
        </a>
      ),
    }) satisfies Record<string, unknown>,
);

describe('SidebarNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders both primary and secondary nav items', () => {
    mockUsePathname.mockReturnValue('/');
    render(<SidebarNav />);

    expect(screen.getByRole('link', { name: /Dashboard/ })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Content-Types/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Roles & Access/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Settings/ })).toBeInTheDocument();
  });

  it('marks the item matching the current pathname as the current page', () => {
    mockUsePathname.mockReturnValue('/webhooks');
    render(<SidebarNav />);

    expect(screen.getByRole('link', { name: /Webhooks/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: /Dashboard/ })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('calls onNavigate when a nav link is clicked', () => {
    mockUsePathname.mockReturnValue('/');
    const onNavigate = vi.fn();
    render(<SidebarNav onNavigate={onNavigate} />);

    const link = screen.getByRole('link', { name: /Media/ });
    fireEvent.click(link);
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});
