import type { SchemaDefinition } from '@repo/shared-types';
import type { SchemaRecord } from '@repo/shared-types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ContentEntryList } from '../content-entry-list';

const { mockList, mockDelete } = vi.hoisted(() => ({
  mockList: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock('@/lib/api/content', () => ({
  listContentEntries: mockList,
  deleteContentEntry: mockDelete,
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

const schema: SchemaRecord = {
  id: 'schema-1',
  name: 'Article',
  slug: 'article',
  type: 'collection',
  definition,
  status: 'published',
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function renderList() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ContentEntryList schema={schema} />
    </QueryClientProvider>,
  );
}

describe('ContentEntryList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows an empty state when there are no entries', async () => {
    mockList.mockResolvedValue({
      data: [],
      meta: { pagination: { page: 1, pageSize: 25, total: 0, pageCount: 0 } },
    });

    renderList();

    await waitFor(() => {
      expect(screen.getByText(/no entries yet/i)).toBeInTheDocument();
    });
  });

  it('renders entries using the first text field as the title column', async () => {
    mockList.mockResolvedValue({
      data: [
        {
          id: 'entry-1',
          status: 'published',
          data: { title: 'Hello World' },
          publishedData: null,
          updatedAt: new Date().toISOString(),
        },
      ],
      meta: { pagination: { page: 1, pageSize: 25, total: 1, pageCount: 1 } },
    });

    renderList();

    await waitFor(() => {
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });
    expect(screen.getByText('published')).toBeInTheDocument();
  });

  it('re-queries with a $contains filter on the title field when searching', async () => {
    mockList.mockResolvedValue({
      data: [],
      meta: { pagination: { page: 1, pageSize: 25, total: 0, pageCount: 0 } },
    });

    const user = userEvent.setup();
    renderList();

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/search by title/i),
      ).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText(/search by title/i), 'World');

    await waitFor(() => {
      const lastCall = mockList.mock.calls.at(-1)!;
      expect(lastCall[0]).toBe('article');
      expect(lastCall[1]).toMatchObject({
        filters: { title: { $contains: 'World' } },
      });
    });
  });

  it('deletes an entry when its Delete action is clicked', async () => {
    mockList.mockResolvedValue({
      data: [
        {
          id: 'entry-1',
          status: 'draft',
          data: { title: 'Hello World' },
          publishedData: null,
          updatedAt: new Date().toISOString(),
        },
      ],
      meta: { pagination: { page: 1, pageSize: 25, total: 1, pageCount: 1 } },
    });
    mockDelete.mockResolvedValue(undefined);

    const user = userEvent.setup();
    renderList();

    await waitFor(() =>
      expect(screen.getByText('Hello World')).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('article', 'entry-1');
    });
  });

  it('shows pagination controls only when there is more than one page', async () => {
    mockList.mockResolvedValue({
      data: [
        {
          id: 'entry-1',
          status: 'draft',
          data: { title: 'Entry 1' },
          publishedData: null,
          updatedAt: new Date().toISOString(),
        },
      ],
      meta: { pagination: { page: 1, pageSize: 25, total: 30, pageCount: 2 } },
    });

    renderList();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
  });
});
