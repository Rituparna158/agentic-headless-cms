'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { diffWordsWithSpace } from 'diff';
import { useState } from 'react';
import { X } from 'lucide-react';
import { Button, Drawer } from '@repo/shared-ui';
import { listContentVersions, revertContentEntry } from '@/lib/api/content';
import type { VersionHistoryDrawerProps } from '@/types/component.types';
import { formatFieldValue } from '@/utils/lexical';
import { MediaVersionDiff } from './media-version-diff';

export function VersionHistoryDrawer({
  schemaSlug,
  entryId,
  open,
  onOpenChange,
  currentEntry,
  schema,
}: VersionHistoryDrawerProps) {
  const queryClient = useQueryClient();
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null,
  );

  const {
    data: versions,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['content', schemaSlug, 'entry', entryId, 'versions'],
    queryFn: () => listContentVersions(schemaSlug, entryId),
    enabled: open,
  });

  const revertMutation = useMutation({
    mutationFn: (versionNo: number) =>
      revertContentEntry(schemaSlug, entryId, versionNo),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['content', schemaSlug, 'entry', entryId],
      });
      queryClient.invalidateQueries({ queryKey: ['content', schemaSlug] });
      onOpenChange(false);
    },
  });

  const foundIndex = versions?.findIndex((v) => v.id === selectedVersionId);
  const selectedVersionIndex =
    foundIndex !== undefined && foundIndex !== -1 ? foundIndex : 0;
  const selectedVersion = versions?.[selectedVersionIndex] || versions?.[0];
  const previousVersion =
    versions && selectedVersionIndex + 1 < versions.length
      ? versions[selectedVersionIndex + 1]
      : null;

  const fieldMap = React.useMemo(() => {
    const map = new Map<string, string>();
    schema?.definition.fields.forEach((f) => map.set(f.apiId, f.dataType));
    return map;
  }, [schema]);

  const renderDiff = (oldText: string, newText: string) => {
    const changes = diffWordsWithSpace(oldText, newText);
    return (
      <div className="whitespace-pre-wrap font-mono text-sm border p-4 rounded-md">
        {changes.map((part, i) => {
          if (part.added)
            return (
              <span
                key={i}
                className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-medium px-0.5 rounded"
              >
                {part.value}
              </span>
            );
          if (part.removed)
            return (
              <span
                key={i}
                className="bg-rose-500/20 text-rose-700 dark:text-rose-400 line-through px-0.5 rounded"
              >
                {part.value}
              </span>
            );
          return (
            <span key={i} className="text-muted-foreground">
              {part.value}
            </span>
          );
        })}
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading)
      return (
        <p className="text-muted-foreground p-8 text-center">
          Loading version history...
        </p>
      );
    if (isError)
      return (
        <p className="text-destructive p-8 text-center">
          Failed to load versions.
        </p>
      );
    if (!versions || versions.length === 0)
      return (
        <p className="text-muted-foreground p-8 text-center">
          No previous versions available.
        </p>
      );

    return (
      <div className="flex flex-col md:flex-row h-full min-h-0 divide-y md:divide-y-0 md:divide-x overflow-y-auto md:overflow-hidden">
        <div className="w-full md:w-64 lg:w-72 shrink-0 max-h-48 md:max-h-none overflow-y-auto p-4 space-y-4">
          <h3 className="font-semibold text-sm">Versions</h3>
          <div className="space-y-2">
            {versions.map((version) => (
              <div
                key={version.id}
                className={`p-3 border rounded-md cursor-pointer transition-colors ${selectedVersion?.id === version.id ? 'bg-muted border-primary' : 'hover:bg-muted/50'}`}
                onClick={() => setSelectedVersionId(version.id)}
              >
                <div className="text-sm font-medium">v{version.versionNo}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(version.createdAt).toLocaleString()}
                </div>
                <div className="text-xs mt-1 capitalize text-muted-foreground">
                  By {version.actorType}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 min-w-0 md:overflow-y-auto p-4 sm:p-6 flex flex-col gap-4">
          <h3 className="font-semibold text-sm">
            Diff:{' '}
            {previousVersion ? `v${previousVersion.versionNo}` : 'Initial'}{' '}
            &rarr; v{selectedVersion?.versionNo}
          </h3>

          <div className="space-y-4">
            {Object.keys(currentEntry.data).map((key) => {
              const isMedia = fieldMap.get(key) === 'media';
              const currentVal = formatFieldValue(selectedVersion?.data?.[key]);
              const oldVal = formatFieldValue(previousVersion?.data?.[key]);

              if (currentVal === oldVal) return null;

              return (
                <div key={key} className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                    {key}
                  </h4>
                  {isMedia ? (
                    <MediaVersionDiff oldId={oldVal} newId={currentVal} />
                  ) : (
                    renderDiff(oldVal, currentVal)
                  )}
                </div>
              );
            })}

            {Object.keys(currentEntry.data).every((key) => {
              const currentVal = formatFieldValue(selectedVersion?.data?.[key]);
              const oldVal = formatFieldValue(previousVersion?.data?.[key]);
              return currentVal === oldVal;
            }) && (
              <p className="text-sm text-muted-foreground italic">
                No changes in this version.
              </p>
            )}
          </div>

          <div className="mt-auto pt-4 border-t flex justify-end">
            <Button
              disabled={revertMutation.isPending || !selectedVersion}
              onClick={() => {
                if (selectedVersion)
                  revertMutation.mutate(selectedVersion.versionNo);
              }}
            >
              {revertMutation.isPending
                ? 'Restoring...'
                : `Restore v${selectedVersion?.versionNo}`}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Drawer
      isOpen={open}
      onClose={() => onOpenChange(false)}
      position="right"
      size="min(960px, 95vw)"
      className="w-full max-w-[95vw] lg:max-w-5xl"
    >
      <div className="w-full h-full flex flex-col p-4 sm:p-6 bg-background">
        <div className="mb-4 sm:mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">Version History</h2>
            <p className="text-sm text-muted-foreground mt-1 sm:mt-2">
              View past versions and revert changes.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            aria-label="Close version history"
            className="rounded-full shrink-0 -mt-1 -mr-1"
          >
            <X className="size-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto md:overflow-hidden min-h-0">
          {renderContent()}
        </div>
      </div>
    </Drawer>
  );
}
