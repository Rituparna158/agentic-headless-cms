import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { SchemaDefinition } from '@repo/types';
import { StatsCards } from '@/components/dashboard/stats-cards';

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
  });

  it('renders the four stat labels', () => {
    mockListSchemas.mockResolvedValue([]);
    renderCards();

    expect(screen.getByText('Total Entries')).toBeInTheDocument();
    expect(screen.getByText('Published')).toBeInTheDocument();
    expect(screen.getByText('Drafts')).toBeInTheDocument();
    expect(screen.getByText('Pending Approvals')).toBeInTheDocument();
  });

  it('tallies total/published/draft counts across schemas', async () => {
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

  it('shows Pending Approvals as a placeholder since no such data exists yet', async () => {
    mockListSchemas.mockResolvedValue([]);
    renderCards();

    await waitFor(() => {
      const pendingCard = screen
        .getByText('Pending Approvals')
        .closest('[data-slot="card"]');
      expect(pendingCard).toHaveTextContent('—');
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
