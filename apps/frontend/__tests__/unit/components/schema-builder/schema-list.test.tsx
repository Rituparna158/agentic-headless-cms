import type { SchemaRecord } from '@repo/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SchemaList } from '@/components/schema-builder/schema-list';
import { useAuthStore } from '@/stores/auth-store';

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
  createdBy: 'Alice Johnson',
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
    useAuthStore.setState({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        mfaEnabled: false,
        roles: ['admin'],
        permissions: [{ action: '*', schemaId: null, effect: 'allow' }],
      },
      status: 'authenticated',
    });
  });

  it('shows an empty state when there are no schemas', async () => {
    mockListSchemas.mockResolvedValue({ data: [], meta: { total: 0 } });
    renderList();

    expect(
      await screen.findByText(
        'No content types found. Create your first content type to get started.',
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
    mockListSchemas.mockResolvedValue({ data: [schema], meta: { total: 1 } });
    renderList();

    expect(await screen.findByText('Blog Post')).toBeInTheDocument();
    expect(screen.getByText('blog-post')).toBeInTheDocument();
    expect(screen.getByText(/collection/i)).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
  });

  it('links each row to its edit page for admin users', async () => {
    mockListSchemas.mockResolvedValue({ data: [schema], meta: { total: 1 } });
    renderList();

    const editLink = await screen.findByRole('link', {
      name: /blog post/i,
    });
    expect(editLink).toHaveAttribute('href', '/content-types/blog-post/edit');
  });

  it('links row to content manager and displays View only for non-admin users', async () => {
    useAuthStore.setState({
      user: {
        id: 'editor-1',
        email: 'editor@example.com',
        firstName: 'Editor',
        lastName: 'User',
        mfaEnabled: false,
        roles: ['editor'],
        permissions: [{ action: 'update', schemaId: null, effect: 'allow' }],
      },
      status: 'authenticated',
    });

    mockListSchemas.mockResolvedValue({ data: [schema], meta: { total: 1 } });
    renderList();

    const link = await screen.findByRole('link', { name: /blog post/i });
    expect(link).toHaveAttribute('href', '/content?type=blog-post');
    expect(screen.getByText('View only')).toBeInTheDocument();
  });
});
