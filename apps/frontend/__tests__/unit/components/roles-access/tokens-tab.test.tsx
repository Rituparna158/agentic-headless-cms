import type { RoleRecord, TokenRecord } from '@repo/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TokensTab } from '@/components/roles-access/tokens-tab';

const { mockListTokens, mockListRoles, mockCreateToken, mockRevokeToken } =
  vi.hoisted(() => ({
    mockListTokens: vi.fn(),
    mockListRoles: vi.fn(),
    mockCreateToken: vi.fn(),
    mockRevokeToken: vi.fn(),
  }));

vi.mock('@/lib/api/access', () => ({
  listTokens: mockListTokens,
  listRoles: mockListRoles,
  createToken: mockCreateToken,
  revokeToken: mockRevokeToken,
}));

const adminRole: RoleRecord = {
  id: 'role-admin',
  name: 'admin',
  isSystem: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  permissions: [],
};

const activeToken: TokenRecord = {
  id: 't1',
  name: 'CI Token',
  type: 'user',
  scopes: [],
  roleId: 'role-admin',
  createdAt: new Date().toISOString(),
  revokedAt: null,
};

function renderTab() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <TokensTab />
    </QueryClientProvider>,
  );
}

describe('TokensTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListTokens.mockResolvedValue([]);
    mockListRoles.mockResolvedValue([adminRole]);
  });

  it('shows an empty state when there are no tokens', async () => {
    renderTab();
    expect(
      await screen.findByText('No tokens generated yet.'),
    ).toBeInTheDocument();
  });

  it('lists a token with its resolved role name and Active status', async () => {
    mockListTokens.mockResolvedValue([activeToken]);
    renderTab();

    expect(await screen.findByText('CI Token')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Revoke Token' }),
    ).toBeInTheDocument();
  });

  it('hides the revoke button for an already-revoked token', async () => {
    mockListTokens.mockResolvedValue([
      { ...activeToken, revokedAt: new Date().toISOString() },
    ]);
    renderTab();

    expect(await screen.findByText('Revoked')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Revoke Token' }),
    ).not.toBeInTheDocument();
  });

  it('generates a token and displays the raw value once', async () => {
    mockCreateToken.mockResolvedValue({
      ...activeToken,
      id: 't2',
      rawToken: 'raw-token-value-thats-long-enough',
    });
    const user = userEvent.setup();
    renderTab();
    await screen.findByText('No tokens generated yet.');

    await user.click(screen.getByRole('button', { name: 'Generate Token' }));
    await user.type(
      screen.getByPlaceholderText('e.g. CI/CD Script'),
      'My New Token',
    );
    await user.selectOptions(screen.getByRole('combobox'), 'role-admin');
    await user.click(screen.getByRole('button', { name: 'Generate' }));

    await waitFor(() =>
      expect(mockCreateToken).toHaveBeenCalledWith({
        name: 'My New Token',
        roleId: 'role-admin',
        type: 'user',
      }),
    );
    expect(
      await screen.findByDisplayValue('raw-token-value-thats-long-enough'),
    ).toBeInTheDocument();
  });

  it('revokes a token when the revoke button is clicked', async () => {
    mockListTokens.mockResolvedValue([activeToken]);
    mockRevokeToken.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderTab();
    await screen.findByText('CI Token');

    await user.click(screen.getByRole('button', { name: 'Revoke Token' }));

    await waitFor(() => expect(mockRevokeToken).toHaveBeenCalledWith('t1'));
  });
});
