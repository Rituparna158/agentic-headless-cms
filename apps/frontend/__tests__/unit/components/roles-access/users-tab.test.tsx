/* eslint-disable @typescript-eslint/no-explicit-any */
import type { UserRecord } from '@repo/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
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

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { inviteUser } from '@/lib/api/access';
import { toast } from 'sonner';

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
    mockListUsers.mockResolvedValue({ data: [], meta: { total: 0 } });
    mockListRoles.mockResolvedValue([]);
  });

  it('hides the invite button entirely for non-admins', async () => {
    renderTab(false);
    await screen.findByText('No users match your search criteria.');
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
    expect(
      await screen.findByText('No users match your search criteria.'),
    ).toBeInTheDocument();
  });

  it('lists an existing user', async () => {
    mockListUsers.mockResolvedValue({ data: [user], meta: { total: 1 } });
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

  it('handles user invitation successfully', async () => {
    const user2 = userEvent.setup();
    mockListRoles.mockResolvedValue({
      data: [{ id: 'r1', name: 'Admin' }],
      meta: { total: 1 },
    });
    vi.mocked(inviteUser).mockResolvedValueOnce({
      id: '2',
      email: 'new@example.com',
      status: 'invited',
    } as any);

    renderTab(true);

    await user2.click(
      await screen.findByRole('button', { name: '+ Invite User' }),
    );

    await user2.type(screen.getByLabelText(/Email/), 'new@example.com');
    await user2.type(screen.getByLabelText(/First Name/), 'New');
    await user2.type(screen.getByLabelText(/Last Name/), 'User');

    await user2.click(screen.getByRole('button', { name: 'Select a role' }));
    await user2.click(await screen.findByRole('menuitem', { name: 'Admin' }));

    const sendButton = screen.getByRole('button', { name: 'Send Invite' });
    expect(sendButton).not.toBeDisabled();
    await user2.click(sendButton);

    await waitFor(() => {
      expect(vi.mocked(inviteUser).mock.calls[0]![0]!).toEqual({
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        roleId: 'r1',
      });
    });

    expect(toast.success).toHaveBeenCalledWith('Invitation sent');
  });

  it('handles user invitation failure', async () => {
    const user2 = userEvent.setup();
    mockListRoles.mockResolvedValue({
      data: [{ id: 'r1', name: 'Admin' }],
      meta: { total: 1 },
    });
    vi.mocked(inviteUser).mockRejectedValueOnce(new Error('Invite failed'));

    renderTab(true);

    await user2.click(
      await screen.findByRole('button', { name: '+ Invite User' }),
    );
    await user2.type(screen.getByLabelText(/Email/), 'fail@example.com');

    await user2.click(screen.getByRole('button', { name: 'Select a role' }));
    await user2.click(await screen.findByRole('menuitem', { name: 'Admin' }));

    await user2.click(screen.getByRole('button', { name: 'Send Invite' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invite failed');
    });
  });

  it('shows dev invite url dialog when provided in response and can copy to clipboard', async () => {
    const user2 = userEvent.setup();
    mockListRoles.mockResolvedValue({
      data: [{ id: 'r1', name: 'Admin' }],
      meta: { total: 1 },
    });
    vi.mocked(inviteUser).mockResolvedValueOnce({
      id: '2',
      email: 'new@example.com',
      status: 'invited',
      inviteUrl: 'http://localhost/invite',
    } as any);

    // Mock clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      configurable: true,
    });

    renderTab(true);

    await user2.click(
      await screen.findByRole('button', { name: '+ Invite User' }),
    );
    await user2.type(screen.getByLabelText(/Email/), 'dev@example.com');
    await user2.click(screen.getByRole('button', { name: 'Select a role' }));
    await user2.click(await screen.findByRole('menuitem', { name: 'Admin' }));

    await user2.click(screen.getByRole('button', { name: 'Send Invite' }));

    await waitFor(() => {
      expect(
        screen.getByText('Development Mode: Invite Link'),
      ).toBeInTheDocument();
    });

    expect(screen.getByText('http://localhost/invite')).toBeInTheDocument();

    await user2.click(screen.getByRole('button', { name: 'Copy Link' }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'http://localhost/invite',
    );
    expect(toast.success).toHaveBeenCalledWith('Copied to clipboard');

    const closeButtons = screen.getAllByRole('button', { name: 'Close' });
    await user2.click(closeButtons[closeButtons.length - 1]!);
    await waitFor(() => {
      expect(
        screen.queryByText('Development Mode: Invite Link'),
      ).not.toBeInTheDocument();
    });
  });

  it('cancels the invite modal', async () => {
    const user2 = userEvent.setup();
    renderTab(true);

    await user2.click(
      await screen.findByRole('button', { name: '+ Invite User' }),
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user2.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
