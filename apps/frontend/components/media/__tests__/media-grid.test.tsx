import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MediaGrid } from '../media-grid';

const { mockList, mockDelete } = vi.hoisted(() => ({
  mockList: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock('@/lib/api/media', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/api/media')>('@/lib/api/media');
  return {
    ...actual,
    listMedia: mockList,
    deleteMedia: mockDelete,
  };
});

function renderGrid() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MediaGrid />
    </QueryClientProvider>,
  );
}

describe('MediaGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows an empty state when there is no media', async () => {
    mockList.mockResolvedValue({
      data: [],
      meta: { pagination: { page: 1, pageSize: 24, total: 0, pageCount: 0 } },
    });

    renderGrid();

    await waitFor(() => {
      expect(screen.getByText(/no media yet/i)).toBeInTheDocument();
    });
  });

  it('renders a thumbnail per asset with its filename', async () => {
    mockList.mockResolvedValue({
      data: [
        {
          id: 'asset-1',
          filename: 'hero.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 1024,
          width: 100,
          height: 100,
          url: '/media/file/hero.jpg',
          altText: null,
          folderId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'asset-2',
          filename: 'spec.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 2048,
          width: null,
          height: null,
          url: '/media/file/spec.pdf',
          altText: null,
          folderId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      meta: { pagination: { page: 1, pageSize: 24, total: 2, pageCount: 1 } },
    });

    renderGrid();

    await waitFor(() => {
      expect(screen.getByText('hero.jpg')).toBeInTheDocument();
    });
    expect(screen.getByText('spec.pdf')).toBeInTheDocument();
    expect(screen.getByAltText('hero.jpg')).toBeInTheDocument();
  });

  it('asks for confirmation before deleting, and does not delete if cancelled', async () => {
    mockList.mockResolvedValue({
      data: [
        {
          id: 'asset-1',
          filename: 'hero.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 1024,
          width: 100,
          height: 100,
          url: '/media/file/hero.jpg',
          altText: null,
          folderId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      meta: { pagination: { page: 1, pageSize: 24, total: 1, pageCount: 1 } },
    });
    mockDelete.mockResolvedValue(undefined);

    const user = userEvent.setup();
    renderGrid();

    await waitFor(() =>
      expect(screen.getByText('hero.jpg')).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: /delete hero\.jpg/i }));

    // Clicking the row's delete button only opens the confirmation dialog —
    // it must not delete anything until the user confirms.
    expect(await screen.findByText('Delete this file?')).toBeInTheDocument();
    expect(mockDelete).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('deletes an asset once the user confirms in the dialog', async () => {
    mockList.mockResolvedValue({
      data: [
        {
          id: 'asset-1',
          filename: 'hero.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 1024,
          width: 100,
          height: 100,
          url: '/media/file/hero.jpg',
          altText: null,
          folderId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      meta: { pagination: { page: 1, pageSize: 24, total: 1, pageCount: 1 } },
    });
    mockDelete.mockResolvedValue(undefined);

    const user = userEvent.setup();
    renderGrid();

    await waitFor(() =>
      expect(screen.getByText('hero.jpg')).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: /delete hero\.jpg/i }));
    await screen.findByText('Delete this file?');

    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('asset-1');
    });
  });

  it('shows pagination controls only when there is more than one page', async () => {
    mockList.mockResolvedValue({
      data: [
        {
          id: 'asset-1',
          filename: 'hero.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 1024,
          width: 100,
          height: 100,
          url: '/media/file/hero.jpg',
          altText: null,
          folderId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      meta: { pagination: { page: 1, pageSize: 24, total: 48, pageCount: 2 } },
    });

    renderGrid();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
  });
});
