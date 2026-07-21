'use client';

import { schemaFieldDataTypes } from '@repo/shared-types';
import { useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { SchemaBuilderFieldValues } from './schema-builder-form';
import type { FieldSettingsPanelProps } from '@/types/component.types';

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
        <FormField
          control={control}
          name={`fields.${index}.displayName`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`fields.${index}.apiId`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>API ID</FormLabel>
              <FormControl>
                <Input placeholder="e.g. title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`fields.${index}.dataType`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {schemaFieldDataTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={control}
            name={`fields.${index}.isRequired`}
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="font-normal">Required</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={`fields.${index}.isUnique`}
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="font-normal">Unique</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={`fields.${index}.isLocalized`}
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="font-normal">Localized</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={`fields.${index}.isRepeatable`}
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="font-normal">Repeatable</FormLabel>
              </FormItem>
            )}
          />
        </div>

        {showLengthLimits || showRegex ? (
          <div className="grid gap-3 border-t pt-4">
            <h3 className="text-sm font-medium">Validation</h3>
            <div className="flex flex-wrap gap-3">
              {showLengthLimits ? (
                <>
                  <FormField
                    control={control}
                    name={`fields.${index}.validation.min`}
                    render={({ field }) => (
                      <FormItem className="w-24">
                        <FormLabel className="font-normal">Min</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            value={(field.value as number | undefined) ?? ''}
                            onChange={(event) =>
                              field.onChange(
                                event.target.value === ''
                                  ? undefined
                                  : Number(event.target.value),
                              )
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`fields.${index}.validation.max`}
                    render={({ field }) => (
                      <FormItem className="w-24">
                        <FormLabel className="font-normal">Max</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            value={(field.value as number | undefined) ?? ''}
                            onChange={(event) =>
                              field.onChange(
                                event.target.value === ''
                                  ? undefined
                                  : Number(event.target.value),
                              )
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </>
              ) : null}

              {showRegex ? (
                <FormField
                  control={control}
                  name={`fields.${index}.validation.regex`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="font-normal">Regex</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. ^[a-z0-9-]+$"
                          value={(field.value as string | undefined) ?? ''}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value === ''
                                ? undefined
                                : event.target.value,
                            )
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="flex justify-end border-t pt-4">
          <Button
            type="button"
            variant="destructive"
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
