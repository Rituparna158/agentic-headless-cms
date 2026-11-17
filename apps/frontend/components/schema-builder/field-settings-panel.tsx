'use client';

import { Controller, useWatch } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Check,
  ChevronDown,
  Code,
  FileText,
  Hash,
  Image,
  Link2,
  ToggleLeft,
  Trash2,
  Type,
  type LucideIcon,
} from 'lucide-react';
import { listSchemas } from '@/lib/api/schemas';
import type { SchemaRecord } from '@repo/types';
import {
  Button,
  Card,
  CardContent,
  Checkbox,
  Dropdown,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  Input,
  Typography,
} from '@repo/shared-ui';
import { cn } from '@/lib/utils';

import type {
  FieldSettingsPanelProps,
  SchemaBuilderFieldValues,
} from '@/types/component.types';

// Validation rules matching backend's compileZodSchema:
// min/max apply to text/richtext/number. regex applies only to text/richtext.
const LENGTH_VALIDATED_TYPES = new Set(['text', 'richtext', 'number']);
const REGEX_VALIDATED_TYPES = new Set(['text', 'richtext']);

interface FieldTypeOption {
  type: string;
  label: string;
  desc: string;
  icon: LucideIcon;
}

interface FieldCategory {
  name: string;
  types: FieldTypeOption[];
}

const FIELD_CATEGORIES: FieldCategory[] = [
  {
    name: 'Text & Content',
    types: [
      {
        type: 'text',
        label: 'Text',
        desc: 'Single-line plain text, titles, URLs',
        icon: Type,
      },
      {
        type: 'richtext',
        label: 'Rich Text',
        desc: 'Formatted markdown or HTML content',
        icon: FileText,
      },
    ],
  },
  {
    name: 'Numbers & Logic',
    types: [
      {
        type: 'number',
        label: 'Number',
        desc: 'Integers, floats, counters, prices',
        icon: Hash,
      },
      {
        type: 'boolean',
        label: 'Boolean',
        desc: 'True / false, yes / no switches',
        icon: ToggleLeft,
      },
      {
        type: 'date',
        label: 'Date',
        desc: 'Dates, timestamps, schedules',
        icon: Calendar,
      },
    ],
  },
  {
    name: 'Media & Files',
    types: [
      {
        type: 'media',
        label: 'Media',
        desc: 'Images, videos, documents, attachments',
        icon: Image,
      },
    ],
  },
  {
    name: 'Relations & Structured Data',
    types: [
      {
        type: 'relation',
        label: 'Relation',
        desc: 'Reference to another content type',
        icon: Link2,
      },
      {
        type: 'json',
        label: 'JSON',
        desc: 'Custom structured JSON objects',
        icon: Code,
      },
    ],
  },
];

const ALL_FIELD_TYPES: FieldTypeOption[] = FIELD_CATEGORIES.flatMap(
  (c) => c.types,
);

function getFieldTypeOption(type: string): FieldTypeOption {
  return (
    ALL_FIELD_TYPES.find((opt) => opt.type === type) ?? {
      type: 'text',
      label: 'Text',
      desc: 'Single-line plain text',
      icon: Type,
    }
  );
}

