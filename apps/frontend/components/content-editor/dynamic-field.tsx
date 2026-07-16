'use client';

import { useFieldArray, useFormContext, type Control } from 'react-hook-form';
import { PlusIcon, Trash2 } from 'lucide-react';
import type { SchemaField } from '@repo/shared-types';

import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { FieldTypeInput } from './field-type-input';

export interface DynamicFieldProps {
  field: SchemaField;
  control: Control<Record<string, unknown>>;
}

/** Renders one schema field: a single control, or (isRepeatable) an add/remove-able list of them. */
export function DynamicField({ field, control }: DynamicFieldProps) {
  if (field.isRepeatable) {
    return <RepeatableDynamicField field={field} control={control} />;
  }

  return (
    <FormField
      control={control}
      name={field.apiId}
      render={({ field: rhfField }) => (
        <FormItem>
          <FormLabel>
            {field.displayName}
            {field.isRequired ? ' *' : ''}
          </FormLabel>
          <FormControl>
            <FieldTypeInput
              field={field}
              value={rhfField.value}
              onChange={rhfField.onChange}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function RepeatableDynamicField({ field, control }: DynamicFieldProps) {
  const { getFieldState } = useFormContext();
  // useFieldArray can't statically infer an ArrayPath from a fully generic
  // Record<string, unknown> — there's no static schema to check "is this
  // key actually an array" against, since the field set is only known at
  // runtime (fetched from the backend). The cast just widens the type RHF
  // checks against; field.isRepeatable is what guarantees this path is
  // actually an array at runtime.
  const arrayControl = control as unknown as Control<Record<string, unknown[]>>;
  const fieldArray = useFieldArray({
    control: arrayControl,
    name: field.apiId,
  });
  const fieldState = getFieldState(field.apiId);

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium">
        {field.displayName}
        {field.isRequired ? ' *' : ''}
      </span>

      <div className="grid gap-2">
        {fieldArray.fields.map((item, index) => (
          <FormField
            key={item.id}
            control={control}
            name={`${field.apiId}.${index}`}
            render={({ field: rhfField }) => (
              <FormItem className="flex flex-row items-start gap-2 space-y-0">
                <FormControl>
                  <FieldTypeInput
                    field={field}
                    value={rhfField.value}
                    onChange={rhfField.onChange}
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${field.displayName} item ${index + 1}`}
                  onClick={() => fieldArray.remove(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </FormItem>
            )}
          />
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() =>
          fieldArray.append(field.dataType === 'boolean' ? false : '')
        }
      >
        <PlusIcon className="size-4" />
        Add {field.displayName}
      </Button>

      {fieldState.error?.root?.message ? (
        <p role="alert" className="text-destructive text-sm">
          {fieldState.error.root.message}
        </p>
      ) : null}
    </div>
  );
}
