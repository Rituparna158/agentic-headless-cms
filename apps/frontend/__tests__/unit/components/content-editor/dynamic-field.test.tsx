/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import { DynamicField } from '@/components/content-editor/dynamic-field';

vi.mock('@/components/content-editor/field-type-input', () => ({
  FieldTypeInput: ({ field, value, onChange }: any) => (
    <input
      data-testid={`mock-field-${field.apiId}`}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

function Wrapper({ children, defaultValues = {} }: any) {
  const methods = useForm({ defaultValues });
  return (
    <FormProvider {...methods}>
      <form>
        {typeof children === 'function' ? children(methods.control) : children}
      </form>
    </FormProvider>
  );
}

describe('DynamicField', () => {
  it('renders a single field when not repeatable', () => {
    const field: any = {
      apiId: 'title',
      displayName: 'Title',
      isRequired: true,
      isRepeatable: false,
    };

    render(
      <Wrapper defaultValues={{ title: 'Hello' }}>
        {(control: any) => <DynamicField field={field} control={control} />}
      </Wrapper>,
    );

    expect(screen.getByText('Title *')).toBeInTheDocument();
    const input = screen.getByTestId('mock-field-title');
    expect(input).toHaveValue('Hello');
  });

  it('renders a repeatable field wrapper', () => {
    const field: any = {
      apiId: 'tags',
      displayName: 'Tags',
      isRequired: false,
      isRepeatable: true,
    };

    render(
      <Wrapper defaultValues={{ tags: ['one', 'two'] }}>
        {(control: any) => <DynamicField field={field} control={control} />}
      </Wrapper>,
    );

    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getAllByTestId('mock-field-tags')).toHaveLength(2);
    expect(screen.getAllByTestId('mock-field-tags')[0]).toHaveValue('one');
    expect(screen.getAllByTestId('mock-field-tags')[1]).toHaveValue('two');
  });

  it('can add new items to a repeatable field', async () => {
    const user = userEvent.setup();
    const field: any = {
      apiId: 'tags',
      displayName: 'Tags',
      isRepeatable: true,
      dataType: 'string',
    };

    render(
      <Wrapper defaultValues={{ tags: [] }}>
        {(control: any) => <DynamicField field={field} control={control} />}
      </Wrapper>,
    );

    expect(screen.queryByTestId('mock-field-tags')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add Tags' }));

    expect(screen.getAllByTestId('mock-field-tags')).toHaveLength(1);
    expect(screen.getAllByTestId('mock-field-tags')[0]).toHaveValue('');
  });

  it('appends false for boolean data types', async () => {
    const user = userEvent.setup();
    const field: any = {
      apiId: 'flags',
      displayName: 'Flags',
      isRepeatable: true,
      dataType: 'boolean',
    };

    render(
      <Wrapper defaultValues={{ flags: [] }}>
        {(control: any) => <DynamicField field={field} control={control} />}
      </Wrapper>,
    );

    await user.click(screen.getByRole('button', { name: 'Add Flags' }));
    expect(screen.getByTestId('mock-field-flags')).toBeInTheDocument();
  });

  it('can remove items from a repeatable field', async () => {
    const user = userEvent.setup();
    const field: any = {
      apiId: 'tags',
      displayName: 'Tags',
      isRepeatable: true,
    };

    render(
      <Wrapper defaultValues={{ tags: ['one', 'two'] }}>
        {(control: any) => <DynamicField field={field} control={control} />}
      </Wrapper>,
    );

    expect(screen.getAllByTestId('mock-field-tags')).toHaveLength(2);

    const removeButtons = screen.getAllByRole('button', {
      name: /Remove Tags item/,
    });
    expect(removeButtons).toHaveLength(2);

    await user.click(removeButtons[0]!);

    const inputs = screen.getAllByTestId('mock-field-tags');
    expect(inputs).toHaveLength(1);
    expect(inputs[0]).toHaveValue('two');
  });
});
