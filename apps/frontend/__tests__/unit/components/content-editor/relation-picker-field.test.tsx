import type { SchemaField, ContentEntryRecord } from '@repo/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RelationPickerField } from '@/components/content-editor/relation-picker-field';

const { mockListSchemas, mockListContentEntries } = vi.hoisted(() => ({
  mockListSchemas: vi.fn(),
  mockListContentEntries: vi.fn(),
}));

vi.mock('@/lib/api/schemas', () => ({
  listSchemas: mockListSchemas,
}));

vi.mock('@/lib/api/content', () => ({
  listContentEntries: mockListContentEntries,
}));

const mockField: SchemaField = {
  apiId: 'author',
  displayName: 'Author',
  dataType: 'relation',
  isRequired: false,
  isUnique: false,
  isLocalized: false,
  isRepeatable: false,
  sortOrder: 0,
  config: { targetSchemaSlug: 'authors' },
};

const mockEntries: ContentEntryRecord[] = [
  {
    id: 'entry-uuid-1',
    status: 'published',
    data: { name: 'Alice Author', bio: 'Tech writer' },
    publishedData: { name: 'Alice Author' },
    publishedAt: new Date().toISOString(),
  },
  {
    id: 'entry-uuid-2',
    status: 'draft',
    data: { name: 'Bob Blogger', bio: 'Content creator' },
    publishedData: null,
  },
];

function renderField(value: unknown = '', onChange = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RelationPickerField
        field={mockField}
        value={value}
        onChange={onChange}
      />
    </QueryClientProvider>,
  );
}

describe('RelationPickerField', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListSchemas.mockResolvedValue({
      data: [{ id: 'schema-1', name: 'Authors', slug: 'authors' }],
    });
    mockListContentEntries.mockResolvedValue({
      data: mockEntries,
      meta: { total: 2 },
    });
  });

  it('renders the picker button in empty state', () => {
    renderField('');
    expect(
      screen.getByRole('button', { name: /select author…/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /enter uuid/i }),
    ).toBeInTheDocument();
  });

  it('toggles manual UUID mode and updates value', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderField('', onChange);

    await user.click(screen.getByRole('button', { name: /enter uuid/i }));

    const input = screen.getByPlaceholderText(/UUID/i);
    expect(input).toBeInTheDocument();

    await user.type(input, '123');
    expect(onChange).toHaveBeenLastCalledWith('3');
  });

  it('renders the selected entry card when a value is set and allows clearing', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderField('entry-uuid-1', onChange);

    expect(screen.getByText(/ID: entry-uuid-1/i)).toBeInTheDocument();

    const removeButton = screen.getByRole('button', {
      name: /remove relation/i,
    });
    await user.click(removeButton);

    expect(onChange).toHaveBeenCalledWith('');
  });

  it('opens modal, lists entries, filters on search, and selects an entry', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderField('', onChange);

    // Open modal
    await user.click(screen.getByRole('button', { name: /select author…/i }));

    expect(await screen.findByText('Select Author')).toBeInTheDocument();
    expect(await screen.findByText('Alice Author')).toBeInTheDocument();
    expect(screen.getByText('Bob Blogger')).toBeInTheDocument();

    // Filter by search
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'Alice' } });

    expect(screen.getByText('Alice Author')).toBeInTheDocument();
    expect(screen.queryByText('Bob Blogger')).not.toBeInTheDocument();

    // Select Alice
    await user.click(screen.getByText('Alice Author'));

    expect(onChange).toHaveBeenCalledWith('entry-uuid-1');
  });
});
