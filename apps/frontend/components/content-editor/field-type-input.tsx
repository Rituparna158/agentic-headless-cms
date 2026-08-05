'use client';

import type * as React from 'react';
import type { FieldTypeInputProps } from '@/types/component.types';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

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
          onCheckedChange={onChange}
          disabled={disabled}
          {...rest}
        />
      );

    case 'number':
      return (
        <Input
          type="number"
          disabled={disabled}
          value={typeof value === 'number' ? value : ''}
          onChange={(event) =>
            onChange(
              event.target.value === ''
                ? undefined
                : Number(event.target.value),
            )
          }
          {...rest}
        />
      );

    case 'date':
      return (
        <Input
          type="date"
          disabled={disabled}
          value={typeof value === 'string' ? value.slice(0, 10) : ''}
          onChange={(event) =>
            onChange(
              event.target.value
                ? new Date(event.target.value).toISOString()
                : '',
            )
          }
          {...rest}
        />
      );

    case 'datetime':
      return (
        <Input
          type="datetime-local"
          disabled={disabled}
          value={typeof value === 'string' ? value.slice(0, 16) : ''}
          onChange={(event) =>
            onChange(
              event.target.value
                ? new Date(event.target.value).toISOString()
                : '',
            )
          }
          {...rest}
        />
      );

    case 'json':
      return (
        <Textarea
          disabled={disabled}
          className="font-mono text-xs"
          rows={6}
          value={
            typeof value === 'string'
              ? value
              : JSON.stringify(value ?? {}, null, 2)
          }
          onChange={(event) => onChange(event.target.value)}
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
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
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
            value={typeof value === 'string' ? value : ''}
            onChange={(event) => onChange(event.target.value)}
            {...rest}
          />
        );
      }

      return (
        <Select
          value={typeof value === 'string' ? value : undefined}
          onValueChange={onChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-full" {...rest}>
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {stringOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    case 'email':
      return (
        <Input
          type="email"
          disabled={disabled}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
          {...rest}
        />
      );

    case 'url':
      return (
        <Input
          type="url"
          disabled={disabled}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
          {...rest}
        />
      );

    case 'text':
    default:
      return (
        <Input
          disabled={disabled}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
          {...rest}
        />
      );
  }
}
