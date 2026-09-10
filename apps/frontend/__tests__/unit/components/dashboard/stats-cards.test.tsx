import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { SchemaDefinition } from '@repo/types';
import { StatsCards } from '@/components/dashboard/stats-cards';

const { mockListSchemas, mockListContentEntries, mockListMedia } = vi.hoisted(
  () => ({
    mockListSchemas: vi.fn(),
    mockListContentEntries: vi.fn(),
    mockListMedia: vi.fn(),
  }),
);

vi.mock('@/lib/api/schemas', () => ({ listSchemas: mockListSchemas }));
vi.mock('@/lib/api/content', () => ({
  listContentEntries: mockListContentEntries,
}));
vi.mock('@/lib/api/media', () => ({
  listMedia: mockListMedia,
}));

const definition: SchemaDefinition = {
  fields: [
    {
      apiId: 'title',
      displayName: 'Title',
      dataType: 'text',
      isRequired: true,
      isUnique: false,
      isLocalized: false,
      isRepeatable: false,
      sortOrder: 0,
    },
  ],
};

function renderCards() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <StatsCards />
    </QueryClientProvider>,
  );
}

describe('StatsCards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListMedia.mockResolvedValue({
      data: [],
      meta: { pagination: { total: 0 } },
    });
  });

  it('renders the four stat labels', () => {
    mockListSchemas.mockResolvedValue({ data: [], meta: { total: 0 } });
    renderCards();

    expect(screen.getByText('Total Entries')).toBeInTheDocument();
    expect(screen.getByText('Published')).toBeInTheDocument();
    expect(screen.getByText('Drafts')).toBeInTheDocument();
    expect(screen.getByText('Media Assets')).toBeInTheDocument();
  });

  it('tallies total/published/draft counts across schemas', async () => {
    mockListSchemas.mockResolvedValue({
      data: [
        {
          id: 's1',
          name: 'Article',
          slug: 'article',
          type: 'collection',
          definition,
          status: 'published',
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      meta: { total: 1 },
    });
    mockListContentEntries.mockResolvedValue({
      data: [
        {
          id: 'e1',
          status: 'published',
          data: { title: 'A' },
          publishedData: null,
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'e2',
          status: 'draft',
          data: { title: 'B' },
          publishedData: null,
          updatedAt: new Date().toISOString(),
        },
      ],
      meta: { pagination: { page: 1, pageSize: 100, total: 2, pageCount: 1 } },
    });

    renderCards();

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Total Entries
    });
    expect(screen.getAllByText('1')).toHaveLength(2); // Published and Drafts both 1
  });

  it('shows media assets count', async () => {
    mockListSchemas.mockResolvedValue({ data: [], meta: { total: 0 } });
    mockListMedia.mockResolvedValue({
      data: [],
      meta: { pagination: { total: 5 } },
    });
    renderCards();

    await waitFor(() => {
      const mediaCard =
        screen.getByText('Media Assets').parentElement?.parentElement;
      expect(mediaCard).toHaveTextContent('5');
    });
  });

  it('shows an error state if the schemas fetch fails', async () => {
    mockListSchemas.mockRejectedValue(new Error('network down'));
    renderCards();

    await waitFor(() => {
      expect(screen.getAllByText('Error').length).toBeGreaterThan(0);
    });
  });
});
