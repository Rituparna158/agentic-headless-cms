import type { SchemaDefinition } from '@repo/types';
import type { ContentEntryRecord, SchemaRecord } from '@repo/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ContentEntryForm } from '@/components/content-editor/content-entry-form';

const {
  mockPush,
  mockRefresh,
  mockGetEntry,
  mockCreate,
  mockUpdate,
  mockPublish,
  mockUnpublish,
  mockDelete,
  mockListLocales,
  mockToastSuccess,
  mockToastError,
} = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
  mockGetEntry: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockPublish: vi.fn(),
  mockUnpublish: vi.fn(),
  mockDelete: vi.fn(),
  mockListLocales: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}));

vi.mock('@/hooks/use-permissions', () => ({
  useHasPermission: vi.fn(() => true),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

vi.mock('@/lib/api/locales', () => ({
  listLocales: mockListLocales,
}));

vi.mock('@/lib/api/content', () => ({
  getContentEntry: mockGetEntry,
  createContentEntry: mockCreate,
  updateContentEntry: mockUpdate,
  publishContentEntry: mockPublish,
  unpublishContentEntry: mockUnpublish,
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
    mockListLocales.mockResolvedValue({ data: [] });
    mockGetEntry.mockResolvedValue(undefined);
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
        'en',
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

    // Confirm in modal
    expect(screen.getByText('Publish Entry')).toBeInTheDocument();
    const publishButtons = await screen.findAllByRole('button', {
      name: /^publish$/i,
    });
    await user.click(publishButtons[publishButtons.length - 1]!);

    await waitFor(() => {
      expect(mockPublish).toHaveBeenCalledWith('article', 'entry-1', 'en');
    });
    expect(mockToastSuccess).toHaveBeenCalledWith(
      expect.stringContaining('Entry published successfully'),
    );
  });

  it('shows confirmation modal before deleting an existing entry and deletes on confirm', async () => {
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

    expect(screen.getByText('Delete Entry')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Are you sure you want to permanently delete this entry/i,
      ),
    ).toBeInTheDocument();

    // Confirm button in the modal
    const deleteButtons = await screen.findAllByRole('button', {
      name: /delete/i,
    });
    await user.click(deleteButtons[deleteButtons.length - 1]!);

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

  it('hides Save Draft button when entry is published and unmodified, and shows it when modified', async () => {
    const entry: ContentEntryRecord = {
      id: 'entry-1',
      status: 'published',
      data: { title: 'Published Article', views: 10 },
      publishedData: { title: 'Published Article', views: 10 },
    };

    const user = userEvent.setup();
    renderForm(entry);

    expect(screen.getByText('published')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /save draft/i }),
    ).not.toBeInTheDocument();

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, ' - Updated');

    expect(
      screen.getByRole('button', { name: /save draft/i }),
    ).toBeInTheDocument();
  });

  it('prevents publishing and displays an error toast when required fields fail validation', async () => {
    const entry: ContentEntryRecord = {
      id: 'entry-1',
      status: 'draft',
      data: { title: '', views: 42 },
      publishedData: null,
    };

    const user = userEvent.setup();
    renderForm(entry);

    const titleInput = screen.getByLabelText(/title/i);
    await user.clear(titleInput);
    await user.click(screen.getByRole('button', { name: /^publish$/i }));

    expect(mockPublish).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('button', { name: /publish now/i }),
    ).not.toBeInTheDocument();
    expect(mockToastError).toHaveBeenCalledWith(
      'Please fix validation errors before publishing.',
    );
  });

  it('shows confirmation modal before unpublishing a published entry and unpublishes on confirm', async () => {
    const entry: ContentEntryRecord = {
      id: 'entry-1',
      status: 'published',
      data: { title: 'Published Article', views: 10 },
      publishedData: { title: 'Published Article', views: 10 },
    };
    mockUnpublish.mockResolvedValue({
      ...entry,
      status: 'draft',
      publishedData: null,
    });

    const user = userEvent.setup();
    renderForm(entry);

    expect(screen.getByText('published')).toBeInTheDocument();
    const unpublishBtn = screen.getByRole('button', { name: /unpublish/i });
    expect(unpublishBtn).toBeInTheDocument();

    await user.click(unpublishBtn);

    // Confirm in modal
    expect(screen.getByText('Unpublish Entry')).toBeInTheDocument();
    const unpublishButtons = await screen.findAllByRole('button', {
      name: /unpublish/i,
    });
    await user.click(unpublishButtons[unpublishButtons.length - 1]!);

    await waitFor(() => {
      expect(mockUnpublish).toHaveBeenCalledWith('article', 'entry-1', 'en');
    });
    expect(mockToastSuccess).toHaveBeenCalledWith(
      expect.stringContaining('Entry unpublished successfully'),
    );
  });

  it('displays available locales in the locale selector and switches locale', async () => {
    mockListLocales.mockResolvedValue({
      data: [
        { id: 'loc-1', code: 'en', name: 'English', isDefault: true },
        { id: 'loc-2', code: 'es', name: 'Spanish', isDefault: false },
      ],
    });
    const user = userEvent.setup();
    renderForm();

    const localeBtn = await screen.findByRole('button', {
      name: /select locale/i,
    });
    expect(localeBtn).toBeInTheDocument();
    expect(screen.getByText('en')).toBeInTheDocument();

    await user.click(localeBtn);
    expect(await screen.findByText('Spanish')).toBeInTheDocument();
    await user.click(screen.getByText('Spanish'));

    expect(screen.getByText('es')).toBeInTheDocument();
  });

  it('fetches and populates localized data when switching locale on an existing entry', async () => {
    mockListLocales.mockResolvedValue({
      data: [
        { id: 'loc-1', code: 'en', name: 'English', isDefault: true },
        { id: 'loc-2', code: 'es', name: 'Spanish', isDefault: false },
      ],
    });
    mockGetEntry.mockResolvedValue({
      id: 'entry-1',
      status: 'draft',
      data: { title: 'Hola Mundo', views: 99 },
    });

    const entry: ContentEntryRecord = {
      id: 'entry-1',
      status: 'draft',
      data: { title: 'Hello World', views: 42 },
      publishedData: null,
    };

    const user = userEvent.setup();
    renderForm(entry);

    expect(screen.getByDisplayValue('Hello World')).toBeInTheDocument();

    const localeBtn = await screen.findByRole('button', {
      name: /select locale/i,
    });
    await user.click(localeBtn);

    const spanishOption = await screen.findByText('Spanish');
    await user.click(spanishOption);

    await waitFor(() => {
      expect(mockGetEntry).toHaveBeenCalledWith('article', 'entry-1', 'es');
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Hola Mundo')).toBeInTheDocument();
    });
  });
});
