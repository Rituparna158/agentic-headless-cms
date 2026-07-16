import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { SchemaDefinition } from '@repo/shared-types';
import { RecentActivity } from '../recent-activity';

const { mockListSchemas, mockListContentEntries } = vi.hoisted(() => ({
  mockListSchemas: vi.fn(),
  mockListContentEntries: vi.fn(),
}));

vi.mock('@/lib/api/schemas', () => ({ listSchemas: mockListSchemas }));
vi.mock('@/lib/api/content', () => ({
  listContentEntries: mockListContentEntries,
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

function renderActivity() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RecentActivity />
    </QueryClientProvider>,
  );
}

describe('RecentActivity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows an empty state when there are no schemas/entries', async () => {
    mockListSchemas.mockResolvedValue([]);
    renderActivity();

    await waitFor(() => {
      expect(screen.getByText('No activity yet.')).toBeInTheDocument();
    });
  });

  it('lists the most recently updated entries across schemas, newest first', async () => {
    mockListSchemas.mockResolvedValue([
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
    ]);
    mockListContentEntries.mockResolvedValue({
      data: [
        {
          id: 'older',
          status: 'draft',
          data: { title: 'Older Entry' },
          publishedData: null,
          updatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'newer',
          status: 'published',
          data: { title: 'Newer Entry' },
          publishedData: null,
          updatedAt: new Date(Date.now() - 60 * 1000).toISOString(),
        },
      ],
      meta: { pagination: { page: 1, pageSize: 100, total: 2, pageCount: 1 } },
    });

    renderActivity();

    await waitFor(() => {
      expect(screen.getByText(/Newer Entry/)).toBeInTheDocument();
    });
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Newer Entry');
    expect(items[1]).toHaveTextContent('Older Entry');
  });
});
