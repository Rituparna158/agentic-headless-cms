'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { compileZodSchema } from '@repo/validation';
import { DEFAULT_LOCALE } from '@repo/constants';

import {
  createContentEntry,
  deleteContentEntry,
  getContentEntry,
  publishContentEntry,
  unpublishContentEntry,
  updateContentEntry,
} from '@/lib/api/content';
import { listLocales } from '@/lib/api/locales';
import { ApiError } from '@/lib/api-client';
import {
  Badge,
  Button,
  Dropdown,
  DropdownItem,
  Skeleton,
} from '@repo/shared-ui';
import type { SchemaField } from '@repo/types';
import { ChevronDown, Globe, History, Trash2, Undo2 } from 'lucide-react';
import { FormProvider } from 'react-hook-form';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { DynamicField } from './dynamic-field';
import { VersionHistoryDrawer } from './version-history-drawer';
import type { ContentEntryFormProps } from '@/types/component.types';
import { useHasPermission } from '@/hooks/use-permissions';

import { buildDefaultValues } from '@/utils/form';

/**
 * Type-aware field loading skeleton using Ignix UI Skeleton.
 * Accurately mirrors field labels, inputs, switches, and rich-text areas to prevent layout shift.
 */
function FormFieldSkeleton({ field }: { field: SchemaField }) {
  if (field.dataType === 'boolean') {
    return (
      <div className="grid gap-2">
        <Skeleton
          variant="text"
          width="100px"
          height="16px"
          className="rounded"
        />
        <Skeleton
          variant="rectangular"
          width="44px"
          height="24px"
          className="rounded-full"
        />
      </div>
    );
  }

  if (field.dataType === 'richtext') {
    return (
      <div className="grid gap-2">
        <Skeleton
          variant="text"
          width="120px"
          height="16px"
          className="rounded"
        />
        <div className="rounded-lg border border-border/70 p-3 space-y-2">
          <Skeleton
            variant="rectangular"
            width="100%"
            height="32px"
            className="rounded"
          />
          <Skeleton
            variant="rectangular"
            width="100%"
            height="120px"
            className="rounded"
          />
        </div>
      </div>
    );
  }

  if (field.dataType === 'media') {
    return (
      <div className="grid gap-2">
        <Skeleton
          variant="text"
          width="110px"
          height="16px"
          className="rounded"
        />
        <Skeleton
          variant="rectangular"
          width="100%"
          height="96px"
          className="rounded-lg border border-dashed border-border/70"
        />
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <Skeleton
        variant="text"
        width="130px"
        height="16px"
        className="rounded"
      />
      <Skeleton
        variant="rectangular"
        width="100%"
        height="40px"
        className="rounded-md"
      />
    </div>
  );
}

export function ContentEntryForm({ schema, entry }: ContentEntryFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState(false);
  const [isUnpublishConfirmOpen, setIsUnpublishConfirmOpen] = useState(false);
  const [isLocaleConfirmOpen, setIsLocaleConfirmOpen] = useState(false);
  const [pendingLocale, setPendingLocale] = useState<string | null>(null);

  const canCreate = useHasPermission('create', schema.id);
  const canUpdate = useHasPermission('update', schema.id);
  const canPublish = useHasPermission('publish', schema.id);
  const canDelete = useHasPermission('delete', schema.id);
  const canEdit = entry ? canUpdate : canCreate;

  const definition = schema.definition;
  // Rebuilt only when the schema itself changes, not on every render — the
  // schema is fetched once and is otherwise stable for the life of this form.
  const zodSchema = useMemo(() => compileZodSchema(definition), [definition]);

  // Query registered locales
  const { data: localesData } = useQuery({
    queryKey: ['locales'],
    queryFn: () => listLocales(),
  });
  const locales = useMemo(() => localesData?.data ?? [], [localesData]);
  const defaultLocale = useMemo(() => {
    const defaultObj = locales.find((l) => l.isDefault);
    return defaultObj ? defaultObj.code : DEFAULT_LOCALE;
  }, [locales]);

  const [selectedLocale, setSelectedLocale] = useState<string>(DEFAULT_LOCALE);

  useEffect(() => {
    if (
      defaultLocale &&
      selectedLocale === DEFAULT_LOCALE &&
      defaultLocale !== DEFAULT_LOCALE
    ) {
      setSelectedLocale(defaultLocale);
    }
  }, [defaultLocale, selectedLocale]);

  // Query entry data for currently selected locale when editing an existing entry
  const { data: localizedEntry, isFetching: isLocalizedLoading } = useQuery({
    queryKey: ['content', schema.slug, 'entry', entry?.id, selectedLocale],
    queryFn: async () => {
      try {
        const res = await getContentEntry(
          schema.slug,
          entry!.id,
          selectedLocale,
        );
        return res ?? null;
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 404) {
          // No localized translation version exists yet
          return null;
        }
        throw err;
      }
    },
    enabled: Boolean(entry?.id && selectedLocale !== defaultLocale),
    retry: false,
  });

  const activeEntryData = useMemo(() => {
    if (!entry) return undefined;
    if (selectedLocale === defaultLocale) return entry.data;
    if (localizedEntry) return localizedEntry.data;
    if (localizedEntry === null) return undefined;
    return undefined;
  }, [entry, localizedEntry, selectedLocale, defaultLocale]);

  const currentStatus = useMemo(() => {
    if (!entry) return undefined;
    if (selectedLocale === defaultLocale) return entry.status;
    if (localizedEntry) return localizedEntry.status;
    if (localizedEntry === null) return 'untranslated';
    return 'draft';
  }, [entry, localizedEntry, selectedLocale, defaultLocale]);

  const form = useForm<Record<string, unknown>>({
    resolver: zodResolver(zodSchema),
    defaultValues: buildDefaultValues(definition, entry?.data),
    values: buildDefaultValues(definition, activeEntryData),
    resetOptions: {
      keepDirtyValues: false,
    },
  });

  useEffect(() => {
    if (activeEntryData !== undefined) {
      form.reset(buildDefaultValues(definition, activeEntryData));
    } else if (localizedEntry === null || (!entry && selectedLocale)) {
      form.reset(buildDefaultValues(definition, undefined));
    }
  }, [
    activeEntryData,
    localizedEntry,
    entry,
    selectedLocale,
    definition,
    form,
  ]);

  function handleLocaleChange(newLocale: string) {
    if (newLocale === selectedLocale) return;
    if (form.formState.isDirty) {
      setPendingLocale(newLocale);
      setIsLocaleConfirmOpen(true);
      return;
    }
    setSelectedLocale(newLocale);
  }

  function invalidateList() {
    return queryClient.invalidateQueries({
      queryKey: ['content', schema.slug],
    });
  }

  const saveMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      entry
        ? updateContentEntry(schema.slug, entry.id, values, selectedLocale)
        : createContentEntry(schema.slug, values, selectedLocale),
    onSuccess: async (saved) => {
      await invalidateList();
      await queryClient.invalidateQueries({
        queryKey: ['content', schema.slug, 'entry', saved.id],
      });
      toast.success(
        `Draft saved successfully${selectedLocale ? ` (${selectedLocale})` : ''}`,
      );
      router.push(`/content/${schema.slug}/${saved.id}`);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Failed to save draft. Please try again.',
      );
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => {
      if (!entry) throw new Error('Save the draft before publishing.');
      return publishContentEntry(schema.slug, entry.id, selectedLocale);
    },
    onSuccess: async () => {
      await invalidateList();
      await queryClient.invalidateQueries({
        queryKey: ['content', schema.slug, 'entry', entry?.id],
      });
      toast.success(
        `Entry published successfully${selectedLocale ? ` (${selectedLocale})` : ''}`,
      );
      router.refresh();
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Failed to publish entry. Please try again.',
      );
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: () => {
      if (!entry) throw new Error('Entry not found.');
      return unpublishContentEntry(schema.slug, entry.id, selectedLocale);
    },
    onSuccess: async () => {
      await invalidateList();
      await queryClient.invalidateQueries({
        queryKey: ['content', schema.slug, 'entry', entry?.id],
      });
      toast.success(
        `Entry unpublished successfully${selectedLocale ? ` (${selectedLocale})` : ''}`,
      );
      router.refresh();
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Failed to unpublish entry. Please try again.',
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!entry)
        throw new Error('Nothing to delete — this draft was never saved.');
      return deleteContentEntry(schema.slug, entry.id);
    },
    onSuccess: async () => {
      await invalidateList();
      setIsDeleteConfirmOpen(false);
      toast.success('Entry deleted successfully');
      router.push(`/content/${schema.slug}`);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Failed to delete entry. Please try again.',
      );
    },
  });

  async function onSubmit(values: Record<string, unknown>) {
    setSubmitError(null);
    try {
      await saveMutation.mutateAsync(values);
    } catch (error) {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : 'Failed to save entry. Please try again.',
      );
    }
  }

  async function handlePublishClick() {
    const isValid = await form.trigger();
    if (!isValid) {
      toast.error('Please fix validation errors before publishing.');
      return;
    }
    setIsPublishConfirmOpen(true);
  }

  const { isDirty, isSubmitting } = form.formState;
  const showSaveDraft = !entry || currentStatus !== 'published' || isDirty;

  return (
    <FormProvider {...form}>
      <form
        onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
        className="flex flex-col gap-6"
      >
        {/* Sleek Top Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 sm:p-4 rounded-xl border bg-muted/30 backdrop-blur-sm">
          {/* Status Badge & Locale Selector */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </span>
              <Badge
                variant={
                  currentStatus === 'published'
                    ? 'success'
                    : currentStatus === 'draft'
                      ? 'secondary'
                      : 'outline'
                }
                size="sm"
                className="capitalize font-medium flex items-center gap-1.5"
              >
                {currentStatus === 'untranslated'
                  ? 'Not translated'
                  : (currentStatus ?? 'Not saved')}
              </Badge>
            </div>

            {/* Locale Selector Dropdown */}
            <Dropdown
              align="start"
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 px-2.5 text-xs font-medium border-border/80"
                  aria-label="Select Locale"
                >
                  <Globe className="size-3.5 text-muted-foreground" />
                  <span className="uppercase font-semibold tracking-wider">
                    {selectedLocale}
                  </span>
                  {locales.length > 0 && (
                    <span className="text-muted-foreground text-[11px] font-normal hidden sm:inline">
                      {locales.find((l) => l.code === selectedLocale)?.name ??
                        ''}
                    </span>
                  )}
                  <ChevronDown className="size-3 text-muted-foreground ml-0.5 opacity-60" />
                </Button>
              }
            >
              {locales.length === 0 ? (
                <DropdownItem
                  onSelect={() => handleLocaleChange(DEFAULT_LOCALE)}
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono uppercase font-bold text-[11px] px-1 py-0.5 rounded bg-muted">
                      {DEFAULT_LOCALE}
                    </span>
                    <span>Default (English)</span>
                  </div>
                </DropdownItem>
              ) : (
                locales.map((loc) => (
                  <DropdownItem
                    key={loc.id}
                    onSelect={() => handleLocaleChange(loc.code)}
                  >
                    <div className="flex items-center justify-between w-full gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono uppercase font-bold text-[11px] px-1 py-0.5 rounded bg-muted">
                          {loc.code}
                        </span>
                        <span
                          className={
                            loc.code === selectedLocale ? 'font-semibold' : ''
                          }
                        >
                          {loc.name}
                        </span>
                      </div>
                      {loc.isDefault && (
                        <Badge
                          variant="outline"
                          size="xs"
                          className="text-[10px]"
                        >
                          Default
                        </Badge>
                      )}
                    </div>
                  </DropdownItem>
                ))
              )}
            </Dropdown>
          </div>

          {/* Action Buttons Group */}
          <div className="flex flex-wrap items-center gap-2.5">
            {entry ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 text-xs font-medium"
                onClick={() => setIsVersionHistoryOpen(true)}
              >
                <History className="size-3.5 text-muted-foreground" />
                <span>View history</span>
              </Button>
            ) : null}

            {!canEdit ? (
              <Badge
                variant="outline"
                className="text-amber-600 bg-amber-500/10 border-amber-500/20 text-xs px-2.5 py-1"
              >
                Read-Only
              </Badge>
            ) : showSaveDraft ? (
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="text-xs font-medium"
                disabled={isSubmitting || isLocalizedLoading}
              >
                {isSubmitting ? 'Saving…' : 'Save Draft'}
              </Button>
            ) : null}

            {currentStatus === 'published' ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-xs font-medium opacity-70 cursor-not-allowed"
                  disabled
                >
                  Published
                </Button>

                <span
                  title={
                    !canPublish
                      ? 'You do not have permission to unpublish.'
                      : ''
                  }
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs font-medium flex items-center gap-1.5 text-amber-600 hover:text-amber-700 dark:text-amber-400"
                    disabled={
                      !canPublish ||
                      unpublishMutation.isPending ||
                      isLocalizedLoading
                    }
                    onClick={() => setIsUnpublishConfirmOpen(true)}
                  >
                    <Undo2 className="size-3.5" />
                    <span>
                      {unpublishMutation.isPending
                        ? 'Unpublishing…'
                        : 'Unpublish'}
                    </span>
                  </Button>
                </span>
              </>
            ) : entry ? (
              <span
                title={
                  !canPublish ? 'You do not have permission to publish.' : ''
                }
              >
                <Button
                  type="button"
                  size="sm"
                  className="text-xs font-medium"
                  disabled={
                    !canPublish ||
                    publishMutation.isPending ||
                    isLocalizedLoading
                  }
                  onClick={() => void handlePublishClick()}
                >
                  {publishMutation.isPending ? 'Publishing…' : 'Publish'}
                </Button>
              </span>
            ) : null}

            {entry ? (
              <span
                title={
                  !canDelete ? 'You do not have permission to delete.' : ''
                }
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs font-medium flex items-center gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                  disabled={
                    !canDelete || deleteMutation.isPending || isLocalizedLoading
                  }
                  onClick={() => setIsDeleteConfirmOpen(true)}
                >
                  <Trash2 className="size-3.5" />
                  <span>
                    {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
                  </span>
                </Button>
              </span>
            ) : null}
          </div>
        </div>

        {submitError ? (
          <p
            role="alert"
            className="text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-md p-3"
          >
            {submitError}
          </p>
        ) : null}

        {/* Dynamic Fields taking full width */}
        <div className="grid gap-5 w-full">
          {isLocalizedLoading ? (
            <div
              data-testid="locale-loading-skeleton"
              className="grid gap-5 w-full"
            >
              {definition.fields.map((field) => (
                <FormFieldSkeleton key={field.apiId} field={field} />
              ))}
            </div>
          ) : (
            definition.fields.map((field) => (
              <DynamicField
                key={field.apiId}
                field={field}
                control={form.control}
              />
            ))
          )}
        </div>
      </form>

      {/* Publish Confirmation Dialog */}
      <ConfirmDialog
        open={isPublishConfirmOpen}
        onOpenChange={setIsPublishConfirmOpen}
        title="Publish Entry"
        description="Are you sure you want to publish this entry? It will become publicly visible and trigger any connected webhooks."
        confirmLabel={publishMutation.isPending ? 'Publishing…' : 'Publish'}
        onConfirm={() => {
          setIsPublishConfirmOpen(false);
          publishMutation.mutate();
        }}
      />

      {/* Unpublish Confirmation Dialog */}
      <ConfirmDialog
        open={isUnpublishConfirmOpen}
        onOpenChange={setIsUnpublishConfirmOpen}
        title="Unpublish Entry"
        description="Are you sure you want to unpublish this entry? It will revert to draft status and be hidden from the public."
        confirmLabel={
          unpublishMutation.isPending ? 'Unpublishing…' : 'Unpublish'
        }
        destructive={true}
        onConfirm={() => {
          setIsUnpublishConfirmOpen(false);
          unpublishMutation.mutate();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title="Delete Entry"
        description="Are you sure you want to permanently delete this entry? This action cannot be undone."
        confirmLabel={deleteMutation.isPending ? 'Deleting…' : 'Delete'}
        destructive={true}
        onConfirm={() => deleteMutation.mutate()}
      />

      {/* Locale Switch Confirmation Dialog */}
      <ConfirmDialog
        open={isLocaleConfirmOpen}
        onOpenChange={(open) => {
          setIsLocaleConfirmOpen(open);
          if (!open) setPendingLocale(null);
        }}
        title="Discard Unsaved Changes?"
        description="You have unsaved changes in this locale. Switching locales will discard them. Do you want to continue?"
        confirmLabel="Discard & Switch"
        destructive={true}
        onConfirm={() => {
          setIsLocaleConfirmOpen(false);
          if (pendingLocale) {
            const nextLocale = pendingLocale;
            setSelectedLocale(nextLocale);
            setPendingLocale(null);
            const targetData =
              nextLocale === defaultLocale ? entry?.data : undefined;
            form.reset(buildDefaultValues(definition, targetData));
          }
        }}
      />

      {entry ? (
        <VersionHistoryDrawer
          schemaSlug={schema.slug}
          entryId={entry.id}
          currentEntry={localizedEntry ?? entry}
          schema={schema}
          open={isVersionHistoryOpen}
          onOpenChange={setIsVersionHistoryOpen}
        />
      ) : null}
    </FormProvider>
  );
}
