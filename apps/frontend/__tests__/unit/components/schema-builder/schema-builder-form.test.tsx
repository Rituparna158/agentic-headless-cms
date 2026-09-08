import type { SchemaRecord } from '@repo/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SchemaBuilderForm } from '@/components/schema-builder/schema-builder-form';

const { mockPush, mockCreateSchema, mockUpdateSchema, mockToastError } =
  vi.hoisted(() => ({
    mockPush: vi.fn(),
    mockCreateSchema: vi.fn(),
    mockUpdateSchema: vi.fn(),
    mockToastError: vi.fn(),
  }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: mockToastError,
  },
}));

vi.mock('@/lib/api/schemas', () => ({
  createSchema: mockCreateSchema,
  updateSchema: mockUpdateSchema,
}));

function renderForm(schema?: SchemaRecord) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SchemaBuilderForm schema={schema} />
    </QueryClientProvider>,
  );
}

describe('SchemaBuilderForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with a single default field row, selected in the settings panel', () => {
    renderForm();
    // Master-detail layout: only the selected field's full config is
    // rendered at a time, so "Display Name" appears once (in the settings
    // panel for the auto-selected first field), not once per field row.
    expect(screen.getAllByLabelText(/display name/i)).toHaveLength(1);
    expect(screen.getByLabelText('Remove field 1')).toBeInTheDocument();
  });

  it('does not add a new field and displays validation errors when current field is incomplete', async () => {
    const user = userEvent.setup();
    renderForm();

    // Click "Add field" while field 1 is empty
    await user.click(screen.getByRole('button', { name: /add field/i }));

    // Field 2 must NOT be added
    expect(screen.queryByLabelText('Remove field 2')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Remove field 1')).toBeInTheDocument();

    // Validation error messages must be visible
    await waitFor(() => {
      expect(screen.getByText('Display Name is required')).toBeInTheDocument();
      expect(screen.getByText('API ID is required')).toBeInTheDocument();
    });

    // Error indicator in the list item must be visible
    expect(screen.getByLabelText('Field has errors')).toBeInTheDocument();
    expect(screen.getByText('invalid')).toBeInTheDocument();
    expect(mockToastError).toHaveBeenCalledWith(
      expect.stringContaining(
        'Please complete the required details for Field 1',
      ),
    );
  });

  it('clears validation errors in real-time as the user types after triggering incomplete field validation', async () => {
    const user = userEvent.setup();
    renderForm();

    // Click "Add field" while field 1 is empty to trigger validation
    await user.click(screen.getByRole('button', { name: /add field/i }));

    await waitFor(() => {
      expect(screen.getByText('Display Name is required')).toBeInTheDocument();
      expect(screen.getByText('API ID is required')).toBeInTheDocument();
    });
    expect(screen.getByText('invalid')).toBeInTheDocument();

    // Start typing in Display Name — the error should vanish immediately in real-time
    await user.type(screen.getByLabelText(/display name/i), 'T');
    await waitFor(() => {
      expect(
        screen.queryByText('Display Name is required'),
      ).not.toBeInTheDocument();
    });

    // API ID error is still present until user types in it
    expect(screen.getByText('API ID is required')).toBeInTheDocument();

    // Type in an invalid API ID starting with a capital letter — real-time regex error must appear
    await user.type(screen.getByLabelText('API ID'), 'Title');
    await waitFor(() => {
      expect(
        screen.getByText(/must start with a lowercase letter/i),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText('API ID is required')).not.toBeInTheDocument();

    // Correct the API ID to all lowercase — error must vanish immediately in real-time
    await user.clear(screen.getByLabelText('API ID'));
    await user.type(screen.getByLabelText('API ID'), 'title');
    await waitFor(() => {
      expect(
        screen.queryByText(/must start with a lowercase letter/i),
      ).not.toBeInTheDocument();
    });

    // Both Display Name and API ID are now valid — the list item "invalid" badge must disappear in real-time
    expect(screen.queryByText('invalid')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Field has errors')).not.toBeInTheDocument();
  });

  it('adds a new field row when "Add field" is clicked after completing the current field', async () => {
    const user = userEvent.setup();
    renderForm();

    // Fill current field with valid inputs
    await user.type(screen.getByLabelText(/display name/i), 'Title');
    await user.type(screen.getByLabelText('API ID'), 'title');

    await user.click(screen.getByRole('button', { name: /add field/i }));

    expect(screen.getByLabelText('Remove field 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Remove field 2')).toBeInTheDocument();
    // The settings panel still shows exactly one field's config — the
    // newly added field, which "Add field" auto-selects.
    expect(screen.getAllByLabelText(/display name/i)).toHaveLength(1);
  });

  it('removes a field row when its remove button is clicked', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/display name/i), 'Title');
    await user.type(screen.getByLabelText('API ID'), 'title');

    await user.click(screen.getByRole('button', { name: /add field/i }));
    expect(screen.getByLabelText('Remove field 2')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Remove field 2'));
    expect(screen.queryByLabelText('Remove field 2')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Remove field 1')).toBeInTheDocument();
  });

  it('selects a field when clicking it in the list, showing its own config', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/display name/i), 'Title');
    await user.type(screen.getByLabelText('API ID'), 'title');

    await user.click(screen.getByRole('button', { name: /add field/i }));
    await user.type(screen.getByLabelText(/display name/i), 'Views');

    // Selecting field 1 again should show ITS displayName input with "Title",
    // not "Views" leaking across from field 2's now-deselected panel.
    await user.click(screen.getByText('Title'));
    expect(screen.getByLabelText(/display name/i)).toHaveValue('Title');
  });

  it('shows validation errors and does not submit for an empty form', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(
      screen.getByRole('button', { name: /create (content type|schema)/i }),
    );

    await waitFor(() => {
      expect(screen.getByText('name is required')).toBeInTheDocument();
    });
    expect(mockCreateSchema).not.toHaveBeenCalled();
  });

  it('clears schema name error in real-time as the user types', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(
      screen.getByRole('button', { name: /create (content type|schema)/i }),
    );

    await waitFor(() => {
      expect(screen.getByText('name is required')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Name'), 'B');
    await waitFor(() => {
      expect(screen.queryByText('name is required')).not.toBeInTheDocument();
    });
  });

  it('submits a valid schema and navigates to the list on success', async () => {
    mockCreateSchema.mockResolvedValue({
      id: 'schema-1',
      name: 'Blog Post',
      slug: 'blog-post',
      type: 'collection',
      status: 'draft',
      version: 1,
      definition: { fields: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('Name'), 'Blog Post');
    await user.type(screen.getByLabelText('Slug'), 'blog-post');
    await user.type(screen.getByLabelText(/display name/i), 'Title');
    await user.type(screen.getByLabelText('API ID'), 'title');

    await user.click(
      screen.getByRole('button', { name: /create (content type|schema)/i }),
    );

    await waitFor(() => {
      expect(mockCreateSchema).toHaveBeenCalledTimes(1);
    });

    const payload = mockCreateSchema.mock.calls[0]![0];
    expect(payload.name).toBe('Blog Post');
    expect(payload.slug).toBe('blog-post');
    expect(payload.fields).toHaveLength(1);
    expect(payload.fields[0]).toMatchObject({
      apiId: 'title',
      displayName: 'Title',
      dataType: 'text',
      sortOrder: 0,
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/content-types?created=blog-post');
    });
  });

  it('shows a submit error message when the API call fails', async () => {
    mockCreateSchema.mockRejectedValue(new Error('network down'));

    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('Name'), 'Blog Post');
    await user.type(screen.getByLabelText('Slug'), 'blog-post');
    await user.type(screen.getByLabelText(/display name/i), 'Title');
    await user.type(screen.getByLabelText('API ID'), 'title');

    await user.click(
      screen.getByRole('button', { name: /create (content type|schema)/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/failed to create (content type|schema)/i),
      ).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('auto-selects first invalid field and displays an error message on submit when fields are incomplete', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('Name'), 'Blog Post');
    await user.type(screen.getByLabelText('Slug'), 'blog-post');
    await user.type(screen.getByLabelText(/display name/i), 'Title');
    await user.type(screen.getByLabelText('API ID'), 'title');

    // Add field 2
    await user.click(screen.getByRole('button', { name: /add field/i }));
    expect(screen.getByLabelText('Remove field 2')).toBeInTheDocument();

    // Switch back to Field 1, leaving Field 2 incomplete and unselected
    await user.click(screen.getByText('Title'));

    // Attempt to submit the form
    await user.click(
      screen.getByRole('button', { name: /create (content type|schema)/i }),
    );

    // It should automatically switch focus to Field 2 and show the error inline in the settings panel
    await waitFor(() => {
      expect(screen.getByText('Display Name is required')).toBeInTheDocument();
    });

    expect(mockToastError).toHaveBeenCalledWith(
      expect.stringContaining('Field 2'),
    );
    expect(mockCreateSchema).not.toHaveBeenCalled();
  });

  describe('editing an existing schema', () => {
    const existingSchema: SchemaRecord = {
      id: 'schema-1',
      name: 'Blog Post',
      slug: 'blog-post',
      type: 'collection',
      status: 'published',
      version: 2,
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('pre-fills the form and disables slug/kind', () => {
      renderForm(existingSchema);

      expect(screen.getByLabelText('Name')).toHaveValue('Blog Post');
      expect(screen.getByLabelText('Slug')).toHaveValue('blog-post');
      expect(screen.getByLabelText('Slug')).toBeDisabled();
      expect(
        screen.getByRole('button', { name: /save changes/i }),
      ).toBeInTheDocument();
    });

    it('calls updateSchema (not createSchema) with only name and fields on submit', async () => {
      mockUpdateSchema.mockResolvedValue({ ...existingSchema, name: 'Post' });

      const user = userEvent.setup();
      renderForm(existingSchema);

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(mockUpdateSchema).toHaveBeenCalledTimes(1);
      });
      expect(mockCreateSchema).not.toHaveBeenCalled();

      const [id, payload] = mockUpdateSchema.mock.calls[0]!;
      expect(id).toBe('schema-1');
      expect(payload.name).toBe('Blog Post');
      expect(payload.fields).toHaveLength(1);
      expect(payload.fields[0]).toMatchObject({
        apiId: 'title',
        displayName: 'Title',
        dataType: 'text',
        sortOrder: 0,
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          '/content-types?updated=blog-post',
        );
      });
    });
  });
});