export function FieldSettingsPanel({
  index,
  control,
  onRemove,
  onClose,
}: FieldSettingsPanelProps<SchemaBuilderFieldValues>) {
  // useWatch is called unconditionally with a fallback index of 0 to comply with hooks rules.
  const dataType = useWatch({ control, name: `fields.${index ?? 0}.dataType` });
  const isRelation = dataType === 'relation' && index !== null;

  const { data: schemasData, isLoading: isLoadingSchemas } = useQuery({
    queryKey: ['schemas'],
    queryFn: () => listSchemas({ pageSize: 100 }),
    enabled: isRelation,
  });
  const schemas: SchemaRecord[] = schemasData?.data ?? [];

  if (index === null) {
    return (
      <Card className="border-0 shadow-none">
        <CardContent className="text-muted-foreground py-8 text-center text-sm">
          Select a field to edit its settings.
        </CardContent>
      </Card>
    );
  }

  const currentOption = getFieldTypeOption(dataType);
  const CurrentIcon = currentOption.icon;

  const showLengthLimits = LENGTH_VALIDATED_TYPES.has(dataType);
  const showRegex = REGEX_VALIDATED_TYPES.has(dataType);

  return (
    <div className="space-y-5">
      {/* 1. Official Ignix UI Dropdown with high z-index (renders on top of Drawer) */}
      <Controller
        control={control}
        name={`fields.${index}.dataType`}
        render={({ field, fieldState }) => (
          <div className="grid gap-2">
            <Typography
              as="span"
              variant="label"
              className="text-xs uppercase tracking-wider font-semibold text-muted-foreground"
            >
              Field Type
            </Typography>

            <Dropdown
              className="w-[calc(100vw-3rem)] sm:w-[430px] max-w-[430px] p-2"
              align="start"
              trigger={
                <button
                  type="button"
                  className="flex h-12 w-full items-center justify-between rounded-xl border border-input bg-card px-3.5 py-2 text-sm shadow-sm transition-all hover:bg-accent/40 hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                      <CurrentIcon className="size-4" />
                    </div>
                    <div className="text-left truncate">
                      <p className="font-medium text-foreground leading-tight text-sm">
                        {currentOption.label}
                      </p>
                      <p className="text-xs text-muted-foreground leading-tight truncate">
                        {currentOption.desc}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className="size-4 text-muted-foreground shrink-0 ml-2" />
                </button>
              }
            >
              {FIELD_CATEGORIES.map((cat, catIdx) => (
                <div key={cat.name}>
                  {catIdx > 0 && <DropdownSeparator />}
                  <DropdownLabel>{cat.name}</DropdownLabel>
                  {cat.types.map((opt) => {
                    const isSelected = field.value === opt.type;
                    const IconComp = opt.icon;
                    return (
                      <DropdownItem
                        key={opt.type}
                        onSelect={() => field.onChange(opt.type)}
                        className={cn(
                          'flex items-center justify-between gap-3 p-2.5 my-0.5 rounded-lg transition-colors cursor-pointer outline-none focus:bg-accent focus:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground',
                          isSelected &&
                            'bg-primary/10 text-primary font-medium',
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={cn(
                              'flex h-7 w-7 items-center justify-center rounded-md shrink-0',
                              isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground',
                            )}
                          >
                            <IconComp className="size-3.5" />
                          </div>
                          <div className="text-left truncate">
                            <p className="text-xs font-medium leading-none">
                              {opt.label}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 truncate leading-tight">
                              {opt.desc}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="size-4 text-primary shrink-0" />
                        )}
                      </DropdownItem>
                    );
                  })}
                </div>
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

      {/* 2. Display Name */}
      <Controller
        control={control}
        name={`fields.${index}.displayName`}
        render={({ field, fieldState }) => (
          <div className="grid gap-2">
            <label htmlFor={`display-name-${index}`}>
              <Typography
                as="span"
                variant="label"
                className="text-xs uppercase tracking-wider font-semibold text-muted-foreground"
              >
                Display Name
              </Typography>
            </label>
            <Input
              id={`display-name-${index}`}
              placeholder="e.g. Title"
              variant="default"
              {...field}
              value={field.value ?? ''}
            />
            {fieldState.error?.message ? (
              <p className="text-sm font-medium text-destructive">
                {fieldState.error.message.toLowerCase() ===
                'displayname is required'
                  ? 'Display Name is required'
                  : fieldState.error.message}
              </p>
            ) : null}
          </div>
        )}
      />

      {/* 3. API ID */}
      <Controller
        control={control}
        name={`fields.${index}.apiId`}
        render={({ field, fieldState }) => (
          <div className="grid gap-2">
            <label htmlFor={`api-id-${index}`}>
              <Typography
                as="span"
                variant="label"
                className="text-xs uppercase tracking-wider font-semibold text-muted-foreground"
              >
                API ID
              </Typography>
            </label>
            <Input
              id={`api-id-${index}`}
              placeholder="e.g. title"
              variant="default"
              {...field}
              value={field.value ?? ''}
            />
            {fieldState.error?.message ? (
              <p className="text-sm font-medium text-destructive">
                {fieldState.error.message.includes('at least 1 character') ||
                fieldState.error.message.toLowerCase() === 'apiid is required'
                  ? 'API ID is required'
                  : fieldState.error.message.startsWith('apiId')
                    ? fieldState.error.message.replace(/^apiId/, 'API ID')
                    : fieldState.error.message}
              </p>
            ) : null}
          </div>
        )}
      />

      {/* 4. Target Content Type for Relation */}
      {isRelation && (
        <Controller
          control={control}
          name={`fields.${index}.config.targetSchemaSlug`}
          render={({ field, fieldState }) => (
            <div className="grid gap-2">
              <label htmlFor={`target-schema-${index}`}>
                <Typography
                  as="span"
                  variant="label"
                  className="text-xs uppercase tracking-wider font-semibold text-muted-foreground"
                >
                  Target Content Type
                </Typography>
              </label>
              <select
                id={`target-schema-${index}`}
                aria-label="Target Content Type"
                className="flex h-11 w-full items-center justify-between rounded-xl border border-input bg-background px-3.5 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={(field.value as string) ?? ''}
                onChange={(e) => field.onChange(e.target.value || undefined)}
              >
                <option value="">
                  {isLoadingSchemas
                    ? 'Loading content types…'
                    : 'Select target content type…'}
                </option>
                {schemas.map((s) => (
                  <option key={s.id} value={s.slug}>
                    {s.name} ({s.slug})
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Restricts this relation to entries belonging to this content
                type.
              </p>
              {fieldState.error?.message ? (
                <p className="text-sm font-medium text-destructive">
                  {fieldState.error.message}
                </p>
              ) : null}
            </div>
          )}
        />
      )}

      {/* 5. Field Flags — Modern Interactive Cards */}
      <div className="grid gap-2 pt-1">
        <Typography
          as="span"
          variant="label"
          className="text-xs uppercase tracking-wider font-semibold text-muted-foreground"
        >
          Field Settings & Rules
        </Typography>
        <div className="grid grid-cols-2 gap-2.5">
          <Controller
            control={control}
            name={`fields.${index}.isRequired`}
            render={({ field }) => (
              <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border bg-card/60 hover:bg-accent/40 cursor-pointer transition-colors">
                <Checkbox
                  checked={field.value}
                  onChange={field.onChange}
                  className="mt-0.5"
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground leading-tight">
                    Required
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                    Value is mandatory
                  </p>
                </div>
              </label>
            )}
          />

          <Controller
            control={control}
            name={`fields.${index}.isUnique`}
            render={({ field }) => (
              <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border bg-card/60 hover:bg-accent/40 cursor-pointer transition-colors">
                <Checkbox
                  checked={field.value}
                  onChange={field.onChange}
                  className="mt-0.5"
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground leading-tight">
                    Unique
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                    No duplicates allowed
                  </p>
                </div>
              </label>
            )}
          />

          <Controller
            control={control}
            name={`fields.${index}.isLocalized`}
            render={({ field }) => (
              <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border bg-card/60 hover:bg-accent/40 cursor-pointer transition-colors">
                <Checkbox
                  checked={field.value}
                  onChange={field.onChange}
                  className="mt-0.5"
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground leading-tight">
                    Localized
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                    Multi-language
                  </p>
                </div>
              </label>
            )}
          />

          <Controller
            control={control}
            name={`fields.${index}.isRepeatable`}
            render={({ field }) => (
              <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border bg-card/60 hover:bg-accent/40 cursor-pointer transition-colors">
                <Checkbox
                  checked={field.value}
                  onChange={field.onChange}
                  className="mt-0.5"
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground leading-tight">
                    Repeatable
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                    Array of items
                  </p>
                </div>
              </label>
            )}
          />

          {dataType === 'text' && (
            <Controller
              control={control}
              name={`fields.${index}.config.multiline`}
              render={({ field }) => (
                <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border bg-card/60 hover:bg-accent/40 cursor-pointer transition-colors sm:col-span-2">
                  <Checkbox
                    checked={Boolean(field.value)}
                    onChange={field.onChange}
                    className="mt-0.5"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground leading-tight">
                      Multi-line (Textarea)
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                      Renders as a comfortable multi-line box for longer
                      summaries and excerpts
                    </p>
                  </div>
                </label>
              )}
            />
          )}
        </div>
      </div>

      {/* 6. Validation (Min, Max, Regex) */}
      {showLengthLimits || showRegex ? (
        <div className="grid gap-3 border-t border-border pt-4">
          <Typography
            as="span"
            variant="label"
            className="text-xs uppercase tracking-wider font-semibold text-muted-foreground"
          >
            Validation Rules
          </Typography>
          <div className="flex flex-wrap gap-3">
            {showLengthLimits ? (
              <>
                <Controller
                  control={control}
                  name={`fields.${index}.validation.min`}
                  render={({ field }) => (
                    <div className="grid gap-2 w-28">
                      <Typography
                        variant="label"
                        className="text-xs font-normal"
                      >
                        Minimum
                      </Typography>
                      <Input
                        type="number"
                        variant="default"
                        placeholder="Min"
                        value={
                          field.value !== undefined ? String(field.value) : ''
                        }
                        onChange={(val: string) =>
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
                    <div className="grid gap-2 w-28">
                      <Typography
                        variant="label"
                        className="text-xs font-normal"
                      >
                        Maximum
                      </Typography>
                      <Input
                        type="number"
                        variant="default"
                        placeholder="Max"
                        value={
                          field.value !== undefined ? String(field.value) : ''
                        }
                        onChange={(val: string) =>
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
                    <Typography variant="label" className="text-xs font-normal">
                      Regular Expression Pattern
                    </Typography>
                    <Input
                      placeholder="e.g. ^[a-z0-9-]+$"
                      variant="default"
                      value={(field.value as string | undefined) ?? ''}
                      onChange={(val: string) =>
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

      {/* 7. Action Footer */}
      <div className="flex items-center justify-between border-t border-border pt-4 mt-4">
        <Button
          type="button"
          variant="danger"
          size="sm"
          className="gap-1.5"
          onClick={() => onRemove(index)}
        >
          <Trash2 className="size-3.5" />
          Delete Field
        </Button>
        {onClose && (
          <Button
            type="button"
            variant="default"
            size="sm"
            className="gap-1.5 min-w-[90px]"
            onClick={onClose}
          >
            <Check className="size-3.5" />
            Done
          </Button>
        )}
      </div>
    </div>
  );
}
