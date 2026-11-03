import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  Clock,
  Globe,
  Shield,
  FileCode,
  GitCompare,
  Terminal,
} from 'lucide-react';
import type {
  AuditDetailDrawerProps,
  DrawerTabType,
  DiffViewMode,
} from '../types/audit.types';
import { CLIPBOARD_COPY_TIMEOUT_MS } from '../constants/audit.constants';
import {
  generateHumanReadableSummary,
  computeStateDiff,
} from '../utils/audit-formatters';

export const AuditDetailDrawer: React.FC<AuditDetailDrawerProps> = ({
  log,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<DrawerTabType>('diff');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [diffViewMode, setDiffViewMode] =
    useState<DiffViewMode>('changes-only');

  if (!isOpen || !log) return null;

  const summary = generateHumanReadableSummary(log);
  const diffs = computeStateDiff(log.beforeState, log.afterState);
  const context = (
    log.context && typeof log.context === 'object' ? log.context : {}
  ) as Record<string, unknown>;

  const ipAddress =
    (typeof context.ip === 'string' ? context.ip : undefined) ||
    (typeof context.ipAddress === 'string' ? context.ipAddress : undefined) ||
    '127.0.0.1 (Internal)';

  const userAgent =
    typeof context.userAgent === 'string'
      ? context.userAgent
      : 'Direct API Call / Agent Runtime';

  const copyText = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), CLIPBOARD_COPY_TIMEOUT_MS);
  };

  const downloadJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(log, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `audit-event-${log.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-4xl xl:max-w-5xl bg-card border-l border-border h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border/60 bg-muted/20">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${summary.actionBadgeColor}`}
              >
                <span className="size-1.5 rounded-full bg-current opacity-70" />
                {summary.actionDisplayName}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                ID: {log.id.slice(0, 8)}...
              </span>
              <button
                type="button"
                onClick={() => copyText(log.id, 'id')}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                title="Copy Full Event ID"
              >
                {copiedKey === 'id' ? (
                  <Check className="size-3.5 text-emerald-500" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </button>
            </div>
            <h3 className="text-base font-semibold text-foreground tracking-tight">
              {summary.headline}
            </h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Clock className="size-3 text-muted-foreground/70" />
              <span>
                {summary.formattedDate} ({summary.timeAgo})
              </span>
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={downloadJson}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              title="Download JSON record"
            >
              <Download className="size-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              title="Close drawer"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-5 border-b border-border/40 bg-muted/10 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('diff')}
            className={`flex items-center gap-1.5 py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'diff'
                ? 'border-primary text-foreground font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <GitCompare className="size-3.5 text-blue-500" />
            <span>State Diff ({diffs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tech')}
            className={`flex items-center gap-1.5 py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'tech'
                ? 'border-primary text-foreground font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Terminal className="size-3.5 text-purple-500" />
            <span>Technical Context</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('raw')}
            className={`flex items-center gap-1.5 py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'raw'
                ? 'border-primary text-foreground font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileCode className="size-3.5 text-emerald-500" />
            <span>Raw JSON</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 2: State Diff (Tech) */}
          {activeTab === 'diff' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Showing {diffs.length} field mutation
                  {diffs.length === 1 ? '' : 's'}.
                </div>
                <div className="flex items-center gap-1 p-0.5 rounded-lg border border-border bg-muted/40 text-xs">
                  <button
                    type="button"
                    onClick={() => setDiffViewMode('changes-only')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      diffViewMode === 'changes-only'
                        ? 'bg-card text-foreground font-medium shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Changes Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiffViewMode('full')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      diffViewMode === 'full'
                        ? 'bg-card text-foreground font-medium shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Side-by-Side Full
                  </button>
                </div>
              </div>

              {diffs.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-border/60 bg-muted/10 text-muted-foreground text-xs">
                  No state mutation was captured for this event (e.g. read,
                  view, or simple signal).
                </div>
              ) : diffViewMode === 'changes-only' ? (
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs text-zinc-300 space-y-3 overflow-x-auto">
                  {diffs.map((d) => (
                    <div
                      key={d.path}
                      className="pb-3 border-b border-zinc-800/80 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-zinc-100">
                          {d.path}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            d.changeType === 'added'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : d.changeType === 'removed'
                                ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {d.changeType}
                        </span>
                      </div>

                      {d.changeType === 'modified' && (
                        <div className="space-y-1">
                          <div className="text-rose-400 bg-rose-950/40 p-1.5 rounded border border-rose-900/40 break-all">
                            - {JSON.stringify(d.beforeValue, null, 2)}
                          </div>
                          <div className="text-emerald-400 bg-emerald-950/40 p-1.5 rounded border border-emerald-900/40 break-all">
                            + {JSON.stringify(d.afterValue, null, 2)}
                          </div>
                        </div>
                      )}

                      {d.changeType === 'added' && (
                        <div className="text-emerald-400 bg-emerald-950/40 p-1.5 rounded border border-emerald-900/40 break-all">
                          + {JSON.stringify(d.afterValue, null, 2)}
                        </div>
                      )}

                      {d.changeType === 'removed' && (
                        <div className="text-rose-400 bg-rose-950/40 p-1.5 rounded border border-rose-900/40 break-all">
                          - {JSON.stringify(d.beforeValue, null, 2)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs">
                    <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider block pb-2 border-b border-zinc-800">
                      Before State
                    </span>
                    <pre className="text-zinc-300 mt-2 whitespace-pre-wrap overflow-x-auto text-[11px]">
                      {JSON.stringify(log.beforeState || {}, null, 2)}
                    </pre>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs">
                    <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block pb-2 border-b border-zinc-800">
                      After State
                    </span>
                    <pre className="text-zinc-300 mt-2 whitespace-pre-wrap overflow-x-auto text-[11px]">
                      {JSON.stringify(log.afterState || {}, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Technical Context */}
          {activeTab === 'tech' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Identities & Coordinates
                </span>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between p-2 rounded-md bg-card border border-border/40">
                    <span className="text-muted-foreground">Event UUID:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-foreground">{log.id}</span>
                      <button
                        type="button"
                        onClick={() => copyText(log.id, 'tech_event_id')}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {copiedKey === 'tech_event_id' ? (
                          <Check className="size-3 text-emerald-500" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-md bg-card border border-border/40">
                    <span className="text-muted-foreground">Resource ID:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-foreground">{log.resourceId}</span>
                      <button
                        type="button"
                        onClick={() =>
                          copyText(log.resourceId, 'tech_resource_id')
                        }
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {copiedKey === 'tech_resource_id' ? (
                          <Check className="size-3 text-emerald-500" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {log.actorUserId && (
                    <div className="flex items-center justify-between p-2 rounded-md bg-card border border-border/40">
                      <span className="text-muted-foreground">
                        Actor User UUID:
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-foreground">
                          {log.actorUserId}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            copyText(log.actorUserId!, 'tech_user_id')
                          }
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {copiedKey === 'tech_user_id' ? (
                            <Check className="size-3 text-emerald-500" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {log.actorAgentId && (
                    <div className="flex items-center justify-between p-2 rounded-md bg-card border border-border/40">
                      <span className="text-muted-foreground">Agent UUID:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-foreground">
                          {log.actorAgentId}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            copyText(log.actorAgentId!, 'tech_agent_id')
                          }
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {copiedKey === 'tech_agent_id' ? (
                            <Check className="size-3 text-emerald-500" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-2 rounded-md bg-card border border-border/40">
                    <span className="text-muted-foreground">
                      Application ID:
                    </span>
                    <span className="text-foreground">{log.applicationId}</span>
                  </div>
                </div>
              </div>

              {/* Network & Client Info */}
              <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Network & Client Environment
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="size-4 text-blue-500 shrink-0" />
                    <span>
                      IP Address:{' '}
                      <strong className="text-foreground font-mono">
                        {ipAddress}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Shield className="size-4 text-emerald-500 shrink-0" />
                    <span>
                      Actor Type:{' '}
                      <strong className="text-foreground capitalize">
                        {log.actorType}
                      </strong>
                    </span>
                  </div>
                </div>
                {userAgent && (
                  <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground break-all">
                    <span className="font-semibold text-foreground/80">
                      User Agent:
                    </span>{' '}
                    {userAgent}
                  </div>
                )}
              </div>

              {/* Raw Context Dump */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <span className="font-semibold text-zinc-300">
                    HTTP & Execution Context
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        JSON.stringify(log.context || {}, null, 2),
                        'context_json',
                      )
                    }
                    className="text-zinc-400 hover:text-zinc-100 flex items-center gap-1 text-[11px]"
                  >
                    {copiedKey === 'context_json' ? (
                      <Check className="size-3 text-emerald-400" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                    <span>Copy</span>
                  </button>
                </div>
                <pre className="text-zinc-300 mt-2 text-[11px] whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(log.context || {}, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: Raw JSON */}
          {activeTab === 'raw' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-mono">
                  Payload size: ~
                  {(JSON.stringify(log).length / 1024).toFixed(2)} KB
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyText(JSON.stringify(log, null, 2), 'full_raw_json')
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 bg-muted/40 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                >
                  {copiedKey === 'full_raw_json' ? (
                    <Check className="size-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  <span>
                    {copiedKey === 'full_raw_json'
                      ? 'Copied to Clipboard'
                      : 'Copy Full JSON'}
                  </span>
                </button>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs text-zinc-300 overflow-x-auto">
                <pre className="text-[11px] leading-relaxed whitespace-pre-wrap">
                  {JSON.stringify(log, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/60 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <span>Click anywhere outside or press Esc to close</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
