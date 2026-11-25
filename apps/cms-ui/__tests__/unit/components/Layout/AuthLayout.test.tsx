import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { AuthLayout } from '@/components/Layout/AuthLayout';

// Mock auth store
vi.mock('@/features/auth/store/auth.store', () => ({
  useAuthStore: (
    selector: (state: { status: string; user: unknown }) => unknown,
  ) => selector({ status: 'unauthenticated', user: null }),
}));

describe('AuthLayout', () => {
  it('renders skip to content link, branding banner, and outlet content', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route
              path="/login"
              element={<div data-testid="login-content">Login Outlet</div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');

    expect(screen.getByText('Agentic CMS')).toBeInTheDocument();
    expect(screen.getByTestId('login-content')).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
