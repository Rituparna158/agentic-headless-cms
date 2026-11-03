import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FieldSettingsPanel } from '@/components/schema-builder/field-settings-panel';
import type { SchemaBuilderFieldValues } from '@/types/component.types';

const { mockListSchemas } = vi.hoisted(() => ({
  mockListSchemas: vi.fn(),
}));

vi.mock('@/lib/api/schemas', () => ({
  listSchemas: mockListSchemas,
}));

function Wrapper({
  defaultValues,
  index = 0,
}: {
  defaultValues: SchemaBuilderFieldValues;
  index?: number;
}) {
  const { control } = useForm<SchemaBuilderFieldValues>({
    defaultValues,
  });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <FieldSettingsPanel index={index} control={control} onRemove={vi.fn()} />
    </QueryClientProvider>
  );
}

describe('FieldSettingsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListSchemas.mockResolvedValue({
      data: [
        { id: '1', name: 'Authors', slug: 'authors' },
        { id: '2', name: 'Categories', slug: 'categories' },
      ],
    });
  });

  it('renders Target Content Type dropdown when dataType is relation', async () => {
    render(
      <Wrapper
        defaultValues={{
          name: 'Articles',
          slug: 'articles',
          type: 'collection',
          fields: [
            {
              apiId: 'author',
              displayName: 'Author',
              dataType: 'relation',
              isRequired: false,
              isUnique: false,
              isLocalized: false,
              isRepeatable: false,
              sortOrder: 0,
            },
          ],
        }}
      />,
    );

    expect(
      await screen.findByLabelText(/target content type/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('option', { name: /Authors \(authors\)/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: /Categories \(categories\)/i }),
    ).toBeInTheDocument();
  });

  it('allows selecting a target content type for a relation field', async () => {
    const user = userEvent.setup();
    render(
      <Wrapper
        defaultValues={{
          name: 'Articles',
          slug: 'articles',
          type: 'collection',
          fields: [
            {
              apiId: 'category',
              displayName: 'Category',
              dataType: 'relation',
              isRequired: false,
              isUnique: false,
              isLocalized: false,
              isRepeatable: false,
              sortOrder: 0,
            },
          ],
        }}
      />,
    );

    const select = await screen.findByLabelText(/target content type/i);
    // Wait until schemas have loaded into the options
    await screen.findByRole('option', { name: /Categories \(categories\)/i });
    await user.selectOptions(select, 'categories');

    expect(select).toHaveValue('categories');
  });

  it('does not render Target Content Type dropdown for text dataType', () => {
    render(
      <Wrapper
        defaultValues={{
          name: 'Articles',
          slug: 'articles',
          type: 'collection',
          fields: [
            {
              apiId: 'title',
              displayName: 'Title',
              dataType: 'text',
              isRequired: false,
              isUnique: false,
              isLocalized: false,
              isRepeatable: false,
              sortOrder: 0,
            },
          ],
        }}
      />,
    );

    expect(
      screen.queryByLabelText(/target content type/i),
    ).not.toBeInTheDocument();
  });
});
