import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthGuard } from '@/components/Guard/AuthGuard';
import { RoleGuard } from '@/components/Guard/RoleGuard';
import { AdminOrSupportGuard } from '@/components/Guard/AdminOrSupportGuard';
import { useAuthStore, AuthState } from '@/features/auth/store/auth.store';

vi.mock('@/features/auth/store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

describe('Security Negative Assertions: Unauthorized Route Ejection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AuthGuard Route Ejection', () => {
    it('ejects completely unauthenticated users to /login', () => {
      vi.mocked(useAuthStore).mockImplementation((selector) =>
        selector({
          status: 'unauthenticated',
          user: null,
        } as unknown as AuthState),
      );

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<AuthGuard />}>
              <Route path="/dashboard" element={<div>Secret Dashboard</div>} />
            </Route>
            <Route path="/login" element={<div>Login Challenge Page</div>} />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.queryByText('Secret Dashboard')).not.toBeInTheDocument();
      expect(screen.getByText('Login Challenge Page')).toBeInTheDocument();
    });

    it('ejects authenticated users with zero assigned roles to /access-denied', () => {
      vi.mocked(useAuthStore).mockImplementation((selector) =>
        selector({
          status: 'authenticated',
          user: {
            id: 'user-no-roles',
            email: 'newbie@example.com',
            roles: [],
          },
        } as unknown as AuthState),
      );

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<AuthGuard />}>
              <Route path="/dashboard" element={<div>Secret Dashboard</div>} />
            </Route>
            <Route
              path="/access-denied"
              element={<div>Ejection: Access Denied</div>}
            />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.queryByText('Secret Dashboard')).not.toBeInTheDocument();
      expect(screen.getByText('Ejection: Access Denied')).toBeInTheDocument();
    });
  });

  describe('RoleGuard Capability Ejection', () => {
    it('ejects unauthenticated visitor to /login', () => {
      vi.mocked(useAuthStore).mockImplementation((selector) =>
        selector({
          status: 'unauthenticated',
          user: null,
        } as unknown as AuthState),
      );

      render(
        <MemoryRouter initialEntries={['/restricted-feature']}>
          <Routes>
            <Route
              element={<RoleGuard requiredCapability="manage_templates" />}
            >
              <Route
                path="/restricted-feature"
                element={<div>Restricted Feature</div>}
              />
            </Route>
            <Route path="/login" element={<div>Login Challenge</div>} />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.queryByText('Restricted Feature')).not.toBeInTheDocument();
      expect(screen.getByText('Login Challenge')).toBeInTheDocument();
    });

    it('ejects user lacking required capability to redirectTo path', () => {
      vi.mocked(useAuthStore).mockImplementation((selector) =>
        selector({
          status: 'authenticated',
          user: {
            id: 'editor-1',
            email: 'editor@example.com',
            roles: ['editor'],
            permissions: [{ condition: { capability: 'read_posts' } }],
          },
        } as unknown as AuthState),
      );

      render(
        <MemoryRouter initialEntries={['/admin-only']}>
          <Routes>
            <Route
              element={
                <RoleGuard
                  requiredCapability="manage_templates"
                  redirectTo="/access-denied"
                />
              }
            >
              <Route
                path="/admin-only"
                element={<div>Admin Templates Only</div>}
              />
            </Route>
            <Route
              path="/access-denied"
              element={<div>Forbidden Capability</div>}
            />
          </Routes>
        </MemoryRouter>,
      );

      expect(
        screen.queryByText('Admin Templates Only'),
      ).not.toBeInTheDocument();
      expect(screen.getByText('Forbidden Capability')).toBeInTheDocument();
    });

    it('allows access if user has required capability', () => {
      vi.mocked(useAuthStore).mockImplementation((selector) =>
        selector({
          status: 'authenticated',
          user: {
            id: 'lead-editor',
            email: 'lead@example.com',
            roles: ['editor'],
            permissions: [{ condition: { capability: 'manage_templates' } }],
          },
        } as unknown as AuthState),
      );

      render(
        <MemoryRouter initialEntries={['/admin-only']}>
          <Routes>
            <Route
              element={
                <RoleGuard
                  requiredCapability="manage_templates"
                  redirectTo="/access-denied"
                />
              }
            >
              <Route
                path="/admin-only"
                element={<div>Admin Templates Only</div>}
              />
            </Route>
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText('Admin Templates Only')).toBeInTheDocument();
    });

    it('allows super admin to bypass capability checks', () => {
      vi.mocked(useAuthStore).mockImplementation((selector) =>
        selector({
          status: 'authenticated',
          user: {
            id: 'admin-1',
            email: 'admin@example.com',
            roles: ['admin'],
            permissions: [],
          },
        } as unknown as AuthState),
      );

      render(
        <MemoryRouter initialEntries={['/admin-only']}>
          <Routes>
            <Route
              element={
                <RoleGuard
                  requiredCapability="special_secret_capability"
                  redirectTo="/access-denied"
                />
              }
            >
              <Route
                path="/admin-only"
                element={<div>Admin Templates Only</div>}
              />
            </Route>
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText('Admin Templates Only')).toBeInTheDocument();
    });
  });

  describe('AdminOrSupportGuard Role Ejection', () => {
    it('ejects unauthenticated visitor directly to /login', () => {
      vi.mocked(useAuthStore).mockImplementation((selector) =>
        selector({
          status: 'unauthenticated',
          user: null,
        } as unknown as AuthState),
      );

      render(
        <MemoryRouter initialEntries={['/support-portal']}>
          <Routes>
            <Route element={<AdminOrSupportGuard />}>
              <Route
                path="/support-portal"
                element={<div>Support Portal</div>}
              />
            </Route>
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.queryByText('Support Portal')).not.toBeInTheDocument();
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('ejects user with standard viewer/author role to root /', () => {
      vi.mocked(useAuthStore).mockImplementation((selector) =>
        selector({
          status: 'authenticated',
          user: {
            id: 'author-1',
            roles: ['viewer', 'author'],
          },
        } as unknown as AuthState),
      );

      render(
        <MemoryRouter initialEntries={['/support-portal']}>
          <Routes>
            <Route element={<AdminOrSupportGuard />}>
              <Route
                path="/support-portal"
                element={<div>Support Portal</div>}
              />
            </Route>
            <Route path="/" element={<div>Home Landing</div>} />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.queryByText('Support Portal')).not.toBeInTheDocument();
      expect(screen.getByText('Home Landing')).toBeInTheDocument();
    });

    it('allows support personnel through the guard', () => {
      vi.mocked(useAuthStore).mockImplementation((selector) =>
        selector({
          status: 'authenticated',
          user: {
            id: 'support-1',
            roles: ['Support'],
          },
        } as unknown as AuthState),
      );

      render(
        <MemoryRouter initialEntries={['/support-portal']}>
          <Routes>
            <Route element={<AdminOrSupportGuard />}>
              <Route
                path="/support-portal"
                element={<div>Support Portal</div>}
              />
            </Route>
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText('Support Portal')).toBeInTheDocument();
    });
  });
});
