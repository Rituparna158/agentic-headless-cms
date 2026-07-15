'use client';

import type * as React from 'react';
import type { SchemaField } from '@repo/shared-types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LexicalRichTextField } from './lexical-rich-text-field';

export interface FieldTypeInputProps {
  field: SchemaField;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  id?: string;
  'aria-describedby'?: React.AriaAttributes['aria-describedby'];
  'aria-invalid'?: React.AriaAttributes['aria-invalid'];
}

/**
 * Renders the single control appropriate for one field's dataType — no
 * knowledge of react-hook-form here, just a plain controlled input, so it
 * can be reused identically for both a scalar field and each item of a
 * repeatable field's array (see dynamic-field.tsx).
 *
 * This is rendered as the sole child of shadcn's `FormControl`, which is a
 * Radix `Slot` — it merges `id`/`aria-describedby`/`aria-invalid` onto
 * whatever single element it wraps, for label association and error
 * announcement. Since a plain function component doesn't automatically
 * forward props like that to its own internal elements, `...rest` is
 * threaded through explicitly onto the actual focusable control in every
 * branch below.
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
    case 'relation':
      // No media picker / relation search UI exists yet (out of scope for
      // this issue) — the backend only validates these as a UUID string, so
      // a plain text input is the honest minimum viable control.
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
