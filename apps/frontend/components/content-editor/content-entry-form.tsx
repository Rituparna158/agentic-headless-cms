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
  listContentVersions,
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
import {
  ChevronDown,
  Globe,
  History,
  Languages,
  Loader2,
  Settings2,
  Sparkles,
  Trash2,
  Undo2,
} from 'lucide-react';
import {
  translateContentEntry,
  getTranslationConfig,
  type TranslationConfig,
} from '@/lib/services/translation-service';
import { TranslationSettingsDialog } from './translation-settings-dialog';
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
  const rawLocales = useMemo(() => localesData?.data ?? [], [localesData]);
  const defaultLocale = useMemo(() => {
    const defaultObj = rawLocales.find((l) => l.isDefault);
    return defaultObj ? defaultObj.code : DEFAULT_LOCALE;
  }, [rawLocales]);

  const locales = useMemo(() => {
    const list = [...rawLocales];

    // Ensure the defaultLocale is always present in the options list
    const hasDefault = list.some(
      (l) => l.code.toLowerCase() === defaultLocale.toLowerCase(),
    );
    if (!hasDefault) {
      list.unshift({
        id: 'system-default-locale',
        code: defaultLocale,
        name:
          defaultLocale === DEFAULT_LOCALE
            ? 'English'
            : defaultLocale.toUpperCase(),
        isDefault: true,
        createdAt: new Date().toISOString(),
      });
    }

    // Ensure DEFAULT_LOCALE ('en') is also present if defaultLocale is different
    const hasEn = list.some(
      (l) => l.code.toLowerCase() === DEFAULT_LOCALE.toLowerCase(),
    );
    if (!hasEn && defaultLocale !== DEFAULT_LOCALE) {
      list.push({
        id: 'system-en-locale',
        code: DEFAULT_LOCALE,
        name: 'English',
        isDefault: false,
        createdAt: new Date().toISOString(),
      });
    }

    return list;
  }, [rawLocales, defaultLocale]);

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

  // Query historical versions for this entry
  const { data: versions } = useQuery({
    queryKey: ['content', schema.slug, 'entry', entry?.id, 'versions'],
    queryFn: () => listContentVersions(schema.slug, entry!.id),
    enabled: Boolean(entry?.id),
  });

  const sortedVersions = useMemo(() => {
    if (!versions) return [];
    return [...versions].sort((a, b) => b.versionNo - a.versionNo);
  }, [versions]);

  const latestVersionNo = useMemo(() => {
    return sortedVersions[0]?.versionNo ?? 1;
  }, [sortedVersions]);

  const [selectedVersionNo, setSelectedVersionNo] = useState<number | null>(
    null,
  );
  const [pendingVersionNo, setPendingVersionNo] = useState<number | null>(null);
  const [isVersionConfirmOpen, setIsVersionConfirmOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTranslationSettingsOpen, setIsTranslationSettingsOpen] =
    useState(false);
  const [translationConfig, setTranslationConfig] = useState<TranslationConfig>(
    () => getTranslationConfig(),
  );

  async function handleAutoTranslate() {
    if (selectedLocale === defaultLocale) {
      toast.info(`You are currently on the default locale (${defaultLocale}).`);
      return;
    }

    const sourceData = (entry?.data || form.getValues()) as Record<
      string,
      unknown
    >;
    if (!sourceData || Object.keys(sourceData).length === 0) {
      toast.error(
        `No source content found in default locale (${defaultLocale}) to translate from.`,
      );
      return;
    }

    setIsTranslating(true);
    try {
      const result = await translateContentEntry({
        fields: definition.fields,
        sourceData,
        sourceLocale: defaultLocale,
        targetLocale: selectedLocale,
        config: translationConfig,
      });

      if (result.translatedCount === 0) {
        toast.info(
          'No translatable text fields with content were found to translate.',
        );
        return;
      }

      Object.entries(result.translatedData).forEach(([key, value]) => {
        form.setValue(key, value, {
          shouldDirty: true,
          shouldValidate: true,
          shouldTouch: true,
        });
      });

      const providerLabel =
        result.provider === 'openai'
          ? 'OpenAI'
          : result.provider === 'custom'
            ? 'Custom Endpoint'
            : 'Free API';

      toast.success(
        `Auto-translated ${result.translatedCount} field${
          result.translatedCount === 1 ? '' : 's'
        } from ${defaultLocale.toUpperCase()} to ${selectedLocale.toUpperCase()} via ${providerLabel}`,
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to auto-translate content',
      );
    } finally {
      setIsTranslating(false);
    }
  }

  const selectedVersionRecord = useMemo(() => {
    if (selectedVersionNo === null || !sortedVersions.length) return null;
    return (
      sortedVersions.find((v) => v.versionNo === selectedVersionNo) ?? null
    );
  }, [selectedVersionNo, sortedVersions]);

  const isViewingHistorical = Boolean(
    selectedVersionRecord && selectedVersionNo !== latestVersionNo,
  );

  const activeDisplayData = useMemo(() => {
    if (isViewingHistorical && selectedVersionRecord) {
      return selectedVersionRecord.data;
    }
    return activeEntryData;
  }, [isViewingHistorical, selectedVersionRecord, activeEntryData]);

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
    values: buildDefaultValues(definition, activeDisplayData),
    resetOptions: {
      keepDirtyValues: false,
    },
  });

  useEffect(() => {
    if (activeDisplayData !== undefined) {
      form.reset(buildDefaultValues(definition, activeDisplayData));
    } else if (localizedEntry === null || (!entry && selectedLocale)) {
      form.reset(buildDefaultValues(definition, undefined));
    }
  }, [
    activeDisplayData,
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
    setSelectedVersionNo(null);
  }

  function handleVersionSelect(versionNo: number) {
    if (versionNo === (selectedVersionNo ?? latestVersionNo)) return;
    if (form.formState.isDirty) {
      setPendingVersionNo(versionNo);
      setIsVersionConfirmOpen(true);
      return;
    }
    setSelectedVersionNo(versionNo === latestVersionNo ? null : versionNo);
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
  const showSaveDraft =
    !isViewingHistorical &&
    (!entry || currentStatus !== 'published' || isDirty);

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
                      {locales.find(
                        (l) =>
                          l.code.toLowerCase() === selectedLocale.toLowerCase(),
                      )?.name ?? ''}
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
                            loc.code.toLowerCase() ===
                            selectedLocale.toLowerCase()
                              ? 'font-semibold'
                              : ''
                          }
                        >
                          {loc.name}
                        </span>
                      </div>
                      {loc.isDefault && (
                        <Badge
                          variant="outline"
                          size="sm"
                          className="text-xs font-medium px-2 py-0.5"
                        >
                          Default
                        </Badge>
                      )}
                    </div>
                  </DropdownItem>
                ))
              )}
            </Dropdown>

            {/* Auto-Translate Action (visible when in secondary locale) */}
            {selectedLocale !== defaultLocale && (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAutoTranslate}
                  disabled={isTranslating}
                  className="h-8 gap-1.5 px-2.5 text-xs font-medium border-primary/40 bg-primary/5 text-primary hover:bg-primary/15 hover:text-primary transition-all"
                  aria-label="Auto-translate"
                  title={`Auto-translate from ${defaultLocale} to ${selectedLocale}`}
                >
                  {isTranslating ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Languages className="size-3.5" />
                  )}
                  <span>Auto-translate</span>
                </Button>

                <Dropdown
                  align="end"
                  className="min-w-[12rem] p-1.5"
                  trigger={
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      aria-label="Translation Settings"
                      title="Translation options & provider settings"
                    >
                      <Settings2 className="size-3.5" />
                    </Button>
                  }
                >
                  <DropdownItem onSelect={handleAutoTranslate}>
                    <div className="flex items-center gap-2 text-xs">
                      <Sparkles className="size-3.5 text-primary" />
                      <span>Translate from {defaultLocale.toUpperCase()}</span>
                    </div>
                  </DropdownItem>
                  <DropdownItem
                    onSelect={() => setIsTranslationSettingsOpen(true)}
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <Settings2 className="size-3.5 text-muted-foreground" />
                      <span>
                        Provider:{' '}
                        <span className="font-semibold capitalize">
                          {translationConfig.provider}
                        </span>
                        ...
                      </span>
                    </div>
                  </DropdownItem>
                </Dropdown>
              </div>
            )}

            {/* Version Toggle Dropdown */}
            {entry && (
              <Dropdown
                align="start"
                className="max-h-60 overflow-y-auto min-w-[7rem] p-1.5"
                trigger={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 px-2.5 text-xs font-medium border-border/80"
                    aria-label="Select Version"
                  >
                    <span className="font-semibold">
                      v{selectedVersionNo ?? latestVersionNo}
                    </span>
                    <ChevronDown className="size-3 text-muted-foreground ml-0.5 opacity-60" />
                  </Button>
                }
              >
                <div className="max-h-52 overflow-y-auto flex flex-col gap-0.5 pr-1">
                  {sortedVersions.length === 0 ? (
                    <DropdownItem disabled>
                      <span className="text-xs">v1</span>
                    </DropdownItem>
                  ) : (
                    sortedVersions.map((v) => {
                      const isSelected =
                        (selectedVersionNo ?? latestVersionNo) === v.versionNo;
                      return (
                        <DropdownItem
                          key={v.id}
                          onSelect={() => handleVersionSelect(v.versionNo)}
                          className={isSelected ? 'font-bold bg-accent' : ''}
                        >
                          <span className="text-xs">v{v.versionNo}</span>
                        </DropdownItem>
                      );
                    })
                  )}
                </div>
              </Dropdown>
            )}
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
                    isViewingHistorical ||
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
                    isViewingHistorical ||
                    !canDelete ||
                    deleteMutation.isPending ||
                    isLocalizedLoading
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

        {/* Historical Preview Notice */}
        {isViewingHistorical && (
          <div className="flex items-center justify-between p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs">
            <span>
              Viewing historical snapshot <strong>v{selectedVersionNo}</strong>{' '}
              (Read-Only).
            </span>
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="h-7 text-xs bg-background"
              onClick={() => setSelectedVersionNo(null)}
            >
              Back to Latest (v{latestVersionNo})
            </Button>
          </div>
        )}

        {/* Dynamic Fields taking full width */}
        <fieldset
          disabled={isViewingHistorical}
          className="grid gap-5 w-full border-none p-0 m-0 disabled:opacity-85"
        >
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
                disabled={isViewingHistorical}
              />
            ))
          )}
        </fieldset>
      </form>

      {/* Version Switch Confirmation Dialog */}
      <ConfirmDialog
        open={isVersionConfirmOpen}
        onOpenChange={(open) => {
          setIsVersionConfirmOpen(open);
          if (!open) setPendingVersionNo(null);
        }}
        title="Discard Unsaved Changes?"
        description="You have unsaved changes. Switching versions will discard them. Do you want to continue?"
        confirmLabel="Discard & Switch"
        destructive={true}
        onConfirm={() => {
          setIsVersionConfirmOpen(false);
          if (pendingVersionNo !== null) {
            setSelectedVersionNo(
              pendingVersionNo === latestVersionNo ? null : pendingVersionNo,
            );
            setPendingVersionNo(null);
          }
        }}
      />

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

      {/* Translation Provider Settings Dialog */}
      <TranslationSettingsDialog
        open={isTranslationSettingsOpen}
        onOpenChange={setIsTranslationSettingsOpen}
        onConfigChange={setTranslationConfig}
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
