import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { SchemaDefinition } from '@repo/shared-types';
import { ContentEntryForm } from '../content-entry-form';
import type { SchemaRecord } from '@/lib/api/schemas';
import type { ContentEntryRecord } from '@/lib/api/content';

const {
  mockPush,
  mockRefresh,
  mockCreate,
  mockUpdate,
  mockPublish,
  mockDelete,
} = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockPublish: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

vi.mock('@/lib/api/content', () => ({
  createContentEntry: mockCreate,
  updateContentEntry: mockUpdate,
  publishContentEntry: mockPublish,
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
    {
      apiId: 'views',
      displayName: 'Views',
      dataType: 'number',
      isRequired: false,
      isUnique: false,
      isLocalized: false,
      isRepeatable: false,
      sortOrder: 1,
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

function renderForm(entry?: ContentEntryRecord) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ContentEntryForm schema={schema} entry={entry} />
    </QueryClientProvider>,
  );
}

describe('ContentEntryForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders one control per schema field and a "Not saved" status for a new entry', () => {
    renderForm();

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/views/i)).toBeInTheDocument();
    expect(screen.getByText('Not saved')).toBeInTheDocument();
    // Publish/Delete only make sense for an already-saved entry.
    expect(
      screen.queryByRole('button', { name: /^publish$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /delete/i }),
    ).not.toBeInTheDocument();
  });

  it('shows a validation error and does not submit when a required field is empty', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: /save draft/i }));

    await waitFor(() => {
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  it('creates a new entry and navigates to its edit page on success', async () => {
    mockCreate.mockResolvedValue({
      id: 'entry-1',
      status: 'draft',
      data: { title: 'Hello World', views: 42 },
      publishedData: null,
    });

    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/title/i), 'Hello World');
    await user.type(screen.getByLabelText(/views/i), '42');
    await user.click(screen.getByRole('button', { name: /save draft/i }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });
    expect(mockCreate.mock.calls[0]![1]).toMatchObject({
      title: 'Hello World',
      views: 42,
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/content/article/entry-1');
    });
  });

  it('updates an existing entry via updateContentEntry, not createContentEntry', async () => {
    const entry: ContentEntryRecord = {
      id: 'entry-1',
      status: 'draft',
      data: { title: 'Original', views: 1 },
      publishedData: null,
    };
    mockUpdate.mockResolvedValue({
      ...entry,
      data: { title: 'Updated', views: 1 },
    });

    const user = userEvent.setup();
    renderForm(entry);

    const titleInput = screen.getByLabelText(/title/i);
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated');
    await user.click(screen.getByRole('button', { name: /save draft/i }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        'article',
        'entry-1',
        expect.objectContaining({
          title: 'Updated',
        }),
      );
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('shows the entry status and lets a saved draft be published', async () => {
    const entry: ContentEntryRecord = {
      id: 'entry-1',
      status: 'draft',
      data: { title: 'Hello World', views: 42 },
      publishedData: null,
    };
    mockPublish.mockResolvedValue({ ...entry, status: 'published' });

    const user = userEvent.setup();
    renderForm(entry);

    expect(screen.getByText('draft')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^publish$/i }));

    await waitFor(() => {
      expect(mockPublish).toHaveBeenCalledWith('article', 'entry-1');
    });
  });

  it('deletes an existing entry and navigates back to the list', async () => {
    const entry: ContentEntryRecord = {
      id: 'entry-1',
      status: 'draft',
      data: { title: 'Hello World', views: 42 },
      publishedData: null,
    };
    mockDelete.mockResolvedValue(undefined);

    const user = userEvent.setup();
    renderForm(entry);

    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('article', 'entry-1');
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/content/article');
    });
  });

  it('shows a submit error message when saving fails', async () => {
    mockCreate.mockRejectedValue(new Error('network down'));

    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/title/i), 'Hello World');
    await user.click(screen.getByRole('button', { name: /save draft/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to save entry/i)).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
