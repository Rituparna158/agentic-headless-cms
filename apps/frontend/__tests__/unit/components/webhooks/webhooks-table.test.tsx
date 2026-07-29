import type { WebhookRecord } from '@repo/shared-types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WebhooksTable } from '@/components/webhooks/webhooks-table';

const { mockList, mockCreate, mockDelete } = vi.hoisted(() => ({
  mockList: vi.fn(),
  mockCreate: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock('@/lib/api/webhooks', () => ({
  listWebhooks: mockList,
  createWebhook: mockCreate,
  deleteWebhook: mockDelete,
}));

const webhook: WebhookRecord = {
  id: 'wh-1',
  name: 'ISR Rebuild',
  url: 'https://example.com/api/revalidate',
  events: ['content.published'],
  isActive: true,
  secretKey: 'secret',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function renderTable() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <WebhooksTable />
    </QueryClientProvider>,
  );
}

describe('WebhooksTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList.mockResolvedValue([]);
  });

  it('shows an empty state when there are no webhooks', async () => {
    renderTable();
    expect(
      await screen.findByText('No webhooks registered yet.'),
    ).toBeInTheDocument();
  });

  it('lists an existing webhook with its active status', async () => {
    mockList.mockResolvedValue([webhook]);
    renderTable();

    expect(await screen.findByText('ISR Rebuild')).toBeInTheDocument();
    expect(screen.getByText('content.published')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('disables Register until name, url, and at least one event are set', async () => {
    const user = userEvent.setup();
    renderTable();
    await screen.findByText('No webhooks registered yet.');

    await user.click(screen.getByRole('button', { name: 'Register Webhook' }));
    const registerButton = screen.getByRole('button', { name: 'Register' });
    expect(registerButton).toBeDisabled();

    await user.type(
      screen.getByPlaceholderText('e.g. Next.js ISR Rebuild'),
      'My Hook',
    );
    await user.type(
      screen.getByPlaceholderText('https://example.com/api/revalidate'),
      'https://example.com/hook',
    );
    expect(registerButton).toBeDisabled();

    await user.click(screen.getByText('content.published'));
    expect(registerButton).toBeEnabled();
  });

  it('registers a webhook with the selected events', async () => {
    mockCreate.mockResolvedValue({ ...webhook, id: 'wh-2' });
    const user = userEvent.setup();
    renderTable();
    await screen.findByText('No webhooks registered yet.');

    await user.click(screen.getByRole('button', { name: 'Register Webhook' }));
    await user.type(
      screen.getByPlaceholderText('e.g. Next.js ISR Rebuild'),
      'My Hook',
    );
    await user.type(
      screen.getByPlaceholderText('https://example.com/api/revalidate'),
      'https://example.com/hook',
    );
    await user.click(screen.getByText('content.published'));
    await user.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() =>
      expect(mockCreate).toHaveBeenCalledWith({
        name: 'My Hook',
        url: 'https://example.com/hook',
        events: ['content.published'],
      }),
    );
  });

  it('deletes a webhook after confirming', async () => {
    mockList.mockResolvedValue([webhook]);
    mockDelete.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderTable();
    await screen.findByText('ISR Rebuild');

    await user.click(screen.getByRole('button', { name: 'Delete Webhook' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith('wh-1'));
  });
});
