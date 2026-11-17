'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { diffWordsWithSpace } from 'diff';
import { useState } from 'react';
import { X, History } from 'lucide-react';
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
      <div className="whitespace-pre-wrap font-mono text-xs sm:text-sm border rounded-lg p-3 bg-muted/10 leading-relaxed">
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

    const hasStatusChange =
      selectedVersion &&
      previousVersion &&
      selectedVersion.status !== previousVersion.status;

    return (
      <div className="flex flex-col h-full min-h-0 divide-y divide-border overflow-hidden">
        {/* Revision Timeline Strip */}
        <div className="p-3.5 sm:p-4 bg-muted/20 shrink-0 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Revisions ({versions.length})
            </span>
            <span>Select a version to compare</span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
            {versions.map((version, idx) => {
              const isSelected = selectedVersion?.id === version.id;
              const isLatest = idx === 0;
              return (
                <button
                  key={version.id}
                  type="button"
                  onClick={() => setSelectedVersionId(version.id)}
                  className={`min-w-[130px] p-2.5 rounded-lg border text-left transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-primary/10 border-primary text-foreground ring-1 ring-primary/40 shadow-xs'
                      : 'bg-card border-border hover:bg-muted/70 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="text-sm font-semibold text-foreground">
                      v{version.versionNo}
                    </div>
                    {isLatest && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                        Latest
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1 truncate">
                    {new Intl.DateTimeFormat('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    }).format(new Date(version.createdAt))}
                  </div>
                  <div className="text-[10px] mt-0.5 capitalize text-muted-foreground/80 flex items-center gap-1">
                    <span>By {version.actorType}</span>
                    <span>&bull;</span>
                    <span
                      className={
                        version.status === 'published'
                          ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                          : ''
                      }
                    >
                      {version.status}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Diff Inspection Canvas */}
        <div className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <h3 className="font-semibold text-sm text-foreground">
              Diff:{' '}
              {previousVersion ? `v${previousVersion.versionNo}` : 'Initial'}{' '}
              &rarr; v{selectedVersion?.versionNo}
            </h3>
            <span className="text-[11px] text-muted-foreground">
              Comparing against{' '}
              {previousVersion ? `v${previousVersion.versionNo}` : 'initial'}
            </span>
          </div>

          <div className="space-y-4">
            {/* Status change banner if status changed */}
            {hasStatusChange && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold uppercase tracking-wider text-[11px] text-muted-foreground">
                    Lifecycle Status Change
                  </span>
                  {selectedVersion?.comment && (
                    <span className="text-muted-foreground font-mono text-[11px]">
                      {selectedVersion.comment}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs font-medium pt-0.5">
                  <span className="capitalize px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {previousVersion?.status}
                  </span>
                  <span className="text-muted-foreground">&rarr;</span>
                  <span
                    className={`capitalize px-1.5 py-0.5 rounded font-semibold ${
                      selectedVersion?.status === 'published'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {selectedVersion?.status}
                  </span>
                </div>
              </div>
            )}

            {/* Field level diffs */}
            {Object.keys(currentEntry.data).map((key) => {
              const isMedia = fieldMap.get(key) === 'media';
              const currentVal = formatFieldValue(selectedVersion?.data?.[key]);
              const oldVal = formatFieldValue(previousVersion?.data?.[key]);

              if (currentVal === oldVal) return null;

              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {key}
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {fieldMap.get(key) || 'field'}
                    </span>
                  </div>
                  {isMedia ? (
                    <MediaVersionDiff oldId={oldVal} newId={currentVal} />
                  ) : (
                    renderDiff(oldVal, currentVal)
                  )}
                </div>
              );
            })}

            {/* No field changes detected */}
            {Object.keys(currentEntry.data).every((key) => {
              const currentVal = formatFieldValue(selectedVersion?.data?.[key]);
              const oldVal = formatFieldValue(previousVersion?.data?.[key]);
              return currentVal === oldVal;
            }) && (
              <div className="rounded-lg border border-dashed border-border p-5 text-center space-y-1">
                <p className="text-sm text-muted-foreground italic">
                  No changes in this version.
                </p>
                {selectedVersion?.comment ? (
                  <p className="text-xs text-muted-foreground/80 font-mono">
                    Action: {selectedVersion.comment}
                  </p>
                ) : hasStatusChange ? (
                  <p className="text-xs text-muted-foreground/80">
                    This revision recorded an entry status transition.
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="p-4 border-t border-border bg-background/95 backdrop-blur-xs flex items-center justify-between shrink-0">
          <div className="text-xs text-muted-foreground">
            {selectedVersion && (
              <span>Inspect or rollback to this revision</span>
            )}
          </div>
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
    );
  };

  return (
    <Drawer
      isOpen={open}
      onClose={() => onOpenChange(false)}
      position="right"
      size="min(540px, 100vw)"
      className="w-full max-w-[100vw] sm:max-w-[540px]"
    >
      <div className="w-full h-full flex flex-col bg-background">
        <div className="p-4 sm:p-5 border-b border-border flex items-start justify-between shrink-0 bg-muted/10">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
              <History className="size-4.5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Version History
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Inspect prior revisions and restore past entry states.
              </p>
            </div>
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
        <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
          {renderContent()}
        </div>
      </div>
    </Drawer>
  );
}
