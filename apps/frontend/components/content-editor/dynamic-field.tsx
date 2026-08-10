'use client';

import { PlusIcon, Trash2 } from 'lucide-react';
import { type Control, useFieldArray, useFormContext } from 'react-hook-form';

import { Button, Typography } from '@repo/shared-ui';
import { Controller } from 'react-hook-form';
import type { DynamicFieldProps } from '@/types/component.types';
import { FieldTypeInput } from './field-type-input';

/** Renders one schema field: a single control, or (isRepeatable) an add/remove-able list of them. */
export function DynamicField({ field, control }: DynamicFieldProps) {
  if (field.isRepeatable) {
    return <RepeatableDynamicField field={field} control={control} />;
  }

  return (
    <Controller
      control={control}
      name={field.apiId}
      render={({ field: rhfField, fieldState }) => (
        <div className="grid gap-2">
          <label htmlFor={field.apiId}>
            <Typography variant="label">
              {field.displayName}
              {field.isRequired ? ' *' : ''}
            </Typography>
          </label>
          <FieldTypeInput
            id={field.apiId}
            field={field}
            value={rhfField.value}
            onChange={rhfField.onChange}
          />
          {fieldState.error?.message ? (
            <p className="text-sm font-medium text-destructive">
              {fieldState.error.message}
            </p>
          ) : null}
        </div>
      )}
    />
  );
}

function RepeatableDynamicField({ field, control }: DynamicFieldProps) {
  const { getFieldState } = useFormContext();
  // The generic Record<string, unknown> prevents useFieldArray from inferring ArrayPath.
  // We cast to Record<string, unknown[]> to bypass this; field.isRepeatable guarantees it at runtime.
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
          <Controller
            key={item.id}
            control={control}
            name={`${field.apiId}.${index}`}
            render={({ field: rhfField, fieldState }) => (
              <div className="flex flex-col gap-1">
                <div className="flex flex-row items-start gap-2">
                  <div className="flex-1">
                    <FieldTypeInput
                      id={`${field.apiId}-${index}`}
                      field={field}
                      value={rhfField.value}
                      onChange={rhfField.onChange}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${field.displayName} item ${index + 1}`}
                    onClick={() => fieldArray.remove(index)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                {fieldState.error?.message ? (
                  <p className="text-sm font-medium text-destructive">
                    {fieldState.error.message}
                  </p>
                ) : null}
              </div>
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
