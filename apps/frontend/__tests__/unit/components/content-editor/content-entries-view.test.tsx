import type { SchemaRecord } from '@repo/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentEntriesView } from '@/components/content-editor/content-entries-view';

const mockPush = vi.fn();
const mockSearchParamsGet = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({
    get: mockSearchParamsGet,
    toString: () => '',
  }),
}));

const { mockListSchemas, mockListContentEntries } = vi.hoisted(() => ({
  mockListSchemas: vi.fn(),
  mockListContentEntries: vi.fn(),
}));

vi.mock('@/hooks/use-permissions', () => ({
  useHasPermission: vi.fn(() => true),
}));

vi.mock('@/lib/api/schemas', () => ({
  listSchemas: mockListSchemas,
}));

vi.mock('@/lib/api/content', () => ({
  listContentEntries: mockListContentEntries,
  deleteContentEntry: vi.fn(),
}));

const sampleSchemas: SchemaRecord[] = [
  {
    id: 'schema-1',
    name: 'Articles',
    slug: 'articles',
    type: 'collection',
    definition: {
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
    },
    status: 'published',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'schema-2',
    name: 'Products',
    slug: 'products',
    type: 'collection',
    definition: {
      fields: [
        {
          apiId: 'name',
          displayName: 'Name',
          dataType: 'text',
          isRequired: true,
          isUnique: false,
          isLocalized: false,
          isRepeatable: false,
          sortOrder: 0,
        },
      ],
    },
    status: 'published',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function renderView() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ContentEntriesView />
    </QueryClientProvider>,
  );
}

describe('ContentEntriesView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParamsGet.mockReturnValue(null);
    mockListContentEntries.mockResolvedValue({
      data: [],
      meta: { pagination: { page: 1, pageSize: 25, total: 0, pageCount: 0 } },
    });
  });

  it('renders loading state initially', () => {
    mockListSchemas.mockReturnValue(new Promise(() => {}));
    renderView();
    expect(screen.getByText(/loading content entries/i)).toBeInTheDocument();
  });

  it('renders empty state when no content types exist', async () => {
    mockListSchemas.mockResolvedValue({ data: [] });
    renderView();
    await waitFor(() => {
      expect(screen.getByText('No content types defined')).toBeInTheDocument();
    });
    expect(
      screen.getByRole('link', { name: /create content type/i }),
    ).toBeInTheDocument();
  });

  it('renders direct 100% full-width entries table defaulting to the first schema', async () => {
    mockListSchemas.mockResolvedValue({ data: sampleSchemas });
    renderView();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Articles' }),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole('link', { name: /new articles entry/i }),
    ).toBeInTheDocument();
  });

  it('renders entries table for the schema specified in search params', async () => {
    mockSearchParamsGet.mockReturnValue('products');
    mockListSchemas.mockResolvedValue({ data: sampleSchemas });
    renderView();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Products' }),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole('link', { name: /new products entry/i }),
    ).toBeInTheDocument();
  });
});
