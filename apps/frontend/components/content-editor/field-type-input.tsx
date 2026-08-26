'use client';

import type * as React from 'react';
import type { FieldTypeInputProps } from '@/types/component.types';
import {
  Input,
  Switch,
  Textarea,
  Dropdown,
  DropdownItem,
  DatePicker,
} from '@repo/shared-ui';
import { LexicalRichTextField } from './lexical-rich-text-field';
import { MediaPickerField } from './media-picker-field';

/**
 * Renders a specific input control based on the field's dataType.
 *
 * Note: This component is agnostic to react-hook-form. It acts as a standard controlled input.
 * It is wrapped by `FormControl` which automatically handles accessibility attributes
 * (like aria-invalid) by forwarding props via `...rest`.
 */
export function FieldTypeInput({
  field,
  value,
  onChange,
  disabled,
  ...rest
}: FieldTypeInputProps) {
  switch (field.dataType) {
    case 'richtext':
      return (
        <LexicalRichTextField
          value={typeof value === 'string' ? value : ''}
          onChange={onChange}
          placeholder={field.displayName}
          disabled={disabled}
          {...rest}
        />
      );

    case 'boolean':
      return (
        <Switch
          checked={Boolean(value)}
          onCheckedChange={(checked: boolean) => onChange(checked)}
          disabled={disabled}
          {...rest}
        />
      );

    case 'number':
      return (
        <Input
          type="number"
          disabled={disabled}
          variant="default"
          placeholder={field.displayName}
          value={typeof value === 'number' ? value.toString() : ''}
          onChange={(val: string) =>
            onChange(val === '' ? undefined : Number(val))
          }
          {...rest}
        />
      );

    case 'date':
      return (
        <DatePicker
          value={typeof value === 'string' && value ? new Date(value) : null}
          onChange={(
            date: Parameters<
              NonNullable<React.ComponentProps<typeof DatePicker>['onChange']>
            >[0],
          ) => onChange(date instanceof Date ? date.toISOString() : '')}
          disabled={disabled}
          placeholder={field.displayName}
          {...rest}
        />
      );

    case 'datetime':
      return (
        <Input
          type="datetime-local"
          disabled={disabled}
          variant="default"
          placeholder={field.displayName}
          value={typeof value === 'string' ? value.slice(0, 16) : ''}
          onChange={(val: string) =>
            onChange(val ? new Date(val).toISOString() : '')
          }
          {...rest}
        />
      );

    case 'json':
      return (
        <Textarea
          disabled={disabled}
          className="font-mono text-xs"
          minRows={3}
          maxRows={10}
          placeholder={field.displayName}
          variant="default"
          value={
            typeof value === 'string'
              ? value
              : JSON.stringify(value ?? {}, null, 2)
          }
          onChange={(val: string) => onChange(val)}
          {...rest}
        />
      );

    case 'media':
      return (
        <MediaPickerField
          value={typeof value === 'string' ? value : ''}
          onChange={onChange}
          disabled={disabled}
          {...rest}
        />
      );

    case 'relation':
      // No relation picker UI yet - plain UUID input until a relation picker is built.
      return (
        <Input
          placeholder="UUID"
          disabled={disabled}
          variant="default"
          value={typeof value === 'string' ? value : ''}
          onChange={(val: string) => onChange(val)}
          {...rest}
        />
      );

    case 'enum': {
      const options = (field.config as { options?: unknown } | null | undefined)
        ?.options;
      const stringOptions = Array.isArray(options)
        ? options.filter((o): o is string => typeof o === 'string')
        : [];

      if (stringOptions.length === 0) {
        // No options configured on this field — fall back to free text
        // rather than rendering a Select with nothing to pick.
        return (
          <Input
            disabled={disabled}
            variant="default"
            placeholder={field.displayName}
            value={typeof value === 'string' ? value : ''}
            onChange={(val: string) => onChange(val)}
            {...rest}
          />
        );
      }

      return (
        <Dropdown
          trigger={
            <button
              type="button"
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={disabled}
              {...rest}
            >
              {typeof value === 'string' ? value : 'Select…'}
            </button>
          }
        >
          {stringOptions.map((option) => (
            <DropdownItem key={option} onSelect={() => onChange(option)}>
              {option}
            </DropdownItem>
          ))}
        </Dropdown>
      );
    }

    case 'email':
      return (
        <Input
          type="email"
          disabled={disabled}
          variant="default"
          placeholder={field.displayName}
          value={typeof value === 'string' ? value : ''}
          onChange={(val: string) => onChange(val)}
          {...rest}
        />
      );

    case 'url':
      return (
        <Input
          type="url"
          disabled={disabled}
          variant="default"
          placeholder={field.displayName}
          value={typeof value === 'string' ? value : ''}
          onChange={(val: string) => onChange(val)}
          {...rest}
        />
      );

    case 'text':
    default:
      return (
        <Input
          disabled={disabled}
          variant="default"
          placeholder={field.displayName}
          value={typeof value === 'string' ? value : ''}
          onChange={(val: string) => onChange(val)}
          {...rest}
        />
      );
  }
}
