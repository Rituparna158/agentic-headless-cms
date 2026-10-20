import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  History,
  RotateCcw,
  Clock,
  User,
  CheckCircle2,
  Loader2,
  AlertCircle,
  FileDiff,
  ChevronRight,
} from 'lucide-react';
import { collectionsApi } from '../../api/collections.api';
import {
  VersionHistoryDrawerProps,
  ContentVersionRecord,
} from '../../types/template.types';
import { useToast } from '@repo/shared-ui';
import { browserLogger } from '@repo/logger/browser';
import { SnapshotDetailDeck } from './SnapshotDetailDeck';

export const VersionHistoryDrawer: React.FC<VersionHistoryDrawerProps> = ({
  isOpen,
  onClose,
  schemaSlug,
  pageId,
  currentVersionNo,
  currentPageData,
  onRevertSuccess,
}) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [selectedVersion, setSelectedVersion] =
    useState<ContentVersionRecord | null>(null);
  const [inspectSnapshot, setInspectSnapshot] =
    useState<ContentVersionRecord | null>(null);

  const {
    data: versions = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['page-versions', schemaSlug, pageId],
    queryFn: () => collectionsApi.getVersions(schemaSlug, pageId),
    enabled: isOpen && !!schemaSlug && !!pageId,
  });

  const revertMutation = useMutation({
    mutationFn: (versionNo: number) =>
      collectionsApi.revertVersion(schemaSlug, pageId, versionNo),
    onSuccess: (revertedPage, versionNo) => {
      queryClient.invalidateQueries({
        queryKey: ['page', schemaSlug, pageId],
      });
      queryClient.invalidateQueries({
        queryKey: ['page-versions', schemaSlug, pageId],
      });
      toast.success(`Successfully restored snapshot v${versionNo}!`);
      if (revertedPage?.data) {
        onRevertSuccess(revertedPage.data);
      }
      setSelectedVersion(null);
      setInspectSnapshot(null);
      onClose();
    },
    onError: (err) => {
      browserLogger.error('Revert failed:', err);
      toast.error('Failed to restore version snapshot. Please try again.');
    },
  });

  if (!isOpen) return null;

  const formatDate = (dateStr: string) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  const getPreviousSnapshot = (currentSnap: ContentVersionRecord | null) => {
    if (!currentSnap) return null;
    return versions.find((v) => v.versionNo < currentSnap.versionNo) || null;
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fade-in">
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div className="w-screen max-w-md bg-[#141417] border-l border-zinc-800 text-zinc-100 shadow-2xl flex flex-col animate-slide-in-right">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 bg-zinc-900/60">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <History className="size-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-100 text-base">
                    Version History
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Automated snapshots stored in the database
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Versions List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-400">
                  <Loader2 className="size-6 animate-spin text-indigo-400" />
                  <p className="text-sm">Loading snapshots...</p>
                </div>
              )}

              {isError && (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-rose-400 bg-rose-500/10 p-4 rounded-xl border border-rose-500/20">
                  <AlertCircle className="size-6 shrink-0" />
                  <p className="text-sm font-medium">
                    Failed to load snapshots
                  </p>
                  <button
                    onClick={() => refetch()}
                    className="rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/30"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!isLoading && !isError && versions.length === 0 && (
                <div className="text-center py-16 text-zinc-400 text-sm">
                  No previous snapshots available for this page yet.
                </div>
              )}

              {!isLoading &&
                !isError &&
                versions.map((version) => {
                  const isSelected = selectedVersion?.id === version.id;
                  const isCurrent =
                    currentVersionNo !== undefined &&
                    currentVersionNo === version.versionNo;

                  return (
                    <div
                      key={version.id}
                      onClick={() => setSelectedVersion(version)}
                      className={`relative p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500/10'
                          : 'border-zinc-800/80 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">
                            v{version.versionNo}
                          </span>
                          {isCurrent && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <CheckCircle2 className="size-2.5" />
                              Current
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-zinc-400 flex items-center gap-1">
                          <Clock className="size-3 text-zinc-500" />
                          {formatDate(version.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-300 mb-2 font-medium">
                        {version.comment || 'Page updated'}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60 mt-2">
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                          <User className="size-3 text-zinc-500" />
                          <span>{version.createdByUserId || 'Admin'}</span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVersion(version);
                            setInspectSnapshot(version);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          <FileDiff className="size-3" />
                          <span>Inspect Diff</span>
                          <ChevronRight className="size-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Footer with Quick Restore Action */}
            <div className="border-t border-zinc-800 bg-zinc-900/60 p-4 flex items-center justify-between">
              <div className="text-xs text-zinc-400">
                {selectedVersion
                  ? `Selected: Snapshot v${selectedVersion.versionNo}`
                  : 'Select a version to inspect/restore'}
              </div>
              <div className="flex items-center gap-2">
                {selectedVersion && (
                  <button
                    type="button"
                    onClick={() => setInspectSnapshot(selectedVersion)}
                    className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
                  >
                    <FileDiff className="size-3.5" />
                    <span>Diff</span>
                  </button>
                )}
                <button
                  type="button"
                  disabled={
                    !selectedVersion ||
                    revertMutation.isPending ||
                    (currentVersionNo !== undefined &&
                      currentVersionNo === selectedVersion.versionNo)
                  }
                  onClick={() => {
                    if (selectedVersion) {
                      revertMutation.mutate(selectedVersion.versionNo);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {revertMutation.isPending ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Restoring...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="size-3.5" />
                      <span>Restore Snapshot</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nested Slide-Over Deck for Snapshot Details & Change Diff */}
      <SnapshotDetailDeck
        isOpen={!!inspectSnapshot}
        onClose={() => setInspectSnapshot(null)}
        snapshot={inspectSnapshot}
        previousSnapshot={getPreviousSnapshot(inspectSnapshot)}
        currentPageData={currentPageData}
        isCurrentVersion={
          currentVersionNo !== undefined &&
          inspectSnapshot !== null &&
          currentVersionNo === inspectSnapshot.versionNo
        }
        onRevert={(vNo) => revertMutation.mutate(vNo)}
        isReverting={revertMutation.isPending}
      />
    </>
  );
};
