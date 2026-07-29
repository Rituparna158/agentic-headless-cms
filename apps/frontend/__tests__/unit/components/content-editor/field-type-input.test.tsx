import type { SchemaField } from '@repo/shared-types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { FieldTypeInput } from '@/components/content-editor/field-type-input';

function makeField(overrides: Partial<SchemaField>): SchemaField {
  return {
    apiId: 'field',
    displayName: 'Field',
    dataType: 'text',
    isRequired: false,
    isUnique: false,
    isLocalized: false,
    isRepeatable: false,
    sortOrder: 0,
    ...overrides,
  };
}

describe('FieldTypeInput', () => {
  it('renders a text input for dataType "text" and reports the raw string', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <FieldTypeInput
        field={makeField({ dataType: 'text' })}
        value=""
        onChange={onChange}
      />,
    );

    await user.type(screen.getByRole('textbox'), 'hi');
    expect(onChange).toHaveBeenLastCalledWith('i');
  });

  it('renders a number input for dataType "number" and reports a numeric value', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <FieldTypeInput
        field={makeField({ dataType: 'number' })}
        value={undefined}
        onChange={onChange}
      />,
    );

    await user.type(screen.getByRole('spinbutton'), '4');
    expect(onChange).toHaveBeenLastCalledWith(4);
  });

  it('renders a Switch for dataType "boolean"', () => {
    const onChange = vi.fn();
    render(
      <FieldTypeInput
        field={makeField({ dataType: 'boolean' })}
        value={false}
        onChange={onChange}
      />,
    );
    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  it('renders a Select populated from field.config.options for dataType "enum"', () => {
    const onChange = vi.fn();
    render(
      <FieldTypeInput
        field={makeField({
          dataType: 'enum',
          config: { options: ['draft', 'live'] },
        })}
        value="draft"
        onChange={onChange}
      />,
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('falls back to a text input for dataType "enum" with no configured options', () => {
    const onChange = vi.fn();
    render(
      <FieldTypeInput
        field={makeField({ dataType: 'enum' })}
        value=""
        onChange={onChange}
      />,
    );
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('renders the Lexical rich text editor for dataType "richtext"', () => {
    const onChange = vi.fn();
    render(
      <FieldTypeInput
        field={makeField({ dataType: 'richtext', displayName: 'Body' })}
        value=""
        onChange={onChange}
      />,
    );
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bold' })).toBeInTheDocument();
  });
});
