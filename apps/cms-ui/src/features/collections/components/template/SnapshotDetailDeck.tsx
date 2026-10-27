import React, { useState, useMemo } from 'react';
import {
  X,
  RotateCcw,
  Clock,
  User,
  Copy,
  Check,
  Code2,
  FileDiff,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import {
  SnapshotDetailDeckProps,
  SnapshotDiffEntry,
} from '../../types/template.types';
import type { PageCustomSchema } from '@/types/content.types';

export const SnapshotDetailDeck: React.FC<SnapshotDetailDeckProps> = ({
  isOpen,
  onClose,
  snapshot,
  previousSnapshot,
  currentPageData,
  isCurrentVersion,
  onRevert,
  isReverting,
}) => {
  const [activeTab, setActiveTab] = useState<'diff' | 'raw'>('diff');
  const [compareTarget, setCompareTarget] = useState<'current' | 'previous'>(
    'current',
  );
  const [copied, setCopied] = useState(false);

  // Compute structured diff entries
  const diffEntries = useMemo((): SnapshotDiffEntry[] => {
    if (!snapshot) return [];

    const baselineData =
      compareTarget === 'current' ? currentPageData : previousSnapshot?.data;

    const snapData = (snapshot.data || {}) as Record<string, unknown>;
    const base = (baselineData || {}) as Record<string, unknown>;

    const entries: SnapshotDiffEntry[] = [];

    // Title diff
    const baseTitle = typeof base.title === 'string' ? base.title : '';
    const snapTitle = typeof snapData.title === 'string' ? snapData.title : '';
    if (baseTitle !== snapTitle) {
      entries.push({
        field: 'Title',
        changeType: !baseTitle ? 'added' : !snapTitle ? 'removed' : 'modified',
        previousValue: baseTitle || '(Empty)',
        currentValue: snapTitle || '(Empty)',
      });
    }

    // Slug diff
    const baseSlug = typeof base.slug === 'string' ? base.slug : '';
    const snapSlug = typeof snapData.slug === 'string' ? snapData.slug : '';
    if (baseSlug !== snapSlug) {
      entries.push({
        field: 'Slug',
        changeType: !baseSlug ? 'added' : !snapSlug ? 'removed' : 'modified',
        previousValue: baseSlug || '(Empty)',
        currentValue: snapSlug || '(Empty)',
      });
    }

    // Body / Components structure diff summary
    const countComponents = (body: unknown): number => {
      if (!body) return 0;
      if (Array.isArray(body)) return body.length;
      const bObj = body as Record<string, unknown>;
      if (Array.isArray(bObj.components)) return bObj.components.length;
      const pages = bObj.pages as
        | Array<{ component?: { components?: unknown[] } }>
        | undefined;
      return pages?.[0]?.component?.components?.length ?? 0;
    };

    const baseCount = countComponents(base.body);
    const snapCount = countComponents(snapData.body);

    if (baseCount !== snapCount) {
      entries.push({
        field: 'Canvas Components Count',
        changeType: 'modified',
        previousValue: `${baseCount} elements`,
        currentValue: `${snapCount} elements`,
      });
    }

    // Page Schemas & Embedded Entity changes diff (_schemas: PageCustomSchema[])
    // Each page in a collection has its own schemas and entities
    const baseSchemas = (
      Array.isArray(base._schemas) ? base._schemas : []
    ) as PageCustomSchema[];
    const snapSchemas = (
      Array.isArray(snapData._schemas) ? snapData._schemas : []
    ) as PageCustomSchema[];

    const allSchemaKeys = Array.from(
      new Set([
        ...baseSchemas.map((s) => s.slug || s.name || s.id),
        ...snapSchemas.map((s) => s.slug || s.name || s.id),
      ]),
    );

    for (const sKey of allSchemaKeys) {
      const bSchema = baseSchemas.find(
        (s) =>
          (s.slug && s.slug === sKey) ||
          (s.name && s.name === sKey) ||
          s.id === sKey,
      );
      const sSchema = snapSchemas.find(
        (s) =>
          (s.slug && s.slug === sKey) ||
          (s.name && s.name === sKey) ||
          s.id === sKey,
      );
      const schemaName = sSchema?.name || bSchema?.name || sKey;

      if (!bSchema && sSchema) {
        entries.push({
          field: `Page Schema: ${schemaName}`,
          changeType: 'added',
          previousValue: '(None)',
          currentValue: `Added page schema (${sSchema.entryType || 'single'}) with ${sSchema.fields?.length || 0} fields`,
        });
      } else if (bSchema && !sSchema) {
        entries.push({
          field: `Page Schema: ${schemaName}`,
          changeType: 'removed',
          previousValue: `Removed page schema (${bSchema.entryType || 'single'})`,
          currentValue: '(None)',
        });
      } else if (bSchema && sSchema) {
        // Compare schema field definitions
        const bFieldIds = (bSchema.fields || []).map(
          (f) => `${f.displayName || f.apiId} (${f.dataType || 'text'})`,
        );
        const sFieldIds = (sSchema.fields || []).map(
          (f) => `${f.displayName || f.apiId} (${f.dataType || 'text'})`,
        );
        if (JSON.stringify(bFieldIds) !== JSON.stringify(sFieldIds)) {
          entries.push({
            field: `[${schemaName} Schema] Field Definitions`,
            changeType: 'modified',
            previousValue: bFieldIds.join(', ') || '(Empty)',
            currentValue: sFieldIds.join(', ') || '(Empty)',
          });
        }

        const isMulti =
          sSchema.entryType === 'multi' || bSchema.entryType === 'multi';

        if (!isMulti) {
          // Compare single entity values for this page schema
          const bVal =
            (bSchema.values && typeof bSchema.values === 'object'
              ? bSchema.values
              : Array.isArray(bSchema.items) && bSchema.items[0]
                ? bSchema.items[0]
                : {}) || {};
          const sVal =
            (sSchema.values && typeof sSchema.values === 'object'
              ? sSchema.values
              : Array.isArray(sSchema.items) && sSchema.items[0]
                ? sSchema.items[0]
                : {}) || {};

          const allValKeys = Array.from(
            new Set([...Object.keys(bVal), ...Object.keys(sVal)]),
          );

          for (const vKey of allValKeys) {
            const bFieldVal = bVal[vKey];
            const sFieldVal = sVal[vKey];
            if (JSON.stringify(bFieldVal) !== JSON.stringify(sFieldVal)) {
              entries.push({
                field: `[${schemaName} Schema (Entity)] ${vKey}`,
                changeType:
                  bFieldVal === undefined
                    ? 'added'
                    : sFieldVal === undefined
                      ? 'removed'
                      : 'modified',
                previousValue:
                  bFieldVal === undefined
                    ? '(None)'
                    : typeof bFieldVal === 'object'
                      ? JSON.stringify(bFieldVal, null, 2)
                      : String(bFieldVal),
                currentValue:
                  sFieldVal === undefined
                    ? '(None)'
                    : typeof sFieldVal === 'object'
                      ? JSON.stringify(sFieldVal, null, 2)
                      : String(sFieldVal),
              });
            }
          }
        } else {
          // Compare multi-entry items (multiple entities for this page schema)
          const bItems = Array.isArray(bSchema.items)
            ? bSchema.items
            : bSchema.values && Object.keys(bSchema.values).length > 0
              ? [bSchema.values]
              : [];
          const sItems = Array.isArray(sSchema.items)
            ? sSchema.items
            : sSchema.values && Object.keys(sSchema.values).length > 0
              ? [sSchema.values]
              : [];

          if (bItems.length !== sItems.length) {
            entries.push({
              field: `[${schemaName} Schema] Total Entities`,
              changeType: 'modified',
              previousValue: `${bItems.length} entities`,
              currentValue: `${sItems.length} entities`,
            });
          }

          const maxLen = Math.max(bItems.length, sItems.length);
          for (let i = 0; i < maxLen; i++) {
            const bItem = bItems[i] || {};
            const sItem = sItems[i] || {};
            if (JSON.stringify(bItem) !== JSON.stringify(sItem)) {
              const itemLabel =
                (sItem.title as string) ||
                (sItem.name as string) ||
                (sItem.productName as string) ||
                (bItem.title as string) ||
                (bItem.name as string) ||
                (bItem.productName as string) ||
                `Entity #${i + 1}`;
              const allItemKeys = Array.from(
                new Set([...Object.keys(bItem), ...Object.keys(sItem)]),
              );
              for (const ik of allItemKeys) {
                const biVal = bItem[ik];
                const siVal = sItem[ik];
                if (JSON.stringify(biVal) !== JSON.stringify(siVal)) {
                  entries.push({
                    field: `[${schemaName} Schema > ${itemLabel}] ${ik}`,
                    changeType:
                      biVal === undefined
                        ? 'added'
                        : siVal === undefined
                          ? 'removed'
                          : 'modified',
                    previousValue:
                      biVal === undefined
                        ? '(None)'
                        : typeof biVal === 'object'
                          ? JSON.stringify(biVal, null, 2)
                          : String(biVal),
                    currentValue:
                      siVal === undefined
                        ? '(None)'
                        : typeof siVal === 'object'
                          ? JSON.stringify(siVal, null, 2)
                          : String(siVal),
                  });
                }
              }
            }
          }
        }
      }
    }

    // Direct page custom fields (e.g. description, seoTitle)
    const allKeys = Array.from(
      new Set([...Object.keys(base), ...Object.keys(snapData)]),
    ).filter((k) => !['title', 'slug', 'body', '_schemas'].includes(k));

    for (const key of allKeys) {
      const bVal = (base as Record<string, unknown>)[key];
      const sVal = (snapData as Record<string, unknown>)[key];
      if (JSON.stringify(bVal) !== JSON.stringify(sVal)) {
        entries.push({
          field: `Page Field: ${key}`,
          changeType:
            bVal === undefined
              ? 'added'
              : sVal === undefined
                ? 'removed'
                : 'modified',
          previousValue:
            bVal === undefined
              ? '(None)'
              : typeof bVal === 'object'
                ? JSON.stringify(bVal, null, 2)
                : String(bVal),
          currentValue:
            sVal === undefined
              ? '(None)'
              : typeof sVal === 'object'
                ? JSON.stringify(sVal, null, 2)
                : String(sVal),
        });
      }
    }

    return entries;
  }, [snapshot, previousSnapshot, currentPageData, compareTarget]);

  if (!isOpen || !snapshot) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(snapshot.data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-4xl xl:max-w-5xl bg-[#141417] border-l border-zinc-800 text-zinc-100 shadow-2xl flex flex-col animate-slide-in-right">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 bg-zinc-900/60">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                v{snapshot.versionNo}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-zinc-100 text-base">
                    Snapshot Details & Diff
                  </h3>
                  {isCurrentVersion && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <CheckCircle2 className="size-2.5" />
                      Live Canvas
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3 text-zinc-500" />
                    {formatDate(snapshot.createdAt)}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <User className="size-3 text-zinc-500" />
                    {snapshot.createdByUserName ||
                      snapshot.createdByUserId ||
                      'Admin'}
                  </span>
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

          {/* Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-zinc-800 px-6 bg-zinc-900/30">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('diff')}
                className={`inline-flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'diff'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileDiff className="size-3.5" />
                <span>Changes Diff</span>
                {diffEntries.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 text-zinc-300">
                    {diffEntries.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('raw')}
                className={`inline-flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'raw'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Code2 className="size-3.5" />
                <span>Snapshot Payload</span>
              </button>
            </div>

            {activeTab === 'diff' && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <span className="text-[11px]">Compare with:</span>
                <select
                  value={compareTarget}
                  onChange={(e) =>
                    setCompareTarget(e.target.value as 'current' | 'previous')
                  }
                  className="rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-xs text-zinc-200 outline-none focus:border-indigo-500"
                >
                  <option value="current">Current Live Page</option>
                  {previousSnapshot && (
                    <option value="previous">
                      Previous Snapshot (v{previousSnapshot.versionNo})
                    </option>
                  )}
                </select>
              </div>
            )}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {activeTab === 'diff' && (
              <div className="space-y-3">
                {diffEntries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-400">
                    <CheckCircle2 className="size-8 text-emerald-400 mb-2 opacity-80" />
                    <p className="text-sm font-medium text-zinc-300">
                      Identical Content
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      No property or layout differences found compared to{' '}
                      {compareTarget === 'current'
                        ? 'the current live page'
                        : `snapshot v${previousSnapshot?.versionNo}`}
                      .
                    </p>
                  </div>
                ) : (
                  diffEntries.map((entry, idx) => {
                    const badgeStyles =
                      entry.changeType === 'added'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : entry.changeType === 'removed'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20';

                    return (
                      <div
                        key={idx}
                        className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-zinc-200">
                            {entry.field}
                          </span>
                          <span
                            className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${badgeStyles}`}
                          >
                            {entry.changeType}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                          <div className="rounded-lg bg-zinc-950/60 p-2.5 border border-zinc-800/80">
                            <span className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                              {compareTarget === 'current'
                                ? 'Live Current Value'
                                : `Snapshot v${previousSnapshot?.versionNo}`}
                            </span>
                            <span className="font-mono text-zinc-400 break-words">
                              {String(entry.previousValue)}
                            </span>
                          </div>
                          <div className="rounded-lg bg-zinc-950/60 p-2.5 border border-indigo-950/40">
                            <span className="block text-[10px] font-semibold text-indigo-400 uppercase tracking-wider mb-1">
                              Snapshot v{snapshot.versionNo} Value
                            </span>
                            <span className="font-mono text-zinc-200 break-words">
                              {String(entry.currentValue)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'raw' && (
              <div className="relative">
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-md bg-zinc-800/90 hover:bg-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-200 transition-colors border border-zinc-700 shadow"
                >
                  {copied ? (
                    <>
                      <Check className="size-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
                <pre className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 text-xs font-mono text-zinc-300 overflow-x-auto max-h-[560px]">
                  {JSON.stringify(snapshot.data, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-zinc-800 bg-zinc-900/60 p-4 flex items-center justify-between">
            <div className="text-xs text-zinc-400">
              Snapshot recorded on {formatDate(snapshot.createdAt)}
            </div>
            <button
              type="button"
              disabled={isReverting || isCurrentVersion}
              onClick={() => onRevert(snapshot.versionNo)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isReverting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Restoring...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="size-3.5" />
                  <span>Restore This Snapshot</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
