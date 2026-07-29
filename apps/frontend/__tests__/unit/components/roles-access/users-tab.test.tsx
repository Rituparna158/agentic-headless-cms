import type { UserRecord } from '@repo/shared-types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UsersTab } from '@/components/roles-access/users-tab';

const { mockListUsers, mockListRoles } = vi.hoisted(() => ({
  mockListUsers: vi.fn(),
  mockListRoles: vi.fn(),
}));

vi.mock('@/lib/api/access', () => ({
  listUsers: mockListUsers,
  listRoles: mockListRoles,
  inviteUser: vi.fn(),
}));

const user: UserRecord = {
  id: 'u1',
  email: 'reader@example.com',
  firstName: 'Reed',
  lastName: 'Reader',
  status: 'active',
  createdAt: new Date().toISOString(),
};

function renderTab(isAdmin: boolean) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <UsersTab isAdmin={isAdmin} />
    </QueryClientProvider>,
  );
}

describe('UsersTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListUsers.mockResolvedValue([]);
    mockListRoles.mockResolvedValue([]);
  });

  it('hides the invite button entirely for non-admins', async () => {
    renderTab(false);
    await screen.findByText('No users found.');
    expect(
      screen.queryByRole('button', { name: '+ Invite User' }),
    ).not.toBeInTheDocument();
  });

  it('shows the invite button for admins', async () => {
    renderTab(true);
    expect(
      await screen.findByRole('button', { name: '+ Invite User' }),
    ).toBeInTheDocument();
  });

  it('shows an empty state when there are no users', async () => {
    renderTab(true);
    expect(await screen.findByText('No users found.')).toBeInTheDocument();
  });

  it('lists an existing user', async () => {
    mockListUsers.mockResolvedValue([user]);
    renderTab(true);

    expect(await screen.findByText('reader@example.com')).toBeInTheDocument();
    expect(screen.getByText('Reed Reader')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('disables Send Invite until email and role are set', async () => {
    const user2 = userEvent.setup();
    renderTab(true);

    await user2.click(
      await screen.findByRole('button', { name: '+ Invite User' }),
    );

    expect(screen.getByRole('button', { name: 'Send Invite' })).toBeDisabled();
  });
});
