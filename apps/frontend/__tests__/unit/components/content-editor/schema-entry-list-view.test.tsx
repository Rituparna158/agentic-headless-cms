import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SchemaEntryListView } from '@/components/content-editor/schema-entry-list-view';
import { useSchemaBySlug } from '@/lib/hooks/use-schema-by-slug';
import { useHasPermission } from '@/hooks/use-permissions';

vi.mock('@/lib/hooks/use-schema-by-slug');
vi.mock('@/hooks/use-permissions');
vi.mock('@/components/content-editor/content-entry-list', () => ({
  ContentEntryList: () => (
    <div data-testid="content-entry-list">Entry List</div>
  ),
}));

describe('SchemaEntryListView', () => {
  const mockSchema = {
    id: 'schema-123',
    name: 'Articles',
    slug: 'articles',
    type: 'collection' as const,
    definition: { fields: [] },
    status: 'published' as const,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSchemaBySlug).mockReturnValue({
      schema: mockSchema,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useSchemaBySlug>);
  });

  it('renders New Entry button when user has create permission', () => {
    vi.mocked(useHasPermission).mockReturnValue(true);

    render(<SchemaEntryListView schemaSlug="articles" />);

    const newEntryButton = screen.getByRole('link', { name: /new entry/i });
    expect(newEntryButton).toBeInTheDocument();
    expect(newEntryButton).toHaveAttribute('href', '/content/articles/new');
  });

  it('hides New Entry button when user lacks create permission', () => {
    vi.mocked(useHasPermission).mockReturnValue(false);

    render(<SchemaEntryListView schemaSlug="articles" />);

    expect(
      screen.queryByRole('link', { name: /new entry/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('content-entry-list')).toBeInTheDocument();
  });
});
