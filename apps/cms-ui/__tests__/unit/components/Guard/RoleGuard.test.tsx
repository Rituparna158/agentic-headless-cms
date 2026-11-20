import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = { user: null as unknown };
vi.mock('../../../../src/features/auth/store/auth.store', () => ({
  useAuthStore: (sel: (s: unknown) => unknown) => sel(state),
}));

const siteAccess = { can: vi.fn(), ready: true };
vi.mock('@/hooks/useCan', () => ({ useSiteAccess: () => siteAccess }));

const userCan = vi.fn();
vi.mock('@/lib/capabilities', () => ({
  userCan: (...a: unknown[]) => userCan(...a),
}));

import { RoleGuard } from '../../../../src/components/Guard/RoleGuard';
import { SiteLanding } from '../../../../src/components/Guard/SiteLanding';

const renderAt = (path: string, cap?: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          element={<RoleGuard requiredCapability={cap} redirectTo="/no" />}
        >
          <Route path="/secret" element={<div>Secret</div>} />
          <Route path="/sites/:siteId/x" element={<div>SiteSecret</div>} />
        </Route>
        <Route path="/login" element={<div>Login</div>} />
        <Route path="/no" element={<div>Denied</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe('RoleGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.user = { id: 'u' };
    siteAccess.ready = true;
  });

  it('redirects anonymous users to login', () => {
    state.user = null;
    renderAt('/secret');
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('renders outlet when no capability is required', () => {
    renderAt('/secret');
    expect(screen.getByText('Secret')).toBeInTheDocument();
  });

  it('allows a user with the capability', () => {
    userCan.mockReturnValue(true);
    renderAt('/secret', 'manage_media');
    expect(screen.getByText('Secret')).toBeInTheDocument();
  });

  it('redirects a user lacking the capability', () => {
    userCan.mockReturnValue(false);
    renderAt('/secret', 'manage_media');
    expect(screen.getByText('Denied')).toBeInTheDocument();
  });

  it('checks site permissions inside a website', () => {
    siteAccess.can.mockReturnValue(true);
    renderAt('/sites/a/x', 'manage_media');
    expect(screen.getByText('SiteSecret')).toBeInTheDocument();
  });

  it('redirects within a website when the capability is missing', () => {
    siteAccess.can.mockReturnValue(false);
    renderAt('/sites/a/x', 'manage_media');
    expect(screen.getByText('Denied')).toBeInTheDocument();
  });

  it('renders nothing until site access is ready', () => {
    siteAccess.ready = false;
    renderAt('/sites/a/x', 'manage_media');
    expect(screen.queryByText('SiteSecret')).not.toBeInTheDocument();
    expect(screen.queryByText('Denied')).not.toBeInTheDocument();
  });
});

describe('SiteLanding', () => {
  const renderLanding = () =>
    render(
      <MemoryRouter initialEntries={['/sites/a']}>
        <Routes>
          <Route path="/sites/:siteId" element={<SiteLanding />} />
          <Route path="/sites/:siteId/menus" element={<div>Menus</div>} />
          <Route path="/sites/:siteId/posts" element={<div>Posts</div>} />
          <Route path="/access-denied" element={<div>AccessDenied</div>} />
        </Routes>
      </MemoryRouter>,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    siteAccess.ready = true;
  });

  it('renders nothing while not ready', () => {
    siteAccess.ready = false;
    const { container } = renderLanding();
    expect(container).toBeEmptyDOMElement();
  });

  it('redirects to the first permitted section', () => {
    siteAccess.can.mockImplementation((caps: string[]) =>
      caps.includes('manage_appearance'),
    );
    renderLanding();
    expect(screen.getByText('Menus')).toBeInTheDocument();
  });

  it('redirects to access-denied when nothing is permitted', () => {
    siteAccess.can.mockReturnValue(false);
    renderLanding();
    expect(screen.getByText('AccessDenied')).toBeInTheDocument();
  });
});
