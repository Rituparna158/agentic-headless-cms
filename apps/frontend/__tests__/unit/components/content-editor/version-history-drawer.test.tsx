import type {
  ContentEntryRecord,
  ContentVersionRecord,
} from '@repo/shared-types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { VersionHistoryDrawer } from '@/components/content-editor/version-history-drawer';

const { mockListVersions, mockRevert } = vi.hoisted(() => ({
  mockListVersions: vi.fn(),
  mockRevert: vi.fn(),
}));

vi.mock('@/lib/api/content', () => ({
  listContentVersions: mockListVersions,
  revertContentEntry: mockRevert,
}));

const currentEntry: ContentEntryRecord = {
  id: 'entry-1',
  status: 'draft',
  data: { title: 'Version Two' },
  publishedData: null,
};

const versions: ContentVersionRecord[] = [
  {
    id: 'v1',
    entryId: 'entry-1',
    locale: 'en',
    versionNo: 1,
    status: 'draft',
    data: { title: 'Version One' },
    actorType: 'user',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'v2',
    entryId: 'entry-1',
    locale: 'en',
    versionNo: 2,
    status: 'draft',
    data: { title: 'Version Two' },
    actorType: 'user',
    createdAt: new Date().toISOString(),
  },
];

function renderDrawer(onOpenChange = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <VersionHistoryDrawer
        schemaSlug="blog-post"
        entryId="entry-1"
        open
        onOpenChange={onOpenChange}
        currentEntry={currentEntry}
      />
    </QueryClientProvider>,
  );
}

describe('VersionHistoryDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows an empty state when there are no previous versions', async () => {
    mockListVersions.mockResolvedValue([]);
    renderDrawer();

    expect(
      await screen.findByText('No previous versions available.'),
    ).toBeInTheDocument();
  });

  it('lists all versions and defaults the diff to the first one', async () => {
    mockListVersions.mockResolvedValue(versions);
    renderDrawer();

    expect(await screen.findByText('v1')).toBeInTheDocument();
    expect(screen.getByText('v2')).toBeInTheDocument();
    expect(
      screen.getByText((_, node) => node?.textContent === 'Diff: v2 → v1'),
    ).toBeInTheDocument();
  });

  it('restores the selected version and closes the drawer on success', async () => {
    mockListVersions.mockResolvedValue(versions);
    mockRevert.mockResolvedValue({
      ...currentEntry,
      data: { title: 'Version One' },
    });
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    renderDrawer(onOpenChange);

    await screen.findByText('v1');
    await user.click(screen.getByRole('button', { name: 'Restore v1' }));

    await waitFor(() =>
      expect(mockRevert).toHaveBeenCalledWith('blog-post', 'entry-1', 1),
    );
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('switches the diff target when a different version is clicked', async () => {
    mockListVersions.mockResolvedValue(versions);
    const user = userEvent.setup();
    renderDrawer();

    await screen.findByText('v1');
    await user.click(screen.getByText('v2'));

    expect(
      screen.getByRole('button', { name: 'Restore v2' }),
    ).toBeInTheDocument();
  });
});
