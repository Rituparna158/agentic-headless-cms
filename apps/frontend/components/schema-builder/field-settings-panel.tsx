'use client';

import { schemaFieldDataTypes } from '@repo/validation';
import { Controller, useWatch } from 'react-hook-form';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Dropdown,
  DropdownItem,
  Input,
  Typography,
} from '@repo/shared-ui';

import type {
  FieldSettingsPanelProps,
  SchemaBuilderFieldValues,
} from '@/types/component.types';

// Validation rules matching backend's compileZodSchema:
// min/max apply to text/richtext/number. regex applies only to text/richtext.
const LENGTH_VALIDATED_TYPES = new Set(['text', 'richtext', 'number']);
const REGEX_VALIDATED_TYPES = new Set(['text', 'richtext']);

export function FieldSettingsPanel({
  index,
  control,
  onRemove,
}: FieldSettingsPanelProps<SchemaBuilderFieldValues>) {
  // useWatch is called unconditionally with a fallback index of 0 to comply with hooks rules.
  const dataType = useWatch({ control, name: `fields.${index ?? 0}.dataType` });

  if (index === null) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-8 text-center text-sm">
          Select a field to edit its settings.
        </CardContent>
      </Card>
    );
  }

  const showLengthLimits = LENGTH_VALIDATED_TYPES.has(dataType);
  const showRegex = REGEX_VALIDATED_TYPES.has(dataType);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Field settings</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Controller
          control={control}
          name={`fields.${index}.displayName`}
          render={({ field, fieldState }) => (
            <div className="grid gap-2">
              <Typography variant="label">Display name</Typography>
              <Input placeholder="e.g. Title" variant="default" {...field} />
              {fieldState.error?.message ? (
                <p className="text-sm font-medium text-destructive">
                  {fieldState.error.message}
                </p>
              ) : null}
            </div>
          )}
        />

        <Controller
          control={control}
          name={`fields.${index}.apiId`}
          render={({ field, fieldState }) => (
            <div className="grid gap-2">
              <Typography variant="label">API ID</Typography>
              <Input placeholder="e.g. title" variant="default" {...field} />
              {fieldState.error?.message ? (
                <p className="text-sm font-medium text-destructive">
                  {fieldState.error.message}
                </p>
              ) : null}
            </div>
          )}
        />

        <Controller
          control={control}
          name={`fields.${index}.dataType`}
          render={({ field, fieldState }) => (
            <div className="grid gap-2">
              <Typography variant="label">Type</Typography>
              <Dropdown
                trigger={
                  <button
                    type="button"
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {field.value || 'Select a type'}
                  </button>
                }
              >
                {schemaFieldDataTypes.map((type) => (
                  <DropdownItem
                    key={type}
                    onSelect={() => field.onChange(type)}
                  >
                    {type}
                  </DropdownItem>
                ))}
              </Dropdown>
              {fieldState.error?.message ? (
                <p className="text-sm font-medium text-destructive">
                  {fieldState.error.message}
                </p>
              ) : null}
            </div>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <Controller
            control={control}
            name={`fields.${index}.isRequired`}
            render={({ field }) => (
              <div className="flex flex-row items-center gap-2">
                <Checkbox checked={field.value} onChange={field.onChange} />
                <Typography variant="label" className="font-normal m-0">
                  Required
                </Typography>
              </div>
            )}
          />

          <Controller
            control={control}
            name={`fields.${index}.isUnique`}
            render={({ field }) => (
              <div className="flex flex-row items-center gap-2">
                <Checkbox checked={field.value} onChange={field.onChange} />
                <Typography variant="label" className="font-normal m-0">
                  Unique
                </Typography>
              </div>
            )}
          />

          <Controller
            control={control}
            name={`fields.${index}.isLocalized`}
            render={({ field }) => (
              <div className="flex flex-row items-center gap-2">
                <Checkbox checked={field.value} onChange={field.onChange} />
                <Typography variant="label" className="font-normal m-0">
                  Localized
                </Typography>
              </div>
            )}
          />

          <Controller
            control={control}
            name={`fields.${index}.isRepeatable`}
            render={({ field }) => (
              <div className="flex flex-row items-center gap-2">
                <Checkbox checked={field.value} onChange={field.onChange} />
                <Typography variant="label" className="font-normal m-0">
                  Repeatable
                </Typography>
              </div>
            )}
          />
        </div>

        {showLengthLimits || showRegex ? (
          <div className="grid gap-3 border-t pt-4">
            <h3 className="text-sm font-medium">Validation</h3>
            <div className="flex flex-wrap gap-3">
              {showLengthLimits ? (
                <>
                  <Controller
                    control={control}
                    name={`fields.${index}.validation.min`}
                    render={({ field }) => (
                      <div className="grid gap-2 w-24">
                        <Typography variant="label" className="font-normal">
                          Min
                        </Typography>
                        <Input
                          type="number"
                          variant="default"
                          placeholder="Min"
                          value={
                            field.value !== undefined ? String(field.value) : ''
                          }
                          onChange={(val) =>
                            field.onChange(val === '' ? undefined : Number(val))
                          }
                        />
                      </div>
                    )}
                  />
                  <Controller
                    control={control}
                    name={`fields.${index}.validation.max`}
                    render={({ field }) => (
                      <div className="grid gap-2 w-24">
                        <Typography variant="label" className="font-normal">
                          Max
                        </Typography>
                        <Input
                          type="number"
                          variant="default"
                          placeholder="Max"
                          value={
                            field.value !== undefined ? String(field.value) : ''
                          }
                          onChange={(val) =>
                            field.onChange(val === '' ? undefined : Number(val))
                          }
                        />
                      </div>
                    )}
                  />
                </>
              ) : null}

              {showRegex ? (
                <Controller
                  control={control}
                  name={`fields.${index}.validation.regex`}
                  render={({ field }) => (
                    <div className="grid gap-2 flex-1">
                      <Typography variant="label" className="font-normal">
                        Regex
                      </Typography>
                      <Input
                        placeholder="e.g. ^[a-z0-9-]+$"
                        variant="default"
                        value={(field.value as string | undefined) ?? ''}
                        onChange={(val) =>
                          field.onChange(val === '' ? undefined : val)
                        }
                      />
                    </div>
                  )}
                />
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="flex justify-end border-t pt-4">
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => onRemove(index)}
          >
            Delete field
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
