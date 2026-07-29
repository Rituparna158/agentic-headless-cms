import type { LocaleRecord } from '@repo/shared-types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LocalesTab } from '@/components/settings/locales-tab';

const { mockList, mockCreate, mockDelete } = vi.hoisted(() => ({
  mockList: vi.fn(),
  mockCreate: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock('@/lib/api/locales', () => ({
  listLocales: mockList,
  createLocale: mockCreate,
  deleteLocale: mockDelete,
}));

const enLocale: LocaleRecord = {
  id: 'l1',
  code: 'en',
  name: 'English',
  isDefault: true,
  createdAt: new Date().toISOString(),
};

function renderTab() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <LocalesTab />
    </QueryClientProvider>,
  );
}

describe('LocalesTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList.mockResolvedValue([]);
  });

  it('shows an empty state when there are no locales', async () => {
    renderTab();
    expect(
      await screen.findByText('No locales configured yet.'),
    ).toBeInTheDocument();
  });

  it('lists an existing locale and marks the default', async () => {
    mockList.mockResolvedValue([enLocale]);
    renderTab();

    expect(await screen.findByText('en')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
  });

  it('disables Add until both code and name are set', async () => {
    const user = userEvent.setup();
    renderTab();
    await screen.findByText('No locales configured yet.');

    await user.click(screen.getByRole('button', { name: 'Add Locale' }));
    const addButton = screen.getByRole('button', { name: 'Add' });
    expect(addButton).toBeDisabled();

    await user.type(screen.getByPlaceholderText('e.g. fr-FR'), 'fr-FR');
    expect(addButton).toBeDisabled();

    await user.type(screen.getByPlaceholderText('e.g. French'), 'French');
    expect(addButton).toBeEnabled();
  });

  it('creates a locale with the entered code and name', async () => {
    mockCreate.mockResolvedValue({ ...enLocale, id: 'l2' });
    const user = userEvent.setup();
    renderTab();
    await screen.findByText('No locales configured yet.');

    await user.click(screen.getByRole('button', { name: 'Add Locale' }));
    await user.type(screen.getByPlaceholderText('e.g. fr-FR'), 'fr-FR');
    await user.type(screen.getByPlaceholderText('e.g. French'), 'French');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() =>
      expect(mockCreate).toHaveBeenCalledWith({
        code: 'fr-FR',
        name: 'French',
      }),
    );
  });

  it('deletes a locale after confirming', async () => {
    mockList.mockResolvedValue([enLocale]);
    mockDelete.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderTab();
    await screen.findByText('English');

    await user.click(screen.getByRole('button', { name: 'Delete Locale' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith('l1'));
  });
});
