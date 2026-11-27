import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { SchemaDefinition } from '@repo/types';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { useAuthStore } from '@/stores/auth-store';

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

  it('renders Audit log link for admin users', () => {
    mockListSchemas.mockResolvedValue({ data: [], meta: { total: 0 } });
    renderActivity();

    const link = screen.getByRole('link', { name: /audit log/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/audit-log');
  });

  it('does not render Audit log link for non-admin users', () => {
    mockListSchemas.mockResolvedValue({ data: [], meta: { total: 0 } });
    useAuthStore.setState({
      user: {
        id: 'author-1',
        email: 'author@example.com',
        firstName: 'Author',
        lastName: 'User',
        mfaEnabled: false,
        roles: ['author'],
        permissions: [{ action: 'read', schemaId: null, effect: 'allow' }],
      },
      status: 'authenticated',
    });
    renderActivity();

    expect(
      screen.queryByRole('link', { name: /audit log/i }),
    ).not.toBeInTheDocument();
  });

  it('shows an empty state when there are no schemas/entries', async () => {
    mockListSchemas.mockResolvedValue({ data: [], meta: { total: 0 } });
    renderActivity();

    await waitFor(() => {
      expect(screen.getByText('No activity yet.')).toBeInTheDocument();
    });
  });

  it('lists the most recently updated entries across schemas, newest first', async () => {
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
