import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VersionHistoryDrawer } from '../../../../src/features/collections/components/template/VersionHistoryDrawer';
import { collectionsApi } from '../../../../src/features/collections/api/collections.api';
import type { ContentVersionRecord } from '../../../../src/features/collections/types/template.types';

// Mock dependencies
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();
vi.mock('@repo/shared-ui', () => ({
  useToast: () => ({
    success: toastSuccessMock,
    error: toastErrorMock,
  }),
}));

vi.mock('../../../../src/features/collections/api/collections.api', () => ({
  collectionsApi: {
    getVersions: vi.fn(),
    revertVersion: vi.fn(),
  },
}));

describe('VersionHistoryDrawer Component', () => {
  let queryClient: QueryClient;

  const mockVersions: ContentVersionRecord[] = [
    {
      id: 'v-3',
      entryId: 'page-1',
      locale: 'en',
      actorType: 'user',
      versionNo: 3,
      comment: 'Updated heading in hero banner',
      createdAt: '2026-10-26T12:00:00.000Z',
      createdByUserId: 'user-77',
      createdByUserName: 'Alice Wonderland',
      data: {
        title: 'Home Page v3',
        slug: 'home',
        _schemas: [
          {
            id: 'schema-1',
            name: 'Hero Schema',
            slug: 'hero-schema',
            entryType: 'single',
            fields: [
              { apiId: 'heading', displayName: 'Heading', dataType: 'text' },
            ],
            values: { heading: 'Welcome Home v3' },
          },
        ],
      },
    },
    {
      id: 'v-2',
      entryId: 'page-1',
      locale: 'en',
      actorType: 'user',
      versionNo: 2,
      comment: 'Added products catalog',
      createdAt: '2026-10-26T10:00:00.000Z',
      createdByUserId: 'user-88',
      createdByUserName: null, // should fallback to createdByUserId
      data: {
        title: 'Home Page v2',
        slug: 'home',
        _schemas: [],
      },
    },
    {
      id: 'v-1',
      entryId: 'page-1',
      locale: 'en',
      actorType: 'user',
      versionNo: 1,
      comment: 'Initial creation',
      createdAt: '2026-10-26T08:00:00.000Z',
      createdByUserId: '',
      createdByUserName: null, // should fallback to Admin
      data: {
        title: 'Home Page v1',
        slug: 'home',
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const renderDrawer = (
    props: Partial<Parameters<typeof VersionHistoryDrawer>[0]> = {},
  ) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <VersionHistoryDrawer
          isOpen={true}
          onClose={vi.fn()}
          schemaSlug="pages"
          pageId="page-1"
          currentVersionNo={3}
          currentPageData={{
            title: 'Home Page Live',
            slug: 'home',
          }}
          onRevertSuccess={vi.fn()}
          {...props}
        />
      </QueryClientProvider>,
    );
  };

  it('renders nothing when isOpen is false', () => {
    vi.mocked(collectionsApi.getVersions).mockResolvedValue(mockVersions);

    const { container } = renderDrawer({ isOpen: false });
    expect(container.firstChild).toBeNull();
  });

  it('renders loading indicator while fetching snapshots', () => {
    vi.mocked(collectionsApi.getVersions).mockImplementation(
      () => new Promise(() => {}), // never resolves
    );

    renderDrawer();

    expect(screen.getByText('Loading snapshots...')).toBeInTheDocument();
  });

  it('renders error state and handles retry button click', async () => {
    vi.mocked(collectionsApi.getVersions).mockRejectedValueOnce(
      new Error('Network error'),
    );

    renderDrawer();

    await waitFor(() => {
      expect(screen.getByText('Failed to load snapshots')).toBeInTheDocument();
    });

    vi.mocked(collectionsApi.getVersions).mockResolvedValueOnce(mockVersions);
    const retryBtn = screen.getByText('Retry');
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('Alice Wonderland')).toBeInTheDocument();
    });
  });

  it('renders empty state message when no versions exist', async () => {
    vi.mocked(collectionsApi.getVersions).mockResolvedValue([]);

    renderDrawer();

    await waitFor(() => {
      expect(
        screen.getByText('No previous snapshots available for this page yet.'),
      ).toBeInTheDocument();
    });
  });

  it('renders list of versions with author names and current version badge', async () => {
    vi.mocked(collectionsApi.getVersions).mockResolvedValue(mockVersions);

    renderDrawer({ currentVersionNo: 3 });

    await waitFor(() => {
      expect(screen.getByText('v3')).toBeInTheDocument();
      expect(screen.getByText('v2')).toBeInTheDocument();
      expect(screen.getByText('v1')).toBeInTheDocument();
    });

    // Author resolution:
    // v3: createdByUserName -> Alice Wonderland
    expect(screen.getByText('Alice Wonderland')).toBeInTheDocument();
    // v2: fallback to createdByUserId -> user-88
    expect(screen.getByText('user-88')).toBeInTheDocument();
    // v1: fallback to 'Admin'
    expect(screen.getByText('Admin')).toBeInTheDocument();

    // Current version badge on v3
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('allows selecting a version card and updates footer state', async () => {
    vi.mocked(collectionsApi.getVersions).mockResolvedValue(mockVersions);

    renderDrawer({ currentVersionNo: 3 });

    await waitFor(() => {
      expect(screen.getByText('v2')).toBeInTheDocument();
    });

    // Click on version 2 card
    const v2Card = screen.getByText('Added products catalog');
    fireEvent.click(v2Card);

    expect(screen.getByText('Selected: Snapshot v2')).toBeInTheDocument();

    // Restore button should be enabled since v2 is not current (current is v3)
    const restoreBtn = screen.getByRole('button', {
      name: /Restore Snapshot/i,
    });
    expect(restoreBtn).not.toBeDisabled();
  });

  it('disables restore button when current version is selected', async () => {
    vi.mocked(collectionsApi.getVersions).mockResolvedValue(mockVersions);

    renderDrawer({ currentVersionNo: 3 });

    await waitFor(() => {
      expect(screen.getByText('v3')).toBeInTheDocument();
    });

    // Click on version 3 card
    const v3Card = screen.getByText('Updated heading in hero banner');
    fireEvent.click(v3Card);

    expect(screen.getByText('Selected: Snapshot v3')).toBeInTheDocument();

    const restoreBtn = screen.getByRole('button', {
      name: /Restore Snapshot/i,
    });
    expect(restoreBtn).toBeDisabled();
  });

  it('opens SnapshotDetailDeck when "Inspect Diff" button is clicked', async () => {
    vi.mocked(collectionsApi.getVersions).mockResolvedValue(mockVersions);

    renderDrawer({ currentVersionNo: 3 });

    await waitFor(() => {
      expect(screen.getByText('v3')).toBeInTheDocument();
    });

    const inspectButtons = screen.getAllByText('Inspect Diff');
    fireEvent.click(inspectButtons[0]!);

    // SnapshotDetailDeck should now be open
    expect(screen.getByText('Snapshot Details & Diff')).toBeInTheDocument();
  });

  it('executes version restore and triggers onRevertSuccess and onClose', async () => {
    const onRevertSuccessMock = vi.fn();
    const onCloseMock = vi.fn();
    vi.mocked(collectionsApi.getVersions).mockResolvedValue(mockVersions);
    vi.mocked(collectionsApi.revertVersion).mockResolvedValue({
      id: 'page-1',
      status: 'published',
      data: {
        title: 'Home Page v2 Restored',
        slug: 'home',
        _schemas: [],
      },
    });

    renderDrawer({
      currentVersionNo: 3,
      onRevertSuccess: onRevertSuccessMock,
      onClose: onCloseMock,
    });

    await waitFor(() => {
      expect(screen.getByText('v2')).toBeInTheDocument();
    });

    // Select v2
    const v2Card = screen.getByText('Added products catalog');
    fireEvent.click(v2Card);

    // Click Restore button
    const restoreBtn = screen.getByRole('button', {
      name: /Restore Snapshot/i,
    });
    fireEvent.click(restoreBtn);

    await waitFor(() => {
      expect(collectionsApi.revertVersion).toHaveBeenCalledWith(
        'pages',
        'page-1',
        2,
      );
    });

    await waitFor(() => {
      expect(toastSuccessMock).toHaveBeenCalledWith(
        'Successfully restored snapshot v2!',
      );
      expect(onRevertSuccessMock).toHaveBeenCalledWith({
        title: 'Home Page v2 Restored',
        slug: 'home',
        _schemas: [],
      });
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  it('shows error toast when version restore fails', async () => {
    vi.mocked(collectionsApi.getVersions).mockResolvedValue(mockVersions);
    vi.mocked(collectionsApi.revertVersion).mockRejectedValue(
      new Error('Rollback failed'),
    );

    renderDrawer({ currentVersionNo: 3 });

    await waitFor(() => {
      expect(screen.getByText('v2')).toBeInTheDocument();
    });

    // Select v2
    const v2Card = screen.getByText('Added products catalog');
    fireEvent.click(v2Card);

    const restoreBtn = screen.getByRole('button', {
      name: /Restore Snapshot/i,
    });
    fireEvent.click(restoreBtn);

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        'Failed to restore version snapshot. Please try again.',
      );
    });
  });

  it('calls onClose when close icon button is clicked', async () => {
    const onCloseMock = vi.fn();
    vi.mocked(collectionsApi.getVersions).mockResolvedValue([]);

    renderDrawer({ onClose: onCloseMock });

    await waitFor(() => {
      expect(screen.getByText('Version History')).toBeInTheDocument();
    });

    const closeBtn = screen.getByRole('button', { name: '' });
    fireEvent.click(closeBtn);

    expect(onCloseMock).toHaveBeenCalled();
  });
});
