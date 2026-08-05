import type { SchemaRecord } from '@repo/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SchemaList } from '@/components/schema-builder/schema-list';

const { mockListSchemas } = vi.hoisted(() => ({
  mockListSchemas: vi.fn(),
}));

vi.mock('@/lib/api/schemas', () => ({
  listSchemas: mockListSchemas,
}));

const schema: SchemaRecord = {
  id: 'schema-1',
  name: 'Blog Post',
  slug: 'blog-post',
  type: 'collection',
  definition: {
    fields: [
      {
        apiId: 'title',
        displayName: 'Title',
        dataType: 'text',
        isRequired: true,
        isUnique: false,
        isLocalized: true,
        isRepeatable: false,
        sortOrder: 0,
      },
    ],
  },
  status: 'published',
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function renderList() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SchemaList />
    </QueryClientProvider>,
  );
}

describe('SchemaList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows an empty state when there are no schemas', async () => {
    mockListSchemas.mockResolvedValue([]);
    renderList();

    expect(
      await screen.findByText(
        'No content types yet. Create one to get started.',
      ),
    ).toBeInTheDocument();
  });

  it('shows an error message when the query fails', async () => {
    mockListSchemas.mockRejectedValue(new Error('network error'));
    renderList();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Failed to load content types.',
    );
  });

  it('lists a schema with its field count and localized status', async () => {
    mockListSchemas.mockResolvedValue([schema]);
    renderList();

    expect(await screen.findByText('Blog Post')).toBeInTheDocument();
    expect(screen.getByText('blog-post')).toBeInTheDocument();
    expect(screen.getByText('collection')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
  });

  it('links each row to its edit page', async () => {
    mockListSchemas.mockResolvedValue([schema]);
    renderList();

    const editLink = await screen.findByRole('link', {
      name: /edit content type/i,
    });
    expect(editLink).toHaveAttribute('href', '/content-types/blog-post/edit');
  });
});
