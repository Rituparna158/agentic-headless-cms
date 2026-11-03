import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsersAccessPage } from '../../../../../src/features/access/pages/UsersAccessPage';
import { accessApi } from '../../../../../src/features/access/api/access.api';
import { useAuthStore } from '../../../../../src/features/auth/store/auth.store';

vi.mock('../../../../../src/features/access/api/access.api', () => ({
  accessApi: {
    getUsers: vi.fn(),
    getRoles: vi.fn(),
    deleteUser: vi.fn(),
    updateUserRole: vi.fn(),
  },
}));

const roles = [
  {
    id: 'role-admin',
    name: 'admin',
    description: null,
    mfaRequired: false,
    isSystem: true,
    createdAt: '2026-08-20T10:00:00.000Z',
    updatedAt: '2026-08-20T10:00:00.000Z',
  },
  {
    id: 'role-editor',
    name: 'editor',
    description: null,
    mfaRequired: false,
    isSystem: false,
    createdAt: '2026-08-20T10:00:00.000Z',
    updatedAt: '2026-08-20T10:00:00.000Z',
  },
];

const makeUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'u1',
  email: 'user@example.com',
  firstName: 'Regular',
  lastName: 'User',
  status: 'active',
  roleId: 'role-editor',
  mfaEnabled: false,
  createdAt: '2026-08-20T10:00:00.000Z',
  ...overrides,
});

const currentUser = {
  id: 'me-1',
  email: 'me@example.com',
  firstName: 'Current',
  lastName: 'Admin',
  roles: ['admin'],
  mfaEnabled: false,
};

const mockUsersResponse = (users: Record<string, unknown>[]) =>
  ({
    data: {
      data: users,
      meta: {
        pagination: {
          page: 1,
          pageSize: 10,
          total: users.length,
          pageCount: 1,
        },
      },
    },
    success: true,
  }) as never;

const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <UsersAccessPage />
    </QueryClientProvider>,
  );
};

const rowFor = (email: string) =>
  screen.getByText(email).closest('tr') as HTMLTableRowElement;

describe('UsersAccessPage deletion guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: currentUser as never,
      status: 'authenticated',
    });
    window.confirm = vi.fn(() => true);
    vi.mocked(accessApi.getRoles).mockResolvedValue(
      mockUsersResponse(roles) as never,
    );
  });

  it('disables deleting your own account', async () => {
    vi.mocked(accessApi.getUsers).mockResolvedValue(
      mockUsersResponse([
        makeUser({
          id: 'me-1',
          email: 'me@example.com',
          roleId: 'role-admin',
        }),
        makeUser({ id: 'u2', email: 'other@example.com' }),
        makeUser({
          id: 'u3',
          email: 'other-admin@example.com',
          roleId: 'role-admin',
        }),
      ]) as never,
    );
    renderPage();
    const selfRow = await waitFor(() => rowFor('me@example.com'));
    const deleteButton = selfRow.querySelector('button[title]');
    expect(deleteButton).toBeDisabled();
    expect(deleteButton?.getAttribute('title')).toBe(
      'You cannot delete your own account',
    );
  });

  it('allows deleting a regular user when other admins exist', async () => {
    vi.mocked(accessApi.getUsers).mockResolvedValue(
      mockUsersResponse([
        makeUser({
          id: 'u3',
          email: 'other-admin@example.com',
          roleId: 'role-admin',
        }),
        makeUser({ id: 'u2', email: 'editor@example.com' }),
      ]) as never,
    );
    vi.mocked(accessApi.deleteUser).mockResolvedValue({
      success: true,
    } as never);
    renderPage();
    await waitFor(() => screen.getByText('editor@example.com'));
    fireEvent.click(
      rowFor('editor@example.com').querySelector('button[title]')!,
    );
    await waitFor(() =>
      expect(accessApi.deleteUser).toHaveBeenCalledWith('u2'),
    );
  });

  it('blocks deleting the last remaining admin on the page', async () => {
    vi.mocked(accessApi.getUsers).mockResolvedValue(
      mockUsersResponse([
        makeUser({
          id: 'u2',
          email: 'solo-admin@example.com',
          roleId: 'role-admin',
        }),
        makeUser(),
      ]) as never,
    );
    renderPage();
    await waitFor(() => screen.getByText('solo-admin@example.com'));
    const adminRow = rowFor('solo-admin@example.com');
    const deleteButton = adminRow.querySelector('button[title]');
    expect(deleteButton).toBeDisabled();
    expect(deleteButton?.getAttribute('title')).toBe(
      'Cannot delete the last active administrator',
    );
  });

  it('shows the backend error message when deletion fails', async () => {
    vi.mocked(accessApi.getUsers).mockResolvedValue(
      mockUsersResponse([
        makeUser({
          id: 'u3',
          email: 'other-admin@example.com',
          roleId: 'role-admin',
        }),
        makeUser({ id: 'u2', email: 'editor@example.com' }),
      ]) as never,
    );
    vi.mocked(accessApi.deleteUser).mockRejectedValue({
      message: 'Cannot delete the last active administrator',
      status: 400,
      success: false,
    } as never);
    renderPage();
    await waitFor(() => screen.getByText('editor@example.com'));
    fireEvent.click(
      rowFor('editor@example.com').querySelector('button[title]')!,
    );
    await waitFor(() =>
      expect(
        screen.getByText('Cannot delete the last active administrator'),
      ).toBeInTheDocument(),
    );
  });
});
