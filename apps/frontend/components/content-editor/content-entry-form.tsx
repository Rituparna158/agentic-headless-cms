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
  updateContentEntry,
} from '@/lib/api/content';
import { ApiError } from '@/lib/api-client';
import { Button } from '@repo/shared-ui';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shared-ui';
import { FormProvider } from 'react-hook-form';
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
      router.push(`/content/${schema.slug}/${saved.id}`);
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => {
      if (!entry) throw new Error('Save the draft before publishing.');
      return publishContentEntry(schema.slug, entry.id);
    },
    onSuccess: async () => {
      await invalidateList();
      router.refresh();
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
      router.push(`/content/${schema.slug}`);
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

  return (
    <FormProvider {...form}>
      <form
        onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
        className="grid gap-6 lg:grid-cols-[1fr_18rem]"
      >
        <div className="grid gap-4">
          {definition.fields.map((field) => (
            <DynamicField
              key={field.apiId}
              field={field}
              control={form.control}
            />
          ))}
        </div>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Publishing</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium capitalize">
                  {entry?.status ?? 'Not saved'}
                </span>
              </div>
            </CardContent>
          </Card>

          {entry ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Versions</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full justify-between"
                  onClick={() => setIsVersionHistoryOpen(true)}
                >
                  View history
                  <span aria-hidden="true">&rarr;</span>
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {submitError ? (
            <p role="alert" className="text-destructive text-sm">
              {submitError}
            </p>
          ) : null}

          <div className="grid gap-2">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Saving…' : 'Save Draft'}
            </Button>

            {entry ? (
              <span
                title={
                  !canPublish ? 'You do not have permission to publish.' : ''
                }
              >
                <Button
                  className="w-full"
                  type="button"
                  variant="outline"
                  disabled={
                    !canPublish ||
                    publishMutation.isPending ||
                    entry.status === 'published'
                  }
                  onClick={() => publishMutation.mutate()}
                >
                  {publishMutation.isPending
                    ? 'Publishing…'
                    : entry.status === 'published'
                      ? 'Published'
                      : 'Publish'}
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
                  className="w-full"
                  type="button"
                  variant="danger"
                  disabled={!canDelete || deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate()}
                >
                  {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
                </Button>
              </span>
            ) : null}
          </div>
        </div>
      </form>

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
