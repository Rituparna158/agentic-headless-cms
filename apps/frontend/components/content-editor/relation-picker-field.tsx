'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link2, Trash2, Search, Check, Layers } from 'lucide-react';
import { listSchemas } from '@/lib/api/schemas';
import { listContentEntries } from '@/lib/api/content';
import { Button, Modal, Input, Badge } from '@repo/shared-ui';
import { cn } from '@/lib/utils';
import type {
  SchemaField,
  ContentEntryRecord,
  SchemaRecord,
} from '@repo/types';

export interface RelationPickerFieldProps {
  field: SchemaField;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}

function getEntryTitle(entry: ContentEntryRecord): string {
  if (!entry?.data) return entry?.id ?? 'Unknown';
  const candidateKeys = ['title', 'name', 'heading', 'label', 'slug', 'email'];
  for (const key of candidateKeys) {
    const val = entry.data[key];
    if (typeof val === 'string' && val.trim().length > 0) {
      return val;
    }
  }
  // Fallback to first non-empty string value
  for (const val of Object.values(entry.data)) {
    if (typeof val === 'string' && val.trim().length > 0) {
      return val;
    }
  }
  return entry.id;
}

export function RelationPickerField({
  field,
  value,
  onChange,
  disabled,
  id,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
}: RelationPickerFieldProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [manualMode, setManualMode] = React.useState(false);

  const stringValue = typeof value === 'string' ? value : '';

  // 1. Fetch available schemas
  const { data: schemasData } = useQuery({
    queryKey: ['schemas'],
    queryFn: () => listSchemas(),
  });
  const schemas: SchemaRecord[] = React.useMemo(
    () => schemasData?.data ?? [],
    [schemasData],
  );

  // Determine target schema slug
  const configuredSchemaSlug =
    (field.config?.targetSchemaSlug as string) ||
    (field.config?.targetSchema as string) ||
    (field.config?.schemaSlug as string) ||
    '';

  const [selectedSchemaSlug, setSelectedSchemaSlug] =
    React.useState<string>(configuredSchemaSlug);

  // If no configured schema, pick the first schema once loaded
  React.useEffect(() => {
    if (!selectedSchemaSlug && schemas.length > 0) {
      setSelectedSchemaSlug(configuredSchemaSlug || schemas[0]?.slug || '');
    }
  }, [configuredSchemaSlug, schemas, selectedSchemaSlug]);

  const activeSchemaSlug = configuredSchemaSlug || selectedSchemaSlug;

  // 2. Fetch entries for the active target schema
  const { data: entriesData, isLoading: isEntriesLoading } = useQuery({
    queryKey: ['content', activeSchemaSlug, 'entries'],
    queryFn: () => listContentEntries(activeSchemaSlug, { pageSize: 100 }),
    enabled: Boolean(activeSchemaSlug),
  });

  const entries = React.useMemo(() => entriesData?.data ?? [], [entriesData]);

  // Find currently selected entry details if available
  const selectedEntry = React.useMemo(() => {
    if (!stringValue) return null;
    return entries.find((e) => e.id === stringValue) ?? null;
  }, [entries, stringValue]);

  // Filter entries based on search input
  const filteredEntries = React.useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter((entry) => {
      const title = getEntryTitle(entry).toLowerCase();
      const id = entry.id.toLowerCase();
      return title.includes(q) || id.includes(q);
    });
  }, [entries, search]);

  function handleSelect(entry: ContentEntryRecord) {
    onChange(entry.id);
    setOpen(false);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange('');
  }

  if (manualMode) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <Input
            id={id}
            aria-describedby={ariaDescribedBy}
            aria-invalid={ariaInvalid}
            placeholder="UUID (e.g. 550e8400-e29b-41d4-a716-446655440000)"
            disabled={disabled}
            variant="default"
            value={stringValue}
            onChange={(val: string) => onChange(val)}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground whitespace-nowrap"
            onClick={() => setManualMode(false)}
          >
            Switch to picker
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        id={id}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        className="w-full"
      >
        {stringValue ? (
          /* Selected State Display */
          <div
            className={cn(
              'group relative flex items-center justify-between rounded-lg border bg-muted/30 p-3 transition-colors hover:bg-muted/40',
              ariaInvalid && 'border-destructive',
              disabled && 'opacity-50',
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="rounded-md border bg-background p-2 text-primary">
                <Link2 className="size-4" />
              </div>
              <div className="min-w-0 flex flex-col gap-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm truncate">
                    {selectedEntry ? getEntryTitle(selectedEntry) : stringValue}
                  </span>
                  {activeSchemaSlug && (
                    <Badge
                      variant="secondary"
                      size="sm"
                      className="font-mono text-xs px-2.5 py-0.5 font-medium"
                    >
                      {activeSchemaSlug}
                    </Badge>
                  )}
                </div>
                <span className="font-mono text-[11px] text-muted-foreground truncate">
                  ID: {stringValue}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 ml-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs font-medium"
                disabled={disabled}
                onClick={() => setOpen(true)}
              >
                Change
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                disabled={disabled}
                aria-label="Remove relation"
                onClick={handleClear}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ) : (
          /* Empty / Trigger Button State */
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => setOpen(true)}
              className={cn(
                'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                ariaInvalid && 'border-destructive',
              )}
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <Link2 className="size-4" />
                <span>Select {field.displayName || 'related entry'}…</span>
              </div>
              {activeSchemaSlug && (
                <Badge
                  variant="secondary"
                  size="sm"
                  className="font-mono text-xs px-2.5 py-0.5 font-medium"
                >
                  {activeSchemaSlug}
                </Badge>
              )}
            </button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground whitespace-nowrap h-10"
              onClick={() => setManualMode(true)}
            >
              Enter UUID
            </Button>
          </div>
        )}
      </div>

      {/* Relation Picker Modal */}
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={`Select ${field.displayName || 'Related Entry'}`}
        showFooter={false}
      >
        <div className="flex flex-col gap-4 py-2">
          {/* Schema Selector if multiple schemas available and none hardcoded */}
          {!configuredSchemaSlug && schemas.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Target schema:
              </span>
              <select
                className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs outline-none focus:ring-2 focus:ring-ring"
                value={activeSchemaSlug}
                onChange={(e) => setSelectedSchemaSlug(e.target.value)}
              >
                {schemas.map((s) => (
                  <option key={s.id} value={s.slug}>
                    {s.name} ({s.slug})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${activeSchemaSlug || 'entries'}...`}
              value={search}
              onChange={(val: string) => setSearch(val)}
              className="pl-8 text-sm"
              autoFocus
            />
          </div>

          {/* Entries List */}
          <div className="max-h-72 overflow-y-auto rounded-lg border divide-y bg-background">
            {isEntriesLoading ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                Loading entries…
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center gap-2">
                <Layers className="size-6 text-muted-foreground/50" />
                <p className="text-sm font-medium">No entries found</p>
                <p className="text-xs text-muted-foreground">
                  {search
                    ? `No entries match "${search}"`
                    : `No entries created in schema "${activeSchemaSlug}" yet.`}
                </p>
              </div>
            ) : (
              filteredEntries.map((entry) => {
                const isSelected = entry.id === stringValue;
                const title = getEntryTitle(entry);
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => handleSelect(entry)}
                    className={cn(
                      'flex items-center justify-between w-full p-3 text-left transition-colors hover:bg-muted/50 cursor-pointer',
                      isSelected && 'bg-primary/5 text-primary',
                    )}
                  >
                    <div className="flex flex-col min-w-0 pr-4">
                      <span className="font-medium text-sm truncate">
                        {title}
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground truncate">
                        {entry.id}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={
                          entry.status === 'published' ? 'success' : 'secondary'
                        }
                        size="sm"
                        className="capitalize text-xs font-medium px-2.5 py-0.5"
                      >
                        {entry.status}
                      </Badge>
                      {isSelected && <Check className="size-4 text-primary" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-between pt-2 border-t">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => {
                setOpen(false);
                setManualMode(true);
              }}
            >
              Enter UUID manually
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
