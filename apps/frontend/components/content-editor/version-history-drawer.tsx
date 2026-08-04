'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { diffWordsWithSpace } from 'diff';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { listContentVersions, revertContentEntry } from '@/lib/api/content';
import type { VersionHistoryDrawerProps } from '@/types/component.types';
import { formatFieldValue } from '@/utils/lexical';

export function VersionHistoryDrawer({
  schemaSlug,
  entryId,
  open,
  onOpenChange,
  currentEntry,
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

  const renderDiff = (oldText: string, newText: string) => {
    const changes = diffWordsWithSpace(oldText, newText);
    return (
      <div className="whitespace-pre-wrap font-mono text-sm border p-4 rounded-md">
        {changes.map((part, i) => {
          if (part.added)
            return (
              <span key={i} className="bg-green-200 text-green-900">
                {part.value}
              </span>
            );
          if (part.removed)
            return (
              <span key={i} className="bg-red-200 text-red-900 line-through">
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
      <div className="flex h-full min-h-0 divide-x overflow-hidden">
        <div className="w-1/3 overflow-y-auto p-4 space-y-4">
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
        <div className="w-2/3 overflow-y-auto p-4 flex flex-col gap-4">
          <h3 className="font-semibold text-sm">
            Diff:{' '}
            {previousVersion ? `v${previousVersion.versionNo}` : 'Initial'}{' '}
            &rarr; v{selectedVersion?.versionNo}
          </h3>

          <div className="space-y-4">
            {Object.keys(currentEntry.data).map((key) => {
              const currentVal = formatFieldValue(selectedVersion?.data?.[key]);
              const oldVal = formatFieldValue(previousVersion?.data?.[key]);

              if (currentVal === oldVal) return null;

              return (
                <div key={key} className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                    {key}
                  </h4>
                  {renderDiff(oldVal, currentVal)}
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[80vw] sm:max-w-[80vw] flex flex-col p-0 gap-0"
      >
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Version History</SheetTitle>
          <SheetDescription>
            Compare the current entry with previous versions.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 min-h-0 overflow-hidden">{renderContent()}</div>
      </SheetContent>
    </Sheet>
  );
}
