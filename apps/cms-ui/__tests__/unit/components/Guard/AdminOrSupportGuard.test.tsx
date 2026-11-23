import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminOrSupportGuard } from '../../../../src/components/Guard/AdminOrSupportGuard';
import { useAuthStore } from '../../../../src/features/auth/store/auth.store';

vi.mock('../../../../src/features/auth/store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

const renderGuard = (
  roles: string[] | undefined,
  permissions?: Array<{
    action: string;
    schemaId?: string | null;
    effect?: string;
    condition?: Record<string, unknown>;
  }>,
) => {
  vi.mocked(useAuthStore).mockImplementation((selector) =>
    selector({
      user: { id: 'u1', roles: roles ?? [], permissions: permissions ?? [] },
    } as never),
  );
  return render(
    <MemoryRouter initialEntries={['/users/mfa-requests']}>
      <Routes>
        <Route element={<AdminOrSupportGuard />}>
          <Route
            path="/users/mfa-requests"
            element={<div>Protected Content</div>}
          />
        </Route>
        <Route path="/" element={<div>Home Redirect</div>} />
      </Routes>
    </MemoryRouter>,
  );
};

describe('AdminOrSupportGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children for admin users', () => {
    renderGuard(['admin']);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('renders children for super_admin users', () => {
    renderGuard(['super_admin']);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('renders children for users with manage_settings capability', () => {
    renderGuard(
      [],
      [
        {
          action: 'manage',
          effect: 'allow',
          condition: { capability: 'manage_settings' },
        },
      ],
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('renders children for support users', () => {
    renderGuard(['support']);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects non-admin/support users to home', () => {
    renderGuard(['editor']);
    expect(screen.getByText('Home Redirect')).toBeInTheDocument();
  });
});
