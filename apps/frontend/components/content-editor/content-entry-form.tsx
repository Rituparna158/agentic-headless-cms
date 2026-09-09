'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { compileZodSchema } from '@repo/validation';

import {
  createContentEntry,
  deleteContentEntry,
  publishContentEntry,
  unpublishContentEntry,
  updateContentEntry,
} from '@/lib/api/content';
import { ApiError } from '@/lib/api-client';
import { Badge, Button } from '@repo/shared-ui';
import { History, Trash2, Undo2 } from 'lucide-react';
import { FormProvider } from 'react-hook-form';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { DynamicField } from './dynamic-field';
import { VersionHistoryDrawer } from './version-history-drawer';
import type { ContentEntryFormProps } from '@/types/component.types';
import { useHasPermission } from '@/hooks/use-permissions';

import { buildDefaultValues } from '@/utils/form';

export function ContentEntryForm({ schema, entry }: ContentEntryFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const canPublish = useHasPermission('publish', schema.id);
  const canDelete = useHasPermission('delete', schema.id);

  const definition = schema.definition;
  // Rebuilt only when the schema itself changes, not on every render — the
  // schema is fetched once and is otherwise stable for the life of this form.
  const zodSchema = useMemo(() => compileZodSchema(definition), [definition]);

  const form = useForm<Record<string, unknown>>({
    resolver: zodResolver(zodSchema),
    defaultValues: buildDefaultValues(definition, entry?.data),
    values: buildDefaultValues(definition, entry?.data),
  });

  function invalidateList() {
    return queryClient.invalidateQueries({
      queryKey: ['content', schema.slug],
    });
  }

  const saveMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      entry
        ? updateContentEntry(schema.slug, entry.id, values)
        : createContentEntry(schema.slug, values),
    onSuccess: async (saved) => {
      await invalidateList();
      toast.success('Draft saved successfully');
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
      return publishContentEntry(schema.slug, entry.id);
    },
    onSuccess: async () => {
      await invalidateList();
      toast.success('Entry published successfully');
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
      return unpublishContentEntry(schema.slug, entry.id);
    },
    onSuccess: async () => {
      await invalidateList();
      toast.success('Entry unpublished successfully');
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
    publishMutation.mutate();
  }

  const { isDirty, isSubmitting } = form.formState;
  const showSaveDraft = !entry || entry.status !== 'published' || isDirty;

  return (
    <FormProvider {...form}>
      <form
        onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
        className="flex flex-col gap-6"
      >
        {/* Sleek Top Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 sm:p-4 rounded-xl border bg-muted/30 backdrop-blur-sm">
          {/* Status Badge */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Status
            </span>
            <Badge
              variant={
                entry?.status === 'published'
                  ? 'success'
                  : entry?.status === 'draft'
                    ? 'secondary'
                    : 'outline'
              }
              size="sm"
              className="capitalize font-medium flex items-center gap-1.5"
            >
              {entry?.status ?? 'Not saved'}
            </Badge>
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

            {showSaveDraft ? (
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="text-xs font-medium"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving…' : 'Save Draft'}
              </Button>
            ) : null}

            {entry?.status === 'published' ? (
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
                    disabled={!canPublish || unpublishMutation.isPending}
                    onClick={() => unpublishMutation.mutate()}
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
                  disabled={!canPublish || publishMutation.isPending}
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
                  disabled={!canDelete || deleteMutation.isPending}
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
          {definition.fields.map((field) => (
            <DynamicField
              key={field.apiId}
              field={field}
              control={form.control}
            />
          ))}
        </div>
      </form>

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

      {entry ? (
        <VersionHistoryDrawer
          schemaSlug={schema.slug}
          entryId={entry.id}
          currentEntry={entry}
          schema={schema}
          open={isVersionHistoryOpen}
          onOpenChange={setIsVersionHistoryOpen}
        />
      ) : null}
    </FormProvider>
  );
}
